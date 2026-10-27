/* Keep a drawable cover above the mounted detail until its first image paints. */
(()=>{
// Reuse one context. Tearing down a compositor surface at the exact handoff is
// unnecessary; retaining every abandoned context would also evict the orbit.
let cachedCanvas=null;
window.PortfolioCoverTransition=function({source,targetImage,targetSurface,targetRect,next=false}){
 const oldImage=window.PortfolioProjectImage.raster(source?.surface||source?.image||targetImage);
 const newImage=targetSurface||window.PortfolioProjectImage.raster(targetImage);
 const layer=document.createElement('div');layer.className='motion-layer motion-cover';layer.setAttribute('aria-hidden','true');
 const canvas=cachedCanvas??=document.createElement('canvas'),flat=document.createElement('canvas');layer.append(flat,canvas);document.body.append(layer);
 canvas.style.display='block';
 const width=innerWidth,height=innerHeight,camera=1200,dpr=Math.min(devicePixelRatio||1,2);
 for(const c of [flat,canvas]){c.width=Math.ceil(width*dpr);c.height=Math.ceil(height*dpr);c.className='motion-cover-surface';}
 flat.style.display='none';
 const oldAspect=oldImage.width/oldImage.height,newAspect=newImage.width/newImage.height;
 const sourceRect=source?.rect||{left:(width-targetRect.width*.9)/2,top:(height-targetRect.height*.9)/2,width:targetRect.width*.9,height:targetRect.height*.9};
 const smooth=(a,b,t)=>{const q=Math.max(0,Math.min(1,(t-a)/(b-a)));return q*q*(3-2*q);};
 const crop=(aspect,box)=>aspect>box?[box/aspect,1]:[1,aspect/box];
 function point(u,v){
  if(source?.matrix){
   const radius=source.cardWidth*1.25,a=(u-.5)/1.25,local=[Math.sin(a)*radius,(v-.5)*source.cardHeight,(Math.cos(a)-1)*radius],m=source.matrix,p=source.position;
   const x=m[0]*local[0]+m[3]*local[1]+m[6]*local[2]+p[0],y=m[1]*local[0]+m[4]*local[1]+m[7]*local[2]+p[1],z=m[2]*local[0]+m[5]*local[1]+m[8]*local[2]+p[2],k=source.camera/(source.camera-z);
   return {x:source.rect.left+source.viewport[0]/2+x*k,y:source.rect.top+source.viewport[1]/2+y*k,z:z/source.camera*camera};
  }
  return {x:sourceRect.left+u*sourceRect.width,y:sourceRect.top+v*sourceRect.height,z:next?300:180};
 }
 const corners=[0,.5,1].flatMap(u=>[point(u,0),point(u,1)]),left=Math.min(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y));
 const startRect={left,top,width:Math.max(...corners.map(p=>p.x))-left,height:Math.max(...corners.map(p=>p.y))-top};
 let last=0,removed=false,renderer,release=()=>{},context=null;
 function flatDraw(t){
  context??=flat.getContext('2d');if(!context)return;
  const e=1-Math.pow(1-t,3),mix=next?1:smooth(.68,.96,t),rect={};
  for(const k of ['left','top','width','height'])rect[k]=startRect[k]+(targetRect[k]-startRect[k])*e;
  rect.top-=Math.sin(t*Math.PI)*8;
  context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,width,height);
  const paint=(image,alpha)=>{if(alpha<=0)return;const c=crop(image.width/image.height,rect.width/rect.height),sw=image.width*c[0],sh=image.height*c[1];context.globalAlpha=alpha*(next?smooth(.05,.28,t):1);context.drawImage(image,(image.width-sw)/2,(image.height-sh)/2,sw,sh,rect.left,rect.top,rect.width,rect.height);};
  // Add the two weighted surfaces on a clear canvas. Source-over here would
  // make a .5/.5 crossfade only .75 opaque and expose the dark background.
  context.globalCompositeOperation='lighter';paint(oldImage,1-mix);paint(newImage,mix);context.globalCompositeOperation='source-over';context.globalAlpha=1;
 }
 function fallback(){canvas.style.display='none';flat.style.display='block';renderer=flatDraw;flatDraw(last);layer.dataset.renderer='2d';}
 const controller={canvas:layer,draw(t){last=t;renderer?.(t);},remove(){if(removed)return;removed=true;release();canvas.remove();layer.remove();}};
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
 if(!gl||gl.isContextLost()){cachedCanvas=null;fallback();return controller;}
 let program=null,vb=null,ib=null;const textures=[],shaders=[];
 release=()=>{canvas.removeEventListener('webglcontextlost',lost);textures.forEach(t=>gl.deleteTexture(t));shaders.forEach(s=>gl.deleteShader(s));if(vb)gl.deleteBuffer(vb);if(ib)gl.deleteBuffer(ib);if(program)gl.deleteProgram(program);};
 function lost(event){event.preventDefault();if(cachedCanvas===canvas)cachedCanvas=null;if(!removed)fallback();}
 canvas.addEventListener('webglcontextlost',lost);
 try{
  gl.viewport(0,0,canvas.width,canvas.height);
  const vertex=`attribute vec3 aFrom;attribute vec3 aTo;attribute vec2 aUV;uniform vec2 uViewport;uniform float uProgress;varying vec2 vUV;void main(){vec3 p=mix(aFrom,aTo,uProgress);p.z+=sin(uProgress*3.14159265)*32.;p.y-=sin(uProgress*3.14159265)*8.;float w=1.-p.z/1200.;gl_Position=vec4(p.x/(uViewport.x*.5),-p.y/(uViewport.y*.5),0.,w);vUV=aUV;}`;
  const fragment=`precision mediump float;uniform sampler2D uOld;uniform sampler2D uNew;uniform vec2 uOldCrop;uniform vec2 uNewCrop;uniform float uBlend;uniform float uAlpha;varying vec2 vUV;void main(){vec4 a=texture2D(uOld,(vUV-.5)*uOldCrop+.5),b=texture2D(uNew,(vUV-.5)*uNewCrop+.5);vec4 c=mix(a,b,uBlend);gl_FragColor=vec4(c.rgb,c.a*uAlpha);}`;
  program=gl.createProgram();
  for(const [type,text] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,text);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Cover shader unavailable');gl.attachShader(program,shader);}
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Cover program unavailable');gl.useProgram(program);
  const uniforms=Object.fromEntries(['uViewport','uProgress','uOld','uNew','uOldCrop','uNewCrop','uBlend','uAlpha'].map(k=>[k,gl.getUniformLocation(program,k)]));
  const textureLimit=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE));
  if(textureLimit<1)throw new Error('Cover texture size unavailable');
  function texture(image,unit){
   const drawable=Math.max(image.width,image.height)>textureLimit?window.PortfolioProjectImage.raster(image,textureLimit):image;
   gl.activeTexture(gl.TEXTURE0+unit);const texture=gl.createTexture();textures.push(texture);gl.bindTexture(gl.TEXTURE_2D,texture);
   for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,drawable);
   if(gl.getError()!==gl.NO_ERROR)throw new Error('Cover texture upload failed');
  }
  texture(oldImage,0);texture(newImage,1);
  const vertices=[],indices=[],cols=48,rows=8,world=(x,y,z)=>[(x-width/2)*(1-z/camera),(y-height/2)*(1-z/camera),z];
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const u=x/cols,v=y/rows,p=point(u,v);vertices.push(...world(p.x,p.y,p.z),...world(targetRect.left+u*targetRect.width,targetRect.top+v*targetRect.height,450),u,v);}
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
  vb=gl.createBuffer();ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  for(const [name,size,offset] of [['aFrom',3,0],['aTo',3,12],['aUV',2,24]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset);}
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.uniform2f(uniforms.uViewport,width,height);gl.uniform1i(uniforms.uOld,0);gl.uniform1i(uniforms.uNew,1);
  let firstDraw=true;
  renderer=t=>{
   if(gl.isContextLost()){if(cachedCanvas===canvas)cachedCanvas=null;fallback();return;}
   const e=1-Math.pow(1-t,3),aspect=oldAspect+(targetRect.width/targetRect.height-oldAspect)*e;
   gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(uniforms.uProgress,e);gl.uniform2fv(uniforms.uOldCrop,crop(oldAspect,aspect));gl.uniform2fv(uniforms.uNewCrop,crop(newAspect,aspect));gl.uniform1f(uniforms.uBlend,next?1:smooth(.68,.96,t));gl.uniform1f(uniforms.uAlpha,next?smooth(.05,.28,t):1);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
   if(gl.getError()!==gl.NO_ERROR)fallback();else if(firstDraw){gl.finish();firstDraw=false;}else gl.flush();
  };
  layer.dataset.renderer='webgl';
 }catch(error){fallback();}
 return controller;
};
})();
