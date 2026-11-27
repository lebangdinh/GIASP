import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('./app/',import.meta.url);
const port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{
 try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=new URL(path.slice(1)||'index.html',root);
 if(!file.href.startsWith(root.href))throw Error();
 const data=path==='/sample.local.json'?await readFile(new URL('./private/sample.local.json',import.meta.url)):await readFile(fileURLToPath(file));
 const type={html:'text/html',js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json'};
 res.writeHead(200,{'Content-Type':(type[file.pathname.split('.').pop()]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end();}
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
