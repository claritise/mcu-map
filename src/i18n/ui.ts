import type { PowerTierId } from "~/data/power";
import type { Locale } from "./locale";

/**
 * Every string the interface says in its own voice. Anything that comes out of
 * `src/data` is content rather than chrome and is translated in ./zh instead.
 */
const EN = {
  appName: "MCU Map",
  tagline: "Marvel watch order as a dependency graph",

  searchTitles: "Search titles…",
  /** Shown under the search field when a query lights nothing on the map. */
  noTitleMatch: "No title by that name.",
  /** How many cards the query left lit, e.g. "3 titles". */
  titleMatches: (n: number) => `${n} ${n === 1 ? "title" : "titles"}`,
  hideFilters: "Hide filters",
  showFilters: "Filters",

  realities: "Realities",
  showAll: "Show all",
  unreleasedFilter: "Unreleased",
  legendNote:
    "Each colour is that reality’s accent on the map — warm for Marvel Studios, cool for Fox. A dotted designation is one the films never say out loud.",

  characterView: "Character view",
  on: "On",
  off: "Off",
  findCharacter: "Find a character or actor…",
  noCharacterMatch: "Nobody by that name.",
  /** e.g. "marked in 12 titles" */
  markedIn: (n: number) => `marked in ${n} ${n === 1 ? "title" : "titles"}`,
  clearAll: "Clear all",
  /** Tooltip on a traced chip, e.g. "Stop tracing Rogue". */
  stopTracing: (name: string) => `Stop tracing ${name}`,

  /** The roster's ordering. Appearances is the useful one; power is the fun one. */
  sortBy: "Sort",
  sortAppearances: "Appearances",
  sortPower: "Power (TeeHee)",
  /** Said out loud under the roster the moment power ordering is on, because
      the numbers are an opinion and pretending otherwise is the annoying part. */
  powerDisclaimer: "Power levels are one editor's opinion. Argue freely.",
  /** Tooltip on a power badge, e.g. "Power 50,100 · Cosmic". */
  powerOf: (n: string, tier: string) => `Power ${n} · ${tier}`,
  unrated: "Unrated",
  powerTier: {
    abstract: "Abstract",
    cosmic: "Cosmic",
    planetary: "Planetary",
    heavy: "Heavy hitter",
    field: "Field team",
    street: "Street level",
    civilian: "Civilian",
  } as Record<PowerTierId, string>,

  fit: "Fit",
  zoom: "Zoom",

  legendSelected: "Selected",
  legendWatchFirst: "Watch first",
  legendFurtherBack: "Further back",

  closePanel: "Close panel",
  /** Phone only: the details fold down to a title bar, still selected. */
  minimizePanel: "Minimise details",
  expandPanel: "Show details",
  /** e.g. "Iron Man artwork" */
  artworkAlt: (name: string) => `${name} artwork`,
  unreleased: "unreleased",
  /** Prefixes the list of other realities a title spends time in. */
  alsoIn: "Also in",
  episodes: (n: number) => `${n} episodes`,
  directedBy: "Directed by",
  createdBy: "Created by",

  watchFirst: "Watch first",
  hideFullOrder: "hide full order",
  fullOrder: (n: number) => `full order · ${n}`,
  /**
   * Rides on the "Nice to have" group. Those edges are real and carry real
   * reasons, but the canvas stops at `recommended` — so the panel says which
   * of its rows the map is not going to light up for you.
   */
  notDrawn: "not drawn on the map",
  noPrerequisites: "Nothing. This is a valid place to start.",
  setsUp: "Sets up",
  characters: "Characters",
  clickToTrace: "click to trace",
  noCast: "No cast recorded yet.",
  /** The continuity a visiting character belongs to, e.g. "Fox X-Men version". */
  versionOf: (universe: string) => `${universe} version`,

  kindEssential: "Essential",
  kindRecommended: "Recommended",
  kindOptional: "Nice to have",
  /** Lower-case, for the hover card on a card in the map. */
  kindEssentialShort: "essential",
  kindRecommendedShort: "recommended",
  kindOptionalShort: "nice to have",
  watchFirstShort: "watch first",
  soon: "soon",

  whereToWatch: "Where to watch",

  /** Shown in place of a designation for a reality that has none on record. */
  unlistedReality: "unlisted reality",

  language: "Language",
};

type Strings = typeof EN;

const ZH: Strings = {
  appName: "漫威宇宙地图",
  tagline: "以依赖关系图呈现的漫威观影顺序",

  searchTitles: "搜索作品…",
  noTitleMatch: "没有同名的作品。",
  titleMatches: (n: number) => `${n} 部作品`,
  hideFilters: "收起筛选",
  showFilters: "筛选",

  realities: "现实",
  showAll: "全部显示",
  unreleasedFilter: "未上映",
  legendNote:
    "每种颜色对应该现实在地图上的主色 —— 暖色是漫威影业，冷色是福斯。虚线下划线的编号，是电影里从未说出口的那些。",

  characterView: "角色视图",
  on: "开",
  off: "关",
  findCharacter: "查找角色或演员…",
  noCharacterMatch: "没有找到这个名字。",
  markedIn: (n: number) => `已在 ${n} 部作品中标记`,
  clearAll: "全部清除",
  stopTracing: (name: string) => `取消追踪${name}`,

  sortBy: "排序",
  sortAppearances: "出场数",
  sortPower: "战力（嘿嘿）",
  powerDisclaimer: "战力数值纯属一家之言，欢迎开吵。",
  powerOf: (n: string, tier: string) => `战力 ${n} · ${tier}`,
  unrated: "未评级",
  powerTier: {
    abstract: "抽象层级",
    cosmic: "宇宙级",
    planetary: "行星级",
    heavy: "重量级",
    field: "一线战力",
    street: "街头层面",
    civilian: "普通人",
  },

  fit: "适应",
  zoom: "缩放",

  legendSelected: "已选中",
  legendWatchFirst: "先看这些",
  legendFurtherBack: "更早的前置",

  closePanel: "关闭面板",
  minimizePanel: "收起详情",
  expandPanel: "展开详情",
  artworkAlt: (name: string) => `《${name}》剧照`,
  unreleased: "未上映",
  alsoIn: "也发生在",
  episodes: (n: number) => `${n} 集`,
  directedBy: "导演",
  createdBy: "主创",

  watchFirst: "先看这些",
  hideFullOrder: "收起完整顺序",
  fullOrder: (n: number) => `完整顺序 · ${n}`,
  notDrawn: "地图上不绘制",
  noPrerequisites: "没有前置。这里可以直接作为起点。",
  setsUp: "为后续铺垫",
  characters: "角色",
  clickToTrace: "点击追踪",
  noCast: "暂无演员表记录。",
  versionOf: (universe: string) => `${universe}版本`,

  kindEssential: "必看",
  kindRecommended: "推荐",
  kindOptional: "锦上添花",
  kindEssentialShort: "必看",
  kindRecommendedShort: "推荐",
  kindOptionalShort: "锦上添花",
  watchFirstShort: "先看这部",
  soon: "即将",

  whereToWatch: "去哪看",

  unlistedReality: "无编号现实",

  language: "语言",
};

export const UI: Record<Locale, Strings> = { en: EN, zh: ZH };
