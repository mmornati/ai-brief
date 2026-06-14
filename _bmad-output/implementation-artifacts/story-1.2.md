# Story 1.2: Install Script

Status: ready-for-dev

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

- [ ] Task 1: Create `install.sh` (AC: #1-6)
  - [ ] Implement IDE auto-detection (check `.opencode/` and `.claude/` directories)
  - [ ] Implement skill registration: copy SKILL.md templates to IDE-specific paths
  - [ ] Implement template deployment: copy `src/templates/default/` to project `ai-brief/templates/`
  - [ ] Implement step prompt deployment: copy `steps/` to project `ai-brief/steps/`
  - [ ] Implement `.bak` backup logic for existing files (AC: #4)
  - [ ] Implement `--dry-run` flag (AC: #5)
  - [ ] Implement error handling for missing IDE (AC: #6)
  - [ ] Create `src/install.js` with the core Node.js install logic
- [ ] Task 2: Create install tests (AC: verified)
  - [ ] Create `test/install.test.js` testing detection, file copy, backup, dry-run
  - [ ] Mock filesystem for deterministic testing

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

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- `install.sh`
- `src/install.js`
- `src/utils/file.js` (stubs — expand as needed)
- `src/utils/paths.js` (stubs — expand as needed)
- `test/install.test.js`
