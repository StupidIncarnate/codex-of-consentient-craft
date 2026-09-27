# G14: Lint rules that keep gateway barrels honest

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, "Lint rules that keep the layout honest" (192-211), "What a barrel holds" (156-169), and the standards tables (143-179) |
| Needs | [G05](g05-error-classes-in-error-files.md) (moves the error classes into `.error.ts` files this item's rules must accept); [G26](g26-per-file-proxy-and-stub-imports.md) (deletes the `_test_` barrel, so this item's barrel-honesty rules cover only the production barrel) |
| Unblocks | nothing directly, but B03 (package `exports` and per-file stub/proxy imports for every workspace package) extends these same rules repo-wide later |
| Packages touched | `eslint-plugin`, `@gateway/node` (one barrel fix) |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

## Why

Every gateway barrel — the subpath file (`fs.ts`) — is written by hand today, and nothing checks that it
is complete, that it only contains what a barrel is allowed to contain, or that it never re-exports a
`.proxy.ts`/`.stub.ts` file that G26 says stays in its own file. A barrel that is missing a re-export, or
that re-exports something that no longer exists, or that reaches into another subpath's folder, fails
silently: the caller gets a confusing "not exported" error far from the real mistake, or worse, a barrel
quietly re-exports a file it should not, moving that export's real "home" to the wrong place.

## Current state

Checked 2026-09-26 against the code:

- `packages/eslint-plugin/src/brokers/rule/gateway-colocation/rule-gateway-colocation-broker.ts`
  already exists and already checks two things, gateway files only (matched by
  `isGatewayFileGuard`):
  1. A non-barrel wrapper file needs a colocated `.test.ts` (or `.integration.test.ts`) and a
     `.proxy.ts` — unless it declares only types (an `import`-only or type-only file body), which is
     exempt from both.
  2. A barrel file (matched by `isGatewayBarrelFileGuard`) may hold ONLY a form from
     `gatewayPureReexportStatementTypesStatics.types` (`ExportAllDeclaration`, `TSExportAssignment`,
     `TSImportEqualsDeclaration`), a named re-export with a `source` (`export { a } from './a/a'`), a
     type-only export, or a global capture (`export const { x } = globalThis;` or
     `export const x = globalThis.x;`). Anything else is reported as `passThroughNotPureReexport`.
  This rule does NOT yet check: whether the barrel's re-exports match what is actually in the
  wrapper folders beside it (completeness in either direction), whether a barrel reaches into
  another subpath's folder, or whether a barrel re-exports a `.proxy.ts` or `.stub.ts` file. Those
  are new checks this item adds.
- `packages/eslint-plugin/src/statics/gateway-pure-reexport-statement-types/gateway-pure-reexport-statement-types-statics.ts`
  is the shared list `gateway-colocation`'s purity check reads. It is a plain `as const` array, kept as
  a static so a future form (e.g. an `.error.ts` re-export, which is already just a named re-export with
  a `source` and needs no new AST-level statement type) does not need a second copy of the list.
- One barrel breaks the "own home" rule today, exactly as the source doc says: `node/src/fs__promises/fs__promises.ts`
  re-exports `isFsError` and `FsError`, which live in `node/src/fs/is-fs-error/`, not in `fs__promises`'s
  own folder:

  ```typescript
  export { isFsError } from '../fs/is-fs-error/is-fs-error';
  export type { FsError } from '../fs/is-fs-error/fs-error';
  ```

  Checked 2026-09-26: **no caller outside `packages/@gateway/node/src/fs__promises/` imports either
  name from `#gateway/node/fs__promises`.** Every real wrapper inside `fs__promises` that uses
  `isFsError` (`read-file-if-exists.ts`, `path-exists.ts`, `stat-if-exists.ts`,
  `read-json-file-if-exists.ts`, `readdir-if-exists.ts`, `unlink-if-exists.ts`,
  `readlink-if-link.ts`, `write-file-atomic.ts`) imports it by relative path, `'../../fs/is-fs-error/is-fs-error'`,
  not through the barrel. Only `fs__promises.ts` itself (the barrel) and its own
  `fs__promises.test.ts` (which does `import * as barrel from './fs__promises'` and reads
  `barrel.isFsError` at line 55) touch the re-export. So the fix is small: delete the two re-export
  lines from `fs__promises.ts`, and fix `fs__promises.test.ts`'s `isFsError` import to come from
  `../fs/is-fs-error/is-fs-error` directly (or drop that one assertion if the barrel test only exists
  to prove the barrel's own re-export list, which this deletes).
- `node/src/fs/fs.ts` (the real home) already re-exports both correctly:
  `export { isFsError } from './is-fs-error/is-fs-error';` and
  `export type { FsError } from './is-fs-error/fs-error';`.
- The four gateway packages' subpath and wrapper conventions, as built, are the tables below — copied
  from the source doc so this item does not need it open:

  **Subpath folders**

  | Standard | As built |
  |---|---|
  | One folder per subpath, directly under `src/` | `node/src/fs__promises/` is `#gateway/node/fs__promises` |
  | A folder is named after the real import path | `/` becomes `__`, a scope drops its `@`, and `.js` is dropped: `@modelcontextprotocol/sdk/server/stdio.js` becomes `modelcontextprotocol__sdk__server__stdio` |
  | A global keeps its exact casing | `browser/src/URL/`, `browser/src/ResizeObserver/`, `node/src/setTimeout/` |
  | A `bin` folder is named after its program | `bin/src/git/`, `bin/src/lsof/` |
  | The barrel is named after its folder | `node/src/fs/fs.ts` |
  | Every subpath has a barrel test | `<subpath>.test.ts`, or `<subpath>.integration.test.ts` where the real module must load: `playwright__test`, `testing-library__jest-dom`, `testing-library__user-event`, `vitejs__plugin-react` |
  | A pass-through's test compares export keys | the barrel's keys against `require('<real module>')`'s, as in `npm/src/zod/zod.test.ts` |
  | A subpath with wrappers ships each wrapper's proxy and stub as its own file | `<wrapper>.proxy.ts`, `<wrapper>.stub.ts`, imported per file: `#gateway/<kind>/<subpath>/<wrapper>/<wrapper>.proxy`. G26 deletes the `_test_` test barrel this table named before; a subpath with no wrappers has no proxy or stub files. |

  **What a barrel holds** (a barrel only re-exports; one of these forms):

  | Form | When | Example |
  |---|---|---|
  | `export * from '<real module>'` | the real module passes through unchanged | `npm/src/zod/zod.ts`, which adds `export { default } from 'zod'` |
  | `export *` plus one named re-export per wrapper | our wrappers sit beside the raw module | `node/src/fs/fs.ts`, `npm/src/glob/glob.ts` |
  | Named re-exports of wrappers only | nothing raw is offered | every `bin` barrel, `node/src/process/process.ts`, `browser/src/localStorage/localStorage.ts` |
  | A named list from the real module | the module's types are `export =`, which `export *` rejects (`TS2498`) | `npm/src/fast-xml-parser/fast-xml-parser.ts`, `node/src/module/module.ts` |
  | `import mod = require('<module>'); export = mod;` | the same cause, when the whole module passes through | `node/src/path/path.ts`, `node/src/events/events.ts` |
  | A global capture, `export const { x } = globalThis;` | a global has no module to re-export | `browser/src/document/document.ts`, `node/src/setTimeout/setTimeout.ts` |
  | `export type * from '<real module>'` | the subpath holds only types | `npm/src/hono__utils__http-status/hono__utils__http-status.ts` |
  | A bare `import '<real module>';` | the module only registers side effects | `npm/src/testing-library__jest-dom/testing-library__jest-dom.ts` |

  **Wrapper folders**

  | Standard | As built |
  |---|---|
  | One folder per wrapper, one level under the subpath, nothing deeper | `node/src/fs/read-file-sync/` |
  | The folder is the kebab-case name of the function it exports | `read-file-sync/` exports `readFileSync` |
  | It holds `<wrapper>.ts`, `<wrapper>.test.ts` and `<wrapper>.proxy.ts` | `gateway-colocation` requires the test and the proxy |
  | It may also hold the wrapper's type-only files and stubs | `node/src/fs/is-fs-error/fs-error.ts` and `fs-error.stub.ts`, `node/src/fs/walk-files-sync/walked-file.ts` |
  | An error class sits in a folder of its own today | G05 moves it into an `.error.ts` file beside the wrapper that throws it |

## Work

Build these checks. Decide, per check, whether it needs a new rule broker or fits inside
`rule-gateway-colocation-broker.ts`'s existing `create()` — a check that needs to read OTHER files in
the subpath folder (completeness, in either direction) is naturally a second visitor inside the same
rule, since it is cheapest to compute once per barrel file visited; a check that is really about
naming (single-home) can live there too. Call `get-architecture` and `get-folder-detail({ folderType:
"eslint-plugin's rule brokers" })` — actually there is no such folder type; read
`packages/eslint-plugin/CLAUDE.md` and `packages/eslint-plugin/src/brokers/rule/CLAUDE.md` first (both
already loaded into your context by the session snippets) for this package's own rule-broker
conventions (RuleTester tests, not Jest `describe`/`it`, for the parent rule; `Tsestree` contract, never
an ad-hoc AST interface).

1. **Barrel completeness, both directions.** A barrel must re-export every function, schema or
   `.error.ts`-exported class from every wrapper folder beside it (a function/schema/class file with no
   matching barrel re-export is an error), and must not re-export a name that does not exist in any
   wrapper folder beside it (a stale re-export, e.g. after a wrapper is deleted, is an error). This
   needs the file system: read the subpath's sibling folders, collect what each wrapper file (matched
   the same way `gateway-colocation` already finds a non-barrel file: single-dot `.ts`, not a barrel)
   exports by name, and diff against the barrel's re-export list.
2. **One home per export — no barrel reaches into another subpath's folder.** A barrel's named
   re-exports (`export { x } from './y/y'` or `export { x } from '../y/y'`) must resolve to a path
   inside the barrel's OWN subpath directory. A relative import that climbs past the subpath's own
   folder (`../` reaching a sibling subpath) is refused. This is what the `fs__promises` /
   `is-fs-error` case in "Current state" violates today — fix that barrel (delete the two re-export
   lines, per "Current state" above) BEFORE turning this check on, or it fails on file one.
3. **A production barrel (`<subpath>.ts`) never re-exports a `.proxy.ts` or `.stub.ts` file.** Under G26
   there is no separate `_test_` barrel collecting proxies and stubs to check for completeness — each is
   imported from its own file — so the only check left here is negative: refuse a production barrel that
   re-exports a name from a `.proxy.ts` or `.stub.ts` file. **Do not require a stub to exist.** "Every
   subpath ships at least one stub" is a separate rule this item does NOT build — G16 builds the check (as
   a new mode on `gateway-colocation`) and G18 is the item that switches it on, once every subpath actually
   has one. Building it here, before G18 lands, would fail on every subpath in the repo.
4. **`.error.ts` files are a barrel-completeness input, not a colocation exemption.** G05 moves each
   error class in the table below into a `<name>.error.ts` file, and the barrel must re-export it (this
   item's #1 rule covers it once G05 lands — no separate rule needed, just make sure the completeness
   check in #1 treats a `.error.ts` file's one exported class the same way it treats a wrapper's one
   exported function). Confirm G05 has actually landed (the error folders below no longer exist,
   replaced by `.error.ts` files) before writing #1's logic against `.error.ts` files; if G05 has not
   landed yet, build #1 against the wrapper-function case only and extend it once G05's shape exists,
   noting the gap under LEFT STANDING.
5. **`fs__promises`' single-home violation.** Before turning rule #2 on, delete
   `export { isFsError } from '../fs/is-fs-error/is-fs-error';` and
   `export type { FsError } from '../fs/is-fs-error/fs-error';` from
   `packages/@gateway/node/src/fs__promises/fs__promises.ts`, and fix
   `packages/@gateway/node/src/fs__promises/fs__promises.test.ts`'s use of the barrel's `isFsError` at
   line 55 (see "Current state" for exactly what to change). No other file needs a caller migration —
   confirmed nobody outside the barrel and its own test imports either name through
   `#gateway/node/fs__promises` today.
6. **The `fs__promises` → `fs` move for `isFsError`/`FsError`.** This is the same fix as #5 — the item
   brief names it separately because the source doc's "Also" note under item 45 calls it out by name,
   but it is one and the same change: once the two re-export lines are gone from `fs__promises.ts`,
   nothing at `#gateway/node/fs__promises` claims `isFsError`/`FsError` any more, and the only home is
   `#gateway/node/fs`, which already has it.
7. **Build the rules package-agnostic where it costs nothing.** B03 (later in the epic) extends this
   same barrel-completeness and single-home shape to every workspace package's own `exports` barrels,
   not only the gateway's. Where a check can be written against "a barrel file and the sibling folders
   beside it" without hard-coding a gateway-only path shape (`isGatewayFileGuard`,
   `isGatewayBarrelFileGuard`), keep the general logic in a shared layer broker and have the gateway
   rule call it with the gateway's own file-matching guards. Where gateway-only reasoning is
   unavoidable (the specific barrel FORMS in "What a barrel holds" above are a gateway convention;
   workspace packages may end up with a different or narrower list once B03 is written), keep that part
   gateway-specific and let B03's own item decide the workspace-package equivalent. Do not invent the
   workspace-package version now — B03 is a separate item with its own decisions to make.

## Lint rules this item adds or changes

- **`gateway-colocation` (extended, not new):** adds the barrel-completeness check (both directions,
  item #1 above) and the single-home check (item #2 above), gateway files only, post-edit (it reads the
  file system, so it cannot be pre-edit). Message for completeness: names the function/schema/class
  file with no barrel re-export, or the barrel re-export with no matching file. Message for
  single-home: names the subpath the re-export actually belongs to.
- **No barrel re-exports a `.proxy.ts` or `.stub.ts` file (extended, not new):** same rule, refuses a
  production barrel (`<subpath>.ts`) that re-exports a name from a sibling `.proxy.ts` or `.stub.ts` file,
  gateway files only, post-edit. Does NOT yet require a stub to exist (that switches on in G18).

## Teaching text this item changes

None yet — Phase 6 (Z01-Z06) rewrites the gateway folder-type doc and the session snippets once every
code item in this epic has landed. Do not touch `get-folder-detail`, `get-architecture` or the session
snippets from this item.

## Done when

- [ ] `packages/@gateway/node/src/fs__promises/fs__promises.ts` no longer re-exports `isFsError` or
      `FsError`, and its test no longer reads them off the barrel.
- [ ] `gateway-colocation` refuses a barrel missing a re-export for an existing wrapper export.
- [ ] `gateway-colocation` refuses a barrel re-exporting a name that does not exist in any sibling
      wrapper folder.
- [ ] `gateway-colocation` refuses a barrel whose named re-export resolves outside its own subpath
      folder.
- [ ] `gateway-colocation` refuses a production barrel (`<subpath>.ts`) that re-exports anything from a
      `.proxy.ts` or `.stub.ts` file, with no "every subpath needs a stub" requirement yet.
- [ ] A scan of the whole `packages/@gateway/` tree with the new rules on shows zero violations besides
      the ones this item fixes (hand-check a sample of what the rule flags and what it lets through, per
      EPIC.md's per-item rule for a new lint rule).
- [ ] `npm run ward -- -- <files touched>` exits 0.

## Traps

- `gateway-colocation`'s existing purity check (`passThroughNotPureReexport`) already runs on every
  barrel file. Do not duplicate that check under a new name — extend the same rule broker so a barrel
  file is visited once and all of its checks run together.
- The "every subpath ships at least one stub" rule is explicitly NOT this item's job — see G16 (builds
  the check) and G18 (turns it on). Adding it here breaks every subpath in the repo, since almost none
  has a stub yet (a 2026-09-26 census found exactly one: `node/src/fs/is-fs-error/fs-error.stub.ts`).
- Confirm G05 actually landed before writing the `.error.ts` completeness case — if it has not, the
  error folders in the table under "Current state" (in G05's own item file) still exist in their old
  shape, and this item's completeness check would need to treat those differently (or not at all yet).

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
