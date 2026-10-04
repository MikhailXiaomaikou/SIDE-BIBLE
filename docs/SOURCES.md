# SIDE BIBLE：内容、版本与来源

资料核对日期：2026-10-05。内容文件：`src/content.js`。

SIDE BIBLE 当前是一套 **12 部文献、每部 6 个场景，共 72 个场景的中文互动选读**。它不是非正典文献全集，不是新发现的经书，也不是任何古代作品的完整译本。收录顺序、中文标题、`invocation` 短句、`narrative` 叙述、`insight` 阅读提示和画面均为本项目原创编辑与艺术改编。短句没有使用引号冒充经文。

每一场的 `reference` 指向所用版本中的章、节、语录或抄本页码；书卷的 `sourceIds` 对应同文件 `SOURCES` 数组。`SOURCES` 保留可打开的英文底本及正典说明。读者可据此进入全文，比较本项目的取舍。情节按照古代文本叙述呈现；不据这些叙事宣称神迹、异象或历史细节已被独立证实。

## 「非正典」的范围

这不是所有基督教传统共有的一张「被删书单」。文本是否属于正典，要说明是哪一个共同体的正典。

- **《多比传》《犹滴传》《所罗门智训》**在天主教和东正教旧约中具有正典地位；天主教常称其为第二正典书。参见[《天主教教理》120 条书目](https://www.vatican.va/content/catechism/en/part_one/section_one/chapter_two/article_3/iv_the_canon_of_scripture.html)及[Orthodox Church in America 的正典说明](https://www.oca.org/questions/scripture/canon-of-scripture)。它们通常不属于新教的旧约正典。
- **《以诺一书》《禧年书》**列在[埃塞俄比亚正教会公开的正典书目](https://www.ethiopianorthodox.org/english/canonical/books.html?lang=en)中。用西方多数圣经的目录称它们为「非正典」，不能抹去这一传统。
- 其余收录作品属于古代犹太或早期基督教文献，不在现行主要教会的新约正典内。受重视、被抄录、影响礼仪或图像，与正式列入正典是不同事情。这里不采用「所有作品曾统一入典、后遭秘密删除」之类未经证实的说法。

## 逐卷对应

| 书卷 / 数据 ID | 所用底本及来源 ID | 六场所据段落 |
| --- | --- | --- |
| 以诺一书 / `enoch` | [R. H. Charles, *The Book of Enoch*，1917](https://sacred-texts.com/bib/boe/index.htm)；`enoch-charles` | 6–8；9–10；14；22；24–25；72 章 |
| 禧年书 / `jubilees` | [R. H. Charles, *The Book of Jubilees*，1917](https://sacred-texts.com/bib/jub/index.htm)；`jubilees-charles` | 1；2；3；6；10:1–17；12:15–31 |
| 亚当与夏娃生平 / `adam-eve` | [希腊本 *Apocalypse of Moses*](https://wesley.nnu.edu/sermons-essays-books/noncanonical-literature/noncanonical-literature-ot-pseudepigrapha/the-apocalypse-of-moses/)，L. S. A. Wells，收于 R. H. Charles 编 *The Apocrypha and Pseudepigrapha of the Old Testament*，1913；`adam-greek` | 1–4；5–9；10–12；13–14；15–30；38–43 章 |
| 多比传 / `tobit` | [Douay–Rheims / Challoner，Tobias](https://www.drbo.org/chapter/17001.htm)；`tobit-dr` | 1–2；3；5；6；7–8；11–12 章 |
| 犹滴传 / `judith` | [Douay–Rheims / Challoner，Judith](https://www.drbo.org/chapter/18001.htm)；`judith-dr` | 7；8；9；10；13；15–16 章 |
| 所罗门智训 / `wisdom-solomon` | [Douay–Rheims / Challoner，Wisdom](https://www.drbo.org/chapter/25001.htm)；`wisdom-dr` | 1；3；6；7；9；11 章 |
| 雅各原福音 / `james` | [Alexander Walker, *Ante-Nicene Fathers* 8，1886](https://www.newadvent.org/fathers/0847.htm)；`james-anf` | 1–5；7–8；8–9；10–11；18–19；22 章 |
| 多马幼年福音 / `infancy-thomas` | [Alexander Walker, *Ante-Nicene Fathers* 8，1886，First Greek Form](https://www.newadvent.org/fathers/0846.htm)；`infancy-thomas-anf` | 2；3–5 与 8；9；11；12；13 章 |
| 多马福音 / `thomas` | [Mark M. Mattison，依据 Nag Hammadi Codex II, 2 的科普特文本](https://www.gospels.net/thomas)；`thomas-mattison` | 语录 3；9；20；24；77；113 |
| 马利亚福音 / `mary` | [Mark M. Mattison，依据 Berlin Codex 8502, 1](https://www.gospels.net/mary)；`mary-mattison`；另见 `mary-nasscal` | 抄本页 7–8；8–9；9–10；10 及其后的缺页；15–17；17–19 |
| 保罗与帖克拉行传 / `thecla` | [M. R. James, *The Apocryphal New Testament*，1924，网页第二部分](https://www.earlychristianwritings.com/text/actspaul.html)；`thecla-james`；另以 [Walker 的 ANF 8 译本](https://www.newadvent.org/fathers/0816.htm) `thecla-anf` 对读 | 帖克拉部分 7–10；17–18；20–22；27–33；34–38；39–43 节 |
| 黑马牧人书 / `hermas` | F. Crombie, *Ante-Nicene Fathers* 2，1885：[Book I](https://www.newadvent.org/fathers/02011.htm)、[Book II](https://www.newadvent.org/fathers/02012.htm)、[Book III](https://www.newadvent.org/fathers/02013.htm)；`hermas-visions`、`hermas-mandates`、`hermas-similitudes` | 异象一 2–4；异象二 4；异象三 2–5；诫命二；比喻二；比喻九 6–8 |

## 版本选择与边界

1. **《以诺一书》**不是《以诺二书》或《以诺三书》。它由不同层次组成，不能只给出一个精确的写作年份。第 22 章的希腊与埃塞俄比亚见证有差异，因此场景没有把山穴数量画成统一的冥界地图。第 72 章是古代天文与历法图景，不按现代物理知识包装。
2. **《禧年书》**采用 Charles 底本原书章号；网站目录中的 89 个页面不是 89 章原文。一年 364 日是作品的历法主张；不能写成现代太阳年的精确长度。药草内容是故事，不附实际处方。
3. **《亚当与夏娃生平》**只选希腊本，又称《摩西启示录》。没有混入拉丁本的河中忏悔、撒但拒拜亚当等段落，也没有采用《亚当夏娃与撒但的争战》的其他故事。希腊本第 13 章说亚当尚有三日，其他版本的天数不能替换进来。版本关系可从[Early Jewish Writings 的分本链接](https://www.earlyjewishwritings.com/lifeadameve.html)继续核对。
4. **多比、犹滴、智训**采用以拉丁传统为背景的 Douay–Rheims / Challoner 旧英文译本，便于明确版权和定位。它们与现代主要依据希腊文本的译本，在措辞、细节与节号上可能不同。本项目通常只标章号，不拼接两种节号。多比指父亲，多比亚指儿子；此处的中文人名用于保持叙述清楚。
5. **《所罗门智训》《多马福音》**的若干段落是劝诫、论述或比喻，没有连续场景。王座、镜面、土地、光等视觉是对文本意象的编辑呈现；不补写成历史人物亲历的事迹。
6. **《雅各原福音》**的白鸽由约瑟的杖中飞出，不能直接改成其他传说的开花手杖。第 22 章得到山中庇护的是以利沙伯与约翰。
7. **《多马幼年福音》**只用网页的 First Greek Form。该页另附其他希腊和拉丁版本，不能把它们视为一份无差异全文。它与保存 114 则语录的《多马福音》是两部不同作品。故事也包含施咒与死亡，选读没有把整部书改写为一串温和神迹。
8. **《马利亚福音》**保留柏林抄本第 1–6、11–14 页缺失的事实。`mary-gap` 是缺页阅读场景，不是隐藏内容关卡；没有创作遗失对白。没有把文中的马利亚身份、灵魂的主人或异象开头写成已经确定，也不附加耶稣婚姻传说。参见 [NASSCAL 的抄本与内容说明](https://www.nasscal.com/e-clavis-christian-apocrypha/gospel-of-mary/)。
9. **《保罗与帖克拉行传》**采用 James 页面中帖克拉部分的段号；该页第 33 节一处误排成 38，应按前后顺序并与 ANF 对读。故事止于第 43 节的传讲，没有混入附录的高龄入山、穿岩或赴罗马结局。
10. **《黑马牧人书》**使用异象、诫命、比喻各自的编号。最后一场依据比喻九中石块受检、修整与弃置，保留有些石头未能再用的情节，不改成无条件全部复原。

## 年代和作者身份

卡片上的年代是宽泛的阅读导航，指文本形成的约略时期，不是故事发生时间、现存抄本年代或一个唯一作者的生卒年。「约」「分层成书」「有争论」均有实际意义，不应在后续设计中去掉。

正典之外不等于伪劣，署名于古人也不等于该古人已被证实亲笔写作。部分作品的形成历经编写、翻译和抄传，旧版译本的导言年代并不自动代表今日所有研究者的共识。

用于复核体裁、版本、年代范围或研究争论的补充阅读：

- [《Death and the Afterlife in Byzantium》第一章，Cambridge University Press](https://www.cambridge.org/core/books/death-and-the-afterlife-in-byzantium/invention-of-traditions-jewish-and-christian-apocrypha/4956D8DF20941467AE8D5B296F472CAF)：说明《以诺一书》的分层成书，以及第 22 章等待审判的灵魂居所。
- [Michael Segal：Shavuot: The Festival of Covenants](https://www.thetorah.com/article/shavuot-the-festival-of-covenants)：研究《禧年书》的作者对约公元前 2 世纪成书与节期主题的说明。
- [USCCB：《多比传》导言](https://bible.usccb.org/bible/tobit/0)、[《犹滴传》导言](https://bible.usccb.org/bible/judith/0)、[《所罗门智训》导言](https://bible.usccb.org/bible/wisdom/0)：交代作品体裁、约略年代与传本。本项目不采用这些现代译本作为大段转述底本。
- [NASSCAL：Protevangelium of James](https://www.nasscal.com/e-clavis-christian-apocrypha/protevangelium-of-james/)、[Acts of Paul](https://www.nasscal.com/e-clavis-christian-apocrypha/acts-of-paul/)：作品概述与后续研究书目。
- [NASSCAL：Gospel of Thomas](https://www.nasscal.com/e-clavis-christian-apocrypha/gospel-of-thomas/)：114 则语录、希腊与科普特见证，以及尚无广泛共识的成书年代和福音关系。
- [Tony Burke：The Syriac Tradition of the Infancy Gospel of Thomas，导言摘录](https://www.nasscal.com/wp-content/uploads/2017/07/Burke-Syriac-IGT-Intro-Only.pdf)：幼年多马故事的早期见证与传本背景。
- [Early Christian Writings：Shepherd of Hermas](https://www.earlychristianwritings.com/shepherd.html)：可追溯的古代见证与不同研究者的年代判断。

## 版权与改编方法

- Charles（1917）、Wells / Charles 编本（1913）、Walker（1886）、Crombie（1885）、James（1924）以及 Douay–Rheims / Challoner 的历史英文译文，为本项目优先采用的公有领域底本。**底本文字与现代网站的版式、修订、说明和品牌是不同权利对象。**本仓库没有复制网页布局、整页内容或现代网站注释。
- [Gospels.net 的《多马福音》](https://www.gospels.net/thomas)及[《马利亚福音》](https://www.gospels.net/mary)页面均由译者 Mark M. Mattison 明确声明其译文已释入公有领域，可为任何目的复制或修改。本项目仍标明译者与抄本基础，并使用原创中文转述。
- 没有复制现代中文《圣经》或商业中文次经译本。中文叙述是本项目依据相关情节重新组织的选读文字，细节浓缩与阅读提示不冒充逐字翻译。
- 正典书目与现代研究说明用于事实核对并提供链接，未整篇转载。旧译本的可用性不意味着其每个校勘决定都无争议；要研究原文、字义或版本差异，仍应查阅相应批判版本。
- 图像、短句、动画节奏与用户操作是作品的艺术层；文献来源是可追溯的阅读层。新增内容应保持这两层可以区分，不制造虚假引文或虚构发现。

## 内容校验记录

- 12 个书卷 ID、72 个场景 ID，均唯一；每卷恰有 6 个场景。
- 3 个类别、10 种允许的视觉主题；全部场景使用合法枚举。
- 每卷 `sourceIds` 均能对应来源；19 项来源均有实际书卷引用。
- 逐场非空字段齐备；标题 4–8、短句 10–24、叙述 70–125、阅读提示 30–65 个 Unicode 字符，已由 Node 脚本检查。
- 数量与结构检查不等于史学结论被自动证明。选段、版本差异及未能恢复的缺页，按上述边界保留。
