# Z01: The `gateway` folder-type doc

| | |
|---|---|
| Phase | Phase 6 — docs and finish |
| Source | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" procedure (lines 368-383) and "A `gateway` folder-type doc" (385-414, with its topic table) |
| Needs | every A, B, G, T item |
| Unblocks | Z07 |
| Packages touched | `mcp` (new folder-constraints doc), `shared` (`folderConfigStatics` if it needs a gateway entry) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent |
| Runs alone | no (runs with Z02-Z06) |

## Why

Every folder type has a doc `get-folder-detail({ folderType })` serves, from
`packages/mcp/src/statics/folder-constraints/<type>-constraints.md`. The gateway has no such doc yet.
Writing it before every code item lands would teach a layout the finished code might not match — the
gateway migration's own type errors, build errors, and Node/TypeScript/Jest disagreements can still move
a file, drop a barrel form, or change how a package resolves. This item is Phase 6, last, deliberately.

## Current state

Checked 2026-09-26:

- No `gateway-constraints.md` exists anywhere in the repo — confirmed absent by a directory walk for that
  filename.
- `folderConstraintsStatics` (the map from folder type to its doc file) and `folderConfigStatics` (which
  feeds `folderTypeContract`, `enforce-project-structure`, and the `<dungeonmaster-folderTypes>` session
  snippet) both live in `packages/shared/src/statics/folder-config/folder-config-statics.ts`, confirmed
  present. Whether it already has any gateway-shaped entry was not checked — treat as "not yet added"
  until the executing agent reads the file.
- `folderConfigStatics`'s fields assume a `fileSuffix` and an `exportSuffix` per the source doc; gateway
  files carry neither, since each is named after the outside export it wraps, not after its own folder
  type. This is an open design question the source doc itself flags, not a settled shape — the executing
  agent decides how to represent this, recommended: add an optional/nullable pair of fields rather than
  forcing every folder type to carry a suffix it does not use, and note the choice under DECISIONS.

## Work

Per the source doc's own procedure — **do this only after every code item above (every A, B, G, T item)
has landed**, because the code may still change the layout the docs describe:

1. **Explore the gateway and every package that calls it, as they stand once the code work is done.**
   Record what is actually there: every folder shape, barrel form, file kind, `package.json` field and
   import form in use, and every place where the four gateway packages disagree from each other. Do not
   trust "Gateway standards as built" in the source doc (recorded 2026-09-26) as still accurate — it is
   explicitly a snapshot, not the final standard, and this item's whole job is re-deriving the standard
   from the finished code.

2. **Settle each disagreement found**, fixing the code or the standard — whichever the finished state
   supports. Where the finished code disagrees with the source doc's own tables, the code wins and the
   doc gets rewritten to match.

3. **Write `gateway-constraints.md`** at `packages/mcp/src/statics/folder-constraints/gateway-constraints.md`,
   served as `get-folder-detail({ folderType: "gateway" })`, wired through `folderConstraintsStatics`.
   Cover at least these topics (source doc's own table, condensed — write the REAL content from the
   finished code, not this description):

   | Topic | What to write from |
   |---|---|
   | What goes in | anything whose shape someone else controls, reached through `npm`, `node`, `browser` or `bin`; Jest is `#gateway/npm/jest__globals` |
   | The import form | `#gateway/<kind>/<subpath>`, `__` for `/` and scopes, no `.js` — from `gatewayPathFromImportSourceTransformer` in `shared` |
   | The layout | subpath folder, `{subpath}.ts` barrel, one folder per export with its test, proxy and stubs each in its own file (`<wrapper>.proxy.ts`, `<wrapper>.stub.ts`), imported per file per this epic's concession 1 — write what the finished code does; `.error.ts` files beside the wrapper that throws them, nothing deeper |
   | What a barrel may hold | the forms table from "What a barrel holds" in the source doc, verified against the finished barrels |
   | Side-effect-only pass-throughs | the `sideEffects` list in each gateway package's `package.json` |
   | Nothing is private | a wrapper may call the raw package to build helpers; prefer a new name when changing a real function's contract |
   | Composing two outside calls | is a broker in the owning package, not a gateway function (gateway follow-up item 32) |
   | Return types | the package's own type, a gateway-declared type, or `unknown` (gateway follow-up item 22) |
   | Stubs and schemas | gateway follow-up items 25, 26 |
   | Proxies | `registerMock` from `@dungeonmaster/testing`, no catch-all defaults (T4), recorded failures (T5), tolerant addressing and read-back (item 28), callers import each proxy from its own file per concession 1 |
   | The `gateway` config | `bannedExports`, `restrictedTo` — from "A `gateway` config in `.dungeonmaster.json`…" |
   | Dependencies | each outside package listed in its gateway package, one installed copy, callers list the gateway package (item 30's duplicate-install check, `gateway-dependency-declared`) |
   | Worked examples | `fs` (wrapped, with `export *`), `glob` (a wrapper named after its subpath), `zod` (pass-through), `document` (a global) — cite the real folders under `packages/@gateway/*/src/` |

4. **Decide how `folderConfigStatics` represents a folder type with no `fileSuffix`/`exportSuffix`**, since
   every other folder type's entry assumes both exist. This is the source doc's own open question — write
   the recommended decision (an optional pair, defaulting to absent for the gateway type) and the reason
   (every other folder type keeps working unchanged; the gateway is the one type named after its export,
   not its role) under "Recommended" per this epic's instructions, and let the executing agent change it
   with a reason in DECISIONS if a cleaner shape turns up while wiring `enforce-project-structure`.

## Lint rules this item adds or changes

None directly — this item is the doc. If exploring the finished gateway surfaces a barrel or layout rule
gap nothing enforces, report it under LEFT STANDING rather than building a new rule here; that belongs to
whichever G-item owns barrel lint rules (G14).

## Teaching text this item changes

This item's whole output is `packages/mcp/src/statics/folder-constraints/gateway-constraints.md`, wired
through `folderConstraintsStatics`, and whatever `folderConfigStatics` change its wiring needs.

## Done when

- `gateway-constraints.md` exists, covers every topic in the table above with real content from the
  finished code, and is served correctly by `get-folder-detail({ folderType: "gateway" })`.
- `folderConfigStatics` has a `gateway` entry that `enforce-project-structure` and `folderTypeContract`
  both recognise.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- Do not start this item before every A/B/G/T item is `done` in EPIC.md — the whole point of Phase 6 last
  is that earlier items can still change the shape this doc describes.
- Do not trust the source doc's own "as built" tables as current; re-derive them from the finished code,
  since the source doc itself says it is a snapshot that this exploration replaces.
- Apply EPIC.md's concessions to every example: a stub/proxy import example in the new doc reads a
  per-file path, such as `#gateway/<kind>/<subpath>/<wrapper>/<wrapper>.proxy`, never a `_test_` barrel
  path — concession 1 removed that barrel entirely.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
