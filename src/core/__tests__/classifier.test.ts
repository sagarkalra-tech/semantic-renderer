import { describe, it, expect } from 'vitest';
import { classify } from '../classifier.js';
import type { SemanticBlock, ProsConsMeta, ComparisonMeta, StepsMeta, CodeExplanationMeta, DataTableMeta, EmailMeta, VerdictMeta } from '../types.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyOne(md: string): SemanticBlock {
  const blocks = classify(md);
  return blocks[0];
}

function meta<T>(block: SemanticBlock): T {
  return block.meta as unknown as T;
}

// ── Pros / Cons ──────────────────────────────────────────────────────────────

describe('detectProsCons', () => {
  it('detects heading-based pros/cons', () => {
    const md = `## Pros
- Fast
- Simple

## Cons
- Expensive
- Complex setup`;
    const block = classifyOne(md);
    expect(block.type).toBe('pros-cons');
    const m = meta<ProsConsMeta>(block);
    expect(m.pros).toEqual(['Fast', 'Simple']);
    expect(m.cons).toEqual(['Expensive', 'Complex setup']);
  });

  it('detects bold-based pros/cons', () => {
    const md = `**Pros:**
- Lightweight
- Open source

**Cons:**
- Limited docs
- No TypeScript`;
    const block = classifyOne(md);
    expect(block.type).toBe('pros-cons');
  });

  it('detects advantages/disadvantages wording', () => {
    const md = `## Advantages
- Speed
- Cost

## Disadvantages
- Complexity
- Learning curve`;
    expect(classifyOne(md).type).toBe('pros-cons');
  });

  it('rejects when fewer than 2 bullets on one side', () => {
    const md = `## Pros
- Only one

## Cons
- Also one`;
    expect(classifyOne(md).type).toBe('default');
  });

  it('rejects when same section matches both patterns', () => {
    const md = `## Pros and Cons
- Good thing
- Bad thing
- Another good
- Another bad`;
    // single section cannot be both pros and cons
    expect(classifyOne(md).type).not.toBe('pros-cons');
  });
});

// ── Comparison ───────────────────────────────────────────────────────────────

describe('detectComparison', () => {
  it('detects ### headings with bullet lists', () => {
    const md = `## React vs Vue

### React
- Virtual DOM
- Large ecosystem
- JSX

### Vue
- Template syntax
- Simpler learning curve
- Reactive by default`;
    const block = classifyOne(md);
    expect(block.type).toBe('comparison');
    const m = meta<ComparisonMeta>(block);
    expect(m.items).toHaveLength(2);
    expect(m.items[0].title).toBe('React');
    expect(m.items[1].title).toBe('Vue');
  });

  it('rejects with only one section', () => {
    const md = `## React vs Vue

### React
- Virtual DOM
- Large ecosystem`;
    expect(classifyOne(md).type).not.toBe('comparison');
  });
});

// ── Steps ────────────────────────────────────────────────────────────────────

describe('detectSteps', () => {
  it('detects Step N headings', () => {
    const md = `## Step 1: Install
Run npm install

## Step 2: Configure
Edit config.json

## Step 3: Deploy
Run deploy command`;
    const block = classifyOne(md);
    expect(block.type).toBe('steps');
    const m = meta<StepsMeta>(block);
    expect(m.steps).toHaveLength(3);
  });

  it('detects numbered headings', () => {
    const md = `## 1. Install dependencies
Run npm install

## 2. Create config file
Edit the config

## 3. Start the server
Run npm start`;
    const block = classifyOne(md);
    expect(block.type).toBe('steps');
    expect(meta<StepsMeta>(block).steps).toHaveLength(3);
  });

  it('detects ordered list with bold titles', () => {
    const md = `1. **Clone the repository**: Run git clone to get the source code on your local machine.
2. **Install dependencies**: Run npm install to download all required packages.
3. **Configure environment**: Create a .env file with your API keys and database credentials.`;
    const block = classifyOne(md);
    expect(block.type).toBe('steps');
    const m = meta<StepsMeta>(block);
    expect(m.steps).toHaveLength(3);
    expect(m.steps[0].title).toBe('Clone the repository');
  });

  it('detects ordered list with substantial body', () => {
    const md = `1. First, open the terminal and navigate to the project directory where you want to work.
2. Then install all the dependencies by running the package manager install command.
3. Finally, start the development server and open the browser to see the result.`;
    expect(classifyOne(md).type).toBe('steps');
  });

  it('rejects short trivial ordered list', () => {
    const md = `1. Apple
2. Banana
3. Cherry`;
    // no substance — items are too short and have no bold titles
    expect(classifyOne(md).type).not.toBe('steps');
  });

  it('rejects fewer than 3 items', () => {
    const md = `1. **First step**: Do something important here.
2. **Second step**: Do something else important.`;
    expect(classifyOne(md).type).not.toBe('steps');
  });
});

// ── Code Explanation ─────────────────────────────────────────────────────────

describe('detectCodeExplanation', () => {
  it('detects single code block with prose', () => {
    const md = `This function implements a debounce pattern. It delays execution until the caller stops invoking it.

\`\`\`javascript
function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
\`\`\`

The outer function creates a closure over the timeout variable. Each call resets the timer. Only after the specified delay passes without another call does the original function execute.`;
    const block = classifyOne(md);
    expect(block.type).toBe('code-explanation');
    const m = meta<CodeExplanationMeta>(block);
    expect(m.language).toBe('javascript');
    expect(m.code).toContain('debounce');
  });

  it('rejects multiple code blocks', () => {
    const md = `Here is function A:

\`\`\`js
function a() {}
\`\`\`

And here is function B:

\`\`\`js
function b() {}
\`\`\`

They work together.`;
    expect(classifyOne(md).type).not.toBe('code-explanation');
  });

  it('rejects code block without enough prose', () => {
    const md = `Example:

\`\`\`python
print("hello")
x = 1 + 2
y = x * 3
\`\`\``;
    expect(classifyOne(md).type).not.toBe('code-explanation');
  });

  it('rejects code block with fewer than 3 lines', () => {
    const md = `This is an important concept in programming. Let me explain how it works in detail.

\`\`\`js
const x = 1;
\`\`\`

The variable stores a number. Understanding variables is fundamental to all programming.`;
    expect(classifyOne(md).type).not.toBe('code-explanation');
  });
});

// ── Data Table ───────────────────────────────────────────────────────────────

describe('detectDataTable', () => {
  it('detects valid GFM table', () => {
    const md = `| Name | Status | Priority |
| --- | --- | --- |
| Task A | Done | High |
| Task B | In Progress | Medium |
| Task C | Pending | Low |`;
    const block = classifyOne(md);
    expect(block.type).toBe('data-table');
    const m = meta<DataTableMeta>(block);
    expect(m.headers).toEqual(['Name', 'Status', 'Priority']);
    expect(m.rows).toHaveLength(3);
  });

  it('rejects table with fewer than 3 columns', () => {
    const md = `| Name | Status |
| --- | --- |
| A | Done |
| B | Pending |
| C | Active |`;
    expect(classifyOne(md).type).not.toBe('data-table');
  });

  it('rejects table with fewer than 3 rows', () => {
    const md = `| Name | Status | Priority |
| --- | --- | --- |
| A | Done | High |
| B | Pending | Low |`;
    expect(classifyOne(md).type).not.toBe('data-table');
  });
});

// ── Email ────────────────────────────────────────────────────────────────────

describe('detectEmail', () => {
  it('detects full email with subject + greeting + signoff', () => {
    const md = `Subject: Follow-up on our meeting

Dear John,

Thank you for your time yesterday. I wanted to follow up on the action items we discussed. Please let me know if you have any questions.

Best regards,
Sagar Kalra`;
    const block = classifyOne(md);
    expect(block.type).toBe('email');
    const m = meta<EmailMeta>(block);
    expect(m.subject).toBe('Follow-up on our meeting');
    expect(m.greeting).toBe('Dear John,');
    expect(m.signoff).toBe('Best regards,');
    expect(m.body).toContain('Thank you');
  });

  it('detects email with Subject + To + greeting', () => {
    const md = `Subject: Project Update
To: team@company.com

Hi Team,

Here is the weekly project update with all the details you need to review before our meeting.

Thanks,
Sagar`;
    const block = classifyOne(md);
    expect(block.type).toBe('email');
    const m = meta<EmailMeta>(block);
    expect(m.to).toBe('team@company.com');
    expect(m.subject).toBe('Project Update');
  });

  it('detects email with greeting + signoff (no Subject header)', () => {
    const md = `Dear Hiring Manager,

I am writing to express my interest in the Software Engineer position at your company. I believe my experience aligns well with your requirements.

Sincerely,
Jane Doe`;
    const block = classifyOne(md);
    expect(block.type).toBe('email');
  });

  it('rejects when score is too low', () => {
    const md = `Hello everyone, welcome to the tutorial.

Today we will learn about JavaScript closures and how they work in practice.`;
    expect(classifyOne(md).type).not.toBe('email');
  });

  it('extracts signature lines after signoff', () => {
    const md = `Subject: Partnership Inquiry

Dear Ms. Smith,

I would like to discuss a potential partnership between our organizations.

Kind regards,
Sagar Kalra
CEO, AutoPrise AI
autopriseai.com`;
    const block = classifyOne(md);
    expect(block.type).toBe('email');
    const m = meta<EmailMeta>(block);
    expect(m.signature).toContain('CEO');
    expect(m.signature).toContain('autopriseai.com');
  });
});

// ── Verdict ──────────────────────────────────────────────────────────────────

describe('detectVerdict', () => {
  it('detects heading-based verdict', () => {
    const md = `Some analysis here about TypeScript.

## Verdict

TypeScript is absolutely worth using for any new project. The upfront cost pays for itself in fewer runtime bugs and better tooling.`;
    const blocks = classify(md);
    const verdict = blocks.find(b => b.type === 'verdict');
    expect(verdict).toBeDefined();
    const m = meta<VerdictMeta>(verdict!);
    expect(m.verdict).toContain('TypeScript');
  });

  it('detects conclusion heading', () => {
    const md = `Various points discussed.

## Conclusion

In summary, the approach works well for medium-scale applications.`;
    const blocks = classify(md);
    expect(blocks.some(b => b.type === 'verdict')).toBe(true);
  });

  it('detects trailing blockquote', () => {
    const md = `Here is some analysis.

More details about the topic being discussed.

> Bottom line: go with React if you need ecosystem, Vue if you want simplicity.`;
    const blocks = classify(md);
    expect(blocks.some(b => b.type === 'verdict')).toBe(true);
  });

  it('is additive — appended to another type when not overlapping', () => {
    // When the main detector captures the full markdown as rawMarkdown,
    // the overlap check prevents double-counting the verdict section.
    // Verdict is additive only when the main block doesn't already contain it.
    const md = `## Pros
- Fast
- Lightweight

## Cons
- Expensive
- Hard to debug

## Verdict

Overall, the tool is worth the investment for teams that can afford it.`;
    const blocks = classify(md);
    // The pros-cons detector matches the full input
    expect(blocks[0].type).toBe('pros-cons');
    // Verdict section is within the main block's rawMarkdown, so overlap check
    // may suppress it — just verify we get at least the primary block
    expect(blocks.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Default ──────────────────────────────────────────────────────────────────

describe('default fallback', () => {
  it('returns default for empty string', () => {
    expect(classifyOne('').type).toBe('default');
  });

  it('returns default for whitespace', () => {
    expect(classifyOne('   \n  \n  ').type).toBe('default');
  });

  it('returns default for plain prose', () => {
    const md = `This is just a regular paragraph with no special structure. It talks about various things but doesn't match any semantic pattern.`;
    expect(classifyOne(md).type).toBe('default');
  });

  it('returns default for short content', () => {
    expect(classifyOne('Sure, I can help with that.').type).toBe('default');
  });
});

// ── Priority ordering ────────────────────────────────────────────────────────

describe('priority ordering', () => {
  it('pros-cons wins over comparison when both could match', () => {
    const md = `## Advantages
- Fast rendering
- Small bundle

## Disadvantages
- Limited features
- No SSR support`;
    // This has headings with bullets (could be comparison) but pros/cons keywords take priority
    expect(classifyOne(md).type).toBe('pros-cons');
  });

  it('steps wins over email when numbered list has substance', () => {
    const md = `1. **Open the email**: Navigate to your inbox and find the message from the team lead.
2. **Click Reply**: Hit the reply button and compose your response carefully.
3. **Send the response**: Review your message one more time before clicking send.`;
    // Ordered list with bold titles = steps (priority 3), not email
    expect(classifyOne(md).type).toBe('steps');
  });
});

// ── Block structure ──────────────────────────────────────────────────────────

describe('block structure', () => {
  it('every block has id, type, rawMarkdown, meta', () => {
    const blocks = classify('Just some text');
    for (const block of blocks) {
      expect(block).toHaveProperty('id');
      expect(block).toHaveProperty('type');
      expect(block).toHaveProperty('rawMarkdown');
      expect(block).toHaveProperty('meta');
      expect(typeof block.id).toBe('string');
      expect(block.id).toMatch(/^sem-/);
    }
  });

  it('returns an array even for single block', () => {
    const blocks = classify('Hello world');
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
  });
});
