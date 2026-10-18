/** ready: the device has everything for the current choices. stale: the choices changed meanwhile, a newer sync takes over. */
export type SyncResult = 'ready' | 'skipped' | 'partial' | 'stale';

export interface Selection {
  country: string;
  operators: string[];
}
