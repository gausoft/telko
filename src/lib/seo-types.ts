import type { Brand } from './schema';

/** One step of the breadcrumb Google shows under a result. */
export interface Crumb {
  name: string;
  path: string;
}

/** What search engines and link previews read about one page. */
export interface PageSeo {
  title: string;
  description: string;
  /** Canonical path, without the site address. */
  path: string;
  /** Path of the 1200 × 630 share image. */
  image: string;
  imageAlt: string;
  noindex: boolean;
  crumbs: Crumb[];
}

/** Content of one share image, rendered at build time. */
export interface ShareCard {
  slug: string;
  eyebrow: string;
  title: string;
  /** A short selling line, such as "5 Go · 599 F". */
  highlight: string | null;
  /** File names under public/brands. */
  logos: string[];
}

/** Heading, description and selling line of a section page, written from its real offers. */
export interface SectionFacts {
  heading: string;
  description: string;
  highlight: string | null;
  brand: Brand;
}
