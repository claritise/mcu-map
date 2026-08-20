import type { BannerId, DepKind, Medium, RealityId } from "~/data/types";

/** Studio banners. */
export const ZH_BANNERS: Record<BannerId, string> = {
  marvel: "漫威影业",
  fox: "二十世纪福斯",
  sony: "索尼",
  newline: "新线影业",
  lionsgate: "狮门影业",
  universal: "环球影业",
  newworld: "新世界影业",
};

/** Reality names and the one-liner that explains each. */
export const ZH_REALITIES: Record<RealityId, { label: string; blurb: string }> =
  {
    "earth-616": {
      label: "神圣时间线",
      blurb: "漫威电影宇宙主线，自《钢铁侠》起。",
    },
    "earth-838": {
      label: "光照会的地球",
      blurb: "《疯狂多元宇宙》里斯特兰奇和阿美莉卡落脚的那个世界。",
    },
    "earth-828": {
      label: "《初露锋芒》的地球",
      blurb: "复古未来主义的世界，神奇四侠是那里唯一的英雄。",
    },
    "earth-10005": {
      label: "福斯 X战警",
      blurb: "二十年的 X 战警，死侍也算在内 —— 编号由时间变异管理局亲口报出。",
    },
    "earth-121698": {
      label: "福斯 神奇四侠",
      blurb: "2005 年与 2007 年的两部《神奇四侠》。",
    },
    "fox-ff-2015": {
      label: "《神奇四侠》2015",
      blurb: "2015 年的重启版：自成一个现实，且没有任何编号记录在案。",
    },
    "earth-701306": {
      label: "福斯 街头层面",
      blurb: "阿弗莱克版夜魔侠，以及《艾丽卡》衍生片。",
    },

    // ── Sony ───────────────────────────────────────────────────────────────
    "earth-96283": {
      label: "雷米版蜘蛛侠",
      blurb: "托比·马奎尔的三部曲 —— 以及《英雄无归》里一半的反派。",
    },
    "earth-120703": {
      label: "超凡蜘蛛侠",
      blurb: "安德鲁·加菲尔德的两部电影，还有格温·斯泰西。",
    },
    "earth-688": {
      label: "索尼蜘蛛侠宇宙",
      blurb:
        "毒液、莫比亚斯、猎人克莱文和蜘蛛夫人：一个没有蜘蛛侠的蜘蛛侠宇宙。",
    },
    "earth-1610b": {
      label: "迈尔斯的布鲁克林",
      blurb: "动画版蜘蛛宇宙的母世界 —— 电影里把编号打在了银幕上。",
    },
    "earth-616-atsv": {
      label: "彼得·B 的地球",
      blurb: "《平行宇宙》里的 Earth-616。编号与漫威宇宙相同，世界完全不同。",
    },
    "earth-65": {
      label: "格温的地球",
      blurb: "在那里被咬的是格温·斯泰西。",
    },
    "earth-90214": {
      label: "暗影蜘蛛侠的 1933 年",
      blurb: "黑白的纽约，以及一个打纳粹的蜘蛛侠。",
    },
    "earth-928": {
      label: "2099 年的新纽约",
      blurb: "米格尔·奥哈拉的未来，也是蜘蛛联盟的基地。",
    },
    "ghost-rider-films": {
      label: "凯奇版恶灵骑士",
      blurb: "哥伦比亚的两部《恶灵骑士》。没有官方编号。",
    },
    "earth-616-tv": {
      label: "漫威电视",
      blurb:
        "《神盾局特工》《特工卡特》《异人族》《逃亡者》《斗篷与匕首》。它们不断提及电影，电影却从未回应。",
    },
    "blade-trilogy": {
      label: "刀锋战士",
      blurb: "新线的三部曲 —— 证明漫威改编能成立的那部片子。",
    },
    "universal-hulk": {
      label: "李安版绿巨人",
      blurb:
        "2003 年的《绿巨人浩克》。无论《无敌浩克》怎么暗示，它自成一个世界。",
    },
    "punisher-2004": {
      label: "惩罚者（2004）",
      blurb: "托马斯·简版的弗兰克·卡斯尔。",
    },
    "punisher-war-zone": {
      label: "惩罚者：战争特区",
      blurb: "四年后的重启，换了一位弗兰克。",
    },
    "punisher-1989": {
      label: "惩罚者（1989）",
      blurb: "多尔夫·龙格尔版，也是银幕上第一位漫威惩罚者。",
    },
  };

/**
 * Runs of history inside one reality — Days of Future Past leaves Earth-10005
 * with two of everybody.
 */
export const ZH_TIMELINES: Record<string, string> = {
  "Original timeline": "原始时间线",
  "First Class era": "《第一战》时间线",
  "Friendly Neighborhood timeline": "《友好邻居》时间线",
};

/** Where a reality's designation comes from. */
export const ZH_SOURCING: Record<"screen" | "handbook" | "unofficial", string> =
  {
    screen: "片中言明",
    handbook: "官方手册",
    unofficial: "无官方编号",
  };

export const ZH_MEDIUM: Record<Medium, string> = {
  film: "电影",
  series: "剧集",
  special: "特别篇",
};

export const ZH_KIND: Record<DepKind, string> = {
  essential: "必看",
  recommended: "推荐",
  optional: "锦上添花",
};

export const ZH_SAGAS: Record<string, string> = {
  "Infinity Saga": "无限传奇",
  "Multiverse Saga": "多元宇宙传奇",
  "Unannounced Saga": "尚未公布的传奇",
  "Fox X-Men: Original Timeline": "福斯X战警：原始时间线",
  "Fox X-Men: Prequel Timeline": "福斯X战警：前传时间线",
  "Fox X-Men: Deadpool": "福斯X战警：死侍",
  "Fox Fantastic Four": "福斯神奇四侠",
  "Fox Street Level": "福斯街头层面",
  "Raimi trilogy": "雷米三部曲",
  "The Amazing Spider-Man": "超凡蜘蛛侠",
  "Sony's Spider-Man Universe": "索尼蜘蛛侠宇宙",
  "Spider-Verse": "蜘蛛宇宙",
  "Marvel Television": "漫威电视",
  "Marvel Netflix": "漫威网飞",
  "The Punisher on Film": "银幕上的惩罚者",
  "Blade Trilogy": "刀锋战士三部曲",
  "Ang Lee's Hulk": "李安版绿巨人",
  "Ghost Rider": "恶灵骑士",
};

/** Full phase names, as they appear in the data. */
export const ZH_PHASES: Record<string, string> = {
  "Phase One": "第一阶段",
  "Phase Two": "第二阶段",
  "Phase Three": "第三阶段",
  "Phase Four": "第四阶段",
  "Phase Five": "第五阶段",
  "Phase Six": "第六阶段",
};

/** The short form the year rail prints down its spine. */
export const ZH_PHASES_SHORT: Record<string, string> = {
  "Phase 1": "第一阶段",
  "Phase 2": "第二阶段",
  "Phase 3": "第三阶段",
  "Phase 4": "第四阶段",
  "Phase 5": "第五阶段",
  "Phase 6": "第六阶段",
};

/** `CastEntry.note`: how a character turns up in a given title. */
export const ZH_CAST_NOTES: Record<string, string> = {
  crossover: "跨剧集客串",
  "as Roarke": "饰罗尔克",
  cameo: "客串",
  "PSA cameo": "公益短片客串",
  "post-credits": "片尾彩蛋",
  "post-credits hammer": "片尾彩蛋：神锤",
  "post-credits tease": "片尾彩蛋预告",
  "mid-credits": "中段彩蛋",
  flashback: "闪回",
  future: "未来",
  finale: "最终集",
  recording: "录像",
  referenced: "被提及",
  variants: "变体",
  visions: "幻象",
  "as a child": "童年版",
  "cage fight": "笼斗",
  Illuminati: "光照会",
  "as He Who Remains": "存续者身份",
  "as Weapon XI": "武器XI身份",
};
