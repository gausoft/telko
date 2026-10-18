# Telko: contributor guide for agents

Telko is an open dataset and static website listing mobile offers and USSD codes for operators in Togo (Yas Togo, Moov Africa Togo), with code builders that launch the dialer through `tel:` links.

## Rules

- **Data first.** `data/` is the source of truth. Every entry follows `docs/data-schema.md` and carries its provenance (sources, verification status, date).
- **Never mark data as verified** unless it was tested on a real device or confirmed by an official operator page, as defined in `docs/verification-protocol.md`.
- **PIN codes never leave the user.** No PIN in storage, share links, history or prefilled fields.
- **Brand marks.** Operator and mobile money logos live in `public/brands/` with their source, and are shown only while `SHOW_BRAND_LOGOS` is enabled in `src/config.ts`. Every brand also has a badge (`operators.json`), used as fallback. Never recolor or alter a logo.
- **English** for code, docs and commit messages. User-facing content (offer names, descriptions, page copy) is in French.
- **Static only.** No server, no database, no account system.
- **Commits**: conventional commits, imperative subject, 60 characters max.
