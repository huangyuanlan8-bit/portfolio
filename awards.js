(()=>{
 const section=document.querySelector('[data-awards-reveal]');
 if(!section||!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 let played=false;
 const visible=()=>!document.documentElement.classList.contains('motion-native-hidden')&&window.frameElement?.style.visibility!=='hidden';
 const reveal=()=>{
  if(played||!visible())return;
  played=true;observer.disconnect();
  // No CSS hiding: failed initialization always leaves the archive readable.
  section.animate([{opacity:.35},{opacity:1}],{duration:500,easing:'ease-out'});
 };
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))reveal();},{rootMargin:'0px 0px -12% 0px',threshold:0});
 observer.observe(section);
 addEventListener('portfolio:resume',()=>{const r=section.getBoundingClientRect();if(r.top<innerHeight*.88&&r.bottom>0)reveal();});
})();
