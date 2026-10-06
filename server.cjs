const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.env.PORT||5174);
const openai=require('./openai-local.cjs')(port);
http.createServer((req,res)=>{
 // Firebase Authentication treats localhost and 127.0.0.1 as different authorized domains.
 // Always normalize local access to localhost so Google sign-in uses one stable origin.
 const host=String(req.headers.host||'');
 if(/^127\.0\.0\.1(?::\d+)?$/i.test(host)){
   const target='http://localhost:'+port+(req.url||'/');
   res.writeHead(302,{Location:target,'Cache-Control':'no-store'});
   return res.end();
 }
 if(req.url.startsWith('/api/openai/')) return openai(req,res);

 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)||!['.html','.css','.js','.svg','.woff','.woff2','.png','.jpg'].includes(path.extname(file))){res.writeHead(404);return res.end('Not found');}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data);});
}).listen(port,()=>console.log('Local: http://localhost:'+port));
