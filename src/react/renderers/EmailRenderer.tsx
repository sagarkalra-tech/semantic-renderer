import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Copy, Check, User, AtSign } from 'lucide-react';
import type { SemanticBlock, EmailMeta } from '../../core/types.js';

interface Props {
  block: SemanticBlock;
  Fallback: React.ComponentType<{ content: string }>;
}

export const EmailRenderer = memo(({ block, Fallback }: Props) => {
  const meta = block.meta as unknown as EmailMeta;
  const [copied, setCopied] = useState(false);

  if (!meta?.body) {
    return <Fallback content={block.rawMarkdown} />;
  }

  const handleCopy = async () => {
    const parts: string[] = [];
    if (meta.subject) parts.push(`Subject: ${meta.subject}`);
    if (meta.to) parts.push(`To: ${meta.to}`);
    if (meta.from) parts.push(`From: ${meta.from}`);
    if (parts.length > 0) parts.push('');
    if (meta.greeting) parts.push(meta.greeting, '');
    parts.push(meta.body);
    if (meta.signoff) parts.push('', meta.signoff);
    if (meta.signature) parts.push(meta.signature);

    try {
      await navigator.clipboard.writeText(parts.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard may not be available */ }
  };

  return (
    <motion.div
      className="sem-email"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sem-email-header">
        <div className="sem-email-header-icon">
          <Mail size={16} />
        </div>
        <span className="sem-email-header-label">Email Draft</span>
        <button
          className="sem-email-copy"
          onClick={handleCopy}
          title="Copy email to clipboard"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {(meta.subject || meta.to || meta.from) && (
        <div className="sem-email-fields">
          {meta.subject && (
            <div className="sem-email-field">
              <span className="sem-email-field-label">Subject</span>
              <span className="sem-email-field-value sem-email-subject">{meta.subject}</span>
            </div>
          )}
          {meta.to && (
            <div className="sem-email-field">
              <span className="sem-email-field-label"><User size={12} /> To</span>
              <span className="sem-email-field-value">{meta.to}</span>
            </div>
          )}
          {meta.from && (
            <div className="sem-email-field">
              <span className="sem-email-field-label"><AtSign size={12} /> From</span>
              <span className="sem-email-field-value">{meta.from}</span>
            </div>
          )}
        </div>
      )}

      <div className="sem-email-body">
        {meta.greeting && (
          <div className="sem-email-greeting">{meta.greeting}</div>
        )}
        <div className="sem-email-content">
          <Fallback content={meta.body} />
        </div>
        {meta.signoff && (
          <div className="sem-email-signoff">{meta.signoff}</div>
        )}
        {meta.signature && (
          <div className="sem-email-signature">
            {meta.signature.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

EmailRenderer.displayName = 'EmailRenderer';
