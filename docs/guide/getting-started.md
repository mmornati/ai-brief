# Getting Started

This guide walks you through your first AI Brief pipeline run — from raw idea to finished artifact.

## Prerequisites

- **Node.js** >= 18
- A markdown file with your raw ideas (e.g., `my-idea.md`)
- **(Optional)** An API key for an AI provider to generate real content

## 1. Clone the Repository

```bash
git clone https://github.com/mmornati/ai-brief.git
cd ai-brief
```

## 2. Configure an AI Provider

The pipeline needs an AI to generate content. Set up an OpenAI-compatible provider:

**Option A: `.env` file (recommended)**

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
AI_API_KEY=sk-your-api-key-here
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

The `.env` file is automatically loaded when running any CLI command.

**Option B: Environment variables**

```bash
# Required: your API key
export AI_API_KEY=your-api-key-here

# Optional: custom endpoint (default: https://api.openai.com/v1)
# For local models via Ollama: export AI_BASE_URL=http://localhost:11434/v1
export AI_BASE_URL=https://api.openai.com/v1

# Optional: model selection (default: gpt-4o-mini)
export AI_MODEL=gpt-4o-mini
```

Supported providers (pass via `--provider`):
| Provider | Description |
|----------|-------------|
| `passthrough` | Echoes prompts as output (no AI, for testing) |
| `openai-compatible` | OpenAI API or any compatible endpoint |

## 3. Create an Input File

Create a markdown file with your content idea. This can be as rough as bullet points or free-form notes:

```markdown
# My Blog Post Idea

Topic: How AI coding assistants are changing developer workflows

Key points:
- Less boilerplate, more architecture thinking
- Shift from writing code to reviewing code
- New skills developers need to develop

Target audience: Senior developers and tech leads
Tone: Professional but approachable
```

## 4. Run the Pipeline

```bash
# Passthrough mode (no AI, for testing the pipeline mechanics):
node src/cli.js run my-idea.md --format blog

# With AI generation:
node src/cli.js run my-idea.md --format blog --provider openai-compatible
```

The pipeline executes six steps sequentially. Each step writes its output to `ai-brief-output/steps/`. When complete, the final output path is printed. With `--provider openai-compatible`, each step calls the AI for validation, research, structuring, writing, formatting, and review.

## 5. View the Result

After the pipeline completes, your blog post is at:

```
ai-brief-output/blog/my-idea-blog.md
```

## 6. Check Pipeline Status

```bash
node src/cli.js status my-idea.md
```

Shows you which steps have completed, failed, or are still pending.

## 7. Resume a Pipeline

If a step fails or you want to restart from a specific point:

```bash
node src/cli.js resume my-idea.md --format blog
```

## Next Steps

- [Install AI Brief into a project](./installation) to use it as registered AI skills
- [Learn about the CLI commands](./usage) in detail
- [Understand the pipeline architecture](./pipeline)
- [Explore output formats](./formats)