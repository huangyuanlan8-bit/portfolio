import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {recognitions,awardsSection} from './awards.mjs';
const byId=id=>recognitions.find(group=>group.id===id);
assert.equal(new Set(recognitions.map(g=>g.id)).size,recognitions.length);
const expected={
 'ncda-national':[['Scent of Chongqing','National First Prize',2026]],
 'china-creative-national':[['DoTheal','National Second Prize',2026],['Scent of Chongqing','National Third Prize',2026]],
 'china-creative-chongqing':[['Care Meal','Regional Second Prize',2026]],
 'ux-innovation':[['Yinian Chuda — AI Mobile System for Digital Pet Life','National Third Prize',2025]],
 'invention-patent':[['Portable Handheld Press-Needle Applicator for Traditional Chinese Medicine','Granted',2026]],
 'china-vr':[['Ghost Island','National Grand Final Third Prize',2024]],
 'huacan':[['Yunshu Zhixun — Urban Traffic Monitoring & Command Drone','Regional Second Prize',2025],['Portable Intelligent Electrogastrography System','Regional Third Prize',2025]],
 'ncda-chongqing':[['Care Meal','Regional First Prize',2026],['Scent of Chongqing','Regional First Prize',2026],['Portable Intelligent Electrogastrography System','Regional Second Prize',2026]],
 'chongqing-industrial':[['Woodwiz — AR Glasses & UI for Children’s Woodcarving Education','Third Prize',2025]],
 'hong-kong-new-design':[['Woodwiz — AR Glasses for Children’s Woodcarving Education','Bronze Award',2025],['Zen Tea Resonance','Bronze Award',2025],['Dragon Dreams — Tongliang Dragon Building Blocks','Bronze Award',2025],['Yunshu Zhixun — Urban Traffic Monitoring & Command Drone','Bronze Award',2025]],
 'national-scholarship':[['2024–2025 ACADEMIC YEAR','Recipient',2025]],
 'cqu-scholarship':[['2024–2025 · SECOND SEMESTER','Third-tier Award',2025]]
};
assert.deepEqual(recognitions.filter(g=>g.visible).map(g=>g.id),Object.keys(expected));
for(const [id,rows] of Object.entries(expected)){
 const group=byId(id);
 assert.deepEqual(group.rows.map(r=>[r.project[1],r.award[1],r.year]),rows,id);
 assert.equal(new Set(group.rows.map(r=>JSON.stringify([r.project,r.award,r.year]))).size,group.rows.length,`${id}: no duplicate records`);
 for(const row of group.rows){
  assert.ok(row.project[0]&&row.project[1]&&row.award[0]&&row.award[1]);
  assert.ok(!row.award.join(' ').includes('×'));
 }
}
assert.equal(byId('china-creative-national').name[1],'20TH CHINA CREATIVE CHALLENGES CONTEST');
assert.equal(byId('china-creative-chongqing').name[1],'20TH CHINA CREATIVE CHALLENGES CONTEST · CHONGQING REGION');
assert.equal(byId('ux-innovation').name[1],'17TH USER EXPERIENCE DESIGN AWARD');
assert.equal(byId('hong-kong-new-design').name[1],'7TH HONG KONG CONTEMPORARY DESIGN AWARDS');
assert.equal(byId('china-vr').name[0],'第七届中国虚拟现实大赛');
assert.equal(byId('china-vr').name[1],'7TH CHINA VIRTUAL REALITY COMPETITION');
assert.ok(byId('ncda-chongqing').name[0].startsWith('第14届'));
assert.equal(byId('ux-innovation').rows[0].project[0],'一念触达——宠物生命数字化智能AI手机系统设计');
const patent=byId('invention-patent').rows[0];
assert.equal(patent.project[0],'一种便携式中医手持揿针器');
assert.equal(patent.englishTitleType,'display-translation');
assert.equal(patent.patentNumber,'ZL 202610113494.7');
assert.deepEqual(byId('huacan').rows.map(r=>r.project[0]),['云枢智巡——城市交通智能监测&指挥无人机设计','便携式智能胃电检测系统设计']);
assert.deepEqual(byId('ncda-chongqing').rows.slice(0,2).map(r=>r.certificateTitleZh),['面向社区老年健康需求的饮食支持与系统设计','闻香见山城——系列香薰摆件设计']);
assert.equal(byId('china-creative-chongqing').rows[0].certificateTitleZh,'社区老年健康饮食服务系统设计');
assert.equal(byId('chongqing-industrial').rows[0].project[0],'Woodwiz——儿童木雕科普AR眼镜产品&UI设计');
assert.deepEqual(byId('hong-kong-new-design').rows.map(r=>r.project[0]),['Woodwiz——儿童木雕科普AR眼镜','禅韵茶音','龙韵童梦——铜梁龙系列文创积木','云枢智巡——城市交通智能检测&指挥无人机']);
assert.deepEqual(byId('cqu-scholarship').rows[0],{project:['2024–2025学年第二学期','2024–2025 · SECOND SEMESTER'],award:['丙等奖','Third-tier Award'],year:2025});
assert.equal(byId('national-scholarship').rows[0].project[0],'2024–2025学年');
assert.equal(byId('epacc').visible,false);
for(const lang of ['zh','en']){
 const html=awardsSection(lang);
 assert.equal((html.match(/data-recognition=/g)||[]).length,12);
 assert.equal((html.match(/<tbody/g)||[]).length,12);
 assert.equal((html.match(/<td class="award-project/g)||[]).length,19);
 assert.ok(!/待核实|待补|展示建议|已有信息|上线前|EPACC|×|is-empty/.test(html));
 assert.ok(!html.includes(patent.patentNumber),'Patent number stays in configuration');
 const escape=value=>value.replaceAll('&','&amp;').replaceAll('’','’').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 for(const group of recognitions.filter(g=>g.visible)){
  const body=html.match(new RegExp(`<tbody data-recognition="${group.id}">(.*?)</tbody>`))[1];
  assert.equal((body.match(/scope="rowgroup"/g)||[]).length,1);
  assert.ok(body.includes(`rowspan="${group.rows.length}"`));
  assert.ok(body.includes(escape(group.name[lang==='zh'?0:1])));
  group.rows.forEach(row=>{assert.ok(body.includes(escape(row.project[lang==='zh'?0:1])));assert.ok(body.includes(escape(row.award[lang==='zh'?0:1])));});
 }
 const main=await readFile(new URL(`./cloudflare-pages/${lang}/index.html`,import.meta.url),'utf8');
 const standalone=await readFile(new URL(`./cloudflare-pages/${lang}/about/index.html`,import.meta.url),'utf8');
 for(const page of [main,standalone]){
  assert.equal(page.split('id="awards"').length-1,1);
  assert.ok(page.indexOf('id="awards"')>page.indexOf('YUANLAN HUANG / 黄塬岚'));
  assert.match(page, /href="\/static\/site-[a-f0-9]+\.css"/);
  assert.match(page, /src="\/static\/core-[a-f0-9]+\.js"/);
 }
 assert.ok(main.indexOf('id="awards"')<main.indexOf('id="projects"'));
}
console.log('PASS: 12 groups / 19 distinct bilingual records, certificate event names, exact projects/prizes/years, scholarship tiers, display-only patent translation, private patent number, hidden EPACC and grouped About output.');
