import assert from 'node:assert/strict';
import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';

export const MAX_ASSET_BYTES = 25 * 1024 * 1024;
export async function listFiles(root, directory = root) {
  const entries = await readdir(directory, {withFileTypes:true});
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? listFiles(root, path.join(directory, entry.name))
    : path.relative(root, path.join(directory, entry.name)).split(path.sep).join('/')))).flat().sort();
}

// Inspect the generated files, including srcset, CSS fonts and embedded gallery
// JSON. This does not require a local web server or a development URL.
export async function inspectOutput(root) {
  const files = await listFiles(root);
  const sizes = new Map(await Promise.all(files.map(async file => [file, (await stat(path.join(root, file))).size])));
  const texts = new Map(await Promise.all(files.filter(file => /\.(html|css|js|svg)$/.test(file))
    .map(async file => [file, await readFile(path.join(root, file), 'utf8')])));
  const references = new Set();
  const missing = [], machinePaths = [], externalResources = [];
  let checkedReferences = 0;
  function reference(raw, source, resource = false) {
    raw = raw.replaceAll('&amp;', '&').trim();
    if (!raw || raw.startsWith('#') || /^(data:|blob:|mailto:|tel:)/i.test(raw)) return;
    if (/(?:^|["'\s(])(?:[a-z]:[\\/]|file:\/\/)|https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])\b/i.test(raw)) machinePaths.push({source, value:raw});
    const url = new URL(raw, `https://deployment.invalid/${source}`);
    if (url.origin !== 'https://deployment.invalid') {
      if (resource) externalResources.push({source, value:raw});
      return;
    }
    let target = decodeURIComponent(url.pathname).slice(1);
    if (!target || target.endsWith('/')) target += 'index.html';
    else if (!sizes.has(target) && sizes.has(`${target}/index.html`)) target += '/index.html';
    if (sizes.has(target)) {references.add(target); checkedReferences++;}
    else if (!files.some(file => file.startsWith(target.endsWith('/') ? target : `${target}/`))) missing.push({source, value:raw});
  }
  for (const [source, text] of texts) {
    if (/(?:^|["'\s(])(?:[a-z]:[\\/]|file:\/\/)|https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])\b/im.test(text)) machinePaths.push({source});
    for (const match of text.matchAll(/\/(?:assets|static)\/[a-z\d._%/+@-]+/gi)) reference(match[0], source, true);
    if (source.endsWith('.html')) {
      for (const match of text.matchAll(/<(a|link|img|script|source|video)\b[^>]*>/gi)) {
        for (const attr of match[0].matchAll(/\b(href|src|poster|srcset)="([^"]+)"/gi)) {
          const values = attr[1] === 'srcset' ? attr[2].split(',').map(part => part.trim().split(/\s+/)[0]) : [attr[2]];
          for (const value of values) reference(value, source, match[1].toLowerCase() !== 'a');
        }
      }
    }
    if (source.endsWith('.css')) for (const match of text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi)) reference(match[1], source, true);
  }
  return {
    files, sizes, references, missing, machinePaths, externalResources, checkedReferences,
    oversized:files.filter(file => sizes.get(file) > MAX_ASSET_BYTES).map(file => ({file, bytes:sizes.get(file)})),
    totalBytes:[...sizes.values()].reduce((sum, size) => sum + size, 0)
  };
}

// Pages serves actual directory indexes. Never rewrite all requests to the
// home page: this is a multi-page static site, not a client-side SPA router.
export function resolvePagesRoute(pathname, files, redirects = []) {
  const rule = redirects.find(rule => rule.from === pathname);
  if (rule) return {status:rule.status, location:rule.to};
  const pathnameOnly = decodeURIComponent(pathname.split(/[?#]/)[0]);
  const relative = pathnameOnly.replace(/^\//, '');
  if (files.includes(relative)) return relative.endsWith('index.html')
    ? {status:301, location:pathnameOnly.slice(0,-10)} : {status:200, file:relative};
  const index = `${relative}${relative && !relative.endsWith('/') ? '/' : ''}index.html`;
  if (files.includes(index)) return pathnameOnly.endsWith('/') ? {status:200, file:index} : {status:308, location:`${pathnameOnly}/`};
  return {status:404, file:'404.html'};
}

export async function verifyPages(root) {
  const result = await inspectOutput(root);
  assert.deepEqual(result.missing, [], 'Missing deployment references');
  assert.deepEqual(result.machinePaths, [], 'Local machine path in published files');
  assert.deepEqual(result.externalResources, [], 'Unexpected external asset dependency');
  assert.deepEqual(result.oversized, [], 'Cloudflare Pages asset exceeds 25 MiB');
  assert.ok(result.files.length <= 1000, 'Dashboard drag-and-drop limit exceeded');
  assert.ok(result.files.includes('404.html'), 'Missing custom 404; Pages would use SPA fallback');
  const rules = (await readFile(path.join(root, '_redirects'), 'utf8')).split(/\r?\n/)
    .filter(line => line && !line.startsWith('#')).map(line => {const [from,to,status] = line.trim().split(/\s+/);return {from,to,status:Number(status)};});
  assert.equal(resolvePagesRoute('/', result.files, rules).location, '/en/');
  const routes = result.files.filter(file => file.endsWith('/index.html')).map(file => `/${file.slice(0,-10)}`);
  for (const route of routes) {
    assert.equal(resolvePagesRoute(route, result.files, rules).status, 200, `Direct route ${route}`);
    assert.equal(resolvePagesRoute(route, result.files, rules).status, 200, `Reload route ${route}`);
    assert.ok([200,301,302,307,308].includes(resolvePagesRoute(route.slice(0,-1), result.files, rules).status), `Slashless route ${route}`);
    assert.equal(resolvePagesRoute(`${route}index.html`, result.files, rules).location, route, `Canonical index route ${route}`);
  }
  assert.equal(resolvePagesRoute('/does-not-exist/', result.files, rules).status, 404);
  for (const lang of ['zh','en']) {
    assert.ok(routes.includes(`/${lang}/journal/photography/`));
    assert.equal(routes.filter(route => route.startsWith(`/${lang}/work/`) && route !== `/${lang}/work/`).length, 6);
    const cv = await readFile(path.join(root, `assets/yuanlan-huang-cv-${lang}.pdf`));
    assert.equal(cv.subarray(0,4).toString(), '%PDF');
  }
  for (const file of result.files.filter(file => /\.(webp|woff2|mp4)$/.test(file))) {
    const bytes = await readFile(path.join(root, file));
    if (file.endsWith('.webp')) {
      assert.equal(bytes.subarray(0,4).toString(), 'RIFF', `Invalid WebP: ${file}`);
      assert.equal(bytes.subarray(8,12).toString(), 'WEBP', `Invalid WebP: ${file}`);
    } else if (file.endsWith('.woff2')) assert.equal(bytes.subarray(0,4).toString(), 'wOF2', `Invalid font: ${file}`);
    else {
      assert.equal(bytes.subarray(4,8).toString(), 'ftyp', `Invalid MP4: ${file}`);
      // Fast-start MP4s expose their metadata before the large video-data atom,
      // so playback does not depend on downloading the end of the file first.
      let offset = 0, moov = -1, mdat = -1;
      while (offset + 8 <= bytes.length) {
        let size = bytes.readUInt32BE(offset);
        const type = bytes.subarray(offset+4,offset+8).toString();
        if (size === 1) size = Number(bytes.readBigUInt64BE(offset+8));
        if (type === 'moov') moov = offset;
        if (type === 'mdat') mdat = offset;
        if (!size) break;
        offset += size;
      }
      assert.ok(moov >= 0 && mdat >= 0, `Missing MP4 metadata/data: ${file}`);
      assert.ok(moov < mdat, `MP4 is not optimized for progressive playback: ${file}`);
    }
  }
  return {...result, routes};
}
