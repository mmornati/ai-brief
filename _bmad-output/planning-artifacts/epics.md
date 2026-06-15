---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: "2026-06-14"
inputDocuments:
  - prds/prd-ai-brief-2026-06-08/prd.md
  - architecture.md
---

# ai-brief - Epic Breakdown

## Architecture Decisions

### ADR-1: Orchestration Approach

**Decision:** Node.js CLI Runner (Approach B)

The pipeline is driven by a thin Node.js CLI that owns sequencing, state tracking, and file I/O. The AI assistant (opencode/Claude Code) performs creative work per step — the runner presents the step prompt + accumulated context, captures the AI response, saves intermediate output, and advances to the next step.

**Rationale:**
- Deterministic, testable orchestration — no risk of the AI skipping or misinterpreting step ordering
- Resume capability via file-presence state tracking
- Node.js stdlib is sufficient (fs, path, child_process) — zero npm runtime dependencies
- SKILL.md becomes a thin command registration file

**Consequences:**
- `src/pipeline/runner.js` is the single entry point for pipeline execution
- SKILL.md files only register IDE commands, not orchestration logic
- Step prompts in `steps/*.md` are loaded by the runner, not by SKILL.md chaining

## Overview

This document provides the complete epic and story breakdown for ai-brief, decomposing the requirements from the PRD and Architecture decisions into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1: Pipeline invocation — A user can invoke the pipeline on a markdown input file from their project directory.
FR-2: Step-by-step output — Each pipeline step writes intermediate output so the user can inspect and override before the next step runs.
FR-3: Pipeline status — The user can see which step is currently running and what it's doing.
FR-4: Blog post template — Output is a markdown file with title, date, tags, intro, body sections, and conclusion.
FR-5: Slide deck template — Output is a markdown file compatible with Marp, Slidev, or reveal.js.
FR-6: Editable templates — Template files are plain markdown in a known project directory, editable by the user.
FR-7: Editable step prompts — Step instructions/prompts are plain text files in a known directory, editable by the user.

### NonFunctional Requirements

NFR-1: No SaaS, web dashboard, or GUI — system operates entirely locally via CLI/skill invocation
NFR-2: No built-in AI model — uses host assistant's AI capabilities
NFR-3: Open-source, permissive license
NFR-4: Cross-IDE targets — must work with both opencode and Claude Code
NFR-5: Markdown-only throughout the pipeline (input, intermediate, and output)
NFR-6: Installation via git clone + install script
NFR-7: Single markdown file as input

### Additional Requirements

AR-1: Resolve orchestration contradiction (SKILL.md chaining vs Node.js runner) before first implementation story
AR-2: Project scaffolding — install.sh + ai-brief init as first implementation priority
AR-3: Template override mechanism — user/ directory with .bak convention on reinstall
AR-4: IDE abstraction — separate format writers for opencode (.opencode/agents/skills/) and Claude Code (.claude/skills/)
AR-5: File-presence state tracking — .completed markers instead of JSON state files
AR-6: Step chaining — each step's output file is the input to the next step
AR-7: Naming conventions — kebab-case, ai-brief- prefix for skills
AR-8: Basic error handling for pipeline failures, partial completion, and step retry

### UX Design Requirements

None — no UI/GUI components in scope for v1.

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR-1 | Epic 2 | Pipeline invocation |
| FR-2 | Epic 2 | Step-by-step output |
| FR-3 | Epic 2 | Pipeline status |
| FR-4 | Epic 3 | Blog post template |
| FR-5 | Epic 3 | Slide deck template |
| FR-6 | Epic 3 | Editable templates |
| FR-7 | Epic 3 | Editable step prompts |

## Epic List

### Epic 1: Foundation & Installation
Set up the project skeleton, install script, resolve orchestration design, and establish conventions. After this epic, the tool can be installed and the project structure is ready for pipeline development.
**FRs covered:** FR-6, FR-7
**NFRs covered:** NFR-4, NFR-6
**ARs covered:** AR-1, AR-2, AR-7

### Epic 2: Pipeline Execution Engine
Implement the core pipeline runner, CLI entry point, state tracking, intermediate output, and IDE skill registration. After this epic, the full pipeline (validate → research → structure → write → format → review) can be invoked on a markdown input.
**FRs covered:** FR-1, FR-2, FR-3
**NFRs covered:** NFR-5
**ARs covered:** AR-4, AR-5, AR-6, AR-8

### Epic 3: Content Output & Customization
Implement blog and slide deck output templates, the format writers for each IDE target, and the template/step override mechanism. After this epic, users get publication-ready content and can customize every part of the pipeline.
**FRs covered:** FR-4, FR-5, FR-6, FR-7
**ARs covered:** AR-3

---

## Epic 1: Foundation & Installation

Project skeleton, install script, orchestration design, and naming conventions.

### Story 1.1: Project Scaffold & Toolchain

As a developer,
I want the project directory structure and test toolchain initialized,
So that I can start implementing features with a consistent layout and testable code from the start.

**Acceptance Criteria:**

**Given** the project root directory exists
**When** the project is scaffolded
**Then** the following directories exist: `src/pipeline/`, `src/writers/`, `src/templates/default/`, `src/templates/user/`, `steps/`, `test/pipeline/`, `test/writers/`
**And** `package.json` exists with `"type": "module"` and scripts for `test`, `test:watch`

**Given** the project directory is scaffolded
**When** `npm test` is executed
**Then** it runs vitest and at least one sanity test passes

**Given** the project root directory
**When** I inspect `.gitignore`
**Then** it excludes `node_modules/`, `ai-brief-output/`, and editor-specific files

### Story 1.2: Install Script

As a user,
I want to run `./install.sh` to set up ai-brief in my project,
So that the tool is registered with my AI assistant (opencode and/or Claude Code) without manual setup.

**Acceptance Criteria:**

**Given** I have a project with opencode installed
**When** I run `./install.sh`
**Then** a skill is registered at `.opencode/agents/skills/ai-brief-*/SKILL.md`
**And** template files are copied to `ai-brief/templates/`
**And** step prompt files are copied to `ai-brief/steps/`

**Given** I have a project with Claude Code installed
**When** I run `./install.sh`
**Then** skills are registered at `.claude/skills/ai-brief-*/`

**Given** I have both opencode and Claude Code installed
**When** I run `./install.sh`
**Then** skills are registered for both IDEs

**Given** I run `./install.sh` on an existing installation
**When** template files already exist in `ai-brief/templates/`
**Then** modified stock templates are detected and copied to `templates/user/` with a warning
**And** originals are preserved with `.bak` suffix before overwrite

**Given** I run `./install.sh --dry-run`
**When** the script executes
**Then** it prints what would be done without modifying any files

### Story 1.3: Orchestration Design & Step Contract

As a developer,
I want the pipeline runner architecture finalized and the step input/output contract defined,
So that all subsequent implementation work has a stable foundation.

**Acceptance Criteria:**

**Given** the orchestration direction is decided
**When** `src/pipeline/types.js` is created
**Then** it exports a JSDoc-typed `StepIO` interface with `{ content: string, metadata: Record<string, unknown>, state: PipelineState }`

**Given** `types.js` exists
**When** `test/pipeline/types.test.js` is created
**Then** it validates the contract shape and passes

**Given** the pipeline definition
**When** `pipeline-definition/pipeline.json` is created
**Then** it defines the step sequence: `["validate", "research", "structure", "write", "format", "review"]`
**And** each step entry includes a `name`, `promptFile`, and `description`

**Given** the pipeline definition
**When** `pipeline-definition/formats.json` is created
**Then** it maps format names (`"blog"`, `"slides"`) to their orchestrator modules

### Story 1.4: Step Prompts & Templates

As a user,
I want pipeline step prompts and output templates to exist,
So that the pipeline has content to work with from the start.

**Acceptance Criteria:**

**Given** the steps directory exists
**When** I inspect `steps/`
**Then** the following prompt files exist: `validate.md`, `research.md`, `structure.md`, `write.md`, `format.md`, `review.md`
**And** each file contains step-specific instructions for the AI assistant

**Given** the templates directory exists
**When** I inspect `templates/default/`
**Then** `blog.md` exists with static-site-generator-compatible frontmatter (`title`, `date`, `tags`)
**And** `slide.md` exists with Marp-compatible `---` slide separators and speaker note format

**Given** naming conventions are established
**When** I inspect skill names, file names, and directory names
**Then** all follow kebab-case convention with `ai-brief-` prefix where applicable

### Story 1.5: Template Override Mechanism

As a user,
I want to customize templates and step prompts without losing my changes on reinstall,
So that I can adapt ai-brief to my workflow without fighting the tool.

**Acceptance Criteria:**

**Given** I edit `templates/default/blog.md`
**When** I copy it to `templates/user/blog.md` and modify it
**Then** the pipeline uses the `user/` version instead of the `default/` version

**Given** templates exist in both `default/` and `user/`
**When** the resolver looks up a template
**Then** it checks `user/` first, then falls back to `default/`

**Given** I run `./install.sh` with existing custom templates
**When** it detects changes in `default/` templates
**Then** it creates `.bak` copies of the updated defaults
**And** does not overwrite any file in `user/`

---

## Epic 2: Pipeline Execution Engine

Core pipeline runner, CLI entry point, state tracking, intermediate output, and IDE skill registration.

### Story 2.1: Load Step Definitions

As a developer,
I want the step definitions loaded from `pipeline-definition/pipeline.json`,
So that the pipeline knows which steps to execute and in what order.

**Acceptance Criteria:**

**Given** `pipeline-definition/pipeline.json` exists with valid step definitions
**When** `step-loader.js` reads the file
**Then** it returns an ordered array of step objects with `name`, `promptFile`, and `description`

**Given** `pipeline-definition/pipeline.json` is missing or malformed
**When** `step-loader.js` attempts to read it
**Then** it throws a descriptive error with the file path and the parse issue

**Given** `pipeline-definition/pipeline.json` is empty (no steps)
**When** `step-loader.js` reads it
**Then** it returns an empty array (no crash)

### Story 2.2: Pipeline Runner

As a user,
I want to run the pipeline on a markdown input file,
So that my rough notes are transformed into structured content through a series of AI-assisted steps.

**Acceptance Criteria:**

**Given** I run `node src/cli.js run docs/idea.md --format blog`
**When** the pipeline starts
**Then** it loads steps from `pipeline-definition/pipeline.json`
**And** executes each step sequentially, passing accumulated context

**Given** a step completes successfully
**When** the runner saves the intermediate output
**Then** it writes to `ai-brief-output/steps/{n}-{step}.md`
**And** creates a `.step-{n}.completed` marker file

**Given** I run `node src/cli.js run docs/idea.md --format slides`
**When** the pipeline starts
**Then** it loads the slides format writer and step prompts
**And** produces Marp-compatible output

**Given** a step fails
**When** the runner encounters the error
**Then** it logs the step name and error message to console
**And** writes a `.step-{n}.failed` marker file with error details
**And** the pipeline stops (does not continue to next step)

**Given** no arguments are passed
**When** `node src/cli.js` is executed without subcommand
**Then** it displays usage help with available commands and examples

### Story 2.3: Pipeline Status & Resume

As a user,
I want to check pipeline status and resume from a failed or interrupted run,
So that I don't lose progress when something goes wrong or I need to take a break.

**Acceptance Criteria:**

**Given** a pipeline run is in progress (some steps completed, markers exist)
**When** I run `node src/cli.js status`
**Then** it displays which steps are completed, which are pending, and which (if any) failed

**Given** a pipeline run failed at step 3
**When** I fix the issue and run `node src/cli.js resume`
**Then** it reads the last completed step from markers
**And** resumes from the failed step with all prior context restored

**Given** no pipeline run has been started
**When** I run `node src/cli.js resume`
**Then** it displays a message that no pipeline run is in progress
**And** exits with a non-zero status code

**Given** a pipeline completes all steps successfully
**When** I run `node src/cli.js status`
**Then** it shows all steps as completed
**And** the output file path is displayed

### Story 2.4: IDE Skill Registration

As a user,
I want skill files generated so my AI assistant can invoke the pipeline,
So that I can run `ai-brief blog docs/idea.md` directly from my editor.

**Acceptance Criteria:**

**Given** opencode is installed
**When** the skill registration runs
**Then** a SKILL.md is written to `.opencode/agents/skills/ai-brief-run/SKILL.md`
**And** it references the main CLI entry point

**Given** Claude Code is installed
**When** the skill registration runs
**Then** a skill definition is written to `.claude/skills/ai-brief-run/`
**And** it references the main CLI entry point

**Given** the pipeline definition changes (steps added/removed)
**When** `./install.sh` runs again
**Then** skill files are regenerated to match the current pipeline definition

---

## Epic 3: Content Output & Customization

Blog and slide templates, format writers, IDE-targeted output, and template customization.

### Story 3.1: Blog Output Writer

As a user,
I want the pipeline to produce a publication-ready blog post in markdown,
So that I can publish it on my static site with minimal editing.

**Acceptance Criteria:**

**Given** the pipeline completes with `--format blog`
**When** the blog writer processes the final accumulated content
**Then** it produces a markdown file with frontmatter (`title`, `date`, `tags`, `draft`)
**And** body content with H2/H3 section headings
**And** saves it to `ai-brief-output/blog/{input-name}-blog.md`

**Given** a blog template exists in `templates/user/`
**When** the writer loads the template
**Then** it uses the user template instead of the default

**Given** the blog output is generated
**When** `test/writers/blog.test.js` validates it
**Then** frontmatter fields are non-empty and well-formed YAML
**And** body is non-empty markdown with at least one heading

### Story 3.2: Slide Deck Writer

As a user,
I want the pipeline to produce a Marp-compatible slide deck,
So that I can present my content using any Marp-compatible renderer.

**Acceptance Criteria:**

**Given** the pipeline completes with `--format slides`
**When** the slides writer processes the final accumulated content
**Then** it produces a markdown file with `---` slide separators between each slide
**And** a title slide at the beginning
**And** speaker notes formatted as `<!-- speaker: note text -->` where available
**And** saves it to `ai-brief-output/slides/{input-name}-slides.md`

**Given** a slide template exists in `templates/user/`
**When** the writer loads the template
**Then** it uses the user template instead of the default

**Given** the slide output is generated
**When** `test/writers/slides.test.js` validates it
**Then** slides are separated by `---` markers
**And** there are at least 3 slides (title, body, end)

### Story 3.3: Format Writer Base Class

As a developer,
I want a shared base class for all format writers,
So that adding new output formats in the future is straightforward.

**Acceptance Criteria:**

**Given** a format writer base class exists in `src/writers/base.js`
**When** both blog and slides writers extend it
**Then** they share common template resolution logic
**And** common output file naming and path conventions

**Given** I create a new format writer (e.g., newsletter)
**When** it extends the base class and implements `render(content, metadata)`
**Then** it works with the pipeline without modifying the runner

**Given** the base resolver looks up a template
**When** both `default/` and `user/` directories exist
**Then** it checks `templates/user/<format>/` first, then `templates/default/<format>/`

---

## Epic 4: Linked Services Publishing

Service connector system, Google Slides publisher, Hashnode publisher, and CLI integration for publishing pipeline output to external services.

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR-NEW | Epic 4 | Publish formatted output to external services (Google Slides, Hashnode) |
| FR-NEW | Epic 4 | Service configuration via config file and CLI flags |
| FR-NEW | Epic 4 | Credential management outside the repo |

### Story 4.1: Service Configuration & Loader

As a developer,
I want a service configuration file and loader,
So that service bindings (name → format → connector) are defined in one place and loadable by the pipeline runner.

**Acceptance Criteria:**

**Given** `pipeline-definition/services.json` exists with valid service definitions
**When** `loader.js` reads the file
**Then** it returns an array of service objects with `name`, `format`, `connector`, `config`, and `default`

**Given** a service has `"default": true` for the `slides` format
**When** the pipeline runs with `--format slides` and no `--publish` flag
**Then** the default slides service is used automatically

**Given** a service config value is `"env:VAR_NAME"`
**When** the loader resolves the config
**Then** it reads the value from environment variable `VAR_NAME`
**And** throws a descriptive error if the env var is not set

**Given** a service config value is an absolute file path like `~/.config/ai-brief/creds.json`
**When** the loader resolves the config
**Then** it expands `~` to the user's home directory
**And** throws a descriptive error if the file does not exist

**Given** `services.json` is missing
**When** the loader attempts to read it
**Then** it returns an empty array (publishing is optional, no crash)

**Given** `services.json` has two services for the same format
**When** both have `"default": true`
**Then** the loader logs a warning and uses the first one

### Story 4.2: ServicePublisher Base Class

As a developer,
I want a base class for all service connectors,
So that new services can be added without changing the pipeline runner.

**Acceptance Criteria:**

**Given** `src/services/base.js` exists
**When** a new service connector extends `ServicePublisher`
**Then** it must implement `publish(localFilePath, content, metadata)` and `validateConfig()`

**Given** a service connector is instantiated
**When** `validateConfig()` is called
**Then** it checks that all required config keys are present and valid
**And** returns `{ valid: boolean, errors: string[] }`

**Given** a service connector's config is invalid
**When** `publish()` is called
**Then** it throws a descriptive error before any network call

**Given** the base class is instantiated directly (not extended)
**When** `new ServicePublisher()` is called
**Then** it throws an error (abstract base class)

### Story 4.3: Google Slides Connector

As a user,
I want to publish slide decks to an existing Google Slides presentation,
So that my content appears in Google Slides without manual copy-paste.

**Acceptance Criteria:**

**Given** the pipeline produces a slide deck (`--format slides`)
**When** I run with `--publish google-slides`
**Then** the connector:
- Authenticates via Google service account credentials from config
- Reads the existing presentation by ID from config
- Clears all existing slides
- Creates a title slide with the deck title
- Creates one slide per `##` heading in the Marp output
- Adds text content to each slide as text boxes
- Sets speaker notes from `<!-- speaker: -->` comments onto the corresponding slide
- Outputs a success message with the presentation URL

**Given** the config has `"presentationId": "env:GOOGLE_SLIDES_PRESENTATION_ID"`
**When** the connector runs
**Then** it reads the presentation ID from the environment variable
**And** throws a clear error if it's not set

**Given** the credentials file (`~/.config/ai-brief/google-credentials.json`) does not exist
**When** the connector runs
**Then** it throws a descriptive error with instructions to create a service account and download the key

**Given** the presentation ID is invalid or access is denied
**When** the connector attempts to update
**Then** it throws a descriptive error with the HTTP status and response body

### Story 4.4: Hashnode Connector

As a user,
I want to publish blog posts to Hashnode as drafts,
So that I can review and publish from the Hashnode dashboard.

**Acceptance Criteria:**

**Given** the pipeline produces a blog post (`--format blog`)
**When** I run with `--publish hashnode`
**Then** the connector:
- Authenticates via Hashnode PAT from config (env var)
- Parses YAML frontmatter for `title` and `tags`
- Creates a draft post on the configured publication via Hashnode GraphQL API
- Outputs a success message with the draft URL

**Given** the blog has frontmatter with title and tags
**When** the connector creates the draft
**Then** the title is set from frontmatter `title`
**And** tags are set from frontmatter `tags`
**And** the body is the markdown content (frontmatter stripped)
**And** the post is created as a draft (not published)

**Given** `HASHNODE_API_KEY` env var is not set
**When** the connector runs
**Then** it throws a descriptive error with instructions to create a Hashnode PAT

**Given** the API returns an error response
**When** the connector receives it
**Then** it throws a descriptive error with the API error details

### Story 4.5: CLI & Runner Integration

As a user,
I want to publish pipeline output by adding a `--publish` flag to the `run` command,
So that I control when publishing happens without extra configuration steps.

**Acceptance Criteria:**

**Given** I run `ai-brief run docs/idea.md --format slides --publish google-slides`
**When** the pipeline completes successfully
**Then** the slide deck is written to the local file (as always)
**And** the Google Slides connector is invoked
**And** a success message is printed with the presentation URL

**Given** I run `ai-brief run docs/idea.md --format slides` (no `--publish` flag)
**When** the pipeline completes successfully
**Then** the slide deck is written to the local file
**And** no service connector is invoked (current behavior preserved)

**Given** I run `ai-brief run docs/idea.md --format slides --publish unknown`
**When** the pipeline completes
**Then** an error is printed: `Unknown service "unknown". Available services: google-slides, hashnode`
**And** the local file is still written

**Given** I run `ai-brief run docs/idea.md --format blog --publish hashnode`
**When** the connector fails (e.g., network error)
**Then** the local file is still written successfully
**And** an error message is printed but the pipeline exit code is not affected by publish failure

**Given** a default service is configured for the `slides` format in `services.json`
**When** I run `ai-brief run docs/idea.md --format slides` (no `--publish`)
**Then** the default service is used automatically
**And** the slide deck is published to Google Slides
