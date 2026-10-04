# SIDE BIBLE 工作记录

## 当前任务：视觉第二版（2026-10-05）
- 用户认为第一版审美明显不及 GitHub 上 Claude 的 God Simulator，要求实际学习其设计。
- 目标：全屏自然场景、书法字体、克制的工具与显影节奏；保留 12 卷、72 幕正文、来源和存档。
- 已授权实现、验证、提交与仓库交付；不修改参考项目，不合并 main，不部署公开站点。
- 仓库：`https://github.com/MikhailXiaomaikou/SIDE-BIBLE`。
- 基线：`80851e6`；当前分支：`codex/side-bible-cinematic`。

## 已完成
- 对照原作实际封面及伊甸画面；本机成品与 GitHub 对应文件 blob 一致。详细证据见 `docs/DESIGN-REVISION.md`。
- 首页式布局改为全屏舞台，加入行书、毛笔与文楷，重写云、山、水面、岸树、飞鸟、人物与主题事件。
- 支持在景物上长按、文字逐字显影、松手后展开旁白；保留单击快进、目录、注记、收藏和静谧模式。
- 三套开放字体按 1,286 个汉字制作子集，无汉字缺失。字体与版权许可随单文件内嵌；来源及重建见 `docs/FONTS.md`。
- 独立审查与修复：封面隐藏按钮的键盘焦点、静谧模式标题、云边界、水面反光与手机树木尺寸。
- 24 组 / 51 项自动检查通过；构建从当前源码执行，验证字体内嵌与许可。浏览器顺序验证 72 幕、完整结尾、长按、取消、键盘替代、搜索及续读。
- 新版桌面和手机截图保存在 `docs/images/`；完整验证与边界见 `docs/VERIFICATION.md`。

## 运行与恢复
- 本机服务：`npm start`，绑定 `127.0.0.1:4173`，工具会话 63066。
- 用户入口：`http://localhost:4173/`。原有阅读记录保留，当前不再是全新空白存档。
- 测试入口：`http://127.0.0.1:4173/`，使用独立阅读记录。
- 原作对照服务（8765）与临时测试标签已关闭；用户预览已重载新版。
- 源码在 `src/`；用 `npm run build` 更新根目录成品，`npm test` 检查。修改中文后先运行 `python3 scripts/subset-fonts.py`。
- 基线副本在 Git 及忽略目录 `artifacts/side-bible-before-cinematic.*`；测试证据在 `artifacts/browser-traversal-cinematic.json`。
- 视觉实现提交：`d7375bd`，已推送 `codex/side-bible-cinematic`。草稿审阅入口：`https://github.com/MikhailXiaomaikou/SIDE-BIBLE/pull/1`。
- 本轮实现、验证和交付已完成，main 仍为 `80851e6`，没有合并或部署。下一步为用户查看视觉效果；没有后台制作任务。

## 初始交付历史
- 用户选择广泛精选，并逐卷标明传统。
- 原始成品提交 `b7e330c`，交付到新建的 public 仓库 main；后续基线为 `80851e6`。
- 原创中文导读，不是全文合集或逐字译本；12 部作品、72 幕、19 项来源。详情见 `docs/SOURCES.md`。
- 没有复制原作代码或资产；没有启用 GitHub Pages。
