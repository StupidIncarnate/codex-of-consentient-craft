# DEF-234: dungeonmaster init in a consumer may look for dungeonmaster's packages in the wrong directory

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Priority | P1: if real, `init` fails in every consumer (P0 once confirmed); `npm run check:consumer` decides |
| Package | cli |
| Found | 2026-09, read from code; never run against a real published install |
| Moved from | `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history) item 40, 2026-09-30 |

## What is wrong

`packages/cli/bin/cli-entry.ts:36` sets `dungeonmasterRoot = resolve(__dirname, DIRNAME_TO_ROOT_DEPTH)`, four directories above the running bin. In this repo that is the repo root. In a consumer the bin sits at `node_modules/@dungeonmaster/cli/dist/bin/`, so the root becomes `<consumer>/node_modules` and `packageDiscoverBroker` would look for `node_modules/packages/*/dist/startup/start-install.js`.

Not verified. `npm run check:consumer` (`scripts/consumer-check/`) runs `dungeonmaster init` against a packed install and may already prove this works; read its result before doing anything else. The gateway source copy does not depend on this path: it finds `@dungeonmaster/node` and `@dungeonmaster/browser` by Node resolution.

## What should happen

Confirm by running `npm run build:clean` then `npm run check:consumer` (or a packed scratch install plus `dungeonmaster init`). If discovery finds the packages, delete this file. If not, fix the root resolution.

## Where to look

- `packages/cli/bin/cli-entry.ts`
- `packageDiscoverBroker` in `packages/cli`
- `scripts/consumer-check/`

## History

Original text: `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history), item 40.

2026-10-01: `npm run check:consumer` is the run that confirms or closes this bounty. It installs packed tarballs, so the
bin sits under `node_modules/` as it does for a real consumer. Assayer's successful `init` proves nothing here: assayer
links dungeonmaster through `file:`, so its bin path resolves inside the dungeonmaster checkout.
