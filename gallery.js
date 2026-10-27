/* A single scroll clock drives orbit position, depth and orientation. */
window.PortfolioGallery=function(section,headerHeight){
 const cards=[...section.querySelectorAll('.orbit-card')],scene=section.querySelector('.orbit-scene'),sticky=section.querySelector('.projects-sticky');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width:900px)');
 const count=cards.length,travel=count-1,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 let renderer=null,fallbackReady=false,featureReady=false,loading=null,inkReady=false;
 let enabled=false,start=0,span=1,phase=0,target=0,selected=0,raf=0,last=0,visible=false,suspended=!window.PortfolioRuntime?.isActive();
 function ensure(){if(featureReady||loading||!visible||suspended||!enabled)return;loading=window.PortfolioRuntime.loadFeature('projects').then(()=>{featureReady=true;measure();if(!inkReady){inkReady=true;window.PortfolioInk(sticky,reduced,small);}}).catch(error=>{loading=null;console.warn('Projects keeps its accessible cards.',error);fallback();measureFallback();paint();});}
 const counter=section.querySelector('[data-project-count]'),name=section.querySelector('[data-project-title]'),bar=section.querySelector('.orbit-progress>span');
 // CSS remains a fallback for devices where a GPU context is unavailable.
 function fallback(){if(fallbackReady)return;fallbackReady=true;cards.forEach(card=>{const face=card.querySelector('.curved-face'),content=face.innerHTML;for(let i=0;i<9;i++){const slice=document.createElement('div');slice.className='curve-slice';slice.setAttribute('aria-hidden','true');slice.style.setProperty('--slice',i);slice.innerHTML=`<div class="slice-content">${content}</div>`;face.append(slice);}});}
 function measureFallback(){const layout=window.PortfolioOrbitGeometry.measure(scene.clientWidth);scene.style.setProperty('--orbit-camera',layout.camera+'px');cards.forEach(card=>{card.style.setProperty('--card-width',layout.cardWidth+'px');for(const [i,slice] of [...card.querySelectorAll('.curve-slice')].entries()){const u=(i+.5)/9-.5,angle=u*layout.cardWidth/layout.curveRadius;slice.style.setProperty('--bend',((Math.cos(angle)-1)*layout.curveRadius)+'px');slice.style.setProperty('--shift-x',(Math.sin(angle)*layout.curveRadius-u*layout.cardWidth)+'px');slice.style.setProperty('--yaw',(angle*180/Math.PI)+'deg');}});}
 function updateSelection(i){selected=(i+count)%count;cards.forEach((c,j)=>{c.dataset.active=String(j===selected);if(j===selected)c.setAttribute('aria-current','true');else c.removeAttribute('aria-current');});counter.textContent=`${String(selected+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;name.textContent=cards[selected].getAttribute('aria-label');section.dataset.selected=selected;}
 function paint(){
  if(!enabled||!visible||suspended)return;
  const layout=window.PortfolioOrbitGeometry.measure(scene.clientWidth);
  const poses=window.PortfolioOrbitGeometry.poses(layout,phase,count);
  cards.forEach((card,i)=>{
   const {angle,x,y,z}=poses[i];
   if(!renderer?.available){card.style.width=layout.cardWidth+'px';}
   const wrapped=Math.atan2(Math.sin(angle),Math.cos(angle)),opacity=window.PortfolioOrbitGeometry.visibility(wrapped);
   if(!renderer?.available){card.style.transform=`translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,${z.toFixed(3)}px) translate(-50%,-50%) rotateZ(${(-2-Math.sin(wrapped)*4).toFixed(3)}deg) rotateY(${(wrapped*.79*180/Math.PI).toFixed(3)}deg) rotateX(-4deg)`;card.style.opacity=opacity;card.style.pointerEvents=opacity?'':'none';card.tabIndex=opacity?0:-1;card.style.setProperty('--card-width',card.offsetWidth+'px');}
   card.dataset.position=`${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)}`;
  });
  // Nearest foreground point on the ring, shared by pointer and keyboard entry.
  updateSelection(Math.round(phase)%count);if(renderer?.available)renderer.render(poses,selected);bar.style.width=(phase/travel*100)+'%';section.dataset.progress=(phase/travel).toFixed(5);
 }
 function tick(time){raf=0;if(!enabled||!visible||suspended)return;const dt=last?Math.min((time-last)/1000,.05):1/60;last=time;target=clamp((scrollY-start)/span,0,1)*travel;phase+=(target-phase)*(1-Math.exp(-dt/0.085));if(Math.abs(phase-target)<.00008)phase=target;paint();if(Math.abs(phase-target)>.00005)raf=requestAnimationFrame(tick);else last=0;}
 function render(){if(enabled&&visible&&!suspended&&!raf)raf=requestAnimationFrame(tick);}
 function measure(){
  const next=!reduced.matches&&!small.matches;const changed=next!==enabled;enabled=next;section.classList.toggle('orbit-enhanced',enabled);section.dataset.mode=enabled?'tilted-orbit':'static';
  if(enabled&&visible&&!suspended&&featureReady&&!renderer)renderer=window.createOrbitRenderer?.(scene,cards);if(enabled&&featureReady&&!renderer?.available){fallback();measureFallback();}
  renderer?.mode(enabled&&renderer.available);if(enabled&&visible&&!suspended)renderer?.resize();section.dataset.renderer=enabled&&renderer?.available?'webgl-curved-mesh':'css';ensure();
  start=section.getBoundingClientRect().top+scrollY-headerHeight();span=Math.max(1,section.offsetHeight-sticky.offsetHeight);
  if(enabled){target=clamp((scrollY-start)/span,0,1)*travel;if(changed)phase=target;paint();render();}
  else{cancelAnimationFrame(raf);raf=0;cards.forEach(c=>{c.style.transform='';c.style.width='';c.style.opacity='';c.style.pointerEvents='';c.tabIndex=0;c.style.removeProperty('--card-width');});bar.style.width='100%';}
 }
 function yForPhase(n){return start+clamp(n,0,travel)/travel*span;}
 function selectIndex(index){if(enabled){window.scrollTo({top:yForPhase(index),behavior:reduced.matches?'instant':'smooth'});}else{updateSelection(index);cards[selected].scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'});}}
 scene.addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();let step=event.key==='Home'?0:event.key==='End'?travel:clamp((enabled?Math.round(phase):selected)+(event.key==='ArrowLeft'?-1:1),0,travel);if(enabled)window.scrollTo({top:yForPhase(step),behavior:'smooth'});else selectIndex(step);});
 cards.forEach((card,i)=>card.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;if(enabled&&i!==selected){event.preventDefault();selectIndex(i);}else updateSelection(i);}));
 reduced.addEventListener('change',measure);small.addEventListener('change',measure);
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){ensure();measure();render();}else{cancelAnimationFrame(raf);raf=0;last=0;}},{rootMargin:'400px'});observer.observe(section);
 cards.forEach(card=>{for(const name of ['pointerenter','pointerleave','focus','blur'])card.addEventListener(name,render);});
 addEventListener('portfolio:suspend',()=>{suspended=true;cancelAnimationFrame(raf);raf=0;last=0;});
 addEventListener('portfolio:resume',()=>{suspended=false;measure();render();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else if(!suspended)render();});
 measure();
 return {measure,render,yForPhase,selectIndex,restoreSelection:updateSelection,restorePhase(value){phase=target=clamp(value,0,travel);paint();},get enabled(){return enabled;},get timeline(){return {start,end:start+span,span};},get phase(){return phase;},get selected(){return selected;}};
};

