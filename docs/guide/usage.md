# CLI Commands

AI Brief provides four CLI commands for managing content pipelines.

## Global Usage

```bash
node src/cli.js <command> [options]
```

For installed environments (via `./install.sh`), the commands are also accessible through registered AI skills in opencode or Claude Code.

## Commands

### `run`

Execute the full pipeline on a markdown input file.

```bash
node src/cli.js run <input-file> --format <format> [--provider <provider>]
```

**Options:**
- `--format <format>` — Output format (`blog` or `slides`). **Required.**
- `--provider <provider>` — AI provider (`passthrough` or `openai-compatible`). Default: `passthrough`.

**AI Provider Environment Variables:**

For `--provider openai-compatible`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_API_KEY` | Yes | — | API key for the AI provider |
| `AI_BASE_URL` | No | `https://api.openai.com/v1` | Base URL for OpenAI-compatible API |
| `AI_MODEL` | No | `gpt-4o-mini` | Model to use for generation |

These variables can be set in a `.env` file (see [Getting Started](./getting-started#2-configure-an-ai-provider)) or exported as shell environment variables. Values in your shell take precedence over `.env`. The `.env` file is loaded automatically — no extra flags needed.

**Examples:**
```bash
# Passthrough mode (no AI, for testing pipeline mechanics):
node src/cli.js run docs/idea.md --format blog

# With AI generation:
export AI_API_KEY=sk-...
node src/cli.js run docs/idea.md --format blog --provider openai-compatible

# With custom endpoint (e.g. Ollama):
export AI_API_KEY=ollama
export AI_BASE_URL=http://localhost:11434/v1
export AI_MODEL=llama3
node src/cli.js run docs/idea.md --format blog --provider openai-compatible

# Slides format:
node src/cli.js run docs/talk-notes.md --format slides --provider openai-compatible
```

The pipeline runs all six steps sequentially. Each step writes intermediate output to `ai-brief-output/steps/`. The final artifact is written to `ai-brief-output/{format}/{input-name}-{format}.md`. When the pipeline completes, the output path is printed to the console.

---

### `status`

Show current pipeline progress for an input file.

```bash
node src/cli.js status <input-file> [--format <format>]
```

**Example:**
```bash
node src/cli.js status docs/idea.md
```

Output:
```
Pipeline status for docs/idea.md:
   1. validate     — completed
   2. research     — completed
   3. structure    — completed
   4. write        — completed
   5. format       — pending
   6. review       — pending
Output: ai-brief-output/blog/idea-blog.md (pending)
```

---

### `resume`

Resume a paused or failed pipeline from the last completed step.

```bash
node src/cli.js resume <input-file> --format <format>
```

**Options:**
- `--format <format>` — Output format (`blog` or `slides`). **Required.**

This is useful when a step fails (e.g., due to context limits) or when you want to restart execution after inspecting intermediate outputs.

---

### `init`

Scaffold a new project in the target directory.

```bash
node src/cli.js init
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (missing arguments, pipeline failure, etc.) |

## Output Directory Structure

```
ai-brief-output/
├── steps/
│   ├── 01-validate.md
│   ├── 02-research.md
│   ├── 03-structure.md
│   ├── 04-write.md
│   ├── 05-format.md
│   ├── 06-review.md
│   ├── .step-1.completed
│   ├── .step-2.completed
│   └── ...
├── blog/
│   └── my-idea-blog.md
└── slides/
    └── my-talk-slides.md
```