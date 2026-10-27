# Journal 与页面动效

- `react/Folder.jsx`、`react/Folder.css` 来自用户提供的 React Bits Folder 源码；为 Photography 调整了 spread 照片的展开高度。组件配置和真实照片数据在 `react/journal.jsx`，关闭组件 intro。
- `react/FoldText.jsx` 使用用户提供的三维折叠展开效果，Journal 与 Photography 标题在字体就绪、进入视口时播放。`journal-motion.js` 协调外层文件夹、说明和入口的入场；sessionStorage 保留本次浏览的完成状态。
- `journal-components.js` / `.css` 为忽略的构建产物。执行 `npm ci` 后，`npm run build` 会从 `react/` 重新打包并生成 `cloudflare-pages`。Cloudflare 与本机使用同一构建流程。
- `portfolio-motion.js` 为静态多页面网站提供页面准备、历史记录和转场。目标页面在同源独立文档中先加载、布局并解码首屏图片，再开始动画。只保留最多四个页面视图；隐藏视图暂停视频和摄影渲染，返回时复用原有视图和滚动位置。浏览器 URL 与历史记录始终对应当前可见页面。
- `cover-transition.js` 用细分网格承接 orbit 导出的实际曲面与姿态，平滑展平、放大，最后衔接原详情首张图片。详情和 Next Project 的 HTML 布局不变。
- Photography 只缩放 `.photo-film-canvas`，标题和按钮独立淡入。导航和正文不参与缩放。
- 图片或页面准备失败时不启动退场，恢复交互并提示重试；重试重新准备失败的视图。动画期间锁定重复点击。减少动态效果时使用 160ms 左右的淡入淡出。
- 可选粒子默认关闭；在浏览器顶层可通过 `PortfolioTransitions.setParticles(true)` 开启，`false` 关闭。

检查：`npm run check` 检查静态引用；`npm run test:transitions` 覆盖页面不存在、首图失败、摄影加载失败、重试、重复点击、Next Project、后退位置恢复和减少动态效果。界面另行验证 Folder 悬停、文字入口、画廊操作和窄屏布局。
