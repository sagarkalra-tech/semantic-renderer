import { memo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import type { SemanticBlock, VerdictMeta } from '../../core/types.js';

interface Props {
  block: SemanticBlock;
  Fallback: React.ComponentType<{ content: string }>;
}

export const VerdictRenderer = memo(({ block, Fallback }: Props) => {
  const meta = block.meta as unknown as VerdictMeta;

  if (!meta?.verdict) {
    return <Fallback content={block.rawMarkdown} />;
  }

  return (
    <motion.div
      className="sem-verdict"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sem-verdict-icon">
        <Lightbulb size={20} />
      </div>
      <div className="sem-verdict-content">
        <Fallback content={meta.verdict} />
        {meta.reasoning && (
          <div className="sem-verdict-reasoning">
            <Fallback content={meta.reasoning} />
          </div>
        )}
      </div>
    </motion.div>
  );
});

VerdictRenderer.displayName = 'VerdictRenderer';
