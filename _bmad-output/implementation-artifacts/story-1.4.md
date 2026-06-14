---
baseline_commit: 5bb6a687d37976609c64056ee3f229819785bacc
---

# Story 1.4: Step Prompts & Templates

Status: review

## Story

As a user,
I want pipeline step prompts and output templates to exist,
So that the pipeline has content to work with from the start.

## Acceptance Criteria

1. **Given** the steps directory exists, **When** I inspect `steps/`, **Then** the following prompt files exist: `validate.md`, `research.md`, `structure.md`, `write.md`, `format.md`, `review.md`, each with step-specific instructions for the AI assistant
2. **Given** the templates directory exists, **When** I inspect `src/templates/default/`, **Then** `brief.md` exists with frontmatter (`title`, `date`, `tags`) and sections (intro, body, conclusion), and `story.md` exists with story template structure, and `slide.md` exists with Marp-compatible `---` slide separators and speaker notes
3. **Given** naming conventions are established, **When** I inspect skill names, file names, and directory names, **Then** all follow kebab-case convention with `ai-brief-` prefix where applicable
4. **Given** the step prompt `validate.md`, **When** read, **Then** it instructs the AI to validate input markdown for structure, spelling, and completeness
5. **Given** the step prompt `review.md`, **When** read, **Then** it instructs the AI to do an adversarial/final review pass

## Tasks / Subtasks

- [x] Task 1: Create step prompt files (AC: #1, #4, #5)
  - [x] Write `steps/validate.md` — validate input structure, spelling, completeness
  - [x] Write `steps/research.md` — research domain, find relevant sources
  - [x] Write `steps/structure.md` — build outline from research + input
  - [x] Write `steps/write.md` — compose full content from outline
  - [x] Write `steps/format.md` — apply template format (blog/slides)
  - [x] Write `steps/review.md` — adversarial review pass, polish
- [x] Task 2: Create default templates (AC: #2)
  - [x] Write `src/templates/default/brief.md` — frontmatter + sections
  - [x] Write `src/templates/default/story.md` — story template
  - [x] Write `src/templates/default/slide.md` — Marp-compatible slides
- [x] Task 3: Verify naming conventions (AC: #3)

## Dev Notes

- **Kebab-case everywhere:** `steps/validate.md`, `src/templates/default/brief.md`, skill files use `ai-brief-validate` pattern
- **Step prompts** are plain markdown files. Each begins with a `#` title and contains instructions for the AI assistant. They reference the accumulated context file as `{input-file}` — the runner/pipeline will substitute the actual path
- **Blog frontmatter:** `title`, `date`, `tags`, `draft` (static-site-generator-compatible YAML frontmatter)
- **Slide format:** Marp-compatible. `---` separates slides. `<!-- speaker: note text -->` for speaker notes. `<!-- _class: -->` for themes
- **Step prompt content pattern:** Each prompt should instruct the AI to:
  1. Read the accumulated context (from previous step)
  2. Perform the step's operation
  3. Output the result as markdown
  4. Include accumulated content from previous steps
- **Do NOT use template variables** like `{{variable}}` in prompts — the runner will handle context injection
- These files are **user-editable** — write clear, self-contained prompts

### References

- [Source: architecture.md#Structure-Patterns]
- [Source: architecture.md#Format-Patterns]
- [Source: architecture.md#Complete-Project-Directory-Structure]
- [Source: epics.md#Story-1.4-Step-Prompts--Templates]

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash-free

### Debug Log References

- All 92 tests passing (28 new for story 1.4, 64 existing)

### Completion Notes List

1. Created 6 step prompt files in `steps/` — each with step-specific instructions for the AI assistant, following the pattern of reading accumulated context, performing the step's operation, outputting as markdown, and including accumulated content
2. Created 3 default templates in `src/templates/default/` — `brief.md` with YAML frontmatter and structured sections, `story.md` with standard story template, `slide.md` with Marp-compatible format and speaker notes
3. Created `test/steps-and-templates.test.js` with 28 tests covering all acceptance criteria (file existence, content validation, naming conventions, format checks)
4. Verified all step names in pipeline.json match actual step files

### File List

- `steps/validate.md`
- `steps/research.md`
- `steps/structure.md`
- `steps/write.md`
- `steps/format.md`
- `steps/review.md`
- `src/templates/default/brief.md`
- `src/templates/default/story.md`
- `src/templates/default/slide.md`
- `test/steps-and-templates.test.js`

## Change Log

- Implemented story 1.4: created 6 step prompt files (validate, research, structure, write, format, review), 3 default templates (brief, story, slide), and 28 tests validating all acceptance criteria (2026-06-14)
