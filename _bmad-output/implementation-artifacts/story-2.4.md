---
baseline_commit: 7fe2f0ad0bfe028c452c9a78c23efc6ec0f3f44d
---

# Story 2.4: IDE Skill Registration

Status: done

## Story

As a user,
I want skill files generated so my AI assistant can invoke the pipeline,
So that I can run `ai-brief blog docs/idea.md` directly from my editor.

## Acceptance Criteria

1. **Given** opencode is installed, **When** the skill registration runs, **Then** a SKILL.md is written to `.opencode/agents/skills/ai-brief-run/SKILL.md` and it references the main CLI entry point
2. **Given** Claude Code is installed, **When** the skill registration runs, **Then** a skill definition is written to `.claude/skills/ai-brief-run/` and it references the main CLI entry point
3. **Given** the pipeline definition changes (steps added/removed), **When** `./install.sh` runs again, **Then** skill files are regenerated to match the current pipeline definition
4. **Given** a format is added to `formats.json`, **When** skill registration runs, **Then** a corresponding skill file is created for that format

## Tasks / Subtasks

- [x] Task 1: Create opencode SKILL.md generator (AC: #1)
  - [x] Create `src/formats/opencode.js` with `generateSkill(pipelineDef, formatDef)` function
  - [x] Generate SKILL.md for each format (blog, slides) + a master `ai-brief-run` skill
  - [x] SKILL.md references CLI entry point with appropriate flags
- [x] Task 2: Create Claude Code skill generator (AC: #2)
  - [x] Create `src/formats/claude.js` with `generateSkill(pipelineDef, formatDef)` function
  - [x] Follow Claude Code skill structure
- [x] Task 3: Wire skill generation into install (AC: #3, #4)
  - [x] Update `src/install.js` to call format generators after template deployment
  - [x] Regenerate on every install run
- [x] Task 4: Create tests
  - [x] Create `test/formats/opencode.test.js`
  - [x] Create `test/formats/claude.test.js`
  - [x] Verify output structure against IDE documentation

### Review Findings

- [x] [Review][Patch] Double `ai-brief-` prefix in generated skill paths [src/install.js:53-56, src/formats/opencode.js:24,54, src/formats/claude.js:26,58]
- [x] [Review][Patch] Master skill uses the first format's generator instead of the IDE's own generator [src/install.js:244-256]
- [x] [Review][Patch] Path traversal & markdown injection via unvalidated `formatName` [src/formats/opencode.js:1, src/formats/claude.js:1]
- [x] [Review][Patch] Bare `catch {}` swallows file/JSON/import errors silently [src/install.js:209-211, 217-219, 240-242]
- [x] [Review][Patch] `formats` may be null or `formats.formats` non-array [src/install.js:225]
- [x] [Review][Patch] `formatDef.orchestrator` may be undefined/non-string [src/install.js:229-230]
- [x] [Review][Patch] `gen.generateSkill` may return null/non-object [src/install.js:243-244]
- [x] [Review][Patch] `masterGen.generateMasterSkill` may return null/non-object [src/install.js:255-256]
- [x] [Review][Patch] Only one of pipeline.json/formats.json readable — silently discards the other [src/install.js:208-214]
- [x] [Review][Patch] Unknown IDE values silently default to opencode path [src/install.js:53-56]
- [x] [Review][Patch] Step entries may be null or missing name/description [src/formats/opencode.js:5, src/formats/claude.js:5]
- [x] [Review][Patch] `formats` arg may be null/array of bad shape in masterSkill [src/formats/opencode.js:29-31, src/formats/claude.js:31-33]
- [x] [Review][Patch] No integration tests for `generateSkillsFromPipeline` (double-prefix bug etc. would not be caught) [test/install.test.js]
- [x] [Review][Patch] Claude Code skill missing YAML frontmatter (dev note: "typically a YAML or JSON definition file plus a SKILL.md") [src/formats/claude.js]
- [x] [Review][Patch] README does not document skill-file regeneration/overwrite behavior [README.md]
- [x] [Review][Defer] `orchestrate` default export is a no-op stub — deferred, pre-existing (runner contract; not story 2.4 scope)
- [x] [Review][Defer] Hardcoded `node src/cli.js run` in generated docs — deferred, pre-existing (install-docs story)
- [x] [Review][Defer] No backup for generated skill writes — deferred, pre-existing (spec explicitly states overwrite-on-install)
- [x] [Review][Defer] No warning when IDE has no master skill generator — deferred, pre-existing (low priority)

## Dev Notes

- **opencode SKILL.md structure:**
  ```markdown
  # ai-brief-run
  Run the ai-brief pipeline on a markdown file.
  Usage: node src/cli.js run <input> --format <format>
  ```
- **Claude Code skill structure:** Follow `.claude/skills/` convention — typically a YAML or JSON definition file plus a SKILL.md
- **Format generators share a common interface:** `generateSkill(steps, format)` returning `{ skillDir: string, skillContent: string }`
- **IDEs to support in v1:** opencode (primary), Claude Code (secondary). Auto-detect by checking for `.opencode/` and `.claude/` directories
- **Skill file output paths:**
  - opencode: `.opencode/agents/skills/ai-brief-{format}/SKILL.md`
  - Claude Code: `.claude/skills/ai-brief-{format}/`
- **Regeneration:** Always regenerate on install. User modifications to skill files will be overwritten — document this in README

### Architecture Compliance

- Separate format writers per IDE target per AR-4 (`architecture.md` § IDE abstraction)
- Output matches paths in `architecture.md` § Complete Project Directory Structure
- Naming: kebab-case with `ai-brief-` prefix per AR-7

### References

- [Source: architecture.md#Format-Boundaries]
- [Source: architecture.md#Structure-Patterns]
- [Source: architecture.md#Integration-Points]
- [Source: epics.md#Story-2.4-IDE-Skill-Registration]

## Dev Agent Record

### Agent Model Used

opencode/deepseek-v4-flash-free

### Debug Log References

### Completion Notes List

- Implemented `src/formats/opencode.js` with `generateSkill(pipelineDef, formatDef)` and `generateMasterSkill(pipelineDef, formats)` functions. Also exports default `orchestrate` for runner compatibility.
- Implemented `src/formats/claude.js` with `generateSkill(pipelineDef, formatDef)` and `generateMasterSkill(pipelineDef, formats)` functions. Also exports default `orchestrate` for runner compatibility. Includes Claude Code skill header.
- Updated `src/install.js` — added `generateSkillsFromPipeline()` function that loads pipeline definition, iterates over detected IDEs and formats, and calls format generators to produce SKILL.md files. Called after template deployment in the `install()` function.
- Created `test/formats/opencode.test.js` (10 tests) — covers generateSkill output structure, CLI reference, step listing, empty steps, master skill generation.
- Created `test/formats/claude.test.js` (10 tests) — covers generateSkill output structure, Claude Code header, CLI reference, step listing, empty steps, master skill generation.
- All 185 tests pass (10 test files).

### File List

- `src/formats/opencode.js` (new)
- `src/formats/claude.js` (new)
- `src/install.js` (update)
- `test/formats/opencode.test.js` (new)
- `test/formats/claude.test.js` (new)

## Change Log

- 2026-06-14: Initial implementation — format generators for opencode and Claude Code, wired into install pipeline, with tests.
