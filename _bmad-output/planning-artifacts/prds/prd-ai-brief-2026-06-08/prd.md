---
title: "PRD: ai-brief"
status: final
created: "2026-06-08"
updated: "2026-06-08"
---

# PRD: ai-brief

## 0. Document Purpose

This PRD defines ai-brief, an open-source, file-driven content pipeline for solo technical creators. It targets hobby/solo stakes and is scoped for a single builder. The PRFAQ at `../../planning-artifacts/prfaq-ai-brief.md` captures the full Working Backwards discovery — this document locks requirements for implementation.

## 1. Vision

ai-brief helps solo creators ship content faster. Drop rough notes into a project folder, invoke it from opencode or Claude Code, and get back a publication-ready blog post or slide deck. The pipeline handles research, structure, formatting, and review — the creator brings the ideas and voice.

It's a structured pipeline, not a black-box generator. Every step is inspectable and customizable. The user stays in their editor the whole time.

## 2. Target User

### 2.1 Jobs To Be Done

- Speed up the gap between having an idea and publishing content
- Offload mechanical work (research, structuring, formatting) without losing creative control
- Produce consistent, high-quality output without reinventing the workflow each time

### 2.2 Non-Users (v1)

- Non-technical users who don't work in markdown or editors
- Teams/collaborative workflows (v1 is solo only)
- Users who need non-blog/non-slide formats (newsletters, emails, social threads)

### 2.3 Key User Journeys

- **UJ-1. Alex has a blog idea and wants to ship it tonight.**
  - **Context:** Alex jots rough bullet points in `docs/my-idea.md`, then invokes `ai-brief`.
  - **Path:** Pipeline runs: validates the idea angle → researches context → structures outline → writes draft → formats as blog post → presents for review.
  - **Climax:** Alex opens the output file, sees a well-structured draft they can publish with minor edits.
  - **Resolution:** Draft is in the project folder, ready for final polish and publishing.

- **UJ-2. Alex needs a conference talk deck from the same blog post.**
  - **Context:** The blog post exists as a markdown file. Alex invokes ai-brief with `--format slides`.
  - **Path:** Pipeline reformats the existing content into slide deck structure: title slide, section slides, speaker notes, ending slide.
  - **Climax:** Alex has a complete slide deck in markdown, ready to render with Marp/Slidev/reveal.js.
  - **Resolution:** Slides live alongside the blog post in the project folder.

## 3. Glossary

- **Pipeline** — The sequence of steps (validate, research, structure, write, format, review) that transforms input notes into output content.
- **Step** — An individual, invocable operation in the pipeline. Each step has a prompt, rules, and expected output format.
- **Template** — A markdown file defining the output structure for a given format (blog post, slide deck).
- **Input** — A markdown file with the user's rough notes/ideas in the project's content folder.
- **Output** — A formatted markdown file produced by the pipeline, ready for publication or rendering.

## 4. Features

### 4.1 Pipeline Execution

**Description:** The core experience — invoke the pipeline on an input file, specify the desired output format, and get back a structured result. Each step runs sequentially but is independently inspectable. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-1: Pipeline invocation

A user can invoke the pipeline on a markdown input file from their project directory.

**Consequences:**
- `ai-brief blog docs/idea.md` produces a blog post at `docs/ai-brief-output/blog/idea-blog.md`
- `ai-brief slides docs/idea.md` produces a slide deck at `docs/ai-brief-output/slides/idea-slides.md`
- Running without arguments shows usage/help

#### FR-2: Step-by-step output

Each pipeline step writes intermediate output so the user can inspect and override before the next step runs.

**Consequences:**
- Intermediate files are stored in `docs/ai-brief-output/steps/`
- `[ASSUMPTION: Step granularity — TBD whether validate+research merge or stay separate]`
- User can skip a step and provide manual input instead

#### FR-3: Pipeline status

The user can see which step is currently running and what it's doing.

**Consequences:**
- Console output shows step name and brief status
- `[ASSUMPTION: No progress bar needed for v1 — simple text status lines suffice]`

### 4.2 Output Templates

**Description:** The pipeline produces content formatted for the target output type. Templates define the structure; the user can customize them. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-4: Blog post template

Output is a markdown file with title, date, tags, intro, body sections, and conclusion.

**Consequences:**
- Compatible with common static site generators (Hugo, Jekyll, Astro frontmatter)
- Body is structured with headings, not a wall of text
- `[ASSUMPTION: Exact frontmatter fields TBD — start with title + date + tags]`

#### FR-5: Slide deck template

Output is a markdown file compatible with Marp, Slidev, or reveal.js — each slide separated by `---`, with speaker notes where available.

**Consequences:**
- Compatible with Marp's `---` slide separator convention
- `[ASSUMPTION: Targeting Marp-compatible format as primary slide target]`
- Speaker notes included where the pipeline has relevant context

### 4.3 Pipeline Customization

**Description:** The user can inspect, modify, and extend the pipeline. This is the "open source" promise — the tool adapts to the creator, not the other way around.

**Functional Requirements:**

#### FR-6: Editable templates

Template files are plain markdown in a known project directory, editable by the user.

**Consequences:**
- Templates live under `docs/ai-brief-templates/`
- User edits are preserved across re-installation `[ASSUMPTION: merge strategy TBD]`

#### FR-7: Editable step prompts

Step instructions/prompts are plain text files in a known directory, editable by the user.

**Consequences:**
- Step configs live under `docs/ai-brief-steps/`
- User can modify the research prompt, structure rules, etc.

## 5. Non-Goals (Explicit)

- ai-brief will **not** be a SaaS product or web dashboard
- ai-brief will **not** include a GUI or visual editor
- ai-brief will **not** support collaborative/multi-user workflows in v1
- ai-brief will **not** generate non-markdown output (PDF, DOCX, HTML) directly — those are renderer concerns
- ai-brief will **not** include a built-in AI model — it uses the host assistant's AI capabilities

## 6. MVP Scope

### 6.1 In Scope

- Blog post pipeline (validate → research → structure → write → format → review)
- Slide deck pipeline (same core steps, slide-specific formatting)
- Installation via git clone + install script (targets opencode and Claude Code)
- Editable templates and step prompts
- Single markdown file as input
- Intermediate step output for review

### 6.2 Out of Scope for MVP

- Newsletter/email/social/course format pipelines — v2+
- Multi-variant output generation — v2+
- Style profile / voice ingestion — v2+
- Interviewer stage (Q&A to build brief from nothing) — v2+
- VS Code / other IDE support — v2+
- npm/pip distribution — v2+

## 7. Success Metrics

**Primary**
- **SM-1**: Personal usage — I use ai-brief for at least one piece of content per week for two consecutive months. Validates the whole pipeline.

**Secondary**
- **SM-2**: A stranger successfully installs and uses it without asking for help. Validates FR-1, FR-6, FR-7.

## 8. Open Questions

1. What happens when the AI assistant context window can't hold the full pipeline? Do we need to split into separate sessions?
2. How does the install script register skills/commands with each target tool (opencode vs Claude Code)?

## 9. Assumptions Index

- Validate and Research are separate steps (confirmed)
- Console progress is sufficient — no progress bar needed
- Frontmatter fields TBD — start with title + date + tags, expand per feedback
- Marp-compatible format as primary slide target
- Template edits preserved with a `docs/ai-brief-templates/custom/` override directory
