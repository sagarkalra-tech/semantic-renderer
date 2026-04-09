import { memo } from 'react';
import { motion } from 'framer-motion';
import type { SemanticBlock, ComparisonMeta } from '../../core/types.js';

const ACCENT_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];

interface Props {
  block: SemanticBlock;
  Fallback: React.ComponentType<{ content: string }>;
}

export const ComparisonRenderer = memo(({ block, Fallback }: Props) => {
  const meta = block.meta as unknown as ComparisonMeta;

  if (!meta?.items?.length || meta.items.length < 2) {
    return <Fallback content={block.rawMarkdown} />;
  }

  return (
    <motion.div
      className="sem-comparison"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {meta.items.map((item, i) => (
        <div key={i} className="sem-comparison-card">
          <div
            className="sem-comparison-card-header"
            style={{ borderColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
          >
            <span
              className="sem-comparison-card-dot"
              style={{ background: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
            />
            {item.title}
          </div>
          <ul className="sem-comparison-card-points">
            {item.points.map((point, j) => (
              <li key={j} className="sem-comparison-card-point">
                <Fallback content={point} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </motion.div>
  );
});

ComparisonRenderer.displayName = 'ComparisonRenderer';
