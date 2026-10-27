(()=>{
 const route=url=>/^\/(zh|en)\/(?:$|work(?:\/[^/]+)?\/$|journal(?:\/photography)?\/$|about\/$|notes\/[^/]+\/$)/.test(url.pathname);
 function kindFor(link,doc){if(link.closest('.orbit-card'))return 'cover';if(link.closest('.portfolio-next,.next-project'))return 'next';if(link.matches('[data-photography-entry],.folder-fallback'))return 'photo';if(link.matches('.photo-journal-back,.photo-wordmark'))return 'photo-back';if(link.matches('[data-project-back]'))return 'project-back';return 'fade';}
 function install(doc,win,request){
  doc.addEventListener('click',event=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const link=event.target.closest?.('a[href]');if(!link||link.hasAttribute('download')||link.target==='_blank')return;const url=new URL(link.href,win.location.href);if(url.origin!==location.origin||!route(url))return;event.preventDefault();request(url.href,kindFor(link,doc),link,win);});
 }
 let parentShell;try{if(parent!==window&&parent.PortfolioTransitions?.isShell)parentShell=parent.PortfolioTransitions;}catch{}
 if(parentShell){install(document,window,(...args)=>parentShell.navigate(...args));parentShell.warmDocument(document,window);parentShell.documentReady?.(document,window);const base=document.createElement('base');base.target='_top';document.head.append(base);return;}
 const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches,views=new Map(),entries=new Map(),warm=new Map(),opening=new Map(),readyFrames=new WeakMap();let serial=0,busy=false,activeEntry,activeView,queuedPop=null,token=null,particles=false;
 const nativeNodes=[...document.body.children];
 const native={id:'native',url:location.href,doc:document,win:window,frame:null,anims:[],used:0,title:document.title,lang:document.documentElement.lang,description:document.querySelector('meta[name="description"]')?.content};views.set(new URL(native.url).pathname,native);activeView=native;
 const initialId='entry-'+serial++;activeEntry={id:initialId,url:location.href,view:native,snapshot:null};entries.set(initialId,activeEntry);
 history.replaceState({...history.state,portfolioMotion:initialId},'',location.href);history.scrollRestoration='manual';
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),raf=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 const timeout=(promise,ms=15000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Timed out while preparing this page.')),ms);promise.then(v=>{clearTimeout(timer);resolve(v);},e=>{clearTimeout(timer);reject(e);});});
 const media=window.PortfolioProjectImage;
 const decode=image=>timeout(media.decode(image));
 function capture(view){view.win.PortfolioJournal?.finish();const snapshot=view.win.PortfolioPage?.capture()||{y:view.win.scrollY,width:view.win.innerWidth};view.snapshot=snapshot;return snapshot;}
 function cancelAnimations(view){view.anims.forEach(a=>a.cancel());view.anims=[];}
 function animate(view,selector,keyframes,options){for(const element of view.doc.querySelectorAll(selector)){const animation=element.animate(keyframes,{fill:'both',...options});view.anims.push(animation);}}
 function setNativeHidden(hidden){document.documentElement.classList.toggle('motion-native-hidden',hidden);for(const node of nativeNodes)if(!['SCRIPT','STYLE'].includes(node.tagName))node.inert=hidden;}
 function reveal(view){view.frame?.removeAttribute('data-motion-preparing');cancelAnimations(view);if(view.frame){view.frame.style.display='block';view.frame.style.visibility='visible';view.frame.style.opacity='1';view.frame.inert=false;}else setNativeHidden(false);view.win.dispatchEvent(new Event('portfolio:resume'));}
 function conceal(view){view.win.dispatchEvent(new Event('portfolio:suspend'));if(view.frame){view.frame.inert=true;view.frame.style.display='none';}else setNativeHidden(true);}
 async function restore(view,snapshot,hash){
  if(view.frame){view.frame.style.display='block';view.frame.style.visibility='hidden';}else setNativeHidden(false);
  view.win.dispatchEvent(new Event('resize'));await raf();await raf();
  if(snapshot){if(view.win.PortfolioPage)view.win.PortfolioPage.restore(snapshot);else view.win.scrollTo({top:snapshot.y||0,behavior:'instant'});}
  else if(hash){const el=view.doc.getElementById(decodeURIComponent(hash.slice(1)));if(el)view.win.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+view.win.scrollY-100),behavior:'instant'});}
  else view.win.scrollTo({top:0,behavior:'instant'});
  await raf();
 }
 async function getView(url){
  const key=new URL(url).pathname;if(views.has(key))return views.get(key);if(opening.has(key))return opening.get(key);
  const promise=(async()=>{
   const frame=document.createElement('iframe');frame.className='motion-view';frame.title='Portfolio page';frame.name='portfolio-view-'+serial++;frame.setAttribute('aria-label','Portfolio page');frame.setAttribute('data-motion-preparing','true');frame.inert=true;frame.style.visibility='hidden';
   const view={id:frame.name,url,doc:null,win:null,frame,anims:[],snapshot:null,used:Date.now()};
   const loaded=new Promise((resolve,reject)=>{
    const ready=()=>{const doc=frame.contentDocument,win=frame.contentWindow;if(!doc?.querySelector('main')||!win?.PortfolioPage)return false;view.doc=doc;view.win=win;resolve();return true;};
    readyFrames.set(frame,ready);frame.addEventListener('load',()=>{if(!ready())reject(new Error('This page is unavailable.'));},{once:true});frame.addEventListener('error',reject,{once:true});
   });frame.src=url;document.body.append(frame);
   try{await timeout(loaded,45000);view.title=view.doc.title;view.lang=view.doc.documentElement.lang;view.description=view.doc.querySelector('meta[name="description"]')?.content;}
   catch(error){frame.remove();throw error;}finally{readyFrames.delete(frame);}
   views.set(key,view);return view;
  })();opening.set(key,promise);try{return await promise;}finally{opening.delete(key);}
 }
 async function prepare(url,kind,popEntry){
  const u=new URL(url),view=await getView(url);view.used=Date.now();cancelAnimations(view);
  const explicitReturn=kind==='photo-back'||kind==='project-back',matchesSection=s=>s?.section===(kind==='photo-back'?'journal':'projects');let snapshot=popEntry?.snapshot||(explicitReturn&&matchesSection(view.snapshot)?view.snapshot:null);
  if(!snapshot&&explicitReturn){try{const saved=JSON.parse(sessionStorage.getItem('yuanlan-home-'+u.pathname.split('/')[1]));if(matchesSection(saved))snapshot=saved;}catch{}}
  await restore(view,snapshot,snapshot?null:u.hash);
  const hero=view.doc.querySelector('.portfolio-page img,.case-cover img');let heroReady=null;
  if(['cover','next'].includes(kind)&&!hero)throw new Error('This project has no prepared cover.');
  if(hero)heroReady=await timeout(media.prepare(hero),30000);
  const gallery=view.doc.querySelector('[data-photo-diary]');if(gallery){view.win.dispatchEvent(new Event('portfolio:resume'));await new Promise((resolve,reject)=>{const check=()=>{if(gallery.dataset.mediaReady==='true'){cleanup();resolve();}else if(gallery.dataset.mediaError==='true'){cleanup();reject(new Error('A photograph could not be loaded.'));}};const cleanup=()=>{clearInterval(poll);clearTimeout(timer);gallery.removeEventListener('portfolio:media',check);};const poll=setInterval(check,40),timer=setTimeout(()=>{cleanup();reject(new Error('Photography preparation timed out.'));},30000);gallery.addEventListener('portfolio:media',check);check();});}
  return {view,hero,heroReady};
 }
 function sourceFor(link,win){if(!link)return null;const card=link.closest('.orbit-card');if(!card)return null;const captured=win.PortfolioCoverSource?.(card);if(captured)return captured;const image=card.querySelector('img'),rect=card.getBoundingClientRect();return image?{image,rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height}}:null;}
 function frameTitle(view){document.title=view.title;document.documentElement.lang=view.lang;if(view.description)document.querySelector('meta[name="description"]')?.setAttribute('content',view.description);if(view.frame)view.frame.title=view.title;}
 function announce(message,retry,loading=false){
  document.querySelector('.motion-status')?.remove();
  const status=document.createElement('div');status.className='motion-status';status.setAttribute('role',loading?'status':'alert');if(loading)status.dataset.loading='true';
  const text=document.createElement('span');text.textContent=message;status.append(text);
  if(retry){const button=document.createElement('button');button.type='button';button.textContent=document.documentElement.lang.startsWith('zh')?'重试':'Retry';button.addEventListener('click',retry);status.append(button);}
  document.body.append(status);
 }
 function trim(){const candidates=[...views.entries()].filter(([,v])=>v.frame&&v!==activeView).sort((a,b)=>a[1].used-b[1].used);while(views.size>4&&candidates.length){const [key,view]=candidates.shift();conceal(view);view.frame.remove();views.delete(key);warm.delete(key);for(const entry of entries.values())if(entry.view===view)entry.view=null;}}
 async function runAnimation(old,view,hero,kind,source,control,heroReady){
  const duration=reduced()?160:820;reveal(view);if(view.frame){view.frame.style.zIndex='1002';view.frame.style.opacity='0';}if(old.frame)old.frame.style.zIndex='1001';
  if(old.frame)old.frame.inert=true;if(view.frame)view.frame.inert=true;for(const node of nativeNodes)if(!['SCRIPT','STYLE'].includes(node.tagName))node.inert=true;
  let overlay=null,heroStyle=hero?.style.opacity||'',stageAnimation;
  try{
  if(hero&&['cover','next'].includes(kind)&&!reduced()){
   const r=hero.getBoundingClientRect();heroStyle=hero.style.opacity;hero.style.opacity='0';
   overlay=window.PortfolioCoverTransition?.({source,targetImage:hero,targetSurface:heroReady?.surface,targetRect:{left:r.left,top:r.top,width:r.width,height:r.height},next:kind==='next'});if(overlay)overlay.draw(0);else hero.style.opacity=heroStyle;
   animate(view,'.portfolio-heading h1',[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:360,delay:390});
   animate(view,'.portfolio-intro,.portfolio-view-hint',[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:350,delay:475});
   animate(view,'.site-header,.portfolio-topline',[{opacity:0},{opacity:1}],{duration:260,delay:420});
  }else if(kind==='photo'&&!reduced()){
   animate(view,'.photo-film-canvas',[{opacity:0,transform:'scale(.85)'},{opacity:1,transform:'scale(1)'}],{duration:680,delay:100,easing:'cubic-bezier(.2,.8,.2,1)'});
   animate(view,'.photo-toolbar,.photo-gallery-title,.photo-gallery-footer',[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:300,delay:500});
  }else{
   animate(view,'main,.site-header,.site-footer',[{opacity:0},{opacity:1}],{duration:reduced()?140:380,delay:reduced()?0:180});
  }
  // Start departing fades only after the cover surface has actually drawn.
  // Slow decoding/texture upload must never race a compositor-driven fade-out.
  if(old.frame&&!view.frame){const a=old.frame.animate([{opacity:1},{opacity:0}],{duration:reduced()?140:430,delay:reduced()?0:120,fill:'both'});old.anims.push(a);}
  const departing=kind==='photo-back'?'.photo-toolbar,.photo-gallery-title,.photo-gallery-footer':'.site-header,main,.site-footer';
  animate(old,departing,[{opacity:1},{opacity:0}],{duration:reduced()?100:280});
  if(kind==='photo')animate(old,'[data-photography-word]',[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.055)'}],{duration:210});
  if(kind==='next')animate(old,'.portfolio-next>span,.portfolio-next>a',[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-14px)'}],{duration:240});
  if(kind==='photo-back')animate(old,'.photo-film-canvas',[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.94)'}],{duration:reduced()?100:350});
  if(view.frame)stageAnimation=view.frame.animate([{opacity:0},{opacity:1}],{duration:reduced()?120:340,delay:reduced()?0:120,fill:'both'});
   await new Promise((resolve,reject)=>{let start=0;function tick(time){if(control.cancelled){reject(new Error('Navigation interrupted'));return;}if(!start)start=time;const t=Math.min(1,(time-start)/duration);try{overlay?.draw(t);}catch(error){reject(error);return;}document.documentElement.dataset.transitionProgress=t.toFixed(3);if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
   // The completed mesh remains above the destination while the real <img>
   // becomes visible and receives its paint opportunity. Never remove it on a timer.
   if(heroReady){
    hero.style.opacity=heroStyle;stageAnimation?.finish();if(view.frame)view.frame.style.opacity='1';
    await timeout(media.painted(heroReady,view,()=>control.cancelled));
    if(overlay){const handoff=overlay.canvas.animate([{opacity:1},{opacity:0}],{duration:120,easing:'ease-out',fill:'both'});await handoff.finished;}
   }
  }catch(error){
   // If a resource or context fails after the motion started, show the captured
   // cover again until the original page has resumed. No empty destination frame.
   try{overlay?.draw(0);}catch{}conceal(view);reveal(old);await raf();await raf();throw error;
  }finally{if(hero)hero.style.opacity=heroStyle;overlay?.remove();stageAnimation?.cancel();if(view.frame)view.frame.style.opacity='1';}
 }
 async function navigate(url,kind='fade',link=null,sourceWindow=activeView.win,popEntry=null){
  if(busy)return false;const returnEntry=!popEntry?entries.get(kind==='photo-back'?activeEntry.journalOrigin:kind==='project-back'?activeEntry.projectOrigin:null):null;if(returnEntry)url=returnEntry.url;const parsed=new URL(url,location.href);if(!route(parsed))return false;
  if(['photo-back','project-back'].includes(kind))parsed.search='';url=parsed.href;
  if(parsed.pathname===new URL(activeView.url).pathname&&(kind==='fade'||popEntry)){
   if(activeEntry!==popEntry){activeEntry.url=location.href;activeEntry.snapshot=capture(activeView);}
   if(popEntry){await restore(activeView,popEntry.snapshot,parsed.hash);activeEntry=popEntry;activeEntry.view=activeView;}
   else{const el=activeView.doc.getElementById(parsed.hash.slice(1));if(el)activeView.win.scrollTo({top:Math.max(0,el.getBoundingClientRect().top+activeView.win.scrollY-100),behavior:reduced()?'instant':'smooth'});if(url!==location.href){const id='entry-'+serial++;activeEntry={id,url,view:activeView,snapshot:null};entries.set(id,activeEntry);history.pushState({portfolioMotion:id},'',url);}}
   return true;
  }
  document.querySelector('.motion-status')?.remove();
  busy=true;const control=token={cancelled:false};document.documentElement.dataset.transitionBusy='true';document.documentElement.dataset.transitionKind=kind;
  const old=activeView;sourceFor(link,sourceWindow);link?.classList?.add('motion-pending');announce(document.documentElement.lang.startsWith('zh')?'正在准备首屏图片，当前页面仍可查看…':'Preparing the first image. Your current page stays visible…',null,true);old.win.dispatchEvent(new Event('portfolio:suspend'));performance.mark?.('portfolio:navigation-start');if(!popEntry)activeEntry.url=location.href;activeEntry.snapshot=capture(old);let source,target;
  try{
   const prepared=await prepare(url,kind,popEntry||returnEntry);target=prepared.view;if(control.cancelled)throw new Error('Navigation interrupted');
   if(target===old){reveal(old);return true;}
   activeEntry.snapshot=capture(old);source=sourceFor(link,sourceWindow);document.querySelector('.motion-status')?.remove();link?.classList?.remove('motion-pending');performance.mark?.('portfolio:first-screen-ready');document.documentElement.classList.add('motion-animating');
   if(particles&&kind==='cover'&&link&&!reduced()){const rect=link.getBoundingClientRect();for(let i=0;i<9;i++){const dot=document.createElement('i');dot.className='motion-particle';dot.style.left=rect.left+rect.width*.5+'px';dot.style.top=rect.top+rect.height*.5+'px';document.body.append(dot);const a=dot.animate([{opacity:.8,transform:'translate(0,0)'},{opacity:0,transform:`translate(${Math.cos(i*2.4)*55}px,${Math.sin(i*2.4)*55}px)`}],{duration:420,easing:'ease-out'});a.finished.finally(()=>dot.remove());}}
   await runAnimation(old,target,prepared.hero,kind,source,control,prepared.heroReady);if(control.cancelled)throw new Error('Navigation interrupted');
   conceal(old);activeView=target;reveal(target);if(target.frame)setNativeHidden(true);else setNativeHidden(false);target.frame?.style.setProperty('z-index','1000');
   if(popEntry){activeEntry=popEntry;activeEntry.view=target;}else{const id='entry-'+serial++,previous=activeEntry;activeEntry={id,url,view:target,snapshot:null,projectOrigin:kind==='cover'?previous.id:kind==='next'?previous.projectOrigin:null,journalOrigin:kind==='photo'?previous.id:null};entries.set(id,activeEntry);history.pushState({portfolioMotion:id},'',url);}
   if(!target.frame&&activeEntry.snapshot)target.win.PortfolioPage?.restore(activeEntry.snapshot);
   frameTitle(target);const focus=target.doc.querySelector('[data-photo-diary],.portfolio-heading h1')||target.doc.querySelector(parsed.hash||'main');if(focus){if(!focus.hasAttribute('tabindex'))focus.setAttribute('tabindex','-1');focus.focus({preventScroll:true});}
   document.documentElement.dataset.transitionLast=kind;trim();return true;
  }catch(error){
   if(target&&target!==old){conceal(target);if(target.frame&&!control.cancelled){target.frame.remove();views.delete(parsed.pathname);for(const entry of entries.values())if(entry.view===target)entry.view=null;}}
   if(!target){const failed=views.get(parsed.pathname);if(failed?.frame&&failed!==old){failed.win?.dispatchEvent(new Event('portfolio:suspend'));failed.frame.remove();views.delete(parsed.pathname);}}
   reveal(old);if(old.frame)setNativeHidden(true);else setNativeHidden(false);old.win.PortfolioPage?.restore(activeEntry.snapshot);
   if(!control.cancelled){warm.delete(parsed.pathname);announce(document.documentElement.lang.startsWith('zh')?'首图暂时无法加载，已保留当前封面。请重试。':'The first image could not be prepared. Your current page is still available.',()=>navigate(url,kind,link,sourceWindow,popEntry));}return false;
  }finally{link?.classList?.remove('motion-pending');performance.mark?.('portfolio:navigation-end');busy=false;token=null;document.documentElement.classList.remove('motion-animating');delete document.documentElement.dataset.transitionBusy;delete document.documentElement.dataset.transitionProgress;if(queuedPop){const entry=queuedPop;queuedPop=null;requestAnimationFrame(()=>navigate(entry.url,activeView.doc.querySelector('[data-photo-diary]')?'photo-back':'fade',null,activeView.win,entry));}}
 }
 window.PortfolioTransitions={isShell:true,navigate,documentReady(doc,win){readyFrames.get(win.frameElement)?.();},setParticles(value){particles=Boolean(value);},get particles(){return particles;},get busy(){return busy;}};
 install(document,window,navigate);
 document.addEventListener('wheel',event=>{if(document.documentElement.classList.contains('motion-animating'))event.preventDefault();},{passive:false,capture:true});
 addEventListener('popstate',event=>{const entry=entries.get(event.state?.portfolioMotion);if(!entry){location.reload();return;}if(busy){queuedPop=entry;if(token)token.cancelled=true;return;}navigate(entry.url,entry.url.includes('/journal/photography/')?'photo':activeView.doc.querySelector('[data-photo-diary]')?'photo-back':entry.url.includes('#projects')?'project-back':'fade',null,activeView.win,entry);});
 async function warmLink(link,win){
  const url=new URL(link.href,win.location.href);if(url.origin!==location.origin||!route(url)||url.pathname===win.location.pathname||views.get(url.pathname)===activeView)return;
  // One hovered/focused project prepares one inert document and its first image.
  // Its offscreen boards, video, footer and effects remain dormant until revealed.
  const photography=link.matches('[data-photography-entry],.folder-fallback');
  if(!photography&&!link.closest('.orbit-card,.portfolio-next,.next-project'))return;
  if(warm.has(url.pathname))return warm.get(url.pathname);
  let centralPhoto=null;
  if(photography&&link.dataset.photoPreviews){try{const photos=JSON.parse(link.dataset.photoPreviews);let position=0;try{position=Number(sessionStorage.getItem('yuanlan-photo-position'))||0;}catch{}centralPhoto=new Image();centralPhoto.decoding='async';centralPhoto.fetchPriority='high';centralPhoto.src=photos[((Math.round(position)%photos.length)+photos.length)%photos.length];}catch{}}
  const promise=getView(url.href).then(async view=>{
   const image=view.doc.querySelector('.portfolio-page img,.case-cover img');if(image)await timeout(media.decode(image),30000);
   if(photography){
    // Prepare the script and central photograph without running a hidden GPU scene.
    if(!view.doc.querySelector('[data-inline-feature="photography"]')){const script=view.doc.createElement('link');script.rel='preload';script.as='script';script.href=view.win.PortfolioAssetMap.photography;view.doc.head.append(script);}
    const photos=JSON.parse(view.doc.querySelector('#photo-diary-data').textContent);let position=0;try{position=Number(sessionStorage.getItem('yuanlan-photo-position'))||0;}catch{}
    const index=((Math.round(position)%photos.length)+photos.length)%photos.length,photo=centralPhoto||new Image();photo.decoding='async';photo.fetchPriority='high';photo.src=photos[index].preview;await timeout(media.decode(photo),30000);
   }
   trim();
  }).catch(()=>{warm.delete(url.pathname);});
  warm.set(url.pathname,promise);return promise;
 }
 const warmDocument=(doc,win)=>{
  const entry=target=>target.closest?.('a[href]')||(target.closest?.('[data-folder-host]')?doc.querySelector('[data-photography-entry]'):null);
  doc.addEventListener('pointerover',event=>{const link=entry(event.target);if(link)warmLink(link,win);},{passive:true});
  doc.addEventListener('focusin',event=>{const link=entry(event.target);if(link)warmLink(link,win);});
  const photography=doc.querySelector('[data-photography-entry]');
  if(photography&&typeof win.IntersectionObserver==='function'){
   const observer=new win.IntersectionObserver(items=>{if(items.some(item=>item.isIntersecting)&&win.PortfolioRuntime?.isActive()!==false){warmLink(photography,win);observer.disconnect();}},{rootMargin:'120px'});observer.observe(photography);
  }
 };
 warmDocument(document,window);window.PortfolioTransitions.warmDocument=warmDocument;
})();
