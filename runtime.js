/* A small page shell: offscreen media and features do not compete with the hero. */
(()=>{
 let active=window.frameElement?.dataset.motionPreparing!=='true';
 const features=new Map(),records=[],media=new Set();
 const isActive=()=>active&&!document.hidden;
 function activateImage(image){
  if(!image?.dataset.src)return;
  if(image.dataset.srcset){image.srcset=image.dataset.srcset;delete image.dataset.srcset;}
  image.loading='eager';image.src=image.dataset.src;delete image.dataset.src;
 }
 function activateMedia(element){
  if(element.tagName==='IMG')activateImage(element);
  else if(element.dataset.poster){element.poster=element.dataset.poster;delete element.dataset.poster;}
  media.delete(element);mediaObserver?.unobserve(element);
 }
 const mediaObserver=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  if(!isActive())return;for(const entry of entries)if(entry.isIntersecting)activateMedia(entry.target);
 },{rootMargin:'250px 0px'}):null;
 for(const element of document.querySelectorAll('img[data-src],video[data-poster]')){if(element.closest('.photo-fallback'))continue;media.add(element);mediaObserver?.observe(element);}
 function loadFeature(name){
  if(features.has(name))return features.get(name);
  const embedded=document.querySelector(`script[data-inline-feature="${name}"]`);
  if(embedded){const script=document.createElement('script');script.textContent=embedded.textContent;document.head.append(script);embedded.remove();const ready=Promise.resolve();features.set(name,ready);return ready;}
  const url=window.PortfolioAssetMap?.[name];if(!url)return Promise.reject(new Error(`Missing feature ${name}`));
  const promise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.async=true;script.fetchPriority=name==='photography'?'high':'low';script.onload=()=>resolve();script.onerror=()=>{features.delete(name);script.remove();reject(new Error(`Unable to load ${name}`));};document.head.append(script);});
  features.set(name,promise);return promise;
 }
 function near(element,margin){const box=element.getBoundingClientRect();return box.bottom>-margin&&box.top<innerHeight+margin;}
 function check(){
  if(!isActive())return;
  for(const element of media){const box=element.getBoundingClientRect();if(element.getClientRects().length&&box.right>=-250&&box.left<=innerWidth+250&&near(element,250))activateMedia(element);}
  for(const record of records)if(!record.started&&near(record.element,record.margin)){
   record.started=true;loadFeature(record.name).catch(error=>{record.started=false;console.warn('The accessible page remains available.',error);document.documentElement.classList.remove('journal-intro-pending');});
  }
 }
 function observe(name,element,margin=550){
  if(!element)return;const record={name,element,margin,started:false};records.push(record);
  const observer=new IntersectionObserver(()=>check(),{rootMargin:`${margin}px 0px`});observer.observe(element);
 }
 window.PortfolioRuntime={loadFeature,activateImage,isActive,check};
 observe('experience',document.querySelector('#experience'));
 observe('journal',document.querySelector('[data-journal-motion]'),700);
 observe('journal',document.querySelector('[data-contact-shuffle]'),0);
 if(document.querySelector('[data-photo-diary]'))records.push({name:'photography',element:document.querySelector('[data-photo-diary]'),margin:0,started:false});
 function videoSource(video){
  if(video.dataset.sourceReady)return false;const sources=[...video.querySelectorAll('source[data-src]')];
  if(!sources.length)return false;sources.forEach(source=>{source.src=source.dataset.src;delete source.dataset.src;});video.dataset.sourceReady='true';video.preload='metadata';video.load();return true;
 }
 for(const video of document.querySelectorAll('video')){
  const play=()=>{if(videoSource(video))video.play().catch(()=>{});};
  video.addEventListener('pointerdown',play,{once:true});video.addEventListener('keydown',event=>{if([' ','Enter'].includes(event.key))play();});
 }
 addEventListener('portfolio:suspend',()=>{active=false;document.documentElement.dataset.runtimeSuspended='true';document.querySelectorAll('video').forEach(video=>video.pause());});
 addEventListener('portfolio:resume',()=>{active=true;delete document.documentElement.dataset.runtimeSuspended;check();});
 document.addEventListener('visibilitychange',check);
 check();
})();
