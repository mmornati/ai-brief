---
baseline_commit: 8ad326d11857a158d69b0c5499ae5fb6becc1557
---

# Story 1.5: Template Override Mechanism

Status: review

## Story

As a user,
I want to customize templates and step prompts without losing my changes on reinstall,
So that I can adapt ai-brief to my workflow without fighting the tool.

## Acceptance Criteria

1. **Given** I edit `src/templates/default/brief.md`, **When** I copy it to `src/templates/user/brief.md` and modify it, **Then** the pipeline uses the `user/` version instead of the `default/` version
2. **Given** templates exist in both `default/` and `user/`, **When** the resolver looks up a template, **Then** it checks `user/` first, then falls back to `default/`
3. **Given** I run `./install.sh` with existing custom templates, **When** it detects changes in `default/` templates, **Then** it creates `.bak` copies of the updated defaults and does not overwrite any file in `user/`
4. **Given** a template doesn't exist in either directory, **When** the resolver looks it up, **Then** it throws a descriptive error listing both paths tried

## Tasks / Subtasks

- [x] Task 1: Create template resolver (AC: #1, #2, #4)
  - [x] Create `src/templates/resolver.js` with `resolveTemplate(templateName)` function
  - [x] Implement user-first resolution chain: check `src/templates/user/{name}` then `src/templates/default/{name}`
  - [x] Implement error for missing templates
  - [x] Create `test/templates/resolver.test.js` covering all 3 paths (user override, default fallback, missing)
- [x] Task 2: Integrate backup into install logic (AC: #3)
  - [x] Update `src/install.js` (from Story 1.2) to use resolver for collision detection
  - [x] Implement `.bak` creation before overwriting default templates

## Dev Notes

- **Resolver API:** `resolveTemplate(templateName: string): string` returns the resolved file path
- **Resolution order:** `src/templates/user/<templateName>` → `src/templates/default/<templateName>` → throw
- **Install integration:** During `install.sh`, compare default template hashes. If a default changed and a `.bak` doesn't exist (or last backup differs), rename existing → copy new default
- **File utils:** Reuse/extend `src/utils/file.js` from Story 1.2 for copy, rename, hash comparison
- **Do NOT use checksums** for v1 — simple file existence + `.bak` presence is sufficient
- **User templates are NEVER overwritten** by install — only defaults may change

### Architecture Compliance

- Follows the override pattern from `architecture.md` § Template Boundaries
- `resolver.js` implements the chain-of-responsibility pattern (user → default)
- `.bak` convention per `architecture.md` § Process Patterns

## Change Log

- Implemented template resolver with user-first override chain (2026-06-14)
- Added user template deployment and backup logic to install.js (2026-06-14)

### References

- [Source: architecture.md#Template-Boundaries]
- [Source: architecture.md#Process-Patterns]
- [Source: epics.md#Story-1.5-Template-Override-Mechanism]

## Dev Agent Record

### Agent Model Used

openmode/deepseek-v4-flash-free

### Debug Log References

### Completion Notes List

- Implemented `src/templates/resolver.js` with `resolveTemplate` and `resolveTemplateFrom` functions
- Resolution chain: user/ first, then default/, with descriptive error for missing templates
- Updated `src/install.js`: added user template deployment from `src/templates/user/`, user override preservation, `.bak` creation for defaults
- Added tests in `test/templates/resolver.test.js` and `test/install.test.js`

### File List

- `src/templates/resolver.js`
- `src/install.js` (update)
- `test/templates/resolver.test.js`
- `test/install.test.js` (extend)
