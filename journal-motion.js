(()=>{
 const section=document.querySelector('[data-journal-motion]');if(!section)return;
 const key='yuanlan-journal-fold-played-v2',reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const read=()=>{try{return sessionStorage.getItem(key)==='1';}catch{return false;}};
 const title=section.querySelector('.journal-title')||section;
 let started=read(),observer=null,animations=[],resizeFrame=0;
 const visible=()=>{document.documentElement.classList.remove('journal-intro-pending');section.classList.add('journal-revealed');};
 const canReveal=()=>!document.documentElement.classList.contains('motion-native-hidden')&&window.frameElement?.style.visibility!=='hidden'&&window.frameElement?.style.display!=='none';
 const finish=()=>{if(!started)return;animations.forEach(a=>{try{a.finish();}catch{a.cancel();}});section.dispatchEvent(new Event('journal:settle'));visible();};
 window.PortfolioJournal={finish};
 const copy=new WeakMap();
 function prepareLines(){
  if(!document.createRange)return;
  section.querySelectorAll('.journal-statement>p,.journal-entry-copy>p').forEach(p=>{
   const text=copy.get(p)||p.textContent;copy.set(p,text);
   const node=document.createTextNode(text);p.replaceChildren(node);
   const range=document.createRange(),lines=[];let offset=0,top=null;
   for(const char of text){
    range.setStart(node,offset);offset+=char.length;range.setEnd(node,offset);
    const rect=range.getBoundingClientRect();
    if(rect.height&&char.trim()&&(top===null||Math.abs(rect.top-top)>2)){lines.push('');top=rect.top;}
    if(!lines.length)lines.push('');lines[lines.length-1]+=char;
   }
   p.replaceChildren(...lines.map(line=>{const span=document.createElement('span');span.className='journal-copy-line';span.textContent=line;return span;}));p.setAttribute('aria-label',text);
  });
 }
 function start(){
  if(started){visible();return;}started=true;try{sessionStorage.setItem(key,'1');}catch{}
  section.dataset.journalPlayed='true';visible();observer?.disconnect();
  if(reduced.matches){animations.push(section.animate([{opacity:0},{opacity:1}],{duration:140,fill:'both'}));return;}
  const animate=(el,delay,duration=750)=>{if(!el)return;animations.push(el.animate([{opacity:0,transform:'translateY(40px) scale(.92)'},{opacity:1,transform:'translateY(-3px) scale(1.015)',offset:.78},{opacity:1,transform:'none'}],{duration,delay,easing:'cubic-bezier(.2,.8,.25,1)',fill:'both'}));};
  animate(section.querySelector('.journal-folder-enter'),160,850);
  section.querySelectorAll('.journal-copy-line').forEach((el,i)=>animations.push(el.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:580,delay:340+i*75,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'})));
  const entry=section.querySelector('.journal-entry-copy');if(entry)animations.push(entry.animate([{opacity:0},{opacity:1}],{duration:450,delay:380,fill:'both'}));
  animate(section.querySelector('.journal-chapter-kicker'),40,550);
 }
 function observe(){
  window.PortfolioJournalReady=true;prepareLines();if(started){visible();return;}
  observer?.disconnect();observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&canReveal())start();},{rootMargin:'0px 0px -20% 0px',threshold:0});observer.observe(title);
 }
 if(window.PortfolioJournalComponentsReady)observe();else document.addEventListener('journal:components-ready',observe,{once:true});
 addEventListener('portfolio:suspend',finish);
 addEventListener('portfolio:resume',()=>{if(read()){started=true;finish();}else{const r=title.getBoundingClientRect();if(canReveal()&&r.top<innerHeight*.8&&r.bottom>0)start();}});
 addEventListener('pageshow',e=>{if(e.persisted&&read()){started=true;finish();}});
 addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(started)finish();prepareLines();});});
 setTimeout(()=>{if(!window.PortfolioJournalReady){visible();observe();}},3000);
})();
