import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import worker from './worker/index.js';
import {openLocalDatabase} from './db/local.mjs';
import {localEnvironment} from './config/local-env.mjs';
const DB=openLocalDatabase();
const startupEnv=localEnvironment();
const port=Number(startupEnv.PORT||3000);
const host=startupEnv.HOST||'127.0.0.1';
const server=createServer(async(req,res)=>{
  try {
    let size=0;const chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size>10000){res.writeHead(413);res.end('Request too large');return;}chunks.push(chunk);}
    const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(','):v);
    // Local requests share one development rate-limit bucket. Never trust a client IP header locally.
    headers.delete('cf-connecting-ip');
    for(const name of [...headers.keys()])if(name.startsWith('oai-'))headers.delete(name);
    const abort=new AbortController();res.on('close',()=>abort.abort());
    const request=new Request('http://'+(req.headers.host||'localhost:'+port)+req.url,{method:req.method,headers,signal:abort.signal,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
    const response=await worker.fetch(request,{...localEnvironment(),DB},{waitUntil(promise){promise.catch(()=>console.error('Background task failed.'));}});res.writeHead(response.status,Object.fromEntries(response.headers));res.flushHeaders();if(response.body)await pipeline(Readable.fromWeb(response.body),res);else res.end();
  }catch{if(!res.headersSent){res.writeHead(500);res.end('Internal server error');}else res.destroy();}
});
server.listen(port,host,()=>console.log('Customer Insider: http://'+host+':'+port));
