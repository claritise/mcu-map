"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import {
  MarkerType,
  PanOnScrollMode,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
} from "@xyflow/react";

import { DEPENDENCIES } from "~/data/dependencies";
import { CHARACTER_BY_ID } from "~/data/characters";
import { TITLES, TITLE_BY_ID } from "~/data/titles";
import type { DepKind, RealityId } from "~/data/types";
import {
  ZOOM_NOTCH,
  ZOOM_OVERDRIVE,
  ZOOM_SNAP,
  type Box,
  type FrameBox,
} from "~/lib/camera";
import {
  CARD,
  DEP_RANK,
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
import { useMapCamera } from "./use-map-camera";
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
  const wrapper = useRef<HTMLDivElement>(null);

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

  /**
   * How much of the map pane the chrome is sitting on top of. What the camera
   * does with it is `~/lib/camera`'s business; measuring it is this
   * component's, because it is this component's sheet.
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
   * The laid-out graph's box, which is everything the camera is aimed at. The
   * year labels hang off the left of every row, so the content is NOT
   * symmetric around flow-x 0 — which is why the camera centres on this box
   * rather than on the origin, or the gutter falls off the edge at high zoom.
   */
  const contentBox = useMemo<Box>(() => {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const t of visible) {
      const at = positions.get(t.id);
      if (!at) continue;
      left = Math.min(left, at.x);
      right = Math.max(right, at.x + CARD[t.medium].w);
      top = Math.min(top, at.y);
      bottom = Math.max(bottom, at.y + CARD[t.medium].h);
    }
    if (!Number.isFinite(left)) return { left: 0, right: 1, top: 0, bottom: 1 };
    return { left, right, top, bottom };
  }, [visible, positions]);

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
   * What the camera has to keep on screen on a phone: the title you just
   * opened and every title it draws a line to. The arrows need both ends in
   * the band to say anything.
   *
   * Null the rest of the time — on a laptop, with nothing open, or with the
   * details folded down to their title bar, which is a gesture for getting the
   * MAP back and so exactly when the camera should be left alone.
   */
  const selectionBox = useMemo<FrameBox | null>(() => {
    if (!compact || !selected || detailCollapsed) return null;
    const at = positions.get(selected);
    const title = TITLE_BY_ID.get(selected);
    if (!at || !title) return null;

    const box: FrameBox = {
      headTop: at.y,
      top: at.y,
      bottom: at.y + CARD[title.medium].h,
      left: at.x,
      right: at.x + CARD[title.medium].w,
    };
    for (const id of direct.keys()) {
      const parent = positions.get(id);
      const parentTitle = TITLE_BY_ID.get(id);
      if (!parent || !parentTitle) continue;
      const card = CARD[parentTitle.medium];
      box.top = Math.min(box.top, parent.y);
      box.bottom = Math.max(box.bottom, parent.y + card.h);
      box.left = Math.min(box.left, parent.x);
      box.right = Math.max(box.right, parent.x + card.w);
    }
    return box;
  }, [compact, selected, detailCollapsed, positions, direct]);

  /**
   * The camera, and the only thing that moves it.
   *
   * Everything below reads it — the rail, the pan bounds, the readout — and
   * nothing else writes it. See `~/lib/camera` for what the five writers it
   * replaced were, and which bug each one of them was patched into existence
   * by.
   */
  const camera = useMapCamera({
    pane: wrapper,
    compact,
    railW,
    railGap,
    bottomInset,
    content: contentBox,
    /* Our own layout is the trigger, not React Flow's node measurements: this
       counts the cards a filter left on the map. */
    layoutKey: `${visible.length}`,
    frame: selectionBox,
  });

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
          onMove={(_, view) => camera.report(view)}
          /* The settle still gets its own call. `onMove` is throttled to the
             frame, so the last few pixels of a flick can land after it. */
          onMoveEnd={(_, view) => camera.report(view)}
          /* React Flow's stylesheet loads after globals.css and paints its own
             #141414, which reads as a seam against the chrome column. */
          style={{ backgroundColor: "var(--color-canvas-bg)" }}
          proOptions={{ hideAttribution: true }}
          colorMode="dark"
          minZoom={camera.minZoom}
          maxZoom={camera.maxZoom}
          /*
           * Scrolling stops at the ends of the graph rather than drifting off
           * into empty space, but ONLY vertically. d3-zoom refuses to let the
           * extent be smaller than the viewport, so a horizontal bound on this
           * narrow column silently forced the zoom up and broke "fit".
           */
          translateExtent={camera.translateExtent}
          /* Past 100% the widest rows run off both edges, so the map has to be
             draggable sideways to be readable at all — below it the graph fits
             across and a horizontal drag would only shove it off-centre. */
          panOnDrag={compact || camera.beyondFull}
          panOnScroll
          /* Default is 0.5, barely half a wheel notch per scroll, which is a
             slog on a graph this tall. */
          panOnScrollSpeed={1.6}
          panOnScrollMode={
            compact || camera.beyondFull
              ? PanOnScrollMode.Free
              : PanOnScrollMode.Vertical
          }
          zoomOnScroll={false}
          zoomOnPinch={compact}
          zoomOnDoubleClick={false}
        ></ReactFlow>

        <YearRail
          titles={visible}
          viewport={camera.view}
          height={camera.paneHeight}
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
                onClick={camera.fit}
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
                  value={camera.percent}
                  onChange={(e) =>
                    camera.zoomToPercent(snapToNotch(Number(e.target.value)))
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
                {camera.percent}%
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
              onFit={compact ? camera.fit : undefined}
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
