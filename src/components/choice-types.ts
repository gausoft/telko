import type { Brand } from '../lib/schema';

export interface ChoiceItem {
  id: string;
  name: string;
  /** ISO country code of a flag in /public/flags. */
  flag?: string;
  brand?: Pick<Brand, 'name' | 'badge' | 'logo'>;
  /** Listed but not selectable yet. */
  soon?: boolean;
}
