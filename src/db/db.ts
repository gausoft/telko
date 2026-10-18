import { Dexie, type EntityTable } from 'dexie';

import type { EntryRow, MetaRow, RecipientRow, UsageRow } from './db-types';

/**
 * The device's local database. Version numbers only go up: a schema change adds
 * a new `version(n)` block, so existing users keep their habits and recipients.
 */
export class TelkoDb extends Dexie {
  entries!: EntityTable<EntryRow, 'id'>;
  meta!: EntityTable<MetaRow, 'key'>;
  usage!: EntityTable<UsageRow, 'entryId'>;
  recipients!: EntityTable<RecipientRow, 'key'>;

  constructor() {
    super('telko');
    this.version(1).stores({
      entries: 'id, country, operator, category',
      meta: 'key',
      usage: 'entryId, [country+operator], lastUsedAt',
      recipients: 'key, country, usedAt',
    });
  }
}

export const db = new TelkoDb();
