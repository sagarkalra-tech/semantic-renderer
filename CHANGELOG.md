# Changelog

## [1.1.0] - 2026-04-09

### Added
- **Email block type**: Detects email drafts (Subject/To/From lines, greetings, sign-offs) and renders as a structured email card with copy-to-clipboard
- `EmailRenderer` React component with gradient header, structured fields, and signature support
- `EmailMeta` type export
- Vitest test suite with 37 test cases covering all 7 detectors
- CI/CD: GitHub Actions for build/test on push/PR (Node 18, 20, 22)
- CI/CD: Automated npm publish on GitHub Release
- CONTRIBUTING.md, issue templates, PR template

### Fixed
- `detectProsCons`: Added identity check to prevent same section matching both pros and cons
- React hooks violation in `SemanticRenderer` — `useMemo` now called before conditional early return

## [1.0.0] - 2026-04-08

### Added
- Initial release
- Core classifier with 6 detectors: pros-cons, comparison, steps, code-explanation, data-table, verdict
- React renderers for all block types
- `SemanticRenderer` component with streaming bypass
- CSS styles with custom property theming
