import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { SemanticBlock, StepsMeta } from '../../core/types.js';

interface Props {
  block: SemanticBlock;
  Fallback: React.ComponentType<{ content: string }>;
}

export const StepsRenderer = memo(({ block, Fallback }: Props) => {
  const meta = block.meta as unknown as StepsMeta;
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(() =>
    new Set(meta?.steps?.map((_, i) => i) ?? [])
  );

  if (!meta?.steps?.length) {
    return <Fallback content={block.rawMarkdown} />;
  }

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <motion.div
      className="sem-steps"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {meta.steps.map((step, i) => {
        const isExpanded = expandedSteps.has(i);
        const isLast = i === meta.steps.length - 1;

        return (
          <div key={i} className={`sem-step ${isLast ? 'sem-step-last' : ''}`}>
            <div className="sem-step-rail">
              <div className="sem-step-circle">{step.number}</div>
              {!isLast && <div className="sem-step-line" />}
            </div>
            <div className="sem-step-content">
              <button className="sem-step-title" onClick={() => toggleStep(i)}>
                <span>{step.title}</span>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <AnimatePresence initial={false}>
                {isExpanded && step.body && (
                  <motion.div
                    className="sem-step-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Fallback content={step.body} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
});

StepsRenderer.displayName = 'StepsRenderer';
