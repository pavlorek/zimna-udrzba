// /api/push – GET: verejný VAPID kľúč · POST {sub}: prihlásiť zariadenie · DELETE {endpoint}: odhlásiť
import { store, vapid, subId, sendTo } from '../lib/common.mjs';

const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default async (req) => {
  try {
    if (req.method === 'GET') {
      if (new URL(req.url).searchParams.has('stav')) { const st = store(); const { blobs } = await st.list({ prefix: 'sub/' });
        return json({ zariadenia: blobs.length, posledna_kontrola: await st.get('log', { type: 'json' }), stav: await st.get('state', { type: 'json' }) }); }
      const k = await vapid(); return json({ key: k.publicKey }); }
    const body = await req.json().catch(() => ({}));
    const st = store();
    if (req.method === 'POST') {
      const sub = body.sub;
      if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth || sub.endpoint.length > 1000)
        return json({ error: 'bad subscription' }, 400);
      const id = subId(sub.endpoint);
      const old = await st.get(id, { type: 'json' });
      await st.setJSON(id, { sub: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, at: new Date().toISOString() });
      if (!old) { await vapid(); await sendTo(sub, { title: '🔔 Upozornenia zapnuté', body: 'Toto zariadenie bude dostávať výstrahy zimnej údržby areálu Mobis.' }, 600); }
      return json({ ok: true, new: !old });
    }
    if (req.method === 'DELETE') {
      if (typeof body.endpoint !== 'string') return json({ error: 'missing endpoint' }, 400);
      await st.delete(subId(body.endpoint));
      return json({ ok: true });
    }
    return json({ error: 'method' }, 405);
  } catch (e) { return json({ error: String(e.message || e) }, 500); }
};

export const config = { path: '/api/push' };
