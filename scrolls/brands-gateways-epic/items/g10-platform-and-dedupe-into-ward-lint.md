# G10: Ward's `lint` check runs the platform-crossing and duplicate-install checks

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 6 (lines 24-29) and item 30 (lines 702-742) |
| Needs | nothing |
| Unblocks | nothing named in EPIC.md's table |
| Packages touched | `ward` |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent |
| Runs alone | yes — EPIC.md marks this item "any outside `ward`", meaning no other agent may edit `ward` while this runs |

## Why

Two whole-repo checks run only when asked for by name: `npm run ward -- platform` and `npm run ward --
dedupe`. A bare `npm run ward` runs NEITHER, and neither result is saved anywhere `ward list` or `ward
detail` can show it — so a platform crossing (e.g. a `web` file importing `#gateway/node/fs`) or a
duplicate installed copy of an outside package goes unnoticed until someone remembers to run the
subcommand by hand. Both belong inside ward's `lint` check instead, so a bare `npm run ward` — the thing
CLAUDE.md's Verification Standards and EPIC.md's own rule 4 both hold every agent to — actually catches
them.

## Current state

Checked 2026-09-26 against the code. Every piece the source doc names exists exactly where it says:

- `packages/ward/src/brokers/platform-crossing/check/platform-crossing-check-broker.ts` (plus its
  `.test.ts`, `.integration.test.ts`, `.proxy.ts`) — the in-process check function.
- `packages/ward/src/brokers/duplicate-install/check/duplicate-install-check-broker.ts` (plus `.test.ts`,
  `.integration.test.ts`, `.proxy.ts`, and two layer brokers:
  `gateway-dependency-names-read-layer-broker.ts`, `installed-package-version-read-optional-layer-
  broker.ts`) — the in-process check function.
- `packages/ward/src/brokers/command/platform-check/command-platform-check-broker.ts` and
  `packages/ward/src/brokers/command/dedupe-check/command-dedupe-check-broker.ts` — the CLI SUBCOMMAND
  wiring this item deletes.
- `packages/ward/src/responders/ward/platform/ward-platform-responder.ts` and
  `packages/ward/src/responders/ward/dedupe/ward-dedupe-responder.ts` — also deleted, along with their
  own `.test.ts`/`.proxy.ts`.
- `packages/ward/src/flows/ward/ward-flow.ts` wires both subcommands in, confirmed by reading it:
  ```ts
  import { WardPlatformResponder } from '../../responders/ward/platform/ward-platform-responder';
  import { WardDedupeResponder } from '../../responders/ward/dedupe/ward-dedupe-responder';
  ...
  platform: 'platform',
  dedupe: 'dedupe',
  ...
  if (command === COMMANDS.platform) { ... }
  if (command === COMMANDS.dedupe) { ... }
  ...
  process.stderr.write('Available commands: run, list, detail, raw, platform, dedupe\n');
  ```
- `packages/ward/src/brokers/command/run/command-run-broker.ts` is `commandRunBroker`, and
  `packages/ward/src/brokers/command/run/single-package-layer-broker.ts` /
  `multi-package-layer-broker.ts` are the two per-package loops this item's new whole-repo calls must NOT
  be placed inside.
- `packages/ward/src/contracts/ward-result/ward-result-contract.ts` is `WardResult`, the contract this
  item's new entries need to fold into.
- Also present, and directly relevant to what this item's checks actually walk:
  `packages/ward/src/transformers/platform-crossing-report/`,
  `packages/ward/src/transformers/dedupe-platform-crossing-violations/`,
  `packages/ward/src/transformers/platform-crossing-violation-display/`, and the contracts
  `platform-crossing-violation`, `platform-crossing-chain-hop`, `platform-crossing-walk-memo-key`,
  `platform-crossing-resolve-cache-key`, `platform-crossing-display-text`, `platform`. None of these are
  deleted by this item — only the SUBCOMMAND layer (`command-platform-check-broker`,
  `command-dedupe-check-broker`, both responders, and `ward-flow`'s wiring to them) goes away; the
  in-process check brokers stay and get called from a new place.
- G06 (this epic's item, not the source doc's numbering) fixes a bug in
  `parseImplementationImportsTransformer` that the platform-crossing check currently works around via
  `Parameters<typeof broker>[0]['field']` instead of a plain type import. That workaround may become
  removable once G06 lands — G06 has no "Needs" on this item and no ordering is enforced between them in
  EPIC.md, so check whether G06 has already landed when this item executes; if so, the workaround can be
  simplified as a bonus (not required for this item's own Done-when).

Not checked in this pass: `checkTypeContract`, `allCheckTypesStatics`, `isCheckTypeGuard`, and the
`--only` parser's exact source locations — the source doc says these do NOT change (platform/dedupe get
no check type of their own; they become part of `lint`), so this item's own work does not touch them, and
the executing agent only needs to confirm that claim holds once the new calls are wired in (a `--only
lint` run should trigger them; a `--only unit` run should not).

## Work

1. **Call both checks in-process, once per ward run, when `lint` is selected** — inside
   `commandRunBroker`, not inside `singlePackageLayerBroker`'s or `multiPackageLayerBroker`'s per-package
   loop, since both checks need the WHOLE repo in one pass regardless of how many packages are in scope.
2. Call `platformCrossingCheckBroker` and `duplicateInstallCheckBroker` directly (they already exist and
   already do the check — this item does not rewrite their logic). Turn each violation into one
   `ErrorEntry`, with `filePath` holding the violating file and `message` holding the existing display
   transformer's text (`platform-crossing-violation-display-transformer.ts` for platform crossings; find
   or write the equivalent for duplicate-install violations if one does not already exist under a
   similarly-named transformer). Put the entries into ONE `lint` `ProjectResult` scoped to the repo root.
3. **Fold that result into `WardResult`**, so `storage-save`, `storage-load`, `ward list` and `ward
   detail` all carry it the same way they carry every other `lint` finding.
4. **Decide what a file list, `--committed` and `--uncommitted` mean for these two checks.** ESLint
   narrows to the files it's given; these two checks always walk the whole repo regardless of scope.
   **Recommended decision:** both checks run on every `lint` run whose scope is the WHOLE repo (a bare
   `npm run ward`, or `--only lint` with no file list after `--`), and on a SCOPED run (a file list after
   `--`) only when that scope includes a `package.json` or a file under `packages/@gateway/` — but even
   when triggered, the check itself still walks the WHOLE repo either way; only the DECISION to run it at
   all is scoped, never the check's own reach. This is **Recommended — the executing agent may change it
   with a reason in DECISIONS** if, once wired in, this scoping proves impractical (e.g. if
   `commandRunBroker` cannot easily tell "is this file list a `package.json` or gateway file" from where
   these two checks are called).
5. **Delete the `platform` and `dedupe` subcommands**: `command-platform-check-broker.ts` and
   `command-dedupe-check-broker.ts` (with their own `.test.ts`/`.proxy.ts`), `WardPlatformResponder` and
   `WardDedupeResponder` (with their own `.test.ts`/`.proxy.ts`), their entries in `ward-flow.ts`
   (including the `Available commands:` help string), and the `ward-flow.integration.test.ts` cases that
   call either subcommand.

## Still open inside the platform check (record, do not necessarily fix here)

Three gaps the gateway build already found in the platform-crossing check's own walk. This item's Done-
when does NOT require closing these — they are pre-existing limits, not something this item's own change
introduces — but the report should confirm each is still true after this item's changes, since folding the
check into `lint` is exactly the kind of change that could accidentally paper over one of them (e.g. by
changing what gets walked when the scope decision in Work step 4 narrows things):

1. **A package on one platform importing an npm package that only works on the other platform** — such as
   `web` importing `#gateway/npm/playwright__test` — is NOT detected. The npm gateway is not split by
   platform, so the walk treats it as an outside leaf regardless of which platform actually uses it.
2. **The Node-reaching-browser direction has no fixture of its own.** It shares its code path with the
   tested direction (browser-reaching-Node) but nothing exercises it specifically. A fourth fixture
   scenario belongs in `platform-crossing-check-broker.integration.test.ts`: a `cli-tool` or
   `http-backend` package reaching `#gateway/browser/fetch`.
3. **`barrelProvidesNameTransformer` looks only one level into an `export *`.** A barrel that re-exports
   ANOTHER barrel stops narrowing after the first hop and falls back to following everything. No gateway
   or root barrel chains barrels today, so this only matters if one ever does — flag it, don't chase it.

Also worth one line in the report, not a fix: a direct platform crossing (e.g. a `web` file DIRECTLY
importing `#gateway/node/fs`) also suits a real ESLint rule, which would surface the error live in an
editor. The ward check stays needed for the INDIRECT case — a crossing several imports deep — because
ESLint's per-file cache means an edit three imports down only re-lints the edited file, never the `web`
file that now transitively crosses a platform boundary.

## Done when

- [ ] A bare `npm run ward` (and `--only lint` with no files) runs both the platform-crossing and
  duplicate-install checks, and a real violation (staged in a test) shows up in the `lint` check's result.
- [ ] The result is saved through the normal `WardResult`/storage path — `ward list` and `ward detail` can
  show a platform or dedupe violation the same way they show any other `lint` finding.
- [ ] `checkTypeContract`, `allCheckTypesStatics`, `isCheckTypeGuard` and the `--only` parser are
  UNCHANGED — confirmed by the report, not just assumed.
- [ ] The file-list/`--committed`/`--uncommitted` scoping decision from Work step 4 is implemented (or
  DECISIONS records a different one, with why).
- [ ] `command-platform-check-broker.ts`, `command-dedupe-check-broker.ts`, `WardPlatformResponder`,
  `WardDedupeResponder`, their tests and proxies, and `ward-flow`'s wiring to all four (including the help
  string) are all deleted.
- [ ] The three "still open" gaps above are each re-confirmed still true (or newly false, if this item's
  change accidentally fixed one — say so) in the report.
- [ ] `npm run ward -- -- packages/ward` (`lint,typecheck,unit,integration`) exits 0, AND a full bare
  `npm run ward` (the operator's regression pass) still exits 0 once this item's own scoped run is green.

## Traps

- Don't put either check inside `singlePackageLayerBroker` or `multiPackageLayerBroker` — both loop
  PER PACKAGE, and both checks need to see the whole repo in ONE pass to detect a crossing or a duplicate
  that spans packages.
- Deleting the subcommands removes `ward-flow`'s CLI ENTRY POINTS for `platform`/`dedupe`, but the
  underlying check brokers (`platformCrossingCheckBroker`, `duplicateInstallCheckBroker`) and every
  transformer/contract feeding them stay — don't delete those by mistake while cleaning up the command
  layer.
- The "still open" gaps are explicitly NOT this item's job to fix — recording them accurately in the
  report is the job; closing them would be scope creep unless doing so is trivially part of the same
  change.

## Concessions made while executing
