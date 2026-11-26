// /api/netatmo – priemer 3 verejných staníc Netatmo pri areáli (teplota, vlhkosť, rosný bod, zrážky)
// Prihlasovacie údaje sú LEN v premenných prostredia Netlify (NETATMO_CLIENT_ID, NETATMO_CLIENT_SECRET,
// NETATMO_REFRESH_TOKEN). Netatmo pri obnove vydáva nový refresh token – ukladá sa do Netlify Blobs.
import { getStore } from '@netlify/blobs';

const STATIONS = ['70:ee:50:71:33:6c', '70:ee:50:19:3a:40', '70:ee:50:19:cd:e4'];
const BOX = { lat_ne: 49.32, lon_ne: 19.00, lat_sw: 49.10, lon_sw: 18.66 };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const dew = (t, rh) => { if (t == null || !rh) return null; const a = 17.62, b = 243.12, g = Math.log(rh / 100) + a * t / (b + t); return b * g / (a - g); };

async function token(st) {
  const id = process.env.NETATMO_CLIENT_ID, sec = process.env.NETATMO_CLIENT_SECRET, envRt = process.env.NETATMO_REFRESH_TOKEN;
  if (!id || !sec || !envRt) return null;
  let t = (await st.get('tok', { type: 'json' })) || {};
  if (t.seed !== envRt) t = { seed: envRt, refresh: envRt };          // nový token zadaný v Netlify → začni od neho
  if (t.access && t.exp > Date.now() + 120e3) return t.access;
  const r = await fetch('https://api.netatmo.com/oauth2/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refresh, client_id: id, client_secret: sec }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('Netatmo prihlásenie zlyhalo (' + (j.error || r.status) + ')');
  t = { seed: t.seed, refresh: j.refresh_token || t.refresh, access: j.access_token, exp: Date.now() + (j.expires_in || 10800) * 1000 };
  await st.setJSON('tok', t);
  return t.access;
}

export default async () => {
  const st = getStore({ name: 'zu-netatmo', consistency: 'strong' });
  try {
    const c = await st.get('data', { type: 'json' });
    if (c && Date.now() - c.fetched < 5 * 60e3) return json(c);
    const tok = await token(st);
    if (!tok) return json({ configured: false });
    const q = new URLSearchParams({ ...BOX, filter: 'false' });
    const r = await fetch('https://api.netatmo.com/api/getpublicdata?' + q, { headers: { authorization: 'Bearer ' + tok } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('Netatmo ' + (j.error && j.error.message || r.status));
    const now = Date.now() / 1000, list = [];
    for (const s of j.body || []) {
      if (!STATIONS.includes(String(s._id).toLowerCase())) continue;
      const o = { id: s._id, alt: s.place && s.place.altitude, t: null, rh: null, ts: null, rain1h: null, rain24h: null };
      for (const m of Object.values(s.measures || {})) {
        if (m.type && m.res) { const ti = m.type.indexOf('temperature'), hi = m.type.indexOf('humidity');
          for (const [ts, v] of Object.entries(m.res)) { if (ti >= 0 && v[ti] != null) { o.t = v[ti]; o.ts = +ts; } if (hi >= 0 && v[hi] != null) o.rh = v[hi]; } }
        if (m.rain_60min != null) { o.rain1h = m.rain_60min; o.rain24h = m.rain_24h; }
      }
      o.age = o.ts ? Math.round((now - o.ts) / 60) : null;
      list.push(o);
    }
    // filtre: staré dáta (> 60 min), nezmyselné hodnoty, odľahlá stanica (> 2 °C od mediánu, napr. na slnku)
    let ok = list.filter(o => o.t != null && o.age != null && o.age <= 60 && o.t > -40 && o.t < 45);
    if (ok.length >= 3) { const med = ok.map(o => o.t).sort((a, b) => a - b)[Math.floor(ok.length / 2)]; ok = ok.filter(o => Math.abs(o.t - med) <= 2); }
    for (const o of list) o.used = ok.includes(o);
    const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10 : null;
    const t = avg(ok.map(o => o.t)), rhs = ok.filter(o => o.rh != null).map(o => o.rh), rh = rhs.length ? Math.round(avg(rhs)) : null;
    const rain = list.filter(o => o.rain1h != null);
    const out = { configured: true, fetched: Date.now(), n: ok.length, t, rh, td: t != null && rh ? Math.round(dew(t, rh) * 10) / 10 : null,
      rain1h: rain.length ? avg(rain.map(o => o.rain1h)) : null, stations: list, found: list.length };
    await st.setJSON('data', out);
    return json(out);
  } catch (e) { return json({ configured: true, error: String(e.message || e) }, 200); }
};

export const config = { path: '/api/netatmo' };
