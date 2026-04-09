export type SemanticBlockType =
  | 'comparison'
  | 'steps'
  | 'pros-cons'
  | 'code-explanation'
  | 'data-table'
  | 'email'
  | 'verdict'
  | 'default';

export interface SemanticBlock {
  id: string;
  type: SemanticBlockType;
  rawMarkdown: string;
  meta: Record<string, unknown>;
}

export interface ComparisonMeta {
  items: Array<{
    title: string;
    points: string[];
  }>;
}

export interface StepsMeta {
  steps: Array<{
    number: number;
    title: string;
    body: string;
  }>;
}

export interface ProsConsMeta {
  pros: string[];
  cons: string[];
  subject?: string;
}

export interface CodeExplanationMeta {
  code: string;
  language: string;
  explanation: string;
}

export interface DataTableMeta {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface EmailMeta {
  subject?: string;
  to?: string;
  from?: string;
  greeting?: string;
  body: string;
  signoff?: string;
  signature?: string;
}

export interface VerdictMeta {
  verdict: string;
  reasoning?: string;
}
