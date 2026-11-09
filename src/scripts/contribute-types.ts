/** What the page embeds for the assistant script: where drafts go and the texts it draws itself. */
export interface ContributeData {
  repoUrl: string;
  /** Where to post the submission. Empty: use the GitHub link. */
  endpoint: string;
  /** Turnstile public key. Empty: no widget. */
  siteKey: string;
  country: string;
  lang: 'fr' | 'en';
  text: { sending: string; send: string };
  template: string;
  errors: { operator: string; service: string; name: string; codeEmpty: string; codeFormat: string; details: string; send: string; captcha: string };
  partKinds: Record<'fixed' | 'phone' | 'amount', string>;
  proofs: Record<'device' | 'official' | 'other', string>;
}
