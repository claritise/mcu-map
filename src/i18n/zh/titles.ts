/**
 * Simplified-Chinese names and blurbs, keyed by title id. Names follow the
 * mainland release titles where one exists; unreleased and never-released-here
 * projects get the commonly used fan rendering.
 *
 * A missing id falls back to the English text rather than showing a gap.
 */
export const ZH_TITLES: Record<string, { name: string; blurb: string }> = {
  // ── MCU: Infinity Saga ────────────────────────────────────────────────
  "iron-man": {
    name: "钢铁侠",
    blurb: "一切的开端。确立了斯塔克、神盾局，以及片尾彩蛋的传统。",
  },
  "incredible-hulk": {
    name: "无敌浩克",
    blurb: "漫威宇宙里的孤儿片。就剧情而言可以跳过，但它埋下了布朗斯基和罗斯。",
  },
  "iron-man-2": {
    name: "钢铁侠2",
    blurb: "一半是续集，一半是复联预告：寡姐登场、罗迪换角、弗瑞的招募。",
  },
  thor: {
    name: "雷神",
    blurb: "引入阿斯加德、洛基，以及彩蛋里那位宇宙魔方的保管人。",
  },
  "first-avenger": {
    name: "美国队长",
    blurb: "1940 年代的起源故事。铺开史蒂夫、巴基、佩姬、九头蛇和宇宙魔方。",
  },
  avengers: {
    name: "复仇者联盟",
    blurb: "第一阶段的汇合点，之前所有的线索都在这里收束。",
  },
  "iron-man-3": {
    name: "钢铁侠3",
    blurb: "纽约之战后托尼的创伤后应激。满大人的反转在很久以后才真正生效。",
  },
  "thor-dark-world": {
    name: "雷神2：黑暗世界",
    blurb: "主要意义在于以太粒子（现实宝石）和洛基坐上王座。",
  },
  "winter-soldier": {
    name: "美国队长2：冬日战士",
    blurb: "神盾局倾覆。整个漫威宇宙政治格局中最吃重的一部。",
  },
  guardians: {
    name: "银河护卫队",
    blurb: "打开宇宙侧的大门，并且第一次讲清楚无限宝石到底是什么。",
  },
  "age-of-ultron": {
    name: "复仇者联盟2：奥创纪元",
    blurb: "幻视和马克西莫夫兄妹诞生，团队分裂的种子也埋在这里。",
  },
  "ant-man": {
    name: "蚁人",
    blurb: "引入量子领域 —— 也就是《终局之战》最终取胜的方式。",
  },
  "civil-war": {
    name: "美国队长3：内战",
    blurb: "团队破裂。特查拉和这个宇宙的蜘蛛侠首次登场。",
  },
  "doctor-strange": {
    name: "奇异博士",
    blurb: "魔法、第一次提及多元宇宙，以及时间宝石。",
  },
  "gotg-2": {
    name: "银河护卫队2",
    blurb: "揭开奎尔的身世，星云与卡魔拉握手言和，螳螂女加入。",
  },
  homecoming: {
    name: "蜘蛛侠：英雄归来",
    blurb: "彼得的独立首秀，托尼当导师，背景是内战的余波。",
  },
  ragnarok: {
    name: "雷神3：诸神黄昏",
    blurb: "阿斯加德覆灭，交代了浩克在外星的两年，瓦尔基里和寇格登场。",
  },
  "black-panther": {
    name: "黑豹",
    blurb: "瓦坎达、振金和杀人豹：也是《无限战争》第三幕的舞台。",
  },
  "infinity-war": {
    name: "复仇者联盟3：无限战争",
    blurb: "灭霸收割了十年的铺垫。几乎此前每一部都为它供血。",
  },
  "ant-man-wasp": {
    name: "蚁人2：黄蜂女现身",
    blurb: "与《无限战争》同期发生；片尾彩蛋是通往《终局之战》的钩子。",
  },
  "captain-marvel": {
    name: "惊奇队长",
    blurb: "设定在 1995 年的前传，解释了弗瑞的眼睛、那个传呼机和斯克鲁人。",
  },
  endgame: {
    name: "复仇者联盟4：终局之战",
    blurb: "总收官之作。默认你已经看过它之前的那 21 部。",
  },
  "far-from-home": {
    name: "蜘蛛侠：英雄远征",
    blurb: "无限传奇的尾声：对托尼的哀悼，以及那个关于多元宇宙的谎言。",
  },
  wandavision: {
    name: "旺达幻视",
    blurb: "旺达的悲痛让她成为绯红女巫。《疯狂多元宇宙》的直接前传。",
  },
  "falcon-winter-soldier": {
    name: "猎鹰与冬兵",
    blurb: "山姆如何成为美国队长。看《美丽新世界》之前的必修课。",
  },
  "loki-s1": {
    name: "洛基（第一季）",
    blurb:
      "时间变异管理局、神圣时间线，以及那位后来成为征服者康的人。多元宇宙从这里开始。",
  },
  "black-widow": {
    name: "黑寡妇",
    blurb: "时间线位于《内战》与《无限战争》之间；叶莲娜和红卫兵登场。",
  },
  "what-if-s1": {
    name: "假如…？（第一季）",
    blurb: "动画版的多元宇宙脑洞，每一集都会剧透它所改编的那部电影。",
  },
  "shang-chi": {
    name: "尚气与十环传奇",
    blurb: "基本独立成篇，但它终于讲清楚了真正的十环组织和满大人。",
  },
  eternals: {
    name: "永恒族",
    blurb: "一部自成一体的远古史诗。几乎没有前置，目前也少有后续影响。",
  },
  hawkeye: {
    name: "鹰眼",
    blurb: "凯特·毕肖普、回声，以及金并正式回归漫威宇宙主线。",
  },
  "no-way-home": {
    name: "蜘蛛侠：英雄无归",
    blurb: "把多元宇宙彻底撬开。二十年非漫威宇宙的蜘蛛侠电影在这里得到回报。",
  },
  "moon-knight": {
    name: "月光骑士",
    blurb: "独立的埃及神祇恐怖故事。什么时候看都行。",
  },
  "multiverse-of-madness": {
    name: "奇异博士2：疯狂多元宇宙",
    blurb: "无法凭空观看：需要《旺达幻视》《英雄无归》和《洛基》三者同时到位。",
  },
  "ms-marvel": {
    name: "惊奇少女",
    blurb: "卡玛拉的起源。大结局直接交棒给《惊奇队长2》。",
  },
  "love-and-thunder": {
    name: "雷神4：爱与雷霆",
    blurb: "简以强大雷神的身份回归；承接雷神在终局之后的漂泊。",
  },
  "she-hulk": {
    name: "女浩克：律师",
    blurb: "法律情景喜剧，顺手解决了憎恶的去向，并重新引入夜魔侠。",
  },
  "werewolf-by-night": {
    name: "暗夜狼人",
    blurb: "五十分钟的怪物特别篇。完全没有前置。",
  },
  "wakanda-forever": {
    name: "黑豹2：瓦坎达万岁",
    blurb: "特查拉之后的王位继承；纳摩和莉莉·威廉姆斯登场。",
  },
  "gotg-holiday": {
    name: "银河护卫队：圣诞特别篇",
    blurb: "短小、胡闹，为护卫队进入第三部定下现状。",
  },
  quantumania: {
    name: "蚁人3：量子狂潮",
    blurb: "征服者康的正式登场。需要《洛基》第一季才立得住。",
  },
  "gotg-3": {
    name: "银河护卫队3",
    blurb: "火箭浣熊的身世和团队的结局。三部曲真正的终章。",
  },
  "secret-invasion": {
    name: "秘密入侵",
    blurb: "斯克鲁人的阴谋，回收《惊奇队长》的伏笔，并供给《美丽新世界》。",
  },
  "loki-s2": {
    name: "洛基（第二季）",
    blurb: "了结时间变异管理局，并正式造出分叉的多元宇宙。",
  },
  "the-marvels": {
    name: "惊奇队长2",
    blurb: "三人组队之作，默认你看过两部不同的 Disney+ 剧集。",
  },
  "what-if-s2": {
    name: "假如…？（第二季）",
    blurb: "又九个多元宇宙脑洞，圣诞周里每天一集。剧透警告同第一季。",
  },
  echo: {
    name: "回声",
    blurb: "《鹰眼》之后玛雅的故事，金并和夜魔侠随行。",
  },
  "deadpool-wolverine": {
    name: "死侍与金刚狼",
    blurb:
      "承上启下的桥梁：时间变异管理局的机制，加上二十年福斯旧作被当成笑料。",
  },
  "agatha-all-along": {
    name: "阿加莎：全程陪同",
    blurb: "《旺达幻视》的直接续集；比利终于正式登场。",
  },
  "what-if-s3": {
    name: "假如…？（第三季）",
    blurb: "动画系列的完结季，既回望也伸向第四、第五阶段。",
  },
  "your-friendly-neighborhood-spider-man": {
    name: "你的友好邻居蜘蛛侠",
    blurb:
      "动画版彼得·帕克起源。刻意设定在自己的时间线而非神圣时间线，所以这里的一切都不是任何其他作品的前置。",
  },
  "brave-new-world": {
    name: "美国队长4：美丽新世界",
    blurb: "山姆的首部独立作；回收《无敌浩克》和《永恒族》留下的尾巴。",
  },
  "daredevil-born-again": {
    name: "夜魔侠：重生",
    blurb: "让网飞版的那批角色在漫威宇宙内部继续走下去。",
  },
  thunderbolts: {
    name: "雷霆特工队*",
    blurb: "瓦伦蒂娜的反英雄小队，从四个不同项目里各抽出一条线。",
  },
  ironheart: {
    name: "钢铁心",
    blurb: "《瓦坎达万岁》之后的莉莉，科技撞上魔法。",
  },
  "fantastic-four-first-steps": {
    name: "神奇四侠：初露锋芒",
    blurb: "在他们自己那颗复古未来主义地球上重新起步的神奇四侠。不需要做功课。",
  },
  "eyes-of-wakanda": {
    name: "瓦坎达之眼",
    blurb: "横跨数个世纪瓦坎达历史的动画选集。第六阶段的第一部，且完全独立。",
  },
  "marvel-zombies": {
    name: "漫威僵尸",
    blurb: "接在《假如…？》某一集的五年之后。不看那一集，这里什么都读不懂。",
  },
  "wonder-man": {
    name: "奇迹人",
    blurb:
      "关于一个拥有超能力的演员的好莱坞讽刺剧。联合主演是特雷弗·斯莱特里，所以满大人这个梗第三次生效。",
  },
  "born-again-s2": {
    name: "夜魔侠：重生（第二季）",
    blurb:
      "把杰西卡·琼斯和卢克·凯奇拉进漫威宇宙主线，网飞时期其余人马也终于到齐。",
  },
  "punisher-one-last-kill": {
    name: "制裁者：最后一杀",
    blurb: "承接《重生》的弗兰克·卡塞尔特别篇。篇幅短，基本自成一体。",
  },
  "brand-new-day": {
    name: "蜘蛛侠：全新的一天",
    blurb:
      "《英雄无归》之后彼得从零开始，也是 X 战警角色第一次走进漫威宇宙主线。",
  },
  visionquest: {
    name: "幻视追寻",
    blurb:
      "白幻视追索自己的记忆，奥创回归。为《旺达幻视》和《阿加莎》开启的三部曲收尾。",
  },
  "avengers-doomsday": {
    name: "复仇者联盟5：末日之战",
    blurb: "多元宇宙传奇的汇合点：漫威宇宙与福斯的两套阵容同台。",
  },
  "born-again-s3": {
    name: "夜魔侠：重生（第三季）",
    blurb: "第三季，已宣布续订至 2027 年。",
  },
  "avengers-secret-wars": {
    name: "复仇者联盟6：秘密战争",
    blurb: "这一传奇的终点。",
  },
  "x-men-mcu": {
    name: "X战警",
    blurb: "漫威宇宙自己的 X 战警电影。只有档期，其余均未确认。",
  },
  "ghost-rider": {
    name: "恶灵骑士",
    blurb: "只有档期，其余均未确认。",
  },
  "black-panther-3": {
    name: "黑豹3",
    blurb: "只有档期，其余均未确认。",
  },

  // ── Fox ───────────────────────────────────────────────────────────────
  "x-men": {
    name: "X战警",
    blurb: "开启现代超级英雄时代的那部电影。X教授对万磁王，还有小淘气与罗根。",
  },
  x2: {
    name: "X战警2",
    blurb: "史崔克、突袭学院，以及琴的牺牲：凤凰的铺垫。",
  },
  "last-stand": {
    name: "X战警3：背水一战",
    blurb: "凤凰与解药。它造成的破坏正是《逆转未来》存在的理由。",
  },
  "origins-wolverine": {
    name: "X战警前传：金刚狼",
    blurb: "罗根的艾德曼合金起源，外加后来被反复调侃的那版死侍。",
  },
  "the-wolverine": {
    name: "金刚狼2",
    blurb: "《背水一战》之后罗根在日本；片尾彩蛋直接交棒给《逆转未来》。",
  },
  "first-class": {
    name: "X战警：第一战",
    blurb: "1962 年的半重启起源。年轻的查尔斯与埃里克；作为入口也完全成立。",
  },
  "days-of-future-past": {
    name: "X战警：逆转未来",
    blurb: "整个福斯系列的枢纽：它把两套阵容焊在一起，并重置了时间线。",
  },
  apocalypse: {
    name: "X战警：天启",
    blurb: "1983 年。集结年轻一代团队，并给了罗根一个「武器 X」式客串。",
  },
  "dark-phoenix": {
    name: "X战警：黑凤凰",
    blurb: "前传阵容版本的凤凰传奇，也是福斯 X 战警系列的终点。",
  },
  "new-mutants": {
    name: "新变种人",
    blurb: "几乎没有关联的恐怖支线。福斯漫威的最后一部。",
  },
  logan: {
    name: "金刚狼3：殊死一战",
    blurb:
      "2029 年。献给休·杰克曼的金刚狼与斯图尔特的X教授的悼词；需要的是情感积累，不是剧情。",
  },
  deadpool: {
    name: "死侍",
    blurb: "R 级且高度自觉；真正需要的只是知道 X 战警电影存在。",
  },
  "deadpool-2": {
    name: "死侍2",
    blurb: "电索、X 特工队，以及《死侍与金刚狼》借力发挥的那个时间旅行梗。",
  },
  "fantastic-four-2005": {
    name: "神奇四侠",
    blurb: "蒂姆·斯托里版。独立成篇；如今最著名的是克里斯·埃文斯演的霹雳火。",
  },
  "rise-silver-surfer": {
    name: "神奇四侠2：银影侠现身",
    blurb: "直接续集；第一次真人版的银影侠与星际吞噬者。",
  },
  fant4stic: {
    name: "神奇四侠（2015）",
    blurb: "特兰克版重启。与前后任何作品都没有关联。",
  },
  "daredevil-2003": {
    name: "夜魔侠（2003）",
    blurb: "福斯版夜魔侠，与漫威宇宙那位无关。为《艾丽卡》做铺垫。",
  },
  "elektra-2005": {
    name: "艾丽卡",
    blurb: "2003 年那部的衍生片。死胡同，收录只为完整。",
  },

  // ── Sony: Raimi's Spider-Man ───────────────────────────────────────────
  "spider-man-2002": {
    name: "蜘蛛侠",
    blurb:
      "证明这个类型行得通的那一部。诺曼·奥斯本的滑翔翼，以及第一个伟大的起源故事。",
  },
  "spider-man-2": {
    name: "蜘蛛侠2",
    blurb: "章鱼博士、那列火车，以及这个类型至今为自己做过的最好辩护。",
  },
  "spider-man-3": {
    name: "蜘蛛侠3",
    blurb: "三个反派，一段舞。沙人正是《英雄无归》想请回来的那个。",
  },

  // ── Sony: The Amazing Spider-Man ───────────────────────────────────────
  "amazing-spider-man": {
    name: "超凡蜘蛛侠",
    blurb: "五年后的第二次起源。它真正的遗产是格温·斯泰西。",
  },
  "amazing-spider-man-2": {
    name: "超凡蜘蛛侠2",
    blurb: "电光人、哈里，以及那座钟楼。这个彼得带进《英雄无归》的伤口。",
  },

  // ── Sony's Spider-Man Universe ─────────────────────────────────────────
  venom: {
    name: "毒液：致命守护者",
    blurb: "一部共生体搭档喜剧，而这个宇宙里根本没有蜘蛛侠。",
  },
  "venom-carnage": {
    name: "毒液2：屠杀开始",
    blurb: "九十分钟的克莱图斯·卡萨迪，然后一个彩蛋把埃迪扔进了漫威宇宙。",
  },
  morbius: {
    name: "莫比亚斯：暗夜博士",
    blurb: "一个吸血鬼起源故事，它的片尾彩蛋想借走秃鹫，却借错了宇宙。",
  },
  "madame-web": {
    name: "蜘蛛夫人",
    blurb: "设定在 2003 年的预知惊悚片。跟任何你需要看的东西都没有关系。",
  },
  "venom-last-dance": {
    name: "毒液3：最后一舞",
    blurb: "《英雄无归》之后埃迪回到家，身后是正在撼动牢笼的克努尔。",
  },
  kraven: {
    name: "猎人克莱文",
    blurb: "这一系列的最后一部：一个蜘蛛侠反派的起源，却没有蜘蛛侠可猎。",
  },

  // ── Spider-Verse ───────────────────────────────────────────────────────
  "into-spider-verse": {
    name: "蜘蛛侠：平行宇宙",
    blurb: "迈尔斯·莫拉莱斯，以及那部让所有人第一次读懂多元宇宙的电影。",
  },
  "across-spider-verse": {
    name: "蜘蛛侠：纵横宇宙",
    blurb: "蜘蛛联盟、关于「命定事件」的争论，以及一个至今没有落地的悬念。",
  },

  // ── Marvel Television, Netflix, and the pre-Marvel-Studios films ──────
  "agents-of-shield-s1": {
    name: "神盾局特工（第一季）",
    blurb:
      "科尔森活了下来，带着一架飞机四处跑。后半季整个被《冬日战士》里神盾局的垮台掀翻。",
  },
  "agents-of-shield-s2": {
    name: "神盾局特工（第二季）",
    blurb: "从一无所有里重建，黛西也弄清了自己是什么。",
  },
  "agent-carter-s1": {
    name: "特工卡特（第一季）",
    blurb: "1946 年的佩姬，被屋里每一个男人轻视。这一批剧集里最好的一部。",
  },
  "agents-of-shield-s3": {
    name: "神盾局特工（第三季）",
    blurb: "到处都是异人，还有蜂巢。",
  },
  "agent-carter-s2": {
    name: "特工卡特（第二季）",
    blurb: "洛杉矶、零物质，以及惠特尼·弗罗斯特。",
  },
  "agents-of-shield-s4": {
    name: "神盾局特工（第四季）",
    blurb:
      "恶灵骑士、生化机器人和「框架」—— 三部剧塞进一季，也是全剧最好的一季。",
  },
  "agents-of-shield-s5": {
    name: "神盾局特工（第五季）",
    blurb: "小队被丢进一个已经毁掉的未来，试着让它不曾发生。",
  },
  inhumans: {
    name: "异人族",
    blurb:
      "阿提兰、一场政变，以及夏威夷。安森·蒙特的黑蝠王在《疯狂多元宇宙》里才算真正拍好。",
  },
  "agents-of-shield-s6": {
    name: "神盾局特工（第六季）",
    blurb: "科尔森的脸长在别人身上，还有尖啸鸟。",
  },
  "agents-of-shield-s7": {
    name: "神盾局特工（第七季）",
    blurb: "穿回神盾局自己的历史，然后收场。",
  },
  "runaways-s1": {
    name: "逃亡者（第一季）",
    blurb: "六个少年发现，反派就是自己的父母。",
  },
  "cloak-dagger-s1": {
    name: "斗篷与匕首（第一季）",
    blurb: "新奥尔良，两个能力互相牵连的孩子，以及一集非常好的试播。",
  },
  "runaways-s2": {
    name: "逃亡者（第二季）",
    blurb: "真正开始逃亡，住在好莱坞标志下面的一间旅舍里。",
  },
  "cloak-dagger-s2": {
    name: "斗篷与匕首（第二季）",
    blurb: "人口贩卖、混乱女，以及和《逃亡者》的联动。",
  },
  "runaways-s3": {
    name: "逃亡者（第三季）",
    blurb: "摩根·勒菲，还有斗篷与匕首登门。",
  },
  "daredevil-nf-s1": {
    name: "夜魔侠（第一季）",
    blurb:
      "纽约大战之后的地狱厨房，以及一个从零搭起来的金并。《重生》就是从这里接上的。",
  },
  "jessica-jones-s1": {
    name: "杰西卡·琼斯（第一季）",
    blurb:
      "基尔格雷夫，这批剧里最好的反派。一部关于胁迫的剧，只是碰巧有超能力。",
  },
  "daredevil-nf-s2": {
    name: "夜魔侠（第二季）",
    blurb: "弗兰克·卡斯尔和艾丽卡登场，整season也干脆地绕着他们劈成两半。",
  },
  "luke-cage-s1": {
    name: "卢克·凯奇（第一季）",
    blurb: "哈莱姆、一个穿连帽衫的防弹男人，以及棉口蛇。",
  },
  "iron-fist-s1": {
    name: "铁拳侠（第一季）",
    blurb: "丹尼·兰德从昆仑回来。四部里最弱的一部，但柯琳·王是从这里来的。",
  },
  defenders: {
    name: "捍卫者联盟",
    blurb: "八集，只为把四个人凑进同一个房间。它默认你认识他们全部。",
  },
  "punisher-nf-s1": {
    name: "惩罚者（第一季）",
    blurb: "《夜魔侠》第二季之后的弗兰克，以及他家人之死背后的阴谋。",
  },
  "jessica-jones-s2": {
    name: "杰西卡·琼斯（第二季）",
    blurb: "能力从哪来，以及崔西想要它所付出的代价。",
  },
  "luke-cage-s2": {
    name: "卢克·凯奇（第二季）",
    blurb: "丛林蝮，以及彻底放开的玛丽亚。",
  },
  "iron-fist-s2": {
    name: "铁拳侠（第二季）",
    blurb: "更短、更紧，还有达沃斯。柯琳接过了铁拳。",
  },
  "daredevil-nf-s3": {
    name: "夜魔侠（第三季）",
    blurb: "菲斯克出狱，靶眼成型。《重生》直接续的就是这一季。",
  },
  "punisher-nf-s2": {
    name: "惩罚者（第二季）",
    blurb: "失忆的鲁索，以及弗兰克终于成为那个骷髅。",
  },
  "jessica-jones-s3": {
    name: "杰西卡·琼斯（第三季）",
    blurb: "网飞这一批的收尾。崔西和杰西卡最终站到了对立面。",
  },
  "punisher-1989": {
    name: "惩罚者（1989）",
    blurb:
      "多尔夫·龙格尔，胸口没有骷髅，在美国直接发行录像带。银幕上第一位漫威惩罚者。",
  },
  blade: {
    name: "刀锋战士",
    blurb:
      "证明漫威改编能卖座的那一部 —— 比《X战警》早两年，比《钢铁侠》早十年。",
  },
  "blade-2": {
    name: "刀锋战士2",
    blurb:
      "吉尔莫·德尔·托罗执导。刀锋与吸血鬼联手，对付一种以吸血鬼为食的东西。",
  },
  "blade-trinity": {
    name: "刀锋战士3",
    blurb: "德古拉、夜行者小队，以及比《死侍》早十二年的瑞恩·雷诺兹。",
  },
  "hulk-2003": {
    name: "绿巨人浩克（2003）",
    blurb:
      "李安的版本，有漫画分格式剪辑，也有父亲的问题。五年后的《无敌浩克》是重启，不是续集。",
  },
  "punisher-2004": {
    name: "惩罚者（2004）",
    blurb: "托马斯·简版的弗兰克·卡斯尔，是复仇片，不是战争片。",
  },
  "punisher-war-zone": {
    name: "惩罚者：战争特区",
    blurb: "四年后的重启，不是续集：换了弗兰克，换了一切，还有拼图。",
  },
  "ghost-rider-2007": {
    name: "恶灵骑士（2007）",
    blurb:
      "尼古拉斯·凯奇做了那笔交易。和漫威影业定档 2028 年的那部《恶灵骑士》毫无关系。",
  },
  "spirit-of-vengeance": {
    name: "恶灵骑士2：复仇时刻",
    blurb: "凯奇再演一次，跑到东欧，换了个魔鬼，表演也奇怪得多。",
  },
};
