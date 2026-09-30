# DEF-261: eslint-plugin CLAUDE.md files teach adapter mocking, `beforeEach` and `calledWith([])`

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | eslint-plugin |
| Found | 2026-09-30, read-only check of `scrolls/gateway/followup-sustainability.md` after the gateway pivot merged (788165421) |
| Moved from | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" and "Work carried over from the gateway build", 2026-09-30. That doc is deleted; git history holds it |

## What is wrong

`packages/eslint-plugin/src/brokers/rule/CLAUDE.md` teaches the old test style, now banned by lint:

- `:70` — "**Mocking adapters** - Mock underlying adapters (e.g., `fsExistsSyncAdapter`) using `beforeEach()`"
- `:71` — "**Mock at adapter level** - Use `registerMock` from `@dungeonmaster/testing/register-mock` to mock adapters"
- `:78` — `import {fsExistsSyncAdapter} from '../../../adapters/fs/fs-exists-sync';`
- `:81` — `const mockFsExistsSync = registerMock({fn: fsExistsSyncAdapter});`
- `:83-85` — teaches `beforeEach`, and `calledWith([])` as "the honest catch-all". Both are banned.

`packages/eslint-plugin/CLAUDE.md` names deleted adapters too:

- `:30` — "if rule uses `fsExistsSyncAdapter`, `fsReadFileSyncAdapter`, or other fs"
- `:51` — "Use `fsExistsSyncAdapter()` or other file system operations"

## What should happen

Both files teach what `get-testing-patterns` teaches today: a rule's test mocks the `#gateway` wrapper through that wrapper's own `.proxy.ts`, with inline setup and no catch-all. The `post-edit` timing note names the gateway fs wrappers.

## Where to look

- `packages/eslint-plugin/src/brokers/rule/CLAUDE.md`
- `packages/eslint-plugin/CLAUDE.md`
- The current pattern: `get-testing-patterns`, and any rule broker test that reads files

## History

Listed in the gateway follow-up doc's CLAUDE.md table on 2026-09-26. Still stale on 2026-09-30.
