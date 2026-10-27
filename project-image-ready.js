/* One readiness gate for prefetch, cached entries and the visible image handoff. */
window.PortfolioProjectImage=(()=>{
 const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 const source=image=>image.currentSrc||image.src;
 async function decode(image){
  if(!image)throw new Error('The project image is missing.');
  for(let attempt=0;attempt<3;attempt++){
   const before=source(image);
   try{
    // complete/naturalWidth describe the download, not a decoded paintable frame.
    // Always decode, including warm HTTP caches and previously mounted pages.
    if(image.decode)await image.decode();
    else if(!image.complete)await new Promise((resolve,reject)=>{
     const done=()=>{image.removeEventListener('load',done);image.removeEventListener('error',fail);resolve();};
     const fail=()=>{image.removeEventListener('load',done);image.removeEventListener('error',fail);reject(new Error('The project image could not be loaded.'));};
     image.addEventListener('load',done,{once:true});image.addEventListener('error',fail,{once:true});
    });
   }catch(error){if(before!==source(image))continue;throw error;}
   if(!image.complete||!image.naturalWidth||!image.naturalHeight)throw new Error('The project image could not be decoded.');
   if(before===source(image))return image;
  }
  throw new Error('The responsive project image changed during preparation. Please retry.');
 }
 function raster(image,maxEdge=4096){
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  if(!width||!height)throw new Error('The cover has no drawable pixels.');
  const scale=Math.min(1,maxEdge/Math.max(width,height)),surface=document.createElement('canvas');
  surface.width=Math.max(1,Math.round(width*scale));surface.height=Math.max(1,Math.round(height*scale));
  const context=surface.getContext('2d');if(!context)throw new Error('The project image could not be prepared for drawing.');
  context.drawImage(image,0,0,surface.width,surface.height);
  return surface;
 }
 async function prepare(image){
  image.loading='eager';image.fetchPriority='high';
  await decode(image);await frame();
  const rect=image.getBoundingClientRect();
  if(image.isConnected===false||rect.width<=0||rect.height<=0)throw new Error('The first portfolio image is not mounted.');
  const edge=Math.min(4096,Math.ceil(Math.max(rect.width,rect.height)*Math.min(devicePixelRatio||1,2)));
  const surface=raster(image,edge);
  image.dataset.motionImageReady='true';
  return {image,src:source(image),surface,rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height}};
 }
 async function painted(record,view,cancelled=()=>false){
  if(!record)return;
  const check=()=>{
   if(cancelled())throw new Error('Navigation interrupted');
   const image=record.image,rect=image.getBoundingClientRect();
   if(image.isConnected===false||source(image)!==record.src||!image.complete||!image.naturalWidth||rect.width<=0||rect.height<=0)throw new Error('The first portfolio image is no longer ready.');
   const style=view.win.getComputedStyle?.(image);
   if(style&&(style.visibility==='hidden'||Number(style.opacity)===0))throw new Error('The first portfolio image is not visible.');
  };
  check();
  // Keep the cover above the visible destination through layout and a full paint
  // opportunity. These are rendering frames, not a guessed network delay.
  await frame();check();await frame();check();
 }
 async function prefetch(markupImage,url){
  const image=new Image();image.loading='eager';image.decoding='async';image.fetchPriority='high';
  // Match the actual <img> resource choice, including responsive/DPR selection.
  image.sizes=markupImage.getAttribute('sizes')||'100vw';
  if(markupImage.getAttribute('srcset'))image.srcset=markupImage.getAttribute('srcset');
  image.src=new URL(markupImage.getAttribute('src'),url).href;
  await decode(image);return image;
 }
 return {decode,prepare,painted,prefetch,raster};
})();
