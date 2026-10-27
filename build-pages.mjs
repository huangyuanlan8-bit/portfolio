import {spawn} from 'node:child_process';
import {copyFile, readFile, writeFile, stat, rm, rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {listFiles, inspectOutput, verifyPages, MAX_ASSET_BYTES} from './pages-audit.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(root, 'public', 'assets');
const output = path.join(root, 'cloudflare-pages');
const staging = path.join(root, 'cloudflare-pages.staging');
const mib = bytes => (bytes / 1024 / 1024).toFixed(2);
function run(script, environment = {}) {
  return new Promise((resolve,reject) => {
    const child = spawn(process.execPath, [script], {
      cwd:root, windowsHide:true, env:{...process.env,...environment}, stdio:'inherit'
    });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`)));
  });
}
async function removeGenerated(directory) {
  if (![output,staging].includes(directory) || path.dirname(directory) !== root) throw new Error('Unsafe generated output path');
  await rm(directory, {recursive:true, force:true});
}

// Cloud builds consume the already-optimized, versioned media. They never need
// ffmpeg, a developer's dist directory, a Windows drive, or ignored caches.
const mediaFiles = await listFiles(assets);
for (const file of mediaFiles) {
  const info = await stat(path.join(assets,file));
  if (info.size > MAX_ASSET_BYTES) throw new Error(`public/assets/${file} exceeds 25 MiB; prepare a smaller web copy before committing (keep the original outside public).`);
}
const manifest = JSON.parse(await readFile(path.join(root,'media-manifest.json'),'utf8'));
for (const media of manifest.optimizedVideos) {
  const bytes = await readFile(path.join(root,'public',media.file));
  if (bytes.length !== media.outputBytes || createHash('sha256').update(bytes).digest('hex') !== media.sha256) throw new Error(`Optimized video differs from manifest: ${media.file}; update the manifest after intentionally replacing the web video.`);
}
console.log('Building React/GSAP production bundle…');
await run('bundle-journal.mjs');
await run('bundle-site.mjs');
await removeGenerated(staging);
console.log('Building bilingual static HTML from versioned public/assets…');
await run('build.mjs', {SITE_OUTPUT_DIR:'cloudflare-pages.staging'});
await run('check.mjs', {SITE_OUTPUT_DIR:'cloudflare-pages.staging'});
await copyFile(path.join(root,'pages-redirects'), path.join(staging,'_redirects'));
await copyFile(path.join(root,'pages-headers'), path.join(staging,'_headers'));
const inspection = await inspectOutput(staging);
const unusedVideos = inspection.files.filter(file => file.endsWith('.mp4') && !inspection.references.has(file));
if (unusedVideos.length) throw new Error(`Unreferenced videos in public/assets: ${unusedVideos.join(', ')}`);
const verified = await verifyPages(staging);
await removeGenerated(output);
await rename(staging, output);
const report = {
  generatedAt:new Date().toISOString(), output:'cloudflare-pages',
  stack:'Node.js static HTML generator; React 19 + GSAP islands; WebGL; no runtime server',
  fileCount:verified.files.length, totalBytes:verified.totalBytes,
  largestFiles:[...verified.sizes].sort((a,b) => b[1]-a[1]).slice(0,12).map(([file,bytes]) => ({file,bytes})),
  optimizedVideos:manifest.optimizedVideos,
  checkedReferences:verified.checkedReferences, missingReferences:verified.missing,
  localMachineDependencies:verified.machinePaths, externalAssetDependencies:verified.externalResources,
  routes:verified.routes, notes:['Web media is committed in public/assets; originals are kept outside the deployment repository.', 'Offline static route checks passed; verify the live deployment after connecting Cloudflare Pages.']
};
await writeFile(path.join(root,'cloudflare-pages-report.json'), JSON.stringify(report,null,2)+'\n');
console.log(`PASS: ${verified.files.length} files, ${mib(verified.totalBytes)} MiB total, ${verified.routes.length} direct routes, ${verified.checkedReferences} asset/link checks; no file exceeds 25 MiB.`);
console.log(`Cloudflare Pages output: ${output}`);
