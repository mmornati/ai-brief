# Templates

Templates control how your final content is wrapped and presented. AI Brief uses a two-layer template system with user overrides.

## Default Templates

Built-in templates ship with AI Brief in `src/templates/default/`:

| Template | File | Description |
|----------|------|-------------|
| Blog | `default/blog.md` | Wraps content with YAML frontmatter |
| Slides | `default/slide.md` | Marp-compatible slide wrapper |
| Story | `default/story.md` | User story format |
| Brief | `default/brief.md` | Document brief format |

## Template Resolution Chain

Templates are resolved in this order:

1. **User override** — `src/templates/user/{format}.md`
2. **Default** — `src/templates/default/{format}.md`
3. **Fallback** — Plain passthrough without template

## Customizing Templates

### Creating a User Override

1. Copy the default template to the user directory:
   ```bash
   cp src/templates/default/blog.md src/templates/user/blog.md
   ```
2. Edit `src/templates/user/blog.md` to your needs
3. The system will use your version instead of the default

### Template Variables

Templates use `{{placeholder}}` syntax:

- **Blog template**: `{{frontmatter}}` + `{{content}}`
- **Slide template**: `{{slides}}` for slide content
- **Story template**: Standard markdown with acceptance criteria sections

## Installation Behavior

When you run `./install.sh`:

1. Default templates are copied into the target project as `ai-brief/templates/{format}/default.md`
2. If a `user.md` template already exists in the target, it is **preserved**
3. Existing `default.md` files are backed up as `.bak` before overwriting