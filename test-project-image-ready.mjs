import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const imageCode=await readFile(new URL('./project-image-ready.js',import.meta.url),'utf8');
const coverCode=await readFile(new URL('./cover-transition.js',import.meta.url),'utf8');
function harness({noGL=false,uploadError=false}={}){
 const draws=[],uploads=[],frames=[],nodes=[];let error=0,lost=false;
 const gl={NO_ERROR:0,MAX_TEXTURE_SIZE:1,COMPILE_STATUS:2,LINK_STATUS:3,TEXTURE0:100,
  getParameter:()=>2048,getError:()=>{const result=error;error=0;return result;},isContextLost:()=>lost,
  createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),createTexture:()=>({}),
  getShaderParameter:()=>true,getProgramParameter:()=>true,getUniformLocation:()=>({}),getAttribLocation:()=>0,
  texImage2D(...args){const surface=args.at(-1);uploads.push(surface);if(uploadError)error=1281;},
 };
 for(const name of ['viewport','shaderSource','compileShader','attachShader','linkProgram','useProgram','activeTexture','bindTexture','texParameteri','bindBuffer','bufferData','enableVertexAttribArray','vertexAttribPointer','enable','blendFunc','uniform2f','uniform1i','uniform1f','uniform2fv','clearColor','clear','drawElements','finish','flush','deleteTexture','deleteShader','deleteBuffer','deleteProgram'])gl[name]??=()=>{};
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.style={};this.dataset={};this.children=[];this.listeners={};this.width=0;this.height=0;nodes.push(this);}
  setAttribute(){}append(...children){this.children.push(...children);children.forEach(child=>child.parent=this);}remove(){this.removed=true;}addEventListener(k,fn){this.listeners[k]=fn;}removeEventListener(k){delete this.listeners[k];}
  getContext(kind){if(kind==='webgl')return noGL?null:gl;const surface=this;return {setTransform(){},clearRect(){},drawImage(...args){const image=args[0];if(image.paintable===false)throw Error('not decoded');surface.content=image.content||image.id;draws.push({surface,args,alpha:this.globalAlpha??1,composite:this.globalCompositeOperation||'source-over'});}};}
 }
 class Image{
  constructor(){this.complete=true;this.naturalWidth=6000;this.naturalHeight=2100;this.style={opacity:'1'};this.dataset={};this.isConnected=true;this.src='http://test/first.webp';this.currentSrc='';this.calls=0;this.id='first';}
  async decode(){this.calls++;this.paintable=true;}
  getBoundingClientRect(){return {left:40,top:420,width:1200,height:420};}
 }
 const ctx={console,URL,Image,innerWidth:1280,innerHeight:720,devicePixelRatio:2,requestAnimationFrame:fn=>setImmediate(()=>{frames.push('frame');fn();}),document:{createElement:tag=>new Element(tag),body:new Element('body')}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(imageCode,ctx);vm.runInContext(coverCode,ctx);
 return {ctx,draws,uploads,frames,nodes,Image,get lost(){return lost;},loseContext(){lost=true;},view:{win:{getComputedStyle:image=>({opacity:image.style.opacity,visibility:'visible'})}}};
}
const h=harness(),image=new h.Image();
let release;image.paintable=false;image.decode=()=>{image.calls++;return new Promise(resolve=>release=()=>{image.paintable=true;resolve();});};
let resolved=false;const pending=h.ctx.PortfolioProjectImage.prepare(image).then(value=>{resolved=true;return value;});
await new Promise(setImmediate);assert.equal(resolved,false);assert.equal(image.calls,1,'Complete cached images still wait for decode');assert.equal(h.draws.length,0);
release();const record=await pending;assert.ok(record.surface.width<=4096);assert.ok(record.surface.height<=4096);assert.equal(image.dataset.motionImageReady,'true');
const before=h.frames.length;await h.ctx.PortfolioProjectImage.painted(record,h.view);assert.ok(h.frames.length>=before+2);
image.style.opacity='0';await assert.rejects(h.ctx.PortfolioProjectImage.painted(record,h.view),/not visible/);image.style.opacity='1';
image.isConnected=false;await assert.rejects(h.ctx.PortfolioProjectImage.painted(record,h.view),/no longer ready/);image.isConnected=true;
await assert.rejects(h.ctx.PortfolioProjectImage.painted(record,h.view,()=>true),/interrupted/);
image.currentSrc='http://test/replaced.webp';await assert.rejects(h.ctx.PortfolioProjectImage.painted(record,h.view),/no longer ready/);image.currentSrc='';
const markup={getAttribute:name=>({src:'/first.webp',srcset:'/first-small.webp 960w, /first-full.webp 6000w',sizes:'(max-width:1840px) 94vw,1720px'}[name]||null)};
const preloaded=await h.ctx.PortfolioProjectImage.prefetch(markup,'http://test/en/work/example/');
assert.equal(preloaded.sizes,markup.getAttribute('sizes'));assert.equal(preloaded.srcset,markup.getAttribute('srcset'));assert.equal(preloaded.src,'http://test/first.webp');assert.equal(preloaded.calls,1);assert.equal(preloaded.fetchPriority,'high');
let cover=h.ctx.PortfolioCoverTransition({source:{image},targetImage:image,targetSurface:record.surface,targetRect:record.rect});
cover.draw(0);cover.draw(1);assert.equal(cover.canvas.dataset.renderer,'webgl');assert.equal(h.uploads.length,2);assert.ok(h.uploads.every(s=>s.width<=2048&&s.height<=2048),'Textures are bounded by the actual GPU limit');
const gpuCanvas=cover.canvas.children[1];cover.remove();cover=h.ctx.PortfolioCoverTransition({source:{image},targetImage:image,targetSurface:record.surface,targetRect:record.rect});assert.equal(cover.canvas.children[1],gpuCanvas,'Repeated entries reuse one GPU context instead of tearing it down or exhausting context limits');
h.loseContext();cover.draw(.8);assert.equal(cover.canvas.dataset.renderer,'2d');assert.ok(h.draws.length>0);cover.remove();assert.equal(cover.canvas.removed,true);
for(const options of [{noGL:true},{uploadError:true}]){
 const fallback=harness(options),hero=new fallback.Image(),ready=await fallback.ctx.PortfolioProjectImage.prepare(hero);
 const transition=fallback.ctx.PortfolioCoverTransition({source:{image:hero},targetImage:hero,targetSurface:ready.surface,targetRect:ready.rect});
 transition.draw(.8);const blend=fallback.draws.slice(-2);assert.ok(blend.every(d=>d.composite==='lighter'));assert.ok(Math.abs(blend[0].alpha+blend[1].alpha-1)<1e-8,'The fallback blend never exposes background between two opaque frames');
 transition.draw(1);assert.equal(transition.canvas.dataset.renderer,'2d');assert.ok(fallback.draws.some(d=>d.args[0]===ready.surface),'Fallback draws the decoded destination instead of a failed black texture');transition.remove();
}
console.log('PASS: cached decode waits, raster/paint readiness, responsive prefetch, mounted/visible guards, real GPU size limits, context-loss and upload-failure drawing fallback.');
