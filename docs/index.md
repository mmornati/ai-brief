---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "AI Brief"
  text: "Turn raw ideas into polished content"
  tagline: AI-powered pipeline for generating blog posts, slide decks, and structured briefs — running inside opencode and Claude Code.
  image:
    src: /ai-brief-logo.svg
    alt: AI Brief
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/mmornati/ai-brief

features:
  - icon: 🧠
    title: AI-Native Pipeline
    details: Six structured steps (validate → research → structure → write → format → review) with accumulated context. No API keys, no SaaS.
  - icon: 📝
    title: Multi-Format Output
    details: Generate blog posts with YAML frontmatter or Marp-compatible slide decks with speaker notes.
  - icon: 🔌
    title: IDE Agnostic
    details: Works with both opencode and Claude Code. Install once, use in any project.
  - icon: 🛠️
    title: Fully Customizable
    details: Every step prompt and output template is a plain markdown file. Edit them to match your workflow.
  - icon: 🔄
    title: Resumable Pipelines
    details: State is saved per-step. Inspect, edit intermediates, and resume from any point.
  - icon: 📦
    title: Zero Runtime Dependencies
    details: Pure Node.js, no npm dependencies. Vitest is the only dev dependency for testing.
---
