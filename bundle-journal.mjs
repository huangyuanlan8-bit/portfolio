import {build} from 'esbuild';
await build({entryPoints:['react/journal.jsx'],bundle:true,minify:true,format:'iife',target:['es2020'],jsx:'automatic',outfile:'journal-components.js',define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
