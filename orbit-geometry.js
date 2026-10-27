/* Shared dimensions keep the ring, curved surfaces and CSS fallback in step. */
window.PortfolioOrbitGeometry={
 measure(width){const referenceWidth=Math.max(260,Math.min(width*.28,520)),cardWidth=referenceWidth*.88;return {width,referenceWidth,centerOffset:(referenceWidth-cardWidth)*.02,cardWidth,cardHeight:cardWidth/1.6,radius:width*.32+(referenceWidth-cardWidth)*.1866,camera:Math.max(1600,width*1.85),curveRadius:cardWidth*1.25};},
 visibility(angle){const t=Math.max(0,Math.min(1,(Math.abs(angle)-1.45)/.37));return 1-t*t*(3-2*t);},
 poses(layout,phase,count){const {radius}=layout,pitch=-8*Math.PI/180,tilt=-12*Math.PI/180,frontY=-Math.sin(pitch)*radius*Math.cos(tilt),frontX=Math.sin(pitch)*radius*Math.sin(tilt);return Array.from({length:count},(_,i)=>{const angle=(phase-i)*2*Math.PI/count,s=Math.sin(angle),c=Math.cos(angle),baseX=s*radius,baseY=-Math.sin(pitch)*c*radius;return {index:i,angle,x:baseX*Math.cos(tilt)-baseY*Math.sin(tilt)-frontX+(layout.centerOffset||0),y:baseX*Math.sin(tilt)+baseY*Math.cos(tilt)-frontY,z:c*radius*Math.cos(pitch)};});}
};
