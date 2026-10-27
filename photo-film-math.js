window.PhotoFilmMath={
 layout(width,height,compact){
  const slot=compact?Math.max(260,Math.min(width*.78,380)):Math.max(360,Math.min(width*.32,520));
  return {width,height,slot,filmHeight:slot*800/1024,camera:Math.max(compact?950:1150,width*.9),compact};
 },
 // A ruled ribbon: the cross-section rotates around its own spatial tangent.
 // Its projected waves come from depth and torsion, with little vertical travel.
 section(tile,u,layout,state){
  const s=tile-state.position+u-.5,q=u-.5,scale=layout.slot/410;
  const mobile=layout.compact?.52:1,phase=tile*1.73+state.position*1.18+(state.flex||0)*.6;
  const env=Math.sin(Math.PI*u)**2,de=Math.PI*Math.sin(2*Math.PI*u),energy=Math.min(state.energy||0,3);
  const flow=state.flow||0,idle=(state.idle||0)*.008*Math.sin(state.time*.5+tile*.8);
  const bend=mobile*scale*(1+energy*.12),bow=54*Math.cos(phase)+8*Math.sin(2*Math.PI*u+phase);
  const bowD=16*Math.PI*Math.cos(2*Math.PI*u+phase),t=Math.tanh(s*.62);
  // No world-space height ramp or camera roll. Keep a quiet, frontal centre,
  // with depth and torsion increasing naturally toward the sides.
  const focus=.12+.88*(1-Math.exp(-((s/1.05)**4)));
  let x=s*layout.slot*.96,y=0,z=mobile*scale*(275*t*t*t+42*Math.cos(s*1.1+state.position*.12))+bend*env*bow;
  let dx=layout.slot*.96,dy=0,dz=mobile*scale*(511.5*t*t*(1-t*t)-46.2*Math.sin(s*1.1+state.position*.12))+bend*(de*bow+env*bowD);
  let twist=mobile*focus*(.48*Math.sin(s*1.45+state.position*.11)+.1*Math.sin(s*.5)+env*.29*Math.sin(phase)+flow*.035+idle);
  const lifts=[];
  for(const [hoverTile,h] of state.hovers||[]){
   const distance=Math.abs(tile-hoverTile);if(distance>1||h.amount<.0001)continue;
   const amount=h.amount*(distance===0?1:.12)*mobile,hx=(h.u-.5)*2,hy=(h.v-.5)*2;
   const edge=.24+.76*env,spot=Math.exp(-((u-h.u)**2)/.13);
   x+=scale*amount*(7*hx+q*6);dx+=scale*amount*6;
   y-=scale*amount*(12*edge+3*spot);dy-=scale*amount*(12*.76*de-6*(u-h.u)/.13*spot);
   z+=scale*amount*(64*edge+q*42*hx+17*spot);dz+=scale*amount*(64*.76*de+42*hx-34*(u-h.u)/.13*spot);
   twist+=amount*(.2*hy+.13*hx+env*.12*Math.sin(phase));lifts.push({amount,h,spot});
  }
  const length=Math.hypot(dx,dy,dz),tx=dx/length,ty=dy/length,tz=dz/length;
  let vx=-ty*tx,vy=1-ty*ty,vz=-ty*tz;const vl=Math.hypot(vx,vy,vz);vx/=vl;vy/=vl;vz/=vl;
  const bx=ty*vz-tz*vy,by=tz*vx-tx*vz,bz=tx*vy-ty*vx,c=Math.cos(twist),si=Math.sin(twist);
  const vertical=[vx*c+bx*si,vy*c+by*si,vz*c+bz*si],half=layout.filmHeight*.5;
  // Counter only the perspective displacement of a twisted cross-section.
  // Its upper/lower projected midpoint stays level; depth and curl remain intact.
  y-=half*half*vertical[1]*vertical[2]/(layout.camera-z);
  return {centre:[x,y,z],vertical,lifts,scale,u};
 },
 fromSection(section,v,layout){
  const r=(v-.5)*layout.filmHeight,p=section.centre.map((n,i)=>n+r*section.vertical[i]);
  for(const {amount,h,spot} of section.lifts){const local=spot*Math.exp(-((v-h.v)**2)/.2);p[2]+=section.scale*amount*14*local;}
  return p;
 },
 surface(tile,u,v,layout,state){return this.fromSection(this.section(tile,u,layout,state),v,layout);},
 holes(){const holes=[];for(let i=0;i<12;i++)for(const y of [48,710])holes.push({x:i*1024/12+13,y,w:59,h:44,r:10});return holes;},
 isHole(u,v){const x=u*1024,y=v*800;for(const h of this.holes()){const qx=Math.abs(x-h.x-h.w/2)-(h.w/2-h.r),qy=Math.abs(y-h.y-h.h/2)-(h.h/2-h.r);if(Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)<h.r)return true;}return false;},
 project(p,layout){const k=layout.camera/(layout.camera-p[2]);return {x:layout.width/2+p[0]*k,y:layout.height*.52+p[1]*k,z:p[2]};},
 saturation(screenX,width,frameWidth){const d=Math.abs(screenX-width/2)/Math.max(1,frameWidth*.9),t=Math.max(0,Math.min(1,(d-.045)/.955));return Math.pow(1-t*t*(3-2*t),1.6);},
 wrap(value,count){return ((value%count)+count)%count;},
 contains(point,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;},
 barycentric(p,a,b,c){const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-8)return null;const x=((b.y-c.y)*(p.x-c.x)+(c.x-b.x)*(p.y-c.y))/den,y=((c.y-a.y)*(p.x-c.x)+(a.x-c.x)*(p.y-c.y))/den,z=1-x-y;return x>=-.0001&&y>=-.0001&&z>=-.0001?[x,y,z]:null;},
 spring(value,velocity,target,dt,frequency=11,damping=.84){const a=frequency*frequency*(target-value)-2*damping*frequency*velocity;velocity+=a*dt;return [value+velocity*dt,velocity];}
};
