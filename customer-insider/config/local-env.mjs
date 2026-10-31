import {existsSync,readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
export function localEnvironment(path,base=process.env){
  // Read per request. Nonempty .env.local values override .env; shell values always win.
  const paths=path?[path]:['.env','.env.local'];let file={};
  for(const entry of paths)if(existsSync(entry)){
    const values=parseEnv(readFileSync(entry,'utf8'));
    for(const [key,value]of Object.entries(values))if(value||!(key in file))file[key]=value;
  }
  return {...file,...base};
}
