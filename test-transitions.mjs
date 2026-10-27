import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {projectFrames} from './site-data.mjs';
const code=await readFile(new URL('./portfolio-motion.js',import.meta.url),'utf8');
const mediaCode=await readFile(new URL('./project-image-ready.js',import.meta.url),'utf8');
const until=async predicate=>{for(let i=0;i<1000&&!predicate();i++)await new Promise(setImmediate);assert.ok(predicate(),'Expected readiness stage was not reached');};
function harness(reduced=false,start='http://test/en/#projects',readyBeforeLoad=false){
 const logs=[],handlers={},frames=[],historyEntries=[];let mode='ok',clock=0,releaseDecode=null,releasePaint=null;
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.style={opacity:'',setProperty(k,v){this[k]=v;}};this.dataset={};this.attrs={};this.inert=false;this.children=[];this.listeners={};this.classes=new Set();this.classList={add:(c)=>this.classes.add(c),remove:(c)=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c),contains:c=>this.classes.has(c)};}
  setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}hasAttribute(k){return k in this.attrs;}
  addEventListener(k,fn){this.listeners[k]=fn;}removeEventListener(k){delete this.listeners[k];}
  append(e){this.children.push(e);e.parentNode=this;if(e.tagName==='IFRAME'){frames.push(e);const doc=makeDoc(e.src,mode);e.contentDocument=doc;e.contentWindow=doc.win;doc.win.frameElement=e;setImmediate(()=>readyBeforeLoad?ctx.PortfolioTransitions.documentReady(doc,doc.win):e.listeners.load?.());}}
  remove(){this.removed=true;if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(e=>e!==this);}
  animate(keyframes,options){logs.push({type:'animation',tag:this.tagName,keyframes,options});return {cancel(){},finish(){},finished:Promise.resolve()};}
  focus(){this.focused=true;}getBoundingClientRect(){return {left:40,top:420,width:1200,height:720};}
  getContext(){return {drawImage:()=>logs.push({type:'raster'})};}
 }
 function makeDoc(url,setting){
  const doc={body:new Element('body'),head:new Element('head'),documentElement:new Element('html'),title:url.includes('/work/')?'Project':'Portfolio',fonts:{ready:readyBeforeLoad?new Promise(()=>{}):Promise.resolve()},addEventListener(){},getElementById(){return new Element();}};
  const main=new Element('main'),heading=new Element('h1'),hero=new Element('img');hero.complete=setting!=='image-error';hero.naturalWidth=1200;hero.naturalHeight=720;hero.decode=async()=>{logs.push({type:'decode-start',url,complete:hero.complete});if(setting==='image-error')throw Error('image failed');if(mode==='slow-decode')await new Promise(resolve=>{releaseDecode=resolve;});hero.complete=true;logs.push({type:'decoded',url});};doc.hero=hero;
  const gallery=url.includes('photography')?new Element('section'):null;if(gallery)gallery.dataset=setting==='photo-error'?{mediaError:'true'}:{mediaReady:'true'};
  const win={scrollY:1234,innerWidth:1280,location:new URL(url),scrollTo({top}){this.scrollY=top;},dispatchEvent(e){logs.push({type:e.type,url});}};
  if(setting!=='404')win.PortfolioPage={capture:()=>({y:win.scrollY,width:1280,phase:.73,selected:1}),restore:s=>{win.scrollY=s.y;logs.push({type:'restore',y:s.y,url});}};
  doc.win=win;doc.body.children=[main];doc.documentElement.lang='en';doc.querySelector=selector=>selector==='main'?main:selector==='[data-photo-diary]'?gallery:selector==='meta[name="description"]'?{content:'description',setAttribute(){}}:selector.includes('portfolio-page img')?(url.includes('/work/')?hero:null):selector.includes('portfolio-heading h1')?heading:selector==='.motion-status'?(doc.body.children.find(e=>e.className==='motion-status')||null):main;
  doc.querySelectorAll=selector=>selector==='iframe'?frames:selector.includes('h1')?[heading]:[main];return doc;
 }
 const doc=makeDoc(start,'ok'),ctx={document:doc,URL,Event,Promise,Map,WeakMap,Error,Boolean,Date,Math,Number,JSON,console,performance:{mark(){}},innerWidth:1280,devicePixelRatio:1,matchMedia:()=>({matches:reduced}),setTimeout:(fn,ms)=>{const t=setTimeout(fn,ms);t.unref();return t;},clearTimeout,setInterval,clearInterval,requestAnimationFrame:fn=>setImmediate(()=>fn(clock+=16.7)),addEventListener:(k,fn)=>{handlers[k]=fn;},fetch:()=>Promise.reject(Error('not needed')),sessionStorage:{getItem:()=>null}};
 ctx.Image=class extends Element{constructor(){super('img');this.complete=false;this.naturalWidth=0;}};
 ctx.window=ctx;ctx.parent=ctx;ctx.location=new URL(start);ctx.scrollY=1234;ctx.PortfolioPage=doc.win.PortfolioPage;ctx.dispatchEvent=()=>{};ctx.history={state:null,replaceState(s,_,url){this.state=s;ctx.location=new URL(url);historyEntries[0]={s,url};},pushState(s,_,url){this.state=s;ctx.location=new URL(url);historyEntries.push({s,url});}};
 ctx.PortfolioCoverTransition=args=>{logs.push({type:'cover',next:args.next,surface:args.targetSurface});return {canvas:new Element('div'),draw:t=>logs.push({type:'draw',t}),remove:()=>logs.push({type:'removed-cover'})};};
 doc.createElement=tag=>new Element(tag);vm.createContext(ctx);vm.runInContext(mediaCode,ctx);
 const painted=ctx.PortfolioProjectImage.painted;
 ctx.PortfolioProjectImage.painted=async(...args)=>{logs.push({type:'paint-start'});if(mode==='slow-paint')await new Promise(resolve=>{releasePaint=resolve;});if(mode==='paint-error')throw Error('paint failed');await painted(...args);logs.push({type:'paint-ready'});};
 vm.runInContext(code,ctx);
 return {ctx,doc,logs,frames,historyEntries,set mode(v){mode=v;},get decodePending(){return Boolean(releaseDecode);},get paintPending(){return Boolean(releasePaint);},releaseDecode(){const resolve=releaseDecode;releaseDecode=null;mode='ok';resolve();},releasePaint(){const resolve=releasePaint;releasePaint=null;mode='ok';resolve();},async back(index=0){const entry=historyEntries[index];ctx.location=new URL(entry.url);handlers.popstate({state:entry.s});await until(()=>!ctx.PortfolioTransitions.busy);}};
}
const early=harness(false,'http://test/en/#projects',true);
assert.equal(await early.ctx.PortfolioTransitions.navigate('http://test/en/work/care-meal/','cover'),true,'A mounted first screen can enter while window.load and noncritical fonts remain pending');
const central=early.ctx.PortfolioTransitions.preloadPhotograph('/assets/central.webp');
assert.equal(central,early.ctx.PortfolioTransitions.preloadPhotograph('/assets/central.webp'),'Intent, gallery document and texture preparation share one image download');
central.complete=true;
assert.notEqual(central,early.ctx.PortfolioTransitions.preloadPhotograph('/assets/central.webp'),'A failed photograph is replaced on retry');
for(const failure of ['404','image-error','photo-error']){
 const h=harness();h.mode=failure;const photo=failure==='photo-error',url=photo?'http://test/en/journal/photography/':'http://test/en/work/cobreath/';
 assert.equal(await h.ctx.PortfolioTransitions.navigate(url,photo?'photo':'cover'),false,failure);
 assert.equal(h.ctx.PortfolioTransitions.busy,false);assert.equal(h.doc.documentElement.classList.contains('motion-native-hidden'),false);assert.equal(h.historyEntries.length,1);assert.equal(h.frames.at(-1).removed,true);
 assert.equal(h.logs.filter(e=>e.type==='animation').length,0,'Keep the current page visible until media is ready');
 h.mode='ok';assert.equal(await h.ctx.PortfolioTransitions.navigate(url,photo?'photo':'cover'),true,'Retry must recover');
}
const h=harness();const first=h.ctx.PortfolioTransitions.navigate('http://test/en/work/cobreath/','cover');assert.equal(await h.ctx.PortfolioTransitions.navigate('http://test/en/work/dotheal/','next'),false,'Ignore repeated clicks during navigation');assert.equal(await first,true);
assert.equal(h.logs.filter(e=>e.type==='removed-cover').length,1);assert.ok(h.logs.some(e=>e.type==='draw'&&e.t===1));
assert.equal(await h.ctx.PortfolioTransitions.navigate('http://test/en/work/dotheal/','next'),true);assert.ok(h.logs.some(e=>e.type==='cover'&&e.next));
await h.back();assert.equal(h.doc.documentElement.classList.contains('motion-native-hidden'),false);assert.equal(h.doc.title,'Portfolio');assert.ok(h.logs.some(e=>e.type==='restore'&&e.y===1234));assert.equal(h.historyEntries.length,3,'Back must not add a history entry');
const r=harness(true);assert.equal(await r.ctx.PortfolioTransitions.navigate('http://test/en/work/cobreath/','cover'),true);assert.equal(r.logs.filter(e=>e.type==='cover').length,0,'Reduced motion uses a short fade');
const j=harness(false,'http://test/en/journal/');await j.ctx.PortfolioTransitions.navigate('http://test/en/journal/photography/','photo');await j.ctx.PortfolioTransitions.navigate('http://test/en/#journal','photo-back');assert.equal(j.ctx.location.pathname,'/en/journal/','Return to the actual Journal entry, including standalone pages');assert.equal(j.doc.documentElement.classList.contains('motion-native-hidden'),false);
for(const lang of ['zh','en'])for(const project of projectFrames){
 const url=`http://test/${lang}/work/${project.slug}/`,start=`http://test/${lang}/#projects`;
 const cached=harness(false,start);
 assert.equal(await cached.ctx.PortfolioTransitions.navigate(url,'cover'),true);
 const firstCover=cached.logs.findIndex(l=>l.type==='cover'),firstDecode=cached.logs.findIndex(l=>l.type==='decoded'),raster=cached.logs.findIndex(l=>l.type==='raster');
 assert.ok(firstDecode<raster&&raster<firstCover,`${project.slug}: decode and drawable pixels precede any departing animation`);
 assert.ok(firstCover<cached.logs.findIndex(l=>l.type==='animation'),'The holding cover must exist before either page starts fading');
 assert.ok(cached.logs[firstCover].surface,`${project.slug}: texture uses a prepared surface`);
 assert.ok(cached.logs.findIndex(l=>l.type==='paint-ready')<cached.logs.findIndex(l=>l.type==='removed-cover'));
 await cached.back();
 const before=cached.logs.filter(l=>l.type==='decode-start').length;
 cached.mode='slow-decode';const second=cached.ctx.PortfolioTransitions.navigate(url,'cover');await until(()=>cached.decodePending);
 assert.equal(cached.frames.length,1,'A cached mounted page is reused');
 assert.equal(cached.logs.filter(l=>l.type==='decode-start').length,before+1,'Cached complete images must still await decode');
 assert.equal(cached.logs.filter(l=>l.type==='cover').length,1,'No second transition begins before cached decode completes');
 cached.releaseDecode();assert.equal(await second,true);
 const slow=harness(false,start);slow.mode='slow-decode';const cold=slow.ctx.PortfolioTransitions.navigate(url,'cover');await until(()=>slow.decodePending);
 assert.equal(slow.logs.filter(l=>l.type==='animation').length,0,'During a delayed image load the original cover/page stays visible');
 assert.equal(slow.doc.documentElement.classList.contains('motion-native-hidden'),false);
 slow.releaseDecode();assert.equal(await cold,true);
 const paint=harness(false,start);paint.mode='slow-paint';const pending=paint.ctx.PortfolioTransitions.navigate(url,'cover');await until(()=>paint.paintPending);
 assert.ok(paint.logs.some(l=>l.type==='draw'&&l.t===1),'The enlarged cover holds at its target');
 assert.equal(paint.logs.filter(l=>l.type==='removed-cover').length,0,'Do not remove the enlarged cover while image paint is pending');
 assert.equal(paint.frames[0].contentDocument.hero.style.opacity,'','The real first image is visible underneath the holding cover');
 paint.releasePaint();assert.equal(await pending,true);
 const failed=harness(false,start);failed.mode='paint-error';assert.equal(await failed.ctx.PortfolioTransitions.navigate(url,'cover'),false);
 assert.equal(failed.doc.documentElement.classList.contains('motion-native-hidden'),false,'A paint failure restores the original cover');
 const status=failed.doc.body.children.find(e=>e.className==='motion-status');assert.ok(status?.children[1]?.listeners.click,'A real retry button is provided');
 failed.mode='ok';assert.equal(await status.children[1].listeners.click(),true,'Retry must create a healthy destination after a paint failure');
 assert.equal(failed.frames[0].removed,true,'The failed destination is discarded rather than cached');
}
for(const lang of ['zh','en'])for(const project of projectFrames){
 const html=await readFile(new URL(`./cloudflare-pages/${lang}/work/${project.slug}/index.html`,import.meta.url),'utf8');
 const first=html.match(/<figure class="portfolio-page"[^]*?<img [^>]+>/)[0];
 assert.match(first,/loading="eager"/);assert.match(first,/fetchpriority="high"/);
 assert.ok(!first.includes('loading="lazy"'));
 assert.match(html, /src="\/static\/core-[a-f0-9]+\.js" defer/);
 const later=[...html.matchAll(/<figure class="portfolio-page"[^]*?<img [^>]+>/g)].slice(1);
 later.forEach(match=>assert.match(match[0], /data-src="\/assets\//));
 assert.ok(!html.includes('preload="metadata"'));
 assert.ok(!/<source[^>]+(?<!data-)src=/.test(html));
}
console.log('PASS: all six projects in both languages: initial/cached entries, delayed decode, delayed paint, retained cover, failure retry, eager first images; plus next, history, gallery and reduced motion.');
