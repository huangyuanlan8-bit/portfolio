/* One viewport background, sampled directly from the gallery's existing scroll range. */
window.PortfolioAtmosphere=function({ring,headerHeight}){
 const body=document.body,about=document.querySelector('#about'),projects=document.querySelector('#projects'),experience=document.querySelector('#experience');
 if(!about||!projects||!experience)return null;
 const clamp=v=>Math.max(0,Math.min(1,v)),smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
 const layer=document.createElement('div');layer.className='gallery-atmosphere';layer.setAttribute('aria-hidden','true');body.prepend(layer);body.classList.add('gallery-flow');
 const meta=document.querySelector('meta[name="theme-color"]');let enterStart=0,enterEnd=1,exitStart=2,exitEnd=3,measureFrame=0,state=null;
 function update(){const y=window.scrollY,enter=clamp((y-enterStart)/(enterEnd-enterStart)),exit=clamp((y-exitStart)/(exitEnd-exitStart));const darkness=smooth(.18,1,enter)*(1-smooth(0,1,exit));const reveal=smooth(.18,.95,enter);
  if(state&&Math.abs(state.darkness-darkness)<.000001&&Math.abs(state.reveal-reveal)<.000001)return;
  const channels=[255-247*darkness,255-246*darkness,255-246*darkness].map(Math.round),dark=darkness>=.56;
  // A contrast-preserving polarity change avoids gray text disappearing on gray.
  const foreground=dark?Math.round(255-12*smooth(.56,1,darkness)):Math.round(21*(1-smooth(0,.56,darkness)));
  const muted=dark?Math.round(255-93*smooth(.7,1,darkness)):Math.round(112*(1-smooth(0,.4,darkness)));
  const bg=`rgb(${channels.join(',')})`,fg=`rgb(${foreground},${foreground},${foreground})`,secondary=`rgb(${muted},${muted},${muted})`;
  body.style.setProperty('--gallery-bg',bg);body.style.setProperty('--gallery-bg-rgb',channels.join(' '));body.style.setProperty('--gallery-fg',fg);body.style.setProperty('--gallery-fg-rgb',`${foreground} ${foreground} ${foreground}`);body.style.setProperty('--gallery-muted',secondary);body.style.setProperty('--gallery-dark',darkness.toFixed(6));body.style.setProperty('--gallery-reveal',reveal.toFixed(6));body.style.setProperty('--gallery-lift',`${((1-reveal)*20).toFixed(3)}px`);
  body.dataset.galleryTone=dark?'dark':'light';layer.dataset.progress=darkness.toFixed(6);layer.dataset.phase=enter<1?'entering':exit>0&&exit<1?'leaving':exit>=1?'white':'gallery';meta?.setAttribute('content',bg);state={darkness,reveal,enter,exit,background:bg,foreground:fg};
 }
 function measure(){const vh=window.innerHeight,distance=vh*.72,top=projects.getBoundingClientRect().top+window.scrollY;enterEnd=ring?.enabled?ring.timeline.start:top-headerHeight();enterStart=enterEnd-distance;exitStart=ring?.enabled?ring.timeline.end:experience.getBoundingClientRect().top+window.scrollY-vh;exitEnd=exitStart+distance;update();}
 const observer=new ResizeObserver(()=>{if(measureFrame)return;measureFrame=requestAnimationFrame(()=>{measureFrame=0;measure();});});[about,projects,experience].forEach(el=>observer.observe(el));
 document.fonts?.ready.then(measure);measure();return {measure,update,get timeline(){return {enterStart,enterEnd,exitStart,exitEnd};},get state(){return state;}};
};
