# Story 3.1: Blog Output Writer

Status: ready-for-dev

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

- [ ] Task 1: Create blog format writer (AC: #1, #2, #4)
  - [ ] Create `src/formats/blog.js` with `render(content, metadata)` function
  - [ ] Implement frontmatter extraction/parsing from accumulated content
  - [ ] Implement template loading via resolver (user → default chain)
  - [ ] Implement output path: `ai-brief-output/blog/{input-name}-blog.md`
  - [ ] Handle empty content with descriptive error
- [ ] Task 2: Wire into CLI/runner (AC: #1)
  - [ ] Update runner's completion step to call blog writer when `--format blog`
  - [ ] Register blog format in format selection logic
- [ ] Task 3: Create tests (AC: #3)
  - [ ] Create `test/formats/blog.test.js`
  - [ ] Test template selection (user vs default)
  - [ ] Test frontmatter generation
  - [ ] Test empty content edge case
  - [ ] Use fixture accumulated content

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

### Debug Log References

### Completion Notes List

### File List

- `src/formats/blog.js`
- `src/pipeline/runner.js` (update)
- `test/formats/blog.test.js`
