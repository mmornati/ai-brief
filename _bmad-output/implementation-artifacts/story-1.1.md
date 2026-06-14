---
baseline_commit: bbc37f10b715ace0313c05cd8d38dbd22ff758c8
---

# Story 1.1: Project Scaffold & Toolchain

Status: review

## Story

As a developer,
I want the project directory structure and test toolchain initialized,
So that I can start implementing features with a consistent layout and testable code from the start.

## Acceptance Criteria

1. **Given** the project root directory exists, **When** the project is scaffolded, **Then** the following directories exist: `src/pipeline/`, `src/formats/`, `src/templates/`, `src/utils/`, `pipeline-definition/`, `test/`, `ai-brief-output/steps/`
2. **Given** `package.json` is created, **When** inspected, **Then** it contains `"type": "module"`, and scripts for `"test"` (vitest), `"test:watch"`, and `"test:coverage"`
3. **Given** the test toolchain is set up, **When** `npm test` is executed, **Then** it runs vitest and at least one sanity test passes
4. **Given** `.gitignore` exists, **When** inspected, **Then** it excludes `node_modules/`, `ai-brief-output/`, `.step-*.completed`, `.step-*.failed`, and editor-specific files
5. **Given** the project root, **When** I run `node src/cli.js --help`, **Then** it prints usage info (even if commands are stubs)
6. **Given** `README.md` exists, **When** inspected, **Then** it has a project description, install instructions, and usage overview

## Tasks / Subtasks

- [x] Task 1: Create directory structure (AC: #1)
  - [x] Create `src/pipeline/`, `src/formats/`, `src/templates/default/`, `src/templates/user/`, `src/utils/`
  - [x] Create `pipeline-definition/`, `test/`, `ai-brief-output/steps/`, `steps/`
- [x] Task 2: Initialize Node.js project (AC: #2)
  - [x] Create `package.json` with `"type": "module"` and test scripts
  - [x] Install vitest as dev dependency
  - [x] Create `vitest.config.js` with defaults
- [x] Task 3: Create `.gitignore` (AC: #4)
- [x] Task 4: Create stub CLI entry point (AC: #5)
  - [x] Create `src/cli.js` with `#!/usr/bin/env node` and basic argument parsing
  - [x] Register stubs for `init`, `run`, `status`, `resume` commands (each prints a help message)
- [x] Task 5: Create sanity test (AC: #3)
  - [x] Create `test/sanity.test.js` that imports from `src/cli.js` and verifies it exports expected command map
- [x] Task 6: Create `README.md` (AC: #6)

## Dev Notes

- **Architecture reference:** `architecture.md` § Project Structure & Boundaries — the source tree must exactly match the documented layout
- **Orchestration Decision:** ADR-1 in architecture.md (Node.js CLI Runner) is confirmed — `src/pipeline/runner.js` will be the pipeline engine
- **Package manager:** npm only (no yarn/pnpm). No runtime dependencies in v1 — vitest is dev-only
- **Node.js:** Use LTS (>=18). Specify `"engines": { "node": ">=18" }` in package.json
- **Testing:** vitest 3.x. Use `describe`/`it`/`expect` globals. No jsdom or browser environment needed
- **ESM only:** All source files use ESM (`import`/`export`). No CommonJS. `"type": "module"` in package.json
- **CLI stub:** Use bare `process.argv` parsing (no commander/yargs dependency). Acceptable for v1
- **Path conventions:** All paths use kebab-case. Source files use camelCase names (e.g., `stepLoader.js`)

### Project Structure Notes

- Strict alignment with `architecture.md` § Complete Project Directory Structure
- `ai-brief-output/` is gitignored — contains runtime output only
- `steps/` at root level holds the step prompt `.md` files (matches architecture spec)
- `pipeline-definition/` at root level holds JSON config files

### References

- [Source: architecture.md#Project-Structure--Boundaries]
- [Source: architecture.md#Implementation-Patterns--Consistency-Rules]
- [Source: epics.md#Story-1.1-Project-Scaffold--Toolchain]

## Change Log

- 2026-06-14: Implemented story 1.1 — project scaffold and toolchain initialized

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash-free

### Debug Log References

### Completion Notes List

- Created project directory structure matching architecture.md project layout
- Initialized Node.js project with ESM, vitest 3.x, and Node >=18 engine requirement
- Added `.gitignore` excluding node_modules, ai-brief-output, step markers, and editor files
- Created stub CLI entry point with `init`, `run`, `status`, `resume` commands and `--help`
- Added sanity test verifying the commands export map
- Created README.md with install, usage, and development instructions

### File List

- `package.json`
- `.gitignore`
- `vitest.config.js`
- `src/cli.js`
- `test/sanity.test.js`
- `README.md`
- `src/pipeline/.gitkeep`
- `src/formats/.gitkeep`
- `src/templates/default/.gitkeep`
- `src/templates/user/.gitkeep`
- `src/utils/.gitkeep`
- `pipeline-definition/.gitkeep`
- `ai-brief-output/steps/.gitkeep`
- `steps/.gitkeep`
