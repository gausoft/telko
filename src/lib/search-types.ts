export interface SearchDoc {
  id: string;
  country: string;
  operator: string;
  title: string;
  subtitle: string;
  code: string;
  dialable: boolean;
  terms: string[];
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
  local: boolean;
}
