# F133: `adapter-census` reports adapters, and no package has a `src/adapters/` folder

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | tooling |
| Found | post-merge connection check, 2026-09-30 |
| Moved from | `scrolls/brands-gateways-epic/EPIC.md` (Follow-up units), 2026-09-30 |

## What is wrong

`adapter-census` (`packages/tooling/src/startup/start-adapter-census.ts`, bin `adapter-census`) reports every adapter under `src/adapters/`. Phase 2 left no `src/adapters/` folder in any package. Run from the repo root on master, it prints `No adapters found under src/adapters/.`

Checked on master after 788165421 and a build: `discover` for `packages/*/src/adapters/*` returns nothing.

## What should happen

**Decided by the user, 2026-09-30: delete the tool.** Remove `start-adapter-census.ts`, `AdapterCensusFlow` and everything only it reaches, the `adapter-census` bin entry in `packages/tooling/package.json` and its `bin/` file, and their tests and proxies. Check with `discover` that nothing else imports what you remove, and that no doc or prompt still tells anyone to run it.

## Where to look

`packages/tooling/src/startup/start-adapter-census.ts` (header at line 3), its flow, the bin entry and their tests.

## History

Found by the post-merge connection check. The tool was built under `scrolls/brands-gateways-epic/items/s1-adapter-census-command.md`.
