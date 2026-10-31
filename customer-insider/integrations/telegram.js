export const telegramConfigured=env=>/^\d+:[A-Za-z0-9_-]+$/.test(env.TELEGRAM_BOT_TOKEN||'')&&/^(-?\d+|@[A-Za-z0-9_]{5,})$/.test(env.TELEGRAM_CHAT_ID||'');
export async function notifyOwnerSubmission(env,id,answers,email){
  if(!telegramConfigured(env)||!env.DB)return {status:'unconfigured'};
  let claimed=false;
  try{
    await env.DB.prepare("INSERT INTO telegram_notifications (submission_id, status) VALUES (?, 'pending') ON CONFLICT(submission_id) DO NOTHING").bind(id).run();
    const now=new Date().toISOString();
    const lock=await env.DB.prepare("UPDATE telegram_notifications SET status = 'sending', started_at = ? WHERE submission_id = ? AND (status IN ('pending', 'failed') OR (status = 'sending' AND started_at < ?))").bind(now,id,new Date(Date.now()-120000).toISOString()).run();
    if(!lock.meta?.changes)return {status:'already_processed'};claimed=true;
    const learner=answers.intent==='learn';
    const labels={visitorName:'Name',businessName:'Business',role:'Role',problemArea:'Problem area',revenueBand:'Annual revenue',criticalContext:'Critical context',location:'Location',useCase:'Learning goal',currentTools:'Tools',experience:'Experience',context:'Context',currentProcess:'Current process',challenge:'Challenge',outcome:'Goal'};
    const lines=['New '+(learner?'learner':'business owner')+' submission','Email: '+email,...Object.entries(labels).filter(([key])=>answers[key]).map(([key,label])=>label+': '+answers[key]),'Reference: '+id];
    const text=Array.from(lines.join('\n\n')).slice(0,4000).join('');
    const response=await fetch('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text,link_preview_options:{is_disabled:true}})});
    if(!response.ok)throw Error('Notification rejected.');
    const body=await response.json();if(body.ok!==true||!Number.isInteger(body.result?.message_id))throw Error('Notification not confirmed.');
    await env.DB.prepare("UPDATE telegram_notifications SET status = 'sent', sent_at = ?, message_id = ? WHERE submission_id = ?").bind(new Date().toISOString(),String(body.result.message_id),id).run();return {status:'sent'};
  }catch{
    if(claimed)try{await env.DB.prepare("UPDATE telegram_notifications SET status = 'failed' WHERE submission_id = ?").bind(id).run();}catch{}
    return {status:'failed'};
  }
}
