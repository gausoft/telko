# 0003. JSON data stored in the repository

**Status**: accepted, 2026-10-18

## Context

The dataset is small (hundreds of entries per country), changes a few times a month, and must be easy to review and correct by people who are not developers.

## Decision

Store all data as JSON files in `data/<country>/<operator>/<category>.json`, validated against `docs/data-schema.md` in continuous integration.

## Consequences

- Every change is a reviewable diff with its history, which serves as an audit trail for prices and codes.
- Anyone can reuse the dataset without an API.
- Organising by country from the start lets new countries be added without restructuring.
