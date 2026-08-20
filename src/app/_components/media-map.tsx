"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import {
  MarkerType,
  PanOnScrollMode,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
} from "@xyflow/react";

import { DEPENDENCIES } from "~/data/dependencies";
import { CHARACTER_BY_ID } from "~/data/characters";
import { TITLES, TITLE_BY_ID } from "~/data/titles";
import type { DepKind, RealityId } from "~/data/types";
import {
  CARD,
  DEP_RANK,
  EDGE_MARGIN,
  RAIL_GAP,
  RAIL_GAP_COMPACT,
  RAIL_W,
  RAIL_W_COMPACT,
  ALL_REALITIES,
  REALITIES,
  REALITIES_BY_BANNER,
  directParents,
  layoutTitles,
  prerequisitesOf,
  titlesByCharacter,
} from "~/lib/graph";
import { CharacterPicker } from "./character-picker";
import { DetailPanel } from "./detail-panel";
import { TitleNode, type Relation, type TitleNodeType } from "./title-node";
import { YearRail } from "./year-rail";
import { useT } from "~/i18n";
import { LOCALES } from "~/i18n/locale";

const nodeTypes = { title: TitleNode };

type MapNode = TitleNodeType;

/**
 * Too narrow for a column beside the map, matching Tailwind's `lg`. The cutoff
 * is 1024 rather than 768 because at 768 the 396px column leaves the map about
 * 370px, which is worse than the bottom sheet a portrait tablet gets instead.
 *
 * Read through matchMedia rather than a resize listener so it fires once per
 * crossing instead of once per pixel, and starts `false` so the server render
 * and the first client paint agree.
 *
 * A resize listener still backs it up, because `change` only fires for a
 * crossing that the page is around to hear. Mount in a tab that measures 0×0
 * (backgrounded, or restored from a session) and the query reads as narrow;
 * the window coming back to full size never announced itself, and a desktop
 * window sat there rendering the phone's 56px rail until a reload.
 */
function useIsCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);
  return compact;
}

/**
 * Is the nearest scrolling ancestor already at its top?
 *
 * A bottom sheet that dismisses on any downward drag fights its own scrollbar:
 * you try to scroll the legend back up and the sheet closes underneath you.
 * Dragging down only means "dismiss" when there is nothing left to scroll.
 */
function scrollerAtTop(from: Element | null) {
  for (let node = from; node; node = node.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) {
      return node.scrollTop <= 0;
    }
  }
  return true;
}

/**
 * Vertical swipe on a sheet.
 *
 * Pointer events rather than touch, so a trackpad drag behaves the same as a
 * thumb. A gesture counts if it travelled far enough OR fast enough — a flick
 * is over in 80ms and never covers much ground, and requiring distance alone
 * makes the sheet feel stuck.
 */
function useVerticalSwipe({
  onUp,
  onDown,
  enabled = true,
}: {
  onUp?: () => void;
  onDown?: () => void;
  enabled?: boolean;
}) {
  const from = useRef<{ y: number; t: number; atTop: boolean } | null>(null);
  /** Set when a swipe fired, so the click that follows it is not a second toggle. */
  const swiped = useRef(false);

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      from.current = {
        y: e.clientY,
        t: e.timeStamp,
        atTop: scrollerAtTop(e.target as Element),
      };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const start = from.current;
      from.current = null;
      if (!start) return;
      const dy = e.clientY - start.y;
      const speed = Math.abs(dy) / Math.max(1, e.timeStamp - start.t);
      if (Math.abs(dy) < 28 && speed < 0.4) return;
      if (dy > 0 && !start.atTop) return;
      swiped.current = true;
      (dy < 0 ? onUp : onDown)?.();
    },
    onPointerCancel: () => {
      from.current = null;
    },
  };

  return {
    swipe: enabled ? handlers : {},
    /** True once, immediately after a swipe, so onClick can bow out. */
    justSwiped: () => {
      const was = swiped.current;
      swiped.current = false;
      return was;
    },
  };
}

const PANEL_SPRING = { tension: 560, friction: 40 };

// Shared chrome recipes, so every floating surface reads identically.
const SURFACE =
  "rounded-lg border border-white/5 bg-surface shadow-xl shadow-black/40";
const RUN_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary";
const FIELD =
  "rounded-md border border-white/5 bg-white/[0.03] transition-colors";

/**
 * How much of the continuity the map draws. Essential-only was too thin to be
 * worth a control and everything-including-cameos too noisy, so this is fixed
 * rather than exposed: essential and recommended links, nothing weaker.
 */
const MAX_KIND: DepKind = "recommended";

/**
 * How far past "the whole width fits" the slider goes. 2 = 200%: at the notch
 * the widest row spans the stage, at the end each poster is twice that size and
 * the map is something you read rather than survey.
 */
const ZOOM_OVERDRIVE = 2;

/** Where the notch sits on the track, as a slider value. */
const ZOOM_NOTCH = 100;

/** How near the notch a dragged handle has to come before it snaps onto it. */
const ZOOM_SNAP = 5;

/**
 * The query parameter the selected title rides in, so a map opened on Endgame
 * can be sent to somebody as a link to Endgame.
 */
const TITLE_PARAM = "title";

const EDGE_STYLE: Record<DepKind, { stroke: string; dash?: string }> = {
  essential: { stroke: "#e8b14c" },
  recommended: { stroke: "#4ea88a" },
  optional: { stroke: "#5c5348", dash: "2 5" },
};

function MapCanvas() {
  const [realities, setRealities] = useState<Set<RealityId>>(
    new Set(ALL_REALITIES),
  );
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  /* Phone only: the details fold down to a title bar. The title stays selected
     — its prerequisites stay lit on the map — you just get the map back. */
  const [detailCollapsed, setDetailCollapsed] = useState(false);
  /* Tracing is a set, in the order you picked people: trace Steve and Bucky at
     once and the map lights everything either of them is in. */
  const [characters, setCharacters] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [realitiesOpen, setRealitiesOpen] = useState(true);
  const [charactersOpen, setCharactersOpen] = useState(false);
  const [viewport, setViewportState] = useState({ y: 0, zoom: 0.4 });
  const { getViewport, setViewport } = useReactFlow();
  const wrapper = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.4);

  const t = useT();

  const compact = useIsCompact();
  const railW = compact ? RAIL_W_COMPACT : RAIL_W;
  const railGap = compact ? RAIL_GAP_COMPACT : RAIL_GAP;

  /*
   * The controls are a bottom sheet on a phone, and opening one over the map by
   * default would bury it — but this has to track the breakpoint in BOTH
   * directions. Closing only on the way down left a desktop window that had
   * ever measured narrow (including for a frame during load) stuck collapsed.
   */
  useEffect(() => {
    setFiltersOpen(!compact);
  }, [compact]);

  /* Picking a title always opens it: coming from a fold, the point of the tap
     was to read this one, not to swap which title the bar names. */
  const selectTitle = useCallback((id: string) => {
    setSelected(id);
    setDetailCollapsed(false);
    /* Picking realities is a setup step, so the chips fold away to make room
       for the details. Here rather than on the canvas handler, so a shared
       link and a click on a prerequisite row arrive the same way a tap on a
       poster does — a deep link used to open with the legend still expanded,
       which on a laptop left the panel a 47px slot. */
    setRealitiesOpen(false);
  }, []);

  /**
   * Adopt the title named in the URL, once, on arrival.
   *
   * Read in an effect rather than in the initial state, for the same reason
   * the locale is: touching `window` during render would make the server's
   * markup and the first client paint disagree. An id that no longer exists is
   * ignored rather than honoured, and the effect below then tidies it out of
   * the address bar.
   */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get(TITLE_PARAM);
    if (id && TITLE_BY_ID.has(id)) setSelected(id);
  }, []);

  /**
   * Keep the URL pointing at whatever is open.
   *
   * `history.replaceState` rather than the Next router: this page is static
   * and the map is drawn entirely on the client, so a router navigation would
   * fetch a payload only to arrive back at the document already on screen.
   * Replace rather than push, because clicking through a dozen titles should
   * not bury the page the visitor came from under a dozen history entries —
   * the URL is here to be copied, not to be walked back through.
   */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set(TITLE_PARAM, selected);
    else url.searchParams.delete(TITLE_PARAM);
    if (url.href !== window.location.href) {
      window.history.replaceState(null, "", url);
    }
  }, [selected]);

  /**
   * Enter or Space opens the focused card.
   *
   * React Flow already makes every node focusable and puts it in the tab
   * order, but it only ever calls `onNodeClick` from a real mouse event — so a
   * keyboard user could tab through all hundred cards and open none of them.
   * The handler sits on the pane rather than inside TitleNode because the
   * element that actually takes focus is React Flow's own node wrapper, which
   * the node component never renders and so cannot bind to.
   */
  const onMapKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target as HTMLElement | null;
      const id = target
        ?.closest?.(".react-flow__node")
        ?.getAttribute("data-id");
      if (!id) return;
      // Space scrolls the pane otherwise, which moves the map out from under
      // the card you were just about to open.
      event.preventDefault();
      selectTitle(id);
    },
    [selectTitle],
  );

  const visible = useMemo(
    () =>
      TITLES.filter(
        (t) => realities.has(t.reality) && (showUpcoming || !t.upcoming),
      ),
    [realities, showUpcoming],
  );

  const positions = useMemo(() => layoutTitles(visible), [visible]);

  /**
   * Kill ctrl/⌘-wheel zooming. React Flow routes that gesture straight to
   * d3-zoom regardless of `zoomOnPinch`, and it fights the slider.
   */
  useEffect(() => {
    const el = wrapper.current;
    if (!el || compact) return;
    const block = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    el.addEventListener("wheel", block, { capture: true, passive: false });
    return () => el.removeEventListener("wheel", block, { capture: true });
  }, [compact]);

  /** Live size of the map pane; every zoom bound is measured against it. */
  const [paneWidth, setPaneWidth] = useState(1040);
  const [paneHeight, setPaneHeight] = useState(900);

  /**
   * Read the pane straight from the DOM, and quietly correct the cached size if
   * it has drifted. A ResizeObserver can miss a change (a hidden pane reports
   * 0×0, and the callback for it coming back doesn't always arrive), and a
   * stale height silently ruins every zoom bound derived from it.
   */
  const livePane = useCallback(() => {
    const el = wrapper.current;
    if (!el || el.clientWidth < 2 || el.clientHeight < 2) {
      return { width: paneWidth, height: paneHeight };
    }
    if (Math.abs(el.clientWidth - paneWidth) > 1) setPaneWidth(el.clientWidth);
    if (Math.abs(el.clientHeight - paneHeight) > 1)
      setPaneHeight(el.clientHeight);
    return { width: el.clientWidth, height: el.clientHeight };
  }, [paneWidth, paneHeight]);
  useEffect(() => {
    const measure = () => {
      const el = wrapper.current;
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
    if (wrapper.current) observer.observe(wrapper.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  /**
   * How much of the map pane the chrome is sitting on top of.
   *
   * On a phone the controls and the detail panel are a sheet floating over the
   * bottom of the map rather than a column beside it, so the pane is taller
   * than the part of it anyone can actually see. Every camera figure below
   * works from the visible band instead — fit into it, centre in it, and let
   * the pan extent carry the oldest row up out from under it.
   *
   * Without this the first decade of the timeline sat permanently behind the
   * search field: at fit zoom on a 375×812 phone, thirteen cards — X-Men,
   * Spider-Man, Daredevil, the 2005 Fantastic Four, Iron Man itself — were
   * under the sheet with no way to reach them. Which is exactly how people
   * came to report titles as missing that were on the map all along.
   */
  const chrome = useRef<HTMLElement>(null);
  const [bottomInset, setBottomInset] = useState(0);
  useEffect(() => {
    const el = chrome.current;
    if (!el || !compact) {
      setBottomInset(0);
      return;
    }
    const measure = () => setBottomInset(el.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // `selected` swaps which card is in the sheet, and the two are nothing
    // like the same height.
  }, [compact, selected, detailCollapsed]);

  /**
   * The inset the camera's BOUNDS work from, which is not the same number.
   *
   * Reserving the controls sheet is the whole point — that is what kept the
   * first decade of the timeline reachable. Reserving the detail panel is not:
   * it opens over 70% of the screen, and deciding what "fit" means against the
   * remaining 30% squeezed twenty-eight years into 244px, put every poster at
   * seven pixels and dropped the dependency lines altogether. So the fit never
   * gives up more than a third of the pane, and a title being open moves the
   * camera through the effect further down instead.
   */
  const fitInset = Math.min(bottomInset, Math.round(paneHeight * 0.34));

  /** What `fit` and the zoom floor are measured against. */
  const fitHeight = Math.max(120, paneHeight - fitInset);

  /**
   * The laid-out graph's horizontal box. The year labels hang off the left of
   * every row, so the content is NOT symmetric around flow-x 0, so the camera has
   * to centre on this midpoint, or the gutter falls off the edge at high zoom.
   */
  const contentBox = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const t of visible) {
      const at = positions.get(t.id);
      if (!at) continue;
      min = Math.min(min, at.x);
      max = Math.max(max, at.x + CARD[t.medium].w);
      top = Math.min(top, at.y);
      bottom = Math.max(bottom, at.y + CARD[t.medium].h);
    }
    if (!Number.isFinite(min)) {
      return { min: 0, max: 1, mid: 0.5, width: 1, top: 0, bottom: 1 };
    }
    return { min, max, mid: (min + max) / 2, width: max - min, top, bottom };
  }, [visible, positions]);

  /** Everything the camera actually has to play with, once the rail is reserved. */
  const stageWidth = Math.max(120, paneWidth - railW - railGap);

  /** 100% on the slider: the widest row spans the stage, clear of the rail. */
  const fullZoom = useMemo(() => {
    const spansTheStage = Math.min(
      2,
      Math.max(0.1, stageWidth / contentBox.width),
    );
    // On a phone the widest row cannot fit at any readable size, so capping the
    // zoom there would leave every poster a smudge. Let it reach legible size
    // and let the graph run off the sides — that is what panning is for.
    return compact ? Math.max(spansTheStage, 1) : spansTheStage;
  }, [stageWidth, contentBox.width, compact]);

  /**
   * The slider carries on past 100%, to twice it.
   *
   * 100% is the most of the map you can see at once — the widest row exactly
   * spanning the stage — which is not the same as the most you can READ. A row
   * that wide puts each poster at a couple of hundred pixels, and the year, the
   * runtime and the title under it are small print at that size. Past 100% the
   * graph stops fitting across and you pan sideways for the rest, which is the
   * trade the notch on the track marks: everything-across on one side of it,
   * close-reading on the other.
   */
  const maxZoom = fullZoom * ZOOM_OVERDRIVE;

  /** True once the graph is wider than the stage and has to be panned across. */
  const beyondFull = viewport.zoom > fullZoom * 1.001;

  /**
   * 0% on the slider: the whole graph in view, with a margin above the newest
   * row and below the oldest. The pan extent picks that same margin up, so the
   * ends of the timeline never sit flush against the edge of the pane.
   */
  const fitZoom = useMemo(() => {
    const height =
      Math.max(1, contentBox.bottom - contentBox.top) + EDGE_MARGIN * 2;
    return Math.min(fullZoom, fitHeight / height);
  }, [contentBox.bottom, contentBox.top, fitHeight, fullZoom]);

  /**
   * In timeline mode the camera is rail-mounted: the graph stays centred,
   * scrolling only moves it up and down, and zoom comes from the slider.
   */
  const centreX = useCallback(
    (atZoom: number) =>
      railW + railGap + stageWidth / 2 - contentBox.mid * atZoom,
    [stageWidth, contentBox.mid, railW, railGap],
  );

  /**
   * Panning stops dead at the first and last row: the extent IS the content.
   * The only slack is what's needed when the graph is shorter than the pane —
   * d3-zoom refuses an extent smaller than the viewport and would force the
   * zoom up to compensate.
   */
  const verticalSlack = Math.max(
    0,
    (fitHeight / Math.max(fitZoom, 0.02) -
      (contentBox.bottom - contentBox.top)) /
      2,
  );

  /**
   * Extra room at the bottom of the extent, worth exactly the height of the
   * sheet, so the last row can be scrolled up clear of it instead of stopping
   * dead underneath.
   *
   * Quantised to 5% steps of the zoom. The extent's identity has to stay
   * stable across a moving camera (see the memo below), and a raw zoom in the
   * denominator would hand d3 a fresh array on every frame of a pinch.
   */
  const insetSlack = useMemo(() => {
    if (!bottomInset) return 0;
    const step = Math.max(fitZoom, Math.round(zoom * 20) / 20, 0.02);
    return bottomInset / step;
  }, [bottomInset, fitZoom, zoom]);

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
        [-1e6, contentBox.top - verticalSlack],
        [1e6, contentBox.bottom + verticalSlack + insetSlack],
      ] as [[number, number], [number, number]],
    [contentBox.top, contentBox.bottom, verticalSlack, insetSlack],
  );

  /**
   * Our own fit rather than React Flow's: theirs centres on the whole pane and
   * would tuck the leftmost column under the year rail.
   */
  const fitAll = useCallback(
    /*
     * Instant, not eased. React Flow animates a viewport change with a d3
     * transition on the pane, and this component re-renders on every frame the
     * camera moves (the readout and the year rail both track it) — each render
     * re-applies d3's config and kills the transition on its first frame, so
     * an eased fit simply never left the starting zoom. Landing in one step is
     * what the slider does anyway; motion here would be the odd one out.
     */
    (duration = 0) => {
      const pane = livePane();
      const contentHeight = Math.max(1, contentBox.bottom - contentBox.top);
      const stage = Math.max(120, pane.width - railW - railGap);
      /* The sheet's height, not the pane's: fitting into glass the phone's
         chrome is sitting on top of is how the oldest rows ended up behind
         the search field. */
      const band = Math.max(120, pane.height - fitInset);
      const zoomTo = Math.min(
        Math.min(2, Math.max(0.1, stage / contentBox.width)),
        band / (contentHeight + EDGE_MARGIN * 2),
      );
      const onScreen = contentHeight * zoomTo;
      void setViewport(
        {
          x: railW + railGap + stage / 2 - contentBox.mid * zoomTo,
          y: (band - onScreen) / 2 - contentBox.top * zoomTo,
          zoom: zoomTo,
        },
        { duration },
      );
      setZoom(zoomTo);
    },
    [
      contentBox.bottom,
      contentBox.mid,
      contentBox.top,
      contentBox.width,
      livePane,
      railW,
      railGap,
      setViewport,
      fitInset,
    ],
  );

  /**
   * The opening shot, which is not the same move as a re-fit.
   *
   * The map opens at the notch — 100%, the widest row exactly spanning the
   * stage — rather than at the whole-graph fit. Fitting twenty-five years of
   * releases into one pane puts every poster at thumbnail size: it shows you
   * the SHAPE of the thing and none of the content, which is a diagram of a
   * map rather than a map. At the notch the posters are legible and the graph
   * is still as wide as the screen, so the first thing on screen is something
   * you can read. Fit is one click away and still what every later re-fit
   * uses.
   *
   * Vertically it lands centred, because that is precisely where you arrive if
   * you open the app and drag the slider to 100% yourself — the track anchors
   * zoom on the middle of the pane. Same zoom, same view, either way you get
   * there.
   */
  const openView = useCallback(
    (duration = 0) => {
      /*
       * `fullZoom` and `centreX`, not a fresh measurement of the pane. Fit can
       * measure live because its answer is self-contained, but this one has to
       * agree with the READOUT, and the readout is computed from the same
       * pane-size state these two derive from. Measuring independently landed
       * the camera at a zoom the track then reported as 121%: correct pixels,
       * a slider that disagreed with them, and no way to drag back to the
       * value you opened on.
       */
      const contentHeight = Math.max(1, contentBox.bottom - contentBox.top);
      void setViewport(
        {
          x: centreX(fullZoom),
          y: fitHeight / 2 - (contentBox.top + contentHeight / 2) * fullZoom,
          zoom: fullZoom,
        },
        { duration },
      );
      setZoom(fullZoom);
    },
    [
      centreX,
      contentBox.bottom,
      contentBox.top,
      fullZoom,
      fitHeight,
      setViewport,
    ],
  );

  /*
   * Desktop only. On a phone `fullZoom` is floored at 1 because the widest row
   * cannot fit across at any readable size, so opening there at "100%" would
   * drop you mid-pan into a graph with no edges in sight and nothing to tell
   * you which way the rest of it lies. The phone keeps the whole-graph fit.
   */
  const openCamera = useCallback(
    (duration = 0) => (compact ? fitAll(duration) : openView(duration)),
    [compact, fitAll, openView],
  );

  /**
   * True until the user first takes the camera.
   *
   * The opening shot cannot be a single call. The pane's size arrives in
   * stages — a default, then the real measurement, then whatever the sidebar
   * settles at — and `fullZoom` moves with it. Firing once against the first
   * of those figures left the camera at a zoom the finished layout called
   * 121%: the notch had moved underneath it. So the opening re-asserts itself
   * on every measurement until somebody chooses a zoom, at which point it
   * stops for good and never touches the camera again.
   */
  const opening = useRef(true);

  /** The user just moved the camera; the opening shot is over. */
  const takeCamera = useCallback(() => {
    opening.current = false;
  }, []);

  /*
   * Deferred camera work reaches for this rather than closing over
   * `openCamera` directly. The layout effect fires its call from a timeout, so
   * the closure it captured was built against the pane's placeholder size and
   * lands AFTER the measured re-open has already corrected it — the stale shot
   * would win purely by arriving last.
   */
  const openCameraRef = useRef(openCamera);
  useEffect(() => {
    openCameraRef.current = openCamera;
  }, [openCamera]);

  /**
   * Fit when the LAYOUT changes — first paint, a filter. It is
   * computed from OUR layout, not from React Flow's measurements, so it
   * doesn't need to wait on `useNodesInitialized`, which never resolves while
   * the pane is hidden, leaving the camera on React Flow's default transform.
   */
  const layoutKey = `${visible.length}`;
  const fittedFor = useRef("");
  useEffect(() => {
    if (fittedFor.current === layoutKey) return;
    fittedFor.current = layoutKey;
    const id = setTimeout(() => {
      if (opening.current) openCameraRef.current(0);
      else fitAll(0);
    }, 0);
    return () => clearTimeout(id);
  }, [layoutKey, fitAll]);

  /**
   * A resize is not a reason to throw away where you were: keep the zoom (just
   * clamped into the new bounds) and re-centre on the new pane.
   */
  const sizedFor = useRef("");
  useEffect(() => {
    /* The sheet's height counts: opening a title on a phone takes 70% of the
       screen, and that changes what "fits" means as much as a rotation does. */
    const key = `${paneWidth}x${paneHeight}x${fitInset}`;
    if (sizedFor.current === key) return;
    const first = sizedFor.current === "";
    sizedFor.current = key;
    // The very first fit ran against placeholder dimensions; redo it properly
    // as soon as the pane reports its real size.
    /* Still opening: re-take the opening shot against the size we now know,
       rather than carrying a zoom that was computed against a guess. */
    if (first || opening.current) {
      openCamera(0);
      return;
    }
    const view = getViewport();
    const next = Math.min(maxZoom, Math.max(fitZoom, view.zoom));
    void setViewport({ ...view, x: centreX(next), zoom: next });
    setZoom(next);
  }, [
    paneWidth,
    paneHeight,
    fitInset,
    maxZoom,
    fitZoom,
    centreX,
    getViewport,
    setViewport,
    openCamera,
  ]);

  /**
   * The slider is a plain 0–200 and the zoom is derived from it. Ranging it
   * over the zoom values themselves meant the float step grid never landed
   * exactly on the notch, so the handle always stopped a step short of 100%.
   *
   * The two halves are read differently, because they answer different
   * questions. Below the notch, "how much of the map is on screen": 0% is the
   * whole thing and 100% is the width of it, so the percentage is of the span
   * between them. Above it, "how big is a poster": 200% is twice the size a
   * poster is at the notch, so the percentage is a plain multiple. They meet at
   * 100%, which means the same zoom either way you arrive at it.
   */
  const zoomSpan = Math.max(0.0001, fullZoom - fitZoom);
  const zoomValue = Math.min(maxZoom, Math.max(fitZoom, zoom));
  const zoomPercent = Math.round(
    zoomValue <= fullZoom
      ? ((zoomValue - fitZoom) / zoomSpan) * 100
      : (zoomValue / fullZoom) * 100,
  );
  const zoomAt = (percent: number) =>
    percent <= ZOOM_NOTCH
      ? fitZoom + (percent / ZOOM_NOTCH) * zoomSpan
      : (percent / ZOOM_NOTCH) * fullZoom;

  /**
   * The notch is a detent, not just a paint mark: drag within a few points of
   * 100% and the handle takes it. Landing on the exact value that fits the map
   * across is the one thing on this track worth hitting, and a 1-in-200 target
   * is not something a dragged thumb hits.
   *
   * Only while dragging, though. Arrow keys step in ones, and a snap that
   * applied to them would swallow every value either side of the notch and
   * leave the handle stuck to it.
   *
   * Desktop only, with the mark: a phone has no room for a notch on a track a
   * thumb already covers, and a detent you cannot see is just a slider that
   * sticks.
   */
  const dragging = useRef(false);
  const snapToNotch = (percent: number) =>
    !compact && dragging.current && Math.abs(percent - ZOOM_NOTCH) <= ZOOM_SNAP
      ? ZOOM_NOTCH
      : percent;

  /** Slider zoom, anchored on the middle of the screen rather than the origin. */
  const applyZoom = useCallback(
    (raw: number) => {
      takeCamera();
      const next = Math.min(maxZoom, Math.max(fitZoom, raw));
      const view = getViewport();
      const pane = livePane();
      /* The middle of the visible band, not of the pane: on a phone the pane's
         own midpoint can be behind the sheet, and zooming towards a point you
         cannot see walks the map out from under you. */
      const anchor = Math.max(120, pane.height - bottomInset) / 2;
      /*
       * Up to 100% the graph is narrower than the stage and stays centred on
       * it. Past that it no longer fits, so the camera holds whatever is in the
       * middle of the stage instead — snapping back to the content's centre
       * would throw away the sideways panning you did to get to a poster.
       */
      const stageMid = railW + railGap + stageWidth / 2;
      setZoom(next);
      void setViewport({
        x:
          next <= fullZoom
            ? centreX(next)
            : stageMid - ((stageMid - view.x) * next) / view.zoom,
        y: anchor - ((anchor - view.y) * next) / view.zoom,
        zoom: next,
      });
    },
    [
      centreX,
      fitZoom,
      fullZoom,
      getViewport,
      livePane,
      maxZoom,
      railGap,
      railW,
      setViewport,
      stageWidth,
      takeCamera,
      bottomInset,
    ],
  );

  /**
   * Stated prerequisites: the only ones that get a drawn line, and the only
   * ones carrying a reason. The reason rides on the NODE (shown on hover)
   * rather than on the edge: edge labels sat on top of each other and of the
   * posters, and were unreadable the moment two lines ran near each other.
   */
  const direct = useMemo(
    () =>
      new Map(
        selected
          ? directParents(selected)
              .filter((dep) => DEP_RANK[dep.kind] <= DEP_RANK[MAX_KIND])
              .map((dep) => [dep.from, dep] as const)
          : [],
      ),
    [selected],
  );

  /** Everything further up the chain: lit, but not linked. */
  const indirect = useMemo(
    () => (selected ? prerequisitesOf(selected, MAX_KIND) : new Set<string>()),
    [selected],
  );

  /**
   * On a phone, frame the title you just opened.
   *
   * Tapping a poster puts a sheet over 70% of the screen, and more often than
   * not the card you tapped — with every line drawn to its prerequisites — was
   * underneath it. Nothing appeared to happen at all.
   *
   * Lifting it into the visible band is not enough on its own: the phone opens
   * fitted, where a poster is fifteen pixels tall and an arrow between two of
   * them is a smudge. So the camera also closes in, far enough that the
   * selection and the titles it points at fill the band the sheet leaves. That
   * is the shot the tap was asking for — this one, and what you watch before
   * it, at a size where the lines read.
   */
  useEffect(() => {
    if (!compact || !selected || detailCollapsed) return;
    const at = positions.get(selected);
    const title = TITLE_BY_ID.get(selected);
    if (!at || !title) return;

    /* The selected card plus its direct prerequisites: the arrows need both
       ends on screen to say anything. */
    let top = at.y;
    let bottom = at.y + CARD[title.medium].h;
    let left = at.x;
    let right = at.x + CARD[title.medium].w;
    for (const id of direct.keys()) {
      const parent = positions.get(id);
      const parentTitle = TITLE_BY_ID.get(id);
      if (!parent || !parentTitle) continue;
      const card = CARD[parentTitle.medium];
      top = Math.min(top, parent.y);
      bottom = Math.max(bottom, parent.y + card.h);
      left = Math.min(left, parent.x);
      right = Math.max(right, parent.x + card.w);
    }

    const band = Math.max(120, paneHeight - bottomInset);
    const stage = Math.max(120, paneWidth - railW - railGap);
    const pad = 24;
    const zoomTo = Math.min(
      maxZoom,
      Math.max(
        // Never below the current zoom: closing in is welcome, being pushed
        // further out because a chain is wide is not.
        zoom,
        Math.min(
          stage / Math.max(1, right - left + pad * 2),
          band / Math.max(1, bottom - top + pad * 2),
        ),
      ),
    );

    const spanY = (bottom - top) * zoomTo;
    /* Taller than the band even so: pin the selection near the top and let the
       chain run off above it, rather than shrinking it back to a smudge. */
    const y =
      spanY > band - pad
        ? pad - at.y * zoomTo
        : (band - spanY) / 2 - top * zoomTo;
    const x = railW + railGap + stage / 2 - ((left + right) / 2) * zoomTo;

    void setViewport({ x, y, zoom: zoomTo });
    setZoom(zoomTo);
    setViewportState({ y, zoom: zoomTo });
  }, [
    compact,
    selected,
    detailCollapsed,
    positions,
    direct,
    setViewport,
    paneHeight,
    paneWidth,
    bottomInset,
    railW,
    railGap,
    maxZoom,
    zoom,
  ]);

  const toggleCharacter = useCallback((id: string) => {
    setCharacters((prev) => {
      if (prev.includes(id)) return prev.filter((other) => other !== id);
      /* Tracing someone from the cast list should reveal the section, so the
         picker and the chips are where you expect them next. */
      setCharactersOpen(true);
      return [...prev, id];
    });
  }, []);

  /** The union: a title stays lit if ANY traced character turns up in it. */
  const characterTitles = useMemo(() => {
    const marked = new Set<string>();
    for (const id of characters) {
      for (const titleId of titlesByCharacter.get(id) ?? [])
        marked.add(titleId);
    }
    return marked;
  }, [characters]);

  /**
   * Which of the traced characters a given title actually casts, each with the
   * performer THIS title used — recasts and all.
   */
  const tracedIn = useCallback(
    (titleId: string) => {
      const cast = TITLE_BY_ID.get(titleId)?.cast ?? [];
      return characters.flatMap((id) => {
        const character = CHARACTER_BY_ID.get(id);
        const entry = cast.find((c) => c.characterId === id);
        if (!character || !entry) return [];
        return [
          { id, name: t.characterName(character), reality: character.reality },
        ];
      });
    },
    [characters, t],
  );

  /**
   * How many cards the search actually left lit, or `null` when there is no
   * search running.
   *
   * A query that matches nothing dims every poster at once, which reads as a
   * map that has broken rather than as a search that found nothing — so the
   * field says which it is in words. Matching is the same two-language test
   * the nodes themselves use.
   */
  const queryMatches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return null;
    return visible.filter(
      (title) =>
        title.name.toLowerCase().includes(needle) ||
        t.titleName(title).toLowerCase().includes(needle),
    ).length;
  }, [query, visible, t]);

  const nodes: MapNode[] = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return visible.map((title) => {
      const relation: Relation = !selected
        ? "none"
        : title.id === selected
          ? "root"
          : direct.has(title.id)
            ? "direct"
            : indirect.has(title.id)
              ? "indirect"
              : "none";

      const traced = characterTitles.has(title.id) ? tracedIn(title.id) : [];
      /* Searched in both languages at once: the Chinese name is what is on
         screen, but "Ragnarok" is what a lot of people will type at it. */
      const matchesQuery =
        !needle ||
        title.name.toLowerCase().includes(needle) ||
        t.titleName(title).toLowerCase().includes(needle);
      const dimmed =
        !matchesQuery ||
        (!!selected && relation === "none") ||
        (!selected && characters.length > 0 && traced.length === 0);

      const dep = direct.get(title.id);

      return {
        id: title.id,
        type: "title" as const,
        position: positions.get(title.id) ?? { x: 0, y: 0 },
        data: {
          label: t.titleName(title),
          year: title.year,
          medium: title.medium,
          reality: title.reality,
          phase: title.phase,
          saga: title.saga,
          upcoming: title.upcoming,
          relation,
          reason: dep ? t.reason(dep) : undefined,
          reasonKind: dep?.kind,
          dimmed,
          traced,
          vertical: true,
        },
        draggable: false,
        connectable: false,
      };
    });
  }, [
    visible,
    positions,
    selected,
    direct,
    indirect,
    characters,
    characterTitles,
    query,
    tracedIn,
    t,
  ]);

  /**
   * Lines are expensive to read: a full ancestor chain crosses years and
   * overlaps into mush. So only the DIRECT prerequisites of the selected title
   * get a line. Everything further back is communicated by lighting alone.
   */
  const edges: Edge[] = useMemo(() => {
    const ids = new Set(visible.map((t) => t.id));
    const wanted = DEPENDENCIES.filter(
      (dep) =>
        ids.has(dep.from) &&
        ids.has(dep.to) &&
        DEP_RANK[dep.kind] <= DEP_RANK[MAX_KIND] &&
        dep.to === selected,
    );

    return wanted.map((dep, i) => {
      const style = EDGE_STYLE[dep.kind];
      return {
        id: `${dep.from}->${dep.to}`,
        source: dep.from,
        target: dep.to,
        type: "smoothstep",
        /* Every direct prerequisite points at the same node, so their vertical
           runs would land in one corridor and read as a single smeared dash.
           Staggering the elbow offset gives each line its own lane. */
        pathOptions: { offset: 16 + i * 15, borderRadius: 10 },
        style: {
          stroke: style.stroke,
          strokeWidth: selected ? 1.8 : 1,
          strokeDasharray: style.dash,
          opacity: selected ? 1 : 0.35,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: style.stroke,
        },
      };
    });
  }, [visible, selected]);

  const toggleReality = useCallback((r: RealityId) => {
    setRealities((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      // An empty map is never what anyone meant by unticking the last one.
      return next.size ? next : prev;
    });
  }, []);

  /** Whole banner on or off: untick Fox and all four of its Earths go. */
  const toggleBanner = useCallback((ids: RealityId[]) => {
    setRealities((prev) => {
      const next = new Set(prev);
      if (ids.every((r) => next.has(r))) ids.forEach((r) => next.delete(r));
      else ids.forEach((r) => next.add(r));
      return next.size ? next : prev;
    });
  }, []);

  const intro = useSpring({
    from: { opacity: 0, y: -10 },
    to: { opacity: 1, y: 0 },
    config: PANEL_SPRING,
  });

  /*
   * The phone sheet is a drawer: search and zoom stay out on the tab, and the
   * legend and character view ride inside it. Springing a height needs a real
   * number, so the contents are measured and re-measured as they change (the
   * character picker opening is a big one).
   */
  const drawerBody = useRef<HTMLDivElement>(null);
  const [drawerH, setDrawerH] = useState(0);
  useEffect(() => {
    const el = drawerBody.current;
    if (!el) return;
    const measure = () => setDrawerH(el.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [compact]);

  /* Swipe the sheet itself: up opens the drawer, down shuts it. Only live on
     a phone, where the sheet exists at all. */
  const sheetSwipe = useVerticalSwipe({
    enabled: compact,
    onUp: () => setFiltersOpen(true),
    onDown: () => setFiltersOpen(false),
  });
  /* And swipe the details down, the way every other bottom sheet goes: once to
     fold them to their title bar, again to let the title go. Up brings the
     reading back. */
  const detailSwipe = useVerticalSwipe({
    enabled: compact,
    onUp: () => setDetailCollapsed(false),
    onDown: () =>
      detailCollapsed ? setSelected(null) : setDetailCollapsed(true),
  });

  /* How much the map is hiding, chips and unreleased alike — the number the
     collapsed realities header reports. */
  const hiddenFilters =
    ALL_REALITIES.length - realities.size + (showUpcoming ? 0 : 1);

  /* Folding is a phone affordance; the desktop column always shows the whole
     panel, whatever the flag was left on when the window grew. */
  const collapsedDetail = compact && detailCollapsed;

  const drawerShut = compact && !filtersOpen;
  const drawer = useSpring({
    height: drawerShut ? 0 : drawerH,
    opacity: drawerShut ? 0 : 1,
    config: PANEL_SPRING,
  });

  return (
    <div className="bg-canvas-bg relative flex h-[100dvh] w-full">
      {/* ── The map. No chrome sits on top of it, so no poster is ever hidden. */}
      <main
        ref={wrapper}
        className="relative min-w-0 flex-1"
        onKeyDown={onMapKeyDown}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          /* Only mount what is on screen. Zoomed in, that is a handful of cards
             instead of a hundred — fewer DOM nodes, and fewer poster requests
             against a CDN that counts them. */
          onlyRenderVisibleElements
          /* Picking realities is a setup step, so the chips fold away to make
             room for the details. They collapse to their own labelled header
             rather than vanishing — the chips are also the map's colour key,
             and a key that disappears the moment you open a title reads as a
             bug rather than as something you can open again. */
          onNodeClick={(_, node) => selectTitle(node.id)}
          onPaneClick={() => setSelected(null)}
          /*
           * Any viewport change (fit, slider, pinch) keeps the readout honest —
           * and `zoom` moves with it rather than waiting for the gesture to
           * end, so the slider handle follows a pinch as it happens instead of
           * sitting at the old value and jumping when the fingers lift.
           *
           * It buys no extra renders: the viewport state beside it already
           * re-renders this component on every frame the camera moves, and
           * both land in the same batch.
           */
          onMove={(_, view) => {
            setZoom(view.zoom);
            setViewportState({ y: view.y, zoom: view.zoom });
          }}
          /* The settle still gets its own call. `onMove` is throttled to the
             frame, so the last few pixels of a flick can land after it. */
          onMoveEnd={(_, view) => {
            setZoom(view.zoom);
            setViewportState({ y: view.y, zoom: view.zoom });
          }}
          /* React Flow's stylesheet loads after globals.css and paints its own
             #141414, which reads as a seam against the chrome column. */
          style={{ backgroundColor: "var(--color-canvas-bg)" }}
          proOptions={{ hideAttribution: true }}
          colorMode="dark"
          minZoom={fitZoom}
          maxZoom={maxZoom}
          /*
           * Scrolling stops at the ends of the graph rather than drifting off
           * into empty space, but ONLY vertically. d3-zoom refuses to let the
           * extent be smaller than the viewport, so a horizontal bound on this
           * narrow column silently forced the zoom up and broke "fit".
           */
          translateExtent={translateExtent}
          /* Past 100% the widest rows run off both edges, so the map has to be
             draggable sideways to be readable at all — below it the graph fits
             across and a horizontal drag would only shove it off-centre. */
          panOnDrag={compact || beyondFull}
          panOnScroll
          /* Default is 0.5, barely half a wheel notch per scroll, which is a
             slog on a graph this tall. */
          panOnScrollSpeed={1.6}
          panOnScrollMode={
            compact || beyondFull
              ? PanOnScrollMode.Free
              : PanOnScrollMode.Vertical
          }
          zoomOnScroll={false}
          zoomOnPinch={compact}
          zoomOnDoubleClick={false}
        ></ReactFlow>

        <YearRail
          titles={visible}
          viewport={viewport}
          height={paneHeight}
          width={railW}
          compact={compact}
        />
      </main>

      {/* ── The chrome column. Cards read as floating, but they occupy their own
             space beside the map rather than covering it. */}
      {/* Desktop keeps its own column beside the map. A phone has no room for
          one, so the same cards become a bottom sheet: the map keeps the full
          screen and the chrome floats over the bottom of it. */}
      <aside
        ref={chrome}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex max-h-[70dvh] flex-col justify-end gap-3 p-3 lg:pointer-events-auto lg:static lg:h-full lg:max-h-none lg:w-[396px] lg:shrink-0 lg:justify-start"
      >
        {/* One surface for the whole control set: filters, camera, legend. */}
        <animated.div
          {...sheetSwipe.swipe}
          style={intro}
          className={`${SURFACE} pointer-events-auto min-h-0 shrink overflow-y-auto ${
            /* One card at a time on a phone: reading a title takes the sheet,
               and folding the details is for getting the MAP back — handing the
               controls their 500px again would just re-cover it. */
            /* On a laptop both cards share the column, and the controls used
               to win it: 406px of a 720px column, leaving the panel a 47px
               window onto 3300px of prerequisites and cast. With a title open
               they are capped and scroll internally instead. */
            selected ? "max-lg:hidden lg:max-h-[38%]" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-3">
            <h1 className="text-text-primary text-[15px] font-semibold tracking-tight">
              {t.ui.appName}
            </h1>
            <div className="flex shrink-0 items-center gap-3">
              {/* The whole map is bilingual, so the switch belongs at the top of
                  the chrome rather than buried under the filters. */}
              <div
                role="group"
                aria-label={t.ui.language}
                className="flex items-center gap-0.5 rounded-md border border-white/5 bg-black/25 p-0.5"
              >
                {LOCALES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => t.setLocale(l.id)}
                    aria-pressed={t.locale === l.id}
                    className={`flex min-h-11 min-w-11 items-center justify-center rounded px-2 text-[12px] transition-colors lg:min-h-0 lg:min-w-0 lg:px-1.5 lg:py-0.5 lg:text-[11px] ${
                      t.locale === l.id
                        ? "text-text-primary bg-white/[0.13] font-medium"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 pb-3.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.ui.searchTitles}
              className={`${FIELD} text-text-primary placeholder:text-text-secondary w-full px-3 py-3 text-[16px] focus:border-white/15 focus:outline-none lg:py-2 lg:text-[13px]`}
            />
            {queryMatches !== null && (
              /* Polite, not assertive: the count updates on every keystroke,
                 and an assertive region would interrupt the typing to read
                 each intermediate total out. */
              <p
                aria-live="polite"
                className={`mt-1.5 px-0.5 text-[11px] ${
                  queryMatches === 0 ? "text-text-body" : "text-text-muted"
                }`}
              >
                {queryMatches === 0
                  ? t.ui.noTitleMatch
                  : t.ui.titleMatches(queryMatches)}
              </p>
            )}
          </div>

          {/* On a phone this whole block is the drawer, so it always renders and
              the spring hides it; on desktop it is the plain filters section. */}
          <animated.div
            className={compact ? "overflow-hidden" : ""}
            style={
              compact
                ? { height: drawer.height, opacity: drawer.opacity }
                : undefined
            }
          >
            <div ref={drawerBody}>
              <div className="hairline mx-4" />
              {/* Toggle chips rather than a checkbox column: the state is carried
                  by the reality's own colour: lit when on, an empty ring when
                  off, so the list doubles as the map's legend. Realities sit
                  under the banner that shot them, because "Marvel Studios" is a
                  useful thing to switch off in one go and "Earth-838" is a
                  useful thing to keep. */}
              <div className="px-4 py-3.5">
                {/*
                  The same disclosure as the character view below, because it
                  does the same job: folds a section away without forgetting it.
                  The count of what is switched off rides on the header, so a
                  collapsed legend still says the map is filtered.
                */}
                <button
                  onClick={() => setRealitiesOpen((open) => !open)}
                  aria-expanded={realitiesOpen}
                  className="group -mx-2 flex min-h-11 w-full items-center justify-between gap-3 px-2 text-left transition-opacity active:opacity-60 lg:-mx-1 lg:min-h-0 lg:px-1 lg:py-0.5"
                >
                  <span
                    className={`${RUN_LABEL} group-hover:text-text-primary transition-colors`}
                  >
                    {t.ui.realities}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {hiddenFilters > 0 && (
                      <span className="text-text-body rounded-full bg-white/[0.09] px-1.5 py-0.5 text-[11px] leading-none tabular-nums">
                        −{hiddenFilters}
                      </span>
                    )}
                    <svg
                      viewBox="0 0 12 12"
                      aria-hidden
                      className={`text-text-secondary group-hover:text-text-primary h-3 w-3 transition-transform ${
                        realitiesOpen ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        d="M2.5 4.5 6 8l3.5-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {realitiesOpen && (
                  <>
                    {hiddenFilters > 0 && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setRealities(new Set(ALL_REALITIES));
                            setShowUpcoming(true);
                          }}
                          className="text-text-secondary hover:text-text-primary text-[11px] transition-colors"
                        >
                          {t.ui.showAll}
                        </button>
                      </div>
                    )}

                    {REALITIES_BY_BANNER.map((group) => (
                      <div key={group.banner} className="mt-2.5">
                        <button
                          onClick={() => toggleBanner(group.realities)}
                          className="text-text-muted hover:text-text-secondary flex min-h-11 w-full items-center gap-2 px-1 pb-1.5 text-left text-[11px] tracking-[0.08em] uppercase transition-colors lg:min-h-0"
                        >
                          {t.banner(group.banner)}
                          <span className="h-px flex-1 bg-white/[0.07]" />
                          <span className="tabular-nums">
                            {
                              group.realities.filter((r) => realities.has(r))
                                .length
                            }
                            /{group.realities.length}
                          </span>
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          {group.realities.map((r) => (
                            <FilterChip
                              key={r}
                              on={realities.has(r)}
                              accent={REALITIES[r].accent}
                              label={t.realityLabel(r)}
                              earth={t.designation(r)}
                              provisional={REALITIES[r].sourcing !== "screen"}
                              onClick={() => toggleReality(r)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                      <FilterChip
                        on={showUpcoming}
                        accent="#9b9a91"
                        label={t.ui.unreleasedFilter}
                        className="col-span-2"
                        onClick={() => setShowUpcoming((up) => !up)}
                      />
                    </div>
                    <p className="text-text-muted mt-2 px-1 text-[11px]">
                      {t.ui.legendNote}
                    </p>
                  </>
                )}
              </div>

              <div className="hairline mx-4" />

              <div className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  {/*
                    A disclosure, not a switch. Collapsing this is a tidying-up
                    gesture, so it must not throw away who you are tracing — the
                    count rides on the header to say they are still lit.
                  */}
                  <button
                    onClick={() => setCharactersOpen((open) => !open)}
                    aria-expanded={charactersOpen}
                    className="group -mx-2 flex min-h-11 w-full items-center justify-between gap-3 px-2 text-left transition-opacity active:opacity-60 lg:-mx-1 lg:min-h-0 lg:px-1 lg:py-0.5"
                  >
                    {/* A section header, not a row. Filling it on hover drew a
                        grey band the width of the whole panel, which reads as
                        selected rather than hovered; brightening the type says
                        the same thing without the slab. The tap area keeps its
                        44px on touch either way. */}
                    <span
                      className={`${RUN_LABEL} group-hover:text-text-primary transition-colors`}
                    >
                      {t.ui.characterView}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {characters.length > 0 && (
                        <span className="text-text-body rounded-full bg-white/[0.09] px-1.5 py-0.5 text-[11px] leading-none tabular-nums">
                          {characters.length}
                        </span>
                      )}
                      <svg
                        viewBox="0 0 12 12"
                        aria-hidden
                        className={`text-text-secondary group-hover:text-text-primary h-3 w-3 transition-transform ${
                          charactersOpen ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M2.5 4.5 6 8l3.5-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </div>

                {charactersOpen && (
                  <div className="mt-2.5">
                    <CharacterPicker
                      value={characters}
                      markedCount={characterTitles.size}
                      onToggle={toggleCharacter}
                      onClear={() => setCharacters([])}
                    />
                  </div>
                )}
              </div>
            </div>
          </animated.div>

          {/* Stays out on the tab: on a phone the slider is the only way to zoom
              without losing your place, and it is what you reach for most. On
              desktop it pins to the foot of the card, so the filters can scroll
              under it while a title is open rather than carrying it off. */}
          <div className="bg-surface lg:sticky lg:bottom-0">
            <div className="hairline mx-4" />
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => {
                  takeCamera();
                  fitAll();
                }}
                className="text-text-secondary hover:text-text-primary -my-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-2 text-[13px] transition-colors hover:bg-white/[0.06] active:bg-white/[0.1] lg:my-0 lg:min-h-0 lg:px-0 lg:text-[12px] lg:hover:bg-transparent"
              >
                {t.ui.fit}
              </button>
              {/* The notch marks 100%: the whole width on screen, and the last
                  zoom that needs no sideways panning. It sits at dead centre of
                  the track, which is exactly where the handle lands on 100 of
                  0–200 — the half-thumb inset the track keeps at each end
                  cancels out at the midpoint, so no thumb-width arithmetic. */}
              <span className="relative -my-2 flex h-11 flex-1 items-center lg:my-0 lg:h-1">
                <input
                  type="range"
                  min={0}
                  max={ZOOM_OVERDRIVE * ZOOM_NOTCH}
                  step={1}
                  value={zoomPercent}
                  onChange={(e) =>
                    applyZoom(zoomAt(snapToNotch(Number(e.target.value))))
                  }
                  onPointerDown={() => (dragging.current = true)}
                  onPointerUp={() => (dragging.current = false)}
                  onPointerCancel={() => (dragging.current = false)}
                  aria-label={t.ui.zoom}
                  className="zoom-slider h-11 w-full cursor-pointer appearance-none bg-transparent lg:h-1 lg:rounded-full lg:bg-white/10"
                />
                {/* After the input, not before: the rail is the input's own
                    background on desktop and a painted track on touch, and
                    either one buries a mark drawn underneath it.

                    Desktop only. The phone's handle is 20px on a 4px track, so
                    a mark under it is either hidden or clutter. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 hidden h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-white/30 lg:block"
                />
              </span>
              <span className="text-text-secondary w-10 text-right text-[12px] tabular-nums">
                {zoomPercent}%
              </span>
            </div>
          </div>

          {/* The drawer pull, phone only. It sits at the bottom of the sheet
              because that is where a thumb already is, and the grip reads as
              draggable even though a tap is all it takes. */}
          {/* Sticky, because with the drawer open the sheet scrolls and a pull
              you have to scroll down to reach is not a pull. */}
          <div className="bg-surface sticky bottom-0 lg:hidden">
            <div className="hairline mx-4" />
            <button
              onClick={() => {
                // The swipe that just fired already toggled it; a click event
                // follows every pointerup, and acting on both cancels it out.
                if (sheetSwipe.justSwiped()) return;
                setFiltersOpen((o) => !o);
              }}
              aria-expanded={filtersOpen}
              className="group flex w-full touch-none flex-col items-center gap-1.5 px-4 pt-2.5 pb-3"
            >
              <span className="h-1 w-10 rounded-full bg-white/20 transition-colors group-hover:bg-white/35" />
              <span className="text-text-secondary group-hover:text-text-primary text-[11px] transition-colors">
                {filtersOpen ? t.ui.hideFilters : t.ui.showFilters}
              </span>
            </button>
          </div>

          {selected && (
            <>
              <div className="hairline mx-4" />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                {[
                  {
                    color: "var(--color-text-primary)",
                    label: t.ui.legendSelected,
                  },
                  {
                    color: "var(--color-required)",
                    label: t.ui.legendWatchFirst,
                  },
                  {
                    color: "var(--color-ancestor)",
                    label: t.ui.legendFurtherBack,
                  },
                ].map((item) => (
                  <span
                    key={item.label}
                    className="text-text-body flex items-center gap-2 text-[12px]"
                  >
                    <span
                      className="h-3 w-3 rounded-sm border-2"
                      style={{ borderColor: item.color }}
                    />
                    {item.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </animated.div>

        {/* No entrance animation here: the details are for reading, and a panel
            that slides every time you click a poster gets tiring fast. */}
        {selected && (
          <div
            {...detailSwipe.swipe}
            /* Open: never less than a readable slab of the column — with the
               filters no longer collapsing, they are what gives way. Folded:
               only as tall as its own bar, because a flex-1 box around it
               would go on swallowing taps meant for the map. */
            className={`pointer-events-auto flex flex-col ${
              collapsedDetail ? "shrink-0" : "min-h-0 flex-1 lg:min-h-[62%]"
            }`}
          >
            <DetailPanel
              titleId={selected}
              activeCharacters={characters}
              maxKind={MAX_KIND}
              onSelectTitle={selectTitle}
              onToggleCharacter={toggleCharacter}
              onClose={() => setSelected(null)}
              collapsed={collapsedDetail}
              onToggleCollapse={
                compact ? () => setDetailCollapsed((c) => !c) : undefined
              }
              onFit={
                compact
                  ? () => {
                      takeCamera();
                      fitAll();
                    }
                  : undefined
              }
            />
          </div>
        )}
      </aside>
    </div>
  );
}

/**
 * One filter, one chip. On: the reality's colour, lit, with the label at full
 * strength. Off: the same dot hollowed out to a ring, so a disabled filter
 * still tells you which colour it stands for on the map. A `provisional`
 * designation is underlined in dots — it comes from a handbook, or from nowhere
 * at all, rather than from anything a film says.
 */
function FilterChip({
  on,
  accent,
  label,
  earth,
  provisional = false,
  onClick,
  className = "",
}: {
  on: boolean;
  accent: string;
  label: string;
  earth?: string;
  provisional?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex min-h-11 items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12.5px] transition-all duration-150 lg:min-h-0 ${
        on
          ? "text-text-primary bg-white/[0.07]"
          : "text-text-secondary hover:text-text-body bg-white/[0.02] hover:bg-white/[0.05]"
      } ${className}`}
      style={{
        boxShadow: on
          ? `inset 0 0 0 1px ${accent}66`
          : "inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-150"
        style={
          on
            ? { backgroundColor: accent, boxShadow: `0 0 8px ${accent}99` }
            : { boxShadow: `inset 0 0 0 1.5px ${accent}`, opacity: 0.45 }
        }
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {earth && (
          <span
            className={`text-text-muted block truncate font-mono text-[10px] ${
              provisional
                ? "underline decoration-dotted underline-offset-2"
                : ""
            }`}
          >
            {earth}
          </span>
        )}
      </span>
    </button>
  );
}

export function MediaMap() {
  return (
    <ReactFlowProvider>
      <MapCanvas />
    </ReactFlowProvider>
  );
}
