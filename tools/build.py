"""Zostaví public/index.html (vloží Chart.js) a netlify/lib/engine.mjs
(výpočtové jadro vytiahnuté z aplikácie, aby server počítal riziko rovnako ako appka).
Spustenie z koreňa repozitára:  python3 tools/build.py"""
import re
s=open('src/app.html',encoding='utf-8').read()
cj=open('vend/chart.umd.js',encoding='utf-8').read()
assert '</script' not in cj
open('public/index.html','w',encoding='utf-8').write(s.replace('/*CHARTJS*/',cj,1))

def cut(a,b):
    i=s.index(a); j=s.index(b,i); return s[i:j]
core=cut("const LAT=","/* ---------- weather codes")+cut("/* ---------- data fetch","/* ---------- state ---------- */")
core=core.replace("applyTheme();\n","")
hdr='''// GENEROVANÉ z src/app.html cez tools/build.py – needitovať ručne.
const location={protocol:'node:',host:''};
const localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{},key:()=>null,length:0};
'''
ftr='''
export {LAT,LON,TZ,LVL,MODELS,DEF,S,fmt,localKey,keyNum,hourKey,hh,dayLbl,whenLbl,fullDay,HV,MV,loadAll,ALD,buildSeries,riskSeries,consensus,material};
'''
open('netlify/lib/engine.mjs','w',encoding='utf-8').write(hdr+core+ftr)
print('ok', len(s), len(core))
