const menu = document.querySelector('.menu-button');
const nav = document.querySelector('#mobile-nav');
function closeMenu() { if (!menu || !nav) return; menu.setAttribute('aria-expanded', 'false'); nav.hidden = true; }
if (menu && nav) {
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', String(!open)); nav.hidden = open; });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !nav.hidden) { closeMenu(); menu.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  matchMedia('(min-width: 761px)').addEventListener('change', event => { if(event.matches) closeMenu(); });
}

// All content starts visible. Entrance effects never gate access to the work.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  }), {threshold: 0.08});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Preserve section context where a corresponding translated anchor exists.
const languageLink = document.querySelector('.language');
if (languageLink) {
  const translatedPage = languageLink.getAttribute('href');
  function updateLanguageSection() {
    const hash = location.hash && document.getElementById(location.hash.slice(1)) ? location.hash : '';
    languageLink.setAttribute('href', translatedPage + hash);
  }
  updateLanguageSection();
  addEventListener('hashchange', updateLanguageSection);
}

