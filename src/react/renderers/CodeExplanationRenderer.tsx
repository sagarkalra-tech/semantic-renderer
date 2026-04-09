import { memo } from 'react';
import { motion } from 'framer-motion';
import { Code2 } from 'lucide-react';
import type { SemanticBlock, CodeExplanationMeta } from '../../core/types.js';

interface Props {
  block: SemanticBlock;
  Fallback: React.ComponentType<{ content: string }>;
}

export const CodeExplanationRenderer = memo(({ block, Fallback }: Props) => {
  const meta = block.meta as unknown as CodeExplanationMeta;

  if (!meta?.code || !meta?.explanation) {
    return <Fallback content={block.rawMarkdown} />;
  }

  const codeMd = '```' + (meta.language || '') + '\n' + meta.code + '\n```';

  return (
    <motion.div
      className="sem-code-explain"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sem-code-panel">
        <div className="sem-code-panel-header">
          <Code2 size={14} />
          <span>{meta.language || 'Code'}</span>
        </div>
        <Fallback content={codeMd} />
      </div>
      <div className="sem-explain-panel">
        <div className="sem-explain-panel-header">Explanation</div>
        <Fallback content={meta.explanation} />
      </div>
    </motion.div>
  );
});

CodeExplanationRenderer.displayName = 'CodeExplanationRenderer';
