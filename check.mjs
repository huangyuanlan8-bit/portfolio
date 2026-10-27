import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),process.env.SITE_OUTPUT_DIR||'dist');
async function walk(dir){const list=await readdir(dir,{withFileTypes:true});return(await Promise.all(list.map(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]))).flat();}
const files=await walk(root),html=files.filter(f=>f.endsWith('.html'));let links=0;
for(const f of html){
 const text=await readFile(f,'utf8');
 for(const match of text.matchAll(/(?:href|src|poster)="([^"#]+)(#[^"]*)?"/g)){
  const raw=match[1];if(/^(mailto:|https?:)/.test(raw))continue;
  const url=decodeURIComponent(raw);let target=path.join(root,url);
  if(url.endsWith('/'))target=path.join(target,'index.html');
  assert.ok(files.includes(target),`Missing reference ${raw} in ${f}`);links++;
 }
 for(const match of text.matchAll(/href="#([^" ]+)"/g))assert.ok(text.includes(`id="${match[1]}"`),`Missing anchor ${match[1]} in ${f}`);
 if(f.includes(path.sep+'zh'+path.sep)||f.includes(path.sep+'en'+path.sep)){
  assert.equal((text.match(/<h1\b/g)||[]).length,1,`Expected one H1 in ${f}`);
  assert.ok(text.includes('<main id="main">'),`Missing main in ${f}`);
  assert.ok(!text.includes('敬请期待')&&!text.includes('lorem ipsum'),`Placeholder in ${f}`);
  const lang=f.includes(path.sep+'zh'+path.sep)?'zh':'en';
  const counterpart=f.replace(path.sep+lang+path.sep,path.sep+(lang==='zh'?'en':'zh')+path.sep);
  assert.ok(files.includes(counterpart),`No translated counterpart for ${f}`);
 }
}
const permitted=new Set(['.html','.css','.js','.svg','.webp','.mp4','.pdf','.woff2']);
for(const f of files)assert.ok(permitted.has(path.extname(f)),`Unexpected publication file: ${f}`);
assert.equal(files.filter(f=>f.endsWith('.pdf')).length,2,'Only the two curated CVs may be published.');
for(const lang of ['zh','en']){
 const cv=await readFile(path.join(root,`assets/yuanlan-huang-cv-${lang}.pdf`));assert.equal(cv.subarray(0,4).toString(),'%PDF');
}
const size=(await Promise.all(files.map(f=>stat(f)))).reduce((n,s)=>n+s.size,0);
console.log(`PASS: ${html.length} HTML entries, ${links} local references, all translated counterparts, all fragment anchors, asset allowlist and both CVs. ${(size/1024/1024).toFixed(1)} MB deployable total.`);
