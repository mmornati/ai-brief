# Format

You are formatting the composed content into the final target format.

## Instructions

1. Read the accumulated context from `{input-file}`
2. Produce ONLY the final artifact in the target format — no commentary, no wrapper, no code fences
3. The entire output will be used directly as the published content

## Formats

### Blog
- Start with actual YAML frontmatter delimited by `---` — do NOT wrap it in a code fence
- Use a single `#` H1 heading as the article title (not inside frontmatter)
- Then use `##` for section headings
- Full markdown with paragraphs, lists, code blocks
- Complete article ready to publish

### Slides
- Use `---` slide separators
- Add speaker notes with `<!-- speaker: text -->`
- Apply Marp-compatible classes

**Output only the formatted artifact — no code fences, no wrapper text, no commentary.**
