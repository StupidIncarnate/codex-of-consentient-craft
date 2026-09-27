# G11: Per-package unit tests for the gateway layout checks that ESLint globs can't reach

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 31, lines 744-756; EPIC.md's own instruction to also assert every workspace package's `imports` field against G01's list |
| Needs | [G01](g01-gateway-folder-names-one-list.md) |
| Unblocks | nothing named in EPIC.md's table |
| Packages touched | `@gateway/npm`, `@gateway/node`, `@gateway/browser`, `@gateway/bin`, plus a test asserting every OTHER workspace package's `imports` field |
| Checks to run | `unit` |
| Split | recommended: one agent per gateway package (npm, node, browser, bin), 2 to 4 files each, plus one agent for the cross-workspace `imports` test |
| Runs alone | no |

## Why

`gateway-layout`, the existing ESLint rule, checks only that two sibling folders never differ just by
case (e.g. `Fs/` and `fs/` both existing would be a bug ESLint's file-system glob CAN catch, because it
only needs file paths). Three more checks the source doc names need a REAL unit test inside each gateway
package instead, because they need to read PACKAGE DATA or JSON that ESLint's globs never reach at all:

1. Every folder under the npm gateway names a real npm package listed in that package's own
   `dependencies` or `peerDependencies`.
2. Every folder under the node and browser gateways names a real builtin module or global of that
   platform.
3. Each gateway `package.json` has EXACTLY the three `exports` keys the standard names — `./*.proxy`,
   `./*.stub`, `./*` — and no `./_test_/*` key and no root `.` entry.

None of these can be an ESLint rule, because ESLint operates on individual source files matched by glob
patterns; it has no natural way to read a WHOLE package's `package.json` and cross-check it against the
list of folders that package holds, or to consult a maintained list of "every real Node builtin module".

## Current state

Checked 2026-09-26 against the code:

- The `gateway-layout` rule lives at
  `packages/eslint-plugin/src/brokers/rule/gateway-layout/rule-gateway-layout-broker.ts` (confirmed by
  `discover`; not read in full in this pass — the executing agent reads it to confirm it really is scoped
  to the case-only check the source doc describes, and does not already do more than that).
- `nodeBuiltinStatics`, which the source doc says "already covers Node's modules" for check 2, was not
  independently located in this pass — the executing agent locates it with `discover` before writing
  check 2's Node half, rather than hand-building a builtin-module list from scratch.
- No unit test doing any of these three checks was found in this pass under any of the four gateway
  packages (`packages/@gateway/{npm,node,browser,bin}`) — searched for a test file whose name suggests a
  package-level layout check and found none; not exhaustively ruled out, since a test doing this could be
  named almost anything. The executing agent confirms with `discover` before assuming this item starts
  from zero in any one package.
- **The `imports`-field cross-check EPIC.md asks this item to add** (checking every workspace package's
  `package.json` `imports` field against G01's one list) has no existing test either, and needs G01
  decided first — specifically, G01's decision on WHERE the one canonical list lives
  (`gatewayLocationsStatics.folders` in `shared`, per G01's own recommendation). This item cannot be
  written until that choice is made, hence the "Needs G01" dependency.

## Work

1. **Check 1 — npm folder names a real dependency.** In `@gateway/npm`, write a unit test that:
   - Reads `packages/@gateway/npm/package.json`'s own `dependencies` and `peerDependencies`.
   - Lists every folder directly under `packages/@gateway/npm/src/`.
   - Turns each folder name back into the real npm package name it should match, using the SAME `__` →
     `/` and scope-drop transform the layout standard uses (`gatewayPathFromImportSourceTransformer` in
     `shared`, or its inverse — check whether an inverse transformer already exists or needs writing
     alongside this test).
   - Asserts every folder's derived package name appears in `dependencies` or `peerDependencies`, and
     (the converse) that every listed dependency has a matching folder — catching BOTH a folder with no
     declared dependency and a declared dependency nothing wraps.
2. **Check 2 — node/browser folder names a real builtin or global.** In `@gateway/node` and
   `@gateway/browser` separately (two tests, since Node's builtin list and the browser's global list are
   maintained separately):
   - For `node`: list every folder under `packages/@gateway/node/src/` and assert each names either a
     real Node builtin module (via `nodeBuiltinStatics`) or a real Node global (e.g. `setTimeout`,
     matched by exact casing per the layout standard's "a global keeps its exact casing" rule).
   - For `browser`: the same, against a MAINTAINED list of real browser globals — since ESLint runs under
     Node and cannot see the browser's own global list at all, this test needs its OWN maintained list
     (find whether one already exists for this purpose before writing a new one; if none exists, this
     test OWNS creating and maintaining it, and should say so plainly in its own file header per this
     repo's comment discipline, so a future new global addition knows where to update the list).
3. **Check 3 — `package.json` `exports` shape.** In all four gateway packages, assert `exports` has
   EXACTLY the three keys `./*.proxy`, `./*.stub` and `./*` (checking the object's own keys, not just that
   these three exist — a FOURTH key, such as a `./_test_/*` entry or an accidental root `.` entry, must
   fail the test) and that no entry's target glob has drifted from the standard form (`./src/*.proxy.ts`
   for `./*.proxy`, `./src/*.stub.ts` for `./*.stub`, `./src/*/*.ts` for the `./*` barrel key — confirm
   against a real package rather than assuming).
4. **The `imports`-field cross-check (EPIC.md's addition to this item).** Once G01 lands, write a test —
   this one can live in a single shared location rather than once per gateway package, since it checks
   EVERY workspace package, not just the four gateway ones — asserting each workspace package's
   `package.json` `imports` field matches G01's one canonical list exactly: same four keys
   (`#gateway/npm/*`, `#gateway/node/*`, `#gateway/browser/*`, `#gateway/bin/*`), same target shape
   (`@dungeonmaster/<kind>/*`), for every package under `packages/*` (not `packages/@gateway/*` itself,
   unless the gateway packages ALSO carry this `imports` field pointing at themselves — confirmed earlier
   in this epic's research that they do: "the `imports` field of every workspace `package.json`, gateway
   packages included"). Decide where this test lives — a natural home is beside
   `gatewayLocationsStatics.folders` itself in `shared` (an integration-style test reading every
   `packages/*/package.json` on disk), or in `cli` beside `gatewayFoldersStatics`. Record the choice under
   DECISIONS if it is not obvious once G01's own choice is known.

## Done when

- [ ] `@gateway/npm` has a passing unit test for check 1 (folder ↔ dependency, both directions).
- [ ] `@gateway/node` and `@gateway/browser` each have a passing unit test for check 2, and the browser
  one either reuses or creates a maintained browser-global list, documented as such.
- [ ] All four gateway packages have a passing unit test for check 3 (exact `exports` shape).
- [ ] One test (wherever Work step 4 decides it lives) asserts every workspace package's `imports` field
  against G01's canonical list.
- [ ] Each new test is proven to actually catch a violation: break the real code or config on purpose (an
  extra `exports` key, a folder with no matching dependency, a stale `imports` entry) and confirm the new
  test goes red, per the standing agent brief's mutation-testing rule.
- [ ] `npm run ward -- --only unit -- packages/@gateway packages/shared packages/cli` (narrowed to
  whichever packages actually changed) exits 0.

## Traps

- Don't write check 1 or check 2 as an ESLint rule — the source doc is explicit that these need a unit
  test BECAUSE ESLint's globs cannot read package-level JSON or consult a maintained non-file list. If a
  design keeps drifting toward "just make this a lint rule", that's a sign the design has wandered off
  this item's actual point.
- The browser-global list is NOT the same as Node's — don't reuse `nodeBuiltinStatics` for the browser
  check, and don't assume ESLint's own environment globals (from an `env: { browser: true }` style config)
  are available to read from inside a Jest unit test; they are an ESLint-internal concept, not a plain
  data list this test can import.
- This item cannot start in earnest on its "imports field" half until G01 has actually decided (and
  landed) where the one list lives — check EPIC.md's status table before assuming G01 is done.

## Concessions made while executing
