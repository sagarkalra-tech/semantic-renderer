import { memo, useMemo } from 'react';
import { classify } from '../core/classifier.js';
import type { SemanticBlock, SemanticBlockType } from '../core/types.js';
import { FallbackMarkdown } from './FallbackMarkdown.js';
import { VerdictRenderer } from './renderers/VerdictRenderer.js';
import { ProsConsRenderer } from './renderers/ProsConsRenderer.js';
import { StepsRenderer } from './renderers/StepsRenderer.js';
import { ComparisonRenderer } from './renderers/ComparisonRenderer.js';
import { DataTableRenderer } from './renderers/DataTableRenderer.js';
import { CodeExplanationRenderer } from './renderers/CodeExplanationRenderer.js';
import { EmailRenderer } from './renderers/EmailRenderer.js';

export interface SemanticRendererProps {
  /** The markdown content to render */
  content: string;
  /** Skip classification and render as plain markdown (useful for streaming) */
  isStreaming?: boolean;
  /** CSS class for the wrapper */
  className?: string;
  /** Custom fallback renderer for unclassified content and inline markdown */
  fallback?: React.ComponentType<{ content: string }>;
}

const RENDERER_MAP: Record<SemanticBlockType, React.ComponentType<{ block: SemanticBlock; Fallback: React.ComponentType<{ content: string }> }>> = {
  'comparison': ComparisonRenderer,
  'steps': StepsRenderer,
  'pros-cons': ProsConsRenderer,
  'code-explanation': CodeExplanationRenderer,
  'data-table': DataTableRenderer,
  'email': EmailRenderer,
  'verdict': VerdictRenderer,
  'default': ({ block, Fallback }) => <Fallback content={block.rawMarkdown} />,
};

export const SemanticRenderer = memo(({
  content,
  isStreaming = false,
  className = '',
  fallback: Fallback = FallbackMarkdown,
}: SemanticRendererProps) => {
  // Hooks must always run in the same order (Rules of Hooks) —
  // classify even during streaming so hook count stays stable.
  const blocks = useMemo(() => {
    if (isStreaming) return [];
    return classify(content);
  }, [content, isStreaming]);

  // During streaming, bypass classification
  if (isStreaming) {
    return <Fallback content={content} />;
  }

  // If all blocks are default, skip the wrapper overhead
  const allDefault = blocks.every(b => b.type === 'default');
  if (allDefault) {
    return <Fallback content={content} />;
  }

  return (
    <div className={`sem-body ${className}`.trim()}>
      {blocks.map(block => {
        const Renderer = RENDERER_MAP[block.type] || RENDERER_MAP['default'];
        return <Renderer key={block.id} block={block} Fallback={Fallback} />;
      })}
    </div>
  );
});

SemanticRenderer.displayName = 'SemanticRenderer';
