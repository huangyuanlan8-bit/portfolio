/* Shared deformed geometry for photographs, film base, lettering and thin walls. */
window.PhotoFilmRenderer=class {
 constructor(canvas,math,compact){
  this.canvas=canvas;this.math=math;this.compact=compact;this.cols=48;this.rows=24;this.buffers=new Map();
  const gl=this.gl=canvas.getContext('webgl',{alpha:false,antialias:true,premultipliedAlpha:false});
  if(!gl)throw new Error('WebGL unavailable');
  this.peeling=Boolean(gl.getExtension('WEBGL_depth_texture'));this.targets=[];
  const vertex=`attribute vec3 aPosition;attribute vec2 aUV;attribute vec3 aNormal;
   uniform vec2 uViewport;uniform float uCamera;varying vec2 vUV;varying vec3 vPosition;varying vec3 vNormal;
   void main(){float w=(uCamera-aPosition.z)/uCamera;
   gl_Position=vec4(aPosition.x/(uViewport.x*.5),-.04*w-aPosition.y/(uViewport.y*.5),-aPosition.z/4000.*w,w);
   vUV=aUV;vPosition=aPosition;vNormal=aNormal;}`;
  const fragment=`precision highp float;
   uniform sampler2D uTexture;uniform sampler2D uOpaqueDepth;uniform sampler2D uPreviousDepth;
   uniform vec4 uPhotoRect;uniform vec2 uResolution;uniform float uSaturation;uniform float uCamera;uniform int uKind;uniform int uPeel;
   varying vec2 vUV;varying vec3 vPosition;varying vec3 vNormal;
   void main(){
    vec4 c=texture2D(uTexture,vUV);
    bool photo=vUV.x>uPhotoRect.x&&vUV.x<uPhotoRect.z&&vUV.y>uPhotoRect.y&&vUV.y<uPhotoRect.w;
    if(uKind!=2){if(c.a<.02)discard;if(uKind==0&&!photo)discard;if(uKind==1&&photo)discard;}
    if(uPeel>0){vec2 screen=gl_FragCoord.xy/uResolution;
     if(gl_FragCoord.z>=texture2D(uOpaqueDepth,screen).r-.0000002)discard;
     if(uPeel==2&&gl_FragCoord.z<=texture2D(uPreviousDepth,screen).r+.0000002)discard;}
    vec3 N=normalize(vNormal),V=normalize(vec3(0.,0.,uCamera)-vPosition);if(dot(N,V)<0.)N=-N;
    vec3 L=normalize(vec3(-550.,-650.,950.)-vPosition),H=normalize(L+V),R=reflect(-V,N);
    float diffuse=max(dot(N,L),0.),fresnel=pow(1.-max(dot(N,V),0.),4.);
    // Fixed broad studio softboxes sampled by reflection direction, not by UV.
    float box=exp(-pow((R.x+.34)/.24,2.))*exp(-pow((R.y+.2)/.85,4.));
    float fill=exp(-pow((R.x-.62)/.38,2.))*exp(-pow((R.y-.15)/.95,4.));
    float spec=pow(max(dot(N,H),0.),uKind==0?26.:44.);
    float gray=dot(c.rgb,vec3(.2126,.7152,.0722));
    vec3 base=uKind==0?mix(vec3(gray),c.rgb,uSaturation):c.rgb;
    vec3 colour;float alpha=1.;
    if(uKind==0){colour=base*(.9+.1*diffuse)+vec3(box*.065+fill*.025+spec*.025);}
    else if(uKind==1){colour=base*(.72+.28*diffuse)+vec3(box*.27+fill*.1+spec*.07+fresnel*.12);alpha=(.88+fresnel*.06)*c.a;}
    else{colour=vec3(.17)*(.65+.35*diffuse)+vec3(box*.32+fill*.14+spec*.16+fresnel*.15);}
    gl_FragColor=vec4(colour,alpha);
   }`;
  this.program=this.programFor(vertex,fragment);
  this.locations={};for(const name of ['aPosition','aUV','aNormal'])this.locations[name]=gl.getAttribLocation(this.program,name);
  this.uniforms={};for(const name of ['uViewport','uCamera','uTexture','uOpaqueDepth','uPreviousDepth','uPhotoRect','uResolution','uSaturation','uKind','uPeel'])this.uniforms[name]=gl.getUniformLocation(this.program,name);
  const compositeVertex='attribute vec2 aPosition;varying vec2 vUV;void main(){gl_Position=vec4(aPosition,0.,1.);vUV=(aPosition+1.)*.5;}';
  const compositeFragment='precision highp float;varying vec2 vUV;uniform sampler2D uScene;uniform sampler2D uFront;uniform sampler2D uBack;void main(){vec4 scene=texture2D(uScene,vUV),back=texture2D(uBack,vUV),front=texture2D(uFront,vUV);vec3 c=mix(scene.rgb,back.rgb,back.a);c=mix(c,front.rgb,front.a);gl_FragColor=vec4(c,1.);}';
  this.composite=this.programFor(compositeVertex,compositeFragment);this.quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const triangles=[];for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){const a=y*(this.cols+1)+x,b=a+this.cols+1;triangles.push(a,b,a+1,b,b+1,a+1);}
  this.indexCount=triangles.length;this.indices=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(triangles),gl.STATIC_DRAW);
 }
 programFor(vertex,fragment){const gl=this.gl,program=gl.createProgram();for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));return program;}
 texture(surface){const gl=this.gl,texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const option of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,option,gl.CLAMP_TO_EDGE);for(const option of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,option,gl.LINEAR);this.updateTexture(texture,surface);return texture;}
 updateTexture(texture,surface){const gl=this.gl;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,surface);}
 resize(layout){
  this.layout=layout;const gl=this.gl,dpr=Math.min(Math.max(devicePixelRatio||1,layout.compact?1.25:1.5),layout.compact?1.5:2),width=Math.round(layout.width*dpr),height=Math.round(layout.height*dpr);
  this.canvas.width=width;this.canvas.height=height;
  for(const t of this.targets){gl.deleteFramebuffer(t.fbo);gl.deleteTexture(t.colour);gl.deleteTexture(t.depth);}this.targets=[];
  if(!this.peeling)return;
  for(let i=0;i<3;i++){
   const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
   const colour=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,colour);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
   for(const option of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,option,gl.NEAREST);for(const option of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,option,gl.CLAMP_TO_EDGE);
   gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,colour,0);
   const depth=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,depth);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT,width,height,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
   for(const option of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,option,gl.NEAREST);for(const option of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,option,gl.CLAMP_TO_EDGE);
   gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depth,0);
   if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Film depth target unavailable');this.targets.push({fbo,colour,depth});
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }
 makeFrame(tile,state){
  const {math,layout,cols,rows}=this,n=(cols+1)*(rows+1),gl=this.gl;let buffers=this.buffers.get(tile);
  if(!buffers){buffers={surface:gl.createBuffer(),edges:gl.createBuffer(),vertices:new Float32Array(n*8),grid:new Float32Array(n*2),gridZ:new Float32Array(n)};this.buffers.set(tile,buffers);}
  const {vertices,grid,gridZ}=buffers;
  for(let x=0;x<=cols;x++){
   const section=math.section(tile,x/cols,layout,state),c=section.centre,b=section.vertical;
   for(let y=0;y<=rows;y++){
    const v=y/rows,r=(v-.5)*layout.filmHeight,i=y*(cols+1)+x,o=i*8;
    const px=c[0]+r*b[0],py=c[1]+r*b[1];let pz=c[2]+r*b[2];
    for(const lift of section.lifts)pz+=section.scale*lift.amount*14*lift.spot*Math.exp(-((v-lift.h.v)**2)/.2);
    const k=layout.camera/(layout.camera-pz);vertices[o]=px;vertices[o+1]=py;vertices[o+2]=pz;vertices[o+3]=x/cols;vertices[o+4]=v;
    grid[i*2]=layout.width/2+px*k;grid[i*2+1]=layout.height*.52+py*k;gridZ[i]=pz;
   }
  }
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
   const i=y*(cols+1)+x,o=i*8,a=(y*(cols+1)+Math.max(0,x-1))*8,b=(y*(cols+1)+Math.min(cols,x+1))*8,c=(Math.max(0,y-1)*(cols+1)+x)*8,d=(Math.min(rows,y+1)*(cols+1)+x)*8;
   const ux=vertices[b]-vertices[a],uy=vertices[b+1]-vertices[a+1],uz=vertices[b+2]-vertices[a+2],vx=vertices[d]-vertices[c],vy=vertices[d+1]-vertices[c+1],vz=vertices[d+2]-vertices[c+2];
   const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,length=Math.hypot(nx,ny,nz)||1;vertices[o+5]=nx/length;vertices[o+6]=ny/length;vertices[o+7]=nz/length;
  }
  const polygon=[];for(let x=0;x<=cols;x++)polygon.push({x:grid[x*2],y:grid[x*2+1]});for(let x=cols;x>=0;x--){const i=rows*(cols+1)+x;polygon.push({x:grid[i*2],y:grid[i*2+1]});}
  const centre=math.project(math.surface(tile,.5,.5,layout,state),layout),samples=[],normals=[];
  for(const y of [0,rows/2,rows])for(const x of [0,cols/2,cols]){const i=y*(cols+1)+x,o=i*8;samples.push([grid[i*2],grid[i*2+1],gridZ[i]].map(n=>+n.toFixed(2)));normals.push([vertices[o+5],vertices[o+6],vertices[o+7]].map(n=>+n.toFixed(4)));}
  const edges=this.edgeWalls(vertices,buffers);
  gl.bindBuffer(gl.ARRAY_BUFFER,buffers.surface);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,buffers.edges);gl.bufferData(gl.ARRAY_BUFFER,edges,gl.DYNAMIC_DRAW);
  return {tile,centre,grid,gridZ,polygon,samples,normals,buffers,edgeCount:edges.length/8};
 }
 buildEdgeTopology(){
  const {cols,rows,math}=this,nodes=[],pairs=[];
  const loop=(uvs,hole)=>{
   const start=nodes.length;
   for(const [u,v] of uvs){const x=Math.min(cols-1,Math.floor(u*cols)),y=Math.min(rows-1,Math.floor(v*rows)),fx=u*cols-x,fy=v*rows-y;nodes.push({u,v,indices:[(y*(cols+1)+x)*8,(y*(cols+1)+x+1)*8,((y+1)*(cols+1)+x)*8,((y+1)*(cols+1)+x+1)*8],weights:[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy]});}
   for(let i=0;i<uvs.length;i++)pairs.push([start+i,start+(i+1)%uvs.length,hole?-1:1]);
  };
  const outer=[];for(let x=0;x<cols;x++)outer.push([x/cols,0]);for(let y=0;y<rows;y++)outer.push([1,y/rows]);for(let x=cols;x>0;x--)outer.push([x/cols,1]);for(let y=rows;y>0;y--)outer.push([0,y/rows]);loop(outer,false);
  for(const h of math.holes()){const points=[];for(const [cx,cy,start] of [[h.x+h.w-h.r,h.y+h.r,-Math.PI/2],[h.x+h.w-h.r,h.y+h.h-h.r,0],[h.x+h.r,h.y+h.h-h.r,Math.PI/2],[h.x+h.r,h.y+h.r,Math.PI]])for(let j=0;j<=3;j++){const a=start+j/3*Math.PI/2;points.push([(cx+h.r*Math.cos(a))/1024,(cy+h.r*Math.sin(a))/800]);}loop(points,true);}
  this.edgeTopology={nodes,pairs};
 }
 edgeWalls(vertices,buffers){
  if(!this.edgeTopology)this.buildEdgeTopology();const {nodes,pairs}=this.edgeTopology;
  if(!buffers.edgeData){buffers.edgeData=new Float32Array(pairs.length*6*8);buffers.edgePoints=new Float32Array(nodes.length*6);}
  const data=buffers.edgeData,points=buffers.edgePoints;
  for(let i=0;i<nodes.length;i++){
   const node=nodes[i],o=i*6;for(let k=0;k<6;k++){let sum=0;const field=k<3?k:k+2;for(let j=0;j<4;j++)sum+=vertices[node.indices[j]+field]*node.weights[j];points[o+k]=sum;}
  }
  let cursor=0;const order=[0,0,1,1,0,1],sides=[1,-1,1,1,-1,-1];
  for(const pair of pairs){
   const ai=pair[0]*6,bi=pair[1]*6,tx=points[bi]-points[ai],ty=points[bi+1]-points[ai+1],tz=points[bi+2]-points[ai+2];
   let nx=ty*points[ai+5]-tz*points[ai+4],ny=tz*points[ai+3]-tx*points[ai+5],nz=tx*points[ai+4]-ty*points[ai+3];const length=(Math.hypot(nx,ny,nz)||1)*pair[2];nx/=length;ny/=length;nz/=length;
   for(let i=0;i<6;i++){const nodeIndex=pair[order[i]],o=nodeIndex*6,side=sides[i]*.55;data[cursor++]=points[o]+points[o+3]*side;data[cursor++]=points[o+1]+points[o+4]*side;data[cursor++]=points[o+2]+points[o+5]*side;data[cursor++]=nodes[nodeIndex].u;data[cursor++]=nodes[nodeIndex].v;data[cursor++]=nx;data[cursor++]=ny;data[cursor++]=nz;}
  }
  return data;
 }
 bindGeometry(buffer){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(const [name,size,offset] of [['aPosition',3,0],['aUV',2,12],['aNormal',3,20]]){const loc=this.locations[name];gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset);}}
 draw(frames,kind){const gl=this.gl,u=this.uniforms;gl.uniform1i(u.uKind,kind);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indices);for(const frame of frames){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,frame.texture);gl.uniform4fv(u.uPhotoRect,frame.rect);gl.uniform1f(u.uSaturation,frame.saturation);this.bindGeometry(kind===2?frame.buffers.edges:frame.buffers.surface);if(kind===2)gl.drawArrays(gl.TRIANGLES,0,frame.edgeCount);else gl.drawElements(gl.TRIANGLES,this.indexCount,gl.UNSIGNED_SHORT,0);}}
 render(frames){
  const gl=this.gl,u=this.uniforms,{layout}=this;gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.useProgram(this.program);gl.enable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.depthMask(true);gl.depthFunc(gl.LESS);
  gl.uniform2f(u.uViewport,layout.width,layout.height);gl.uniform2f(u.uResolution,this.canvas.width,this.canvas.height);gl.uniform1f(u.uCamera,layout.camera);gl.uniform1i(u.uTexture,0);gl.uniform1i(u.uOpaqueDepth,1);gl.uniform1i(u.uPreviousDepth,2);gl.uniform1i(u.uPeel,0);
  for(const unit of [1,2]){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,null);}
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.peeling?this.targets[0].fbo:null);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);this.draw(frames,0);this.draw(frames,2);
  if(this.peeling){
   for(let layer=1;layer<=2;layer++){gl.bindFramebuffer(gl.FRAMEBUFFER,this.targets[layer].fbo);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1i(u.uPeel,layer);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.targets[0].depth);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,layer===2?this.targets[1].depth:null);this.draw(frames,1);}
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.DEPTH_TEST);gl.useProgram(this.composite);gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);const a=gl.getAttribLocation(this.composite,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
   for(const [unit,name,target] of [[0,'uScene',0],[1,'uFront',1],[2,'uBack',2]]){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,this.targets[target].colour);gl.uniform1i(gl.getUniformLocation(this.composite,name),unit);}gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }else{gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);this.draw([...frames].sort((a,b)=>a.centre.z-b.centre.z),1);gl.depthMask(true);}
  for(const [tile,buffers] of this.buffers)if(!frames.some(frame=>frame.tile===tile)){gl.deleteBuffer(buffers.surface);gl.deleteBuffer(buffers.edges);this.buffers.delete(tile);}
 }
};
