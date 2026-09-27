# A18: Raw outside calls that never had an adapter; drop duplicate package deps

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Also" steps 3 and 4 (lines 350-356); `scrolls/adapters-to-one-place.md` "The one job adapters should do happens at the callers" |
| Needs | [A04](a04-adapters-cli.md)–[A17](a17-adapters-web.md) |
| Unblocks | [A19](a19-adapters-folder-type-gone-caller-rules-on.md) |
| Packages touched | every workspace package |
| Checks to run | lint, typecheck, unit |
| Split | operator splits per package, 2 to 4 files per agent |
| Runs alone | no — each agent takes one package, and two agents never take the same package at once |

## Why

Deleting every adapter (A00-A17) only removes the outside calls that went through one. Code outside `adapters/`
also calls outside packages, Node globals and programs directly — it always did, since "only `adapters/` may
import a package" was cheapest to satisfy by writing ANOTHER adapter, not by routing every call through one. The
three caller-facing lint rules (`raw-import-ban`, `platform-globals-ban`, `bin-program-spawn-ban`) find these, but
[A19](a19-adapters-folder-type-gone-caller-rules-on.md) does not turn them on for real until every package is
clean — this item is what makes them clean.

## Current state

Two known cases, both confirmed 2026-09-26 by reading the files directly:

- **`packages/ward/src/brokers/bundle/build/bundle-build-broker.ts`** spawns `npm` by hand. Confirmed:
  `bundleStatics.buildCommand` (`packages/ward/src/statics/bundle/bundle-statics.ts:26`) is the literal string
  `'npm'`, and the broker calls `childProcessSpawnCaptureAdapter({ command: bundleStatics.buildCommand, args:
  [...bundleStatics.buildArgs, String(tempDir)], cwd: packageRoot })`. This is a real `npm run build --outDir
  <path>` invocation that should go through `#gateway/bin/npm`'s `runScript` instead of a raw `child_process` spawn
  with the command name `'npm'` as a plain string.
- **`packages/web/src/widgets/chat-input/chat-input-widget.tsx`** calls `localStorage.setItem`/`removeItem` in
  three places (`markDraftDispatched`, `clearDraftDispatchedStamp`, `writeTextDraft`). **The source doc's own claim
  here is FALSE and this item corrects it:** it says these calls have "no `try/catch`", but every one of them is
  already wrapped — confirmed by reading the file, lines 146-182: each call sits inside a `try { … } catch {
  // localStorage unavailable }` block. The real problem is different from what the doc claims: **the `catch`
  block is silent** — it swallows a full storage-quota failure with only a comment, which is exactly the shape
  `ban-silent-catch` exists to refuse. The fix GW proposes is still right for a different reason than the one it
  gives: move these calls onto `#gateway/browser/localStorage`'s `writeItem`, which returns the failure as a value
  instead of throwing, so the caller can react to it (or deliberately ignore it) without an empty `catch` block.

Beyond these two, this item is a fresh scan per package — the two above are a STARTING point, not the whole list.

## Work

1. For each workspace package, turn on `raw-import-ban`, `platform-globals-ban` and `bin-program-spawn-ban`
   LOCALLY (uncommitted, not merged) and lint that one package — read
   `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts` for where the three
   rules are commented out today, and comment them back IN for this scan only. Do not commit this toggle; it is a
   discovery tool for this item, and [A19](a19-adapters-folder-type-gone-caller-rules-on.md) is what turns them on
   for real once every package is clean.
2. For every violation the scan finds: move the raw call onto the matching `#gateway/<kind>/<subpath>` export, the
   same way every adapter migration in A04-A17 did. This is not adapter work — there is no adapter file to delete,
   only a raw import or a raw global use to replace.
3. Fix `bundle-build-broker.ts`: replace the raw `npm` spawn with `#gateway/bin/npm`'s `runScript`, passing the
   same script name and args `bundleStatics` already computes.
4. Fix `chat-input-widget.tsx`: replace the three raw `localStorage` calls with `#gateway/browser/localStorage`'s
   `writeItem`/`removeItem` (or whatever the gateway names them), checking the returned result instead of
   swallowing an exception. Read the gateway's real function names and signatures before writing the caller.
5. Revert the local rule-toggle from step 1 once your package's scan is clean (do not leave the rules on for other
   packages to trip over before their own turn).
6. Once a package imports an outside package ONLY through the gateway (no adapter left, no raw import left), delete
   that package's own `package.json` entry for it — the version now lives in the gateway package alone.
7. Update every affected caller's `.proxy.ts` to compose the gateway wrapper's own `.proxy` file directly, imported
   per file, never through a barrel, per T1/T3.
8. Prove your tests bite: after each file's tests pass, break the new code on purpose and confirm a test goes red;
   report which mutation each test caught.

## Done when

- A repo-wide scan with `raw-import-ban`, `platform-globals-ban` and `bin-program-spawn-ban` turned on finds zero
  violations, in every package.
- `bundle-build-broker.ts` calls `#gateway/bin/npm`'s `runScript`, not a raw `child_process` spawn naming `'npm'`.
- `chat-input-widget.tsx`'s three `localStorage` calls go through `#gateway/browser/localStorage`, with no silent
  `catch`.
- Every package's `package.json` `dependencies`/`devDependencies` lists only the gateway packages and the outside
  packages it still needs directly (a `peerDependencies` case, or a package the gateway itself does not cover) —
  no duplicate entry for something now reached only through `#gateway/npm/*`, `#gateway/node/*`,
  `#gateway/browser/*` or `#gateway/bin/*`.
- `npm run ward -- --only lint,typecheck,unit -- <every file touched, package by package>` exits 0.

## Traps

- **Do not turn the three rules on globally and leave them on** — that is
  [A19](a19-adapters-folder-type-gone-caller-rules-on.md)'s job, done once, after every package (including this
  item's own work) is clean. Turning them on here and leaving them on breaks every OTHER in-flight A0x agent's lint
  run.
- Before touching `platform-globals-ban`'s siegelense carve-out (a global referenced inside a `page.evaluate`
  string, which runs in the driven browser, not this process): that carve-out does not exist yet — it is
  [A19](a19-adapters-folder-type-gone-caller-rules-on.md)'s job to build. If your local toggle in siegelense flags
  a `page.evaluate` string's own global references, that is an expected false positive for now — do not "fix" the
  string, and do not build the carve-out yourself; report it and move on.
- `ban-silent-catch` may ALSO flag `chat-input-widget.tsx`'s existing empty `catch` blocks once it runs over
  `widgets/` — if it already does, this item's fix removes both problems (the raw global AND the silent swallow)
  in one pass; if it does not yet apply there, note that as a finding rather than assuming this item's fix alone
  satisfies every rule that could apply.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
