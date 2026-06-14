---
baseline_commit: c041293
---

# Story 3.2: Slide Deck Writer

Status: review

## Story

As a user,
I want the pipeline to produce a Marp-compatible slide deck,
So that I can present my content using any Marp-compatible renderer.

## Acceptance Criteria

1. **Given** the pipeline completes with `--format slides`, **When** the slides writer processes the final accumulated content, **Then** it produces a markdown file with `---` slide separators between each slide, a title slide at the beginning, speaker notes formatted as `<!-- speaker: note text -->` where available, and saves it to `ai-brief-output/slides/{input-name}-slides.md`
2. **Given** a slide template exists in `src/templates/user/`, **When** the writer loads the template, **Then** it uses the user template instead of the default
3. **Given** the slide output is generated, **When** `test/formats/slides.test.js` validates it, **Then** slides are separated by `---` markers and there are at least 3 slides (title, body, end)
4. **Given** the accumulated content has only a title, **When** the writer processes it, **Then** it produces at least one slide

## Tasks / Subtasks

- [x] Task 1: Create slides format writer (AC: #1, #2)
  - [x] Create `src/formats/slides.js` with `render(content, metadata)` function
  - [x] Implement content-to-slide segmentation (H2 headers = new slide)
  - [x] Generate title slide from input metadata
  - [x] Format speaker notes as `<!-- speaker: note text -->`
  - [x] Implement template loading via resolver (user → default chain)
  - [x] Implement output path: `ai-brief-output/slides/{input-name}-slides.md`
- [x] Task 2: Wire into CLI/runner
  - [x] Update runner's completion step to call slides writer when `--format slides`
- [x] Task 3: Create tests (AC: #3, #4)
  - [x] Create `test/formats/slides.test.js`
  - [x] Test minimum slide count
  - [x] Test speaker note formatting
  - [x] Test template fallback
  - [x] Test edge case with minimal content

## Dev Notes

- **Writer API:** Same interface as blog writer — `render(accumulatedContent, metadata)` returns the output file path
- **Slide segmentation heuristic:**
  - H2 (`##`) headings start a new slide
  - Content before the first H2 = title slide
  - Speaker notes (look for `Note:` or `[speaker]:` patterns in content) → `<!-- speaker: ... -->`
- **Template usage:** Load `slide.md` via resolver. Replace `{{slides}}` placeholder with the generated slide deck content
- **Slide deck structure:**
  ```markdown
  # Title Slide
  Subtitle or metadata

  ---

  ## Section 1
  Content here

  <!-- speaker: Key talking points -->

  ---

  ## Section 2
  More content
  ```
- **Marp compatibility:** Use standard Marp markdown. `---` as slide separator (not `---` with spaces — must be exactly `---` on its own line)
- **Output path:** `ai-brief-output/slides/{input-name}-slides.md`

### Architecture Compliance

- Marp-compatible output per `architecture.md` § Format Patterns
- Slide format: `---` separators, `<!-- speaker: -->` notes, `<!-- _class: -->` for themes
- Template resolution via `src/templates/resolver.js` (Story 1.5)

### References

- [Source: architecture.md#Format-Patterns]
- [Source: architecture.md#Naming-Patterns]
- [Source: epics.md#Story-3.2-Slide-Deck-Writer]

## Dev Agent Record

### Agent Model Used

qwen/qwen3.7-max

### Debug Log References

### Completion Notes List

- Created `src/formats/slides.js` with render/orchestrate exports following blog.js pattern
- Slide segmentation: H2 headings start new slides, content before first H2 becomes title slide
- Speaker notes: extracts `Note:` and `[speaker]:` patterns, formats as `<!-- speaker: ... -->`
- Template: `src/templates/default/slide.md` with Marp frontmatter, `{{slides}}` placeholder
- Updated `pipeline-definition/formats.json` to point slides orchestrator to `src/formats/slides.js`
- Updated `test/pipeline/types.test.js` to match new orchestrator path
- 12 new tests in `test/formats/slides.test.js` covering all ACs
- All 227 tests pass

### File List

- `src/formats/slides.js` (new)
- `src/templates/default/slide.md` (new)
- `pipeline-definition/formats.json` (updated)
- `test/formats/slides.test.js` (new)
- `test/pipeline/types.test.js` (updated)

### Review Findings

- [ ] [Review][Patch] Duplicate title slide — template hardcodes `# Title` + `<!-- _class: lead -->` before `{{slides}}`, code generates its own title slide; produces two title slides with `_class: lead` on the wrong one [`src/templates/default/slide.md:7-9`, `src/formats/slides.js:89-98`]
- [ ] [Review][Patch] Trailing blank slide — template's `---\n<!-- speaker: Closing remarks -->` after `{{slides}}` creates an empty final slide [`src/templates/default/slide.md:15-17`]
- [ ] [Review][Patch] Speaker note `-->` breaks HTML comment — note text interpolated raw into `<!-- speaker: ${n} -->`; a note containing `-->` produces malformed markup [`src/formats/slides.js:69`]
- [ ] [Review][Patch] `String.replace` first-only — `replace('{{slides}}', ...)` only substitutes the first occurrence [`src/formats/slides.js:105`]
- [ ] [Review][Patch] Fragile error-message matching — `includes('not found')` substring check could swallow unrelated errors [`src/formats/slides.js:107`]
- [ ] [Review][Patch] Test file leak — "outputs to…" test doesn't call `trackOutput`, leaving orphaned file [`test/formats/slides.test.js:147-152`]
- [x] [Review][Defer] Speaker notes in fenced code blocks extracted — `extractSpeakerNote` has no code-fence awareness; unlikely in pipeline content [`src/formats/slides.js:16-22`] — deferred, pre-existing
- [x] [Review][Defer] CRLF `\r` in content — `split('\n')` leaves `\r` on lines; pipeline content typically uses LF [`src/formats/slides.js:25`] — deferred, pre-existing
- [x] [Review][Defer] Silent no-op if template lacks `{{slides}}` — user template without placeholder silently discards deck; user error edge case [`src/formats/slides.js:105`] — deferred, pre-existing
