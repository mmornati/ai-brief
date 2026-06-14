# Story 3.2: Slide Deck Writer

Status: ready-for-dev

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

- [ ] Task 1: Create slides format writer (AC: #1, #2)
  - [ ] Create `src/formats/slides.js` with `render(content, metadata)` function
  - [ ] Implement content-to-slide segmentation (H2 headers = new slide)
  - [ ] Generate title slide from input metadata
  - [ ] Format speaker notes as `<!-- speaker: note text -->`
  - [ ] Implement template loading via resolver (user → default chain)
  - [ ] Implement output path: `ai-brief-output/slides/{input-name}-slides.md`
- [ ] Task 2: Wire into CLI/runner
  - [ ] Update runner's completion step to call slides writer when `--format slides`
- [ ] Task 3: Create tests (AC: #3, #4)
  - [ ] Create `test/formats/slides.test.js`
  - [ ] Test minimum slide count
  - [ ] Test speaker note formatting
  - [ ] Test template fallback
  - [ ] Test edge case with minimal content

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

### Debug Log References

### Completion Notes List

### File List

- `src/formats/slides.js`
- `src/pipeline/runner.js` (update)
- `test/formats/slides.test.js`
