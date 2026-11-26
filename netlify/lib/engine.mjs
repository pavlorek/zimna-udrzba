// GENEROVANÉ z src/app.html cez tools/build.py – needitovať ručne.
const location={protocol:'node:',host:''};
const localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{},key:()=>null,length:0};
const LAT=49.21228, LON=18.83431, TZ='Europe/Bratislava';
const LVL=[
  {n:'Bez zásahu',s:'OK',c:'--l0'},
  {n:'Pohotovosť',s:'Sledovať',c:'--l1'},
  {n:'Posyp',s:'Posyp',c:'--l2'},
  {n:'Pluhovanie / poľadovica',s:'Kritické',c:'--l3'}];
const MODELS=[
  {k:'aladin',sh:'ALD',n:'<b>SHMÚ ALADIN</b> (hlavný)',d:'SHMÚ 4,5 km'},
  {k:'best_match',hide:true,sh:'OM',n:'Open-Meteo best',d:'automatický výber modelu'},
  {k:'chmi_aladin_cz_1km',sh:'CZ1',n:'ALADIN ČHMÚ 1 km',d:'ČHMÚ, 1 km (lokálny, 3 dni)'},
  {k:'dmi_harmonie_arome_europe',sh:'HAR',n:'HARMONIE-AROME',d:'DMI, 2 km (lokálny, ~2,5 dňa)'},
  {k:'icon_eu',sh:'ICON',n:'ICON-EU',d:'DWD, 7 km'},
  {k:'met',sh:'yr',n:'yr.no / MET',d:'MET Norway (ECMWF + post-processing)'},];
const DAYS=['Ne','Po','Ut','St','Št','Pi','So'];
const DAYF=['nedeľa','pondelok','utorok','streda','štvrtok','piatok','sobota'];
const CARDS_OLD=[['fVer','Presnosť modelov (meranie SHMÚ)'],['fSum','Najbližších 48 h (mobil)'],['fMain','Graf teplôt a zrážok'],['fNow','Nowcast po 15 minútach'],['fEns','Pravdepodobnosti z ensemblov'],['fPc','Pravdepodobnostný konsenzus']];
const CARDS=[['cStatus','Stav teraz',1],['cAction','Najbližší zásah',1],['sum','Najbližších 48 h',1],['cTbl','Hodinová tabuľka'],['fZone','Plán zásahu podľa zón'],['cMatrix','Počasie po hodinách · porovnanie modelov'],['fMap','Animácia zrážok (ALADIN)'],['fMain','Graf teplôt a zrážok'],['fNow','Nowcast po 15 minútach'],['fEns','Pravdepodobnosti z ensemblov'],['fPc','Pravdepodobnostný konsenzus'],['fVer','Presnosť modelov (meranie SHMÚ)']];
const CARD_DEF_OFF={fMain:1,fNow:1,fEns:1,fPc:1,fVer:1};
const DEF={plow:3,lead:1,mode:'balanced',hor:12,ref:15,snd:'1',theme:'auto',fmSpeed:2000,show:{},autoW:'0',nowDet:'0',vis:null,order:null};
let S=Object.assign({},DEF);
try{Object.assign(S,JSON.parse(localStorage.getItem('zu_set')||'{}')); if(!localStorage.getItem('zu_v3')){S.lead=1; localStorage.setItem('zu_v3','1'); localStorage.setItem('zu_set',JSON.stringify(S));}}catch(e){}
if(!S.vis){ S.vis={}; for(const [id] of CARDS) S.vis[id]=!CARD_DEF_OFF[id]; S.vis.sum=!matchMedia('(max-width: 700px)').matches; if(S.show) for(const k in S.show) if(S.show[k]) S.vis[k==='fSum'?'sum':k]=true; }
const $=id=>document.getElementById(id);
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const fmt=(v,d=1)=>v==null||isNaN(v)?'–':(Math.round(v*10**d)/10**d).toFixed(d).replace('.',',');
const lsGet=(k)=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
function applyTheme(){ if(S.theme==='auto')document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme',S.theme);}

/* ---------- time helpers (all keys = local Bratislava "YYYY-MM-DDTHH:MM") ---------- */
const dtf=new Intl.DateTimeFormat('sv-SE',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const localKey=d=>dtf.format(d).replace(' ','T');
const keyNum=k=>Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10),+k.slice(11,13),+k.slice(14,16));
const hourKey=k=>k.slice(0,13)+':00';
const dow=k=>DAYS[new Date(Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))).getUTCDay()];
const hh=k=>k.slice(11,16);
const dayLbl=(k,nowK)=>{const d=k.slice(0,10), n=nowK.slice(0,10); const diff=Math.round((keyNum(d+'T00:00')-keyNum(n+'T00:00'))/864e5);
  return diff===0?'dnes':diff===1?'zajtra':diff===-1?'včera':dow(k)+' '+(+k.slice(8,10))+'.'+(+k.slice(5,7))+'.';};
const whenLbl=(k,nowK)=>dayLbl(k,nowK)+' '+hh(k);
const fullDay=k=>DAYF[new Date(Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))).getUTCDay()]+' '+(+k.slice(8,10))+'.'+(+k.slice(5,7))+'.';
const dt2=(k,nowK)=>`<span class="dd">${fullDay(k)}${k.slice(0,10)===nowK.slice(0,10)?' (dnes)':''}</span>${hh(k)}`;

/* ---------- data fetch ---------- */
const HV='temperature_2m,dew_point_2m,relative_humidity_2m,soil_temperature_0cm,surface_temperature,precipitation,rain,showers,snowfall,snow_depth,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover,precipitation_probability';
const MV='temperature_2m,dew_point_2m,precipitation,rain,snowfall,weather_code';
async function getJSON(u){const r=await fetch(u,{cache:'no-store'}); if(!r.ok) throw new Error(r.status+' '+u.split('?')[0]); return r.json();}
async function loadAll(){
  const om=`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&hourly=${HV}&minutely_15=${MV}&models=best_match,icon_eu,chmi_aladin_cz_1km,dmi_harmonie_arome_europe&past_days=1&forecast_days=4&timezone=${encodeURIComponent(TZ)}`;
  const met=`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${LAT.toFixed(4)}&lon=${LON.toFixed(4)}&altitude=350`;
  const ens=`https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${LAT}&longitude=${LON}&hourly=temperature_2m,precipitation,snowfall&models=icon_seamless,ecmwf_ifs025&forecast_days=4&timezone=${encodeURIComponent(TZ)}`;
  const [a,b,c]=await Promise.allSettled([getJSON(om),getJSON(met),getJSON(ens)]);
  return {om:a.value,met:b.value,ens:c.value,errs:[a,b,c].filter(x=>x.status==='rejected').map(x=>x.reason.message)};
}

/* ---------- SHMÚ ALADIN 4,5 km (opendata.shmu.sk, GRIB2) ---------- */
const ALD={
  base:(location.protocol==='https:'||location.protocol==='http:')&&!/opendata\.shmu\.sk$/.test(location.host)?'/shmu':'https://opendata.shmu.sk',
  dir:'/meteorology/weather/nwp/aladin/sk/4.5km/',
  lcc(lat,lon,g){const R=6371229,rad=Math.PI/180,n=Math.sin(g.latin*rad);const F=Math.cos(g.latin*rad)*Math.pow(Math.tan(Math.PI/4+g.latin*rad/2),n)/n;
    const rho=p=>R*F/Math.pow(Math.tan(Math.PI/4+p*rad/2),n);const xy=(la,lo)=>{const th=n*(lo-g.lov)*rad;return [rho(la)*Math.sin(th),-rho(la)*Math.cos(th)]};
    const [x0,y0]=xy(g.la1,g.lo1),[x,y]=xy(lat,lon);return [(x-x0)/g.dx,(y-y0)/g.dy];},
  ilcc(i,j,g){const R=6371229,rad=Math.PI/180,n=Math.sin(g.latin*rad);const F=Math.cos(g.latin*rad)*Math.pow(Math.tan(Math.PI/4+g.latin*rad/2),n)/n;
    const rho=p=>R*F/Math.pow(Math.tan(Math.PI/4+p*rad/2),n);const th0=n*(g.lo1-g.lov)*rad,r0=rho(g.la1);
    const x=r0*Math.sin(th0)+i*g.dx, y=-r0*Math.cos(th0)+j*g.dy; const r=Math.sign(n)*Math.hypot(x,y), th=Math.atan2(x,-y);
    return [(2*Math.atan(Math.pow(R*F/r,1/n))-Math.PI/2)/rad, g.lov+th/n/rad];},
  parse(ab){const b=new DataView(ab),u8=new Uint8Array(ab),msgs=[];let o=0;const sm=v=>v&0x80000000?-(v&0x7fffffff):v;
    while(o<b.byteLength-16){if(b.getUint32(o)!==0x47524942){o++;continue}const tot=Number(b.getBigUint64(o+8));let s=o+16;const m={};
      while(s<o+tot-4){const len=b.getUint32(s),num=b.getUint8(s+4);
        if(num===3)m.g={nx:b.getUint32(s+30),ny:b.getUint32(s+34),la1:sm(b.getUint32(s+38))/1e6,lo1:sm(b.getUint32(s+42))/1e6,lov:sm(b.getUint32(s+51))/1e6,dx:b.getUint32(s+55)/1e3,dy:b.getUint32(s+59)/1e3,latin:sm(b.getUint32(s+65))/1e6};
        if(num===4){m.cat=b.getUint8(s+9);m.par=b.getUint8(s+10);m.lvT=b.getUint8(s+22);m.lv=b.getUint32(s+24)}
        if(num===5){m.R=b.getFloat32(s+11);const e=b.getUint16(s+15),d=b.getUint16(s+17);m.E=e&0x8000?-(e&0x7fff):e;m.D=d&0x8000?-(d&0x7fff):d;m.bits=b.getUint8(s+19)}
        if(num===6&&b.getUint8(s+5)===0)m.bm=s+6;
        if(num===7)m.data=s+5;
        if(len<=0)break; s+=len;}
      msgs.push(m);o+=tot;}
    return {msgs,u8};},
  val(P,m,idx){if(!m)return null;const u8=P.u8;let k=idx;
    if(m.bm!=null){if(!((u8[m.bm+(idx>>3)]>>(7-(idx&7)))&1))return null;k=0;for(let i=0;i<idx;i++)if((u8[m.bm+(i>>3)]>>(7-(i&7)))&1)k++;}
    if(!m.bits)return m.R/Math.pow(10,m.D);
    const bit=k*m.bits;let x=0;for(let i=0;i<m.bits;i++){const p=bit+i;x=x*2+((u8[m.data+(p>>3)]>>(7-(p&7)))&1)}
    return (m.R+x*Math.pow(2,m.E))/Math.pow(10,m.D);},
  interp(P,m,g,fi,fj){const i0=Math.floor(fi),j0=Math.floor(fj),di=fi-i0,dj=fj-j0;let s=0,w=0;
    for(const [a,b,ww] of [[0,0,(1-di)*(1-dj)],[1,0,di*(1-dj)],[0,1,(1-di)*dj],[1,1,di*dj]]){const v=this.val(P,m,(j0+b)*g.nx+(i0+a));if(v!=null){s+=v*ww;w+=ww}}
    return w?s/w:null;},
  pick(P,c,p,lt,lv){return P.msgs.find(m=>m.cat===c&&m.par===p&&m.lvT===lt&&(lv==null||m.lv===lv))},
  async list(p){const r=await fetch(this.base+this.dir+p,{cache:'no-store'});if(!r.ok)throw new Error('ALADIN '+r.status);const t=await r.text();return [...t.matchAll(/href="([^"?/][^"]*)"/g)].map(m=>m[1]);},
  async latestRun(){const now=new Date();
    for(let d=0;d<2;d++){const day=new Date(now-d*864e5).toISOString().slice(0,10).replace(/-/g,'');let runs=[];try{runs=(await this.list(day+'/')).filter(x=>/^\d{4}\/$/.test(x)).sort().reverse()}catch(e){if(d===0)continue;throw e}
      for(const r of runs){const f=await this.list(day+'/'+r);const st=f.map(x=>+((x.match(/_(\d{3})-/)||[])[1])).filter(x=>!isNaN(x));
        const need=r==='0000/'?102:72; if(st.length&&Math.max(...st)>=need) return {day,run:r.slice(0,4),max:Math.max(...st)};}}
    throw new Error('ALADIN: žiadny kompletný beh');},
  cached(){try{let best=null;for(const k of Object.keys(localStorage))if(k.startsWith('zu_ald4_')&&(!best||k>best))best=k;if(!best)return null;const j=JSON.parse(localStorage.getItem(best));return j&&j.pts&&j.pts.length?j:null}catch(e){return null}},
  async load(lat,lon,hoursAhead){
    const R=await this.latestRun(); const key='zu_ald4_'+R.day+R.run;
    try{const c=localStorage.getItem(key);if(c){const j=JSON.parse(c);if(j&&j.pts&&j.pts.length)return j;}}catch(e){}
    const runT=Date.UTC(+R.day.slice(0,4),+R.day.slice(4,6)-1,+R.day.slice(6,8),+R.run.slice(0,2));
    const s0=Math.max(0,Math.floor((Date.now()-runT)/36e5)-7), s1=Math.min(R.max,Math.ceil((Date.now()-runT)/36e5)+hoursAhead);
    const steps=[];for(let s=s0;s<=s1;s++)steps.push(s);
    const res={};let geo=null;
    const one=async s=>{const u=`${this.base}${this.dir}${R.day}/${R.run}/al-grib_sk_${String(s).padStart(3,'0')}-${R.day}-${R.run}-nwp-.grb`;
      const r=await fetch(u);if(!r.ok)throw new Error('ALADIN '+r.status);const P=this.parse(await r.arrayBuffer());
      const g=P.msgs[0].g;if(!geo){const [fi,fj]=this.lcc(lat,lon,g);geo={g,fi,fj}}
      const v=(c,p,lt,lv)=>this.interp(P,this.pick(P,c,p,lt,lv),geo.g,geo.fi,geo.fj);
      const gu=v(2,23,103),gv=v(2,24,103),u10=v(2,2,103,10),v10=v(2,3,103,10);
      const GR=12, ci=Math.round(geo.fi), cj=Math.round(geo.fj), mt=this.pick(P,1,193,1), m2=this.pick(P,0,0,103,2), m8=this.pick(P,0,0,100,85000);
      if(!geo.grid) geo.grid={R:GR,ci,cj};
      const gtp=[],gt2=[],gt8=[]; for(let j=cj-GR;j<=cj+GR;j++) for(let i=ci-GR;i<=ci+GR;i++){ const idx=j*g.nx+i;
        const a=this.val(P,mt,idx), b2=this.val(P,m2,idx), c8=this.val(P,m8,idx);
        gtp.push(a==null?0:Math.round(Math.max(0,a)*100)/100); gt2.push(b2==null?null:Math.round((b2-273.15)*10)/10); gt8.push(c8==null?null:Math.round((c8-273.15)*10)/10); }
      res[s]={grid:{tp:gtp,t2:gt2,t8:gt8},t2:v(0,0,103,2),t925:v(0,0,100,92500),t850:v(0,0,100,85000),r925:v(1,1,100,92500),tp:v(1,193,1),
        gust:gu!=null?Math.hypot(gu,gv)*3.6:null,wind:u10!=null?Math.hypot(u10,v10)*3.6:null};};
    const q=steps.slice();const workers=Array.from({length:4},async()=>{while(q.length){const s=q.shift();try{await one(s)}catch(e){try{await new Promise(r=>setTimeout(r,800));await one(s)}catch(e2){}}}});
    await Promise.all(workers);
    const pts=[];for(const s of steps){const x=res[s];if(!x||x.t2==null)continue;const p=res[s-1];
      const pr=s===0?0:(x.tp!=null?Math.max(0,x.tp):null); /* SHMÚ GRIB 1/193 = úhrn za poslednú hodinu (nie akumulácia od štartu) */
      pts.push({t:new Date(runT+s*36e5).toISOString(),t2:x.t2-273.15,t925:x.t925!=null?x.t925-273.15:null,t850:x.t850!=null?x.t850-273.15:null,r925:x.r925,pr,gust:x.gust,wind:x.wind});}
    if(pts.length<12) throw new Error('ALADIN: neúplné dáta');
    const grid=geo&&geo.grid?Object.assign({},geo.grid,{g:geo.g,steps:steps.filter(s=>res[s]&&res[s].grid).map(s=>Object.assign({t:new Date(runT+s*36e5).toISOString()},res[s].grid))}):null;
    const out={run:R.day+' '+R.run,pts,grid};
    try{for(const k of Object.keys(localStorage))if(k.startsWith('zu_ald')&&k!==key)localStorage.removeItem(k);localStorage.setItem(key,JSON.stringify(out))}catch(e){}
    return out;}
};

/* ---------- normalize ---------- */
function buildSeries(om,met,ald){
  const H=om.hourly, T=H.time; const series={};
  const g=(v,m,i)=>{const a=H[v+'_'+m]; return a?a[i]:null};
  for(const M of MODELS){ if(M.k==='met') continue;
    if(!H['temperature_2m_'+M.k]) continue;
    series[M.k]=T.map((t,i)=>{ if(g('temperature_2m',M.k,i)==null) return {k:t,missing:true};
      let ts=g('soil_temperature_0cm',M.k,i); if(ts==null) ts=g('surface_temperature',M.k,i); if(ts==null) ts=g('soil_temperature_0cm','best_match',i);
      const rain=(g('rain',M.k,i)||0)+(g('showers',M.k,i)||0);
      return {k:t,t2:g('temperature_2m',M.k,i),td:g('dew_point_2m',M.k,i),rh:g('relative_humidity_2m',M.k,i),ts,
        pr:g('precipitation',M.k,i)||0,rain,snow:g('snowfall',M.k,i)||0,sd:g('snow_depth',M.k,i),code:g('weather_code',M.k,i),
        wind:g('wind_speed_10m',M.k,i),gust:g('wind_gusts_10m',M.k,i),cloud:g('cloud_cover',M.k,i),pp:g('precipitation_probability',M.k,i)};
    });
  }
  const base=series.best_match;
  if(met){
    const map={}, pmap={};
    // yr.no: okamžité hodnoty platia v čase e.time; next_1_hours = úhrn e.time→e.time+1h.
    // Open-Meteo/ALADIN dávajú úhrn za hodinu KONČIACU v danom čase → zrážky z yr posúvame o +1 h.
    for(const e of met.properties.timeseries){
      const n1=e.data.next_1_hours; if(!n1) continue;
      const d=e.data.instant.details; const k=localKey(new Date(e.time));
      map[k]={t2:d.air_temperature,td:d.dew_point_temperature,rh:d.relative_humidity,
        wind:d.wind_speed!=null?d.wind_speed*3.6:null,gust:d.wind_speed_of_gust!=null?d.wind_speed_of_gust*3.6:null,cloud:d.cloud_area_fraction,fog:d.fog_area_fraction};
      const p=n1.details.precipitation_amount||0, sym=n1.summary.symbol_code||'', tt=d.air_temperature;
      let snow=0,rain=0;
      if(/snow/.test(sym)) snow=p*(tt<-3?1.3:1.0);
      else if(/sleet/.test(sym)){snow=p*.5;rain=p*.5}
      else if(/rain/.test(sym)) rain=p;
      else if(p>0){ if(tt<=0.5) snow=p*(tt<-3?1.3:1.0); else if(tt<=2){snow=p*.5;rain=p*.5} else rain=p; }
      pmap[localKey(new Date(Date.parse(e.time)+36e5))]={pr:p,rain,snow,sym,pp:n1.details.probability_of_precipitation};
    }
    for(const k in map){ const q=pmap[k]; if(q) Object.assign(map[k],q); else Object.assign(map[k],{pr:0,rain:0,snow:0,sym:'',pp:null}); }
    series.met=base.map(b=>{const m=map[b.k]; if(!m) return {k:b.k,missing:true};
      // povrch: model zeme z best match, korigovaný o rozdiel teplôt vzduchu
      const ts=b.ts!=null&&b.t2!=null?b.ts+(m.t2-b.t2)*.7:m.t2;
      return Object.assign({k:b.k,ts,sd:b.sd,code:null},m);});
    series._metUpdated=met.properties.meta&&met.properties.meta.updated_at;
  }
  if(ald&&ald.pts&&ald.pts.length){
    const map={}; for(const p of ald.pts) map[localKey(new Date(p.t))]=p;
    let any=false;
    series.aladin=base.map(b=>{const p=map[b.k]; if(!p||p.t2==null||b.t2==null) return {k:b.k,missing:true}; any=true;
      const t2=p.t2, dT=t2-b.t2, pr=p.pr||0;
      const ts=b.ts!=null?b.ts+dT*0.7:t2;
      let td=b.td!=null?Math.min(t2,b.td+dT*0.6):t2-2;
      const es=x=>6.112*Math.exp(17.62*x/(243.12+x)); const rh=Math.min(100,100*es(td)/es(t2));
      let snow=0,rain=0,code=null; const t850=p.t850;
      if(pr>=0.05){
        if(t2<=1&&(t850==null||t850<=-1)){snow=pr*(t2<-3?1.3:1.0);code=snow>=0.5?73:71}
        else if(t2<=2.5&&t850!=null&&t850<=0.5){snow=pr*.5;rain=pr*.5;code=68}
        else {rain=pr;code=(t2<=0.3&&t850!=null&&t850>0)?66:61}
      }
      return {k:b.k,t2,td,rh,ts,pr,rain,snow,sd:b.sd,code,wind:p.wind,gust:p.gust,t850,pp:null};});
    if(!any) delete series.aladin;
  }
  const A=series.aladin;
  series.prim=base.map((b,i)=>{const a=A&&A[i]&&!A[i].missing?A[i]:null;
    if(!a) return Object.assign({},b,{src:'om'});
    return Object.assign({},b,{t2:a.t2,td:a.td,rh:a.rh,ts:a.ts,pr:a.pr,rain:a.rain,snow:a.snow,wind:a.wind!=null?a.wind:b.wind,gust:a.gust!=null?a.gust:b.gust,
      code:a.code!=null?a.code:(b.code>=51?3:b.code),src:'aladin'});});
  return series;
}


/* ---------- korekcia podľa merania (Netatmo) ----------
   Odchýlka modelu od aktuálneho merania sa pripočíta k predpovedi a lineárne zoslabne do 6 h.
   Rovnako sa opraví rosný bod; teplota povrchu o 70 % odchýlky vzduchu. Max ±4 °C. */
function naCorrect(ser,NA,nowK){
  if(!NA||NA.t==null||!ser||!ser.best_match) return ser;
  const keys=ser.best_match.map(x=>x.k), i0=keys.indexOf(hourKey(nowK)); if(i0<0) return ser;
  const frac=(+nowK.slice(14,16))/60, cl=x=>Math.max(-4,Math.min(4,x));
  const es=x=>6.112*Math.exp(17.62*x/(243.12+x));
  const out={}, info={};
  for(const k in ser){ const a=ser[k]; if(!Array.isArray(a)){ out[k]=a; continue; }
    const c=a[i0], n=a[i0+1]; if(!c||c.missing||c.t2==null){ out[k]=a; continue; }
    const ok=n&&!n.missing&&n.t2!=null, mt=ok?c.t2+(n.t2-c.t2)*frac:c.t2, b=cl(NA.t-mt);
    let bd=b; if(NA.td!=null&&c.td!=null){ const md=ok&&n.td!=null?c.td+(n.td-c.td)*frac:c.td; bd=cl(NA.td-md); }
    info[k]=Math.round(b*10)/10;
    out[k]=a.map((h,i)=>{ const dh=i-i0; if(!h||h.missing||h.t2==null||dh<0||dh>=6) return h; const w=1-dh/6;
      const t2=h.t2+b*w, td=h.td!=null?Math.min(t2,h.td+bd*w):h.td, rh=td!=null?Math.min(100,100*es(td)/es(t2)):h.rh;
      return Object.assign({},h,{t2,td,rh,ts:h.ts!=null?h.ts+b*w*0.7:h.ts,cor:b*w}); });
  }
  out._cor=info; return out;
}

/* ---------- risk engine ---------- */
const FREEZE=[56,57,66,67];
const ST={
  ok:{n:'Bez zrážok',s:'Bez zrážok',c:'#cbd5e1',t:'#0f172a'},
  fr:{n:'Mráz, sucho',s:'Mráz',c:'#bfdbfe',t:'#0f172a'},
  po:{n:'Pohotovosť (okolo 0 °C)',s:'Pohotovosť',c:'#facc15',t:'#0f172a'},
  ho:{n:'Námraza / inovať',s:'Námraza',c:'#22d3ee',t:'#0f172a'},
  rf:{n:'Zamŕzanie mokrej vozovky',s:'Zamŕzanie',c:'#0e7490',t:'#ffffff'},
  raL:{n:'Slabý dážď',s:'Slabý dážď',c:'#93c5fd',t:'#0f172a'},
  ra:{n:'Dážď',s:'Dážď',c:'#3b82f6',t:'#ffffff'},
  raH:{n:'Silný dážď',s:'Silný dážď',c:'#1e3a8a',t:'#ffffff'},
  sl:{n:'Dážď so snehom',s:'Dážď+sneh',c:'#a78bfa',t:'#0f172a'},
  snL:{n:'Slabé sneženie',s:'Slabé sneženie',c:'#e9d5ff',t:'#0f172a'},
  sn:{n:'Sneženie',s:'Sneženie',c:'#c026d3',t:'#ffffff'},
  snH:{n:'Intenzívne sneženie',s:'Intenzívne sneh.',c:'#6b21a8',t:'#ffffff'},
  fz:{n:'Mrznúci dážď / poľadovica',s:'Poľadovica',c:'#dc2626',t:'#ffffff'}};
const ST_ORDER=['ok','fr','po','raL','ra','raH','ho','rf','snL','sn','snH','sl','fz'];
function riskSeries(arr){
  let lastWet=-99, cum=0, dry=99; const out=[];
  for(let i=0;i<arr.length;i++){
    const h=arr[i];
    if(!h||h.missing||h.t2==null){out.push(null);continue;}
    const ts=h.ts!=null?h.ts:h.t2, td=h.td!=null?h.td:h.t2-2, rh=h.rh!=null?h.rh:80;
    const prev=arr[i-1];
    const melt=prev&&prev.sd!=null&&h.sd!=null&&h.sd<prev.sd-0.003&&h.t2>0.3;
    const liquid=h.rain>=0.1;
    if(h.snow>=0.05){cum+=h.snow;dry=0}else{dry++; if(dry>=4) cum=0;}
    const wetPrev=(i-lastWet)<=3;
    if(liquid||melt) lastWet=i;
    let L=0; const why=[]; let tag='';
    const up=(l,t,w)=>{if(l>L){L=l;tag=t} if(w) why.push(w)};
    if(FREEZE.includes(h.code)) up(3,'Mrznúci dážď','model hlási mrznúce zrážky');
    if(liquid && (ts<=0 || h.t2<=0.5)) up(3,'Poľadovica',`dážď ${fmt(h.rain)} mm pri povrchu ${fmt(ts)} °C`);
    if(h.snow>=1) up(3,'Intenzívne sneženie',`${fmt(h.snow)} cm/h`);
    if(h.snow>=0.05 && cum>=S.plow) up(3,`Nový sneh ${fmt(cum)} cm`,`nový sneh ${fmt(cum)} cm ≥ ${S.plow} cm`);
    if(h.snow>=0.1) up(2,'Sneženie',`sneh ${fmt(h.snow)} cm/h`);
    if(h.snow>=0.05 && liquid && ts<=1) up(2,'Dážď so snehom','zmiešané zrážky');
    if(!liquid && h.snow<0.05 && wetPrev && ts<=0) up(2,'Zamŕzanie mokrého povrchu',`mokrý povrch, ${fmt(ts)} °C`);
    if(ts<=0 && td>=ts-0.3 && rh>=88) up(2,'Námraza',`rosný bod ${fmt(td)} ≥ povrch ${fmt(ts)} °C`);
    if(h.snow>=0.02 && h.snow<0.1) up(1,'Slabé sneženie',`${fmt(h.snow,2)} cm/h`);
    if(ts<=0.5 && rh>=85) up(1,'Riziko námrazy',`povrch ${fmt(ts)} °C, vlhkosť ${Math.round(rh)} %`);
    if(ts>=-2 && ts<=2 && (h.pp||0)>=30) up(1,'Zrážky okolo 0 °C',`pravd. zrážok ${h.pp} %`);
    if(h.code===48 && ts<=0) up(1,'Námrazová hmla','');
    if(h.gust>=45 && h.sd>=0.03) up(1,'Záveje','nárazy '+Math.round(h.gust)+' km/h pri snehovej pokrývke');
    let st='ok';
    if(FREEZE.includes(h.code)||(liquid&&(ts<=0||h.t2<=0.5))) st='fz';
    else if(h.snow>=1) st='snH';
    else if(h.snow>=0.05&&liquid) st='sl';
    else if(h.snow>=0.3) st='sn';
    else if(h.snow>=0.05) st='snL';
    else if(liquid) st=h.rain>=2?'raH':(h.rain>=0.5?'ra':'raL');
    else if(wetPrev&&ts<=0) st='rf';
    else if(ts<=0&&td>=ts-0.3&&rh>=88) st='ho';
    else if(L>=1) st='po';
    else if(ts<=0) st='fr';
    out.push({L,tag:tag||'Bez rizika',why,cum,ts,snow:h.snow,rain:h.rain,st});
  }
  return out;
}
function consensus(risks,i){
  const ks=Object.keys(risks).filter(k=>risks[k][i]);
  if(!ks.length) return null;
  if(S.mode==='best'){const k0=risks.aladin&&risks.aladin[i]?'aladin':'chmi_aladin_cz_1km'; if(risks[k0]&&risks[k0][i]) return Object.assign({},risks[k0][i],{src:[k0]});}
  const lv=ks.map(k=>risks[k][i].L).sort((a,b)=>b-a);
  const L=S.mode==='max'?lv[0]:(lv.length>1?lv[1]:lv[0]);
  const pick=['aladin','chmi_aladin_cz_1km','dmi_harmonie_arome_europe','best_match','met','ecmwf_ifs025','icon_eu','meteofrance_arpege_europe','ukmo_global_deterministic_10km','gfs_seamless'].find(k=>risks[k]&&risks[k][i]&&risks[k][i].L===L)||ks[0];
  const agree=ks.filter(k=>risks[k][i].L>=L&&L>0);
  return Object.assign({},risks[pick][i],{L,src:agree,n:ks.length});
}
function material(ts){
  if(ts>=-6) return 'Soľ NaCl · 10–20 g/m²';
  if(ts>=-12) return 'Zvlhčená soľ NaCl + CaCl₂ · 15–25 g/m²';
  return 'Inertný posyp (drť 2/4) · 100–200 g/m²';
}

/* ---------- ensemble ---------- */
function ensProbs(ens,keys){
  if(!ens) return null;
  const H=ens.hourly, idx={}; ens.hourly.time.forEach((t,i)=>idx[t]=i);
  const mem={};
  for(const k of Object.keys(H)){
    const m=k.match(/^(temperature_2m|precipitation|snowfall)(_member\d+)?(_.+)?$/); if(!m) continue;
    const id=(m[2]||'_ctl')+(m[3]||''); (mem[id]=mem[id]||{})[m[1]]=H[k];
  }
  const members=Object.values(mem).filter(x=>x.temperature_2m&&x.snowfall&&x.precipitation);
  const out=keys.map(k=>{const i=idx[k]; if(i==null) return null; let s=0,f=0,w=0,n=0;
    for(const M of members){const t=M.temperature_2m[i],sn=M.snowfall[i],p=M.precipitation[i]; if(t==null) continue; n++;
      if(sn>=0.1)s++; if(t<=0)f++; if(p>=0.1&&t<=1)w++;}
    return n?{snow:s/n*100,frost:f/n*100,winter:w/n*100,n}:null;});
  return {out,members,idx};
}
function ensSnowProb(E,startKey,hours,thr){
  if(!E) return null; const i0=E.idx[startKey]; if(i0==null) return null; let ok=0,n=0;
  for(const M of E.members){let s=0,valid=true; for(let i=i0;i<i0+hours;i++){const v=M.snowfall[i]; if(v==null){valid=false;break} s+=v} if(!valid) continue; n++; if(s>=thr) ok++;}
  return n?{p:ok/n*100,n}:null;
}


export {LAT,LON,TZ,LVL,MODELS,DEF,S,fmt,localKey,keyNum,hourKey,hh,dayLbl,whenLbl,fullDay,HV,MV,loadAll,ALD,buildSeries,naCorrect,riskSeries,consensus,material};
