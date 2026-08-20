"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useReactFlow } from "@xyflow/react";

import {
  beyondFull,
  cameraReducer,
  fitInset,
  fitZoom,
  initialCamera,
  insetSlack,
  maxZoom,
  verticalSlack,
  zoomAtPercent,
  zoomPercent,
  type Box,
  type FrameBox,
  type Geometry,
} from "~/lib/camera";

/**
 * The one thing that moves the map's camera.
 *
 * Every transition is a dispatch and every dispatch is a decision; the single
 * effect at the bottom is the only line in the app that calls `setViewport`.
 * `~/lib/camera` holds the arithmetic and the machine, and explains why the
 * two are apart.
 */

/**
 * Before paint, not after. The zoom readout renders from the same state that
 * decides the shot, so applying the move in a passive effect would show a
 * percentage the map had not reached yet for a frame. The page is prerendered,
 * where React rightly complains about layout effects and there is no camera to
 * move anyway.
 */
const useCameraEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export type MapCamera = {
  /** Where the camera is: the year rail and the pan mode read this. */
  view: { y: number; zoom: number };
  paneWidth: number;
  paneHeight: number;
  /** React Flow's zoom bounds, which are the slider's 0% and 200%. */
  minZoom: number;
  maxZoom: number;
  /** Stable identity across a moving camera — see the memo below. */
  translateExtent: [[number, number], [number, number]];
  /** True once the graph is wider than the stage and has to be panned across. */
  beyondFull: boolean;
  /** What the slider handle and the readout show. */
  percent: number;
  /** The user pressed Fit. */
  fit: () => void;
  /** The user dragged the slider to this percentage. */
  zoomToPercent: (percent: number) => void;
  /** React Flow moved the camera itself: a pan, a pinch, a flick settling. */
  report: (view: { y: number; zoom: number }) => void;
};

export function useMapCamera({
  pane,
  compact,
  railW,
  railGap,
  bottomInset,
  content,
  layoutKey,
  frame,
}: {
  /** The map pane. Every zoom bound is measured against it. */
  pane: React.RefObject<HTMLElement | null>;
  compact: boolean;
  railW: number;
  railGap: number;
  bottomInset: number;
  content: Box;
  /**
   * Changes when the graph is re-laid out — a filter, or first paint. Derived
   * from OUR layout rather than from React Flow's measurements, so the camera
   * doesn't have to wait on `useNodesInitialized`, which never resolves while
   * the pane is hidden and would leave the map on React Flow's default
   * transform.
   */
  layoutKey: string;
  /** Phone only: the selection to keep in the band, or null for none. */
  frame: FrameBox | null;
}): MapCamera {
  const { getViewport, setViewport } = useReactFlow();
  const [state, dispatch] = useReducer(cameraReducer, initialCamera);

  const [paneWidth, setPaneWidth] = useState(1040);
  const [paneHeight, setPaneHeight] = useState(900);
  useEffect(() => {
    const measure = () => {
      const el = pane.current;
      if (!el) return;
      // A hidden pane measures 0×0; taking that as real collapses every zoom
      // bound and strands the camera. Keep the last good numbers instead.
      if (el.clientWidth < 2 || el.clientHeight < 2) return;
      setPaneWidth(el.clientWidth);
      setPaneHeight(el.clientHeight);
    };
    // Measure up front: every zoom bound derives from this, and waiting on the
    // observer's first callback left them computed from the defaults.
    measure();
    const observer = new ResizeObserver(measure);
    if (pane.current) observer.observe(pane.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pane]);

  const geo: Geometry = {
    paneWidth,
    paneHeight,
    railW,
    railGap,
    bottomInset,
    compact,
    content,
  };

  /*
   * The geometry a deferred or imperative transition works from.
   *
   * Kept on a ref rather than closed over, because the layout transition fires
   * from a timeout: the closure it captured was built against the pane's
   * placeholder size and landed AFTER the measured re-open had already
   * corrected it, so the stale shot won purely by arriving last.
   */
  const geoRef = useRef(geo);
  geoRef.current = geo;

  /**
   * Read the pane straight from the DOM, and quietly correct the cached size if
   * it has drifted. A ResizeObserver can miss a change (a hidden pane reports
   * 0×0, and the callback for it coming back doesn't always arrive), and a
   * stale height silently ruins every zoom bound derived from it.
   *
   * Publishing the correction is the point, not a side effect: the readout is
   * computed from this same pane state, so a shot measured behind its back
   * landed the camera at a zoom the track then reported as 121% — correct
   * pixels, a slider that disagreed with them, and no way to drag back to the
   * value you opened on. Measure and publish in one go and they cannot part.
   */
  const measured = useCallback((): Geometry => {
    const el = pane.current;
    const current = geoRef.current;
    if (!el || el.clientWidth < 2 || el.clientHeight < 2) return current;
    if (Math.abs(el.clientWidth - current.paneWidth) > 1) {
      setPaneWidth(el.clientWidth);
    }
    if (Math.abs(el.clientHeight - current.paneHeight) > 1) {
      setPaneHeight(el.clientHeight);
    }
    return {
      ...current,
      paneWidth: el.clientWidth,
      paneHeight: el.clientHeight,
    };
  }, [pane]);

  /* ── The transitions ─────────────────────────────────────────────────── */

  useEffect(() => {
    /* Deferred a tick: React Flow has to have committed the pane it is about
       to be told to move. */
    const id = setTimeout(
      () => dispatch({ type: "layout", key: layoutKey, geo: measured() }),
      0,
    );
    return () => clearTimeout(id);
  }, [layoutKey, measured]);

  /*
   * Declared before the pane transition below, and this order is the one thing
   * here that still turns on order. Which of the two aims the camera when both
   * fire is the reducer's call, not the file's — but letting a title GO has to
   * clear the framing before the shrinking sheet is measured, or the reducer
   * would hold that measurement back for a framing that no longer exists.
   */
  const zoom = state.view.zoom;
  useEffect(() => {
    if (!frame) {
      dispatch({ type: "unframe" });
      return;
    }
    /* Built here rather than taken from the ref so that every number the shot
       turns on is a dependency: the sheet is re-measured after the detail
       panel renders, and the framing has to be re-taken against the band it
       leaves. `zoom` is an input too — the shot never zooms out below where
       the camera already is, so it has to re-settle on the zoom it lands on. */
    dispatch({
      type: "frame",
      geo: {
        paneWidth,
        paneHeight,
        railW,
        railGap,
        bottomInset,
        compact,
        content,
      },
      box: frame,
      floor: zoom,
    });
  }, [
    frame,
    zoom,
    paneWidth,
    paneHeight,
    railW,
    railGap,
    bottomInset,
    compact,
    content,
  ]);

  /* The sheet's height counts as a resize: opening a title on a phone takes
     70% of the screen, and that changes what "fits" means as much as a
     rotation does. So does the breakpoint — the column becoming a sheet moves
     every bound, and crossing it while the map was still opening used to leave
     the camera at whichever of the two layouts measured last. */
  const paneKey = `${paneWidth}x${paneHeight}x${fitInset(geo)}x${compact ? "sheet" : "column"}`;
  useEffect(() => {
    dispatch({
      type: "pane",
      key: paneKey,
      geo: geoRef.current,
      from: getViewport(),
    });
  }, [paneKey, getViewport]);

  const fit = useCallback(
    () => dispatch({ type: "fit", geo: measured() }),
    [measured],
  );

  const zoomToPercent = useCallback(
    (percent: number) => {
      const at = measured();
      dispatch({
        type: "slider",
        geo: at,
        from: getViewport(),
        to: zoomAtPercent(at, percent),
      });
    },
    [measured, getViewport],
  );

  const report = useCallback(
    (view: { y: number; zoom: number }) => dispatch({ type: "moved", view }),
    [],
  );

  /* ── The one writer ──────────────────────────────────────────────────── */

  /*
   * Instant, never eased. React Flow animates a viewport change with a d3
   * transition on the pane, and this component re-renders on every frame the
   * camera moves (the readout and the year rail both track it) — each render
   * re-applies d3's config and kills the transition on its first frame, so an
   * eased fit simply never left the starting zoom. Landing in one step is what
   * the slider does anyway; motion here would be the odd one out.
   */
  const shot = state.shot;
  useCameraEffect(() => {
    if (shot) void setViewport(shot);
  }, [shot, setViewport]);

  /* ── What the rest of the map reads ──────────────────────────────────── */

  const slack = verticalSlack(geo);
  const inset = insetSlack(geo, state.view.zoom);
  /*
   * Memoised, and not for the allocation. React Flow hands this straight to
   * d3-zoom in an effect keyed on the prop's identity, and a fresh array every
   * render meant that effect ran on every render — including the ~60 renders a
   * moving camera causes, each one interrupting the transition "Fit" had just
   * started. The animation never got past its first frame, so Fit looked dead.
   */
  const translateExtent = useMemo(
    () =>
      [
        [-1e6, content.top - slack],
        [1e6, content.bottom + slack + inset],
      ] as [[number, number], [number, number]],
    [content.top, content.bottom, slack, inset],
  );

  return {
    view: state.view,
    paneWidth,
    paneHeight,
    minZoom: fitZoom(geo),
    maxZoom: maxZoom(geo),
    translateExtent,
    beyondFull: beyondFull(geo, state.view.zoom),
    percent: zoomPercent(geo, state.view.zoom),
    fit,
    zoomToPercent,
    report,
  };
}
