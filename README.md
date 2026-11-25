# Zimná údržba – Mobis Slovakia (Gbeľany)

PWA s hodinovou predpoveďou a výstrahami pre zimnú údržbu areálu. Beží na Netlify.

- `src/app.html` – zdroj aplikácie (bez knižníc)
- `tools/build.py` – zostaví `public/index.html` a `netlify/lib/engine.mjs` (výpočtové jadro pre server)
- `public/` – to, čo sa zverejní (index.html, service worker, ikony, `_redirects` pre SHMÚ)
- `netlify/functions/push.mjs` – `/api/push`: prihlásenie/odhlásenie zariadení, `?stav` = posledná kontrola
- `netlify/functions/alert.mjs` – plánovaná funkcia každých 15 min: SHMÚ ALADIN + Open-Meteo modely + yr.no → konsenzus rizika → Web Push

VAPID kľúče aj zoznam zariadení sú v Netlify Blobs (vytvoria sa automaticky), nie v kóde.

Po zmene `src/app.html` spustiť `python3 tools/build.py` a commitnúť aj vygenerované súbory.
