import type { SectionCopyContext, SeoCopy } from './seo-copy-types';
import type { SectionId } from './sections';

const SIGNATURE = 'All your mobile services, in one place.';

export const seoCopyEn: SeoCopy = {
  signature: SIGNATURE,
  defaultEyebrow: 'USSD codes · bundles · mobile money',
  splashDescription: `${SIGNATURE} USSD codes, bundles and mobile money, even offline.`,
  imageAlt: (text) => `Telko: ${text}`,
  homeTitle: (country) => `USSD codes, bundles and mobile money · ${country} · Telko`,
  homeDescription: (operators, money) =>
    `Data, calls, ${joinList(['bills', ...money])}: every ${joinList(operators)} code in one tap, even offline.`,
  homeAlt: (country, operators) => `Telko ${country}: ${joinList(operators)} codes`,
  homeCardTitle: 'USSD codes, bundles and mobile money',
  homeCardHighlight: 'Even offline',
  heading,
  description,
  moneyName: (name, former) => (former ? `${name} (formerly ${former})` : name),
  from: (price) => `From ${price}`,
  codes: (n) => `${n} codes`,
  amounts: (n) => `${n} amounts`,
};

function heading(id: SectionId, c: SectionCopyContext): string {
  const headings: Record<SectionId, string> = {
    internet: `${c.operatorShort} data bundles`,
    appels: `${c.operatorShort} calls and SMS`,
    argent: `${c.moneyShort} codes`,
    factures: `Pay bills with ${c.operatorShort}`,
    frais: `${c.moneyShort} fees`,
    aide: `${c.operatorShort} useful codes`,
  };

  return headings[id];
}

function description(id: SectionId, c: SectionCopyContext): string {
  const from = c.from ? `, from ${c.from}` : '';
  /** "18 data bundles", or "Data bundles" when the section is still empty. */
  const lead = (noun: string): string => (c.count > 0 ? `${c.count} ${noun}` : noun.charAt(0).toUpperCase() + noun.slice(1));
  const descriptions: Record<SectionId, string> = {
    internet: `${lead('data bundles')} from ${c.operatorName}, daily to monthly${from}. Dial each bundle's code in one tap.`,
    appels: `${lead('call and SMS bundles')} from ${c.operatorName}${from}. Dial the code in one tap.`,
    argent: `${lead('codes')} for ${c.moneyName}, ready to dial. Telko never asks for your PIN.`,
    factures: `${lead('codes')} to pay your bills with ${c.operatorName}, ready to dial.`,
    frais: c.fees > 0 ? `${c.moneyName} fees: ${c.fees} amounts, each with its source.` : `${c.moneyName} fees, with their source.`,
    aide: `${lead('useful codes')} from ${c.operatorName}: balance, number and services, in one tap.`,
  };

  return descriptions[id];
}

/** "Yas and Moov", "Mixx, Moov Money, and bills". */
function joinList(items: string[]): string {
  return new Intl.ListFormat('en', { type: 'conjunction' }).format(items);
}
