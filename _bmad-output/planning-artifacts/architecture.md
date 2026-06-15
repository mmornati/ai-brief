---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - prds/prd-ai-brief-2026-06-08/prd.md
  - prfaq-ai-brief.md
workflowType: 'architecture'
project_name: 'ai-brief'
user_name: 'mmornati'
date: '2026-06-08'
lastStep: 8
status: 'complete'
completedAt: '2026-06-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- FR-1: Pipeline invocation — CLI-style command on markdown input, targets opencode + Claude Code
- FR-2: Step-by-step output — intermediate files stored at each pipeline step, user-inspectable
- FR-3: Pipeline status — console output showing current step and status
- FR-4: Blog post template — structured markdown with frontmatter (title, date, tags)
- FR-5: Slide deck template — Marp-compatible markdown with slide separators and speaker notes
- FR-6: Editable templates — plain markdown files in project directory, user-editable
- FR-7: Editable step prompts — plain text files for each pipeline step, user-editable

**Non-Functional Requirements:**
- No SaaS, no web dashboard, no GUI
- Open-source, permissive license
- Cross-IDE target (opencode + Claude Code v1)
- Markdown-only throughout the pipeline
- Uses host assistant's AI capabilities (no built-in model)
- Installation via git clone + install script

**Scale & Complexity:**
- Project complexity: low
- Primary domain: CLI / terminal tool + editor integration
- Estimated architectural components: 5 (pipeline engine, step definitions, output templates, install script, project structure)

### Technical Constraints & Dependencies

- No persistence layer or database required
- No network services or API dependencies (beyond what the host AI assistant provides)
- Must work across two different AI assistant ecosystems (opencode, Claude Code) with different skill/command registration
- Installation must not require compilation or build step to keep it accessible

### Cross-Cutting Concerns Identified

- **IDE adapter abstraction**: how commands register with each target tool
- **Step state management**: how output from step N flows into step N+1
- **Customization overlay strategy**: how user edits survive updates
- **Context window management**: pipeline steps may exceed a single AI session

## Starter Template Evaluation

### Primary Technology Domain

CLI / developer tooling — a git-based installable module for opencode and Claude Code.

### Starter Options Considered

- **npm package** (`npx ai-brief init`) — BMAD-like approach with versioning and easy updates. Rejected by user in favor of simpler approach.
- **Git clone + install script** — selected. No npm dependency, simpler distribution. User follows BMAD's module pattern but without npm.

### Selected Starter: Git Clone + Install Script

**Rationale for Selection:** Mirrors BMAD's approach to skill installation without requiring npm publishing. The project lives as a git repo; users clone it and run an install script that registers skills and copies templates.

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- Node.js / JavaScript for the install script (mirrors BMAD's installer approach)
- Bash for any shell-level integration hooks
- Markdown for all templates and step prompts

**Project Structure:**
```
ai-brief/
├── install.sh              # Main install script
├── skills/
│   ├── blog/               # Blog post pipeline skill
│   │   └── SKILL.md
│   └── slides/             # Slide deck pipeline skill
│       └── SKILL.md
├── templates/
│   ├── blog/               # Blog post output templates
│   │   └── default.md
│   └── slides/             # Slide deck output templates
│       └── default.md
├── steps/
│   ├── validate.md         # Validate step prompt
│   ├── research.md         # Research step prompt
│   ├── structure.md        # Structure step prompt
│   ├── write.md            # Write step prompt
│   ├── format.md           # Format step prompt
│   └── review.md           # Review step prompt
└── README.md
```

**Install Flow:**
1. User clones the repo into their project (or as a submodule)
2. Runs `./install.sh` which:
   - Registers skills with opencode (`.opencode/skills/`)
   - Registers skills with Claude Code (`.claude/skills/`)
   - Copies template and step files into the project
3. User invokes skills from their AI assistant

**Note:** Project initialization using this structure should be the first implementation story.

## Core Architectural Decisions

### Orchestration Approach (Hybrid SKILL Orchestrator)

**Decision:** Each output format has an orchestrator SKILL.md (`ai-brief-blog`, `ai-brief-slides`) that contains the pipeline orchestration logic and loads individual step prompts from files. Individual step skills (`ai-brief-validate`, `ai-brief-research`, etc.) exist independently for direct invocation.

**Rationale:**
- Respects the "one skill per step" preference while providing a one-command UX
- No additional runtime dependency (no Node.js orchestrator script to maintain)
- Step prompts remain separately editable files (FR-7)
- Intermediate files are written at each step (FR-2) via the orchestrator structure
- User can invoke the full pipeline or individual steps

**Rejected Alternatives:**
- *Pure SKILL.md chaining:* Lost state between steps, poor UX, no intermediate file output
- *Node.js orchestrator script:* Added runtime dependency, more complexity than needed for v1

**Step State Management:**
- Each step writes its output to `ai-brief-output/steps/<step-name>.md`
- The next step's SKILL.md references the previous step's output file to chain state
- User can inspect, edit, or skip any intermediate file

### Adversarial Review Findings (Red Team)

**Finding 1: Prompt-source drift** — Step prompt files and individual step SKILL.md files could diverge over time.

**Resolution:** Convention established — the step prompt file (`steps/<step>.md`) is the single source of truth. The individual step skill's SKILL.md is a thin wrapper that loads the prompt file. The orchestrator SKILL.md references the same prompt file by path. No scripted enforcement for v1; documented convention in README.

**Finding 2: Context window management** — Confirmed as *solved* by the step-per-invocation design. Each step is a fresh AI invocation with a clean context. The accumulated state file carries forward only structured content, not conversation history.

**Finding 3: IDE surface area** — opencode is primary v1 target; Claude Code is secondary. Install script auto-detects which IDE tools are present and registers accordingly.

## Implementation Patterns & Consistency Rules

### Naming Patterns

- **Skills:** kebab-case with `ai-brief-` prefix: `ai-brief-validate`, `ai-brief-research`, `ai-brief-structure`, `ai-brief-write`, `ai-brief-format`, `ai-brief-review`, `ai-brief-blog`, `ai-brief-slides`
- **Step prompt files:** kebab-case in `steps/`: `validate.md`, `research.md`, `structure.md`, `write.md`, `format.md`, `review.md`
- **Templates:** kebab-case in `templates/<format>/`: `default.md`
- **Output files:** `{input-name}-{format}.md` (e.g., `idea-blog.md`)

### Structure Patterns

- **opencode registration:** skills installed as `.opencode/agents/skills/<skill-name>/SKILL.md`
- **Claude Code registration:** skills installed as `.claude/skills/<skill-name>/SKILL.md`
- **Intermediate output:** `ai-brief-output/steps/{step-name}-{input-name}.md`
- **Templates location:** `ai-brief/templates/{format}/default.md`
- **Step prompts location:** `ai-brief/steps/{step}.md`

### Format Patterns

- **Blog frontmatter:** `title`, `date`, `tags`, `draft` (static site generator compatible)
- **Slide format:** Marp-compatible `---` slide separators, `<!-- _class: -->` for themes, speaker notes as `<!-- speaker: note text -->`
- **Step outputs:** each step appends a section to an accumulating markdown document. Previous step content is carried forward for context.
- **State accumulation:** the accumulating document is the canonical pipeline state. No separate JSON state file needed for v1.

### Process Patterns

- **Install:** auto-detect opencode and Claude Code; register skills for each present tool
- **Step chaining:** each step's SKILL.md ends with instruction: "Output written to {path}. Invoke `ai-brief-<next>` to continue."
- **Template override:** user edits templates directly. Reinstall copies new defaults, creates `.bak` of originals. User merges changes manually.
- **Backup convention:** `.bak` suffix on original files before overwrite during reinstall.

## Project Structure & Boundaries

### Complete Project Directory Structure

```
ai-brief/
├── README.md
├── LICENSE
├── package.json               # Dipendenze Node.js (nessun publish npm)
├── install.sh                 # Script di installazione (clone + symlink)
├── .gitignore
├── pipeline-definition/
│   ├── pipeline.json          # Sequenza step della pipeline
│   └── formats.json           # Mappatura formati → orchestrator
├── src/
│   ├── cli.js                 # Entry point: ai-brief init|run|status|resume
│   ├── init.js                # Scaffolding progetto target
│   ├── pipeline/
│   │   ├── runner.js          # FR-1: esecuzione sequenziale pipeline
│   │   ├── step-loader.js     # Caricamento step da pipeline-definition/
│   │   └── tracker.js         # FR-2/3: stato su presence file, resume
│   ├── formats/
│   │   ├── opencode.js        # FR-5: SKILL writer per .opencode/agents/skills/
│   │   └── claude.js          # FR-5: SKILL writer per .claude/skills/
│   ├── templates/
│   │   ├── resolver.js        # FR-4: default → user override chain
│   │   ├── default/
│   │   │   ├── brief.md
│   │   │   ├── story.md
│   │   │   └── slide.md       # Marp-compatible
│   │   └── user/              # FR-6/7: override template + custom
│   └── utils/
│       ├── file.js            # copy, .bak, mkdir, cleanup
│       └── paths.js           # Risoluzione path (target project, output)
├── test/
│   ├── pipeline.test.js
│   └── formats.test.js
└── ai-brief-output/           # gitignorata
    ├── brief.md
    ├── stories.md
    └── steps/
        ├── 01-brief.md
        ├── 02-stories.md
        └── 03-dev.md
```

### Architectural Boundaries

**Pipeline Boundaries (src/pipeline/):**
- `runner.js` è il motore centrale — esegue gli step in sequenza, chiama `step-loader.js` per leggere `pipeline.json`
- `tracker.js` gestisce stato via presenza file in `ai-brief-output/steps/.step-{n}.completed` — nessun JSON state file in v1
- Confine netto: pipeline engine non conosce i formati di output, produce solo markdown intermedi

**Format Boundaries (src/formats/):**
- Ogni IDE ha il proprio orchestrator (`opencode.js`, `claude.js`) che traduce markdown intermedi in SKILL.md nel formato target
- `opencode.js` scrive in `.opencode/agents/skills/<skill-name>/SKILL.md`
- `claude.js` scrive in `.claude/skills/<skill-name>/SKILL.md`
- Condividono `src/utils/` per operazioni file comuni

**Template Boundaries (src/templates/):**
- `resolver.js` implementa la catena: cerca prima in `user/`, poi in `default/`
- Template override: copia da `default/` a `user/`, originale rinominato con `.bak`
- Ogni formato ha la sua directory template, ma la logica di risoluzione è condivisa

**Output Boundaries:**
- Output intermedi: `ai-brief-output/steps/` — file `.md` per step, leggibili e modificabili dall'utente
- Output finali: nel target project (`./.opencode/` o `./.claude/`)
- Nessun file di stato esterno — la presenza dei file `.completed` è l'unico stato persistente

### Requirements to Structure Mapping

**Pipeline Execution (FR-1, FR-2, FR-3):**
- `src/cli.js` — entry point per `ai-brief run`, `ai-brief status`, `ai-brief resume`
- `src/pipeline/runner.js` — esecuzione pipeline (FR-1)
- `src/pipeline/tracker.js` — stato step e resume (FR-2, FR-3)
- `src/pipeline/step-loader.js` — carica definizioni da `pipeline-definition/pipeline.json`
- `ai-brief-output/steps/` —存放 degli output intermedi (FR-2)

**Output Templates (FR-4, FR-5):**
- `src/templates/resolver.js` — logica di risoluzione template (FR-4)
- `src/templates/default/brief.md` — template brief markdown
- `src/templates/default/story.md` — template story markdown
- `src/templates/default/slide.md` — template slide Marp (FR-5)
- `src/formats/opencode.js` — generazione skill per opencode (FR-5)
- `src/formats/claude.js` — generazione skill per Claude Code (FR-5)

**Pipeline Customization (FR-6, FR-7):**
- `src/templates/user/` — override template utente (FR-6)
- `pipeline-definition/pipeline.json` — definizione step modificabile (FR-7)

**Cross-Cutting Concerns:**
- **IDE abstraction:** `src/formats/opencode.js` + `src/formats/claude.js` — ogni orchestrator implementa la stessa interfaccia
- **Step state:** `src/pipeline/tracker.js` — file-presence based, nessun JSON
- **Customization overlay:** `src/templates/resolver.js` — catena default → user con `.bak`
- **Context window:** architettura step-per-invocazione — ogni step è un'Invocazione AI fresca

### Integration Points

**Internal Communication:**
- `cli.js` → `runner.js` → `step-loader.js`, `tracker.js`
- `runner.js` per ogni step: carica template via `resolver.js` → esegui step → salva output intermedio → aggiorna tracker
- Al completamento pipeline: `runner.js` chiama format orchestrator (`opencode.js` o `claude.js`) per output finale
- Comunicazione via import/funzione diretta (stesso runtime Node.js)

**External Integrations:**
- Filesystem del progetto target: scrittura skill file in `.opencode/agents/skills/` o `.claude/skills/`
- Nessuna integrazione di rete o API esterna
- AI assistant (opencode/Claude Code) è l'esecutore degli skill generati, non un'integrazione diretta

**Data Flow:**
1. `ai-brief run` → `runner.js` legge `pipeline.json`
2. Per ogni step: carica template → genera contenuto intermedio → salva in `ai-brief-output/steps/{n}-{step}.md`
3. `tracker.js` scrive marker `.step-{n}.completed`
4. Al termine: format orchestrator traduce output intermedi in skill file nel target project
5. Utente invoca skill dall'AI assistant che referenzia i file intermedi

### File Organization Patterns

**Configuration Files:**
- `pipeline-definition/pipeline.json` — sequenza e configurazione step
- `pipeline-definition/formats.json` — formati attivi e relativi orchestrator
- `package.json` — dipendenze Node.js (solo runtime script, nessun publish)

**Source Organization:**
- `src/cli.js` — entry point singolo, comandi registrati come sotto-comandi
- `src/pipeline/` — core pipeline engine, isolato dai formati
- `src/formats/` — un file per IDE target, interfaccia comune
- `src/templates/` — logica template + file markdown puri
- `src/utils/` — utility condivise, nessuna dipendenza circolare

**Test Organization:**
- `test/pipeline.test.js` — test runner, tracker, step-loader
- `test/formats.test.js` — test opencode.js, claude.js, resolver.js
- Test vicini al codice che verificano (directory `test/` parallela a `src/` per semplicità v1)

**Asset Organization:**
- Template markdown in `src/templates/default/` — file puri, nessuna logica
- Template utente in `src/templates/user/` — isolati dagli aggiornamenti
- Output intermedi in `ai-brief-output/steps/` — gitignorati
- Script di installazione in `install.sh` — root del progetto

### Development Workflow Integration

**Development Server Structure:**
- Nessun dev server — è un CLI tool
- Sviluppo: `node src/cli.js run` per test locale
- Test: `node --test test/` (Node.js built-in test runner)

**Build Process Structure:**
- Nessun build step — JavaScript puro, nessun transpiler
- `install.sh` è l'unico step di "build" (copia file nelle posizioni target)

**Deployment Structure:**
- Deployment = git push (nessun npm publish)
- Installazione utente: `git clone <url> && ./install.sh`
- La struttura del progetto è sia source che distribuzione

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility — Critical Issue Found:**
- ✅ Hybrid SKILL Orchestrator (Step 4) and Node.js pipeline runner (Step 6) are in **direct contradiction**. Step 4 explicitly rejected "Node.js orchestrator script" as too complex, yet Step 6 introduced `src/pipeline/runner.js`. Both interpretations are valid but architecture needs one direction.
- ✅ All other decisions (template override with .bak, file-presence state, dual IDE paths, Marp slides, naming conventions) are mutually compatible

**Pattern Consistency:**
- ✅ Naming conventions (`ai-brief-` kebab-case) consistent across skills, files, and directories
- ✅ SKILL.md structure pattern aligns with both opencode and Claude Code targets
- ⚠️ Communication patterns inconsistent: SKILL chaining (Step 4) uses markdown file passing; Node.js runner (Step 6) uses direct function calls. Resolution deferred.

**Structure Alignment:**
- ⚠️ Project structure from Step 6 aligns better with Node.js CLI interpretation than with pure SKILL.md orchestration
- `install.sh` registration paths (`.opencode/agents/skills/`, `.claude/skills/`) are correct regardless of orchestration choice
- Output directory (`ai-brief-output/steps/`) works for both approaches

### Requirements Coverage Validation

**Functional Requirements Coverage:**
| FR | Coperto | Note |
|---|---|---|
| FR-1: Pipeline invocation | ⚠️ Parziale | Meccanismo ambiguo (CLI runner vs SKILL chaining) |
| FR-2: Step-by-step output | ✅ | `ai-brief-output/steps/` con `.completed` marker |
| FR-3: Pipeline status | ✅ | `tracker.js` via presence file |
| FR-4: Blog post template | ✅ | `templates/default/brief.md` |
| FR-5: Slide deck template | ✅ | `templates/default/slide.md` (Marp) |
| FR-6: Editable templates | ✅ | `templates/user/` con `.bak` su override |
| FR-7: Editable step prompts | ⚠️ Parziale | Struttura ha `pipeline.json` (JSON), non file prompt `.md` testuali |

**Non-Functional Requirements Coverage:**
| NFR | Coperto | Note |
|---|---|---|
| No SaaS/Web/GUI | ✅ | CLI + skill file locale |
| Open-source | ✅ | `LICENSE` nel progetto |
| Cross-IDE (opencode + Claude Code) | ✅ | `src/formats/opencode.js` + `src/formats/claude.js` |
| Markdown-only | ✅ | Markdown in/out per tutta la pipeline |
| No built-in model | ✅ | Delega all'AI assistant host |
| git clone + install script | ✅ | `install.sh` con auto-detect IDE |

### Implementation Readiness Validation

**Decision Completeness:**
- ✅ All critical decisions documented (orchestration, state management, template override, IDE registration)
- ⚠️ Versions and dependency versions not specified (no npm/published package, so versioning is git-based)
- ✅ Examples provided for naming, structure, format patterns

**Structure Completeness:**
- ✅ Complete project tree with all files and directories defined
- ✅ Component boundaries clearly specified (pipeline, formats, templates, utils)
- ⚠️ `pipeline-definition/pipeline.json` FR-7 gap — should be `.md` prompt files or clearly documented as JSON config

**Pattern Completeness:**
- ✅ Naming conventions comprehensive across all component types
- ✅ Process patterns documented (install flow, step chaining, template override, backup)
- ⚠️ Error handling patterns not explicitly documented (deferred to implementation)
- ⚠️ No test conventions specified beyond file locations

### Gap Analysis Results

**Critical Gaps (must resolve before implementation):**
1. **Orchestration contradiction** — SKILL.md orchestration (Step 4) vs Node.js runner (Step 6). Pick one before first story.
2. **FR-7 prompt files missing** — Step prompts as `.md` files were designed in Step 4 but replaced by `pipeline.json` in Step 6. Reconcile.

**Important Gaps (address before major implementation):**
3. **Error handling** — No patterns for pipeline failures, partial completion, or step retry
4. **Test conventions** — File locations exist but no patterns for mocking file system, fixture management

**Nice-to-Have Gaps:**
5. **CI/CD patterns** — Not needed for v1 (git-based distribution)
6. **Version compatibility** — Not specified across IDE versions
7. **Template migration** — No strategy for template updates beyond `.bak`

### Architecture Completeness Checklist

**Requirements Analysis:**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions:**
- [x] Critical decisions documented
- [ ] Technology stack fully specified (Node.js version range not pinned)
- [x] Integration patterns defined
- [ ] Performance considerations addressed (deferred — CLI tool, not performance-critical)

**Implementation Patterns:**
- [x] Naming conventions established
- [x] Structure patterns defined
- [ ] Communication patterns specified (conflict between SKILL vs Node.js)
- [ ] Process patterns documented (error handling missing)

**Project Structure:**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY WITH MINOR GAPS

**Confidence Level:** Medium — architecture is well-defined in most areas, but the orchestration contradiction must be resolved before implementation begins. The two critical gaps above will determine whether the Node.js CLI approach or the SKILL.md-only approach is pursued.

**Key Strengths:**
- Clear separation of concerns (pipeline engine, format output, templates, utils)
- IDE abstraction layer cleanly isolates platform-specific output
- Template override with `.bak` is simple and effective
- File-presence state tracking avoids JSON state file complexity in v1
- Complete requirements-to-structure mapping aids implementation

**Areas for Future Enhancement:**
- Error handling and retry patterns (v1.1)
- Template migration strategy beyond `.bak` (v2)
- Plugin/extension mechanism for additional IDE targets (post-v1)

### Implementation Handoff

**AI Agent Guidelines:**
- **Resolve orchestration contradiction before implementing:** confirm whether `src/pipeline/runner.js` or SKILL.md chaining is the execution mechanism
- Follow all architectural decisions as documented in this file
- Use implementation patterns consistently across all components
- Respect project structure, boundaries, and naming conventions
- Refer to this document for all architectural questions
- **Linked Services publishing:** See `architecture-addendum-linked-services.md` for the service publisher architecture

**First Implementation Priority:**
Resolve orchestration direction, then implement `install.sh` + scaffolding (`ai-brief init`) as the first story.
