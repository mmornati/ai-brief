# Story 4.1: Service Configuration & Loader

Status: ready-for-dev

## Story

As a developer,
I want a service configuration file and loader,
so that service bindings (name → format → connector) are defined in one place and loadable by the pipeline runner.

## Acceptance Criteria

1. **Valid config** — Given `pipeline-definition/services.json` exists with valid service definitions, when `loader.js` reads the file, then it returns an array of service objects with `name`, `format`, `connector`, `config`, and `default`.

2. **Default service resolution** — Given a service has `"default": true` for the `slides` format, when the pipeline runs with `--format slides` and no `--publish` flag, then the default slides service is used automatically.

3. **Env var resolution** — Given a service config value is `"env:VAR_NAME"`, when the loader resolves the config, then it reads the value from environment variable `VAR_NAME` and throws a descriptive error if the env var is not set.

4. **File path resolution** — Given a service config value is `"~/.config/ai-brief/creds.json"`, when the loader resolves the config, then it expands `~` to the user's home directory and throws a descriptive error if the file does not exist.

5. **Missing config file** — Given `services.json` is missing, when the loader attempts to read it, then it returns an empty array (publishing is optional, no crash).

6. **Duplicate defaults warning** — Given `services.json` has two services for the same format, when both have `"default": true`, then the loader logs a warning and uses the first one.

7. **Invalid service name** — Given a service entry has a non-kebab-case name, when `loadServices` validates it, then it throws a descriptive error.

8. **Missing required fields** — Given a service entry is missing `name`, `format`, or `connector`, when `loadServices` validates it, then it throws a descriptive error with the field name.

## Tasks / Subtasks

- [ ] Create `pipeline-definition/services.json` with example service entries (AC: 1)
  - [ ] Google Slides entry (format: "slides", connector: "src/services/google-slides.js", default: true)
  - [ ] Hashnode entry (format: "blog", connector: "src/services/hashnode.js", default: true)
- [ ] Create `src/services/loader.js` with `loadServices()` (AC: 1-7)
  - [ ] Read and parse services.json
  - [ ] Validate service entry structure (name kebab-case, required fields present)
  - [ ] Resolve `env:` prefixed config values from environment variables
  - [ ] Resolve `~` in file paths via `os.homedir()`
  - [ ] Handle missing file gracefully (return [])
  - [ ] Detect duplicate `default: true` per format, log warning, use first
- [ ] Add `loadServices` export to `src/pipeline/step-loader.js` (AC: 1)
- [ ] Add service typedefs to `src/pipeline/types.js`:
  - `ServiceDefinition` — `{ name, format, connector, config, default }`
  - `ServiceConfig` — `{ [key: string]: string }`
- [ ] Create `test/services/loader.test.js` (AC: 1-7)
- [ ] Create test fixtures: `test/fixtures/services-valid.json`, `services-empty.json`, `services-duplicate-default.json`, `services-missing-fields.json`

## Dev Notes

### Service Config JSON Schema

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
    }
  ]
}
```

### Env Var Resolution Rules

- `env:VAR_NAME` — read `process.env[VAR_NAME]`, throw if undefined or empty
- Plain string — use as-is
- `~` prefix — expand via `os.homedir()` (this is NOT an `env:` prefix, it's a plain path)
- All other values — use raw

### Loader API

```js
// src/services/loader.js
export async function loadServices(servicesPath, format)
// Returns ServiceDefinition[] — all services if format is null, filtered by format otherwise

export function resolveConfigValue(value)
// Returns resolved string (env value, expanded path, or raw)

export function validateServiceDefinition(def)
// Throws on invalid — name kebab-case, required fields present, connector ends with .js
```

### File Impact

| File | Change |
|------|--------|
| `pipeline-definition/services.json` | NEW — example service config |
| `src/services/loader.js` | NEW — service config loader + validation |
| `src/pipeline/step-loader.js` | MODIFY — add `loadServices` export |
| `src/pipeline/types.js` | MODIFY — add `ServiceDefinition`, `ServiceConfig` typedefs |
| `test/services/loader.test.js` | NEW — full test suite |
| `test/fixtures/services-*.json` | NEW — test fixtures |

### Existing Patterns to Follow

- Validation pattern: mirror `validateStepDefinitions` / `validateFormatDefinitions` in `step-loader.js`
- Error message format: `"Failed to load service definitions: {filePath} — {reason}"`
- Kebab-case check: reuse `isKebabCase` from step-loader (export it or duplicate it)
- Config file location: `pipeline-definition/services.json` (sibling to pipeline.json, formats.json)
- Test patterns: use `resolve('test/fixtures')` and `fixture()` helper like existing tests

### Testing

- Use `vi.stubEnv` for env var tests
- Test fixture files for valid, empty, duplicate-default, missing-fields, malformed JSON cases
- Test `loadServices` with both absolute path and missing file
- Test `resolveConfigValue` with `env:`, `~`, raw string corners

## References

- [Source: architecture-addendum-linked-services.md#ADR-LS-3] Config merging approach
- [Source: architecture-addendum-linked-services.md#L100-L127] Service config JSON format
- [Source: architecture-addendum-linked-services.md#L164-L177] File impact list
- [Source: src/pipeline/step-loader.js] Validation patterns to mirror
- [Source: src/pipeline/types.js] Typedef patterns to follow

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD