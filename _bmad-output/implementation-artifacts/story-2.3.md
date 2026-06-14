---
baseline_commit: 90c027ffc8b276f538837ddca7d29866285ea0bb
---

# Story 2.3: Pipeline Status & Resume

Status: review

## Story

As a user,
I want to check pipeline status and resume from a failed or interrupted run,
So that I don't lose progress when something goes wrong or I need to take a break.

## Acceptance Criteria

1. **Given** a pipeline run is in progress (some steps completed, markers exist), **When** I run `node src/cli.js status`, **Then** it displays which steps are completed, which are pending, and which (if any) failed
2. **Given** a pipeline run failed at step 3, **When** I fix the issue and run `node src/cli.js resume`, **Then** it reads the last completed step from markers and resumes from the failed step with all prior context restored
3. **Given** no pipeline run has been started, **When** I run `node src/cli.js resume`, **Then** it displays a message that no pipeline run is in progress and exits with a non-zero status code
4. **Given** a pipeline completes all steps successfully, **When** I run `node src/cli.js status`, **Then** it shows all steps as completed and the output file path is displayed
5. **Given** a pipeline run completed successfully, **When** I run `node src/cli.js resume`, **Then** it displays a message that the pipeline is already complete

## Tasks / Subtasks

- [x] Task 1: Create tracker module (AC: #1-5)
  - [x] Create `src/pipeline/tracker.js` with `getStatus()`, `getLastCompletedStep()`, `isComplete()`, `getFailedStep()` functions
  - [x] Implement marker file scanning in `ai-brief-output/steps/`
  - [x] Implement `resume()` that restores accumulated context from last completed step's output
- [x] Task 2: Update CLI (AC: #1-5)
  - [x] Wire `status` command to `tracker.getStatus()`
  - [x] Wire `resume` command to `tracker.resume()` → calls `runner.runPipeline()` from resume point
  - [x] Handle edge cases: no run, complete run, failed run
- [x] Task 3: Create tests
  - [x] Create `test/pipeline/tracker.test.js`
  - [x] Test with various marker states (no markers, partial, complete, failed)
  - [x] Test resume context restoration

## Dev Notes

- **Tracker API:**
  ```js
  getStatus(): { completed: string[], failed: string|null, pending: string[], outputFile: string|null }
  getLastCompletedStep(): number
  getFailedStep(): number|null
  isComplete(): boolean
  resume(inputFile, format): Promise<void>  // restores context, calls runner from failure point
  ```
- **Marker file conventions:**
  - `.step-{n}.completed` — present file = completed
  - `.step-{n}.failed` — present file = failed
  - If both exist for same step, failed takes precedence
- **Resume logic:**
  1. Check for `.failed` markers → resume from first failed step
  2. If no failures, check for `.completed` markers → find the last one
  3. Look at next step after last completed → that's the resume target
  4. Reconstruct accumulated context by reading all `.completed` step output files in order
  5. Call `runner.runPipeline()` with `{ startFrom: resumeStep, accumulatedContext }`
- **Status output format:** Simple console.table or formatted text. Example:
  ```
  Pipeline status for docs/idea.md:
    ✅ 1. validate    — completed
    ✅ 2. research    — completed
    ❌ 3. structure   — FAILED (see .step-3.failed)
    ⏳ 4. write       — pending
    ⏳ 5. format      — pending
    ⏳ 6. review      — pending
  Output: ai-brief-output/blog/idea-blog.md (pending)
  ```
- **Resume CLI example:** `node src/cli.js resume docs/idea.md --format blog`
- The `resume` command needs the same `--format` flag as `run` since it needs to know which format orchestrator to call at the end

### Architecture Compliance

- File-presence state tracking per AR-5 — no JSON state file
- Accumulated context reconstruction reads intermediate output files per AR-6 (step chaining via files)
- Resume restores pipeline without re-running completed steps

### References

- [Source: architecture.md#Pipeline-Boundaries]
- [Source: architecture.md#Step-State-Management]
- [Source: architecture.md#Integration-Points]
- [Source: epics.md#Story-2.3-Pipeline-Status--Resume]

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash-free

### Debug Log References

- All 159 tests pass (including 12 new tracker tests, updated sanity tests)
- Runner updated: added `startFrom`/`accumulatedContext` options + `.failed` marker cleanup on successful resume

### Completion Notes List

- Created `src/pipeline/tracker.js` with `getStatus()`, `getLastCompletedStep()`, `getFailedStep()`, `isComplete()`, `resume()` functions
- Updated `src/pipeline/runner.js` to support `startFrom` and `accumulatedContext` options for resume workflow; also removes `.failed` marker on successful step completion during resume
- Updated `src/cli.js`: wired `status` command to `tracker.getStatus()` with formatted table output; wired `resume` command to `tracker.resume()` with input file and --format args; handles edge cases (no run, complete run, failed run)
- Created `test/pipeline/tracker.test.js` with 12 tests covering all marker states and resume scenarios

### File List

- `src/pipeline/tracker.js` (new)
- `src/pipeline/runner.js` (updated)
- `src/cli.js` (updated)
- `test/pipeline/tracker.test.js` (new)
- `test/sanity.test.js` (updated)
- `_bmad-output/implementation-artifacts/story-2.3.md` (updated)
