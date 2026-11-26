// Jednoduchý service worker: aplikácia sa otvorí aj bez signálu (posledná verzia stránky),
// dáta o počasí sa vždy načítavajú živé zo siete.
const C='zu-v36', SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url); if(u.origin!==location.origin||e.request.method!=='GET'||u.pathname.startsWith('/shmu/')||u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));});
self.addEventListener('notificationclick',e=>{e.notification.close(); e.waitUntil(self.clients.matchAll({type:'window'}).then(cs=>cs.length?cs[0].focus():self.clients.openWindow('./')));});
// Výstrahy zo servera (Web Push) – zobrazia sa aj pri zatvorenej aplikácii.
self.addEventListener('push',e=>{let d={}; try{d=e.data?e.data.json():{}}catch(_){d={body:e.data&&e.data.text()}}
  e.waitUntil(self.registration.showNotification(d.title||'Zimná údržba',{body:d.body||'',tag:d.tag||'zu-push',renotify:true,requireInteraction:true,icon:'icon-192.png',badge:'icon-192.png',vibrate:[300,150,300,150,300]}));});
