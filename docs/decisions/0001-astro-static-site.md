# 0001. Astro static site

**Status**: accepted, 2026-10-18

## Context

Most visitors arrive from a search engine, on a mobile phone with an average connection, looking for one code. Each offer and each task needs its own indexable page, generated from the JSON data. A few areas are interactive: code builders and the bundle comparator.

## Decision

Build the website with Astro in static output mode. Pages are generated at build time from `data/` with `getStaticPaths`. Interactive parts are React components loaded only where they are used.

## Alternatives considered

- **TanStack Start with prerendering**: works, but parameterized routes are not discovered automatically and every page ships the full application JavaScript.
- **Laravel with Inertia**: search engines need server-side rendering, which requires a Node process next to the PHP application in production. Too much infrastructure for a content site.

## Consequences

- Near-zero JavaScript on content pages, fast first render on slow networks.
- Hosting on any static host or CDN.
- Interactive components are plain React and can be reused if the project ever moves to a richer application.
