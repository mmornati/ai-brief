# Development

This guide covers how to develop and contribute to AI Brief itself.

## Project Structure

```
ai-brief/
├── src/
│   ├── cli.js                 # CLI entry point
│   ├── install.js             # Install script logic
│   ├── pipeline/
│   │   ├── runner.js          # Sequential step execution
│   │   ├── step-loader.js     # Loads pipeline/format definitions
│   │   ├── tracker.js         # Per-step state tracking + resume
│   │   └── types.js           # JSDoc type definitions
│   ├── formats/
│   │   ├── base.js            # Abstract format writer
│   │   ├── blog.js            # Blog post renderer
│   │   ├── slides.js          # Slide deck renderer
│   │   ├── opencode.js        # opencode skill generator
│   │   └── claude.js          # Claude Code skill generator
│   ├── templates/
│   │   ├── resolver.js        # Template resolution chain
│   │   ├── default/           # Built-in templates
│   │   └── user/              # User override templates
│   └── utils/
│       ├── file.js            # Filesystem utilities
│       └── paths.js           # Path resolution
├── steps/                     # Pipeline step prompt files
├── pipeline-definition/       # Pipeline JSON configuration
├── test/                      # Test suite (Vitest)
└── docs/                      # VitePress documentation site
```

## Setup

```bash
git clone https://github.com/mmornati/ai-brief.git
cd ai-brief
npm install
```

## Testing

AI Brief uses [Vitest](https://vitest.dev/) for testing.

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Test Structure

Tests are in `test/` and mirror the source structure:

```
test/
├── sanity.test.js                 # CLI entry point tests
├── install.test.js                # Install script tests
├── steps-and-templates.test.js    # Step/template integrity
├── pipeline/
│   ├── types.test.js              # Type validation
│   ├── runner.test.js             # Pipeline runner
│   ├── step-loader.test.js        # Step/format loader
│   └── tracker.test.js            # Pipeline tracker
├── formats/
│   ├── base.test.js               # Format writer base
│   ├── blog.test.js               # Blog format
│   ├── slides.test.js             # Slides format
│   ├── opencode.test.js           # opencode generator
│   └── claude.test.js             # Claude Code generator
├── templates/
│   └── resolver.test.js           # Template resolver
└── fixtures/                      # Test fixtures
```

## Running Locally

```bash
# Create an input file
cat > my-idea.md << 'EOF'
# My Test Idea

This is a test blog post about AI tools.
EOF

# Run the pipeline
node src/cli.js run my-idea.md --format blog
```

## Building Documentation

```bash
# Install docs dependencies
cd docs && npm install

# Start dev server
npm run docs:dev

# Build for production
npm run docs:build

# Preview production build
npm run docs:preview
```

## Coding Conventions

- **Language**: JavaScript (ESM, `"type": "module"`)
- **Style**: No runtime dependencies; Vitest is the only dev dependency
- **Naming**: kebab-case for files, camelCase for functions/variables
- **Skills**: `ai-brief-` prefix for all skill names
- **Testing**: Unit tests alongside source, Vitest with Node environment

## Architecture Overview

The project follows a clean separation of concerns:

- **`src/pipeline/`** — Core execution engine, knows nothing about output formats
- **`src/formats/`** — Format-specific renderers and IDE generators
- **`src/templates/`** — Template resolution (default → user override chain)
- **`src/utils/`** — Shared filesystem and path utilities