---
date: 2026-06-14
status: draft
parentDocument: architecture.md
---

# Architecture Addendum: Linked Services Publishing System

## Context

The current pipeline generates local markdown files (Marp slides, blog frontmatter). Users want to push these formatted outputs directly to external services — Google Slides for decks, Hashnode for blogs, and extensibly any future service.

## Design Decisions

### ADR-LS-1: Service as Post-Processor Layer

**Decision:** Services are a separate publish layer that runs *after* the format orchestrator writes the local file. The pipeline itself is unchanged.

**Rationale:**
- Zero impact on existing pipeline, step prompts, or format writers
- Local file generation remains the default — publishing is opt-in
- Service connectors can be developed and tested independently
- Pipeline can run without network access (local-first)

**Flow:**
```
Pipeline Steps → Format Orchestrator → Local File (always written)
                                     ↘ Service Publisher (optional)
                                         ├── Google Slides (format: slides)
                                         ├── Hashnode (format: blog)
                                         └── (future)
```

### ADR-LS-2: ServicePublisher Abstract Base Class

**Decision:** All service connectors extend a common `ServicePublisher` base class with a `publish(content, metadata)` method.

```
src/services/
  base.js               # ServicePublisher abstract base class
  google-slides.js      # Google Slides connector
  hashnode.js           # Hashnode connector
  loader.js             # Service config loader + validation
```

**ServicePublisher contract:**
```javascript
class ServicePublisher {
  constructor(serviceName, formatType) { ... }
  async publish(localFilePath, content, metadata) { ... }
  async validateConfig() { ... }
}
```

### ADR-LS-3: Configuration Merging — Config File + CLI Flags

**Decision:** Service bindings are defined in `pipeline-definition/services.json` and can be overridden per-run via `--publish <service-name>`.

**Resolution order:**
1. If `--publish` CLI flag is present, use that service (error if not found)
2. If no flag but `services.json` has a default service matching the format, use that
3. If neither, run pipeline-only (current behavior)

### ADR-LS-4: Service Credentials Out of Repo

**Decision:** Credentials live in environment variables or `~/.config/ai-brief/`. The config file references them by env-var name (`env:VAR_NAME`) or file path.

- Google credentials: `~/.config/ai-brief/google-credentials.json` (JSON key file)
- Hashnode token: `HASHNODE_API_KEY` env var
- Google presentation ID: `GOOGLE_SLIDES_PRESENTATION_ID` env var

### ADR-LS-5: Google Slides — Update Existing Presentation

**Decision:** Each run updates a specific Google Slides presentation (identified by a stable ID from config). Slides are replaced in-place: clear all existing slides, then rebuild from the pipeline output.

**API approach:**
- Google Slides API v1 via REST (no heavy SDK client)
- Service account authentication (Google Cloud service account with editor access)
- `presentations.batchUpdate` with `deleteText` + `createSlide` + `insertText` requests
- Speaker notes from `<!-- speaker: -->` comments → `createParagraphBullets` on notes page

### ADR-LS-6: Hashnode — Draft Only

**Decision:** Pushes to Hashnode as a draft. User publishes manually from Hashnode dashboard.

**API approach:**
- Hashnode GraphQL API (`https://gql.hashnode.com`)
- `createStory` mutation with `draft: true`
- Title from YAML frontmatter, tags from `tags` frontmatter, body from markdown content
- Publication ID from env var

### ADR-LS-7: Runtime Dependencies

**Decision:** Add minimal runtime dependencies only for service connectors. Core pipeline remains dependency-free.

- `googleapis` (or direct fetch via Node's native `fetch`) — for Google Slides API
- Native `fetch` (Node 18+) — for Hashnode GraphQL API
- These are imported only by service connectors, never by core pipeline code

## Service Configuration Format

**`pipeline-definition/services.json`:**
```json
{
  "services": [
    {
      "name": "google-slides",
      "format": "slides",
      "connector": "src/services/google-slides.js",
      "default": true,
      "config": {
        "presentationId": "env:GOOGLE_SLIDES_PRESENTATION_ID",
        "credentialsPath": "~/.config/ai-brief/google-credentials.json"
      }
    },
    {
      "name": "hashnode",
      "format": "blog",
      "connector": "src/services/hashnode.js",
      "default": true,
      "config": {
        "apiKey": "env:HASHNODE_API_KEY",
        "publicationId": "env:HASHNODE_PUBLICATION_ID"
      }
    }
  ]
}
```

## CLI Changes

```
ai-brief run docs/idea.md --format slides
  → pipeline runs, local file written, no publishing (no --publish flag)

ai-brief run docs/idea.md --format slides --publish google-slides
  → pipeline runs, local file written, pushed to Google Slides

ai-brief run docs/idea.md --format blog --publish hashnode
  → pipeline runs, local file written, pushed to Hashnode as draft

ai-brief run docs/idea.md --format slides --publish unknown
  → error: no service "unknown" found in services.json
```

## Pipeline Runner Changes (`runner.js`)

After the format orchestrator writes the local file:

```javascript
// Existing: format orchestrator writes local file
const outputPath = await orchestrator(accumulatedContent, { inputFile, format });

// New: optional service publishing
if (options.publish) {
  const services = await loadServices(servicesPath);
  const service = services.find(s => s.name === options.publish);
  if (!service) throw new Error(`Unknown service "${options.publish}"`);
  const connector = await loadServiceConnector(service.connector);
  await connector.publish(outputPath, accumulatedContent, { inputFile, format, service });
}
```

## File Impact Summary

| File | Change |
|------|--------|
| `src/services/base.js` | New — `ServicePublisher` base class |
| `src/services/google-slides.js` | New — Google Slides connector |
| `src/services/hashnode.js` | New — Hashnode connector |
| `src/services/loader.js` | New — Service config loader |
| `pipeline-definition/services.json` | New — Service configuration |
| `src/pipeline/runner.js` | Modify — Add publish step after orchestrator |
| `src/pipeline/step-loader.js` | Modify — Add `loadServices` export |
| `src/cli.js` | Modify — Add `--publish` flag parsing |
| `package.json` | Modify — Add `googleapis` dependency |
| `src/pipeline/types.js` | Modify — Add service typedefs |

## Non-Changes

- `src/formats/slides.js` — untouched (local file generation unchanged)
- `src/formats/blog.js` — untouched (local file generation unchanged)
- `src/formats/base.js` — untouched
- Pipeline steps (`steps/*.md`) — untouched
- Templates (`src/templates/*`) — untouched
- Install script — untouched