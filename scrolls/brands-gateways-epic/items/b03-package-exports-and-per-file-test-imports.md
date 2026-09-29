# B03: Package `exports` serve barrels and per-file stubs and proxies; stubs and proxies out of production barrels

> **Re-planned 2026-09-29.** Order, chunking and sizes for this item are in [`EPIC.md`, "Phases 3 and 4 — the plan"](../EPIC.md), wave 3.3. That plan wins on order and size; this file still specifies the rules. Counts below are from 2026-09-26 unless marked.

| | |
|---|---|
| Phase | Phase 3 — brands foundation |
| Source | `scrolls/gateway/followup-sustainability.md` (GW), item 45, lines 884-925; `scrolls/brands-types-tests-rules.md` (BR), C6 "stubs and proxies stay beside their code, and no barrel exports them", lines 1318-1380; [G26](../g26-per-file-proxy-and-stub-imports.md), which proved and built the three-key `exports` form and the resolver changes for the gateway; EPIC.md Concessions 1 and 3 |
| Needs | [B02](b02-contract-index-and-unused-contracts.md), [G26](../g26-per-file-proxy-and-stub-imports.md) |
| Unblocks | [B11](b11-unique-contract-names.md), [T06](../t06-proxy-child-creation.md), [T09](../t09-test-infrastructure-catalog.md), and Z01–Z07 |
| Packages touched | Every workspace package under `packages/*` except `@gateway/*` (which already has this shape once G26 lands): `cli`, `config`, `eslint-plugin`, `hooks`, `hydration`, `hydration-recipes`, `local-eslint`, `mcp`, `orchestrator`, `server`, `session-forensics`, `shared`, `siegelense`, `testing`, `tooling`, `ward`, `web` |
| Checks to run | `lint,typecheck,unit,integration` per package touched — an `exports` change breaks module resolution repo-wide if done wrong, so typecheck every package that imports the one you just changed, not only the one you edited |
| Split | Operator splits per package. `shared` first or early, since the most packages depend on it and its barrel shape (hand-written, one entry per folder type, plus `/testing`) is the most work to convert. |
| Runs alone | No, but two agents must never touch the same package's `exports`/barrels at once — the operator names disjoint package lists per agent. |

## Why (merged from two source items)

**GW item 45.** The four gateway packages (`@dungeonmaster/npm`, `node`, `browser`, `bin`) each expose the
three-key `exports` form G26 proved and built: `./*.proxy`, `./*.stub`, and the barrel key `./*`, all
resolved under `node16` with the conditions `gateway-dist`, `source`, `import`, `require`, `types` in that
order. Every other workspace package does it a different, inconsistent way today (see Current state). A
caller reaches a gateway stub or proxy from the exact file that declares it —
`#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy` — never through a folder-level
test barrel. Nothing outside the gateway does the matching thing yet.

**BR C6.** Separately, stubs and proxies ship in production today. `packages/shared/tsconfig.build.json`
excludes `**/*.stub.ts`, but `contracts.ts` exports 232 stubs beside its 233 contracts — the compiler
follows those imports, so all 232 stubs land in `packages/shared/dist`, and every production import of
`@dungeonmaster/shared/contracts` loads every stub. A stub or proxy should ship in a package's build only
when that package's test support ships to consumers at all — `@dungeonmaster/testing` and the gateway
packages are the only ones where that is true.

**Why one item does both (EPIC concession 3).** They move the same barrels and rewrite the same import
lines: giving a package the three-key `exports` form and taking stubs out of its production barrel are two
edits to the same files. Doing them as separate items would touch every file twice.

**EPIC concession 1: the per-file form, as G26 proved it.** The user decided on 2026-09-26 that no
`_test_` barrel and no `_test_` import path exists anywhere, in the gateway or in workspace packages. A
test imports each stub and each proxy from the file that declares it (brands doc C6). G26 proved Node's
`require` and TypeScript's `ts.resolveModuleName` (under `node16`, `customConditions: ["source"]`) both
pick the most specific `exports` key that matches a path — a path ending `.proxy` or `.stub` takes its own
key over the barrel key `./*` — built the three-key form into all four gateway packages, deleted the
gateway's 22 subpath test barrels, and taught the Jest and proxy-mock-hoister resolvers in
`@dungeonmaster/testing` to match the same three keys. **B03 reuses that proven form and those resolver
changes, unchanged, for every workspace package:**

- Gateway (G26's territory, already done by the time this item starts): `#gateway/<kind>/<subpath>/<name>.proxy`
  or `.stub`, e.g. `#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy`.
- Workspace packages (this item's territory): `@dungeonmaster/<pkg>/<path under src, no extension>`, e.g.
  `@dungeonmaster/shared/contracts/quest/quest.stub`.

C6's production half stands exactly as written: no production barrel exports a stub or a proxy, and no
production file imports one. Only the *test-side* import path is the one this item builds for workspace
packages — per file, exactly as C6 always said, with no barrel of test support to keep current.

## Current state

Confirmed this session (2026-09-26):

- `packages/@gateway/npm/package.json` still has the old two-entry form (`./_test_/*` and `./*`) as of
  this session, because G26 — this item's dependency — has not run yet. G26's own Done-when list requires
  all four gateway packages to hold the three-key form (`./*.proxy`, `./*.stub`, `./*`) with the
  `./_test_/*` key gone, and its subpath test barrels deleted, before it is marked done. **By the time this
  item starts, treat all four gateway packages as already matching the three-key form** — read G26's item
  file, "The import form" section, for the exact JSON and the resolver proof, rather than re-deriving it.
- `packages/shared/package.json` has the hand-written form GW item 45 describes: nine `exports` entries
  (`./contracts`, `./guards`, `./transformers`, `./@types`, `./statics`, `./brokers`, `./adapters`,
  `./errors`, `./testing`), each pointing at a root-level barrel file (`packages/shared/contracts.ts`,
  `guards.ts`, `transformers.ts`, `@types.ts`, `statics.ts`, `brokers.ts`, `adapters.ts`, `errors.ts`,
  `testing.ts` — all confirmed present at the package root, not inside `src/`).
- `packages/hooks/package.json`, `packages/server/package.json`, `packages/ward/package.json` and
  `packages/web/package.json` have **no `exports` field at all**, confirmed by reading each file.
- `packages/config/package.json` and `packages/testing/package.json` were **not checked** by this scan
  for their exact `exports` shape — read both before starting; `config`'s file shown during this session's
  research had a `.` and `./contracts` entry (the hand-written style), and `testing`'s had a `.` entry
  plus several individual broker paths (e.g. `./register-mock`,
  `./brokers/network-record/playwright`) — neither matches the gateway's three-key form. Treat both as
  needing the same conversion as `shared`.
- No package outside `@gateway/*` has a `_test_` entry anywhere, and none ever will — there is no `_test_`
  folder or barrel in the final form, in the gateway or in workspace packages.

## The import form (G26's proven form, reused here)

Every workspace package's `exports` holds the same three keys as the gateway, in the same order, each
with the conditions `source`, `import`, `require`, `types` (workspace packages have no `gateway-dist`
condition — see step 1):

```json
"exports": {
  "./*.proxy": { "source": "./src/*.proxy.ts", "…": "…" },
  "./*.stub":  { "source": "./src/*.stub.ts",  "…": "…" },
  "./*":       { "source": "./src/*/*.ts",     "…": "…" }
}
```

Node and TypeScript pick the most specific pattern key that matches: when two keys share the prefix before
`*`, the longer key wins, so a path ending `.proxy` or `.stub` takes its own key and every other path takes
the barrel key `./*`. G26 proved this for Node's `require` and for `ts.resolveModuleName` under `node16`
with `customConditions: ["source"]`, against a real gateway package — this item does not re-prove it, only
reuses it.

| File | Imported as |
|---|---|
| `packages/shared/src/contracts/quest/quest.stub.ts` | `@dungeonmaster/shared/contracts/quest/quest.stub` |
| `packages/shared/src/brokers/quest/get/quest-get-broker.proxy.ts` | `@dungeonmaster/shared/brokers/quest/get/quest-get-broker.proxy` |
| `packages/shared/src/contracts/contracts.ts` (a folder-type barrel, unchanged) | `@dungeonmaster/shared/contracts` |

## Work

### 1. The three `exports` entries, in the gateway's order

Every workspace package's `package.json` gets exactly the three entries G26 built for the gateway, same
conditions, same order:

```json
"exports": {
  "./*.proxy": {
    "source": "./src/*.proxy.ts",
    "import": "./dist/src/*.proxy.js",
    "require": "./dist/src/*.proxy.js",
    "types": "./dist/src/*.proxy.d.ts"
  },
  "./*.stub": {
    "source": "./src/*.stub.ts",
    "import": "./dist/src/*.stub.js",
    "require": "./dist/src/*.stub.js",
    "types": "./dist/src/*.stub.d.ts"
  },
  "./*": {
    "source": "./src/*/*.ts",
    "import": "./dist/src/*/*.js",
    "require": "./dist/src/*/*.js",
    "types": "./dist/src/*/*.d.ts"
  }
}
```

Adjust the `dist` path to match each package's actual build output layout (some build to `dist/`, some to
`dist/src/` — check each package's existing `main`/`types` fields and its `tsconfig.build.json` `outDir`
before writing the new entries; do not assume `dist/src/` for a package that has always built to `dist/`
directly). The gateway packages carry a fifth condition, `gateway-dist`, that is gateway-specific build
machinery — workspace packages use the four conditions `source`, `import`, `require`, `types` only, unless
a reason forces adding a fifth (report it in DECISIONS if so).

The `*` wildcard in the barrel key (`./*`) is a **folder type**: `@dungeonmaster/shared/contracts`
resolves to `packages/shared/src/contracts/contracts.ts` (a folder-level barrel, not one file per
contract). The `.proxy`/`.stub` keys address **one file, with no folder-level aggregation**:
`@dungeonmaster/shared/contracts/quest/quest.stub` resolves straight to
`packages/shared/src/contracts/quest/quest.stub.ts` — there is no `contracts.proxy.ts` or any other
aggregating file standing between the import and the stub, the same way G26 deleted the gateway's 22
subpath test barrels with nothing replacing them.

### 2. Barrel location: the gateway form, inside the folder they cover — production barrels only

GW item 45 leaves this open ("Decide where those barrels live"). **Recommended — the executing agent may
change it with a reason in DECISIONS:** put every folder-type PRODUCTION barrel *inside* the folder it
covers, the way the gateway does (`packages/@gateway/npm/src/typescript-eslint__utils/typescript-eslint__utils.ts`
is the barrel for that one subpath; by analogy, a workspace package's per-folder-type barrel belongs at
`src/<folderType>/<folderType>.ts`, not at the package root). This is a change from today's shape, where
`shared`'s barrels (`contracts.ts`, `brokers.ts`, etc.) sit at the package root.

This decision is about the *production* barrel only. A `.stub.ts` or `.proxy.ts` file already sits beside
the code it stubs or mocks under the existing colocation rule (a contract's stub is already
`quest.stub.ts` next to `quest-contract.ts`; a broker's proxy is already `x-broker.proxy.ts` next to
`x-broker.ts`) — nothing about *where individual stub and proxy files live* changes in this item. There is
no folder-level file that aggregates a folder's stubs or proxies, in the gateway or in workspace packages;
each is addressed by its own path.

Concretely, for each folder type a package has:

| File | Holds |
|---|---|
| `src/contracts/contracts.ts` | `export *` (or named exports) of every production contract in `contracts/` — no stub, no proxy |
| `src/contracts/quest/quest.stub.ts` | the stub for `quest-contract.ts`, unchanged, imported per file |
| `src/brokers/brokers.ts` | production brokers only |
| `src/brokers/quest/get/quest-get-broker.proxy.ts` | the proxy for `quest-get-broker.ts`, unchanged, imported per file |

### 3. Production barrels export no stub or proxy

Every barrel described above (`contracts.ts`, `brokers.ts`, etc.) stops exporting anything from a
`.stub.ts` or `.proxy.ts` file. `packages/shared/contracts.ts` today exports 232 stubs beside 233
contracts — checked 2026-09-24, and this compiles all 232 stubs into `packages/shared/dist` because the
build follows the barrel's imports. After this item, `contracts.ts` (relocated per step 2, or wherever it
ends up) exports contracts only.

```text
before
packages/shared/src/contracts/quest/quest-contract.ts
packages/shared/src/contracts/quest/quest.stub.ts
packages/shared/contracts.ts        exports questContract AND QuestStub — 232 stubs in the production entry point
packages/shared/testing.ts          re-exports proxies, at @dungeonmaster/shared/testing

after
packages/shared/src/contracts/quest/quest-contract.ts
packages/shared/src/contracts/quest/quest.stub.ts        unchanged: beside its contract, parsing through it
packages/shared/src/contracts/contracts.ts               exports contracts only
                                                          no root testing.ts, no barrel of test support anywhere
```

### 4. Every `@dungeonmaster/<pkg>/testing` import moves to per-file imports

Every `@dungeonmaster/<pkg>/testing` import in the repo moves to a direct, per-file import of the exact
stub or proxy it used: `@dungeonmaster/<pkg>/<path under src, no extension>`. `shared`'s `testing.ts` (and
every other package's equivalent) is deleted once nothing imports it — there is no barrel to move onto
instead; the caller names the individual file it needs. Find every caller before deleting — a caller left
pointing at a deleted barrel is a build break, not a cleanup.

```
// flagged — production code reaching test support
brokers/quest/x/x-broker.ts:   import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
contracts.ts:                  export { QuestStub } from './src/contracts/quest/quest.stub';   // a stub in a production barrel
testing.ts:                    export { questGetBrokerProxy } from './src/brokers/quest/get/quest-get-broker.proxy';   // any barrel of test support

// left alone (a per-file import, straight from the stub or proxy's own file)
brokers/quest/x/x-broker.test.ts:          import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
brokers/quest/pause/x-responder.proxy.ts:  import { startOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';
brokers/fs/stat/fs-stat-broker.proxy.ts:   import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';   // a library stub, from the gateway (C5)
```

### 5. `enforce-import-dependencies` refuses stub/proxy imports outside test support

A `.stub.ts`/`.proxy.ts` file may be imported only from a file that is a test, proxy, harness or stub file.
This includes refusing a **production barrel** that re-exports one (BR row 2230 in "Today's rules and docs
that change" — this is C6's production-side rule). The one exception: a parent stub re-exporting its own
stub layers (C7 — a `.stub.ts` file may re-export a `*-layer.stub.ts` beside it; this is about layer files,
not about a folder-level test barrel, and is `b07-layers-and-statics-regex.md`'s territory to build fully —
do not let this item's rule contradict it).

### 6. `enforce-contract-usage-in-tests`

The message row (BR row 2233) already suggests the stub path `./<name>.stub` beside the contract — that is
exactly the per-file form this item builds, so **no change is needed here**. Confirm the message still
reads that way; if an earlier pass toward the now-superseded `_test_`-barrel plan changed it to point at a
barrel instead, revert that wording back to the per-file suggestion.

### 7. Barrel lint rules extended to workspace packages

The barrel-honesty lint rules G14 built for the gateway ("Lint rules that keep the layout honest" in GW,
built by `g14-gateway-barrel-lint-rules.md`) extend to every workspace package: a folder-type barrel
exports everything (and only) production code of that type — no stub, no proxy, nothing missing, nothing
extra. There is no folder-level test barrel to check honesty on the other side: a stub or proxy is
addressed by its own file, not aggregated, so the only barrel-honesty check that applies here is the
production one. Read G14's item file for the exact rule shapes before rebuilding them from scratch — this
item reuses them, it does not reinvent them.

### 8. Update every place that tells someone how to add or scaffold a package

| Where | Says today | Change to |
|---|---|---|
| `packages/CLAUDE.md`, "Creating New Packages" and "Depending on another workspace package" | Nothing about `exports` or per-file stubs | Document the three-entry form and the per-file stub/proxy convention: a stub sits beside its contract, a proxy beside the file it mocks, and nothing aggregates them at the folder level |
| `packages/shared/CLAUDE.md`, "Adding New Exports" | Write a root `<category>.ts` barrel and a hand-written `exports` entry for it | Write `src/<folderType>/<folderType>.ts` for production exports; a stub or proxy under that folder is imported per file, straight from where it sits — the `exports` map itself never grows past its three entries |
| `packageScaffoldConfigStatics` (`packages/cli/src/statics/package-scaffold-config/package-scaffold-config-statics.ts`, confirmed present this session), which `create-package` writes from | Scaffolds a package with no gateway-style `exports`; `jestConfigNodeIntegration` passes ts-jest `moduleResolution: 'node'` | Scaffold the three-entry `exports` form for every new package; ts-jest options should reuse the shared base entry (see G08's item) rather than a fresh `moduleResolution: 'node'` |
| `packages/mcp/src/statics/folder-constraints/adapters-constraints.md:309`, and any other folder doc or `get-testing-patterns` example naming a `/testing` import | Proxies importing from `@dungeonmaster/shared/testing` | `@dungeonmaster/shared/<path under src, no extension>`, e.g. `@dungeonmaster/shared/contracts/quest/quest.stub` |
| `init`, for a consumer's own packages | Scaffolds the three-entry form only for the four gateway packages | Scaffold the same three-entry form for every package `init` creates for a consumer, workspace packages included |

## Lint rules this item adds or changes

| Rule | What it refuses | Pre-edit? |
|---|---|---|
| `enforce-import-dependencies` (extended) | An import of a `.stub.ts`/`.proxy.ts` file from a file that is not a test, proxy, harness or stub file. A production barrel that re-exports one. | Yes — syntax only, as today |
| Barrel-honesty rules (from G14, extended per step 7) | A folder-type barrel missing a production export it should have, or containing a stub/proxy export | See G14's item file — it states each rule's own pre-edit status; do not re-derive it here |
| `enforce-contract-usage-in-tests` | Unchanged refusal and unchanged message (see step 6) | Yes, as today |

## Teaching text this item changes

From BR "Architecture, folder-type and testing docs: the work":

- `shared/src/statics/session-snippet/session-snippet-statics.ts`, line 103: "Tests import `.stub.ts`,
  never `-contract.ts`; Stubs import contract to parse with" → "Tests import each stub and proxy from its
  own file, never from a production barrel. A stub for our type parses through its contract. A stub for an
  outside type comes from the gateway's own file." (C6, stated plainly, with no barrel-of-test-support
  adjustment needed)
- `shared/src/brokers/architecture/overview/architecture-overview-broker.ts`, new section: "A stub sits
  beside its contract and a proxy beside the file it mocks. No production barrel exports either. A test
  imports each stub and proxy from its own file. Production code never imports one." (C6)
- `mcp/src/statics/folder-constraints/contracts-constraints.md:44`: "Test files MUST import from
  `.stub.ts` files, NOT from `-contract.ts` files" → "Test files import a stub from its own file, beside
  the contract it stubs — never from a contract file or a production barrel directly."

Full doc/snippet text is finished in [Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md),
which sweep every source once every A/B/G/T item has landed — this item only needs to leave the rows above
internally consistent for the packages it touches, not to close out the Z-phase doc sweep itself.

## Done when

- [ ] Every workspace package's `package.json` has exactly the three `exports` entries (`./*.proxy`,
      `./*.stub`, `./*`), matching the gateway's condition order, and resolves `dist` correctly for that
      package's real build layout.
- [ ] Every folder-type barrel lives at `src/<folderType>/<folderType>.ts` and exports production code
      only.
- [ ] No folder-level file aggregates a folder's stubs or proxies; each is imported straight from its own
      file.
- [ ] No `/testing` entry point exists in any package; every caller imports the exact stub or proxy file it
      needs instead.
- [ ] `enforce-import-dependencies` refuses a stub/proxy import from a non-test-support file, and refuses
      a production barrel that re-exports one, repo-wide.
- [ ] `packages/CLAUDE.md`, `packages/shared/CLAUDE.md`, `packageScaffoldConfigStatics`, and `init`'s
      consumer-package scaffolding all describe the new shape.
- [ ] `npm run ward -- --only lint,typecheck,unit,integration -- <touched files>` exits 0, per package.

## Traps

- An `exports` change that gets the `dist` path wrong breaks every consumer of that package silently at
  typecheck time, not at the `package.json` edit — typecheck every dependent package, not just the one
  you changed.
- Two agents editing `shared`'s barrels at the same time will corrupt each other's work; the operator
  must give out disjoint package lists.
- `packages/config` and `packages/testing`'s current `exports` shapes were not fully verified this
  session — read them fresh before assuming the "hand-written form" description applies exactly.
- Renaming `shared/contracts.ts` to `shared/src/contracts/contracts.ts` moves a file every other package
  imports; grep (blocked — use `discover` or a `python3` walk) every importer before deleting the old
  path, or the build breaks elsewhere with no local signal.
- Do not start before G26 lands — the three-key `exports` form and the resolver changes this item reuses
  do not exist yet until G26 builds and proves them.

## Concessions made while executing
