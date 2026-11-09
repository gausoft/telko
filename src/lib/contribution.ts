import type { CodeProblem, ContributionDraft, ContributionProof, IssueTarget } from './contribution-types';

/** Labels of the proof dropdown in .github/ISSUE_TEMPLATE/new-offer.yml: GitHub matches them word for word. */
export const PROOF_LABELS: Record<ContributionProof, string> = {
  device: 'Testé sur mon téléphone',
  official: "Site officiel de l'opérateur",
  other: 'Autre (blog, appli, réseaux sociaux)',
};

/** A USSD code: starts with * or #, then characters a keypad or a variable can give. No space. */
const CODE_PATTERN = /^[*#][0-9A-Za-z*#_{}]+$/;

export function checkCode(code: string): CodeProblem | null {
  const text = code.trim();
  if (text === '') return 'empty';

  return CODE_PATTERN.test(text) ? null : 'format';
}

/** The link that opens GitHub's issue form already filled in. Nothing is sent until the visitor confirms there. */
export function issueUrl(draft: ContributionDraft, target: IssueTarget): string {
  const query = new URLSearchParams({
    template: target.template,
    title: `[Offre] ${draft.name.trim()}`,
    operator: `${draft.operator}, ${draft.service}`,
    name: draft.name.trim(),
    code: draft.code.trim(),
    details: draft.details.trim(),
    proof: PROOF_LABELS[draft.proof],
    source_url: draft.sourceUrl.trim(),
    date: draft.date,
  });

  return `${target.repoUrl}/issues/new?${query.toString()}`;
}
