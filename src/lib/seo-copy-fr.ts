import type { SectionCopyContext, SeoCopy } from './seo-copy-types';
import type { SectionId } from './sections';

const SIGNATURE = 'Tous vos services mobiles, au même endroit.';

export const seoCopyFr: SeoCopy = {
  signature: SIGNATURE,
  defaultEyebrow: 'Codes USSD · forfaits · mobile money',
  splashDescription: `${SIGNATURE} Codes USSD, forfaits et mobile money, même hors connexion.`,
  imageAlt: (text) => `Telko : ${text}`,
  homeTitle: (country) => `Codes USSD, forfaits et mobile money · ${country} · Telko`,
  homeDescription: (operators, money) =>
    `Forfaits internet, appels, ${joinList(['factures', ...money])} : tous les codes ${joinList(operators)} en un tap, même hors connexion.`,
  homeAlt: (country, operators) => `Telko ${country} : codes ${joinList(operators)}`,
  homeCardTitle: 'Codes USSD, forfaits et mobile money',
  homeCardHighlight: 'Même hors connexion',
  soonTitle,
  soonDescription,
  heading,
  description,
  moneyName: (name, former) => (former ? `${name} (ex-${former})` : name),
  from: (price) => `Dès ${price}`,
  codes: (n) => `${n} codes`,
  amounts: (n) => `${n} montants`,
};

/** A country still listed as `soon`: no bundle page exists yet, so the title promises nothing it cannot show. */
function soonTitle(country: string): string {
  return `${country} : bientôt sur Telko · codes USSD et forfaits`;
}

function soonDescription(country: string, operators: string[]): string {
  const listed = operators.length > 0 ? `Telko liste déjà ${joinList(operators)} pour ${country}` : `Telko prépare ${country}`;

  return `${listed} : forfaits, codes USSD et mobile money, chacun avec sa source. Aidez-nous à les vérifier.`;
}

function heading(id: SectionId, c: SectionCopyContext): string {
  const headings: Record<SectionId, string> = {
    internet: `Forfaits internet ${c.operatorShort}`,
    appels: `Appels et SMS ${c.operatorShort}`,
    argent: `Codes ${c.moneyShort}`,
    factures: `Factures avec ${c.operatorShort}`,
    frais: `Frais ${c.moneyShort}`,
    aide: `Codes utiles ${c.operatorShort}`,
  };

  return headings[id];
}

function description(id: SectionId, c: SectionCopyContext): string {
  const from = c.from ? `, dès ${c.from}` : '';
  /** "18 forfaits internet", or "Forfaits internet" when the section is still empty. */
  const lead = (noun: string): string => (c.count > 0 ? `${c.count} ${noun}` : noun.charAt(0).toUpperCase() + noun.slice(1));
  const descriptions: Record<SectionId, string> = {
    internet: `${lead('forfaits internet')} ${c.operatorName}, du jour au mois${from}. Le code de chaque forfait se compose en un tap.`,
    appels: `${lead('forfaits appels et SMS')} ${c.operatorName}${from}. Le code se compose en un tap.`,
    argent: `${lead('codes')} ${c.moneyName} prêts à composer. Telko ne demande jamais votre code secret.`,
    factures: `${lead('codes')} pour payer vos factures avec ${c.operatorName}, prêts à composer.`,
    frais: c.fees > 0 ? `Les frais ${c.moneyName} : ${c.fees} montants, avec la source de chacun.` : `Les frais ${c.moneyName}, avec leur source.`,
    aide: `${lead('codes utiles')} ${c.operatorName} : solde, numéro et services, en un tap.`,
  };

  return descriptions[id];
}

/** "Yas et Moov", "Mixx, Moov Money et factures". */
function joinList(items: string[]): string {
  return new Intl.ListFormat('fr', { type: 'conjunction' }).format(items);
}
