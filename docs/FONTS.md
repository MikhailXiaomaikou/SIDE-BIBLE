# SIDE BIBLE 字体来源与重建

本项目从官方仓库独立下载完整字体，按 SIDE BIBLE 的文本重新生成 WOFF2 子集，没有复制 God Simulator 的字体资产。参考项目的三份旧子集均缺少首次扫描所需的 1,280 个汉字中的 123 个，例如「串、夙、忏、噬、榆」；因此不能直接复用。

## 字体层级

| 本项目字体名 | 文件 | 原字体与版本 | 用途 |
| --- | --- | --- | --- |
| Side Xing | `src/fonts/side-xing.woff2` | Zhi Mang Xing 2.001 | 「旁经」标题、每幕引语，表现行书的笔势 |
| Side Brush | `src/fonts/side-brush.woff2` | Ma Shan Zheng 2.003 | 书卷名称与章节标签 |
| Side Kai | `src/fonts/side-kai.woff2` | LXGW WenKai 1.522 | 故事正文、注释、来源与中文界面 |

三份子集均使用独立的内部字体名，保留原作者、版权和许可证元数据。修改后的字体仍按 OFL 1.1 分发。LXGW 原字体的保留名称不作为本项目子集的主字体名。

CSS 可以使用 `"Side Xing", "Side Kai", serif` 与 `"Side Brush", "Side Kai", serif` 的回退顺序，正文使用 `"Side Kai", serif`。原字体未提供的少量箭头等符号交给系统字体或 SVG 图标；这与汉字覆盖统计分开记录。字体在本地页面中使用，不需要 Google Fonts 或其他在线字体服务。页面打包器负责把这三份 WOFF2 嵌入最终页面。

## 原始来源与许可证

Google Fonts 固定提交：`9710da1eacb3be272583c3224dcb70f9da6eadbb`。LXGW WenKai 固定提交：`8bd6319350fb3ae1904c1cb1a41595ab15d21140`。使用固定提交避免上游更新导致本地构建悄悄变化。

| 原字体 | 官方完整字体 | 官方许可证 | 仓库内原文 |
| --- | --- | --- | --- |
| Zhi Mang Xing | [Google Fonts TTF](https://raw.githubusercontent.com/google/fonts/9710da1eacb3be272583c3224dcb70f9da6eadbb/ofl/zhimangxing/ZhiMangXing-Regular.ttf) | [OFL 1.1](https://raw.githubusercontent.com/google/fonts/9710da1eacb3be272583c3224dcb70f9da6eadbb/ofl/zhimangxing/OFL.txt) | `src/fonts/OFL-ZhiMangXing.txt` |
| Ma Shan Zheng | [Google Fonts TTF](https://raw.githubusercontent.com/google/fonts/9710da1eacb3be272583c3224dcb70f9da6eadbb/ofl/mashanzheng/MaShanZheng-Regular.ttf) | [OFL 1.1](https://raw.githubusercontent.com/google/fonts/9710da1eacb3be272583c3224dcb70f9da6eadbb/ofl/mashanzheng/OFL.txt) | `src/fonts/OFL-MaShanZheng.txt` |
| LXGW WenKai | [LXGW 官方 TTF](https://raw.githubusercontent.com/lxgw/LxgwWenKai/8bd6319350fb3ae1904c1cb1a41595ab15d21140/fonts/TTF/LXGWWenKai-Regular.ttf) | [OFL 1.1 与上游附加许可](https://raw.githubusercontent.com/lxgw/LxgwWenKai/8bd6319350fb3ae1904c1cb1a41595ab15d21140/OFL.txt) | `src/fonts/OFL-LXGWWenKai.txt` |

Zhi Mang Xing 与 Ma Shan Zheng 版权属于各自的 Project Authors（2018）；LXGW WenKai 保留 LXGW（2021–2026）及其上游 Klee Project Authors（2020）的版权信息。三份官方许可证完整保存在仓库中，未改写、未删节。OFL 允许随软件分发及嵌入；字体不能单独出售，派生字体继续采用 OFL。详细条款以上方原文为准。

完整原始文件 SHA-256：

```text
ZhiMangXing-Regular.ttf
644e0cae9b40f0b10ab729a01bd32032e3973bac22be3dccae01bf6ae7fde969
MaShanZheng-Regular.ttf
6d2546bb189c732a8ca29af9e22457b152387d158aa459e4ac2ce1e51788b7fb
LXGWWenKai-Regular.ttf
39ad71264b588165b469e35e6afb162a378dacd1f95348160240ba9038ac3009
```

许可证原文 SHA-256：

```text
OFL-ZhiMangXing.txt
10947328199e369a3e6b4a67e8e5507ed99d5bbb264a1f156415aa9b665e4d15
OFL-MaShanZheng.txt
d7bdb1cee215b689e23c2f95672a6084c790542170648267a55114103d756a08
OFL-LXGWWenKai.txt
1a25e35da1031c6c3436fde545bb9cb5aca954e9873afe510c834b8b79bd21a0
```

## 覆盖范围与构建结果

子集字符来自 `src/content.js`、`src/index.html`、`src/main.js` 的完整 Unicode 文本、可打印 ASCII、标题及操作提示种子、常用中文标点。三个字体都使用相同字符集，避免切换字体后出现缺字。字形替换、组合字形和适用的 Unicode 变体选择序列由 fontTools 保留；LXGW WenKai 子集保留 `U+FE00`、`U+FE01` 的适用标点变体，不以替换编码字符的方式混用简繁字。

当前构建需覆盖 **1,286 个不同汉字**；三份字体的缺失汉字均为 **0**。汉字范围包含 Unicode 基本 CJK、扩展 A、兼容汉字及扩展平面。实际输入文件 SHA-256、输出 SHA-256、字形数、其他缺失符号的编码完整记录在 `src/fonts/manifest.json`，每次重建都会更新。

| 字体文件 | 字节数 | 缺失汉字 |
| --- | ---: | ---: |
| side-xing.woff2 | 407,084 | 0 |
| side-brush.woff2 | 560,140 | 0 |
| side-kai.woff2 | 312,956 | 0 |
| 合计 | **1,280,180** | **0** |

当前文本中，行书与毛笔子集的上游原字体不含 `·`（U+00B7）、`↗`（U+2197）、`⤢`（U+2922）；前两个由 Side Kai 覆盖。Side Kai 仅缺 `⤢`，可以用系统符号字体或 SVG 显示。缺失非汉字符号不计入“缺失汉字为 0”的结论。

## 重建

依赖：Python 3、fontTools（本次为 4.62.1）与 brotli。首次准备原始字体时，在项目根目录运行：

```sh
python3 scripts/subset-fonts.py --download
```

该命令只从上述固定官方地址下载缺失文件，验证 SHA-256 后写入；不会安装软件。完整 TTF 保存到已被 Git 忽略的 `artifacts/fonts/`，不会进入提交。许可证保存在 `src/fonts/`，需要随字体一起分发。

修改界面或故事文字后，离线重建：

```sh
python3 scripts/subset-fonts.py
```

随后重新运行项目的 HTML 构建命令，让嵌入的字体与新文本一致。脚本会重新读取所有默认输入，验证原始字体与许可证校验值，检查输出的 CJK 覆盖；发现任何缺失汉字就返回失败。`--originals-dir`、`--output-dir` 可指定其他目录；`--input` 可重复传入自定义文本文件，使用时会替换默认输入列表。脚本不读取参考项目，已保存的官方源文件足以完成离线重建。
