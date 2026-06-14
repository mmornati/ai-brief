---
baseline_commit: 448e3f6e9cc34aa691599c8e35de7c10529b2482
---

# Story 2.2: Pipeline Runner

Status: review

## Story

As a user,
I want to run the pipeline on a markdown input file,
So that my rough notes are transformed into structured content through a series of AI-assisted steps.

## Acceptance Criteria

1. **Given** I run `node src/cli.js run docs/idea.md --format blog`, **When** the pipeline starts, **Then** it loads steps from `pipeline-definition/pipeline.json`, and executes each step sequentially, passing accumulated context
2. **Given** a step completes successfully, **When** the runner saves the intermediate output, **Then** it writes to `ai-brief-output/steps/{n}-{step-name}.md` and creates a `.step-{n}.completed` marker file
3. **Given** I run `node src/cli.js run docs/idea.md --format slides`, **When** the pipeline starts, **Then** it loads the slides format writer and step prompts, and produces Marp-compatible output
4. **Given** a step fails, **When** the runner encounters the error, **Then** it logs the step name and error message to console, writes a `.step-{n}.failed` marker file with error details, and stops (does not continue to next step)
5. **Given** no arguments are passed, **When** `node src/cli.js` is executed without subcommand, **Then** it displays usage help with available commands and examples
6. **Given** the `--format` flag is missing, **When** the runner starts, **Then** it exits with error: `--format is required (blog|slides)`

## Tasks / Subtasks

- [x] Task 1: Update CLI entry point (AC: #5, #6)
  - [x] Update `src/cli.js` with proper `run`, `status`, `resume` command routing
  - [x] Implement `--help`, `--format` flags
  - [x] Validate required `--format` argument
- [x] Task 2: Create pipeline runner (AC: #1-4)
  - [x] Create `src/pipeline/runner.js` with `runPipeline(inputFile, format)` function
  - [x] Step execution loop: for each step, read prompt, pass accumulated content, write output
  - [x] Intermediate output file naming: `ai-brief-output/steps/{n}-{step-name}.md`
  - [x] Marker file creation: `.step-{n}.completed` / `.step-{n}.failed`
  - [x] Error handling: catch per-step errors, write `.failed` marker, stop pipeline
- [x] Task 3: Create tests (AC: verified)
  - [x] Create `test/pipeline/runner.test.js`
  - [x] Mock step definitions, test happy path, error path, format selection
  - [x] Test marker file creation in temp directories

## Dev Notes

- **Runner architecture:**
  ```
  runner.runPipeline(inputFile, format)
    → loadSteps() from step-loader
    → for each step:
        → readPrompt(step.promptFile)
        → executeStep(content, prompt)   // delegates to AI assistant
        → writeOutput(n, stepName, content)
        → writeMarker(n, 'completed')
    → on error: writeMarker(n, 'failed', error)
    → on complete: invoke format orchestrator
  ```
- **Step execution** delegates to the AI assistant — the runner does NOT call an AI model. It passes the context + prompt to the host environment and captures stdout. Pattern: `const result = await executePrompt(prompt + '\n\n' + accumulatedContent)`
- **Intermediate file format:** `ai-brief-output/steps/01-validate.md`, `ai-brief-output/steps/05-format.md`, etc.
- **Marker file format:** `.step-1.completed` is an empty file (presence = completed). `.step-1.failed` contains the error message text
- **Accumulated context:** Start with the input file content. Each step appends its output. The full accumulated content is passed to the next step
- **Format selection:** At the end of all steps, load the format orchestrator module from the formats mapping and call it with the final accumulated content
- **File system operations** use `src/utils/file.js` — create stubs as needed: `ensureDir(path)`, `writeFile(path, content)`, `fileExists(path)`
- **process.chdir()** is acceptable for resolving relative paths, but prefer explicit path resolution via `src/utils/paths.js`

### Architecture Compliance

- Follows ADR-1 (Node.js CLI Runner) — `runner.js` is the single entry point for pipeline execution
- File-presence state tracking per AR-5 (`.completed`/`.failed` markers, no JSON state)
- Step output naming: `{n}-{step-name}.md` per `architecture.md` § Structure Patterns
- Format orchestration called after all steps complete per `architecture.md` § Integration Points

### References

- [Source: architecture.md#Orchestration-Approach]
- [Source: architecture.md#Pipeline-Boundaries]
- [Source: architecture.md#Integration-Points]
- [Source: epics.md#Story-2.2-Pipeline-Runner]

### Review Findings

- [x] [Review][Patch] Step index inconsistency between output filenames and marker files [src/pipeline/runner.js:47]
- [x] [Review][Patch] `runPipeline` silently swallows step failures, causing CLI to exit 0 on failure [src/pipeline/runner.js:68-73]
- [x] [Review][Patch] Test 'stops on step failure' should expect throw and assert `console.error` was called [test/pipeline/runner.test.js:82-109]
- [x] [Review][Patch] CLI help lacks Examples section; `--format` shown as global option is misleading [src/cli.js:62-72]
- [x] [Review][Defer] Stale state cleanup on pipeline re-run (out of scope — resume is story 2.3) — deferred, pre-existing
- [x] [Review][Defer] `parseArgs` doesn't support `--format=value` equals form (minor, out of scope) — deferred, pre-existing
- [x] [Review][Defer] Dynamic `import(absPath)` caches modules — orchestrator hot-reload not supported (edge case) — deferred, pre-existing
- [x] [Review][Defer] `inputFile` accepts absolute paths and `..` traversal (user-controlled CLI, low risk) — deferred, pre-existing

## Change Log

- Implemented CLI `run` command with `--format` flag validation (2026-06-14)
- Implemented pipeline runner with step execution loop, output/marker files, error handling (2026-06-14)
- Added comprehensive runner tests covering happy path, failure, format selection, custom executePrompt (2026-06-14)

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash-free

### Debug Log References

- Debugged runner output path resolution (`outDir` always appended `steps` segment, fixed by making `outDir` fully configurable via options)

### Completion Notes List

- Implemented Pipeline Runner story 2.2:
  - Updated `src/cli.js` with proper `run` command that accepts `<inputFile>` and `--format <format>`, validates required `--format`, and invokes `runPipeline`
  - Created `src/pipeline/runner.js` with `runPipeline(inputFile, format, options?)` that: loads steps from pipeline-definition, reads step prompts, passes accumulated content through steps, writes output + marker files, handles errors with `.failed` markers, and calls format orchestrator on completion
  - Created `test/pipeline/runner.test.js` with 7 tests covering: full step execution, content accumulation, failure handling, unknown format rejection, empty steps, custom executePrompt injection, and format orchestrator invocation

### File List

- `src/cli.js` (update)
- `src/pipeline/runner.js`
- `test/pipeline/runner.test.js`
