import type {
  SemanticBlock,
  SemanticBlockType,
  ComparisonMeta,
  StepsMeta,
  ProsConsMeta,
  CodeExplanationMeta,
  DataTableMeta,
  EmailMeta,
  VerdictMeta,
} from './types.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

let idCounter = 0;
function makeId(type: SemanticBlockType, index: number): string {
  return `sem-${type}-${index}-${++idCounter}`;
}

/** Split markdown into sections by ## or ### headings. */
function splitSections(markdown: string): Array<{ heading: string; body: string; raw: string }> {
  const lines = markdown.split('\n');
  const sections: Array<{ heading: string; body: string; raw: string }> = [];
  let currentHeading = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);
    if (headingMatch) {
      // Flush previous section
      if (currentLines.length > 0 || currentHeading) {
        const raw = currentHeading
          ? currentHeading + '\n' + currentLines.join('\n')
          : currentLines.join('\n');
        sections.push({ heading: currentHeading, body: currentLines.join('\n'), raw });
      }
      currentHeading = line;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Flush final section
  if (currentLines.length > 0 || currentHeading) {
    const raw = currentHeading
      ? currentHeading + '\n' + currentLines.join('\n')
      : currentLines.join('\n');
    sections.push({ heading: currentHeading, body: currentLines.join('\n'), raw });
  }

  return sections;
}

/** Extract bullet list items from a block of text. */
function extractBullets(text: string): string[] {
  const bullets: string[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*[-*+]\s+(.+)/);
    if (m) bullets.push(m[1].trim());
  }
  return bullets;
}

/** Count paragraphs of prose (non-empty, non-code-fence, non-list, non-heading lines). */
function countProseParagraphs(text: string): number {
  let count = 0;
  let inCode = false;
  let prevBlank = true;

  for (const line of text.split('\n')) {
    if (line.trim().startsWith('```')) { inCode = !inCode; continue; }
    if (inCode) continue;

    const trimmed = line.trim();
    if (trimmed === '') { prevBlank = true; continue; }
    if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed) || /^#{1,6}\s/.test(trimmed)) continue;
    if (/^\|/.test(trimmed)) continue;

    if (prevBlank) count++;
    prevBlank = false;
  }
  return count;
}

/** Extract a single fenced code block from text. Returns null if not exactly one. */
function extractSingleCodeBlock(text: string): { code: string; language: string; before: string; after: string } | null {
  const fenceRegex = /^```(\w*)\n([\s\S]*?)^```$/gm;
  const matches = [...text.matchAll(fenceRegex)];
  if (matches.length !== 1) return null;

  const match = matches[0];
  const before = text.slice(0, match.index!).trim();
  const after = text.slice(match.index! + match[0].length).trim();

  return {
    code: match[2].trim(),
    language: match[1] || 'text',
    before,
    after,
  };
}

/** Parse a GFM table from text. Returns null if no valid table found. */
function parseGfmTable(text: string): { headers: string[]; rows: string[][]; raw: string } | null {
  const lines = text.split('\n');
  let tableStart = -1;
  let separatorIdx = -1;

  // Find the header + separator pattern
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    const next = lines[i + 1].trim();
    if (/^\|.+\|$/.test(line) && /^\|[\s:|-]+\|$/.test(next)) {
      tableStart = i;
      separatorIdx = i + 1;
      break;
    }
  }

  if (tableStart === -1) return null;

  const parseRow = (line: string): string[] =>
    line.split('|').slice(1, -1).map(cell => cell.trim());

  const headers = parseRow(lines[tableStart]);
  const rows: string[][] = [];

  for (let i = separatorIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|') || !line.endsWith('|')) break;
    rows.push(parseRow(line));
  }

  if (rows.length === 0) return null;

  const tableLines = lines.slice(tableStart, separatorIdx + 1 + rows.length);
  return { headers, rows, raw: tableLines.join('\n') };
}

// ── Detectors (priority order) ───────────────────────────────────────────────

/** Detect pros/cons pattern across the full markdown. */
function detectProsCons(markdown: string): SemanticBlock | null {
  const prosPattern = /\b(pros?|advantages?|benefits?|strengths?)\b/i;
  const consPattern = /\b(cons?|disadvantages?|drawbacks?|weaknesses?)\b/i;

  // Look for heading-based pros/cons
  const sections = splitSections(markdown);
  let prosSection: typeof sections[0] | null = null;
  let consSection: typeof sections[0] | null = null;

  for (const section of sections) {
    const headingText = section.heading.replace(/^#{1,6}\s+/, '');
    if (prosPattern.test(headingText) && !prosSection) prosSection = section;
    if (consPattern.test(headingText) && !consSection) consSection = section;
  }

  if (prosSection && consSection && prosSection !== consSection) {
    const pros = extractBullets(prosSection.body);
    const cons = extractBullets(consSection.body);
    if (pros.length >= 2 && cons.length >= 2) {
      const meta: ProsConsMeta = { pros, cons };
      return {
        id: makeId('pros-cons', 0),
        type: 'pros-cons',
        rawMarkdown: markdown,
        meta: meta as unknown as Record<string, unknown>,
      };
    }
  }

  // Also try bold-based pattern: **Pros:** / **Cons:**
  const boldProsMatch = markdown.match(/\*\*\s*(pros?|advantages?|benefits?)\s*:?\s*\*\*/i);
  const boldConsMatch = markdown.match(/\*\*\s*(cons?|disadvantages?|drawbacks?)\s*:?\s*\*\*/i);

  if (boldProsMatch && boldConsMatch) {
    const prosIdx = boldProsMatch.index!;
    const consIdx = boldConsMatch.index!;
    const [firstIdx, secondIdx] = prosIdx < consIdx ? [prosIdx, consIdx] : [consIdx, prosIdx];
    const firstBlock = markdown.slice(firstIdx, secondIdx);
    const secondBlock = markdown.slice(secondIdx);

    const firstBullets = extractBullets(firstBlock);
    const secondBullets = extractBullets(secondBlock);

    if (firstBullets.length >= 2 && secondBullets.length >= 2) {
      const pros = prosIdx < consIdx ? firstBullets : secondBullets;
      const cons = prosIdx < consIdx ? secondBullets : firstBullets;
      const meta: ProsConsMeta = { pros, cons };
      return {
        id: makeId('pros-cons', 0),
        type: 'pros-cons',
        rawMarkdown: markdown,
        meta: meta as unknown as Record<string, unknown>,
      };
    }
  }

  return null;
}

/** Detect comparison pattern (A vs B with similar structure). */
function detectComparison(markdown: string): SemanticBlock | null {
  const sections = splitSections(markdown);

  // Check for "vs" / "versus" in any heading
  const hasVsHeading = sections.some(s =>
    /\bvs\.?\b|\bversus\b|\bcompared?\s+to\b/i.test(s.heading)
  );

  // Find ### headings with bullet lists underneath
  const h3Sections = sections.filter(s => s.heading.startsWith('### '));
  const withBullets = h3Sections.filter(s => extractBullets(s.body).length >= 2);

  if (withBullets.length >= 2 && (hasVsHeading || withBullets.length >= 2)) {
    const items = withBullets.map(s => ({
      title: s.heading.replace(/^###\s+/, '').replace(/\*\*/g, '').trim(),
      points: extractBullets(s.body),
    }));
    const meta: ComparisonMeta = { items };
    return {
      id: makeId('comparison', 0),
      type: 'comparison',
      rawMarkdown: markdown,
      meta: meta as unknown as Record<string, unknown>,
    };
  }

  // Also check for ## headings with similar structure (when there's a vs heading)
  if (hasVsHeading) {
    const h2Sections = sections.filter(s => s.heading.startsWith('## ') && !s.heading.match(/\bvs\.?\b|\bversus\b/i));
    const h2WithBullets = h2Sections.filter(s => extractBullets(s.body).length >= 2);
    if (h2WithBullets.length >= 2) {
      const items = h2WithBullets.map(s => ({
        title: s.heading.replace(/^##\s+/, '').replace(/\*\*/g, '').trim(),
        points: extractBullets(s.body),
      }));
      const meta: ComparisonMeta = { items };
      return {
        id: makeId('comparison', 0),
        type: 'comparison',
        rawMarkdown: markdown,
        meta: meta as unknown as Record<string, unknown>,
      };
    }
  }

  return null;
}

/** Detect step-by-step pattern. */
function detectSteps(markdown: string): SemanticBlock | null {
  // Pattern 1: Headings matching "Step N" or "Phase N"
  const sections = splitSections(markdown);
  const stepSections = sections.filter(s =>
    /^#{2,3}\s*(step|phase)\s*\d+/i.test(s.heading)
  );

  if (stepSections.length >= 3) {
    const steps = stepSections.map((s, i) => ({
      number: i + 1,
      title: s.heading.replace(/^#{2,3}\s+/, '').trim(),
      body: s.body.trim(),
    }));
    const meta: StepsMeta = { steps };
    return {
      id: makeId('steps', 0),
      type: 'steps',
      rawMarkdown: markdown,
      meta: meta as unknown as Record<string, unknown>,
    };
  }

  // Pattern 2: Numbered headings like "## 1. Install dependencies"
  const numberedHeadingSections = sections.filter(s =>
    /^#{2,3}\s*\d+[\.\)]\s+/.test(s.heading)
  );

  if (numberedHeadingSections.length >= 3) {
    const steps = numberedHeadingSections.map((s, i) => ({
      number: i + 1,
      title: s.heading.replace(/^#{2,3}\s*\d+[\.\)]\s+/, '').trim(),
      body: s.body.trim(),
    }));
    const meta: StepsMeta = { steps };
    return {
      id: makeId('steps', 0),
      type: 'steps',
      rawMarkdown: markdown,
      meta: meta as unknown as Record<string, unknown>,
    };
  }

  // Pattern 3: Ordered list with multi-sentence items or bold titles
  const orderedListRegex = /^(\d+)\.\s+(?:\*\*(.+?)\*\*[:\s—-]*)?(.*)$/gm;
  const listItems: Array<{ number: number; title: string; body: string }> = [];
  let match: RegExpExecArray | null;

  // Reset regex
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const lineMatch = lines[i].match(/^(\d+)\.\s+(?:\*\*(.+?)\*\*[:\s—-]*)?(.*)$/);
    if (lineMatch) {
      const num = parseInt(lineMatch[1], 10);
      const title = lineMatch[2] || '';
      let body = lineMatch[3] || '';

      // Collect continuation lines (indented or non-list)
      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        if (nextLine.trim() === '') { i++; continue; }
        if (/^\d+\.\s+/.test(nextLine)) break;
        if (/^#{1,6}\s/.test(nextLine)) break;
        body += '\n' + nextLine;
        i++;
      }

      listItems.push({ number: num, title: title.trim(), body: body.trim() });
    } else {
      i++;
    }
  }

  if (listItems.length >= 3) {
    // Check that items have some substance (not just one-word items)
    const hasSubstance = listItems.some(item =>
      item.body.length > 30 || item.title.length > 0
    );
    if (hasSubstance) {
      const meta: StepsMeta = {
        steps: listItems.map((item, idx) => ({
          number: idx + 1,
          title: item.title || item.body.split('\n')[0].slice(0, 80),
          body: item.title ? item.body : item.body.split('\n').slice(1).join('\n').trim(),
        })),
      };
      return {
        id: makeId('steps', 0),
        type: 'steps',
        rawMarkdown: markdown,
        meta: meta as unknown as Record<string, unknown>,
      };
    }
  }

  return null;
}

/** Detect code + explanation pattern. */
function detectCodeExplanation(markdown: string): SemanticBlock | null {
  const codeBlock = extractSingleCodeBlock(markdown);
  if (!codeBlock) return null;

  const proseCount = countProseParagraphs(codeBlock.before) + countProseParagraphs(codeBlock.after);
  if (proseCount < 2) return null;

  // The code block should be substantial (at least 3 lines)
  if (codeBlock.code.split('\n').length < 3) return null;

  const explanation = [codeBlock.before, codeBlock.after].filter(Boolean).join('\n\n');

  const meta: CodeExplanationMeta = {
    code: codeBlock.code,
    language: codeBlock.language,
    explanation,
  };

  return {
    id: makeId('code-explanation', 0),
    type: 'code-explanation',
    rawMarkdown: markdown,
    meta: meta as unknown as Record<string, unknown>,
  };
}

/** Detect data table pattern. */
function detectDataTable(markdown: string): SemanticBlock | null {
  const table = parseGfmTable(markdown);
  if (!table) return null;
  if (table.headers.length < 3 || table.rows.length < 3) return null;

  const meta: DataTableMeta = {
    headers: table.headers,
    rows: table.rows,
  };

  return {
    id: makeId('data-table', 0),
    type: 'data-table',
    rawMarkdown: markdown,
    meta: meta as unknown as Record<string, unknown>,
  };
}

/** Detect email / email draft pattern. */
function detectEmail(markdown: string): SemanticBlock | null {
  const lines = markdown.split('\n');

  let score = 0;
  let subjectLine: string | undefined;
  let toLine: string | undefined;
  let fromLine: string | undefined;
  let greetingLine: string | undefined;
  let greetingIdx = -1;
  let signoffLine: string | undefined;
  let signoffIdx = -1;
  let signatureLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const stripped = trimmed.replace(/\*\*/g, '');

    if (/^Subject\s*:\s*.+/i.test(stripped) && !subjectLine) {
      subjectLine = stripped.replace(/^Subject\s*:\s*/i, '').trim();
      score += 3;
      continue;
    }
    if (/^To\s*:\s*.+/i.test(stripped) && !toLine) {
      toLine = stripped.replace(/^To\s*:\s*/i, '').trim();
      score += 2;
      continue;
    }
    if (/^From\s*:\s*.+/i.test(stripped) && !fromLine) {
      fromLine = stripped.replace(/^From\s*:\s*/i, '').trim();
      score += 1;
      continue;
    }
    if (!greetingLine && /^(Dear|Hi|Hello|Greetings|Good\s+(morning|afternoon|evening))\b/i.test(stripped)) {
      greetingLine = trimmed;
      greetingIdx = i;
      score += 2;
      continue;
    }
    if (/^(Best\s+regards|Kind\s+regards|Warm\s+regards|Regards|Sincerely|Thank\s+you|Thanks|Cheers|Respectfully|Cordially|Yours\s+(truly|sincerely|faithfully))\s*,?\s*$/i.test(stripped)) {
      signoffLine = stripped;
      signoffIdx = i;
      score += 2;
      for (let j = i + 1; j < lines.length; j++) {
        const sigLine = lines[j].trim();
        if (sigLine === '') continue;
        if (sigLine.length > 120 || /^(#{1,6}\s|[-*+]\s|\d+\.\s|```)/.test(sigLine)) break;
        signatureLines.push(sigLine);
      }
      break;
    }
  }

  if (score < 4) return null;

  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].trim().replace(/\*\*/g, '');
    if (/^(Subject|To|From)\s*:/i.test(stripped)) {
      bodyStart = i + 1;
    }
  }
  if (greetingIdx >= bodyStart) {
    bodyStart = greetingIdx + 1;
  }

  const bodyEnd = signoffIdx > bodyStart ? signoffIdx : lines.length;
  const body = lines.slice(bodyStart, bodyEnd).join('\n').trim();

  if (body.length < 10) return null;

  const meta: EmailMeta = {
    subject: subjectLine,
    to: toLine,
    from: fromLine,
    greeting: greetingLine,
    body,
    signoff: signoffLine,
    signature: signatureLines.length > 0 ? signatureLines.join('\n') : undefined,
  };

  return {
    id: makeId('email', 0),
    type: 'email',
    rawMarkdown: markdown,
    meta: meta as unknown as Record<string, unknown>,
  };
}

/** Detect verdict/conclusion pattern. */
function detectVerdict(markdown: string): SemanticBlock | null {
  const verdictPattern = /\b(verdict|conclusion|recommendation|summary|bottom\s*line|tldr|tl;dr|final\s+(?:thoughts?|take|answer))\b/i;

  // Pattern 1: Heading-based verdict
  const sections = splitSections(markdown);
  for (const section of sections) {
    const headingText = section.heading.replace(/^#{1,6}\s+/, '');
    if (verdictPattern.test(headingText) && section.body.trim().length > 20) {
      const meta: VerdictMeta = { verdict: section.body.trim() };
      return {
        id: makeId('verdict', 0),
        type: 'verdict',
        rawMarkdown: section.raw,
        meta: meta as unknown as Record<string, unknown>,
      };
    }
  }

  // Pattern 2: Trailing blockquote at the very end
  const lines = markdown.trim().split('\n');
  const lastLines: string[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('> ')) {
      lastLines.unshift(lines[i].replace(/^>\s?/, ''));
    } else if (lines[i].trim() === '') {
      continue;
    } else {
      break;
    }
  }

  if (lastLines.length > 0 && lastLines.join(' ').length > 20) {
    const verdictText = lastLines.join('\n');
    const meta: VerdictMeta = { verdict: verdictText };
    return {
      id: makeId('verdict', 0),
      type: 'verdict',
      rawMarkdown: lastLines.map(l => '> ' + l).join('\n'),
      meta: meta as unknown as Record<string, unknown>,
    };
  }

  return null;
}

// ── Main Classifier ──────────────────────────────────────────────────────────

/**
 * Classify a sanitized markdown string into semantic blocks.
 *
 * The classifier attempts to match the ENTIRE response to a single semantic
 * type first (e.g., the whole response is a comparison). If no full-response
 * match is found, it falls back to a default block.
 *
 * A verdict detector also runs and can capture a trailing section separately,
 * resulting in [main content block, verdict block] when applicable.
 */
export function classify(markdown: string): SemanticBlock[] {
  if (!markdown || markdown.trim().length === 0) {
    return [{ id: makeId('default', 0), type: 'default', rawMarkdown: markdown, meta: {} }];
  }

  const blocks: SemanticBlock[] = [];

  // Try full-response detectors in priority order
  const detectors: Array<(md: string) => SemanticBlock | null> = [
    detectProsCons,
    detectComparison,
    detectSteps,
    detectCodeExplanation,
    detectDataTable,
    detectEmail,
  ];

  let matched = false;
  for (const detect of detectors) {
    const block = detect(markdown);
    if (block) {
      blocks.push(block);
      matched = true;
      break;
    }
  }

  // If no full-response match, check for a verdict section at the end
  // and use default for the rest
  if (!matched) {
    const verdict = detectVerdict(markdown);
    if (verdict && verdict.rawMarkdown !== markdown) {
      // There's a verdict section — split it out
      const remainingMd = markdown.replace(verdict.rawMarkdown, '').trim();
      if (remainingMd.length > 0) {
        blocks.push({
          id: makeId('default', 0),
          type: 'default',
          rawMarkdown: remainingMd,
          meta: {},
        });
      }
      blocks.push(verdict);
    } else if (verdict && verdict.rawMarkdown === markdown) {
      // Entire response is a verdict
      blocks.push(verdict);
    } else {
      // Pure default
      blocks.push({
        id: makeId('default', 0),
        type: 'default',
        rawMarkdown: markdown,
        meta: {},
      });
    }
  } else {
    // Even with a matched type, check if there's a trailing verdict
    const verdict = detectVerdict(markdown);
    if (verdict && verdict.type === 'verdict') {
      // Only add if it's a distinct section (heading-based, not overlapping with main block)
      const mainBlock = blocks[0];
      if (mainBlock && mainBlock.type !== 'verdict') {
        // Check the verdict section isn't already part of the main content
        const verdictText = (verdict.meta as unknown as VerdictMeta).verdict;
        if (verdictText && !isSubstantialOverlap(mainBlock.rawMarkdown, verdictText)) {
          blocks.push(verdict);
        }
      }
    }
  }

  return blocks;
}

/** Check if text B is substantially contained within text A. */
function isSubstantialOverlap(a: string, b: string): boolean {
  const bTrimmed = b.trim().slice(0, 100);
  return a.includes(bTrimmed);
}
