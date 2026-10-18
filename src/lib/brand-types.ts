import type { Badge } from './schema';

/** A brand as the client draws it: `logo` is a ready URL, or null to draw the badge. */
export interface BrandView {
  name: string;
  badge: Badge;
  logo: string | null;
}

/** Marks of one operator: its own, and its mobile money service when it has one. */
export interface OperatorBrands {
  operator: BrandView;
  money: BrandView | null;
}
