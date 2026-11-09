export type ContributionProof = 'device' | 'official' | 'other';

/** What the visitor typed in the assistant, before any check. */
export interface ContributionDraft {
  operator: string;
  service: string;
  /** Optional way to thank the visitor or ask a question. Only used when contributions are sent to a private destination. */
  contact: string;
  name: string;
  code: string;
  details: string;
  proof: ContributionProof;
  sourceUrl: string;
  /** ISO day the visitor saw the code work or read it. */
  date: string;
}

export type CodeProblem = 'empty' | 'format';

/** Where the draft goes: the public repository and the issue form that receives it. */
export interface IssueTarget {
  repoUrl: string;
  template: string;
}
