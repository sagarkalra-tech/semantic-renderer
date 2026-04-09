import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { SemanticBlock, ProsConsMeta } from '../../core/types.js';

interface Props {
  block: SemanticBlock;
  Fallback: React.ComponentType<{ content: string }>;
}

export const ProsConsRenderer = memo(({ block, Fallback }: Props) => {
  const meta = block.meta as unknown as ProsConsMeta;

  if (!meta?.pros?.length || !meta?.cons?.length) {
    return <Fallback content={block.rawMarkdown} />;
  }

  return (
    <motion.div
      className="sem-pros-cons"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sem-pros-col">
        <div className="sem-pros-header">
          <Check size={18} />
          <span>Pros</span>
        </div>
        <ul className="sem-pros-list">
          {meta.pros.map((item, i) => (
            <li key={i} className="sem-pros-item">
              <Check size={14} className="sem-pros-icon" />
              <span><Fallback content={item} /></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="sem-cons-col">
        <div className="sem-cons-header">
          <X size={18} />
          <span>Cons</span>
        </div>
        <ul className="sem-cons-list">
          {meta.cons.map((item, i) => (
            <li key={i} className="sem-cons-item">
              <X size={14} className="sem-cons-icon" />
              <span><Fallback content={item} /></span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
});

ProsConsRenderer.displayName = 'ProsConsRenderer';
