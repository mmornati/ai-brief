# AI Brief

AI-powered pipeline for generating structured briefs, stories, and development plans using opencode and Claude Code.

## Install

```bash
git clone https://github.com/mmornati/ai-brief.git
cd ai-brief
npm install
```

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
