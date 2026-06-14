---
baseline_commit: 48d234d67a33c2a343c31021146d8794a7735f9b
---

# Story 1.3: Orchestration Design & Step Contract

Status: review

## Story

As a developer,
I want the pipeline runner architecture finalized and the step input/output contract defined,
So that all subsequent implementation work has a stable foundation.

## Acceptance Criteria

1. **Given** the orchestration direction is decided, **When** `src/pipeline/types.js` is created, **Then** it exports a JSDoc-typed `StepIO` interface with `{ content: string, metadata: Record<string, unknown>, state: PipelineState }`
2. **Given** `types.js` exists, **When** `test/pipeline/types.test.js` is created, **Then** it validates the contract shape and passes
3. **Given** the pipeline definition, **When** `pipeline-definition/pipeline.json` is created, **Then** it defines the step sequence: `["validate", "research", "structure", "write", "format", "review"]` and each step entry includes a `name`, `promptFile`, and `description`
4. **Given** the pipeline definition, **When** `pipeline-definition/formats.json` is created, **Then** it maps format names (`"blog"`, `"slides"`) to their orchestrator modules (`src/formats/opencode.js`, `src/formats/claude.js`)
5. **Given** `pipeline-definition/pipeline.json` is malformed, **When** validated, **Then** a descriptive error with file path and parse details is thrown

## Tasks / Subtasks

- [x] Task 1: Define types and contracts (AC: #1)
  - [x] Create `src/pipeline/types.js` with JSDoc typedefs
  - [x] Export `StepIO`, `PipelineState`, `StepDefinition`, `FormatDefinition` types
- [x] Task 2: Create pipeline definition files (AC: #3, #4)
  - [x] Create `pipeline-definition/pipeline.json` with 6-step sequence
  - [x] Create `pipeline-definition/formats.json` with blog → opencode and slides → claude mappings
- [x] Task 3: Contract validation tests (AC: #2, #5)
  - [x] Create `test/pipeline/types.test.js` validating contract shapes
  - [x] Test malformed JSON handling

## Dev Notes

- **Types** use JSDoc only (no TypeScript). Pattern:
  ```js
  /** @typedef {{ content: string, metadata: Record<string, unknown>, state: PipelineState }} StepIO */
  /** @typedef {{ stepIndex: number, completedSteps: string[], currentStep: string|null, failedStep: string|null }} PipelineState */
  /** @typedef {{ name: string, promptFile: string, description: string }} StepDefinition */
  ```
- **pipeline.json format:**
  ```json
  { "steps": [
    { "name": "validate", "promptFile": "steps/validate.md", "description": "Validate input markdown" },
    { "name": "research", "promptFile": "steps/research.md", "description": "Research domain context" },
    { "name": "structure", "promptFile": "steps/structure.md", "description": "Structure content outline" },
    { "name": "write", "promptFile": "steps/write.md", "description": "Write full content" },
    { "name": "format", "promptFile": "steps/format.md", "description": "Apply output format" },
    { "name": "review", "promptFile": "steps/review.md", "description": "Review and polish" }
  ] }
  ```
- **formats.json format:**
  ```json
  { "formats": [
    { "name": "blog", "orchestrator": "src/formats/opencode.js" },
    { "name": "slides", "orchestrator": "src/formats/claude.js" }
  ] }
  ```
- **Validation:** Use a `validateDefinition()` function that checks required fields, step ordering, and format module existence
- **Error handling:** Use `cause` property on thrown errors for traceability

### Architecture Compliance

- Confirms ADR-1 (Node.js CLI Runner) as the execution mechanism
- Step sequence matches the pipeline defined in architecture.md § Structure Patterns
- Each step's `promptFile` maps to a file in `steps/` directory created in Story 1.4

### References

- [Source: architecture.md#Orchestration-Approach]
- [Source: architecture.md#Step-State-Management]
- [Source: epics.md#Story-1.3-Orchestration-Design--Step-Contract]

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash-free

### Debug Log References

- All 20 new tests passing; full suite 40/40 passing with no regressions

### Completion Notes List

1. Created `src/pipeline/types.js` with JSDoc typedefs (StepIO, PipelineState, StepDefinition, FormatDefinition) and loader/validation functions (validateDefinition, loadPipelineDefinition, loadFormatDefinition)
2. Created `pipeline-definition/pipeline.json` with 6-step sequence matching architecture.md: validate → research → structure → write → format → review
3. Created `pipeline-definition/formats.json` mapping blog → src/formats/opencode.js and slides → src/formats/claude.js
4. Created `test/pipeline/types.test.js` with 20 tests covering contract shape validation, real file loading, malformed JSON, missing fields, and error cause propagation

### File List

- `src/pipeline/types.js`
- `pipeline-definition/pipeline.json`
- `pipeline-definition/formats.json`
- `test/pipeline/types.test.js`

## Change Log

- Implemented story 1.3: created types.js with JSDoc typedefs, pipeline.json with 6-step sequence, formats.json with format mappings, and types.test.js with 20 validation tests (2026-06-14)
