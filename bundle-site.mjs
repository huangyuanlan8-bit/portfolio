import {transform} from 'esbuild';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const directory=new URL('./.build-assets/static/',import.meta.url);
// This fixed, generated directory contains only replaceable hashed bundles.
await rm(directory,{recursive:true,force:true});await mkdir(directory,{recursive:true});
const manifest={};
async function bundle(name,files,loader='js'){
 const source=(await Promise.all(files.map(file=>readFile(new URL(file,import.meta.url),'utf8')))).join('\n;\n');
 const result=await transform(source,{loader,minify:true,target:'es2020',legalComments:'eof',...(loader==='js'?{format:'iife'}:{})});
 const hash=createHash('sha256').update(result.code).digest('hex').slice(0,12),filename=`${name}-${hash}.${loader}`;
 await writeFile(new URL(filename,directory),result.code);manifest[name]=`/static/${filename}`;
}
await bundle('core',['runtime.js','orbit-geometry.js','gallery.js','gallery-atmosphere.js','site.js','awards.js','project-image-ready.js','cover-transition.js','portfolio-motion.js']);
await bundle('projects',['orbit-webgl.js','ink-fluid.js']);
await bundle('experience',['badge-physics.js','badges.js']);
await bundle('photography',['photo-film-math.js','photo-film-renderer.js','photography.js']);
await bundle('journal',['journal-components.js','journal-motion.js']);
// Keep the existing cascade exactly; one stylesheet removes the serial request
// overhead without changing typography, layout or component appearance.
const sheets=['style.css','lab.css','hero-collage.css','site.css','motion.css','orbit-renderer.css','story.css','experience.css','gallery-atmosphere.css','journal-components.css','journal.css','photography.css','page-transitions.css','contact.css','typography.css','awards.css'];
const css=(await Promise.all(sheets.map(file=>readFile(new URL(file,import.meta.url),'utf8')))).join('\n');
const result=await transform(css,{loader:'css',minify:true,target:'es2020',legalComments:'eof'});
const cssName=`site-${createHash('sha256').update(result.code).digest('hex').slice(0,12)}.css`;
await writeFile(new URL(cssName,directory),result.code);manifest.styles=`/static/${cssName}`;
await writeFile(new URL('./.build-assets/manifest.json',import.meta.url),JSON.stringify(manifest,null,2));
console.log('Built content-hashed core, stylesheet and on-demand feature bundles.');
