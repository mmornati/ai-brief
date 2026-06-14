---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Content authoring system with writer skills/agents (BMAD-style) for slides and blog posts'
session_goals: 'Define architecture, output templates, skill hierarchy, and workflow for a file-driven content-authoring system'
selected_approach: 'ai-recommended'
techniques_used: ['SCAMPER Method', 'What If Scenarios', 'Morphological Analysis']
ideas_generated:
  - '[System #1] The Director Paradigm: User commands, agents execute'
  - '[System #2] Pipeline Processing: Composable Researcher→Writer pipeline'
  - '[System #3] CI/CD Content Pipeline: notes→research→structure→format→output with quality gates'
  - '[System #4] Recursive Pipeline: Writer→Researcher loop for iterative refinement'
  - 'Multi-format output: slides, blogs, newsletters, emails, courses, social threads'
  - 'Minimal Core: single agent/skill prompt→MD output'
  - 'Mid-flow entry: jump to any pipeline step from existing material'
  - '[What If #1] The Interviewer Stage: adaptive Q&A for building brief from nothing'
  - '[What If #2] Style Profile: persistent style memory from past writing samples'
  - '[What If #3] Self-Critique with Auto-Fix: recursive refinement with optional deep-dive'
  - '[What If #4] Multi-Variant Output: 3-5 structural versions to pick and merge'
  - 'Morphological Grid: Input×Pipeline×Output×Quality×Style×Audience matrix'
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** mmornati
**Date:** 2026-06-08

## Session Overview

**Topic:** Content authoring system with writer skills/agents (BMAD-style) for slides and blog posts

**Goals:**
- Architect a BMAD-like skill/agent system for content writing (starting with tech-writer)
- Define output templates for blog posts (MD), slides (MD), and more
- Design a file-driven, frontend-less workflow (put notes/docs in folder → run a process → get structured output)
- The system should ask for target audience, presentation length, etc. if not specified
- Output MD that can be fed to an AI slide generator
- Open source project

### Session Setup

- **User:** mmornati
- **Core problem:** Speed up content creation + ensure consistent, well-structured output
- **Workflow style:** File-driven, no frontend. Skills callable from VSCode/opencode/claude code (like BMAD)
- **Input:** Text document with ideas/notes in a "docs" folder
- **Output:** Structured MD files for blog posts, slides, etc.
- **Target:** Open source (initially solo user)

## Technique Selection

**Approach:** AI-Recommended Techniques

**Analysis Context:** Content authoring system with writer skills/agents, with focus on defining architecture, output templates, skill hierarchy, and file-driven workflow

**Recommended Techniques:**

- **SCAMPER Method:** Systematic exploration of the system design through 7 lenses (Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse). Expected outcome: comprehensive feature map
- **What If Scenarios:** Radical constraint removal to push into edge cases and breakthrough features. Expected outcome: innovative feature requirements
- **Morphological Analysis:** Grid-based systematic mapping of parameter combinations (input × output × audience × length × skill). Expected outcome: template system skeleton + skill hierarchy

**AI Rationale:** SCAMPER opens divergent possibilities, What If pushes boundaries, Morphological Analysis converges into structured architecture

## SCAMPER Results

### Ideas Generated

| # | Idea | SCAMPER Lens |
|---|------|-------------|
| 1 | **[System #1] The Director Paradigm** — User-as-director, agents as writers/researchers | Combine |
| 2 | **[System #2] Pipeline Processing** — Composable Researcher→Writer pipeline | Combine |
| 3 | **[System #3] CI/CD Content Pipeline** — notes→research→structure→format→output with quality gates | Adapt |
| 4 | **[System #4] Recursive Pipeline** — Writer→Researcher refinement loop | Modify/Magnify |
| 5 | **Multi-format output** — slides, blogs, newsletters, emails, courses, social threads | Put to Another Use |
| 6 | **Minimal Core** — single agent/skill prompt→MD output | Eliminate |
| 7 | **Mid-flow entry** — jump to any pipeline step from existing material | Reverse/Rearrange |

### Emerging Themes

**Theme 1: The Director Paradigm** (foundational)
- [System #1] Director commands, agents execute
- Mid-flow entry — jump to any pipeline step
- Multi-format output commands

**Theme 2: Pipeline Engine**
- [System #2] Researcher→Writer pipeline
- [System #3] CI/CD stages with quality gates
- [System #4] Recursive refinement loop

**Theme 3: Minimal Viable Core**
- Single agent/skill prompt→MD output
- Prompt-based configuration
- Markdown-only throughout

### Prioritization

Selected theme: **All three as one coherent system** — Director Paradigm as organizing principle, Pipeline Engine as implementation, Minimal Core as starting point.

### Action Plan

1. **Build Minimal Core (MVP)** — single BMAD-style skill with prompt + output template
2. **Add Researcher** — second composable skill for context enrichment
3. **Add Dispatcher & Recursion** — director-style routing + optional refinement loop
4. **Expand formats** — templates for newsletters, emails, social threads, courses

## What If Scenarios Results

| # | Idea | Concept |
|---|------|---------|
| 1 | **The Interviewer Stage** — When no input notes exist, the pipeline starts with an adaptive Interviewer agent that builds a structured brief through conversational Q&A | Adaptive conversation (broad questions → follow-ups) |
| 2 | **Style Profile** — Optional one-time setup ingests past writing samples and builds a persistent style guide (`_style-guide.md`) that informs all future outputs | Captures voice/tone from social posts, articles, docs |
| 3 | **Self-Critique with Auto-Fix** — After drafting, the system reviews its own output, fixes issues, and provides a change summary. Optional "show your work" for full critique | Auto-fix by default, inspectable on demand |
| 4 | **Multi-Variant Output** — Writer generates 3-5 structurally different versions from one brief; Director picks and merges | Mood board of structures before refinement |

## Morphological Analysis Results

### System Parameter Grid

| Parameter | Values |
|-----------|--------|
| **Input** | Title, Notes, Draft, Existing content |
| **Pipeline** | Interview → Research → Write → Format ± Review |
| **Output** | Slides, Blog, Newsletter, Email, Course, Social |
| **Quality** | Always Refined (recursive loop active by default) |
| **Style** | Profile-based (optional), per-output override |
| **Audience** | Technical, General, Executive, Mixed |

### Key Configuration Mappings

| Input Type | Active Pipeline Stages |
|-----------|----------------------|
| Title only | Interview → Research → Write → Format → Review |
| Rough notes | Research → Write → Format → Review |
| Full draft | Write → Format → Review |
| Existing content | Format (reformat only) |

| Audience | Primary Outputs |
|----------|---------------|
| Technical | Blog, Slides, Docs |
| General | Newsletter, Social, Blog |
| Executive | Email, Brief, Slides |
| Mixed | Layered (summary + deep-dive) |

### Session Summary

**12 ideas** generated across 3 techniques, organized into 3 themes (Director Paradigm, Pipeline Engine, Minimal Core), converging into a coherent parameterized system architecture ready for implementation.
