# Getting Started

This guide walks you through your first AI Brief pipeline run — from raw idea to finished artifact.

## Prerequisites

- **Node.js** >= 18
- A markdown file with your raw ideas (e.g., `my-idea.md`)

## 1. Clone the Repository

```bash
git clone https://github.com/mmornati/ai-brief.git
cd ai-brief
```

## 2. Create an Input File

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

## 3. Run the Pipeline

```bash
node src/cli.js run my-idea.md --format blog
```

The pipeline executes six steps sequentially. Each step writes its output to `ai-brief-output/steps/`.

## 4. View the Result

After the pipeline completes, your blog post is at:

```
ai-brief-output/blog/my-idea-blog.md
```

## 5. Check Pipeline Status

```bash
node src/cli.js status my-idea.md
```

Shows you which steps have completed, failed, or are still pending.

## 6. Resume a Pipeline

If a step fails or you want to restart from a specific point:

```bash
node src/cli.js resume my-idea.md --format blog
```

## Next Steps

- [Install AI Brief into a project](./installation) to use it as registered AI skills
- [Learn about the CLI commands](./usage) in detail
- [Understand the pipeline architecture](./pipeline)
- [Explore output formats](./formats)