// Updated from Yuanlan's certificate verification, 2026-10-27.
// New English project titles are website display translations, not official names.
// visible:false keeps candidates without a supplied certificate off the page.
export const recognitions = [
 {id:'ncda-national',visible:true,category:'design',name:['第14届未来设计师·全国高校数字艺术设计大赛（NCDA）','14th Future Designer · National College Digital Art & Design Competition (NCDA)'],rows:[
  {project:['闻香见山城 · Scent of Chongqing','Scent of Chongqing'],award:['全国一等奖','National First Prize'],year:2026}
 ]},
 {id:'china-creative-national',visible:true,category:'design',name:['第20届中国好创意暨全国数字艺术设计大赛','20TH CHINA CREATIVE CHALLENGES CONTEST'],rows:[
  {project:['DoTheal','DoTheal'],award:['全国二等奖','National Second Prize'],year:2026},
  {project:['闻香见山城 · Scent of Chongqing','Scent of Chongqing'],award:['全国三等奖','National Third Prize'],year:2026}
 ]},
 {id:'china-creative-chongqing',visible:true,category:'design',name:['第20届中国好创意暨全国数字艺术设计大赛·重庆赛区','20TH CHINA CREATIVE CHALLENGES CONTEST · CHONGQING REGION'],rows:[
  {project:['Care Meal · 社区老年健康饮食服务系统设计','Care Meal'],certificateTitleZh:'社区老年健康饮食服务系统设计',award:['赛区二等奖','Regional Second Prize'],year:2026}
 ]},
 {id:'ux-innovation',visible:true,category:'design',name:['第17届国际用户体验创新大赛','17TH USER EXPERIENCE DESIGN AWARD'],rows:[
  {project:['一念触达——宠物生命数字化智能AI手机系统设计','Yinian Chuda — AI Mobile System for Digital Pet Life'],award:['全国三等奖','National Third Prize'],year:2025}
 ]},
 {id:'invention-patent',visible:true,category:'design',name:['中国发明专利','Chinese Invention Patent'],rows:[
  {project:['一种便携式中医手持揿针器','Portable Handheld Press-Needle Applicator for Traditional Chinese Medicine'],englishTitleType:'display-translation',patentNumber:'ZL 202610113494.7',award:['已授权','Granted'],year:2026}
 ]},
 {id:'china-vr',visible:true,category:'design',name:['第七届中国虚拟现实大赛','7TH CHINA VIRTUAL REALITY COMPETITION'],rows:[
  {project:['Ghost Island','Ghost Island'],award:['全国总决赛三等奖','National Grand Final Third Prize'],year:2024}
 ]},
 {id:'huacan',visible:true,category:'design',name:['第10届两岸新锐设计竞赛·华灿奖','10th Cross-Strait Emerging Design Competition · Huacan Award'],rows:[
  {project:['云枢智巡——城市交通智能监测&指挥无人机设计','Yunshu Zhixun — Urban Traffic Monitoring & Command Drone'],award:['赛区二等奖','Regional Second Prize'],year:2025},
  {project:['便携式智能胃电检测系统设计','Portable Intelligent Electrogastrography System'],award:['赛区三等奖','Regional Third Prize'],year:2025}
 ]},
 {id:'ncda-chongqing',visible:true,category:'design',name:['第14届未来设计师·全国高校数字艺术设计大赛（NCDA）·重庆赛区','14th Future Designer · National College Digital Art & Design Competition (NCDA) · Chongqing Region'],rows:[
  {project:['Care Meal · 面向社区老年健康需求的饮食支持与系统设计','Care Meal'],certificateTitleZh:'面向社区老年健康需求的饮食支持与系统设计',award:['赛区一等奖','Regional First Prize'],year:2026},
  {project:['Scent of Chongqing · 闻香见山城——系列香薰摆件设计','Scent of Chongqing'],certificateTitleZh:'闻香见山城——系列香薰摆件设计',award:['赛区一等奖','Regional First Prize'],year:2026},
  {project:['便携式智能胃电检测系统设计','Portable Intelligent Electrogastrography System'],award:['赛区二等奖','Regional Second Prize'],year:2026}
 ]},
 {id:'chongqing-industrial',visible:true,category:'design',name:['重庆市大学生工业设计大赛','Chongqing University Student Industrial Design Competition'],rows:[
  {project:['Woodwiz——儿童木雕科普AR眼镜产品&UI设计','Woodwiz — AR Glasses & UI for Children’s Woodcarving Education'],award:['三等奖','Third Prize'],year:2025}
 ]},
 {id:'hong-kong-new-design',visible:true,category:'design',name:['第7届香港新锐当代设计奖','7TH HONG KONG CONTEMPORARY DESIGN AWARDS'],rows:[
  {project:['Woodwiz——儿童木雕科普AR眼镜','Woodwiz — AR Glasses for Children’s Woodcarving Education'],award:['铜奖','Bronze Award'],year:2025},
  {project:['禅韵茶音','Zen Tea Resonance'],award:['铜奖','Bronze Award'],year:2025},
  {project:['龙韵童梦——铜梁龙系列文创积木','Dragon Dreams — Tongliang Dragon Building Blocks'],award:['铜奖','Bronze Award'],year:2025},
  {project:['云枢智巡——城市交通智能检测&指挥无人机','Yunshu Zhixun — Urban Traffic Monitoring & Command Drone'],award:['铜奖','Bronze Award'],year:2025}
 ]},
 {id:'epacc',visible:false,category:'design',name:['EPACC','EPACC'],rows:[
  {project:null,award:['中国区铜奖','China Regional Bronze Prize'],year:null}
 ],reviewNote:'赛事正式全名尚未确认，项目与年份未提供。'},
 {id:'national-scholarship',visible:true,category:'academic',name:['国家励志奖学金','NATIONAL ENCOURAGEMENT SCHOLARSHIP'],rows:[
  {project:['2024–2025学年','2024–2025 ACADEMIC YEAR'],award:['获奖者','Recipient'],year:2025}
 ]},
 {id:'cqu-scholarship',visible:true,category:'academic',name:['重庆大学优秀学生综合奖学金','CHONGQING UNIVERSITY COMPREHENSIVE SCHOLARSHIP FOR OUTSTANDING STUDENTS'],rows:[
  {project:['2024–2025学年第二学期','2024–2025 · SECOND SEMESTER'],award:['丙等奖','Third-tier Award'],year:2025}
 ]}
];

const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const text=(value,lang)=>value==null?'':esc(Array.isArray(value)?value[lang==='zh'?0:1]:value);
function projectText(value,lang){
 if(value?.original)return `<span lang="${esc(value.lang)}">${esc(value.original)}</span>`;
 return text(value,lang);
}
function table(groups,lang,label){
 const headers=lang==='zh'?['赛事／认可名称','项目／成果','奖级／状态','年份']:['Competition / Recognition','Project / Outcome','Award / Status','Year'];
 return `<table class="awards-table" aria-label="${text(label,lang)}"><colgroup><col class="awards-col-event"><col class="awards-col-project"><col class="awards-col-status"><col class="awards-col-year"></colgroup><thead class="sr-only"><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead>${groups.map(group=>`<tbody data-recognition="${esc(group.id)}">${group.rows.map((row,index)=>`<tr>${index===0?`<th class="award-event" scope="rowgroup" rowspan="${group.rows.length}">${text(group.name,lang)}</th>`:''}<td class="award-project${row.project?'':' is-empty'}">${projectText(row.project,lang)}</td><td class="award-status${row.award?'':' is-empty'}">${text(row.award,lang)}</td><td class="award-year${row.year?'':' is-empty'}">${row.year?`<time datetime="${row.year}">${row.year}</time>`:''}</td></tr>`).join('')}</tbody>`).join('')}</table>`;
}
export function awardsSection(lang){
 const visible=recognitions.filter(group=>group.visible&&group.rows.length);
 const title=['奖项与认可','Awards & Recognition'],academic=['学术认可','Academic Recognition'];
 return `<section id="awards" class="awards-recognition" aria-labelledby="awards-title" data-awards-reveal><h2 id="awards-title" class="awards-label">${text(title,lang)}</h2>${table(visible.filter(g=>g.category==='design'),lang,title)}<h3 class="awards-label awards-academic-label">${text(academic,lang)}</h3>${table(visible.filter(g=>g.category==='academic'),lang,academic)}</section>`;
}
