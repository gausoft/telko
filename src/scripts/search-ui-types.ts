import type { Badge } from '../lib/schema';
import type { SearchDoc } from '../lib/search-types';

export interface SearchBrand {
  name: string;
  badge: Badge;
  logo: string | null;
}

export interface SearchPayload {
  docs: SearchDoc[];
  brands: Record<string, SearchBrand>;
  soon: string[];
}
