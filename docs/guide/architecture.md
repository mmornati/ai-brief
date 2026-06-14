# Architecture

For a deep dive into the architectural decisions behind AI Brief, see the [Architecture Decision Document](https://github.com/mmornati/ai-brief/blob/main/_bmad-output/planning-artifacts/architecture.md) in the repository.

## High-Level Architecture

```mermaid
flowchart TB
    CLI[CLI Entry Point<br/>src/cli.js] --> Runner[Pipeline Runner<br/>src/pipeline/runner.js]
    Runner --> StepLoader[Step Loader<br/>src/pipeline/step-loader.js]
    Runner --> Tracker[Pipeline Tracker<br/>src/pipeline/tracker.js]
    
    StepLoader --> PipelineDef[pipeline-definition/<br/>pipeline.json]
    StepLoader --> FormatDef[pipeline-definition/<br/>formats.json]
    
    Runner --> PromptFiles[steps/*.md]
    Runner --> TemplateResolver[Template Resolver<br/>src/templates/resolver.js]
    TemplateResolver --> DefaultTmpl[src/templates/default/*]
    TemplateResolver --> UserTmpl[src/templates/user/*]
    
    Runner --> FormatOrch[Format Orchestrator<br/>src/formats/*.js]
    FormatOrch --> Output[ai-brief-output/<br/>blog|slides/*.md]
    
    Install[Install Script<br/>src/install.js] --> OpenCodeSkill[opencode Skill Gen<br/>src/formats/opencode.js]
    Install --> ClaudeSkill[Claude Code Skill Gen<br/>src/formats/claude.js]
```

## Key Architectural Decisions

### Orchestration: Node.js Runner

AI Brief uses a **Node.js pipeline runner** (`src/pipeline/runner.js`) as the execution engine. This was chosen over pure SKILL.md chaining for better state management, error handling, and resumability.

### State Management: File Presence

Pipeline state is tracked via **file markers** in `ai-brief-output/steps/.step-{N}.completed` — no JSON state files, no database. This keeps the system simple and user-inspectable.

### Template Resolution: Override Chain

Templates use a chain: **user override → default → passthrough**. User edits survive reinstallation via `.bak` backup and user template preservation.

### IDE Abstraction

Each IDE target (opencode, Claude Code) has a dedicated generator in `src/formats/`. Both implement the same interface (`generateSkill`, `generateMasterSkill`) but produce format-specific output.

## Data Flow

```
Input .md → Runner loads pipeline definition
  → For each step:
      1. Load prompt file (steps/{step}.md)
      2. Append accumulated context
      3. Execute prompt → get result
      4. Save result to ai-brief-output/steps/{NN}-{step}.md
      5. Write .step-{N}.completed marker
  → On completion:
      1. Load format orchestrator (src/formats/{format}.js)
      2. Call orchestrator with final accumulated content
      3. Orchestrator applies template
      4. Write final artifact to ai-brief-output/{format}/
  → Done
```