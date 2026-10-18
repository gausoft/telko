# 0002. No backend in version 1

**Status**: accepted, 2026-10-18

## Context

Version 1 only reads data. Writes (corrections, reports, new offers) can go through GitHub issues and pull requests. The project has no revenue and must cost almost nothing to run.

## Decision

No server, no database, no user accounts in version 1. Favorites and history, if any, stay in the browser's local storage, without PIN codes.

## Consequences

- Hosting cost close to zero, nothing to secure on the server side.
- Contributions require a GitHub account at first. A simpler report form may come later.
- If moderation, a public API with keys or notifications become necessary, a separate API service will be added next to the static site, without rewriting it.
