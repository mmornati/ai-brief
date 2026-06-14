---
baseline_commit: 25bc4fb
---

# Story 3.3: Format Writer Base Class

Status: done

## Story

As a developer,
I want a shared base class for all format writers,
So that adding new output formats in the future is straightforward.

## Acceptance Criteria

1. **Given** a format writer base class exists in `src/formats/base.js`, **When** both blog and slides writers extend it, **Then** they share common template resolution logic and common output file naming and path conventions
2. **Given** I create a new format writer (e.g., newsletter), **When** it extends the base class and implements `render(content, metadata)`, **Then** it works with the pipeline without modifying the runner
3. **Given** the base resolver looks up a template, **When** both `default/` and `user/` directories exist, **Then** it checks `src/templates/user/<format>/` first, then `src/templates/default/<format>/`

## Tasks / Subtasks

- [x] Task 1: Create base writer class (AC: #1, #3)
  - [x] Create `src/formats/base.js` as an abstract base class
  - [x] Implement common template resolution (calls `resolver.js`)
  - [x] Implement common output path generation
  - [x] Define abstract `render(content, metadata)` method
- [x] Task 2: Refactor existing writers (AC: #1)
  - [x] Refactor `src/formats/blog.js` to extend `base.js`
  - [x] Refactor `src/formats/slides.js` to extend `base.js`
  - [x] Ensure backward compatibility — existing tests must pass without modification
- [x] Task 3: Create tests (AC: #2)
  - [x] Create `test/formats/base.test.js`
  - [x] Test base class contract enforcement
  - [x] Create a mock writer extending base to verify pluggability

### Review Findings

- [x] [Review][Decision] Constructor signature differs from spec dev notes — Spec says `super('blog')` but code uses `super('blog', 'blog.md', 'post')`. Extra params needed for backward compatibility (template name differs from format name for slides, default input name differs for both). [`src/formats/blog.js:6`, `src/formats/slides.js:6`] — resolved: updated dev notes to match actual signature
- [x] [Review][Decision] Template resolution filename deviates from spec path convention — Spec says resolver looks for `default.md` in `user/{format}/` and `default/{format}/` subdirectories, but code uses flat `blog.md`/`slide.md` filenames. Changing would break existing templates. [`src/formats/base.js:10`] — resolved: updated dev notes to reflect flat `{templateName}.md` convention
- [x] [Review][Patch] `parseTitle` crashes on null/undefined content — No guard before `content.match()` call. [`src/formats/base.js:17`]
- [x] [Review][Patch] `orchestrate` default export is dead wrapper — Simplified: `export default render`. [`src/formats/blog.js:67`, `src/formats/slides.js:75`]
- [x] [Review][Patch] Empty-string template treated as missing — Changed to `templateContent !== null` check. [`src/formats/blog.js:48`]
- [x] [Review][Patch] Test `generatedFiles` not reset between tests — Added `beforeEach` to clear array. [`test/formats/base.test.js:10`]
- [x] [Review][Defer] Template fallback error message check fragility — `err.message.includes('not found. Tried:')` is brittle against message format changes. Pre-existing concern, not a regression. [`src/formats/base.js:52`]
- [x] [Review][Defer] Module-level singleton writer instances — `const writer = new BlogWriter()` at module scope creates shared state. Pre-existing pattern, not a bug. [`src/formats/blog.js:61`, `src/formats/slides.js:69`]
- [x] [Review][Defer] blog.js template `.replace()` first-only — Only replaces first `{{content}}` occurrence. Pre-existing, not introduced by this change. [`src/formats/blog.js:76`]
- [x] [Review][Defer] No validation that `formatName` is non-empty — Subclasses always pass valid strings. Pre-existing concern. [`src/formats/base.js:7-13`]

## Dev Notes

- **Base class interface:**
  ```js
  export class FormatWriter {
    constructor(formatName, templateName, defaultInputName) { ... }
    parseTitle(content, inputFile) { ... }  // shared title extraction
    getOutputPath(inputFile) { ... }  // shared logic
    resolveTemplatePath() { ... }  // shared logic via resolver.js
    readTemplate() { ... }  // shared template reading, null if not found
    writeOutput(inputFile, content) { ... }  // shared mkdir + write + return path
    abstract render(content, metadata)  // must be overridden
  }
  ```
- **Template resolution path:** calls `resolveTemplate('{templateName}')`, looking up `src/templates/{user|default}/{templateName}`. Template names follow the format name (e.g., `blog.md` for blog), but can differ (e.g., `slide.md` for slides format).
- **Output path logic:** `ai-brief-output/{formatName}/{inputName}-{formatName}.md`
- **Contract enforcement:** The base class `render()` method throws `new Error('FormatWriter subclasses must implement render(content, metadata)')` if not overridden
- **Refactoring blog.js should:**
  - Change `class BlogWriter extends FormatWriter` with constructor calling `super('blog', 'blog.md', 'post')`
  - Keep existing `render()` logic but use inherited `parseTitle()`, `readTemplate()`, `writeOutput()`
- **Refactoring slides.js should:**
  - Change `class SlidesWriter extends FormatWriter` with constructor calling `super('slides', 'slide.md', 'deck')`
- **Runner integration:** The runner loads format writers by importing the module. No special dispatch needed — each module exports a class that extends `FormatWriter`. The runner calls `new ModuleClass().render(content, metadata)`

### Architecture Compliance

- Enables extensibility per `architecture.md` § Format Boundaries
- Writers share template resolution logic per `architecture.md` § Template Boundaries
- Common output naming per `architecture.md` § Naming Patterns

### References

- [Source: architecture.md#Format-Boundaries]
- [Source: architecture.md#Template-Boundaries]
- [Source: architecture.md#File-Organization-Patterns]
- [Source: epics.md#Story-3.3-Format-Writer-Base-Class]

## Dev Agent Record

### Agent Model Used

opencode

### Debug Log References

### Completion Notes List

- Created `FormatWriter` abstract base class in `src/formats/base.js` with:
  - Constructor enforcement (cannot instantiate directly)
  - `parseTitle(content, inputFile)` — shared title extraction (H1 → filename → "Untitled")
  - `getOutputPath(inputFile)` — shared output path generation (`ai-brief-output/{formatName}/{inputName}-{formatName}.md`)
  - `resolveTemplatePath()` — delegates to `resolver.js` with configurable template name
  - `readTemplate()` — reads template content, returns `null` if not found (narrow catch)
  - `writeOutput(inputFile, content)` — mkdir + write + return path
  - Abstract `render(content, metadata)` — throws if not overridden
- Refactored `blog.js` to `BlogWriter extends FormatWriter` — uses inherited `parseTitle`, `readTemplate`, `writeOutput`
- Refactored `slides.js` to `SlidesWriter extends FormatWriter` — uses inherited `parseTitle`, `readTemplate`, `writeOutput`
- Both writers maintain backward-compatible `render` and `orchestrate` exports
- All 227 existing tests pass without modification
- Created 12 new tests in `base.test.js` covering: abstract enforcement, render contract, parseTitle variants, getOutputPath, readTemplate null fallback, mock writer pluggability, NewsletterWriter integration proof
- Total: 239 tests passing

### File List

- `src/formats/base.js` (new)
- `src/formats/blog.js` (refactored)
- `src/formats/slides.js` (refactored)
- `test/formats/base.test.js` (new)

### Change Log

- 2026-06-14: Implemented FormatWriter base class, refactored blog.js and slides.js, created 12 new tests. All 239 tests passing.
