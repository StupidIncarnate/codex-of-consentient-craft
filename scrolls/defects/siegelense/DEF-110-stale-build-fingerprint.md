# DEF-110: `start` does not fingerprint the source, refuse a rebuild under a live lane, or serve a frozen build

| | |
|---|---|
| Status | ready |
| Package | siegelense |
| Found | 2026-09-28, walkthrough case SL-044 follow-up |
| Moved from | `scrolls/walkthrough/LEDGER.md`, 2026-09-30 |

## What is wrong

A `stack` lane serves the web from built output (`vite preview --outDir packages/web/dist`) while its API runs live source (`tsx --conditions=source`). `packages/web/dist` was built at 01:11 on 2026-09-28, so every web change merged since was missing from every lane, and nothing warned. Dev assets are ruled out because concurrent lanes serve results to sub-agents. Vite empties `dist` on each build (`emptyOutDir` default), so a rebuild under a live lane blanks it mid-run. Consumer repos' web setups vary, so nothing may assume `packages/web` or a folder layout.

Done: a warning. `start` prints `STALE BUILD:` and `REBUILD:` on stderr when a served, git-ignored folder is older than the files changed since its build commit (`served-build-stale-render-transformer.ts`, `served-build-stale-read-broker.ts`). It never builds. Checked 2026-09-30: no `buildOutDir`, `source.patch` or fingerprint code exists in `packages/`.

## What should happen

The user's agreed design:

1. Fingerprint the source with git: `git rev-parse HEAD` plus a hash of the uncommitted diff. Keep the last-built fingerprint per checkout in siegelense state. On `start`, if it differs, run the lane spec's own `buildCommand` (from `.dungeonmaster.json`) under the boot lock, then boot.
2. Never rebuild under a live lane in the same checkout: refuse, naming the live instance and the commit it serves (for example "kill it or use a worktree"). Items 1 and 2 must land together.
3. Record the commit, an uncommitted-changes flag and the fingerprint in the `start` manifest and the instance evidence, and save the uncommitted diff as `source.patch` in the evidence dir, so a bug looker can check out the commit and apply the patch.
4. Optional lane-spec field `buildOutDir`: when set, copy the build output into a frozen snapshot per fingerprint and serve that, so lanes in one checkout can serve different source states. `cleanup` and `prune` drop snapshots no live instance uses. This repo's specs set it.

## Where to look

- `packages/siegelense/src/brokers/served-build/stale-read/served-build-stale-read-broker.ts:17`
- `packages/siegelense/src/transformers/served-build-stale-render/served-build-stale-render-transformer.ts`
- the config contract for `.dungeonmaster.json` lane specs (`dungeonmaster-config-contract`; locate it with `discover`), `instance-start-broker.ts`, `instance-manifest-contract.ts`, and the boot lock brokers under `brokers/boot-lock/`.

## History

Warning piece `9d9271861`, merge `76cf9af8c`, ward run `1790724232440-1c5b`.
