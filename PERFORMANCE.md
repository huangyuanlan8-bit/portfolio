# Production performance audit — 27 October 2026

The release keeps the layout, curved project covers, badge physics, Journal folder and photography shaders. The default root entry is now English (`/en/`); Chinese remains at `/zh/`.

## Measurements

Actual production requests to `https://yuanlan-huang.pages.dev/en/`, using Chromium 155 / CDP Network and Performance tracing, Windows, 1440 × 900, DPR 1, a fresh context and disabled HTTP cache for each cold sample. The machine's existing system proxy was retained. No CPU throttle; headless WebGL uses the software fallback, so this is not a hardware GPU benchmark.

Baseline: `dc96e10`, four cold runs. Optimized: `4a8d4ee`, three cold runs after Cloudflare production deployment. Request and transfer totals use the same window: eight seconds after DOMContentLoaded. Raw sampled numbers and flow results are in [performance-results.json](performance-results.json).

| Metric | Before | After |
| --- | ---: | ---: |
| First contentful paint, median | 4.44 s | 1.14 s |
| Largest contentful paint, median | 5.41 s | 1.48 s |
| Homepage requests, median | 66 | 25 |
| Homepage transfer, median | 4.02 MiB | 0.82 MiB |
| Care Meal cover entry, successful samples | 4.14–6.89 s | 1.63–1.68 s |
| Next Project, successful samples | 7.92–10.18 s | 1.41 s |
| Photography entry, successful sample | 3.94 s | 1.28 s |

All six projects were also opened on the public production site with normal caching enabled: first in-site entry took 1.49–1.79 s; repeated entry took 1.07–1.10 s. These times include the retained cover animation. Photography is prepared when its Journal entry approaches the viewport, so its entry time includes that intentional preparation.

The baseline also reproduced 15-second Next Project and Photography timeouts. During intermediate preview tests, the network occasionally took 7–8 seconds just to return a document, or closed a connection. These are transport waits, distinct from animation frame work. The production comparison above uses the production domain, not those preview domains. Network conditions and location still affect timings.

## Bottlenecks and changes

- The old page requested 16 stylesheets and all feature scripts immediately. Initial long tasks in one baseline sample were 141 ms and 71 ms. The homepage now receives the existing styles inline for its first paint, caches one hashed stylesheet asynchronously, and uses a small common script. Projects, badges and React / GSAP load near their own sections; gallery code belongs to its own document.
- The old homepage fetched distant Journal photographs, and full-size hero layers were much larger than their displayed sizes. Responsive hero copies preserve the original files; folder-only photographs use 384/768 px copies. The gallery previews and full-size viewer photographs remain unchanged.
- The transition previously waited for the iframe's `load` event and `document.fonts.ready`. It now signals when the common page controller is mounted, prepares and decodes only the first project image, and retains the cover until the real image has received a paint opportunity. Font readiness and lower boards are outside that gate.
- Hover/focus prepares one selected project document and its first image. There is no all-project document sweep and no separate fetch followed by a second iframe document request. Click feedback and a readable loading status appear immediately; failures retain the current page and provide Retry.
- Later boards have inert sources until they approach the viewport. A preparing iframe remains inactive. Videos keep `preload="none"` and no media source until a playback gesture. No MP4 request occurred in the measured browse flow, including scrolling to Next Project.
- Photography prepares only the central image and visible neighborhood. Its code travels with the gallery document without executing in a hidden frame. A follow-up shares the central image object between intent preparation, the document and texture upload, avoiding repeated downloads even when cache is disabled. Hover raycasts run once per rendered mesh, rather than once per physics substep.
- Orbit, ink, badge, folder and GSAP work pause offscreen or on `portfolio:suspend`. Over a 2.2-second production sample with Photography active, the hidden homepage executed **0** RAF callbacks while the visible film executed **133**. Film motion and lighting remain active where visible.

## Verification

- Production build and Pages audits: 30 HTML entries, 28 bilingual direct routes, 409 files; every file below 25 MiB. Existing processed videos and CVs are retained. No local-drive or localhost asset dependencies.
- Tests: all six projects in both languages, delayed decode and delayed paint, retained cover, retry, history restoration, reduced motion and awards content.
- Real Chromium: all six production project entries and repeated entries, Next Project, folder click, wheel browsing, full-color viewer, page return buttons, browser Back, Journal scroll restoration and 390 px mobile layout. No script errors in the completed production flow.
- Delayed-media simulation: first images delayed by 1.6 seconds in each of the six projects; lower boards held indefinitely. Each project still entered when its first image was ready. A failed first image preserved the page, and Retry recovered.
- CDP slow-network run: 150 ms latency, 1.6 Mbps download, 750 kbps upload. FCP 1.30 s, LCP 5.30 s; Care Meal entry 3.07 s, Next Project 1.56 s, repeated cover entry 1.08 s. The complete flow and browser returns succeeded without script errors. Photography remained bandwidth-sensitive (7.80 s before the final shared-image follow-up), with loading feedback throughout.
- Root response verified as `302 → /en/`; Chinese switching remains available.

Detailed local traces and screenshots are retained under `E:\作品集\Portfolio_Website\.work\performance-1027`; they are excluded from Git and publication. The JSON report contains only site measurements, not authentication or browsing data.
