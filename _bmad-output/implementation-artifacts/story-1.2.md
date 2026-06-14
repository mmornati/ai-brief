---
baseline_commit: f77b79af0dacc532203f8d969767fc86cedeb94c
---

# Story 1.2: Install Script

Status: review

## Story

As a user,
I want to run `./install.sh` to set up ai-brief in my project,
So that the tool is registered with my AI assistant (opencode and/or Claude Code) without manual setup.

## Acceptance Criteria

1. **Given** a project with opencode installed, **When** I run `./install.sh`, **Then** a skill is registered at `.opencode/agents/skills/ai-brief-*/SKILL.md` and template files are copied to `ai-brief/templates/` and step prompt files are copied to `ai-brief/steps/`
2. **Given** a project with Claude Code installed, **When** I run `./install.sh`, **Then** skills are registered at `.claude/skills/ai-brief-*/`
3. **Given** both opencode and Claude Code are installed, **When** I run `./install.sh`, **Then** skills are registered for both IDEs
4. **Given** I run `./install.sh` on an existing installation with modified templates, **Then** modified stock templates are detected and copied to `templates/user/` with a warning, and originals preserved with `.bak` suffix before overwrite
5. **Given** I run `./install.sh --dry-run`, **Then** it prints what would be done without modifying any files
6. **Given** no AI assistant is detected, **When** I run `./install.sh`, **Then** it prints an error message and exits with code 1

## Tasks / Subtasks

- [x] Task 1: Create `install.sh` (AC: #1-6)
  - [x] Implement IDE auto-detection (check `.opencode/` and `.claude/` directories)
  - [x] Implement skill registration: copy SKILL.md templates to IDE-specific paths
  - [x] Implement template deployment: copy `src/templates/default/` to project `ai-brief/templates/`
  - [x] Implement step prompt deployment: copy `steps/` to project `ai-brief/steps/`
  - [x] Implement `.bak` backup logic for existing files (AC: #4)
  - [x] Implement `--dry-run` flag (AC: #5)
  - [x] Implement error handling for missing IDE (AC: #6)
  - [x] Create `src/install.js` with the core Node.js install logic
- [x] Task 2: Create install tests (AC: verified)
  - [x] Create `test/install.test.js` testing detection, file copy, backup, dry-run
  - [x] Use real temp directory for deterministic testing

## Dev Notes

- **Architecture reference:** `architecture.md` § Install Flow — install.sh auto-detects IDE and registers skills
- **Script design:** `install.sh` is a thin bash wrapper that calls `node src/install.js` for the heavy lifting
- **Skill registration paths:**
  - opencode: `.opencode/agents/skills/<skill-name>/SKILL.md`
  - Claude Code: `.claude/skills/<skill-name>/SKILL.md`
- **Template deployment:** Copy `src/templates/default/brief.md`, `story.md`, `slide.md` → `ai-brief/templates/{format}/default.md`
- **Backup convention:** Before overwriting a file, rename original to `{file}.bak`. If a `.bak` already exists, overwrite it (last backup wins)
- **Dry-run:** Walk through all operations, print what would happen, exit 0 without touching disk
- **Node.js installer logic** in `src/install.js`: function `install(targetDir, options)` where options include `{ dryRun, ides: string[] }`
- **File utility reuse:** Use `src/utils/file.js` for copy, mkdir, backup operations (create stubs if they don't exist yet, refine in later stories)

### Architecture Compliance

- Follow IDE abstraction pattern from `architecture.md` § Format Patterns — skill files generated per IDE
- Naming: kebab-case with `ai-brief-` prefix for all skill directories
- Output path: `src/formats/opencode.js` pattern used for opencode SKILL.md generation

### References

- [Source: architecture.md#Install-Flow]
- [Source: architecture.md#Complete-Project-Directory-Structure]
- [Source: epics.md#Story-1.2-Install-Script]

## Change Log

- Created install.sh thin bash wrapper with argument passthrough
- Created src/install.js core Node.js installer with IDE auto-detection, skill registration, template/step deployment, .bak backup, --dry-run, and error handling
- Created src/utils/file.js with file system utility functions
- Created src/utils/paths.js with path resolution utilities
- Created test/install.test.js with 10 comprehensive tests
- All 17 tests pass (10 new + 7 existing)

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash-free

### Debug Log References

- All 17 tests pass (10 install + 7 existing)

### Completion Notes List

- Created `src/utils/file.js` with utility functions: exists, mkdir, copy, backup, readFile, writeFile, readdir, stat
- Created `src/utils/paths.js` with path resolution utilities (stubs — expand as needed)
- Created `src/install.js` with core Node.js install logic: `install(targetDir, options)` with support for IDE auto-detection, skill registration, template/step deployment, .bak backup, --dry-run, and error handling
- Created `install.sh` thin bash wrapper that delegates to `src/install.js`
- Created `test/install.test.js` with 10 tests covering: opencode registration, claude registration, dual IDE registration, no-IDE error, template deployment, step prompt deployment, backup logic, dry-run, auto-detection, and empty source handling
- All tests pass with no regressions

### File List

- `install.sh`
- `src/install.js`
- `src/utils/file.js`
- `src/utils/paths.js`
- `test/install.test.js`
