/** One published fee, already worded for display, with the band of amounts it covers. */
export interface FeeRow {
  operator: string;
  operation: string;
  /** What the fee applies to ("Retrait de 501 à 5 000 F"). */
  condition: string;
  /** The fee as shown ("100 F", "Gratuit", "entre 3 169 – 3 356 F", "Non publié"). */
  amount: string;
  min: number;
  max: number | null;
}

/** The rows of one operator that apply to an amount, grouped by kind of operation. */
export interface FeeQuote {
  operator: string;
  groups: { operation: string; rows: FeeRow[] }[];
}
