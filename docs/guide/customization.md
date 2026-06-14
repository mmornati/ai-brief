# Customization

AI Brief is designed to be fully customizable. Every step prompt and output template is a plain file you can edit.

## Customizing Step Prompts

Each pipeline step has a corresponding prompt file in the `steps/` directory. Edit these to change how the AI behaves at each stage.

### Example: Customizing the Validate Step

Edit `steps/validate.md` to add your own validation rules:

```markdown
# Validate

You are validating input markdown for structure, spelling, and completeness.

## Additional Rules
- All external links must be HTTPS
- Code examples must include language tags
- Maximum heading depth: 3 levels

...
```

### Available Step Prompts

| File | Step | Customization Ideas |
|------|------|-------------------|
| `steps/validate.md` | Validate | Add project-specific rules, style guide checks |
| `steps/research.md` | Research | Add preferred sources, company-specific context |
| `steps/structure.md` | Structure | Add section requirements, outline format |
| `steps/write.md` | Write | Set tone, voice, and style guidelines |
| `steps/format.md` | Format | Custom formatting rules |
| `steps/review.md` | Review | Add specific review criteria, brand guidelines |

## Customizing Output Templates

Templates in `src/templates/` control how final output is wrapped. See the [Templates guide](./templates) for details.

## Pipeline Configuration

You can modify the pipeline structure itself by editing `pipeline-definition/pipeline.json`:

- **Add steps** — Insert new entries in the `steps` array and create corresponding prompt files
- **Remove steps** — Delete entries from the array
- **Reorder steps** — Change the array order
- **Change descriptions** — Update the description field

### Example: Adding a "Publish" Step

```json
{
  "steps": [
    { "name": "validate", "promptFile": "steps/validate.md", "description": "Validate input markdown" },
    { "name": "research", "promptFile": "steps/research.md", "description": "Research domain context" },
    { "name": "structure", "promptFile": "steps/structure.md", "description": "Structure content outline" },
    { "name": "write", "promptFile": "steps/write.md", "description": "Write full content" },
    { "name": "format", "promptFile": "steps/format.md", "description": "Apply output format" },
    { "name": "review", "promptFile": "steps/review.md", "description": "Review and polish" },
    { "name": "publish", "promptFile": "steps/publish.md", "description": "Prepare for publication" }
  ]
}
```

Then create `steps/publish.md` with instructions for the AI.

## Custom Output Formats

Add new output formats by:

1. Add an entry in `pipeline-definition/formats.json`
2. Create a format renderer in `src/formats/` (extend the base class)
3. Create a default template in `src/templates/default/`

## Important Notes

::: warning Skill Files Are Auto-Generated
Files under `.opencode/agents/skills/ai-brief-*/` and `.claude/skills/ai-brief-*/` are derived from `pipeline-definition/` on every install. **Do not edit them by hand** — change the pipeline definition instead.
:::

::: tip Backup Safety
When reinstalling, existing files in the target project are backed up with a `.bak` suffix. You can safely recover originals if needed.
:::