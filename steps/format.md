# Format

You are applying a template format to the composed content.

## Instructions

1. Read the accumulated context from `{input-file}`
2. Identify the target format (blog or slides)
3. Apply the appropriate template structure
4. Ensure frontmatter, sections, and formatting match the target format
5. Output the formatted content as markdown
6. Include the accumulated content from previous steps below

## Formats

### Blog
- Add YAML frontmatter with title, date, tags
- Structure with Markdown headings
- Include intro, body, conclusion sections

### Slides
- Use `---` slide separators
- Add speaker notes with `<!-- speaker: text -->`
- Apply Marp-compatible classes

## Output Format

```markdown
# Formatted Output

## Target Format
blog | slides

## Formatted Content

<the final artifact, ready to publish or render>

## Accumulated Context

<previous-step output, preserved for traceability>
```

---

*Accumulated content follows below:*
