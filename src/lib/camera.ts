import { EDGE_MARGIN } from "./graph";

/**
 * Everything that moves the map's camera, as one machine.
 *
 * The camera used to have five writers — the opening shot, the fit, the
 * slider, the resize handler and the phone's selection framing — each calling
 * `setViewport` from its own effect, and seven values that routinely change in
 * the same commit to set them off. When two fired together the winner was
 * whichever effect was declared further down the file, and every bug that came
 * out of that was patched with another guard ref: four of them by the end,
 * standing in for state nobody had written down.
 *
 * So this module is that state, written down. It is pure — no React, no
 * `setViewport` — because the whole point is that the DECISION and the WRITE
 * are separate: transitions here return the shot they want, and exactly one
 * effect in `use-map-camera` applies whichever shot the machine settled on.
 * Being pure also makes the geometry testable without a DOM.
 */

/**
 * How far past "the whole width fits" the slider goes. 2 = 200%: at the notch
 * the widest row spans the stage, at the end each poster is twice that size and
 * the map is something you read rather than survey.
 */
export const ZOOM_OVERDRIVE = 2;

/** Where the notch sits on the track, as a slider value. */
export const ZOOM_NOTCH = 100;

/** How near the notch a dragged handle has to come before it snaps onto it. */
export const ZOOM_SNAP = 5;

/** Air left around a framed selection, in flow units. */
const FRAME_PAD = 24;

/** A rectangle in flow coordinates. */
export type Box = { left: number; right: number; top: number; bottom: number };

export const spanX = (b: Box) => Math.max(1, b.right - b.left);
export const spanY = (b: Box) => Math.max(1, b.bottom - b.top);
export const midX = (b: Box) => (b.left + b.right) / 2;

/**
 * The selection to keep on screen on a phone: the tapped title plus every
 * title it draws a line to.
 */
export type FrameBox = Box & {
  /**
   * The tapped card's own top edge. Not the same as `top`: when the chain is
   * too tall to fit, the shot pins THIS card near the top of the band and lets
   * the prerequisites run off the bottom, rather than centring the whole box
   * and putting the thing you tapped somewhere off screen.
   */
  headTop: number;
};

/**
 * Everything a shot is computed from. One snapshot per transition, so the
 * numbers a move lands on are the same numbers the readout is rendering.
 */
export type Geometry = {
  paneWidth: number;
  paneHeight: number;
  /** The year rail and its gutter, reserved out of the left of the pane. */
  railW: number;
  railGap: number;
  /**
   * How much of the map pane the chrome is sitting on top of.
   *
   * On a phone the controls and the detail panel are a sheet floating over the
   * bottom of the map rather than a column beside it, so the pane is taller
   * than the part of it anyone can actually see. Every figure below works from
   * the visible band instead — fit into it, centre in it, anchor the zoom in
   * it — and the pan extent carries the oldest row up out from under it.
   *
   * Without this the first decade of the timeline sat permanently behind the
   * search field: at fit zoom on a 375×812 phone, thirteen cards — X-Men,
   * Spider-Man, Daredevil, the 2005 Fantastic Four, Iron Man itself — were
   * under the sheet with no way to reach them. Which is exactly how people
   * came to report titles as missing that were on the map all along.
   */
  bottomInset: number;
  compact: boolean;
  /** The laid-out graph's box. */
  content: Box;
};

/** A camera position. Everything this module computes is one of these. */
export type Shot = { x: number; y: number; zoom: number };

/** Everything the camera actually has to play with, once the rail is reserved. */
export const stageWidth = (g: Geometry) =>
  Math.max(120, g.paneWidth - g.railW - g.railGap);

/**
 * The inset the camera's BOUNDS work from, which is not the same number as
 * `bottomInset`.
 *
 * Reserving the controls sheet is the whole point — that is what kept the
 * first decade of the timeline reachable. Reserving the detail panel is not:
 * it opens over 70% of the screen, and deciding what "fit" means against the
 * remaining 30% squeezed twenty-eight years into 244px, put every poster at
 * seven pixels and dropped the dependency lines altogether. So the fit never
 * gives up more than a third of the pane, and a title being open moves the
 * camera through `frameShot` instead.
 */
export const fitInset = (g: Geometry) =>
  Math.min(g.bottomInset, Math.round(g.paneHeight * 0.34));

/** What `fit` and the zoom floor are measured against. */
export const fitHeight = (g: Geometry) =>
  Math.max(120, g.paneHeight - fitInset(g));

/** The widest row exactly spanning the stage, before the phone's floor. */
const spansTheStage = (g: Geometry) =>
  Math.min(2, Math.max(0.1, stageWidth(g) / spanX(g.content)));

/** 100% on the slider: the widest row spans the stage, clear of the rail. */
export const fullZoom = (g: Geometry) =>
  // On a phone the widest row cannot fit across at any readable size, so
  // capping the zoom there would leave every poster a smudge. Let it reach
  // legible size and let the graph run off the sides — that is what panning is
  // for.
  g.compact ? Math.max(spansTheStage(g), 1) : spansTheStage(g);

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
export const maxZoom = (g: Geometry) => fullZoom(g) * ZOOM_OVERDRIVE;

/**
 * 0% on the slider: the whole graph in view, with a margin above the newest
 * row and below the oldest. The pan extent picks that same margin up, so the
 * ends of the timeline never sit flush against the edge of the pane.
 */
export const fitZoom = (g: Geometry) =>
  Math.min(fullZoom(g), fitHeight(g) / (spanY(g.content) + EDGE_MARGIN * 2));

/** True once the graph is wider than the stage and has to be panned across. */
export const beyondFull = (g: Geometry, zoom: number) =>
  zoom > fullZoom(g) * 1.001;

/**
 * In timeline mode the camera is rail-mounted: the graph stays centred,
 * scrolling only moves it up and down, and zoom comes from the slider.
 *
 * The year labels hang off the left of every row, so the content is NOT
 * symmetric around flow-x 0 — centring on the content's own midpoint rather
 * than on zero is what keeps the gutter from falling off the edge at high zoom.
 */
export const centreX = (g: Geometry, zoom: number) =>
  g.railW + g.railGap + stageWidth(g) / 2 - midX(g.content) * zoom;

/**
 * Our own fit rather than React Flow's: theirs centres on the whole pane and
 * would tuck the leftmost column under the year rail.
 *
 * Note this reaches for the raw `spansTheStage` rather than `fullZoom`. The
 * phone's floor of 1 exists to keep posters legible when the graph cannot fit
 * across; honouring it HERE would mean "fit" zoomed in until the map ran off
 * both sides, which is the one thing fit is for. The consequence is that on a
 * phone the fit can land below `fitZoom` (the slider's 0% and React Flow's
 * `minZoom`), which is why the readout clamps before it reports a percentage.
 */
export function fitShot(g: Geometry): Shot {
  const height = spanY(g.content);
  const stage = stageWidth(g);
  /* The band, not the pane: fitting into glass the phone's chrome is sitting
     on top of is how the oldest rows ended up behind the search field. */
  const band = fitHeight(g);
  const zoom = Math.min(spansTheStage(g), band / (height + EDGE_MARGIN * 2));
  return {
    x: g.railW + g.railGap + stage / 2 - midX(g.content) * zoom,
    y: (band - height * zoom) / 2 - g.content.top * zoom,
    zoom,
  };
}

/**
 * The opening shot, which is not the same move as a re-fit.
 *
 * The map opens at the notch — 100%, the widest row exactly spanning the
 * stage — rather than at the whole-graph fit. Fitting twenty-five years of
 * releases into one pane puts every poster at thumbnail size: it shows you the
 * SHAPE of the thing and none of the content, which is a diagram of a map
 * rather than a map. At the notch the posters are legible and the graph is
 * still as wide as the screen, so the first thing on screen is something you
 * can read. Fit is one click away and still what every later re-fit uses.
 *
 * Vertically it lands centred, because that is precisely where you arrive if
 * you open the app and drag the slider to 100% yourself — the track anchors
 * zoom on the middle of the pane. Same zoom, same view, either way you get
 * there.
 */
export function openShot(g: Geometry): Shot {
  const height = spanY(g.content);
  const zoom = fullZoom(g);
  return {
    x: centreX(g, zoom),
    y: fitHeight(g) / 2 - (g.content.top + height / 2) * zoom,
    zoom,
  };
}

/**
 * Which of the two the map opens on.
 *
 * Desktop gets the notch. On a phone `fullZoom` is floored at 1 because the
 * widest row cannot fit across at any readable size, so opening there at
 * "100%" would drop you mid-pan into a graph with no edges in sight and
 * nothing to tell you which way the rest of it lies. The phone keeps the
 * whole-graph fit.
 */
export const openingShot = (g: Geometry): Shot =>
  g.compact ? fitShot(g) : openShot(g);

/**
 * A resize is not a reason to throw away where you were: keep the zoom (just
 * clamped into the new bounds) and re-centre on the new pane.
 */
export function resizeShot(g: Geometry, from: Shot): Shot {
  const zoom = Math.min(maxZoom(g), Math.max(fitZoom(g), from.zoom));
  return { x: centreX(g, zoom), y: from.y, zoom };
}

/** Slider zoom, anchored on the middle of the screen rather than the origin. */
export function sliderShot(g: Geometry, from: Shot, to: number): Shot {
  const zoom = Math.min(maxZoom(g), Math.max(fitZoom(g), to));
  /* The middle of the visible band, not of the pane: on a phone the pane's own
     midpoint can be behind the sheet, and zooming towards a point you cannot
     see walks the map out from under you. */
  const anchor = Math.max(120, g.paneHeight - g.bottomInset) / 2;
  /*
   * Up to 100% the graph is narrower than the stage and stays centred on it.
   * Past that it no longer fits, so the camera holds whatever is in the middle
   * of the stage instead — snapping back to the content's centre would throw
   * away the sideways panning you did to get to a poster.
   */
  const stageMid = g.railW + g.railGap + stageWidth(g) / 2;
  return {
    x:
      zoom <= fullZoom(g)
        ? centreX(g, zoom)
        : stageMid - ((stageMid - from.x) * zoom) / from.zoom,
    y: anchor - ((anchor - from.y) * zoom) / from.zoom,
    zoom,
  };
}

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
 * is the shot the tap was asking for — this one, and what you watch before it,
 * at a size where the lines read.
 *
 * `bottomInset` here, not `fitInset`: this shot's whole job is to put the card
 * in the strip of map the sheet is not covering, so it works from the sheet's
 * real height.
 */
export function frameShot(
  g: Geometry,
  box: FrameBox,
  currentZoom: number,
): Shot {
  const band = Math.max(120, g.paneHeight - g.bottomInset);
  const stage = stageWidth(g);
  const zoom = Math.min(
    maxZoom(g),
    Math.max(
      // Never below the current zoom: closing in is welcome, being pushed
      // further out because a chain is wide is not.
      currentZoom,
      Math.min(
        stage / (spanX(box) + FRAME_PAD * 2),
        band / (spanY(box) + FRAME_PAD * 2),
      ),
    ),
  );

  const onScreen = (box.bottom - box.top) * zoom;
  return {
    x: g.railW + g.railGap + stage / 2 - midX(box) * zoom,
    /* Taller than the band even so: pin the selection near the top and let the
       chain run off past it, rather than shrinking it back to a smudge. */
    y:
      onScreen > band - FRAME_PAD
        ? FRAME_PAD - box.headTop * zoom
        : (band - onScreen) / 2 - box.top * zoom,
    zoom,
  };
}

/**
 * The slider is a plain 0–200 and the zoom is derived from it. Ranging it over
 * the zoom values themselves meant the float step grid never landed exactly on
 * the notch, so the handle always stopped a step short of 100%.
 *
 * The two halves are read differently, because they answer different
 * questions. Below the notch, "how much of the map is on screen": 0% is the
 * whole thing and 100% is the width of it, so the percentage is of the span
 * between them. Above it, "how big is a poster": 200% is twice the size a
 * poster is at the notch, so the percentage is a plain multiple. They meet at
 * 100%, which means the same zoom either way you arrive at it.
 */
export function zoomPercent(g: Geometry, zoom: number) {
  const full = fullZoom(g);
  const fit = fitZoom(g);
  const span = Math.max(0.0001, full - fit);
  const value = Math.min(maxZoom(g), Math.max(fit, zoom));
  return Math.round(
    value <= full ? ((value - fit) / span) * 100 : (value / full) * 100,
  );
}

/** The inverse, for the handle the user just dragged. */
export function zoomAtPercent(g: Geometry, percent: number) {
  const full = fullZoom(g);
  const fit = fitZoom(g);
  return percent <= ZOOM_NOTCH
    ? fit + (percent / ZOOM_NOTCH) * Math.max(0.0001, full - fit)
    : (percent / ZOOM_NOTCH) * full;
}

/**
 * Extra room at the bottom of the pan extent, worth exactly the height of the
 * sheet, so the last row can be scrolled up clear of it instead of stopping
 * dead underneath.
 *
 * Quantised to 5% steps of the zoom. The extent's identity has to stay stable
 * across a moving camera (see `translateExtent` in the hook), and a raw zoom in
 * the denominator would hand d3 a fresh array on every frame of a pinch.
 */
export function insetSlack(g: Geometry, zoom: number) {
  if (!g.bottomInset) return 0;
  const step = Math.max(fitZoom(g), Math.round(zoom * 20) / 20, 0.02);
  return g.bottomInset / step;
}

/**
 * Panning stops dead at the first and last row: the extent IS the content. The
 * only slack is what's needed when the graph is shorter than the pane —
 * d3-zoom refuses an extent smaller than the viewport and would force the zoom
 * up to compensate.
 */
export function verticalSlack(g: Geometry) {
  const fit = Math.max(fitZoom(g), 0.02);
  return Math.max(
    0,
    (fitHeight(g) / fit - (g.content.bottom - g.content.top)) / 2,
  );
}

/* ───────────────────────────── the machine ───────────────────────────── */

/**
 * Who the camera belongs to.
 *
 * `opening` until the user first takes it. The opening shot cannot be a single
 * call: the pane's size arrives in stages — a default, then the real
 * measurement, then whatever the sidebar settles at — and `fullZoom` moves
 * with it. Firing once against the first of those figures left the camera at a
 * zoom the finished layout called 121%: the notch had moved underneath it. So
 * the opening re-asserts itself on every measurement until somebody chooses a
 * zoom, at which point it stops for good and never touches the camera again.
 */
export type CameraOwner = "opening" | "user";

export type CameraState = {
  /**
   * Where the camera is, as far as everything reading it is concerned: the
   * zoom readout, the year rail, and whether the map pans sideways.
   */
  view: { y: number; zoom: number };
  owner: CameraOwner;
  /** The layout this camera has already been aimed for. */
  layout: string;
  /** The pane measurement this camera has already been aimed for. */
  pane: string;
  /** True while a phone selection is being kept in the band. */
  framed: boolean;
  /**
   * The move the machine has settled on. The hook applies it and nothing else;
   * a new object is the signal to apply, so an unchanged shot means "the
   * camera is already where I want it, don't touch it".
   */
  shot: Shot | null;
};

export type CameraAction =
  /** React Flow reported a move. Readout only — this never aims the camera. */
  | { type: "moved"; view: { y: number; zoom: number } }
  /** The graph was re-laid out: a filter changed, or this is first paint. */
  | { type: "layout"; key: string; geo: Geometry }
  /** The pane, the chrome or the breakpoint measured differently. */
  | { type: "pane"; key: string; geo: Geometry; from: Shot }
  /**
   * Phone: keep this selection in the band the sheet leaves. `floor` is the
   * zoom the camera is already at, which the shot will not go below.
   */
  | { type: "frame"; geo: Geometry; box: FrameBox; floor: number }
  /** Nothing is selected any more; the camera is free again. */
  | { type: "unframe" }
  /** The user pressed Fit. */
  | { type: "fit"; geo: Geometry }
  /** The user moved the slider. */
  | { type: "slider"; geo: Geometry; from: Shot; to: number };

export const initialCamera: CameraState = {
  view: { y: 0, zoom: 0.4 },
  owner: "opening",
  layout: "",
  pane: "",
  framed: false,
  shot: null,
};

const sameShot = (a: Shot | null, b: Shot) =>
  !!a && a.x === b.x && a.y === b.y && a.zoom === b.zoom;

/**
 * Aim a shot that the machine decided on by itself.
 *
 * Identity is what tells the hook to move, so a shot equal to the standing one
 * keeps the object it had. That is what makes these transitions safely
 * re-entrant: the framing re-runs on the very zoom it just set, and would
 * otherwise dispatch itself forever.
 */
function aim(state: CameraState, shot: Shot): CameraState {
  if (sameShot(state.shot, shot)) return state;
  return { ...state, shot, view: { y: shot.y, zoom: shot.zoom } };
}

/**
 * Aim a shot the user asked for, and hand them the camera.
 *
 * Always a fresh object, unlike `aim`: press Fit, pan away, press Fit again —
 * that is the same shot twice and it has to be obeyed both times.
 */
function take(state: CameraState, shot: Shot): CameraState {
  return {
    ...state,
    owner: "user",
    shot,
    view: { y: shot.y, zoom: shot.zoom },
  };
}

export function cameraReducer(
  state: CameraState,
  action: CameraAction,
): CameraState {
  switch (action.type) {
    case "moved":
      if (
        state.view.y === action.view.y &&
        state.view.zoom === action.view.zoom
      ) {
        return state;
      }
      return { ...state, view: action.view };

    case "layout": {
      if (state.layout === action.key) return state;
      const next = { ...state, layout: action.key };
      /* Still opening: the opening shot, not a fit — the two are different
         moves and only one of them is what first paint should look like. */
      return aim(
        next,
        next.owner === "opening"
          ? openingShot(action.geo)
          : fitShot(action.geo),
      );
    }

    case "pane": {
      if (state.pane === action.key) return state;
      const next = { ...state, pane: action.key };
      /*
       * A framed selection outranks a re-measure. Every input the framing
       * works from is part of this key, so the framing is re-aiming against
       * the new size in this very commit; both used to fire and the framing
       * only won because its effect was declared further down the file. On a
       * phone deep link — where the sheet's height only arrives after the
       * detail panel has rendered — that race was the difference between
       * landing on the title and landing on the whole map.
       */
      if (next.framed) return next;
      return aim(
        next,
        next.owner === "opening"
          ? openingShot(action.geo)
          : resizeShot(action.geo, action.from),
      );
    }

    case "frame":
      return aim(
        { ...state, framed: true },
        frameShot(action.geo, action.box, action.floor),
      );

    case "unframe":
      // Deliberately no shot: letting a title go leaves the map where reading
      // it left you, rather than yanking the camera back.
      return state.framed ? { ...state, framed: false } : state;

    case "fit":
      return take(state, fitShot(action.geo));

    case "slider":
      return take(state, sliderShot(action.geo, action.from, action.to));
  }
}
