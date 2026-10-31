import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
let source=await readFile(new URL('worker/index.js',root),'utf8');
for(const file of ['business.js','business-prompt.js','learning-guide.js']){
  const dependency=await readFile(new URL('reports/'+file,root),'utf8');
  source=source.replace(new RegExp("import \\{[^\\n]+\\} from '../reports/"+file.replace('.','\\.')+"';\\n"),'');
  source=dependency.replace(/\bexport /g,'')+'\n'+source;
}
const telegram=await readFile(new URL('integrations/telegram.js',root),'utf8');
source=telegram.replace(/\bexport /g,'')+'\n'+source.replace("import {telegramConfigured, notifyOwnerSubmission} from '../integrations/telegram.js';\n",'');
const contacts=await readFile(new URL('integrations/brevo-contacts.js',root),'utf8');
source=contacts.replace(/\bexport /g,'')+'\n'+source.replace("import {syncBrevoContact} from '../integrations/brevo-contacts.js';\n",'');
await writeFile(new URL('dist/server/index.js',root),source);
