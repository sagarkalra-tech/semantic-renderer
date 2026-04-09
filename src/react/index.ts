// React entry — SemanticRenderer component + all renderers
export { SemanticRenderer } from './SemanticRenderer.js';
export { VerdictRenderer } from './renderers/VerdictRenderer.js';
export { ProsConsRenderer } from './renderers/ProsConsRenderer.js';
export { StepsRenderer } from './renderers/StepsRenderer.js';
export { ComparisonRenderer } from './renderers/ComparisonRenderer.js';
export { DataTableRenderer } from './renderers/DataTableRenderer.js';
export { CodeExplanationRenderer } from './renderers/CodeExplanationRenderer.js';
export { EmailRenderer } from './renderers/EmailRenderer.js';

// Re-export core for convenience
export { classify } from '../core/index.js';
export type {
  SemanticBlock,
  SemanticBlockType,
  ComparisonMeta,
  StepsMeta,
  ProsConsMeta,
  CodeExplanationMeta,
  DataTableMeta,
  EmailMeta,
  VerdictMeta,
} from '../core/index.js';
