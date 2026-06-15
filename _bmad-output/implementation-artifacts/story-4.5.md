# Story 4.5: CLI & Runner Integration

Status: ready-for-dev

## Story

As a user,
I want to publish pipeline output by adding a `--publish` flag to the `run` command,
so that I control when publishing happens without extra configuration steps.

## Acceptance Criteria

1. **Publish with flag** — Given I run `ai-brief run docs/idea.md --format slides --publish google-slides`, when the pipeline completes successfully, then the slide deck is written to the local file (as always), the Google Slides connector is invoked, and a success message is printed with the presentation URL.

2. **No flag = no publish** — Given I run `ai-brief run docs/idea.md --format slides` (no `--publish` flag), when the pipeline completes successfully, then the slide deck is written to the local file and no service connector is invoked (current behavior preserved).

3. **Unknown service error** — Given I run `ai-brief run docs/idea.md --format slides --publish unknown`, when the pipeline completes, then an error is printed: `Unknown service "unknown". Available services: google-slides, hashnode` and the local file is still written.

4. **Publish failure non-fatal** — Given I run `ai-brief run docs/idea.md --format blog --publish hashnode`, when the connector fails (e.g., network error), then the local file is still written successfully and an error message is printed but the pipeline exit code is not affected by publish failure.

5. **Default service auto-publish** — Given a default service is configured for the `slides` format in `services.json`, when I run `ai-brief run docs/idea.md --format slides` (no `--publish`), then the default service is used automatically and the slide deck is published to Google Slides.

6. **--publish overrides default** — Given a default service is configured for the `slides` format, when I run `ai-brief run docs/idea.md --format slides --publish hashnode`, then the hashnode service is used instead of the default.

7. **Help text update** — Given I run `ai-brief run --help`, then the help text mentions the `--publish` flag.

## Tasks / Subtasks

- [ ] Modify `src/cli.js`: Add `--publish` / `-p` flag parsing (AC: 1-3, 7)
  - [ ] Parse `--publish <service-name>` and `--publish=<service-name>` formats
  - [ ] Pass `publish` option through to `runPipeline()`
  - [ ] Update help text to mention `--publish`
  - [ ] Add a `--list-services` flag that reads services.json and prints available services
- [ ] Modify `src/pipeline/runner.js`: Add publish step after format orchestrator (AC: 1-6)
  - [ ] After orchestrator writes local file, determine which service to use:
    - [ ] If `--publish` flag is set, find service by name in services.json
    - [ ] If no `--publish` flag but a default service exists for this format, use it
    - [ ] If no service matched, skip publishing silently (current behavior)
  - [ ] Load the service connector dynamically via `import(connectorPath)`
  - [ ] Instantiate connector, call `validateConfig()`, then `publish()`
  - [ ] Wrap publish in try/catch — log but don't fail the pipeline
  - [ ] Print success message with URL from connector
  - [ ] Add `servicesPath` option defaulting to `pipeline-definition/services.json`
- [ ] Update `src/pipeline/runner.js` function signature to accept `publish` option (AC: 1)
- [ ] Modify `src/pipeline/step-loader.js`: Add `loadServiceConnector(path)` helper (AC: 1)
- [ ] Create test fixtures for runner with services: `test/fixtures/runner-with-services.test.js` (AC: 1-6)
- [ ] Update `test/pipeline/runner.test.js` with publish-related tests (AC: 1-6)

## Dev Notes

### Runner Integration Code Structure

```js
// In runner.js, after orchestrator writes local file:

const outputPath = await orchestrator(accumulatedContent, { inputFile, format });

// Determine service to use
let targetServiceName = options.publish;
if (!targetServiceName) {
  const defaultService = services.find(s => s.format === format && s.default);
  if (defaultService) targetServiceName = defaultService.name;
}

if (targetServiceName) {
  const serviceDef = services.find(s => s.name === targetServiceName);
  if (!serviceDef) {
    console.error(`Unknown service "${targetServiceName}". Available: ${services.map(s => s.name).join(', ')}`);
    return outputPath; // non-fatal
  }
  try {
    const connector = await loadServiceConnector(serviceDef);
    const result = await connector.publish(outputPath, accumulatedContent, { inputFile, format });
    console.log(result);
  } catch (err) {
    console.error(`Publish failed (${targetServiceName}): ${err.message}`);
    // non-fatal — local file is already written
  }
}
```

### CLI Parsing Changes

```js
// In parseArgs():
function parseArgs(args) {
  let inputFile = null;
  let format = null;
  let publish = null;

  for (let i = 0; i < args.length; i++) {
    if (arg === '--publish' || arg === '-p') {
      publish = args[++i];
    } else if (arg.startsWith('--publish=')) {
      publish = arg.slice('--publish='.length);
    }
    // ... existing format/inputFile parsing
  }
  return { inputFile, format, publish };
}
```

### Dynamic Connector Loading

```js
export async function loadServiceConnector(serviceDef) {
  const absPath = resolve(projectRoot, serviceDef.connector);
  const mod = await import(absPath);
  const ConnectorClass = mod.default;
  const connector = new ConnectorClass(serviceDef.name, serviceDef.format, serviceDef.config);
  const validation = await connector.validateConfig();
  if (!validation.valid) {
    throw new Error(`Service "${serviceDef.name}" config invalid: ${validation.errors.join('; ')}`);
  }
  return connector;
}
```

### Services Path Resolution

```js
const servicesPath = options.servicesPath || path.resolve(projectRoot, 'pipeline-definition', 'services.json');
```

### Publish Failure Handling

Publish failures MUST NOT:
- Change the pipeline exit code
- Delete the written local file
- Prevent subsequent steps (there are none after orchestrator, but the principle stands)

Publish failures SHOULD:
- Print a clear error message to stderr
- Include the service name and error details

### CLI --list-services Flag

For discoverability, add a flag that lists available services:

```
$ ai-brief run docs/idea.md --format slides --list-services
Available services for "slides":
  google-slides  (default)
```

### File Impact

| File | Change |
|------|--------|
| `src/cli.js` | MODIFY — add `--publish` / `-p` flag parsing, help text |
| `src/pipeline/runner.js` | MODIFY — add publish step after orchestrator |
| `src/pipeline/step-loader.js` | MODIFY — add `loadServiceConnector()` export |
| `test/pipeline/runner.test.js` | MODIFY — add publish integration tests |

### Existing Patterns to Follow

- CLI flag parsing: mirror `--format` flag style in `parseArgs()`
- Runner: mirror the format orchestrator loading pattern for service connector loading
- Dynamic import: reuse `loadFormatOrchestrator` pattern from `runner.js:loadFormatOrchestrator`
- Error messages: follow console.error format from runner.js step failure handling

### Testing

- Integration test: mock both format orchestrator AND service connector, verify flow
- Test that `--publish` flag propagates through to runner
- Test default service resolution from services config
- Test publish failure does not affect pipeline exit
- Test unknown service name error message
- Test no `--publish` flag = no publish call

## References

- [Source: architecture-addendum-linked-services.md#ADR-LS-3] Config merging (flag + defaults)
- [Source: architecture-addendum-linked-services.md#L130-L143] CLI usage examples
- [Source: architecture-addendum-linked-services.md#L146-L161] Runner integration pseudocode
- [Source: src/cli.js] Existing CLI parsing patterns
- [Source: src/pipeline/runner.js] Existing runner — format orchestrator loading pattern
- [Source: src/pipeline/step-loader.js] Existing loader patterns to extend

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD