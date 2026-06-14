# Story 1.1: Project Scaffold & Toolchain

Status: ready-for-dev

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

- [ ] Task 1: Create directory structure (AC: #1)
  - [ ] Create `src/pipeline/`, `src/formats/`, `src/templates/default/`, `src/templates/user/`, `src/utils/`
  - [ ] Create `pipeline-definition/`, `test/`, `ai-brief-output/steps/`, `steps/`
- [ ] Task 2: Initialize Node.js project (AC: #2)
  - [ ] Create `package.json` with `"type": "module"` and test scripts
  - [ ] Install vitest as dev dependency
  - [ ] Create `vitest.config.js` with defaults
- [ ] Task 3: Create `.gitignore` (AC: #4)
- [ ] Task 4: Create stub CLI entry point (AC: #5)
  - [ ] Create `src/cli.js` with `#!/usr/bin/env node` and basic argument parsing
  - [ ] Register stubs for `init`, `run`, `status`, `resume` commands (each prints a help message)
- [ ] Task 5: Create sanity test (AC: #3)
  - [ ] Create `test/sanity.test.js` that imports from `src/cli.js` and verifies it exports expected command map
- [ ] Task 6: Create `README.md` (AC: #6)

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

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- `package.json`
- `.gitignore`
- `vitest.config.js`
- `src/cli.js`
- `test/sanity.test.js`
- `README.md`
