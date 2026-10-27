# Contact footer

`contact.mjs` generates the bilingual footer. Only the email address, localized CV download, and Back to top are links. The navigation CONTACT button targets the current page's `#contact` footer.

The supplied React Bits Shuffle source is in `react/Shuffle.jsx` and `react/Shuffle.css`. `react/ContactFooter.jsx` sets slide / up / sequence, duration .45, stagger .04, shuffleTimes 1, first-entry once, hover replay, no looping or motion blur, and reduced-motion support. Small integration changes defer the first run until a preloaded view becomes visible, settle hidden views, and measure characters again on resize. The display word's DOM attributes expose its current animation state and completed starts for UI verification.

`public/assets/fonts/yuanlan-segment-display.woff2` is original lettering drawn for this portfolio and is copied to the published `cloudflare-pages/assets/fonts` directory. Its rounded segments cover only the characters used in `/ CONTACT`; it does not import any third-party font outlines. All other footer text uses the site's existing fonts. The generation source and TTF preview remain in the owner's local workspace outside this repository.

GSAP 3.13.0 and @gsap/react 2.1.2 are pinned in package.json and package-lock.json. Run `npm ci` and `npm run build` to rebuild the component bundle and the complete production site. Cloudflare Pages runs the same build from a clean Git checkout.
