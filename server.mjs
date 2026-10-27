import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stat, readFile, open } from 'node:fs/promises';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cloudflare-pages');
const port = Number(process.env.PORT || 4173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.pdf':'application/pdf','.mp4':'video/mp4','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=path.resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
    let info;
    try {info=await stat(file);} catch {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}).end(await readFile(path.join(root,'404.html')));return;}
    if(info.isDirectory()) {
      if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'}).end();return;}
      file=path.join(file,'index.html');info=await stat(file);
    }
    const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if(range){
      const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),info.size-1):info.size-1;
      if(start> end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}
      res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${info.size}`});
      if(req.method==='HEAD'){res.end();return;}
      const handle=await open(file,'r');handle.createReadStream({start,end,autoClose:true}).pipe(res);
    } else {res.writeHead(200,{...headers,'Content-Length':info.size});if(req.method==='HEAD')res.end();else res.end(await readFile(file));}
  }catch{res.writeHead(500).end('Unable to load page.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local portfolio: http://127.0.0.1:${port}/zh/`));
