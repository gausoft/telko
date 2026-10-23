import type { Catalog, CatalogEntry } from './catalog-types';
import type { Param } from './schema';

/**
 * Every French text of the catalog that has no English version, as "where: field".
 * A translation may repeat the French (a product name such as "Net599"); only a missing key counts.
 */
export function missingTranslations(catalog: Catalog): string[] {
  const missing: string[] = [];
  const need = (where: string, field: string, french: string | null | undefined, english: string | undefined): void => {
    if (french && english === undefined) missing.push(`${where}: ${field}`);
  };

  for (const country of catalog.countries) need(`countries/${country.code}`, 'name', country.name, country.en?.name);

  for (const data of [...catalog.byCountry.values(), ...catalog.pending.values()]) {
    const code = data.country.code;
    for (const o of data.operators) need(`${code}/${o.id}`, 'notes', o.notes, o.en?.notes);
    for (const e of data.entries) missing.push(...missingInEntry(`${code}/${e.id}`, e));
    for (const f of data.fees) {
      need(`${code}/${f.id}`, 'label', f.label, f.en?.label);
      need(`${code}/${f.id}`, 'notes', f.notes, f.en?.notes);
    }
    for (const f of data.featured) need(`${code}/featured/${f.entry.id}`, 'label', f.label, f.en?.label);
    for (const s of data.shortcuts) need(`${code}/shortcuts/${s.entry.id}`, 'label', s.label, s.en?.label);
  }

  return missing;
}

function missingInEntry(where: string, entry: CatalogEntry): string[] {
  const missing: string[] = [];
  if (entry.en?.name === undefined) missing.push(`${where}: name`);
  if (entry.description && entry.en?.description === undefined) missing.push(`${where}: description`);
  if (entry.notes && entry.en?.notes === undefined) missing.push(`${where}: notes`);
  if (entry.validity?.label && entry.validity.en?.label === undefined) missing.push(`${where}: validity.label`);

  const params = [...entry.ussd.params, ...(entry.third_party?.params ?? [])];
  for (const p of params) missing.push(...missingInParam(`${where}/${p.name}`, p));

  return missing;
}

function missingInParam(where: string, param: Param): string[] {
  const missing: string[] = [];
  if (param.en?.label === undefined) missing.push(`${where}: label`);
  if (param.short && param.en?.short === undefined) missing.push(`${where}: short`);
  for (const o of param.options ?? []) if (o.en?.label === undefined) missing.push(`${where}/${o.value}: label`);

  return missing;
}
