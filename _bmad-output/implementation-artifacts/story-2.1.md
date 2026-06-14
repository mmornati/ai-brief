# Story 2.1: Load Step Definitions

Status: ready-for-dev

## Story

As a developer,
I want the step definitions loaded from `pipeline-definition/pipeline.json`,
So that the pipeline knows which steps to execute and in what order.

## Acceptance Criteria

1. **Given** `pipeline-definition/pipeline.json` exists with valid step definitions, **When** `src/pipeline/step-loader.js` reads the file, **Then** it returns an ordered array of step objects with `name`, `promptFile`, and `description`
2. **Given** `pipeline-definition/pipeline.json` is missing or malformed, **When** `step-loader.js` attempts to read it, **Then** it throws a descriptive error with the file path and the parse issue
3. **Given** `pipeline-definition/pipeline.json` is empty (no steps), **When** `step-loader.js` reads it, **Then** it returns an empty array (no crash)
4. **Given** `pipeline-definition/formats.json` exists, **When** `step-loader.js` reads it, **Then** it returns the format mapping array with `name` and `orchestrator` fields
5. **Given** `pipeline-definition/formats.json` is missing, **When** `step-loader.js` reads it, **Then** it throws an error

## Tasks / Subtasks

- [ ] Task 1: Create step loader (AC: #1, #2, #3)
  - [ ] Create `src/pipeline/step-loader.js` with `loadSteps()` function
  - [ ] Implement JSON read + validation of step structure
  - [ ] Handle missing file, malformed JSON, empty steps
  - [ ] Return `StepDefinition[]` per the contract from Story 1.3
- [ ] Task 2: Create format loader (AC: #4, #5)
  - [ ] Add `loadFormats()` function in same module
  - [ ] Implement JSON read + validation of format structure
  - [ ] Handle missing file
- [ ] Task 3: Create tests (AC: all)
  - [ ] Create `test/pipeline/step-loader.test.js`
  - [ ] Test valid/empty/malformed scenarios
  - [ ] Use fixture JSON files in a `test/fixtures/` directory

## Dev Notes

- **Module:** `src/pipeline/step-loader.js` exports `{ loadSteps, loadFormats, validateStepDefinitions, validateFormatDefinitions }`
- **Validation rules:**
  - Each step must have `name` (string), `promptFile` (string), `description` (string)
  - `promptFile` must end with `.md`
  - `name` must be kebab-case
  - Each format must have `name` (string) and `orchestrator` (string)
  - `orchestrator` must be a path to a `.js` file
- **File paths** in pipeline-definition resolve relative to the project root (use `import.meta.url` or `process.cwd()`)
- **Use fs/promises** (ESM): `import { readFile } from 'node:fs/promises'`
- **Error pattern:** throw `new Error('Failed to load step definitions: {path} — {reason}')`
- **Fixture files** for tests: create `test/fixtures/pipeline-valid.json`, `pipeline-empty.json`, `pipeline-malformed.json`, etc.

### Architecture Compliance

- Contract types (`StepDefinition`, `FormatDefinition`) imported from `src/pipeline/types.js` (Story 1.3)
- Step sequence matches `architecture.md` § Structure Patterns
- Format mapping enables the IDE abstraction from `architecture.md` § Format Patterns

### References

- [Source: architecture.md#Pipeline-Boundaries]
- [Source: architecture.md#Integration-Points]
- [Source: epics.md#Story-2.1-Load-Step-Definitions]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- `src/pipeline/step-loader.js`
- `test/pipeline/step-loader.test.js`
- `test/fixtures/pipeline-valid.json`
- `test/fixtures/pipeline-empty.json`
- `test/fixtures/pipeline-malformed.json`
- `test/fixtures/formats-valid.json`
- `test/fixtures/formats-malformed.json`
