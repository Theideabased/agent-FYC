import {localEnvironment} from '../config/local-env.mjs';
const env=localEnvironment();
const email=v=>typeof v==='string'&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);
const groups=[['Business PDFs',Boolean(env.GEMINI_API_KEY)&&/^gemini-[a-z0-9.-]+$/.test(env.GEMINI_MODEL||'gemini-3.8-flash'),'GEMINI_API_KEY and a valid GEMINI_MODEL'],['Brevo email',Boolean(env.BREVO_API_KEY)&&email(env.BREVO_FROM_EMAIL)&&(!env.BREVO_REPLY_TO_EMAIL||email(env.BREVO_REPLY_TO_EMAIL)),'BREVO_API_KEY, BREVO_FROM_EMAIL (plain verified email); optional BREVO_REPLY_TO_EMAIL'],['Telegram alerts',/^\d+:[A-Za-z0-9_-]+$/.test(env.TELEGRAM_BOT_TOKEN||'')&&/^(-?\d+|@[A-Za-z0-9_]{5,})$/.test(env.TELEGRAM_CHAT_ID||''),'TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID']];
for(const [name,ready,hint]of groups)console.log(name+': '+(ready?'configured locally':'missing or invalid — set '+hint));
console.log('Learner PDF: included; Gemini is not required for learners.');
console.log('This check validates local settings only. It does not contact providers or send messages.');
if(groups.some(([,ready])=>!ready))process.exitCode=1;
