---
baseline_commit: bbc37f10b715ace0313c05cd8d38dbd22ff758c8
---

# Story 1.1: Project Scaffold & Toolchain

Status: done

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

### Review Findings

- [x] [Review][Patch] .gitignore regression: dropped `.opencode/`, `.agents/`, `_bmad/` [`.gitignore`]
- [x] [Review][Patch] `ai-brief-output/steps/.gitkeep` was not tracked (parent dir ignored); force-tracked
- [x] [Review][Patch] README referenced non-existent `./install.sh`; replaced with `npm install` [`README.md`]
- [x] [Review][Patch] README claimed MIT but no LICENSE file; added MIT LICENSE [`LICENSE`]
- [x] [Review][Patch] README `<repo-url>` placeholder; replaced with concrete clone URL [`README.md`]
- [x] [Review][Patch] .gitignore missing `.env*` and `coverage/`; added [`.gitignore`]
- [x] [Review][Patch] Add targeted CLI dispatch tests (--help, -h, no-args, unknown command, valid command, command shape) [`test/sanity.test.js`]
- [x] [Review][Defer] `engines.node: ">=18"` is EOL — deferred, pre-existing (spec Dev Notes mandate ">=18") [`package.json`]
- [x] [Review][Defer] No `bin` field in package.json — deferred, pre-existing (architecture's `install.sh` belongs to a future story) [`package.json`]
- [x] [Review][Defer] No runtime dependencies — deferred, pre-existing (spec Dev Notes: vitest is dev-only) [`package.json`]
- [x] [Review][Defer] Stub commands lack TODO markers — deferred, pre-existing (spec Dev Notes: "acceptable for v1") [`src/cli.js`]
- [x] [Review][Defer] No `--version` / `-V` flag — deferred, pre-existing (not in AC) [`src/cli.js`]
- [x] [Review][Defer] `isMain` symlink fragility — deferred, pre-existing (spec Dev Notes: bare process.argv, "acceptable for v1") [`src/cli.js:40`]
- [x] [Review][Defer] No try/catch around `cmd.run()` — deferred, pre-existing (improvement, not required by AC) [`src/cli.js:58`]
- [x] [Review][Defer] `.step-*.{completed,failed}` convention undocumented — deferred, pre-existing (future story concern) [`.gitignore`]
- [x] [Review][Defer] No `.nvmrc` — deferred, pre-existing (out of scope for story 1.1)
- [x] [Review][Defer] No lint/format tooling — deferred, pre-existing (out of scope for story 1.1)
- [x] [Review][Defer] Missing `repository`/`bugs`/`homepage` in package.json — deferred, pre-existing (out of scope for story 1.1) [`package.json`]
- [x] [Review][Defer] `src/cli.js` not executable (shebang dead) — deferred, pre-existing (AC #5 specifies `node src/cli.js`) [`src/cli.js`]
- [x] [Review][Defer] Architecture expects `src/init.js` — deferred, pre-existing (out of scope for story 1.1) [`architecture.md:194`]
- [x] [Review][Defer] `src/templates/.gitkeep` placeholder not created — deferred, pre-existing (AC #1 satisfied via `default/` and `user/` subdirs)
- [x] [Review][Defer] Empty `.gitkeep` placeholders may rot — deferred, pre-existing (required by AC #1)

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
