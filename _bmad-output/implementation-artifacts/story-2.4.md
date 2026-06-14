# Story 2.4: IDE Skill Registration

Status: ready-for-dev

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

- [ ] Task 1: Create opencode SKILL.md generator (AC: #1)
  - [ ] Create `src/formats/opencode.js` with `generateSkill(pipelineDef, formatDef)` function
  - [ ] Generate SKILL.md for each format (blog, slides) + a master `ai-brief-run` skill
  - [ ] SKILL.md references CLI entry point with appropriate flags
- [ ] Task 2: Create Claude Code skill generator (AC: #2)
  - [ ] Create `src/formats/claude.js` with `generateSkill(pipelineDef, formatDef)` function
  - [ ] Follow Claude Code skill structure
- [ ] Task 3: Wire skill generation into install (AC: #3, #4)
  - [ ] Update `src/install.js` to call format generators after template deployment
  - [ ] Regenerate on every install run
- [ ] Task 4: Create tests
  - [ ] Create `test/formats/opencode.test.js`
  - [ ] Create `test/formats/claude.test.js`
  - [ ] Verify output structure against IDE documentation

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

### Debug Log References

### Completion Notes List

### File List

- `src/formats/opencode.js`
- `src/formats/claude.js`
- `src/install.js` (update)
- `test/formats/opencode.test.js`
- `test/formats/claude.test.js`
