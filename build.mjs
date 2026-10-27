import {renderPage} from './page-template.mjs';
import {photographs} from './photography-data.mjs';
import {contactFooter} from './contact.mjs';
import {journalSection,photographyPage} from './photography.mjs';
import {stories} from './project-stories.mjs';
import {projectPlaceholder,aboutSection} from './stages.mjs';
import {projectFrames} from './site-data.mjs';
import { mkdir, writeFile, copyFile, readFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { profile, projects } from './content.mjs';
import {header,home,noteTopics,notePage,scentDetail} from './sections.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const outputName = process.env.SITE_OUTPUT_DIR || 'dist';
if (!['dist', 'cloudflare-pages.staging'].includes(outputName)) throw new Error('Unsupported generated output directory');
const dist = path.join(root, outputName);
const assets = JSON.parse(await readFile(path.join(root,'.build-assets','manifest.json'),'utf8'));
const criticalStyles = await readFile(path.join(root,'.build-assets',assets.styles.slice(1)),'utf8');
const inlinePhotography = await readFile(path.join(root,'.build-assets',assets.photography.slice(1)),'utf8');
const heroLayout = JSON.parse(await readFile(path.join(root, 'hero-layout.json'), 'utf8'));
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tx = (v, lang) => esc(Array.isArray(v) ? v[lang === 'zh' ? 0 : 1] : v);
const label = (zh,en,lang) => tx([zh,en],lang);
const lines = (zh,en,lang) => label(zh,en,lang).replaceAll('&lt;br&gt;', '<br>');
const href = (lang, route = '') => `/${lang}/${route ? route+'/' : ''}`;
const name = (p,l) => tx(p.name,l);

function img(asset, alt, { cls='', eager=false, sizes='(max-width: 700px) 100vw, 90vw' }={}) {
  return `<img class="${cls}" src="/assets/${asset}-1280.webp" srcset="/assets/${asset}-640.webp 640w, /assets/${asset}-1280.webp 1280w, /assets/${asset}-1920.webp 1920w" sizes="${sizes}" alt="${alt}" loading="${eager?'eager':'lazy'}" ${eager?'fetchpriority="high"':''} decoding="async">`;
}
const flower = `<svg viewBox="0 0 120 120" aria-hidden="true" class="flower"><circle cx="60" cy="60" r="48"/><ellipse cx="60" cy="60" rx="24" ry="48"/><ellipse cx="60" cy="60" rx="48" ry="17"/><path d="M12 60h96M60 12v96"/></svg>`;

function legacyHeader(l, route) {
  const other = l==='zh'?'en':'zh';
  return `<a class="skip" href="#main">${label('跳至内容','Skip to content',l)}</a>
  <header class="site-header"><a class="wordmark" href="${href(l)}" aria-label="${label('黄塬岚 · 首页','Yuanlan Huang · Home',l)}">YUANLAN HUANG<span class="wordmark-dot">/26</span></a>
    <span class="header-caption">${label('产品、交互与设计研究','PRODUCT, INTERACTION & RESEARCH',l)}</span>
    <nav class="desktop-nav" aria-label="${label('主导航','Main navigation',l)}">
      <a ${route==='work'?'aria-current="page"':''} href="${href(l,'work')}">${label('作品','Work',l)}<sup>04</sup></a>
      <a ${route==='about'?'aria-current="page"':''} href="${href(l,'about')}">${label('关于','About',l)}</a>
      <a href="#contact">${label('联系','Contact',l)} ↗</a>
    </nav>
    <div class="header-actions"><a class="language" lang="${other}" hreflang="${other}" href="${href(other,route)}" aria-label="${l==='zh'?'Switch to English':'切换为中文'}">${l==='zh'?'EN':'中文'}</a><a class="cv-link" href="/assets/yuanlan-huang-cv-${l}.pdf" download>CV ↓</a><button class="menu-button" aria-expanded="false" aria-controls="mobile-nav" aria-label="${label('展开导航','Open menu',l)}">☰</button></div>
    <nav id="mobile-nav" class="mobile-nav" hidden aria-label="${label('手机导航','Mobile navigation',l)}"><a href="${href(l,'work')}">${label('设计作品','Selected work',l)} <span>04</span></a><a href="${href(l,'about')}">${label('关于我','About me',l)} ↗</a><a href="#contact">${label('联系我','Get in touch',l)} ↗</a></nav>
  </header>`;
}
function footer(l) { return contactFooter(l,profile.email); }
function card(p,l,i) {
  return `<article class="project-card project-${p.slug} reveal"><a class="project-link" href="${href(l,'work/'+p.slug)}" aria-label="${label('查看项目：','Explore: ',l)}${name(p,l)}"><div class="project-image" style="--project-color:${p.color}">${img(p.cover,tx(p.summary,l),{sizes:'(max-width: 700px) 100vw, 60vw'})}<span class="image-index">(${p.number})</span><span class="image-action" aria-hidden="true">↗</span></div><div class="project-meta"><h3>${name(p,l)}<span class="project-year">${p.year}</span></h3><p>${tx(p.tag,l)}</p></div><p class="project-description">${tx(p.summary,l)}</p></a></article>`;
}
function legacyHome(l) {
  return `<section class="collage-hero" aria-labelledby="hero-title">
    <h1 id="hero-title" class="sr-only">${label('黄塬岚 · 个人作品集','Yuanlan Huang · Personal Portfolio',l)}</h1>
    <div class="collage-board" role="group" aria-label="${label('我的生活与成长照片拼贴','A collage of my life and growing up',l)}">${heroLayout.layers.map(layer=>{
      const pct=(n,total)=>(n/total*100).toFixed(4)+'%';
      const dx=layer.x+layer.width/2<heroLayout.width/2?-15.56:15.56;
      const dy=layer.y+layer.height/2<heroLayout.height/2?-15.56:15.56;
      const style=`--x:${pct(layer.x,heroLayout.width)};--y:${pct(layer.y,heroLayout.height)};--w:${pct(layer.width,heroLayout.width)};--h:${pct(layer.height,heroLayout.height)};--layer-z:${layer.z};--dx:${dx}px;--dy:${dy}px;--hit:${layer.hit||'inset(0)'}`;
      const image=`<img src="/assets/hero/${layer.id}.webp" width="${layer.width}" height="${layer.height}" alt="" draggable="false" decoding="async" ${layer.id==='photo-01'?'fetchpriority="high"':''}>`;
      return layer.interactive?`<div class="collage-layer photo-slot" data-photo="${layer.id}" style="${style}"><div class="photo-visual" aria-hidden="true">${image}</div><div class="photo-hit" tabindex="0" role="img" aria-label="${tx(layer.alt,l)}"></div></div>`:`<div class="collage-layer collage-decor" aria-hidden="true" style="${style}">${image}</div>`;
    }).join('')}</div>
  </section>
  <section id="selected-work" class="work-section"><div class="section-heading"><div><span class="eyebrow">01 / ${label('想法，在这里成为现实','Ideas made tangible',l)}</span><h2>${label('精选作品','Selected work',l)}<sup>(04)</sup></h2></div><p>${label('从日常问题出发，\n在研究与制作之间寻找答案。','Everyday questions.\nExplored through research and making.',l).replaceAll('\n','<br>')}</p></div><div class="project-grid">${projects.map((p,i)=>card(p,l,i)).join('')}</div><a class="text-link" href="${href(l,'work')}">${label('浏览全部作品','Explore all projects',l)} ↗</a></section>
  <section class="home-about"><div class="about-marker"><span class="eyebrow">02 / ${label('设计背后的人','A person behind the work',l)}</span>${flower}<span class="scribble">a little about me</span></div><div><h2>${tx(profile.statement,l).replaceAll('\n','<br>')}</h2><p>${tx(profile.bio,l)}</p><a class="text-link" href="${href(l,'about')}">${label('更多关于我','A little more about me',l)} ↗</a></div></section>`;
}
function work(l) {
  const indexProjects=projectFrames.map((frame,i)=>{const original=projects.find(p=>p.slug===frame.slug)||{},story=stories.find(p=>p.slug===frame.slug);return {...original,...frame,number:String(i+1).padStart(2,'0'),year:original.year||'',color:original.color||'#e8eae6',summary:story.intro,tag:story.type};});
  return `<section class="page-intro"><div class="eyebrow">INDEX / 2025—2026</div><h1>${label('想法的形状。','Ideas,\nin the making.',l).replaceAll('\n','<br>')}</h1><div class="intro-bottom"><p>${label('产品、交互与服务。\n以研究理解问题，以制作探索可能。','Products, interactions, and services.\nResearch to understand. Making to explore.',l).replaceAll('\n','<br>')}</p><span class="index-total">${String(projectFrames.length).padStart(2,'0')} ${label('个精选项目','SELECTED PROJECTS',l)}</span></div></section><section class="work-section work-index"><h2 class="sr-only">${label('全部项目','All projects',l)}</h2><div class="project-grid">${indexProjects.map((p,i)=>card(p,l,i)).join('')}</div></section>`;
}
function about(l) {
  return `<section class="about-intro page-intro"><span class="eyebrow">ABOUT / ${tx(profile.name,l)}</span><h1>${label('好奇心，\n让我不断靠近。','Led by curiosity.\nGrounded in care.',l).replaceAll('\n','<br>')}</h1><div class="about-lede"><span class="about-signature">Yuanlan Huang ↗</span><p>${tx(profile.bio,l)}</p></div></section>
  <section class="about-feature"><figure>${img('cobreath-making',label('CoBreath 实体原型的电路、材料与制作细节','Electronics, materials, and making details of the CoBreath prototype',l))}<figcaption>${label('在制作中理解，在体验中提问。','Understanding through making. Questioning through experience.',l)}</figcaption></figure><div><span class="eyebrow">01 / ${label('我关注的方向','Current interests',l)}</span><h2>${label('从人的感受，\n走向设计的可能。','From human experience\nto design possibilities.',l).replaceAll('\n','<br>')}</h2>${profile.interests.map(r=>`<div class="interest"><span>${r[0]}</span><div><h3>${esc(r[l==='zh'?1:2])}</h3><p>${esc(r[l==='zh'?3:4])}</p></div></div>`).join('')}</div></section>
  <section class="about-record"><div><span class="eyebrow">02 / ${label('一路走来','Background',l)}</span><h2>${label('学习与实践','Learning & practice',l)}</h2></div><div class="record-list"><article><span>2023—${label('至今','present',l)}</span><h3>${label('重庆大学 · 产品设计','Chongqing University · Product Design',l)}</h3><p>${label('本科 / 艺术学院','Undergraduate / School of Arts',l)}</p></article><article><span>2025.09—2026.05</span><h3>${label('普拉斯 · 设计助理','PUSH · Design Assistant',l)}</h3><p>${label('四川省宜宾普拉斯包装材料有限公司。参与包装与产品创意研发，支持视觉调研、概念梳理、材料整理及设计文档准备。','Sichuan Yibin PUSH Packaging Materials Co., Ltd. Supported packaging and product concept development through visual research, concept synthesis, material organization, and design documentation.',l)}</p></article></div></section>
  <section class="about-record awards"><div><span class="eyebrow">03 / ${label('精选认可','Selected recognition',l)}</span><h2>${label('奖项与成果','Awards & outcomes',l)}</h2></div><ul class="award-list">${[
    ['第十七届国际用户体验创新大赛','17th International User Experience Innovation Competition','全国三等奖','National third prize'],
    ['第十届两岸新锐设计竞赛 · 华灿奖','10th Cross-Strait Emerging Design Competition · Huacan Award','赛区二等奖、三等奖','Regional second & third prizes'],
    ['香港新锐当代设计奖','Hong Kong Emerging Contemporary Design Award','铜奖 × 4','Bronze awards × 4'],
    ['国家励志奖学金','National Encouragement Scholarship','奖学金','Scholarship'],
    ['便携式中医手持揿针器','Portable handheld press-needle applicator','发明专利授权','Granted invention patent']
  ].map(r=>`<li><span>${esc(r[l==='zh'?0:1])}</span><span>${esc(r[l==='zh'?2:3])}</span></li>`).join('')}</ul></section>
  <section class="personal-line"><span class="eyebrow">OFF THE CLOCK</span><p>${label('也喜欢摄影、跳舞，\n和生活中没被安排的片刻。','Also here for photography, dance,\nand the unplanned moments in between.',l).replaceAll('\n','<br>')}</p>${flower}</section>`;
}
function project(p,l) {
  if(p.placeholder) return scentDetail(p,l);
  const ix=projects.indexOf(p),next=projects[(ix+1)%projects.length];
  return `<article class="case" data-project-slug="${p.slug}" style="--project-color:${p.color}"><header class="case-intro"><a class="text-link" href="/${l}/#projects" data-project-back>← ${label('返回 Projects','Back to Projects',l)}</a><div class="case-kicker"><span>${p.number} / ${tx(p.tag,l)}</span><span>${p.year}</span></div><h1>${name(p,l)}<span>↗</span></h1><p class="case-headline">${tx(p.headline,l)}</p></header><figure class="case-cover">${img(p.cover,tx(p.summary,l),{eager:true})}</figure>
  <section class="case-overview"><div><span class="eyebrow">AT A GLANCE</span><h2>${label('关于这个项目','About the project',l)}</h2><dl><div><dt>${label('时间','Timeline',l)}</dt><dd>${tx(p.date,l)}</dd></div><div><dt>${label('项目类型','Project type',l)}</dt><dd>${tx(p.scope,l)}</dd></div><div><dt>${p.contribution?label('个人贡献','My contribution',l):label('项目归属','Project credit',l)}</dt><dd>${tx(p.contribution||p.credit,l)}</dd></div></dl></div><div class="overview-copy"><p>${tx(p.overview,l)}</p><ul class="methods">${p.methods.map(m=>`<li>${tx(m,l)}</li>`).join('')}</ul></div></section>
  <nav class="case-nav" aria-label="${label('项目章节','Project chapters',l)}"><a href="#research">01 ${label('问题与研究','Research',l)}</a><a href="#decisions">02 ${label('设计决策','Decisions',l)}</a><a href="#prototype">03 ${label('原型与体验','Prototype',l)}</a><a href="#reflection">04 ${label('结果与反思','Reflection',l)}</a></nav>
  <section id="research" class="case-section"><span class="eyebrow">01 / ${label('问题与研究','Question & research',l)}</span><h2>${tx(p.question,l)}</h2><p class="case-body">${tx(p.research,l)}</p>${p.slug==='cobreath'?experiment(l):p.slug==='care-meal'?service(l):''}</section>
  <section id="decisions" class="case-section decisions"><span class="eyebrow">02 / ${label('关键设计决策','Key design decisions',l)}</span><h2>${label('从发现，到选择。','From insights to decisions.',l)}</h2><div class="decision-list">${p.decisions.map((d,i)=>`<div><span class="decision-number">0${i+1}</span><h3>${esc(d[l==='zh'?0:1])}</h3><p>${esc(d[l==='zh'?2:3])}</p></div>`).join('')}</div></section>
  <section id="prototype" class="case-section prototype"><span class="eyebrow">03 / ${label('原型与体验','Prototype & experience',l)}</span><h2>${label('让想法可以被体验。','An idea you can experience.',l)}</h2><div class="case-gallery">${p.media.map((m,i)=>`<figure class="gallery-${i}"><a href="/assets/${m[0]}-1920.webp" target="_blank" rel="noopener" aria-label="${label('打开大图：','Open full image: ',l)}${esc(m[l==='zh'?1:2])}">${img(m[0],esc(m[l==='zh'?1:2]))}</a><figcaption><span>FIG. ${String(i+1).padStart(2,'0')}</span>${esc(m[l==='zh'?1:2])}<span aria-hidden="true">↗</span></figcaption></figure>`).join('')}</div>${p.video?`<figure class="film"><video controls muted playsinline preload="none" poster="/assets/dotheal-cover-1280.webp" aria-label="${label('Dotheal 产品可视化视频','Dotheal product visualization video',l)}"><source src="/assets/${p.video}" type="video/mp4">${label('浏览器无法播放此视频。','Your browser cannot play this video.',l)}</video><figcaption>${label('产品可视化演示，非可用性或临床验证记录。','Product visualization; not a usability or clinical evaluation.',l)} <a href="/assets/${p.video}" download>${label('下载视频','Download video',l)} ↓</a></figcaption></figure>`:''}</section>
  <section id="reflection" class="case-section reflection"><span class="eyebrow">04 / ${label('结果、边界与下一步','Findings, boundaries & next steps',l)}</span><h2>${label('带着新的问题，继续。','A starting point for\nthe next question.',l).replaceAll('\n','<br>')}</h2><div class="reflection-grid"><div><h3>${label('已完成与观察到的','What the work shows',l)}</h3><p>${tx(p.finding,l)}</p></div><div><h3>${label('边界与下一步','Boundaries & next steps',l)}</h3><p>${tx(p.boundary,l)}</p></div></div></section></article>
  <aside class="next-project"><span class="eyebrow">${label('继续探索','Keep exploring',l)} / ${next.number}</span><a href="${href(l,'work/'+next.slug)}"><span>${name(next,l)}</span><span>↗</span></a></aside>`;
}
function experiment(l) {
  return `<div class="experiment"><div class="experiment-label">${label('2×2 实验条件','2×2 STUDY CONDITIONS',l)}</div><div class="condition"><span>01</span><strong>${label('呼吸光','Breathing light',l)}</strong><small>${label('恒温','Constant warmth',l)}</small></div><div class="condition"><span>02</span><strong>${label('呼吸光','Breathing light',l)}</strong><small>${label('动态升温','Dynamic warming',l)}</small></div><div class="condition"><span>03</span><strong>${label('实体起伏','Physical undulation',l)}</strong><small>${label('恒温','Constant warmth',l)}</small></div><div class="condition"><span>04</span><strong>${label('实体起伏','Physical undulation',l)}</strong><small>${label('动态升温','Dynamic warming',l)}</small></div></div>`;
}
function service(l) {
  return `<ol class="service-flow">${[['健康建档','Health records'],['营养建议','Meal guidance'],['配餐与配送','Preparation & delivery'],['餐后反馈','Post-meal feedback']].map((s,i)=>`<li><span>0${i+1}</span>${tx(s,l)}<b aria-hidden="true">${i===3?'↺':'→'}</b></li>`).join('')}</ol>`;
}

async function page(l, route, title, body, description) {
  const pagePath = path.join(dist,l,route,'index.html');
  await mkdir(path.dirname(pagePath), {recursive:true});
  const gallery=route==='journal/photography';
  await writeFile(pagePath,renderPage({lang:l,route,title,description,header:header(l,route),body,footer:footer(l),assets,criticalStyles:route?'':criticalStyles,inlinePhotography:gallery?inlinePhotography:'',photoPreviews:gallery?photographs.map(p=>p.preview):[]}));
}
await mkdir(dist,{recursive:true});
// Versioned, web-ready assets make a fresh Git checkout self-contained.
await cp(path.join(root,'public','assets'),path.join(dist,'assets'),{recursive:true});
for(const l of ['zh','en']) {
  await page(l,'',tx(['个人作品集','Selected work & design research'],l),home(l),tx(profile.intro,l));
  await page(l,'work',tx(['设计作品','Selected work'],l),work(l),tx(['黄塬岚的产品、交互与服务设计作品。','Product, interaction, and service design projects by Yuanlan Huang.'],l));
  await page(l,'about',tx(['关于我','About'],l),aboutSection(l).replace('<h2>','<h1>').replace('</h2>','</h1>'),tx(profile.bio,l));
  await page(l,'journal','Journal',journalSection(l,true),tx(['记录我留意的事物，与想留下的瞬间。','Things I notice, moments I keep.'],l));
  await page(l,'journal/photography','Photography',photographyPage(l),tx(['黄塬岚的摄影日记。','Yuanlan Huang’s photo diary.'],l));
  for(const p of projectFrames) await page(l,'work/'+p.slug,tx(projectFrames.find(r=>r.slug===p.slug).name,l),projectPlaceholder(p,l),tx(stories.find(s=>s.slug===p.slug).intro,l));
  for(const note of noteTopics) await page(l,'notes/'+note.slug,tx(note.name,l),notePage(note,l),tx(note.summary,l));
}
await writeFile(path.join(dist,'index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=/en/"><title>Yuanlan Huang · Portfolio</title><a href="/zh/">中文作品集</a> · <a href="/en/">English portfolio</a></html>');
await writeFile(path.join(dist,'404.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found · Yuanlan Huang</title><link rel="stylesheet" href="${assets.styles}"><main class="page-intro"><span class="eyebrow">404 / A LITTLE DETOUR</span><h1>Let’s find<br>our way back.</h1><p>页面未找到 / This page could not be found.</p><a class="text-link" href="/zh/">中文首页 ↗</a> <a class="text-link" href="/en/">English home ↗</a></main></html>`);
await copyFile(path.join(root,'favicon.svg'),path.join(dist,'favicon.svg'));
await cp(path.join(root,'.build-assets','static'),path.join(dist,'static'),{recursive:true});
console.log('Built bilingual single-page portfolios, 6 project details per language, article placeholders, and compatibility pages.');
