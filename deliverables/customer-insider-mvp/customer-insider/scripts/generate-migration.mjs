import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
const files=[{tag:'0000_submissions',path:'db/schema.sql'},...readdirSync('db/migrations').filter(name=>name.endsWith('.sql')).sort().map(name=>({tag:name.slice(0,-4),path:'db/migrations/'+name}))];
const journalPath='drizzle/meta/_journal.json';
const journal=JSON.parse(readFileSync(journalPath,'utf8'));
for(const file of files){
  const sql=readFileSync(file.path,'utf8');const target='drizzle/'+file.tag+'.sql';
  if(existsSync(target)&&readFileSync(target,'utf8')!==sql)throw Error('Existing migrations are immutable. Append a new migration instead: '+file.tag);
  if(!existsSync(target))writeFileSync(target,sql);
  if(!journal.entries.some(e=>e.tag===file.tag))journal.entries.push({idx:journal.entries.length,version:'6',when:Date.now(),tag:file.tag,breakpoints:true});
}
writeFileSync(journalPath,JSON.stringify(journal,null,2)+'\n');console.log('Schema migrations ready.');
