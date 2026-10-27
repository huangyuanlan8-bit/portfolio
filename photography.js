(()=>{
 const root=document.querySelector('[data-photo-diary]');if(!root)return;
 const photos=JSON.parse(document.querySelector('#photo-diary-data').textContent),math=window.PhotoFilmMath,count=photos.length,language=root.dataset.photoLanguage||'zh';
 const label=value=>Array.isArray(value)?value[language==='zh'?0:1]:value;
 const filmPrintFont=getComputedStyle(root).getPropertyValue('--font-meta').trim()||'Consolas, monospace';
 const canvas=root.querySelector('canvas'),fallback=root.querySelector('.photo-fallback'),links=[...fallback.querySelectorAll('a')];
 const dialog=root.querySelector('dialog'),large=dialog.querySelector('[data-photo-large]'),close=dialog.querySelector('[data-photo-close]');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),compact=matchMedia('(max-width:760px)');
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let saved=0;try{saved=Number(sessionStorage.getItem('yuanlan-photo-position'))||0;}catch{}
 const state={position:saved,velocity:0,energy:0,time:0,idle:reduced.matches?0:1,drag:null,satDirty:true,flex:0,flexV:0,flow:0,hovers:new Map(),pointer:null};
 let layout,gl,renderer,raf=0,last=0,active=-1,frames=[],frameNumber=0,ready=false,suspended=window.PortfolioRuntime?.isActive()===false,frameCost=0,frameInterval=16.7,lastHoverX=null,lastHoverY=null,lastHoverPosition=null,lastHoverFrames=null;
 const textures=new Map(),cols=48,rows=24;
 function updateCaption(index){index=math.wrap(index,count);if(active===index)return;active=index;root.querySelector('[data-photo-count]').textContent=`${String(index+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;root.querySelector('[data-photo-caption]').textContent=label(photos[index].title);root.dataset.currentPhoto=index+1;}
 function openPhoto(index){const photo=photos[math.wrap(index,count)];state.velocity=0;state.drag=null;state.pointer=null;root.classList.remove('is-dragging');large.src=photo.full;large.alt=label(photo.title);dialog.querySelector('#photo-lightbox-title').textContent=label(photo.title);dialog.querySelector('[data-photo-details]').textContent=[label(photo.location),photo.year].filter(Boolean).join(' / ');dialog.showModal();close.focus();}
 close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{last=0;root.focus({preventScroll:true});});
 links.forEach((link,i)=>link.addEventListener('click',event=>{event.preventDefault();openPhoto(i);}));
 function step(direction){if(ready){state.position=Math.round(state.position)+direction;state.velocity=0;state.satDirty=true;}else links[math.wrap(active+direction,count)].scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest',inline:'center'});}
 root.querySelector('[data-photo-prev]').addEventListener('click',()=>step(-1));root.querySelector('[data-photo-next]').addEventListener('click',()=>step(1));root.querySelector('[data-photo-view]').addEventListener('click',()=>openPhoto(active<0?0:active));
 root.addEventListener('keydown',event=>{if(dialog.open||event.altKey||event.ctrlKey||event.metaKey)return;if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();step(event.key==='ArrowRight'?1:-1);}else if(event.key==='Enter'&&event.target===root){event.preventDefault();openPhoto(active<0?0:active);}});
 function paintTexture(surface,index,photo){
  const ctx=surface.getContext('2d'),scale=surface.width/1024;ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,1024,800);ctx.fillStyle='#262626';ctx.fillRect(0,0,1024,800);
  let rect=[.025,.143,.975,.857];
  if(photo){const x=25,y=114,pw=974,ph=572,k=Math.min(pw/photo.naturalWidth,ph/photo.naturalHeight),dw=photo.naturalWidth*k,dh=photo.naturalHeight*k,px=x+(pw-dw)/2,py=y+(ph-dh)/2;ctx.drawImage(photo,px,py,dw,dh);rect=[px/1024,py/800,(px+dw)/1024,(py+dh)/800];}
  ctx.fillStyle='#bcbcbc';ctx.font='700 27px '+filmPrintFont;ctx.fillText('YUANLAN / PHOTO DIARY',25,30);ctx.textAlign='right';ctx.fillText('YH–35',999,30);ctx.textAlign='left';ctx.font='700 29px '+filmPrintFont;ctx.fillText(String(index+1).padStart(2,'0')+' A',28,792);ctx.font='700 23px '+filmPrintFont;ctx.textAlign='right';ctx.fillText('PHOTO DIARY / 35 MM',998,792);ctx.textAlign='left';ctx.beginPath();ctx.moveTo(164,770);ctx.lineTo(179,778);ctx.lineTo(164,786);ctx.fill();
  ctx.globalCompositeOperation='destination-out';for(const h of math.holes()){ctx.beginPath();ctx.roundRect(h.x,h.y,h.w,h.h,h.r);ctx.fill();}ctx.globalCompositeOperation='source-over';return rect;
 }
 function getTexture(index){
  let record=textures.get(index);if(record){record.last=frameNumber;return record;}
  const surface=document.createElement('canvas');surface.width=compact.matches?768:1024;surface.height=surface.width*800/1024;
  const rect=paintTexture(surface,index,null),texture=renderer.texture(surface);record={texture,rect,last:frameNumber,loaded:false};textures.set(index,record);
  const preloaded=window.PortfolioPhotoPreload?.url===photos[index].preview?window.PortfolioPhotoPreload.image:null;
  const image=preloaded||new Image();
  const loaded=()=>{if(!textures.has(index))return;record.rect=paintTexture(surface,index,image);renderer.updateTexture(texture,surface);record.loaded=true;state.satDirty=true;};
  const failed=()=>{if(index===math.wrap(Math.round(state.position),count)){root.dataset.mediaError='true';root.dispatchEvent(new Event('portfolio:media'));}};
  if(preloaded&&image.complete)queueMicrotask(image.naturalWidth?loaded:failed);else{image.addEventListener('load',loaded,{once:true});image.addEventListener('error',failed,{once:true});}
  if(!preloaded){image.decoding='async';image.fetchPriority=index===math.wrap(Math.round(state.position),count)?'high':'low';image.src=photos[index].preview;}return record;
 }
 function resize(){layout=math.layout(root.clientWidth,root.clientHeight,compact.matches);state.satDirty=true;renderer?.resize(layout);}
 function hitFilm(point,photoOnly=false){
  let nearest=null;
  for(const frame of frames){
   if(!math.contains(point,frame.polygon))continue;
   const grid=frame.grid,get=i=>({x:grid[i*2],y:grid[i*2+1]});
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const a=y*(cols+1)+x,b=a+cols+1;
    for(const ids of [[a,b,a+1],[b,b+1,a+1]]){
     const weights=math.barycentric(point,...ids.map(get));if(!weights)continue;
     const u=ids.reduce((sum,id,i)=>sum+(id%(cols+1))/cols*weights[i],0),v=ids.reduce((sum,id,i)=>sum+Math.floor(id/(cols+1))/rows*weights[i],0),z=ids.reduce((sum,id,i)=>sum+frame.gridZ[id]*weights[i],0);
     if(math.isHole(u,v))continue;
     const rect=frame.rect,isPhoto=u>rect[0]&&u<rect[2]&&v>rect[1]&&v<rect[3];
     if(!nearest||z>nearest.z)nearest={tile:frame.tile,index:frame.index,u,v,z,isPhoto};
    }
   }
  }
  return photoOnly&&!nearest?.isPhoto?null:nearest;
 }
 function updateHover(dt){
  // Physics substeps share the same rendered mesh. Raycast it once per frame,
  // rather than repeating identical triangle intersections for each substep.
  const changed=state.pointer?.x!==lastHoverX||state.pointer?.y!==lastHoverY||frames!==lastHoverFrames;
  const hit=state.pointer&&!state.drag?(changed?hitFilm(state.pointer):state.lastHoverHit):null;
  state.lastHoverHit=hit;lastHoverX=state.pointer?.x;lastHoverY=state.pointer?.y;lastHoverPosition=state.position;lastHoverFrames=frames;
  if(hit&&!state.hovers.has(hit.tile))state.hovers.set(hit.tile,{amount:0,velocity:0,u:hit.u,v:hit.v});
  root.dataset.hoveredPhoto=hit?hit.index+1:'';
  root.dataset.hoverUv=hit?`${hit.u.toFixed(3)},${hit.v.toFixed(3)}`:'';
  for(const [tile,h] of state.hovers){
   const target=hit?.tile===tile?1:0;
   [h.amount,h.velocity]=math.spring(h.amount,h.velocity,target,dt);
   if(target){h.u+=(hit.u-h.u)*(1-Math.exp(-dt/ .12));h.v+=(hit.v-h.v)*(1-Math.exp(-dt/ .12));}
   if(!target&&Math.abs(h.amount)<.0001&&Math.abs(h.velocity)<.001)state.hovers.delete(tile);
  }
 }
 function render(){
  const started=performance.now();frames=[];frameNumber++;const near=Math.round(state.position),reach=Math.ceil(layout.width/layout.slot/2)+1;
  for(let tile=near-reach;tile<=near+reach;tile++){
   const approximate=math.project(math.surface(tile,.5,.5,layout,state),layout),padding=layout.slot*.65*layout.camera/(layout.camera-approximate.z)+35;
   if(approximate.x+padding<0||approximate.x-padding>layout.width)continue;
   const index=math.wrap(tile,count),frame=renderer.makeFrame(tile,state),centre=frame.centre,frameWidth=Math.abs(frame.grid[(rows/2*(cols+1)+cols)*2]-frame.grid[(rows/2*(cols+1))*2]);
   const saturation=math.saturation(centre.x,layout.width,frameWidth),record=getTexture(index);
   Object.assign(frame,{index,saturation,texture:record.texture,rect:record.rect});frames.push(frame);
   links[index].dataset.saturation=saturation.toFixed(4);links[index].dataset.screenX=centre.x.toFixed(2);links[index].dataset.tile=tile;
   if(frameNumber%4===0){links[index].dataset.surface=JSON.stringify(frame.samples);links[index].dataset.normals=JSON.stringify(frame.normals);}
  }
  renderer.render(frames);const current=frames.reduce((a,b)=>Math.abs(a.centre.x-layout.width/2)<Math.abs(b.centre.x-layout.width/2)?a:b);if(root.dataset.mediaReady!=='true'&&textures.get(current.index)?.loaded){root.dataset.mediaReady='true';root.dispatchEvent(new Event('portfolio:media'));}updateCaption(current.index);state.satDirty=false;root.dataset.position=state.position.toFixed(5);frameCost+=(performance.now()-started-frameCost)*.1;if(frameNumber%30===0){root.dataset.renderMs=frameCost.toFixed(1);root.dataset.fps=Math.round(1000/frameInterval);}
  if(frameNumber%120===0)for(const [index,record] of textures)if(record.last<frameNumber-120){gl.deleteTexture(record.texture);textures.delete(index);}
 }
 function tick(time){
  raf=0;if(suspended||document.hidden)return;if(last)frameInterval+=((time-last)-frameInterval)*.1;const elapsed=last?Math.min((time-last)/1000,.04):1/60;last=time;
  if(!dialog.open){
   // Fixed-size substeps keep the damped bend response stable after dropped frames.
   const steps=Math.ceil(elapsed/.012),dt=elapsed/steps;
   for(let i=0;i<steps;i++){
    state.time+=dt;
    if(!state.drag){state.position+=state.velocity*dt;state.velocity*=Math.exp(-dt/.22);if(Math.abs(state.velocity)<.004)state.velocity=0;}
    state.energy+=(Math.min(Math.abs(state.velocity),3)-state.energy)*(1-Math.exp(-dt/.24));
    state.flow+=(clamp(state.velocity,-3,3)-state.flow)*(1-Math.exp(-dt/.16));
    [state.flex,state.flexV]=math.spring(state.flex,state.flexV,clamp(state.velocity*.18,-.85,.85),dt,8,.62);
    updateHover(dt);
   }
   root.dataset.hoverLift=Math.max(0,...[...state.hovers.values()].map(h=>h.amount)).toFixed(4);
   render();root.dataset.flex=state.flex.toFixed(4);root.dataset.flow=state.flow.toFixed(4);
  }
  if(!document.hidden&&!suspended)raf=requestAnimationFrame(tick);
 }
 function initGL(){renderer=new window.PhotoFilmRenderer(canvas,math,compact);gl=renderer.gl;resize();root.dataset.compositing=renderer.peeling?'depth-peeling-2':'sorted-alpha';root.dataset.mesh=`${cols}x${rows}`;return true;}
 try{ready=initGL();}catch(error){console.warn('Photography uses its accessible image strip.',error);ready=false;}
 if(ready){
  root.classList.add('is-ready');root.dataset.renderer='webgl-ribbon';raf=requestAnimationFrame(tick);
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0||dialog.open)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);state.drag={id:event.pointerId,start:event.clientX,last:event.clientX,time:event.timeStamp,position:state.position,distance:0,velocity:0};state.velocity=0;if(event.pointerType==='touch')state.pointer=null;root.classList.add('is-dragging');});
  canvas.addEventListener('pointermove',event=>{if(event.pointerType!=='touch'){const rect=canvas.getBoundingClientRect();state.pointer={x:event.clientX-rect.left,y:event.clientY-rect.top};}const drag=state.drag;if(!drag||drag.id!==event.pointerId)return;const dt=Math.max(.008,(event.timeStamp-drag.time)/1000),dx=event.clientX-drag.last;state.position=drag.position-(event.clientX-drag.start)/layout.slot;drag.distance=Math.max(drag.distance,Math.abs(event.clientX-drag.start));drag.velocity=clamp(drag.velocity*.35+(-dx/layout.slot/dt)*.65,-6,6);state.velocity=drag.velocity;state.satDirty=true;drag.last=event.clientX;drag.time=event.timeStamp;});
  canvas.addEventListener('pointerleave',()=>{state.pointer=null;});
  const release=(event,cancel=false)=>{const drag=state.drag;if(!drag||drag.id!==event.pointerId)return;state.drag=null;root.classList.remove('is-dragging');if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(cancel){state.velocity=0;return;}if(drag.distance<6){state.velocity=0;const rect=canvas.getBoundingClientRect(),point={x:event.clientX-rect.left,y:event.clientY-rect.top},hit=hitFilm(point,true);if(hit)openPhoto(hit.index);}else state.velocity=event.timeStamp-drag.time>100?0:drag.velocity;};
  canvas.addEventListener('pointerup',event=>release(event));canvas.addEventListener('pointercancel',event=>release(event,true));canvas.addEventListener('lostpointercapture',event=>{if(state.drag?.id===event.pointerId){state.drag=null;state.velocity=0;root.classList.remove('is-dragging');}});
  root.addEventListener('wheel',event=>{if(dialog.open)return;event.preventDefault();const scale=event.deltaMode===1?16:event.deltaMode===2?layout.height:1,d=(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*scale;state.velocity=clamp(state.velocity+clamp(d,-220,220)/layout.slot*7.5,-6,6);state.satDirty=true;},{passive:false});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(raf);ready=false;root.classList.remove('is-ready');root.dataset.renderer='native-strip';});
 }else{root.dataset.renderer='native-strip';const update=()=>{const centre=layout.width/2;let nearest=0,distance=Infinity;links.forEach((link,i)=>{const r=link.getBoundingClientRect();if(r.right>=-250&&r.left<=layout.width+250)window.PortfolioRuntime?.activateImage(link.querySelector('img'));const d=Math.abs(r.left+r.width/2-centre),sat=math.saturation(r.left+r.width/2,layout.width,r.width);link.style.setProperty('--photo-gray',1-sat);if(d<distance){distance=d;nearest=i;}});updateCaption(nearest);};resize();fallback.addEventListener('scroll',update,{passive:true});update();}
 if(!ready){const first=links[0]?.querySelector('img');const prepared=()=>{root.dataset.mediaReady='true';root.dispatchEvent(new Event('portfolio:media'));};if(first?.complete&&first.naturalWidth)prepared();else{first?.addEventListener('load',prepared,{once:true});first?.addEventListener('error',()=>{root.dataset.mediaError='true';root.dispatchEvent(new Event('portfolio:media'));},{once:true});}}
 addEventListener('portfolio:suspend',()=>{suspended=true;cancelAnimationFrame(raf);state.velocity=0;state.drag=null;state.pointer=null;last=0;try{sessionStorage.setItem('yuanlan-photo-position',String(math.wrap(state.position,count)));}catch{}});
 addEventListener('portfolio:resume',()=>{suspended=false;last=0;cancelAnimationFrame(raf);if(ready&&!document.hidden)raf=requestAnimationFrame(tick);});
 addEventListener('resize',resize,{passive:true});compact.addEventListener('change',resize);reduced.addEventListener('change',()=>{state.idle=reduced.matches?0:1;});document.addEventListener('visibilitychange',()=>{if(!ready)return;cancelAnimationFrame(raf);last=0;if(!document.hidden&&!suspended)raf=requestAnimationFrame(tick);});addEventListener('pagehide',()=>{try{sessionStorage.setItem('yuanlan-photo-position',String(math.wrap(state.position,count)));}catch{}});
})();
