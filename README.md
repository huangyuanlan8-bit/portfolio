# Yuanlan Huang · Portfolio

Bilingual product, interaction and service design portfolio: About Me, Awards & Recognition, Projects, Experience, Journal / Photography and Contact.

This is a **custom Node.js static site generator**, with React 19 / GSAP islands and native JavaScript / WebGL interactions. It is not a Vite or Next.js application and needs no server, database, API keys or paid Workers at runtime.

## Run a clean checkout

Use Node.js **24.22.1**, pinned in `.node-version`.

```sh
npm ci
npm run build
npm run check
npm test
npm run dev
```

The local preview is printed by `server.mjs`. Production output is **`cloudflare-pages/`**. The build bundles React / GSAP, generates all bilingual HTML pages and copies versioned `public/assets`, then verifies links, media, CVs, direct routes and Cloudflare's per-file limit. It works without an existing `dist`, generated bundle, ffmpeg or developer cache.

Performance: see [the production audit](PERFORMANCE.md). Shared code and styles use content-hashed `/static/` URLs; heavy features and below-the-fold media load on demand. The root defaults to English.

## Cloudflare Pages: GitHub automatic deployment

Connect `huangyuanlan8-bit/portfolio` using **Pages → Connect to Git**, then use:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Production branch | main |
| Build command | npm run build |
| Build output directory | cloudflare-pages |
| Root directory | Leave blank (repository root) |
| Environment variables / secrets | None required; optional NODE_VERSION=24.22.1 matches .node-version |

The sole package manager lockfile is `package-lock.json`; Pages installs dependencies automatically. Do not enable `SKIP_DEPENDENCY_INSTALL` or omit build dependencies. Every push to `main` then builds and deploys to the Pages project's free `pages.dev` address.

Full instructions and live checks: [CLOUDFLARE-PAGES.md](CLOUDFLARE-PAGES.md).

## Source map

- `build.mjs`, `build-pages.mjs`: bilingual static generation and production orchestration.
- `public/assets/`: all web-ready images, videos, font and two CV PDFs; committed to Git.
- `content.mjs`, `site-data.mjs`, `project-stories.mjs`, `portfolio-pages.mjs`, `project-films.mjs`: page and project content.
- `awards.mjs`: grouped bilingual awards and academic recognition.
- `photography-data.mjs`: photograph order and captions.
- `react/`, `bundle-journal.mjs`: Folder, FoldText, Shuffle and Journal components.
- `portfolio-motion.js`, `project-image-ready.js`, `cover-transition.js`: media-readiness-controlled project/gallery transitions.
- `photo-film-*.js`, `photography.js`: deformed 3D film, navigation, saturation and full-image viewer.
- `badge-physics.js`, `badges.js`: independent constrained badge interactions.
- `pages-redirects`, `pages-headers`, `pages-audit.mjs`: Pages route/header inputs and production validation.

## Media and repository policy

Only web-ready media goes in `public/assets`. The Care Meal and Dragon videos are the previously optimized H.264 / AAC copies, each **23.28 MiB**, with fast-start metadata. Care Meal is 720p; Dragon is 1080p. Their checksums are recorded in `media-manifest.json` and checked at build time, so the cloud build cannot accidentally substitute a larger original.

Original high-resolution media remains in the owner's local material folders, outside this Git repository. Old unreferenced videos are excluded. No Git LFS or external media account is needed. If replacing a video, retain its original locally, prepare a web MP4 below 25 MiB, update its poster / `project-films.mjs` metadata and the checksum in `media-manifest.json`.

`node_modules`, `dist`, `cloudflare-pages`, generated bundles, caches, research artifacts, archives and credentials are ignored. Never commit `.env`, tokens, private keys or local auth files. System text fonts have stable Chinese/English fallbacks; the Contact display font is self-hosted.

## Routing

The site has a real `index.html` for every route; it is a multi-page static site. The root redirects to the default English home `/en/`; Chinese remains available at `/zh/`. Examples:

- `/en/work/care-meal/`
- `/zh/work/other-work/`
- `/en/journal/photography/`

Pages serves these directly and after refresh. A real `404.html` handles missing paths. There is deliberately no global SPA fallback. Same-origin iframe page transitions are permitted by the response headers.

## Tests

`npm run build` validates the generated production tree. `npm run check` repeats deployment checks. `npm test` checks all project entry / decode / retry / history transitions, the media overlay renderer, and the bilingual certificate-based awards records. These are offline checks; verify the actual public Pages URL after connecting GitHub.
