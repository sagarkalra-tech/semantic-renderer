# semantic-renderer

[![CI](https://github.com/sagarkalra-tech/semantic-renderer/actions/workflows/ci.yml/badge.svg)](https://github.com/sagarkalra-tech/semantic-renderer/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/semantic-renderer)](https://www.npmjs.com/package/semantic-renderer)

Intelligent LLM response renderer that detects the **semantic intent** of markdown responses and renders them with purpose-built visual components — not just "better markdown", but context-aware layouts.

A comparison response renders as side-by-side cards. A step-by-step guide renders as an interactive stepper. Pros and cons render as a green/red two-column layout. All automatically detected — zero prompt engineering required.

## What it detects

| Type | Trigger | Visual |
|------|---------|--------|
| **Pros & Cons** | Headings/bold with "pros/advantages" + "cons/disadvantages" | Two-column green/red layout with check/X icons |
| **Comparison** | 2+ `###` headings with bullet lists, or "vs"/"versus" | Side-by-side entity cards with colored headers |
| **Steps** | Ordered lists with 3+ items, or "Step N"/"Phase N" headings | Vertical stepper with numbered circles and expand/collapse |
| **Code + Explanation** | Single fenced code block + 2+ paragraphs of prose | Split view — code panel (55%) + explanation panel (45%) |
| **Data Table** | GFM table with 3+ rows and 3+ columns | Sortable, filterable table with row count |
| **Email** | Subject/To/From lines, greeting ("Dear X"), sign-off ("Best regards,") | Email card with fields, body, signature, copy button |
| **Verdict** | Heading matching "verdict/conclusion/recommendation/summary/tldr" | Accent-bordered card with icon |
| **Default** | Everything else | Your existing markdown renderer (unchanged) |

## Install

```bash
npm install semantic-renderer
```

## Quick Start (React)

```tsx
import { SemanticRenderer } from 'semantic-renderer/react';
import 'semantic-renderer/react/styles.css';

function ChatMessage({ content, isStreaming }) {
  return (
    <SemanticRenderer
      content={content}
      isStreaming={isStreaming}
    />
  );
}
```

That's it. The component classifies the markdown and picks the right renderer automatically. During streaming, it bypasses classification and renders plain markdown — zero risk to your streaming UX.

## Peer Dependencies

The React entry point uses these (you likely already have them):

```json
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0",
  "react-markdown": ">=9.0.0",
  "framer-motion": ">=10.0.0",
  "lucide-react": ">=0.300.0"
}
```

All are optional — the core classifier has zero dependencies.

## API

### `<SemanticRenderer />` (React)

```tsx
interface SemanticRendererProps {
  /** The markdown content to render */
  content: string;
  /** Skip classification — render as plain markdown (useful for streaming) */
  isStreaming?: boolean;
  /** CSS class for the wrapper div */
  className?: string;
  /** Custom markdown renderer component (defaults to react-markdown) */
  fallback?: React.ComponentType<{ content: string }>;
}
```

### `classify()` (Core — framework-agnostic)

```ts
import { classify } from 'semantic-renderer';

const blocks = classify(markdownString);
// Returns: SemanticBlock[]
// Each block has: { id, type, rawMarkdown, meta }
```

Use this if you want to build your own renderers (React Native, Vue, Svelte, etc.) on top of the classification engine.

### Block Types

```ts
type SemanticBlockType =
  | 'comparison'      // meta: ComparisonMeta
  | 'steps'           // meta: StepsMeta
  | 'pros-cons'       // meta: ProsConsMeta
  | 'code-explanation' // meta: CodeExplanationMeta
  | 'data-table'      // meta: DataTableMeta
  | 'email'           // meta: EmailMeta
  | 'verdict'         // meta: VerdictMeta
  | 'default';        // meta: {}
```

## Theming

The default styles use CSS custom properties. Override them to match your app:

```css
:root {
  --sem-accent: #6366f1;   /* Primary accent (stepper circles, borders) */
  --sem-border: #e5e7eb;   /* Border color */
}
```

Or in dark mode:

```css
.dark {
  --sem-accent: #818cf8;
  --sem-border: #374151;
}
```

## Using Your Own Markdown Renderer

If you already have a custom markdown component, pass it as `fallback`:

```tsx
import { SemanticRenderer } from 'semantic-renderer/react';
import 'semantic-renderer/react/styles.css';
import { MyMarkdownRenderer } from './MyMarkdownRenderer';

// Your component must accept a `content` string prop
const MyFallback = ({ content }) => <MyMarkdownRenderer source={content} />;

<SemanticRenderer content={content} fallback={MyFallback} />
```

The fallback is used for:
- Unclassified (default) blocks
- Inline markdown within semantic blocks (e.g., bullet text in pros/cons)
- Streaming content (when `isStreaming` is true)

## Using Individual Renderers

You can also import renderers individually:

```tsx
import { classify } from 'semantic-renderer';
import { ProsConsRenderer, VerdictRenderer } from 'semantic-renderer/react';
import 'semantic-renderer/react/styles.css';

const blocks = classify(content);

blocks.map(block => {
  if (block.type === 'pros-cons') return <ProsConsRenderer block={block} Fallback={MyMarkdown} />;
  if (block.type === 'verdict') return <VerdictRenderer block={block} Fallback={MyMarkdown} />;
  return <MyMarkdown content={block.rawMarkdown} />;
});
```

## How It Works

1. **Split** — The markdown is split into sections by `##`/`###` headings
2. **Detect** — Each section is tested against 7 detectors in priority order (first match wins)
3. **Extract** — The winning detector extracts structured metadata (e.g., pros list, step titles)
4. **Render** — Each block is rendered by its purpose-built component, with the original markdown as fallback

The classifier is pure TypeScript with zero dependencies — no ML models, no API calls, no parsing libraries. Just regex heuristics tuned on real LLM output patterns.

## Fallback Safety

Every renderer validates its metadata before rendering. If anything is malformed, it falls back to your markdown renderer with the original text. You'll never see a broken layout — worst case, you see the same markdown you'd see without this package.

## Examples

Ask any LLM these prompts to see each renderer in action:

- **Pros/Cons**: "What are the pros and cons of microservices?"
- **Comparison**: "Compare React vs Vue vs Angular"
- **Steps**: "How to deploy a Node.js app to AWS step by step?"
- **Code+Explanation**: "Explain this code: `const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }`"
- **Data Table**: "Table of HTTP status codes with descriptions and examples"
- **Email**: "Draft an email to the hiring manager following up on my application"
- **Verdict**: "What's your verdict on using TypeScript for a new project?"

## Roadmap

- React Native renderers
- Vue/Svelte adapter packages
- Custom detector plugins
- Confidence scores on classification

## License

MIT - Sagar Kalra / AutoPriseAI
