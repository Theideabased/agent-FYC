import {localEnvironment} from '../config/local-env.mjs';
const env=localEnvironment();
if(!/^\d+:[A-Za-z0-9_-]+$/.test(env.TELEGRAM_BOT_TOKEN||'')){
  console.error('Add TELEGRAM_BOT_TOKEN to .env first.');process.exitCode=1;
}else{
  try{
    const response=await fetch('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/getUpdates',{method:'POST',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json'},body:JSON.stringify({timeout:0,limit:100})});
    const body=await response.json();
    if(!response.ok||body.ok!==true){console.error('Could not read Telegram chats. Check your token. If this bot already uses a webhook, use its existing app to obtain the chat ID; this helper does not remove webhooks.');process.exitCode=1;}
    else{
      const chats=new Map();
      for(const update of body.result||[]){const chat=(update.message||update.channel_post)?.chat;if(chat)chats.set(chat.id,chat);}
      if(!chats.size)console.log('No recent chats found. Open your bot in Telegram, tap Start or send /start, then run this command again. For a group, add the bot and send /start@YourBotUsername in that group.');
      for(const chat of chats.values())console.log(JSON.stringify({chatId:String(chat.id),type:chat.type,name:chat.title||[chat.first_name,chat.last_name].filter(Boolean).join(' ')}));
      if(chats.size)console.log('Copy the intended chatId into TELEGRAM_CHAT_ID in .env. No messages were sent.');
    }
  }catch{console.error('Telegram lookup failed. Check your connection and token, then retry.');process.exitCode=1;}
}
