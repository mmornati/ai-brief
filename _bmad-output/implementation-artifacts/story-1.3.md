# Story 1.3: Orchestration Design & Step Contract

Status: ready-for-dev

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

- [ ] Task 1: Define types and contracts (AC: #1)
  - [ ] Create `src/pipeline/types.js` with JSDoc typedefs
  - [ ] Export `StepIO`, `PipelineState`, `StepDefinition`, `FormatDefinition` types
- [ ] Task 2: Create pipeline definition files (AC: #3, #4)
  - [ ] Create `pipeline-definition/pipeline.json` with 6-step sequence
  - [ ] Create `pipeline-definition/formats.json` with blog → opencode and slides → claude mappings
- [ ] Task 3: Contract validation tests (AC: #2, #5)
  - [ ] Create `test/pipeline/types.test.js` validating contract shapes
  - [ ] Test malformed JSON handling

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

### Debug Log References

### Completion Notes List

### File List

- `src/pipeline/types.js`
- `pipeline-definition/pipeline.json`
- `pipeline-definition/formats.json`
- `test/pipeline/types.test.js`
