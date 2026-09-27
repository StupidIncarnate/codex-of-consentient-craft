# G01: One list of gateway folder names is the source of truth

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 5, lines 10-22 |
| Needs | nothing |
| Unblocks | [G11](g11-gateway-layout-package-tests.md) |
| Packages touched | `shared`, `cli` |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

## Why

The four gateway folder names — `npm`, `node`, `browser`, `bin` — are written out separately in three
places, and nothing checks that the copies agree:

- the `imports` field of every workspace `package.json`, gateway packages included (each one hand-types
  the same four-line map)
- `gatewayLocationsStatics` in `shared`, twice: once in `folders` and again in `packageGlobs`
- `gatewayFoldersStatics` in `cli`, which `init` scaffolds a consumer's gateway packages from, and the
  node/browser split in `gatewaySourceCopyStatics` beside it, which decides which two of the four gateway
  packages `init` copies dungeonmaster's own source into

Adding a fifth folder, or renaming one, means finding every copy by hand. Nothing fails loudly when one
copy is missed — a stale copy just silently omits or misnames a folder.

## Current state

Checked 2026-09-26 against the code:

- `packages/shared/src/statics/gateway-locations/gateway-locations-statics.ts` holds:
  ```ts
  export const gatewayLocationsStatics = {
    folders: { npm: 'npm', node: 'node', browser: 'browser', bin: 'bin' },
    importPrefix: '#gateway',
    packageGlobs: [
      'packages/@gateway/npm/src/**',
      'packages/@gateway/node/src/**',
      'packages/@gateway/browser/src/**',
      'packages/@gateway/bin/src/**',
    ],
  } as const;
  ```
  `folders` and `packageGlobs` both spell out the same four names independently — `packageGlobs` is not
  derived from `folders`. (A `testSubpath: '_test_'` field sat here too on 2026-09-26; G26 deletes it along
  with every `_test_` barrel, so it is not part of the shape this item derives.)
- `packages/cli/src/statics/gateway-folders/gateway-folders-statics.ts` holds a THIRD independent copy:
  ```ts
  export const gatewayFoldersStatics = {
    folders: ['npm', 'node', 'browser', 'bin'] as const,
    descriptions: { npm: '...', node: '...', browser: '...', bin: '...' },
  } as const;
  ```
- `packages/cli/src/statics/gateway-source-copy/gateway-source-copy-statics.ts` holds a fourth shape, but
  a deliberately NARROWER one — only two of the four names, because only `node` and `browser` wrap
  platform-universal things that fit any consumer; `npm` and `bin` depend on the consumer's own
  dependencies and installed programs, so `init` leaves them empty:
  ```ts
  export const gatewaySourceCopyStatics = {
    sources: {
      node: { specifier: '@dungeonmaster/node/fs', directories: ['src'] },
      browser: { specifier: '@dungeonmaster/browser/fetch', directories: ['src', '__mocks__'] },
    },
    browserDevDependencies: { 'jest-environment-jsdom': '^30.0.0', undici: '^7.21.0' },
  } as const;
  ```
- `packages/shared/package.json`'s `imports` field is a fifth hand-typed copy:
  ```json
  "imports": {
    "#gateway/npm/*": "@dungeonmaster/npm/*",
    "#gateway/node/*": "@dungeonmaster/node/*",
    "#gateway/browser/*": "@dungeonmaster/browser/*",
    "#gateway/bin/*": "@dungeonmaster/bin/*"
  }
  ```
  Every other workspace package's `package.json` carries the same four-line block. Not individually
  re-checked here — G11 (which needs this item) is what asserts every workspace package's `imports`
  field against this item's list, per EPIC.md's own instruction for this item.

## Work

1. **Decide the one source of truth.** Recommended: `gatewayLocationsStatics.folders` in
   `@dungeonmaster/shared`, because `shared` is the package every other workspace package already
   depends on (including `cli`), and `gatewayLocationsStatics` already exists to answer "what are the
   gateway's parts" for `gatewayPathFromImportSourceTransformer` and other callers. This is
   **Recommended — the executing agent may change it with a reason in DECISIONS.**
2. **Derive `packageGlobs` from `folders`,** in the same file, instead of hand-typing it a second time:
   `Object.values(folders).map((folder) => \`packages/@gateway/${folder}/src/**\`)` (or the repo's
   preferred transformer form — check `get-architecture` for whether a computed statics value needs to
   move to a transformer instead of living inline in the statics file).
3. **Derive `gatewayFoldersStatics.folders` in `cli`** from `gatewayLocationsStatics.folders` (import
   `@dungeonmaster/shared/statics`), keeping only what `cli` adds on top: the `descriptions` map, which
   has no home anywhere else.
4. **Derive `gatewaySourceCopyStatics.sources`'s two keys** from the same list too — `node` and
   `browser` should read as `[gatewayLocationsStatics.folders.node]` and
   `[gatewayLocationsStatics.folders.browser]` rather than as separately hand-typed object keys, even
   though the VALUE (specifier, directories) stays hand-written per entry. This keeps the "which two
   copy" decision expressed as a filter over the one list, not a second independent list that could grow
   the two extra names by accident.
5. **The `package.json` `imports` field cannot import a statics file** — JSON has no code, so this copy
   cannot literally read `gatewayLocationsStatics`. Two things follow from that, split across two items:
   - **This item (G01):** for every workspace package that ALREADY has an `imports` field (every package
     in this repo today), nothing here rewrites those five-or-so files by hand; the check that they
     still agree with the one list is a test, not a lint rule that reads JSON directly — and that test
     is **G11's job**, not this item's. Say so explicitly in this item's own report so nobody duplicates
     it.
   - **`init`, for a brand-new consumer package:** `dungeonmaster init` (via `create-package` and the
     gateway install responders in `cli`) writes each new workspace package's `imports` field FROM this
     item's one list, so a consumer's copy is generated correctly the first time rather than hand-typed
     against a doc. Confirm (or wire, if it does not already) that whichever `cli` transformer builds a
     scaffolded package's `imports` block reads `gatewayLocationsStatics.folders` rather than a literal
     four-line object.
6. **Typecheck and test** after the derivation change: `gateway-locations-statics.test.ts` and
   `gateway-folders-statics.test.ts` already exist and assert today's literal values — update them to
   assert the DERIVED value still equals the same four names, so a future edit to the one list is what
   the test catches, not a hand-edit to a copy.

## Done when

- [ ] `gatewayLocationsStatics.packageGlobs` (or wherever the group of derived arrays live) is computed
  from `gatewayLocationsStatics.folders`, not hand-typed a second time.
- [ ] `gatewayFoldersStatics.folders` in `cli` reads from `gatewayLocationsStatics.folders`.
- [ ] `gatewaySourceCopyStatics.sources`'s two keys are derived from the same list, keeping only the
  per-entry `specifier`/`directories` data hand-written.
- [ ] The `cli` transformer that scaffolds a new workspace package's `imports` field reads the same list,
  confirmed by reading that transformer's source (name it in the report).
- [ ] `npm run ward -- -- <files touched>` (`lint,typecheck,unit`) exits 0.
- [ ] The report names which package (G11) is responsible for checking the FIVE-PLUS existing
  `package.json` `imports` fields against this list, so that check is not silently skipped.

## Traps

- Don't try to make the `package.json` `imports` field itself read a statics file — JSON cannot import
  code. The check has to be a test that reads both sides and compares them (G11), not a shared constant
  JSON can reference directly.
- `gatewaySourceCopyStatics` deliberately holds only 2 of the 4 names. Don't "fix" it into holding all 4
  — `npm` and `bin` start empty in a consumer on purpose (design goal 3: everything works in a consumer
  repo `dungeonmaster init` touched, and a consumer's own npm packages and installed programs are never
  dungeonmaster's to copy in).

## Concessions made while executing
