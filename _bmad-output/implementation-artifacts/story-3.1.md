# Story 3.1: Blog Output Writer

Status: done
baseline_commit: 8ae2a141e92118b0efc1951a45f3659cd6e4b287

## Story

As a user,
I want the pipeline to produce a publication-ready blog post in markdown,
So that I can publish it on my static site with minimal editing.

## Acceptance Criteria

1. **Given** the pipeline completes with `--format blog`, **When** the blog writer processes the final accumulated content, **Then** it produces a markdown file with frontmatter (`title`, `date`, `tags`, `draft`) and body content with H2/H3 section headings, and saves it to `ai-brief-output/blog/{input-name}-blog.md`
2. **Given** a blog template exists in `src/templates/user/`, **When** the writer loads the template, **Then** it uses the user template instead of the default
3. **Given** the blog output is generated, **When** `test/formats/blog.test.js` validates it, **Then** frontmatter fields are non-empty and well-formed YAML, and body is non-empty markdown with at least one heading
4. **Given** the final accumulated content is empty, **When** the writer processes it, **Then** it throws a descriptive error

## Tasks / Subtasks

- [x] Task 1: Create blog format writer (AC: #1, #2, #4)
  - [x] Create `src/formats/blog.js` with `render(content, metadata)` function
  - [x] Implement frontmatter extraction/parsing from accumulated content
  - [x] Implement template loading via resolver (user → default chain)
  - [x] Implement output path: `ai-brief-output/blog/{input-name}-blog.md`
  - [x] Handle empty content with descriptive error
- [x] Task 2: Wire into CLI/runner (AC: #1)
  - [x] Update runner's completion step to call blog writer when `--format blog`
  - [x] Register blog format in format selection logic
- [x] Task 3: Create tests (AC: #3)
  - [x] Create `test/formats/blog.test.js`
  - [x] Test template selection (user vs default)
  - [x] Test frontmatter generation
  - [x] Test empty content edge case
  - [x] Use fixture accumulated content

## Dev Notes

- **Writer API:** `render(accumulatedContent: string, metadata: { inputFile: string, format: string }): Promise<string>` — returns the output file path
- **Accumulated content format** (from pipeline): Markdown document with step headers. Blog writer extracts the final content from the `write` and `review` step outputs
- **Frontmatter generation:** Parse the title from the input file name and first H1 heading. Date = today. Tags = extracted from research step output. Draft = `true` by default
- **Template usage:** Load `blog.md` template via resolver. Replace `{{content}}` placeholder with the rendered body. If no template, use a sensible default
- **Output path:** `ai-brief-output/blog/{input-name}-blog.md` where `{input-name}` is the basename of the input file without extension
- **Frontmatter format:** Valid YAML between `---` delimiters:
  ```yaml
  ---
  title: "My Blog Post"
  date: 2026-06-14
  tags: [tech, devtools]
  draft: true
  ---
  ```

### Architecture Compliance

- Template resolution uses `src/templates/resolver.js` (Story 1.5) — user-first chain
- Output naming: `{input-name}-{format}.md` per `architecture.md` § Naming Patterns
- Blog frontmatter: `title`, `date`, `tags`, `draft` per `architecture.md` § Format Patterns

### References

- [Source: architecture.md#Format-Patterns]
- [Source: architecture.md#Naming-Patterns]
- [Source: architecture.md#Template-Boundaries]
- [Source: epics.md#Story-3.1-Blog-Output-Writer]

## Dev Agent Record

### Agent Model Used

opencode / minimax/minimax-m3

### Debug Log References

### Completion Notes List

- Implemented `src/formats/blog.js` exporting both `render(content, metadata)` and a default `orchestrate` function for the runner.
- Frontmatter generation: title parsed from first `# H1` (falls back to `"Untitled"`); date set to ISO date today; tags extracted from a `## Research` section (supports `tags: [a, b]` and `- \`tag\`` bullet forms); `draft: true` always.
- Template loading via `src/templates/resolver.js` (user → default chain). Default template lives at `src/templates/default/blog.md` with `{{frontmatter}}` and `{{content}}` placeholders. Falls back to plain frontmatter+body rendering when no template is present.
- Body extraction strips any existing frontmatter; ensures at least one H2 heading exists in the final body.
- Runner updated to pass `{ inputFile, format }` metadata to the orchestrator (existing formats ignore the extra arg).
- `pipeline-definition/formats.json` updated to point `blog` at `src/formats/blog.js` (was `opencode.js`).
- 11 new tests in `test/formats/blog.test.js` cover frontmatter, body, user-vs-default template selection, empty content error, untitled fallback, heading guarantee, output path, basename handling, and tag extraction.
- Updated 2 existing tests that hardcoded the old template list and the old blog orchestrator path.
- All 213 tests pass.

### File List

- `src/formats/blog.js` (new)
- `src/templates/default/blog.md` (new)
- `src/pipeline/runner.js` (updated: pass metadata to orchestrator)
- `pipeline-definition/formats.json` (updated: blog → `src/formats/blog.js`)
- `test/formats/blog.test.js` (new)
- `test/steps-and-templates.test.js` (updated: include blog.md in default templates)
- `test/pipeline/types.test.js` (updated: blog orchestrator path)

### Change Log

- 2026-06-14: Implemented Story 3.1 — Blog Output Writer. Added `src/formats/blog.js` with frontmatter generation, template resolution (user → default), and output path `ai-brief-output/blog/{input-name}-blog.md`. Wired into runner. 11 new tests, all 213 tests pass.

### Review Findings

- [x] [Review][Decision] Title parsing incomplete per spec — Dev Notes say "Parse title from input file name AND first H1 heading" but code only uses H1 with "Untitled" fallback; filename is never used as a title source [`src/formats/blog.js:6-8`]
- [x] [Review][Patch] Title YAML injection — `generateFrontmatter` wraps title in double quotes without escaping; titles containing `"` produce invalid YAML [`src/formats/blog.js:37`]
- [x] [Review][Patch] extractBody strips horizontal rules — `/---[\s\S]*?---\n*/g` matches any paired `---` in the document, silently destroying body content between horizontal rules [`src/formats/blog.js:47`]
- [x] [Review][Patch] Tags raw YAML injection — tags with YAML-special characters (`:`, `#`, `[`, `]`, `&`, `*`) produce invalid frontmatter [`src/formats/blog.js:33`]
- [x] [Review][Patch] Template placeholder corruption — body containing `{{frontmatter}}` gets corrupted when `.replace('{{frontmatter}}', frontmatter)` runs after content substitution [`src/formats/blog.js:83-84`]
- [x] [Review][Patch] Overly broad catch masks template errors — catches all errors from resolveTemplate+readFile, silently falling back; a permissions error or corrupt template degrades output silently [`src/formats/blog.js:79-83`]
- [x] [Review][Patch] extractTags regex no word boundary — `/^##\s*research/i` matches `## Researching AI`, `## Research-Notes`, etc. [`src/formats/blog.js:16`]
- [x] [Review][Patch] Duplicate tags not deduplicated — extractTags pushes from both sources with no dedup [`src/formats/blog.js:11-28`]
- [x] [Review][Patch] Non-string accumulatedContent bypasses guard — truthy non-strings throw unhelpful TypeError instead of descriptive error [`src/formats/blog.js:62`]
- [x] [Review][Patch] Missing test: catch-block fallback — no test exercises the template resolution failure fallback path [`src/formats/blog.js:82`]
- [x] [Review][Defer] runPipeline options silently dropped — deferred, pre-existing (options param never forwarded to orchestrator) [`src/pipeline/runner.js`]
- [x] [Review][Defer] ensureHeadings skips H1-only body — deferred, edge case (template adds headings anyway) [`src/formats/blog.js:55`]
- [x] [Review][Defer] Degenerate filenames from edge-case inputFile — deferred, edge case (empty or `.md` inputFile yields `-blog.md`) [`src/formats/blog.js:67-69`]
- [x] [Review][Defer] String.replace only replaces first occurrence — deferred, template has one of each placeholder [`src/formats/blog.js:83-84`]
