const language=document.body.dataset.lang||'zh';
const isHome=document.querySelector('.site-header')?.dataset.home==='true';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const compactProjects=matchMedia('(max-width: 900px)');
const menu=document.querySelector('.menu-button'),mobileNav=document.querySelector('#mobile-nav');
function closeMenu(){if(!menu||!mobileNav)return;menu.setAttribute('aria-expanded','false');mobileNav.hidden=true;}
if(menu&&mobileNav){
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobileNav.hidden=open;});
 mobileNav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
 document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeMenu();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobileNav.hidden){closeMenu();menu.focus();}});
 matchMedia('(min-width: 981px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
}
const headerHeight=()=>document.querySelector('.site-header')?.offsetHeight||82;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const stateKey=`yuanlan-home-${language}`;
function readSaved(){try{const data=JSON.parse(sessionStorage.getItem(stateKey));return data&&Date.now()-data.time<21600000?data:null;}catch{return null;}}
function save(data){try{sessionStorage.setItem(stateKey,JSON.stringify({...data,time:Date.now()}));}catch{/* Navigation remains available without storage. */}}
function jumpTo(y){const root=document.documentElement,previous=root.style.scrollBehavior;root.style.scrollBehavior='auto';window.scrollTo({top:Math.max(0,y),behavior:'instant'});requestAnimationFrame(()=>{root.style.scrollBehavior=previous;});}
const section=document.querySelector('#projects'),scene=section?.querySelector('.orbit-scene');
const cards=section?[...section.querySelectorAll('.orbit-card')]:[];
let ring=null;
if(section&&scene&&cards.length)ring=window.PortfolioGallery(section,headerHeight);
const atmosphere=isHome?window.PortfolioAtmosphere?.({ring,headerHeight}):null;
let activeSection='home',frame=0;
function updateNavigation(){
 if(!isHome)return;
 const targets=[...document.querySelectorAll('[data-section]'),document.querySelector('#contact')].filter(Boolean),marker=headerHeight()+Math.min(160,innerHeight*.22);
 let current='home';for(const target of targets){if(target.getBoundingClientRect().top<=marker)current=target.dataset.section||target.id;}
 activeSection=current;document.querySelectorAll('[data-nav]').forEach(link=>{if(link.dataset.nav===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});updateLanguages();
}
function updateLanguages(){
 document.querySelectorAll('[data-language]').forEach(link=>{
   if(isHome){const anchor=activeSection==='home'?'top':activeSection;link.href=`/${link.dataset.language}/${activeSection==='projects'&&ring?`?project=${ring.phase.toFixed(5)}`:''}#${anchor}`;}
   else{const url=new URL(link.href);url.hash=location.hash;link.href=url.href;}
 });
}
function schedule(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;atmosphere?.update();ring?.render();updateNavigation();});}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',()=>{ring?.measure();atmosphere?.measure();schedule();},{passive:true});addEventListener('hashchange',schedule);
document.querySelectorAll('[data-language]').forEach(link=>link.addEventListener('click',event=>{if(link.dataset.language===language)event.preventDefault();}));
if(!isHome){const target=document.querySelector('.case,.project-frame,.portfolio-story')?'projects':document.querySelector('.photo-diary,.journal-chapter,.note-page')?'journal':document.querySelector('.about-intro,#about')?'about':'projects';document.querySelectorAll(`[data-nav="${target}"]`).forEach(link=>link.setAttribute('aria-current','location'));updateLanguages();}

// Explicit return links and browser back/forward retain the selected project.
const saved=readSaved();
document.querySelectorAll('[data-project-back]').forEach(link=>{const slug=document.querySelector('[data-project-slug]')?.dataset.projectSlug;if(saved&&saved.slug===slug)link.href=`/${language}/?restore=projects#projects`;});
document.querySelectorAll('[data-home-back]').forEach(link=>{if(saved)link.href=`/${language}/?restore=page#journal`;});
let restored=false;
function restorePage(force=false){
 if(!isHome||restored&&!force)return;
 const query=new URLSearchParams(location.search),state=readSaved(),navigation=performance.getEntriesByType('navigation')[0]?.type;let target=null;ring?.measure();
 if(query.has('project')&&ring){const value=Number(query.get('project'));if(Number.isFinite(value)&&ring.enabled){ring.restorePhase(value);target=ring.yForPhase(value);}}
 else if(query.get('restore')==='projects'&&state&&ring){ring.restoreSelection(state.selected);if(ring.enabled)ring.restorePhase(state.phase);target=state.width===innerWidth?state.y:ring.enabled?ring.yForPhase(state.phase):cards[state.selected].getBoundingClientRect().top+scrollY-headerHeight()-20;}
 else if((query.get('restore')==='page'||navigation==='back_forward'||force)&&state)target=state.y;
 else if(location.hash){const id=decodeURIComponent(location.hash.slice(1)),anchor=document.getElementById(id);if(anchor)target=id==='top'?0:anchor.getBoundingClientRect().top+scrollY-headerHeight()-20;}
 if(target!==null){if(state&&ring&&!ring.enabled)ring.restoreSelection(state.selected);jumpTo(target);restored=true;}
 if(query.has('restore')||query.has('project'))history.replaceState(history.state,'',location.pathname+location.hash);schedule();
}
if(isHome){
 history.scrollRestoration='manual';
 // Run after the browser's native fragment placement, including cached media/GPU setup.
 const initialRestore=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>restorePage()));
 if(document.readyState==='complete')initialRestore();else addEventListener('load',initialRestore,{once:true});
 addEventListener('pageshow',event=>{if(event.persisted)restorePage(true);schedule();});
 addEventListener('pagehide',()=>save({y:scrollY,phase:ring?.phase||0,selected:ring?.selected||0,slug:cards[ring?.selected||0]?.dataset.projectSlug,section:activeSection,width:innerWidth}));
}else history.scrollRestoration='auto';

// The native modal is ready for real media. Missing files remain honest placeholders.
const dialog=document.querySelector('#media-dialog');let previewTrigger;
if(dialog){
 const content=dialog.querySelector('.media-dialog-content'),heading=dialog.querySelector('#media-dialog-title');
 document.querySelectorAll('[data-preview-kind]').forEach(button=>button.addEventListener('click',()=>{
   previewTrigger=button;heading.textContent=button.dataset.caption;content.replaceChildren();
   if(button.dataset.src){
     const media=document.createElement(button.dataset.previewKind==='video'?'video':'img');media.src=button.dataset.src;
     if(media.tagName==='VIDEO'){media.controls=true;media.playsInline=true;media.muted=true;media.preload='metadata';}else media.alt=button.dataset.caption;
     content.append(media);dialog.showModal();if(media.tagName==='VIDEO')media.play().catch(()=>{});
   }else{
     const box=document.createElement('div');box.className='dialog-placeholder';const icon=document.createElement('span');icon.textContent=button.dataset.previewKind==='video'?'▷':'+';
     const title=document.createElement('h3');title.textContent=button.dataset.caption;const paragraph=document.createElement('p');paragraph.textContent=language==='zh'?'素材待补充。这里保留放大查看与视频播放的位置，加入真实素材后即可使用。':'Media to be added. This space is ready for an enlarged photograph or a playable video once the original is supplied.';
     box.append(icon,title,paragraph);content.append(box);dialog.showModal();
   }
 }));
 dialog.querySelector('[data-close-media]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{dialog.querySelectorAll('video').forEach(v=>v.pause());content.replaceChildren();previewTrigger?.focus({preventScroll:true});});
}
document.addEventListener('play',event=>{if(event.target.tagName==='VIDEO')document.querySelectorAll('video').forEach(video=>{if(video!==event.target)video.pause();});},true);
window.PortfolioPage={
 capture(){const snapshot={y:scrollY,phase:ring?.phase||0,selected:ring?.selected||0,slug:cards[ring?.selected||0]?.dataset.projectSlug,section:activeSection,width:innerWidth};if(isHome)save(snapshot);return snapshot;},
 restore(snapshot){ring?.measure();if(ring){ring.restoreSelection(snapshot.selected||0);if(ring.enabled)ring.restorePhase(snapshot.phase||0);}jumpTo(snapshot.width===innerWidth?snapshot.y:ring?.enabled&&snapshot.section==='projects'?ring.yForPhase(snapshot.phase||0):snapshot.y);schedule();}
};
addEventListener('portfolio:suspend',()=>{document.querySelectorAll('video').forEach(video=>video.pause());});
addEventListener('portfolio:resume',()=>{ring?.measure();atmosphere?.measure();schedule();});
schedule();
