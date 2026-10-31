// List routing is server-owned and follows the same intent as PDF delivery.
export const brevoContactListId=answers=>answers.intent==='learn'?10:9;
export async function syncBrevoContact(env,email,answers){
  const listId=brevoContactListId(answers);email=email.trim().toLowerCase();let claimed=false;
  try{
    if(env.DB){
      await env.DB.prepare("INSERT INTO brevo_contact_sync (email, list_id, status) VALUES (?, ?, 'pending') ON CONFLICT(email, list_id) DO NOTHING").bind(email,listId).run();
      const existing=await env.DB.prepare('SELECT status FROM brevo_contact_sync WHERE email = ? AND list_id = ?').bind(email,listId).first();
      if(existing?.status==='synced')return {status:'synced',listId};
      const lock=await env.DB.prepare("UPDATE brevo_contact_sync SET status = 'syncing', started_at = ? WHERE email = ? AND list_id = ? AND (status IN ('pending', 'failed') OR (status = 'syncing' AND started_at < ?))").bind(new Date().toISOString(),email,listId,new Date(Date.now()-120000).toISOString()).run();
      if(!lock.meta?.changes)return {status:'processing',listId};claimed=true;
    }
    const response=await fetch('https://api.brevo.com/v3/contacts',{method:'POST',signal:AbortSignal.any([env.PLAN_SIGNAL||new AbortController().signal,AbortSignal.timeout(env.PLAN_CONTACT_TIMEOUT||10000)]),headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({email,listIds:[listId],updateEnabled:true})});
    if(!response.ok)throw Error('Contact sync not confirmed.');
    // Both 201 (new contact) and 204 (existing contact updated) are successful.
    // Do not change blacklist/consent flags, unlink other lists, or overwrite attributes.
    if(env.DB)await env.DB.prepare("UPDATE brevo_contact_sync SET status = 'synced', synced_at = ? WHERE email = ? AND list_id = ?").bind(new Date().toISOString(),email,listId).run();
    return {status:'synced',listId};
  }catch{
    if(env.DB&&claimed)try{await env.DB.prepare("UPDATE brevo_contact_sync SET status = 'failed' WHERE email = ? AND list_id = ?").bind(email,listId).run();}catch{}
    return {status:'failed',listId};
  }
}
