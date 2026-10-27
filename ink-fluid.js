/* Low-resolution incompressible velocity/density field, independent of the cards. */
window.PortfolioInk=function(host,reduced,small){
 const canvas=host.querySelector('.ink-canvas'),ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 let nx=96,ny=55,stride=98,size=0,u,v,nextU,nextV,density,nextDensity,pressure,divergence,image,width=1,height=1,raf=0,last=0,peak=0,previous=null;
 let suspended=false;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),allowed=()=>!suspended&&!document.hidden&&!reduced.matches&&!small.matches&&matchMedia('(pointer:fine)').matches;
 function resize(){const box=host.getBoundingClientRect();width=box.width;height=box.height;ny=Math.max(30,Math.min(80,Math.round(nx*height/width)));stride=nx+2;size=stride*(ny+2);[u,v,nextU,nextV,density,nextDensity,pressure,divergence]=Array.from({length:8},()=>new Float32Array(size));canvas.width=nx;canvas.height=ny;image=ctx.createImageData(nx,ny);peak=0;canvas.dataset.renderer='advected-ink-field';}
 function sample(source,x,y){x=clamp(x,.5,nx+.5);y=clamp(y,.5,ny+.5);const i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j,k=i+j*stride;return (1-a)*((1-b)*source[k]+b*source[k+stride])+a*((1-b)*source[k+1]+b*source[k+stride+1]);}
 function project(){pressure.fill(0);for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){const k=x+y*stride;divergence[k]=-.5*(u[k+1]-u[k-1]+v[k+stride]-v[k-stride]);}for(let pass=0;pass<12;pass++)for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){const k=x+y*stride;pressure[k]=(divergence[k]+pressure[k-1]+pressure[k+1]+pressure[k-stride]+pressure[k+stride])*.25;}for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){const k=x+y*stride;u[k]-=.5*(pressure[k+1]-pressure[k-1]);v[k]-=.5*(pressure[k+stride]-pressure[k-stride]);}}
 function animate(time){raf=0;if(!allowed())return;const dt=last?Math.min((time-last)/1000,.04):1/60;last=time;const damp=Math.exp(-dt*1.8),fade=Math.exp(-dt*1.35);
  project();for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){const k=x+y*stride;nextU[k]=sample(u,x-dt*u[k],y-dt*v[k])*damp;nextV[k]=sample(v,x-dt*u[k],y-dt*v[k])*damp;}
  [u,nextU]=[nextU,u];[v,nextV]=[nextV,v];project();peak=0;
  for(let y=1;y<=ny;y++)for(let x=1;x<=nx;x++){const k=x+y*stride,d=sample(density,x-dt*u[k],y-dt*v[k])*fade;nextDensity[k]=d;peak=Math.max(peak,d);const pixel=((y-1)*nx+x-1)*4;image.data[pixel]=188;image.data[pixel+1]=193;image.data[pixel+2]=188;image.data[pixel+3]=Math.round((1-Math.exp(-d*1.7))*90);}
  [density,nextDensity]=[nextDensity,density];ctx.putImageData(image,0,0);canvas.dataset.energy=peak.toFixed(4);
  if(peak>.003)raf=requestAnimationFrame(animate);else{ctx.clearRect(0,0,nx,ny);canvas.dataset.energy='0';last=0;}
 }
 host.addEventListener('pointermove',event=>{if(!allowed()||event.pointerType==='touch')return;const box=host.getBoundingClientRect(),point={x:(event.clientX-box.left)/width*nx+1,y:(event.clientY-box.top)/height*ny+1,time:event.timeStamp};const fresh=!previous||point.time-previous.time>180,dx=fresh?0:clamp((point.x-previous.x)*4.2,-36,36),dy=fresh?0:clamp((point.y-previous.y)*4.2,-36,36),radius=7;
  for(let y=Math.max(1,Math.floor(point.y-radius));y<=Math.min(ny,point.y+radius);y++)for(let x=Math.max(1,Math.floor(point.x-radius));x<=Math.min(nx,point.x+radius);x++){const rx=x-point.x,ry=y-point.y,d=(rx*rx+ry*ry)/(radius*radius),weight=Math.exp(-d*4.5)*(1+.13*Math.sin(x*.83+y*.61));if(d>1)continue;const k=x+y*stride;density[k]=Math.min(3,density[k]+weight*.23);u[k]+=weight*(dx-ry*.18);v[k]+=weight*(dy+rx*.18);}
  previous=point;peak=Math.max(peak,.1);if(!raf)raf=requestAnimationFrame(animate);
 },{passive:true});
 host.addEventListener('pointerleave',()=>{previous=null;});
 function stop(){cancelAnimationFrame(raf);raf=0;last=0;peak=0;previous=null;u?.fill(0);v?.fill(0);density?.fill(0);ctx.clearRect(0,0,nx,ny);canvas.dataset.energy='0';}
 addEventListener('portfolio:suspend',()=>{suspended=true;stop();});addEventListener('portfolio:resume',()=>{suspended=false;});
 addEventListener('resize',resize,{passive:true});small.addEventListener('change',stop);reduced.addEventListener('change',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();}).observe(host);resize();
};
