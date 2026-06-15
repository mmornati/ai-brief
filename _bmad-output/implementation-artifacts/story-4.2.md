# Story 4.2: ServicePublisher Base Class

Status: ready-for-dev

## Story

As a developer,
I want a base class for all service connectors,
so that new services can be added without changing the pipeline runner.

## Acceptance Criteria

1. **Abstract base** — Given `src/services/base.js` exists, when a new service connector extends `ServicePublisher`, then it must implement `publish(localFilePath, content, metadata)` and `validateConfig()`.

2. **Config validation** — Given a service connector is instantiated, when `validateConfig()` is called, then it checks that all required config keys are present and valid and returns `{ valid: boolean, errors: string[] }`.

3. **Invalid config protection** — Given a service connector's config is invalid, when `publish()` is called, then it throws a descriptive error before any network call.

4. **Direct instantiation guard** — Given the base class is instantiated directly (not extended), when `new ServicePublisher()` is called, then it throws an error (abstract base class).

5. **Constructor stores metadata** — Given a subclass calls `super(serviceName, formatType, config)`, when the instance is created, then `this.serviceName`, `this.formatType`, and `this.config` are set correctly.

6. **Publish metadata propagation** — Given a subclass calls `super(serviceName, formatType, config)`, when `publish()` is called with `metadata`, then `this.resolveConfigValue(key)` resolves env vars defined in `this.config`.

## Tasks / Subtasks

- [ ] Create `src/services/base.js` with `ServicePublisher` abstract class (AC: 1-6)
  - [ ] Constructor: `constructor(serviceName, formatType, config)` — stores params, guards direct instantiation
  - [ ] `publish(localFilePath, content, metadata)` — abstract, throws "Subclasses must implement publish()"
  - [ ] `validateConfig()` — abstract, throws "Subclasses must implement validateConfig()"
  - [ ] `resolveConfigValue(key)` — resolves `this.config[key]` via env vars or raw string (reuse pattern from 4.1)
- [ ] Create `test/services/base.test.js` (AC: 1-6)
  - [ ] Test direct instantiation throws
  - [ ] Test subclass without publish() throws
  - [ ] Test subclass with both methods works
  - [ ] Test config validation base behavior
  - [ ] Test resolveConfigValue with env var and raw value

## Dev Notes

### ServicePublisher Contract

```js
export class ServicePublisher {
  constructor(serviceName, formatType, config) {
    if (new.target === ServicePublisher) {
      throw new Error('ServicePublisher is abstract...');
    }
    this.serviceName = serviceName;
    this.formatType = formatType;
    this.config = config;
  }

  async publish(localFilePath, content, metadata) {
    throw new Error('Subclasses must implement publish()');
  }

  async validateConfig() {
    throw new Error('Subclasses must implement validateConfig()');
  }

  resolveConfigValue(key) {
    const value = this.config[key];
    if (typeof value === 'string' && value.startsWith('env:')) {
      const envVar = value.slice(4);
      const resolved = process.env[envVar];
      if (!resolved) throw new Error(`Environment variable ${envVar} is not set`);
      return resolved;
    }
    if (typeof value === 'string' && value.startsWith('~/')) {
      return value.replace('~', os.homedir());
    }
    return value;
  }
}
```

### Required Config Validation Pattern

Subclasses define their required keys, then call a base helper:

```js
async validateConfig() {
  const required = ['presentationId', 'credentialsPath'];
  const errors = [];
  for (const key of required) {
    try {
      this.resolveConfigValue(key);
    } catch (e) {
      errors.push(e.message);
    }
  }
  return { valid: errors.length === 0, errors };
}
```

### File Impact

| File | Change |
|------|--------|
| `src/services/base.js` | NEW — ServicePublisher abstract class |
| `test/services/base.test.js` | NEW — full test suite |

### Existing Patterns to Follow

- Mirror `FormatWriter` base class from `src/formats/base.js` — same abstract class pattern with `new.target` guard
- Mirror the JSDoc typedef conventions from `src/pipeline/types.js`
- Use `os` module from Node.js stdlib for homedir expansion (no deps needed)
- Test patterns: `describe`, `it`, `expect` from vitest like existing tests

### Testing

- Create a `MockPublisher extends ServicePublisher` in test for validation
- Test that constructor throws on direct instantiation
- Test that missing method implementations throw
- Test `resolveConfigValue` with env (use `vi.stubEnv`), file path (`~`), and raw string
- Test `validateConfig` returns correct shape

## References

- [Source: architecture-addendum-linked-services.md#ADR-LS-2] ServicePublisher base class design
- [Source: architecture-addendum-linked-services.md#L46-L53] ServicePublisher contract pseudocode
- [Source: src/formats/base.js] Existing abstract base class pattern to mirror
- [Source: src/pipeline/types.js] JSDoc typedef conventions

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD