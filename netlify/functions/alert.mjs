// Plánovaná funkcia: každých 15 min vyhodnotí riziko (rovnaký výpočet ako aplikácia)
// a pri novej / zhoršenej výstrahe pošle push všetkým prihláseným zariadeniam.
import { store, sendAll } from '../lib/common.mjs';
import netatmo from './netatmo.mjs';
import { LAT, LON, LVL, MODELS, S, localKey, keyNum, hourKey, whenLbl, loadAll, ALD, buildSeries, naCorrect, riskSeries, consensus } from '../lib/engine.mjs';

const UA = 'zimna-udrzba-app/1.0 (+https://noricozima.netlify.app)';
const _f = globalThis.fetch;
globalThis.fetch = (u, o = {}) => { const h = new Headers(o.headers || {}); if (!h.has('user-agent')) h.set('user-agent', UA); const { cache, ...rest } = o; return _f(u, { ...rest, headers: h }); };

ALD.base = 'https://opendata.shmu.sk';

/* ALADIN po častiach: kroky sa ukladajú do Blobs, takže každý beh dotiahne len chýbajúce súbory. */
async function aladin(st, deadline) {
  const saved = (await st.get('ald', { type: 'json' })) || {};
  const R = await ALD.latestRun();
  const id = R.day + R.run;
  const runT = Date.UTC(+R.day.slice(0, 4), +R.day.slice(4, 6) - 1, +R.day.slice(6, 8), +R.run.slice(0, 2));
  let cur = saved.cur && saved.cur.id === id ? saved.cur : { id, runT, max: R.max, geo: null, res: {} };
  let prev = saved.cur && saved.cur.id !== id ? saved.cur : saved.prev || null;
  const nowS = Math.floor((Date.now() - runT) / 36e5);
  const steps = []; for (let s = Math.max(0, nowS - 3); s <= Math.min(R.max, nowS + 50); s++) steps.push(s);
  const q = steps.filter(s => !cur.res[s]);
  const one = async s => {
    const u = `${ALD.base}${ALD.dir}${R.day}/${R.run}/al-grib_sk_${String(s).padStart(3, '0')}-${R.day}-${R.run}-nwp-.grb`;
    const r = await fetch(u); if (!r.ok) throw new Error('ALADIN ' + r.status);
    const P = ALD.parse(await r.arrayBuffer()); const g = P.msgs[0].g;
    if (!cur.geo) { const [fi, fj] = ALD.lcc(LAT, LON, g); cur.geo = { g, fi, fj }; }
    const v = (c, p, lt, lv) => ALD.interp(P, ALD.pick(P, c, p, lt, lv), cur.geo.g, cur.geo.fi, cur.geo.fj);
    const gu = v(2, 23, 103), gv = v(2, 24, 103), u10 = v(2, 2, 103, 10), v10 = v(2, 3, 103, 10);
    cur.res[s] = { t2: v(0, 0, 103, 2), t850: v(0, 0, 100, 85000), tp: v(1, 193, 1),
      gust: gu != null ? Math.hypot(gu, gv) * 3.6 : null, wind: u10 != null ? Math.hypot(u10, v10) * 3.6 : null };
  };
  await Promise.all(Array.from({ length: 5 }, async () => { while (q.length && Date.now() < deadline) { const s = q.shift(); try { await one(s); } catch (e) { } } }));
  const toPts = o => { const pts = []; for (const s of Object.keys(o.res).map(Number).sort((a, b) => a - b)) { const x = o.res[s]; if (!x || x.t2 == null) continue;
    pts.push({ t: new Date(o.runT + s * 36e5).toISOString(), t2: x.t2 - 273.15, t850: x.t850 != null ? x.t850 - 273.15 : null, pr: s === 0 ? 0 : (x.tp != null ? Math.max(0, x.tp) : null), gust: x.gust, wind: x.wind }); } return pts; };
  const done = steps.every(s => cur.res[s]);
  await st.setJSON('ald', { cur, prev: done ? null : prev });
  const use = done || !prev ? cur : prev;
  const pts = toPts(use).filter(p => Date.parse(p.t) >= Date.now() - 4 * 36e5);
  return { run: use.id, pts, complete: done };
}

export default async () => {
  const t0 = Date.now(), deadline = t0 + 18e3;
  const st = store();
  const log = { at: new Date().toISOString() };
  try {
    const [r, ald] = await Promise.all([loadAll(), aladin(st, deadline).catch(e => ({ err: e.message }))]);
    log.errs = r.errs; log.ald = ald.err || `${ald.run} (${ald.pts.length} h${ald.complete ? '' : ', dopĺňa sa'})`;
    if (!r.om) throw new Error('Open-Meteo nedostupné');
    let NA = null; try { const j = await (await netatmo()).json(); if (j && j.n > 0 && Date.now() - j.fetched < 90 * 60e3) NA = j; } catch (e) { }
    log.netatmo = NA ? `${NA.t} °C (${NA.n} st.)` : 'nedostupné';
    const ser = naCorrect(buildSeries(r.om, r.met, ald.pts && ald.pts.length >= 6 ? ald : null), NA, localKey(new Date()));
    if (ser._cor) log.korekcia = ser._cor;
    const keys = ser.best_match.map(x => x.k);
    const nowK = localKey(new Date()); let i0 = keys.indexOf(hourKey(nowK)); if (i0 < 0) i0 = 0;
    const risks = {}; for (const M of MODELS) if (ser[M.k] && !M.hide) risks[M.k] = riskSeries(ser[M.k]);
    log.models = Object.keys(risks);
    const cons = keys.map((_, i) => consensus(risks, i));
    let mx = 0, first = -1;
    for (let i = i0; i < Math.min(cons.length, i0 + S.hor); i++) { const c = cons[i]; if (c && c.L > mx) { mx = c.L; first = i; } }
    const prevSt = (await st.get('state', { type: 'json' })) || {};
    const prevL = +(prevSt.L || 0), prevOn = prevSt.on || '';
    log.L = mx; log.on = first >= 0 ? keys[first] : '';
    if (mx >= 2 && (mx > prevL || (prevOn && first >= 0 && keyNum(keys[first]) < keyNum(prevOn) - 2 * 36e5))) {
      const c = cons[first];
      const snowy = /Snež|sneh/i.test(c.tag); const lead = snowy ? 1 : S.lead;
      const startN = keyNum(keys[first]) - lead * 36e5, nowN = keyNum(nowK);
      const startK = new Date(startN).toISOString().slice(0, 16);
      const body = `Od ${whenLbl(keys[first], nowK)}. Výjazd: ${startN <= nowN ? 'ihneď' : whenLbl(startK, nowK)}. ${c.why.slice(0, 2).join('; ')}`;
      log.sent = await sendAll({ title: `❄ ${LVL[mx].n}: ${c.tag}`, body, tag: 'zu-mobis' });
      log.msg = body;
    }
    await st.setJSON('state', { L: mx, on: first >= 0 ? keys[first] : '', checked: log.at });
  } catch (e) { log.error = String(e.message || e); }
  log.ms = Date.now() - t0;
  await st.setJSON('log', log).catch(() => {});
  console.log(JSON.stringify(log));
};

export const config = { schedule: '*/15 * * * *' };
