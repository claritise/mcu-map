/**
 * The "why watch this first" line for every edge, keyed by `from->to`, the same
 * key the graph builds. A missing edge falls back to the English reason.
 */
export const ZH_DEPENDENCIES: Record<string, string> = {
  // ── Phase One → The Avengers ──────────────────────────────────────────
  "iron-man->iron-man-2": "直接续集；托尼正被第一部里救了他的那个东西害死。",
  "iron-man->incredible-hulk": "两者之间只有斯塔克的那个彩蛋相连。",
  "iron-man->avengers": "托尼、弗瑞和整个「复仇者计划」的前提都从这里开始。",
  "iron-man-2->avengers": "引入黑寡妇，以及弗瑞真正的组队提案。",
  "incredible-hulk->avengers": "解释班纳一直躲在哪里，以及他为什么被通缉。",
  "thor->avengers": "洛基的动机和宇宙魔方的下落都出自这里。",
  "first-avenger->avengers": "史蒂夫失去的七十年，以及宇宙魔方的来历。",
  "iron-man-2->first-avenger": "霍华德·斯塔克的档案和盾牌原型最早埋在这里。",

  // ── Phase Two ─────────────────────────────────────────────────────────
  "avengers->iron-man-3": "整部电影就是托尼对纽约传送门的恐慌发作。",
  "iron-man-2->iron-man-3": "延续斯塔克工业和小辣椒这条线。",
  "thor->thor-dark-world": "直接续集：简、阿斯加德、洛基的判决。",
  "avengers->thor-dark-world": "洛基之所以在牢里，是因为他在地球上干的事。",
  "first-avenger->winter-soldier": "巴基就是整部电影。你得亲眼看过他坠落。",
  "avengers->winter-soldier": "神盾局在纽约之后的偏执正是本片的前提。",
  "iron-man-2->winter-soldier": "娜塔莎在神盾局的双重身份在这里得到回报。",
  "thor-dark-world->guardians": "收藏者和以太粒子有两分钟的回扣。",
  "avengers->age-of-ultron": "同一支队伍，而洛基的权杖是奥创的种子。",
  "winter-soldier->age-of-ultron":
    "神盾局没了，而马克西莫夫兄妹就在它的片尾彩蛋里。",
  "iron-man-3->age-of-ultron": "托尼对「保护不了世界」的恐惧最终变成了奥创。",
  "thor-dark-world->age-of-ultron": "雷神对无限宝石的直觉是从以太粒子开始的。",
  "winter-soldier->ant-man": "解释了那场猎鹰之战，以及神盾局为何缺席。",
  "age-of-ultron->ant-man": "紧接其后；新的复仇者基地就是那场戏的场景。",
  "age-of-ultron->civil-war": "索科维亚正是《协议》存在的原因。",
  "winter-soldier->civil-war": "巴基的处境就是队伍分裂的那道断层线。",
  "ant-man->civil-war": "否则斯科特就是莫名其妙被招募来的。",
  "iron-man-3->civil-war": "托尼的愧疚从奥创以来一直在累积。",
  "guardians->gotg-2": "直接续集。",
  "civil-war->homecoming": "从彼得的手持摄像机接上，只隔几分钟。",
  "avengers->homecoming": "图姆斯整门生意就是清理纽约之战的残骸。",
  "thor->ragnarok": "阿斯加德、奥丁和洛基。",
  "thor-dark-world->ragnarok": "本片开场时洛基正坐在王座上。",
  "age-of-ultron->ragnarok": "雷神为追查幻象而离开，浩克则开着昆式战机走了。",
  "doctor-strange->ragnarok": "斯特兰奇的客串默认你已经知道他是谁。",
  "civil-war->black-panther":
    "特查拉的父亲死于其中；埃弗雷特·罗斯也从那里延续过来。",
  "age-of-ultron->black-panther":
    "克劳在那里失去手臂，振金的线索也从那里开始。",
  "guardians->infinity-war": "灭霸、卡魔拉、星云和宝石全在这里立起来。",
  "gotg-2->infinity-war": "护卫队的相处方式，以及卡魔拉与灭霸的关系。",
  "age-of-ultron->infinity-war": "幻视与心灵宝石。",
  "ragnarok->infinity-war": "开场就在《诸神黄昏》结束时的那艘飞船上。",
  "civil-war->infinity-war": "复仇者们成了逃犯，而且彼此不说话。",
  "doctor-strange->infinity-war": "时间宝石和各处圣殿。",
  "homecoming->infinity-war": "彼得与托尼的关系是结尾情感的核心。",
  "black-panther->infinity-war": "第三幕就发生在瓦坎达。",
  "ant-man->ant-man-wasp": "直接续集。",
  "civil-war->ant-man-wasp": "斯科特正因为它而被软禁在家。",
  "infinity-war->ant-man-wasp": "只有知道刚发生了什么，那个片尾彩蛋才成立。",
  "first-avenger->captain-marvel": "宇宙魔方的历史把两者绑在一起。",
  "infinity-war->captain-marvel":
    "这部电影存在的意义，就是回答那个片尾彩蛋里的传呼机。",
  "infinity-war->endgame": "同一部电影的下半部。",
  "ant-man-wasp->endgame": "量子领域是整个剧情赖以运转的机制。",
  "captain-marvel->endgame": "卡罗尔在第一幕就出现，没有任何别的介绍。",
  "endgame->far-from-home": "「闪烁」和托尼之死就是本片的前提。",
  "homecoming->far-from-home": "同一批人、同一所学校、同一道导师的影子。",

  // ── Phase Four ────────────────────────────────────────────────────────
  "age-of-ultron->wandavision": "旺达与幻视的关系从这里开始。",
  "infinity-war->wandavision": "她所哀悼的那场死亡，正是你看着她亲手造成的。",
  "endgame->wandavision": "故事设定在「闪烁」刚结束的世界里。",
  "captain-marvel->wandavision": "莫妮卡·兰博的母亲，以及与天剑局的联系。",
  "winter-soldier->falcon-winter-soldier": "山姆和巴基之间的全部化学反应。",
  "civil-war->falcon-winter-soldier":
    "泽莫回归，而《协议》的余波就是本剧的政治。",
  "endgame->falcon-winter-soldier": "开篇就落在史蒂夫交出去的那面盾牌上。",
  "black-panther->falcon-winter-soldier": "朵拉·米拉杰找上门来索要泽莫。",
  "avengers->loki-s1": "这个洛基是在 2012 年那场战役中途逃跑时被抓的。",
  "endgame->loki-s1": "时间劫案正是造出他的那次分叉。",
  "thor-dark-world->loki-s1": "洛基对弗丽嘉之死的悲痛被当成武器用在他身上。",
  "civil-war->black-widow": "时间设定在机场大战刚结束的那段空当。",
  "iron-man-2->black-widow": "她的卧底身份和德雷科夫这个名字要追溯到这么早。",
  "avengers->black-widow": "布达佩斯，终于讲清楚了。",
  "first-avenger->what-if-s1": "第一集就是这部电影，只不过坐进血清舱的是佩姬。",
  "doctor-strange->what-if-s1": "至尊斯特兰奇那集逐拍默认你熟悉原作。",
  "endgame->what-if-s1": "几乎每一集都会剧透无限传奇某个结局。",
  "guardians->what-if-s1": "有两集重新洗牌了护卫队的阵容。",
  "iron-man-3->shang-chi": "特雷弗·斯莱特里那个玩笑是那次反转的直接续集。",
  "incredible-hulk->shang-chi": "憎恶出现在笼斗场上。",
  "endgame->shang-chi": "「闪烁」之后的设定，班纳和卡罗尔也在彩蛋里出现。",
  "endgame->eternals": "「闪烁」只是一个情节装置；除此之外这是个干净的入口。",
  "far-from-home->no-way-home": "它从上一部结束的那一帧接着开始。",
  "doctor-strange->no-way-home": "斯特兰奇的咒语是事件的导火索。",
  "endgame->hawkeye": "浪人身份和娜塔莎之死，是克林特背着的东西。",
  "black-widow->hawkeye": "叶莲娜是因为那个片尾彩蛋才来复仇的。",
  "age-of-ultron->hawkeye": "克林特的家庭是他想回家的理由。",
  "wandavision->multiverse-of-madness":
    "旺达的转恶发生在银幕之外 —— 在剧集里。",
  "doctor-strange->multiverse-of-madness": "直接续集。",
  "no-way-home->multiverse-of-madness": "承接那道咒语造成的多元宇宙破损。",
  "loki-s1->multiverse-of-madness": "确立了分叉时间线的运作规则。",
  "what-if-s1->multiverse-of-madness": "邪恶斯特兰奇和光照会配上它更好懂。",
  "captain-marvel->ms-marvel": "卡玛拉的整个人设就是卡罗尔的粉丝。",
  "ragnarok->love-and-thunder":
    "同一位导演、同一个雷神，寇格和瓦尔基里也延续过来。",
  "thor-dark-world->love-and-thunder": "只有看过简离开，她的回归才有分量。",
  "endgame->love-and-thunder": "开场时雷神正跟着银河护卫队在旅行。",
  "incredible-hulk->she-hulk": "布朗斯基的假释听证会是本剧的B线。",
  "endgame->she-hulk": "聪明浩克是詹妮弗的导师，不需要再解释一遍。",
  "shang-chi->she-hulk": "王和憎恶那套地下拳赛的安排在这里生效。",
  "black-panther->wakanda-forever": "直接续集，也是一场现实中的悼念。",
  "endgame->wakanda-forever": "「闪烁」之后的地缘政治，以及瓦坎达的曝光。",
  "falcon-winter-soldier->wakanda-forever":
    "阿约和朵拉·米拉杰那条线继续往下走。",
  "gotg-2->gotg-holiday": "螳螂女的身世就是那个笑点。",
  "endgame->gotg-holiday": "解释他们为什么拥有虚无知地，以及奎尔为何在哀悼。",
  "ant-man-wasp->quantumania": "珍妮特在量子领域的三十年是隐藏的前史。",
  "loki-s1->quantumania": "存续者先讲清楚了康是谁，电影才敢默认你知道。",
  "endgame->quantumania": "凯茜因「闪烁」而变成了少女，斯科特也因此出名。",
  "gotg-2->gotg-3": "伊戈、勇度和火箭的创伤共同喂养了终章。",
  "endgame->gotg-3": "这个卡魔拉是 2014 年的变体，从没认识过他们。",
  "gotg-holiday->gotg-3": "为团队在虚无知地的现状定下基调。",
  "captain-marvel->secret-invasion": "塔洛斯和斯克鲁难民的协议就是本剧的前提。",
  "far-from-home->secret-invasion":
    "弗瑞此后一直在外星，而地球上的他是被顶替的。",
  "loki-s1->loki-s2": "从场景中途直接接续。",
  "quantumania->loki-s2": "看过之后，康的各种变体冲击力更强。",
  "captain-marvel->the-marvels": "直接续集。",
  "ms-marvel->the-marvels": "卡玛拉的大结局就是这部电影的第一幕。",
  "wandavision->the-marvels": "莫妮卡的能力来自那个六芒星结界。",
  "secret-invasion->the-marvels": "弗瑞在天剑局的处境延续下来。",
  "hawkeye->echo": "玛雅的叔叔，以及结束该剧的那一枪。",
  "hawkeye->daredevil-born-again": "菲斯克的从政转向从那里开始。",
  "echo->daredevil-born-again": "直接承接菲斯克的结局。",
  "she-hulk->daredevil-born-again": "马特在漫威宇宙里的调性是在那里定下的。",
  "no-way-home->daredevil-born-again": "马特客串出演彼得的律师。",
  "wandavision->agatha-all-along": "阿加莎正停在剧集离开她的地方。",
  "multiverse-of-madness->agatha-all-along": "《黑暗神书》的下落和旺达的状态。",

  // ── Phase Five and Six ────────────────────────────────────────────────
  "falcon-winter-soldier->brave-new-world": "山姆接下盾牌是必要前提。",
  "incredible-hulk->brave-new-world": "罗斯、斯特恩斯，以及悬了十六年的线头。",
  "eternals->brave-new-world": "海里那位天神组成员是各国争夺的地缘政治大奖。",
  "secret-invasion->brave-new-world": "罗斯的总统任期和对斯克鲁人的偏执。",
  "black-widow->thunderbolts": "叶莲娜和阿列克谢的家庭关系。",
  "falcon-winter-soldier->thunderbolts": "约翰·沃克，以及瓦伦蒂娜的招募说辞。",
  "ant-man-wasp->thunderbolts": "幽灵没有别的登场介绍。",
  "hawkeye->thunderbolts": "叶莲娜复仇之后的心境。",
  "wakanda-forever->ironheart": "莉莉的战甲，以及她和瓦坎达闹翻的经过。",
  "fantastic-four-first-steps->avengers-doomsday":
    "杜姆的登场，以及神奇四侠所在的那颗地球。",
  "thunderbolts->avengers-doomsday": "新复仇者的阵容从这里出来。",
  "brave-new-world->avengers-doomsday": "响应号召的正是山姆这一支复仇者。",
  "loki-s2->avengers-doomsday": "多元宇宙的规则，以及洛基的新工作。",
  "deadpool-wolverine->avengers-doomsday":
    "确立了福斯的各个宇宙如何通到漫威宇宙。",
  "avengers-doomsday->avengers-secret-wars": "下半部。",

  // ── Fox ───────────────────────────────────────────────────────────────
  "x-men->x2": "直接续集。",
  "x2->last-stand": "琴在阿尔卡利湖之死就是全片的前提。",
  "x-men->origins-wolverine": "一部前传：它解释了那副狗牌，仅此而已。",
  "last-stand->the-wolverine": "罗根之所以自我放逐，是因为他不得不对琴做的事。",
  "last-stand->days-of-future-past": "那片废土正是这条时间线的终点。",
  "the-wolverine->days-of-future-past": "它的片尾彩蛋就是本片的开场提案。",
  "x-men->logan": "本片哀悼的，是罗根与查尔斯之间十七年的交情。",
  "the-wolverine->logan": "延续罗根晚期那条关于必死性的弧线。",
  "days-of-future-past->logan":
    "松散地接在重置后的时间线上；当成独立作品看即可。",
  "x-men->first-class": "如果你知道结局，查尔斯与埃里克的友情会更有味道。",
  "first-class->days-of-future-past": "1973 年的那一半是它的直接续集。",
  "first-class->apocalypse": "这套阵容的第三部。",
  "days-of-future-past->apocalypse": "时间线在它的结尾被改写了。",
  "apocalypse->dark-phoenix": "同一支队伍，在那里组建。",
  "apocalypse->new-mutants": "共享一个宇宙，除此之外基本毫无关系。",
  "origins-wolverine->deadpool": "那个关于「嘴」的梗需要先知道原始罪行。",
  "x-men->deadpool": "X学院的段子默认你熟悉这个系列。",
  "deadpool->deadpool-2": "直接续集。",
  "fantastic-four-2005->rise-silver-surfer": "直接续集。",
  "daredevil-2003->elektra-2005": "衍生片；她的复活就是交接点。",

  // ── Fox → MCU ─────────────────────────────────────────────────────────
  "deadpool-2->deadpool-wolverine":
    "韦德留下的那个时间装置和X特工队的后果就是铺垫。",
  "logan->deadpool-wolverine": "整个前提就是这版金刚狼已经死了。",
  "loki-s1->deadpool-wolverine": "时间变异管理局、剪除和虚空都是承重结构。",
  "days-of-future-past->deadpool-wolverine": "大部分客串名单都取自那个时期。",
  "fantastic-four-2005->deadpool-wolverine":
    "如果你记得以前谁演过霹雳火，有个客串会更好笑。",
  "endgame->deadpool-wolverine": "韦德的开场默认漫威宇宙处于终局之后的状态。",

  // ── Animation and late arrivals ───────────────────────────────────────
  "what-if-s1->what-if-s2":
    "同一部选集，观察者的弧线从上一季大结局直接往下走。",
  "what-if-s2->what-if-s3": "直接延续，连回归的那些变体都一样。",
  "what-if-s1->marvel-zombies":
    "它接在《假如…僵尸来袭？！》那一集的五年之后，而那一集就是全部前提。",
  "black-panther->eyes-of-wakanda":
    "主题正是瓦坎达的孤立主义和黑豹这一称号的传承。",
  "iron-man-3->wonder-man": "只有知道满大人那个反转，特雷弗·斯莱特里才说得通。",
  "shang-chi->wonder-man": "斯莱特里此后待在哪儿，又是谁把他放出来的。",
  "daredevil-born-again->born-again-s2": "直接延续。",
  "born-again-s2->born-again-s3": "直接延续。",
  "daredevil-born-again->punisher-one-last-kill":
    "弗兰克在那一季里的弧线就是铺垫。",
  "no-way-home->brand-new-day": "彼得已经从所有人的记忆里被抹去。那就是起点。",
  "daredevil-born-again->brand-new-day":
    "这就是那部剧里的弗兰克·卡塞尔，不是新的一个。",
  "thunderbolts->brand-new-day": "叶莲娜以新复仇者的身份到场。",
  "wandavision->visionquest": "白幻视是在那场大结局里被造出来并飞走的。",
  "age-of-ultron->visionquest": "奥创回来了，而这正是造出那具躯体的电影。",
  "agatha-all-along->visionquest": "为那两部剧开启的三部曲收尾。",

  // ── Sony, internal ────────────────────────────────────────────────────
  "spider-man-2002->spider-man-2": "诺曼之死和哈里的怨恨就是整部续集的引擎。",
  "spider-man-2->spider-man-3": "直接承接哈里的复仇，以及彼得和 MJ 那摊烂事。",
  "amazing-spider-man->amazing-spider-man-2":
    "彼得对斯泰西警长的承诺，正是他一再违背的那个。",
  "venom->venom-carnage": "埃迪和共生体之间的约定原样延续下来。",
  "venom-carnage->venom-last-dance": "三部曲收束在第二部拉开的那条线上。",
  "into-spider-verse->across-spider-verse":
    "迈尔斯、格温和那个小玩意：续集从对话中途开始。",

  // ── Sony → MCU ────────────────────────────────────────────────────────
  "spider-man-2002->no-way-home":
    "诺曼·奥斯本是从这部电影结尾的话说到一半时被拽过来的。",
  "spider-man-2->no-way-home":
    "章鱼博士现身时依然和机械臂融为一体，也依然停在半途的救赎里。",
  "spider-man-3->no-way-home": "沙人也在场，而电影默认你记得他是谁的父亲。",
  "amazing-spider-man->no-way-home":
    "康纳斯回来了，那个没能救下他的彼得也回来了。",
  "amazing-spider-man-2->no-way-home":
    "格温的坠落，正是加菲尔德那条支线全部建立于其上的伤口。",
  "venom-carnage->no-way-home":
    "它的彩蛋把埃迪丢进漫威宇宙；这部的片尾彩蛋又把他送了回去。",
  "no-way-home->venom-last-dance":
    "埃迪从漫威宇宙回家，带回了那道咒语留下的东西。",
  "blade->blade-2": "直接续集，开场就是惠斯勒的下场。",
  "blade-2->blade-trinity":
    "同一个刀锋，围猎已经升级；第三部默认你看过这一路。",
  "ghost-rider-2007->spirit-of-vengeance":
    "同一个布雷兹、同一笔交易，但从头再讲了一遍 —— 直接从这里看起，只会漏掉起源。",
  "avengers->agents-of-shield-s1":
    "这部剧之所以存在，是因为纽约大战，也因为科尔森死在里面。",
  "agents-of-shield-s1->agents-of-shield-s2": "一路连着讲下来。",
  "agents-of-shield-s2->agents-of-shield-s3": "一路连着讲下来。",
  "agents-of-shield-s3->agents-of-shield-s4": "一路连着讲下来。",
  "agents-of-shield-s4->agents-of-shield-s5": "一路连着讲下来。",
  "agents-of-shield-s5->agents-of-shield-s6": "一路连着讲下来。",
  "agents-of-shield-s6->agents-of-shield-s7": "一路连着讲下来。",
  "winter-soldier->agents-of-shield-s2":
    "神盾局在电影里垮台，剧后来做的一切都是从那片废墟上重建的。",
  "first-avenger->agent-carter-s1": "佩姬对史蒂夫的哀恸，是整部剧的发动机。",
  "agent-carter-s1->agent-carter-s2": "直接续接。",
  "runaways-s1->runaways-s2": "一路连着讲下来。",
  "runaways-s2->runaways-s3": "一路连着讲下来。",
  "cloak-dagger-s1->cloak-dagger-s2": "一路连着讲下来。",
  "cloak-dagger-s2->runaways-s3": "泰隆和坦迪在最后一季里联动登场。",
  "avengers->daredevil-nf-s1":
    "地狱厨房正在纽约大战之后重建，而剧里从头到尾只把它叫作「那件事」。",
  "daredevil-nf-s1->daredevil-nf-s2": "直接续接，连同菲斯克一起。",
  "daredevil-nf-s2->daredevil-nf-s3": "艾丽卡和手合会的线在这里收。",
  "jessica-jones-s1->jessica-jones-s2":
    "直接续接；第二季讲的是第一季让她付出了什么。",
  "jessica-jones-s2->jessica-jones-s3": "崔西的转变是直接从这里长出来的。",
  "luke-cage-s1->luke-cage-s2": "玛丽亚和影子都延续了下来。",
  "iron-fist-s1->iron-fist-s2": "直接续接。",
  "jessica-jones-s1->luke-cage-s1":
    "卢克是在杰西卡第一季里登场的，他带着妻子的死进入自己的剧。",
  "daredevil-nf-s2->punisher-nf-s1":
    "弗兰克的整条线从那里开始；这部剧默认你已经知道。",
  "punisher-nf-s1->punisher-nf-s2": "直接续接，鲁索也一样。",
  "daredevil-nf-s2->defenders":
    "八集要把四个主角凑到一个房间里，谁也不会再介绍一遍。",
  "jessica-jones-s1->defenders":
    "八集要把四个主角凑到一个房间里，谁也不会再介绍一遍。",
  "luke-cage-s1->defenders":
    "八集要把四个主角凑到一个房间里，谁也不会再介绍一遍。",
  "iron-fist-s1->defenders":
    "八集要把四个主角凑到一个房间里，谁也不会再介绍一遍。",
  "defenders->daredevil-nf-s3":
    "第三季开场就接在《捍卫者联盟》留下马特的地方。",
  "defenders->iron-fist-s2": "之后丹尼接手了马特那片地界。",
  "defenders->luke-cage-s2": "卢克是从那件事之后回到哈莱姆的。",
  "defenders->jessica-jones-s2": "紧接着不久后的杰西卡。",
  "daredevil-nf-s3->daredevil-born-again":
    "《重生》是直接续接：马特、菲斯克、凯伦和福吉都带着那段历史出场。",
  "punisher-nf-s2->punisher-one-last-kill":
    "同一个弗兰克，从网飞那一批之后接着讲。",
};
