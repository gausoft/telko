export interface Recipient {
  /** ISO country code of the number. */
  country: string;
  /** National digits, without the country code. */
  number: string;
}
