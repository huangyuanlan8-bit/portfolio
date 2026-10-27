/* Rigid card + off-centre pointer joint + elastic unilateral tether.
   The ribbon particles are visual straps pinned to the same attachment. */
window.BadgePhysics=class BadgePhysics {
 constructor({x,y,width=310,height=475,neck=62,restAngle=0,spread=145,anchorY=-185,left=0,right=1265}) {
  this.dt=1/120;this.gravity=1550;this.home={x,y};this.pivot={x,y:anchorY};this.length=y-anchorY;
  this.restLength=this.length-this.gravity/145;this.com=neck+height/2;this.inertia=(width*width+height*height)/12;
  this.bounds={left,right};this.restAngle=restAngle;this.angle=restAngle;this.omega=0;this.vx=0;this.vy=0;
  const r=this.rotate({x:0,y:-this.com});this.center={x:x-r.x,y:y-r.y};this.body={x,y,w:0};this.drag=null;this.target=null;
  this.anchors=[{x:x-spread,y:anchorY},{x:x+spread,y:anchorY}];
  this.ropes=this.anchors.map((a,side)=>{const nodes=[{...a,px:a.x,py:a.y,w:0}];for(let i=1;i<12;i++){const t=i/12,bow=Math.sin(t*Math.PI)*(side?5:-5);nodes.push({x:a.x+(x-a.x)*t+bow,y:a.y+(y-a.y)*t,px:a.x+(x-a.x)*t+bow,py:a.y+(y-a.y)*t,w:1});}nodes.push(this.body);return {nodes,length:Math.hypot(spread,y-anchorY)*1.008};});
 }
 rotate(p,angle=this.angle){const c=Math.cos(angle),s=Math.sin(angle);return {x:c*p.x-s*p.y,y:s*p.x+c*p.y};}
 worldPoint(local){const r=this.rotate(local);return {x:this.center.x+r.x,y:this.center.y+r.y};}
 localPoint(world){return this.rotate({x:world.x-this.center.x,y:world.y-this.center.y},-this.angle);}
 sync(){const a=this.worldPoint({x:0,y:-this.com});this.body.x=a.x;this.body.y=a.y;}
 grabAt(x,y,time=0){this.drag={local:this.localPoint({x,y}),target:{x,y},history:[{x:this.center.x,y:this.center.y,angle:this.angle,time}],lastMove:time,ax:0,ay:0,pvx:0,pvy:0};this.target=this.drag.target;this.vx=this.vy=0;}
 dragTo(x,y,time=0){if(!this.drag){this.grabAt(this.body.x,this.body.y,time);}const d=this.drag,previous=d.target,delta=Math.max(.008,(time-d.lastMove)/1000),vx=(x-previous.x)/delta,vy=(y-previous.y)/delta;d.ax=Math.max(-18000,Math.min(18000,(vx-d.pvx)/delta));d.ay=Math.max(-18000,Math.min(18000,(vy-d.pvy)/delta));d.pvx=vx;d.pvy=vy;d.target={x,y};d.lastMove=time;this.target=d.target;this.pinDrag();this.recordDrag(time);}
 pinDrag(){const d=this.drag;if(!d)return;const r=this.rotate(d.local);this.center.x=d.target.x-r.x;this.center.y=d.target.y-r.y;this.sync();const dx=this.body.x-this.pivot.x,dy=this.body.y-this.pivot.y,distance=Math.hypot(dx,dy),limit=this.length+24;if(distance>limit){this.center.x-=dx/distance*(distance-limit);this.center.y-=dy/distance*(distance-limit);this.sync();}}
 recordDrag(time){const d=this.drag;if(!d)return;d.history.push({x:this.center.x,y:this.center.y,angle:this.angle,time});d.history=d.history.filter(s=>time-s.time<110).slice(-16);}
 release(_vx,_vy,time=0,cancel=false){if(!this.drag)return;const d=this.drag,latest=d.history.at(-1);let first=d.history.find(s=>latest.time-s.time>=35)||d.history[0];if(!cancel&&time-d.lastMove<130&&latest.time>first.time){const dt=(latest.time-first.time)/1000;this.vx=Math.max(-1250,Math.min(1250,(latest.x-first.x)/dt));this.vy=Math.max(-1100,Math.min(1100,(latest.y-first.y)/dt));const measured=(latest.angle-first.angle)/dt;this.omega=Math.max(-5,Math.min(5,measured*.65+this.omega*.35));}else{this.vx=this.vy=0;this.omega*=.45;}this.drag=null;this.target=null;}
 impulse(vx,vy,spin=0,local=null){if(this.drag)return;this.vx=Math.max(-700,Math.min(700,this.vx+vx));this.vy=Math.max(-600,Math.min(600,this.vy+vy));this.omega+=spin;if(local){const r=this.rotate(local);this.omega+=(r.x*vy-r.y*vx)/this.inertia*.45;}}
 tetherForce(){const a=this.worldPoint({x:0,y:-this.com}),r=this.rotate({x:0,y:-this.com}),dx=a.x-this.pivot.x,dy=a.y-this.pivot.y,d=Math.hypot(dx,dy)||1,n={x:dx/d,y:dy/d},avx=this.vx-this.omega*r.y,avy=this.vy+this.omega*r.x,radial=avx*n.x+avy*n.y;const tension=Math.max(0,145*(d-this.restLength)+10*radial);return {x:-n.x*tension,y:-n.y*tension,r,n,d};}
 step(time=0){const dt=this.dt,bias=this.gravity*this.com*Math.sin(this.restAngle);
  if(this.drag){const d=this.drag;this.pinDrag();const rG=this.rotate(d.local),rA=this.rotate({x:0,y:-this.com}),cg={x:-rG.x,y:-rG.y},ag={x:rA.x-rG.x,y:rA.y-rG.y};const force=this.tetherForce(),dragInertia=this.inertia+d.local.x*d.local.x+d.local.y*d.local.y;
   const torque=cg.x*this.gravity+ag.x*force.y-ag.y*force.x-(cg.x*d.ay-cg.y*d.ax)*.65+bias;
   this.omega+=(Math.max(-32,Math.min(32,torque/dragInertia))-3.4*this.omega)*dt;this.omega=Math.max(-4,Math.min(4,this.omega));this.angle+=this.omega*dt;this.angle=Math.max(-1.15,Math.min(1.15,this.angle));d.ax*=.78;d.ay*=.78;this.pinDrag();this.recordDrag(time);
  }else{const force=this.tetherForce();this.vx+=(force.x-1.2*this.vx)*dt;this.vy+=(this.gravity+force.y-1.2*this.vy)*dt;this.omega+=((force.r.x*force.y-force.r.y*force.x+bias)/this.inertia-2.4*this.omega)*dt;this.center.x+=this.vx*dt;this.center.y+=this.vy*dt;this.angle+=this.omega*dt;
   // Position and velocity impulses at the attachment preserve tangential inertia.
   for(let i=0;i<5;i++){this.sync();const r=this.rotate({x:0,y:-this.com}),dx=this.body.x-this.pivot.x,dy=this.body.y-this.pivot.y,d=Math.hypot(dx,dy)||1,limit=this.length+26;if(d<=limit)break;const nx=dx/d,ny=dy/d,cross=r.x*ny-r.y*nx,effective=1+cross*cross/this.inertia,lambda=(d-limit)/effective;this.center.x-=nx*lambda;this.center.y-=ny*lambda;this.angle-=cross*lambda/this.inertia;const outward=(this.vx-this.omega*r.y)*nx+(this.vy+this.omega*r.x)*ny;if(outward>0){const j=outward*1.18/effective;this.vx-=nx*j;this.vy-=ny*j;this.omega-=cross*j/this.inertia;}}
   this.sync();
  }
  const points=this.ropes.flatMap(r=>r.nodes.slice(1,-1));let ribbonSpeed=0;for(const p of points){const x=p.x,y=p.y;p.x+=(p.x-p.px)*Math.exp(-4*dt);p.y+=(p.y-p.py)*Math.exp(-4*dt)+950*dt*dt;p.px=x;p.py=y;}
  for(const rope of this.ropes){const start=rope.nodes[0],span=Math.hypot(this.body.x-start.x,this.body.y-start.y);rope.segment=Math.max(rope.length,span*1.002)/12;}
  for(let pass=0;pass<14;pass++)for(const rope of this.ropes)for(let i=0;i<rope.nodes.length-1;i++){const a=rope.nodes[i],b=rope.nodes[i+1],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.0001,total=a.w+b.w;if(!total)continue;const error=(d-rope.segment)/d;a.x+=dx*error*a.w/total;a.y+=dy*error*a.w/total;b.x-=dx*error*b.w/total;b.y-=dy*error*b.w/total;}
  for(const p of points)ribbonSpeed=Math.max(ribbonSpeed,Math.hypot(p.x-p.px,p.y-p.py)/dt);return Math.max(Math.hypot(this.vx,this.vy),Math.abs(this.omega)*this.com,ribbonSpeed);
 }
};
