import { memo } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Simple markdown fallback renderer.
 * Users can override this by passing a custom `fallback` prop to SemanticRenderer.
 */
export const FallbackMarkdown = memo(({ content }: { content: string }) => (
  <div className="sem-markdown">
    <ReactMarkdown>{content}</ReactMarkdown>
  </div>
));

FallbackMarkdown.displayName = 'FallbackMarkdown';
