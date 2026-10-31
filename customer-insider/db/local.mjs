import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
export function openLocalDatabase(path='./.data/customer-insider.sqlite'){
  if(path!==':memory:')mkdirSync('.data',{recursive:true});
  const sqlite=new DatabaseSync(path);sqlite.exec('PRAGMA foreign_keys=ON');
  const existed=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='submissions'").get();
  sqlite.exec('CREATE TABLE IF NOT EXISTS __local_migrations (tag TEXT PRIMARY KEY NOT NULL)');
  // The original local adapter applied 0000 without a ledger. Adopt it rather than replaying it.
  if(existed)sqlite.prepare('INSERT OR IGNORE INTO __local_migrations (tag) VALUES (?)').run('0000_submissions');
  const journal=JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json',import.meta.url),'utf8'));
  for(const entry of journal.entries){
    if(sqlite.prepare('SELECT tag FROM __local_migrations WHERE tag = ?').get(entry.tag))continue;
    sqlite.exec('BEGIN');
    try{sqlite.exec(readFileSync(new URL('../drizzle/'+entry.tag+'.sql',import.meta.url),'utf8'));sqlite.prepare('INSERT INTO __local_migrations (tag) VALUES (?)').run(entry.tag);sqlite.exec('COMMIT');}catch(error){sqlite.exec('ROLLBACK');sqlite.close();throw error;}
  }
  return {close:()=>sqlite.close(),prepare(sql){const stmt=sqlite.prepare(sql);let values=[];return {bind(...args){values=args;return this;},async run(){const result=stmt.run(...values);return {success:true,meta:{changes:result.changes}};},async first(){return stmt.get(...values)||null;},async all(){return {results:stmt.all(...values),success:true};}};}};
}
