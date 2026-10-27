import React, {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import Folder from './Folder';
import './Folder.css';
import ContactFooter from './ContactFooter';
import FoldText from './FoldText';

function PhotographyFolder({host,items}){
 const [open,setOpen]=useState(false),[size,setSize]=useState(1),touch=useRef(false);
 useEffect(()=>{const resize=()=>setSize(matchMedia('(max-width:760px)').matches?Math.min(.72,Math.max(.38,(host.clientWidth-28)/(224*2.35))):Math.min(1.25,Math.max(.7,(host.clientWidth-24)/(224*2.45))));resize();const observer=new ResizeObserver(resize);observer.observe(host);return()=>observer.disconnect();},[host]);
 const update=next=>{if(!next&&!touch.current&&host.matches(':hover'))return;setOpen(next);};
 const enterGallery=()=>host.ownerDocument.querySelector('[data-photography-entry]')?.click();
 const activate=e=>{
  if(!e.target.closest('.folder-stage'))return;
  if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;
  if(e.type==='click'&&(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey))return;
  // Capture before Folder consumes photo clicks or treats the front as a toggle.
  e.preventDefault();e.stopPropagation();
  if(e.type==='click'&&(touch.current||matchMedia('(hover:none)').matches)&&!open){setOpen(true);return;}
  enterGallery();
 };
 return <div className="journal-folder-hover" onPointerEnter={e=>{if(e.pointerType==='touch')return;touch.current=false;setOpen(true);}} onPointerLeave={e=>{if(e.pointerType!=='touch')setOpen(false);}} onPointerDownCapture={e=>{touch.current=e.pointerType==='touch';}} onClickCapture={activate} onKeyDownCapture={activate}>
  <Folder label="Photography" items={items} mode="flap" variant="solid" layout="spread" color="#3d8bff" theme="light" openOn="hover" open={open} onOpenChange={update} peek={true} tilt={.5} bounce={.4} draggable={false} zoomOnClick={false} intro={false} size={size} onItemClick={enterGallery} />
 </div>;
}
async function mount(){
 await document.fonts.ready;
 const section=document.querySelector('[data-journal-motion]'),contact=document.querySelector('[data-contact-shuffle]');if(!section&&!contact)return;
 const titles=section?.querySelectorAll('[data-split-text],[data-photography-word]')||[],host=section?.querySelector('[data-folder-host]');
 let played=false;try{played=sessionStorage.getItem('yuanlan-journal-fold-played-v2')==='1';}catch{}
 flushSync(()=>{
  titles.forEach(title=>{const text=title.textContent;createRoot(title).render(<FoldText text={text} foldStyle="paper" splitBy="char" hinge="top" trigger="scroll" foldAngle={92} duration={.65} stagger={.045} staggerFrom="start" ease="power3.out" perspective={700} creaseShading={.55} hoverRefold refoldRadius={140} refoldAngle={45} initiallyVisible={played}/>);});
  if(host)createRoot(host).render(<PhotographyFolder host={host} items={JSON.parse(host.dataset.items)}/>);
 });
 if(contact)createRoot(contact).render(<ContactFooter/>);
 if(section){window.PortfolioJournalComponentsReady=true;document.dispatchEvent(new Event('journal:components-ready'));}
}
mount().catch(error=>{console.warn('Journal keeps its regular text and photography link.',error);document.documentElement.classList.remove('journal-intro-pending');});
