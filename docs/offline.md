# Offline

Telko works without a connection once a device has visited it online.

## What is stored, and when

| What | When | Where |
|---|---|---|
| App shell: styles, scripts, Latin fonts, icons, flags, home and onboarding pages | First visit (service worker install) | Cache `telko-shell-<hash>` |
| Pages of the chosen country, and of the chosen operators only; brand images of the country | After onboarding, then on each online visit when the data version changed | Cache `telko-pages` |
| Catalog of the chosen operators | Same as above | IndexedDB `telko`, table `entries` |
| Habits (code id, count, last use) and the last 5 recipient numbers | When a code is dialed | IndexedDB `telko`, tables `usage`, `recipients` |

Pages of operators the visitor did not choose are never downloaded in advance; one opened online is kept.

## Files

- `scripts/service-worker.js`: the service worker. `scripts/build-sw.mjs` injects the shell list after `astro build`.
- `src/pages/offline/[country].json.ts`: the per-country pack (data version, pages, catalog).
- `src/scripts/offline-sync.ts`: downloads the pack for the visitor's choices.
- `src/db/`: the local database (Dexie). Schema changes add a new `version(n)`; never edit an existing one.

## Testing

Service workers need HTTPS, except on `localhost`. To try on a phone, expose the preview through a temporary HTTPS tunnel, visit once online, then switch to airplane mode.
