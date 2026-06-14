---
title: "PRFAQ Distillate: ai-brief"
type: llm-distillate
source: "prfaq-ai-brief.md"
created: "2026-06-08T19:04:00Z"
purpose: "Token-efficient context for downstream PRD creation"
---

## Concept

- **ai-brief**: open-source, file-driven content pipeline for solo technical creators
- Input: rough notes in markdown → Output: publication-ready blog posts and slide decks
- Invoked from the user's editor/terminal (opencode, Claude Code, VS Code)
- Inspired by BMAD's structured workflow approach but explicitly **not** dependent on BMAD
- Standalone project with its own architecture and distribution

## Customer & Problem

- **Persona**: Solo technical blogger/creator, technically-minded, uses markdown + editors
- **Problem**: Too much time between idea → finished content (validation, research, structuring, formatting)
- **Stakes**: Ideas go unrealized, drafts pile up, inconsistent quality
- **Current alternatives**: General AI chat tools (no project context, no repeatability), SaaS content tools (web UI, not developer-native)

## Pipeline (v1 scope)

- Steps: Validate → Research → Structure → Write → Format → Review
- Each step is a composable, inspectable, customizable skill/command
- User reviews and owns output at every step
- v1 formats: blog posts and slide decks only
- Explicitly NOT: newsletters, emails, social threads, courses, GUI, style profile, multi-variant output

## Key Architectural Signals

- Must be IDE-agnostic via a thin adapter layer (open to design — this is a significant component)
- Input is markdown notes in a project folder — exact format TBD
- Pipeline logic and templates are the durable asset; IDE integration is the interchangeable UI
- Research step identified as hardest technical challenge — depth vs. speed tradeoff
- Distribution: open-source package, installable into any project

## Competitive Landscape

- **Markdown renderers** (Marp, Slidev, reveal.js): convert MD to visuals, don't help create content
- **AI content tools** (ContentBot): SaaS/web, not CLI or editor-native
- **IDE-specific writing skills** (Claude Code Content Studio, writing-agent): single-IDE only
- **Gap**: No cross-IDE, file-driven, open-source content pipeline exists

## Risks & Open Questions

1. **BMAD-independence**: Concept described in BMAD terms but explicitly not BMAD. Needs independent architectural design for skills/commands/pipeline.
2. **Cross-IDE adapter**: "Thin adapter layer" is assumed but not designed — this is a real architectural component.
3. **Adoption**: No evidence solo creators will adopt process-overhead tools. v1 must prove ROI on first run.
4. **Research quality**: The hardest technical problem — shallow research kills repeat usage.
5. **Market shift risk**: If agent/skill paradigm fades, the invocation mechanism must be swappable.

## Timeline & Scope

- v1 (blog + slides): 2-4 weeks
- Production-quality for strangers: 2-3 months
- First user is the creator — if it doesn't save his time, it's not ready

## V2+ Stretch Candidates

- Newsletters, emails, social threads, courses as format templates
- Style profile (ingest past writing to mirror voice)
- Multi-variant output (generate 3-5 structural versions)
- Interviewer stage (build brief from nothing via Q&A)

## Verdict Summary

- **Forged**: Customer persona, problem, independent positioning, honest risk awareness
- **Needs heat**: Pipeline step definitions, input format, primary IDE target, research approach
- **Cracks**: BMAD-independence needs real architecture (not just aspiration), adapter layer design, adoption proof
