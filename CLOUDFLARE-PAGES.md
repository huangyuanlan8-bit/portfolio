# GitHub → Cloudflare Pages 自动部署

GitHub 仓库：<https://github.com/huangyuanlan8-bit/portfolio>

## Cloudflare 中填写

| 配置项 | 值 |
| --- | --- |
| 框架预设 | **None / 无** |
| 生产分支 | **main** |
| 构建命令 | **npm run build** |
| 构建输出目录 | **cloudflare-pages** |
| 根目录 | **留空，使用仓库根目录** |
| 环境变量 | 无必填项；可显式设置 **NODE_VERSION=24.22.1**，与仓库 `.node-version` 一致 |
| 密钥 | 不需要 API Token、GitHub Token 或其他项目密钥 |

实际技术栈是 Node.js 自定义静态生成器，React / GSAP 只用于局部交互，另有 WebGL。不要选择 Vite / Next.js 预设，不需要 Pages Functions 或付费 Worker。Pages 根据 `package-lock.json` 自动安装 npm 依赖；不要设置 `SKIP_DEPENDENCY_INSTALL`。

## 连接步骤

1. 登录 Cloudflare，进入 **Workers & Pages → Create application → Pages → Connect to Git**。
2. 选择 GitHub，授权 **Cloudflare Workers and Pages** 访问 `huangyuanlan8-bit/portfolio`，然后选择该仓库。
3. 按上表填写，点击 **Save and Deploy**。Cloudflare 会检出 `main`、安装依赖、构建并发布。
4. 使用控制台给出的 `项目名.pages.dev` 免费地址。以后推送 `main` 会自动更新生产网站。

如果此前已经创建了 Direct Upload 项目，需新建一个连接 GitHub 的 Pages 项目；Direct Upload 项目不能原地改成 Git 集成。尚未创建过项目则直接按上面步骤连接。

## 构建如何摆脱本机依赖

`public/assets` 是随 Git 提交的网页素材输入，包括图片、摄影照片、字体、四个在用视频及中英文 CV。生产构建：

1. 检查素材单文件大小，并验证两个压缩视频的 SHA-256。
2. 用 esbuild 从 `react/` 重新生成 React / GSAP 生产 bundle。
3. 在全新的 `cloudflare-pages.staging` 生成双语 HTML，复制 `public/assets`。
4. 检查资源引用、srcset、字体 URL、摄影配置、本机路径、视频 fast-start、CV 和静态路由。
5. 检查通过后生成 `cloudflare-pages`，供 Pages 上传；报告保存在忽略的 `cloudflare-pages-report.json`。

Cloudflare 不需要本机 `dist`、E 盘素材、ffmpeg、Python 或任何缓存。`node_modules`、生成目录、旧本机素材预处理脚本、缓存和密钥均不提交。Git 仓库只保留实际构建需要的网页素材，不上传原始超大视频。

## 视频限制

Pages 的单文件上限为 **25 MiB = 26,214,400 bytes**。

| 网页视频 | 原大小 | Git 中使用的副本 |
| --- | ---: | --- |
| Care Meal | 84.97 MiB | 23.28 MiB，1280×720，30fps |
| Dragon | 26.73 MiB | 23.28 MiB，1920×1080，30fps |
| 旧 `scent-film.mp4` | 101.25 MiB | 页面无引用，不进入 Git 和发布包；当前 Scent 视频保留 |

两个压缩视频为 H.264 / AAC，保留完整时长、音频和 fast-start 索引，清晰度会低于原视频；原始文件仍保留在本机原素材目录。`media-manifest.json` 记录压缩版本，CI 构建不重新压缩，也不会读取原始视频。其他在用视频均小于 25 MiB。

新增大素材会直接使构建失败并显示文件名。应先在本地生成小于 25 MiB 的网页副本，再更新对应配置和校验值；不能依靠清空缓存绕过限制。若以后需要原画质大视频，可另选支持大文件的外部存储，本次不依赖该服务。

## 路由与上线验收

项目详情在 `/{zh|en}/work/{slug}/index.html`，摄影在 `/{zh|en}/journal/photography/index.html`。Pages 原生匹配目录首页，能直接打开和刷新；无全局 SPA 重写。`pages-redirects` 在构建后变为 `_redirects`，根路径 `/` 默认指向英文 `/en/`，中文保留在 `/zh/`。真实 `404.html` 防止资源缺失时误返回首页。

`pages-headers` 构建为 `_headers`，允许项目转场使用同源 iframe，沿用 Pages 默认缓存策略。

第一次上线后，请检查：

- 中文和英文首页、语言切换及导航锚点。
- 六个项目详情的直接访问和刷新，项目首图、视频播放、下一项目与返回位置。
- `/en/journal/photography/` 直接访问和刷新，照片、拖拽、彩色中心和大图。
- 中英文 Download CV、邮箱和返回顶部。
- 不存在的地址正常显示 404。

发布前的构建、资源、路由及转场测试不能代替公网部署后的网络验收。构建失败时，在 Pages → Deployments → Build log 查看错误；本项目无需修改任何 GitHub 密钥。

## 本地复现

```sh
npm ci
npm run build
npm run check
npm test
npm run dev
```

## 官方文档

- [Git 集成](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [构建设置](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Node 版本与构建环境](https://developers.cloudflare.com/pages/configuration/build-image/)
- [25 MiB 单文件限制](https://developers.cloudflare.com/pages/platform/limits/)
- [静态路由、404 与缓存](https://developers.cloudflare.com/pages/configuration/serving-pages/)
