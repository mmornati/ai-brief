# AI Brief

AI-powered pipeline for generating structured briefs, stories, and development plans using opencode and Claude Code.

## Install

To use ai-brief in your project:

```bash
git clone https://github.com/mmornati/ai-brief.git
./install.sh                       # install skills into the current project
./install.sh /path/to/your-project # install skills into a specific project
./install.sh --dry-run             # preview what would be installed
```

`install.sh` auto-detects opencode (`.opencode/`) and Claude Code (`.claude/`)
in the target project, registers the `ai-brief-*` skills, and copies templates
and step prompts to `ai-brief/templates/` and `ai-brief/steps/`. Reinstalls
back up modified files to `.bak` before overwriting.

## Usage

```bash
node src/cli.js --help
```

Available commands:
- `init` — Scaffold a new project in the target directory
- `run` — Execute the full pipeline
- `status` — Show current pipeline status
- `resume` — Resume a paused pipeline from the last completed step

## Development

```bash
npm test
npm run test:watch
npm run test:coverage
```

## License

MIT
