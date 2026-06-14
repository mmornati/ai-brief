# Output Formats

AI Brief supports two output formats: **blog posts** and **slide decks**. Each format has a dedicated renderer and template.

## Blog Posts

Generates markdown with YAML frontmatter, compatible with static site generators like Jekyll, Hugo, and VitePress.

### Example Output

```markdown
---
title: How AI Coding Assistants Are Changing Developer Workflows
date: 2026-06-14
tags:
  - ai
  - developer-tools
  - workflows
draft: false
---

# How AI Coding Assistants Are Changing Developer Workflows

## The Shift from Writing to Reviewing

...
```

### Frontmatter Fields

| Field | Description |
|-------|-------------|
| `title` | Extracted from the content |
| `date` | Current date when generated |
| `tags` | Extracted from research step output |
| `draft` | Set to `false` by default |

### Renderer

The blog renderer (`src/formats/blog.js`):
1. Extracts a title from the accumulated content
2. Generates YAML frontmatter
3. Combines frontmatter with the content body
4. Passes through the template resolver for optional template wrapping

---

## Slide Decks

Generates [Marp](https://marp.app/)-compatible markdown slide decks with `---` slide separators and speaker notes.

### Example Output

```markdown
# How AI Coding Assistants Are Changing Developer Workflows

---

## The Shift

- From writing code to reviewing code
- Less boilerplate, more architecture
- Faster prototyping

<!-- speaker: Emphasize that the role shifts from producer to curator -->

---

## New Skills

- Prompt engineering for code generation
- Security review of AI-generated code
- Architecture and system design

<!-- speaker: These are skills that senior devs already have, but applied differently -->
```

### Speaker Notes

The slides renderer supports two syntaxes for speaker notes:

- `Note:` inline in slide content
- `[speaker]:` at the end of lines

Both are converted to Marp HTML comment format: `<!-- speaker: text -->`

### Marp Compatibility

Output slides work directly with:
- **Marp for VS Code** — Preview and export as PDF/PPTX
- **Marp CLI** — `npx @marp-team/marp-cli slides.md`
- **Marp Web** — paste and present

## Template System

Both formats use a template resolution chain:

1. Check `src/templates/user/{format}.md` (user override)
2. Fall back to `src/templates/default/{format}.md` (built-in)
3. If neither exists, produce plain output without wrapping

### Built-in Templates

| Format | Template File | Purpose |
|--------|--------------|---------|
| Blog | `src/templates/default/blog.md` | Blog post with frontmatter + body |
| Slides | `src/templates/default/slide.md` | Marp slide deck |
| Story | `src/templates/default/story.md` | User story format |
| Brief | `src/templates/default/brief.md` | Document brief format |

## Output Location

Final artifacts are written to:

```
ai-brief-output/
├── blog/
│   └── {input-name}-blog.md
└── slides/
    └── {input-name}-slides.md
```