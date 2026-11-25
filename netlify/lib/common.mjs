import { getStore } from '@netlify/blobs';
import webpush from 'web-push';

export const SITE = 'https://noricozima.netlify.app';
export const store = () => getStore({ name: 'zu-push', consistency: 'strong' });

/* VAPID kľúče sa vygenerujú automaticky pri prvom použití a ostávajú v Netlify Blobs (nie v kóde). */
export async function vapid() {
  const st = store();
  let k = await st.get('vapid', { type: 'json' });
  if (!k) {
    const n = webpush.generateVAPIDKeys();
    try { await st.setJSON('vapid', n, { onlyIfNew: true }); } catch (e) { await st.setJSON('vapid', n); }
    k = (await st.get('vapid', { type: 'json' })) || n;
  }
  webpush.setVapidDetails(SITE, k.publicKey, k.privateKey);
  return k;
}

export function subId(endpoint) {
  let h = 0x811c9dc5, h2 = 0;
  for (let i = 0; i < endpoint.length; i++) { h ^= endpoint.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; h2 = (h2 * 31 + endpoint.charCodeAt(i)) >>> 0; }
  return 'sub/' + h.toString(16) + h2.toString(16);
}

export async function sendTo(sub, payload, ttl = 4 * 3600) {
  try { await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: ttl, urgency: 'high' }); return 'ok'; }
  catch (e) { return (e.statusCode === 404 || e.statusCode === 410) ? 'gone' : 'err:' + (e.statusCode || e.message); }
}

export async function sendAll(payload) {
  await vapid();
  const st = store();
  const { blobs } = await st.list({ prefix: 'sub/' });
  let ok = 0, gone = 0, err = 0;
  for (const b of blobs) {
    const rec = await st.get(b.key, { type: 'json' });
    if (!rec || !rec.sub) continue;
    const r = await sendTo(rec.sub, payload);
    if (r === 'ok') ok++; else if (r === 'gone') { gone++; await st.delete(b.key); } else err++;
  }
  return { ok, gone, err, total: blobs.length };
}
