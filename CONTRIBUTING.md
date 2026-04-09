# Contributing to semantic-renderer

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/sagarkalra-tech/semantic-renderer.git
cd semantic-renderer
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
  core/           # Framework-agnostic classifier (zero dependencies)
    classifier.ts # classify() + all detectors
    types.ts      # SemanticBlock, meta interfaces
    __tests__/    # Vitest tests for the classifier
  react/          # React renderers + SemanticRenderer component
    renderers/    # One file per block type
    styles.css    # All .sem-* styles
```

## Adding a New Block Type

1. **`src/core/types.ts`** — Add the type string to `SemanticBlockType` union. Create a `FooMeta` interface.
2. **`src/core/classifier.ts`** — Write `detectFoo(markdown): SemanticBlock | null`. Add it to the `detectors` array in `classify()`.
3. **`src/react/renderers/FooRenderer.tsx`** — Create the component. Accept `block` and `Fallback` props. Fall back to `<Fallback>` if meta is invalid.
4. **`src/react/SemanticRenderer.tsx`** — Import and add to `RENDERER_MAP`.
5. **`src/react/styles.css`** — Add `.sem-foo-*` styles.
6. **`src/core/__tests__/classifier.test.ts`** — Add test cases for detection + rejection.
7. **`README.md`** — Add the new type to the detection table.

## Writing Tests

All classifier tests live in `src/core/__tests__/classifier.test.ts`. Each detector should have:
- At least one positive detection test
- At least one rejection test (input that looks similar but shouldn't match)

Run tests before submitting:

```bash
npm test
```

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add/update tests for any classifier changes
4. Run `npm run build && npm test` to verify
5. Open a PR with a clear description of what changed and why

## Code Style

- TypeScript strict mode
- No runtime dependencies in `src/core/` — the classifier must stay zero-dependency
- React renderers should always validate meta and fall back gracefully

## Reporting Issues

Use [GitHub Issues](https://github.com/sagarkalra-tech/semantic-renderer/issues). Include:
- What you expected vs. what happened
- The markdown input that triggered the issue
- Your framework and version (React 18/19, etc.)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
