# Story 3.3: Format Writer Base Class

Status: ready-for-dev

## Story

As a developer,
I want a shared base class for all format writers,
So that adding new output formats in the future is straightforward.

## Acceptance Criteria

1. **Given** a format writer base class exists in `src/formats/base.js`, **When** both blog and slides writers extend it, **Then** they share common template resolution logic and common output file naming and path conventions
2. **Given** I create a new format writer (e.g., newsletter), **When** it extends the base class and implements `render(content, metadata)`, **Then** it works with the pipeline without modifying the runner
3. **Given** the base resolver looks up a template, **When** both `default/` and `user/` directories exist, **Then** it checks `src/templates/user/<format>/` first, then `src/templates/default/<format>/`

## Tasks / Subtasks

- [ ] Task 1: Create base writer class (AC: #1, #3)
  - [ ] Create `src/formats/base.js` as an abstract base class
  - [ ] Implement common template resolution (calls `resolver.js`)
  - [ ] Implement common output path generation
  - [ ] Define abstract `render(content, metadata)` method
- [ ] Task 2: Refactor existing writers (AC: #1)
  - [ ] Refactor `src/formats/blog.js` to extend `base.js`
  - [ ] Refactor `src/formats/slides.js` to extend `base.js`
  - [ ] Ensure backward compatibility — existing tests must pass without modification
- [ ] Task 3: Create tests (AC: #2)
  - [ ] Create `test/formats/base.test.js`
  - [ ] Test base class contract enforcement
  - [ ] Create a mock writer extending base to verify pluggability

## Dev Notes

- **Base class interface:**
  ```js
  export class FormatWriter {
    constructor(formatName) { this.formatName = formatName }
    getOutputPath(inputFile) { ... }  // shared logic
    resolveTemplate() { ... }  // shared logic via resolver.js
    abstract render(content, metadata)  // must be overridden
  }
  ```
- **Template resolution path:** `src/templates/user/{formatName}/default.md` → `src/templates/default/{formatName}/default.md`
- **Output path logic:** `ai-brief-output/{formatName}/{inputName}-{formatName}.md`
- **Contract enforcement:** The base class `render()` method throws `new Error('FormatWriter subclasses must implement render(content, metadata)')` if not overridden
- **Refactoring blog.js should:**
  - Change `class BlogWriter extends FormatWriter` with constructor calling `super('blog')`
  - Keep existing `render()` logic but use inherited `getOutputPath()` and `resolveTemplate()`
- **Refactoring slides.js should:**
  - Change `class SlidesWriter extends FormatWriter` with constructor calling `super('slides')`
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

### Debug Log References

### Completion Notes List

### File List

- `src/formats/base.js`
- `src/formats/blog.js` (refactor)
- `src/formats/slides.js` (refactor)
- `test/formats/base.test.js`
