# Installation

AI Brief can be installed into any project that uses **opencode** or **Claude Code**. Once installed, it registers custom AI skills that you can invoke directly from your coding assistant.

## Quick Install

```bash
./install.sh                                    # install into current directory
./install.sh /path/to/your-project              # install into specific project
./install.sh --dry-run                          # preview changes without applying
```

## What the Installer Does

1. **Detects IDEs** — Scans the target project for `.opencode/` and `.claude/` directories
2. **Deploys skills** — Registers individual pipeline skills like `ai-brief-validate`, `ai-brief-research`, etc., plus format orchestrators like `ai-brief-blog` and `ai-brief-slides`
3. **Copies templates** — Default output templates to `ai-brief/templates/{format}/default.md`
4. **Copies step prompts** — The six pipeline step prompts to `ai-brief/steps/`
5. **Generates pipeline skills** — Derives orchestrator skills from `pipeline-definition/pipeline.json` and `formats.json`
6. **Backs up** — Existing files get a `.bak` suffix before overwrite

## Post-Installation

After installation, your target project will have:

```
your-project/
├── .opencode/agents/skills/ai-brief-*/SKILL.md    # (if opencode detected)
├── .claude/skills/ai-brief-*/SKILL.md              # (if Claude Code detected)
├── ai-brief/
│   ├── templates/
│   │   ├── blog/default.md
│   │   ├── slides/default.md
│   │   └── story/default.md
│   └── steps/
│       ├── validate.md
│       ├── research.md
│       ├── structure.md
│       ├── write.md
│       ├── format.md
│       └── review.md
```

## Important Notes

::: warning Auto-generated Skills
Skills under `.opencode/agents/skills/ai-brief-*/` and `.claude/skills/ai-brief-*/` are **fully derived** from `pipeline-definition/pipeline.json` and `pipeline-definition/formats.json`. They are **overwritten on every install**. Do not edit them by hand — change the pipeline definition instead.
:::

::: tip User Templates
Templates copied to `ai-brief/templates/{format}/default.md` can be safely edited. On reinstall, the installer creates a `.bak` of the original before overwriting. If a `user.md` template exists, it is preserved.
:::

## Requirements

- **Node.js** >= 18
- At least one of: **opencode** or **Claude Code** installed in the target project