# Deferred Work
## Deferred from: code review of story-1.2 (2026-06-14)

- `src/utils/paths.js` is a stub created per dev notes ("create stubs if they don't exist yet, refine in later stories") — not exercised by story 1.2; refine in a later story
- `isMain` symlink fragility (continues from story 1.1 deferral) — `endsWith('install.js')` fallback may match unrelated files; acceptable for v1 [`src/install.js`]
- No `bin` field in package.json (continues from story 1.1 deferral) — `install.sh` is the only entry point per architecture; acceptable [`package.json`]
- No `--version` / `-h` / `--help` flag in install CLI — not in AC; matches v1 scope [`src/install.js`]
- AC #4 mentions copying modified stock templates to `templates/user/` with a warning; current implementation just backs up `.bak` and overwrites in place — full user/ override mechanism is story 1.5 [`src/install.js`, `epics.md#1.5`]

## Deferred from: code review of story-1.1 (2026-06-14)

- `engines.node: ">=18"` is EOL — deferred, pre-existing (spec Dev Notes mandate ">=18") [`package.json`]
- No `bin` field in package.json — deferred, pre-existing (architecture's `install.sh` belongs to a future story) [`package.json`]
- No runtime dependencies — deferred, pre-existing (spec Dev Notes: vitest is dev-only) [`package.json`]
- Stub commands lack TODO markers — deferred, pre-existing (spec Dev Notes: "acceptable for v1") [`src/cli.js`]
- No `--version` / `-V` flag — deferred, pre-existing (not in AC) [`src/cli.js`]
- `isMain` symlink fragility — deferred, pre-existing (spec Dev Notes: bare process.argv, "acceptable for v1") [`src/cli.js:40`]
- No try/catch around `cmd.run()` — deferred, pre-existing (improvement, not required by AC) [`src/cli.js:58`]
- `.step-*.{completed,failed}` convention undocumented — deferred, pre-existing (future story concern) [`.gitignore`]
- No `.nvmrc` — deferred, pre-existing (out of scope for story 1.1)
- No lint/format tooling — deferred, pre-existing (out of scope for story 1.1)
- Missing `repository`/`bugs`/`homepage` in package.json — deferred, pre-existing (out of scope for story 1.1) [`package.json`]
- `src/cli.js` not executable (shebang dead) — deferred, pre-existing (AC #5 specifies `node src/cli.js`) [`src/cli.js`]
- Architecture expects `src/init.js` — deferred, pre-existing (out of scope for story 1.1) [`architecture.md:194`]
- `src/templates/.gitkeep` placeholder not created — deferred, pre-existing (AC #1 satisfied via `default/` and `user/` subdirs)
- Empty `.gitkeep` placeholders may rot — deferred, pre-existing (required by AC #1)
