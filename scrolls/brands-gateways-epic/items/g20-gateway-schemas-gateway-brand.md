# G20: Gateway schemas branded `#Gateway<Type>`

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 26, lines 630-658; `scrolls/brands-types-tests-rules.md` C9, lines 1529-1589 |
| Needs | [G16](g16-gateway-stubs-node-and-failures.md) (the `StatsStub`/`ChildProcessStub` shapes this item's schemas must accept) |
| Unblocks | [B06](b06-gateway-schema-fields-in-contracts.md) (the contract-side switch onto these schemas) |
| Packages touched | `@gateway/node` (new schema files, new `zod` dependency), `eslint-plugin` (new gateway-only lint rule) |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

## Why

When one of our contracts holds a value of a gateway type — a work item holding a real `ChildProcess`,
a scan result holding the `WalkedFile[]` that `#gateway/node/fs` returns — the contract needs a real
runtime check for that field, not a bare `z.custom<T>()`, which infers the type but checks NOTHING at
runtime (accepts a missing field and any junk, in zod v3 and v4 alike). The fix is one schema per
gateway type, owned by the gateway itself (next to the type), branded `'#Gateway<Type>'` so every
contract that reuses it shares the exact same check. This item builds those schemas in the gateway;
B06 is the separate item that switches our contracts onto them.

## Current state

Checked 2026-09-26 against the code:

- **No schema file exists anywhere in the gateway yet.** A repo-wide search for `schema` under
  `packages/@gateway/` found only `npm/src/zod-to-json-schema/` (an unrelated pass-through subpath for
  the `zod-to-json-schema` npm package, not a gateway-owned schema for one of its own types).
- **`packages/@gateway/node/package.json` has no `zod` dependency today** — its `dependencies` key does
  not exist at all; it lists only `devDependencies`
  (`@dungeonmaster/testing`, `@types/node`, `typescript`). Adding `zod` is part of this item's work.
  `gateway-import-boundary` (an existing rule) already allows a gateway package to import `zod` — the
  source doc says so, and nothing found while checking the gateway's rules contradicts it — but confirm
  this against the rule's own test before assuming it needs no change.
- **`packages/@gateway/node/src/fs/walk-files-sync/walked-file.ts`** is the plain-data type
  `WalkedFile` this item's example schema checks:

  ```typescript
  export interface WalkedFile {
    path: string;
    sizeBytes: number;
    modifiedAtMs: number;
  }
  ```

  No `isWalkedFile` guard exists yet — this item has to write one (the schema's own `.custom` check
  calls it, per C9's shape below).
- **`packages/@gateway/node/src/child_process/` has no `ChildProcess`-specific schema file** (it does
  have `run`, `run-sync`, `spawn-detached`, `spawn-live`, `spawn-long-lived`, `stream`,
  `stream-lines`, `run-fire-and-forget`, `run-not-found-error` wrapper folders, but nothing named
  `child-process-schema` or similar).
- This item depends on G16's `ChildProcess` and `Stats` STUBS existing (a schema needs a stub built
  through it to prove the parse round-trips, per C9's own "test values come from the gateway's stubs"
  rule below) — confirm G16 landed before writing this item's own stub-through-schema step.

## BR C9, quoted in full (gateway side — the schema; the contract-side switch is B06)

> #### C9: a contract field that holds a gateway type reuses the gateway's schema, branded
> `#Gateway<Type>`
>
> Some of our objects hold a value of an outside package's type: a work item holding a `ChildProcess`,
> a scan result holding the `WalkedFile`s that `#gateway/node/fs` returned. The field keeps the
> gateway's type. Its schema lives in the gateway, beside the type, and carries a brand that names
> where the value came from: `'#GatewayWalkedFile'`, `'#GatewayChildProcess'`. The contract reuses that
> schema, as B4 reuses another owner's field.
>
> ```typescript
> // before — a bare custom schema: the type says ChildProcess, the runtime checks nothing
> proc: z.custom<ChildProcess>(),
>
> // after — the gateway exports the schema (child_process/child-process/child-process-schema.ts, fs/walk-files-sync/walked-file-schema.ts)
> export const childProcessSchema = z.instanceof(ChildProcess).brand<'#GatewayChildProcess'>();
> export const walkedFileSchema = z.custom<WalkedFile>((v) => isWalkedFile(v)).brand<'#GatewayWalkedFile'>();
>
> // our contract reuses it
> import {childProcessSchema} from '#gateway/node/child_process';
> import {walkedFileSchema} from '#gateway/node/fs';
>
> export const scanContract = z
>         .object({
>           id: z.string().brand<'ScanId'>(),
>           proc: childProcessSchema,              // ChildProcess & brand '#GatewayChildProcess'
>           files: z.array(walkedFileSchema),      // WalkedFile & brand '#GatewayWalkedFile'
>         })
>         .brand<'Scan'>();
> ```
>
> | Rule | Why |
> |---|---|
> | A class uses `z.instanceof(Class)`; plain data uses `z.custom<T>(check)` with a check | A bare `z.custom<T>()` accepts a missing field and any junk at runtime, in zod v3 and v4 alike. Measured 2026-09-26, `tmp/zod-lib-field/probe.ts` in the main checkout. |
> | The brand text is `#Gateway` plus the type's name | Derived, so nobody picks it. The `#` keeps it apart from our own brand texts. |
> | A type name is unique across the four gateway packages | One brand text must mean one check. A second `Stats` in another module would share `'#GatewayStats'`. |
> | A stub for a type with a schema returns the branded value, built through the schema: `childProcessSchema.parse(new ChildProcess())` | Our `StubArgument` keeps a `#Gateway` field as it is, so a test passes the gateway's stub, and a partial fake fails to compile. Measured in `tmp/zod-lib-field/brand-probe.ts` in the main checkout. |
>
> Ins and outs, measured on 2026-09-26 against zod 3.25.76 and its `zod/v4` build:
>
> - **A bare `z.custom<T>()` is a cast, not a check.** It infers `T` and makes the field required in
>   the type. At runtime it accepts a missing field and any junk, in v3 and in v4 — v4 did not fix it.
>   `z.instanceof(Class)` and `z.custom<T>(check)` both reject a missing field and junk.
> - **A class and plain data take the same shape.** A class such as `ChildProcess` or Playwright's
>   `Page` uses `z.instanceof`. Plain data such as `WalkedFile` uses `z.custom` with a check. Either
>   way, the schema lives in the gateway.
> - **The parse keeps the value itself.** `parsed.proc === proc` is `true`. Methods and getters
>   survive, such as `stats.mtime` and `proc.kill()`, and `.extend()` keeps the field.
> - **The brand is shared on purpose.** Every contract that holds a `WalkedFile` carries
>   `'#GatewayWalkedFile'`, whatever key it sits under, so one brand text always means the gateway's
>   one check. The text is `#Gateway` plus the type's name, derived, not chosen. No text our own
>   brand-derivation rule (B3) derives starts with `#`, so the two families never collide.
> - **A plain value needs a parse to get in.** A `WalkedFile` straight from a gateway call does not
>   fit the branded field. Spreading one into a `Scan` without a parse fails to compile. The caller
>   parses it: `scanContract.parse({ …, files })`, or `walkedFileSchema.parse(file)` for one value.
> - **Reading costs nothing.** `scan.files[0].path` works, and a branded `WalkedFile` passes into any
>   function that takes a `WalkedFile`.
> - **Test values come from the gateway's stubs.** A gateway stub for a type with a schema returns the
>   branded value, built through that schema: `WalkedFileStub()`, `ChildProcessStub()`. `StubArgument`
>   leaves a `#Gateway`-branded field exactly as it is: no recursion into its members and no brand
>   stripping. So a test writes `ScanStub({ proc: ChildProcessStub() })`, and a partial fake such as
>   `{ pid: 5 }` fails to compile. Stripping the brand was tried and fails for classes: TypeScript's
>   `Omit` rebuilds the type and breaks methods that return `this`, such as `addListener`.
> - **A shape mixing our data and a gateway object is still one contract.** A library object with
>   methods goes in the parse, through its gateway schema.
>
> Why: a bare `z.custom<T>()` looks like a check and is not one. Putting the one real check in the
> gateway, next to the type, gives it one home. The shared brand text makes the compiler refuse any
> value that skipped it.
>
> How a machine checks it: syntax. In `contracts/`, refuse `z.custom` and `z.instanceof`. A field whose
> value must be an outside package's type has only one way in: a schema imported from `#gateway`. The
> gateway's side, that every such schema has a check and derives its brand text, is this item. The
> `StubArgument` change is a type-level test in `@dungeonmaster/shared`, out of scope here.

**Note on zod versions:** the source doc measured this against zod 3.25.76 and its `zod/v4` build, and
confirms `.brand<'…'>()` works the same way in both. [B01](b01-zod-v4.md) upgrades the whole repo to
zod v4 later in the epic — this item's schemas should work unchanged across that upgrade, but the
executing agent should not assume it without checking B01's own item file for anything that changes
`.brand()`'s API shape.

## Work

1. **`isWalkedFile` guard.** Write it beside `walked-file.ts`
   (`packages/@gateway/node/src/fs/walk-files-sync/is-walked-file/is-walked-file-guard.ts`, or
   colocated more simply if this package's own convention differs — check `get-folder-detail({
   folderType: "guards" })` if unsure). It checks the plain-data shape: `path` a string, `sizeBytes` a
   number, `modifiedAtMs` a number, and nothing more required.
2. **`walkedFileSchema`**, in `packages/@gateway/node/src/fs/walk-files-sync/walked-file-schema.ts`:
   `z.custom<WalkedFile>((v) => isWalkedFile(v)).brand<'#GatewayWalkedFile'>()`. Export it from
   `node/fs`'s barrel (`fs.ts`).
3. **`childProcessSchema`**, in a new file
   `packages/@gateway/node/src/child_process/child-process/child-process-schema.ts` (a new wrapper
   folder, `child-process/`, if one does not already exist for this exact purpose — check against
   G16's own `ChildProcess` stub folder first, since they likely belong together):
   `z.instanceof(ChildProcess).brand<'#GatewayChildProcess'>()`. Export it from `node/child_process`'s
   barrel.
4. **Add `zod` to `packages/@gateway/node/package.json`'s `dependencies`.** Do the same for
   `packages/@gateway/browser/package.json` and `packages/@gateway/bin/package.json` if either package
   ends up needing a schema too (check whether any browser or bin type a contract might hold — a
   `Page` from Playwright, output from a spawned program — needs the same treatment; the source doc's
   own examples are both `node` types, but the rule is general).
5. **Stub-through-schema.** Once G16's `ChildProcessStub` and `StatsStub` exist, make sure each schema's
   matching stub is built THROUGH the schema's own parse, per C9's own rule: `childProcessSchema.parse(new
   ChildProcess())`, not a bare `new ChildProcess()` handed back unchecked. If G16 already built the
   stub as a bare constructor call, this item updates it to route through the new schema's `.parse`
   instead — check with G16's own item file / the actual landed code for what changed.
6. **The gateway-only lint rule.** New rule, gateway files only:
   - Refuse a bare `z.custom<T>()` with no check function (an arity-0 call, or one whose only argument
     is not a function) anywhere in the gateway.
   - A `.brand<'…'>()` text on a gateway schema must read `#Gateway` plus the exact name of the type
     the schema checks (derive it from the `z.instanceof`/`z.custom<T>` type argument or the
     `instanceof` class name; do not let an author pick an arbitrary string).
   - No two gateway modules may export a type with the same name (this is what keeps one brand text
     meaning one check, per C9's own "type name is unique across the four gateway packages" rule).
     This needs an index of every type the four gateway packages export — check whether B10's "owner
     index" (built later, Phase 4) is reusable here, or whether this item needs its own small,
     gateway-scoped version. **Recommended:** build a small, self-contained check here rather than
     taking a dependency on B10, since B10 is Phase 4 and this item is Phase 1 — B10 can later replace
     this item's version if it turns out to duplicate logic, and that is a cheap merge compared to
     blocking this item on a Phase-4 item landing first.

## Lint rules this item adds or changes

- **New gateway-only rule** (name is a placeholder — pick one and record it under DECISIONS): refuses
  a bare `z.custom<T>()` with no check, in gateway files; refuses a `.brand<'…'>()` text on a gateway
  schema that does not read `#Gateway` + the type name; refuses two gateway modules exporting a
  same-named type. Syntax-checkable in the first two cases (pre-edit candidate); the third needs an
  index across the four gateway packages' files (post-edit / ward-only, similar to how C8's
  `enforce-unique-contract-names` needs an index across workspace packages).

## Teaching text this item changes

None yet — Phase 6.

## Done when

- [ ] `isWalkedFile` guard and `walkedFileSchema` exist, exported from `node/fs`'s barrel.
- [ ] `childProcessSchema` exists, exported from `node/child_process`'s barrel.
- [ ] `packages/@gateway/node/package.json` lists `zod` as a real `dependencies` entry.
- [ ] Each schema's matching G16 stub is built through the schema's own `.parse`, not a bare
      constructor call.
- [ ] The new gateway-only lint rule refuses a bare `z.custom<T>()`, a wrongly-derived brand text, and a
      duplicate type name across the four gateway packages.
- [ ] `npm run ward -- -- <files touched>` exits 0.

## Traps

- Do not build the contract-side switch (BR C9's "refuse `z.custom`/`z.instanceof` in `contracts/`")
  here — that is B06's item, later in the epic, after B01 (zod v4) has landed. This item only builds
  the gateway's OWN schemas and its own lint rule for gateway files.
- Confirm G16 has actually landed its `ChildProcessStub`/`StatsStub` before wiring step 5 — if it has
  not, report this item as blocked on G16 rather than building a placeholder stub here (that would
  create a second, competing definition G16's own work then has to reconcile).
- `z.instanceof` and `z.custom` behave the same across zod v3 and the installed `zod/v4` build per the
  2026-09-26 measurement this doc cites — but this item lands BEFORE B01 upgrades the whole repo to
  zod v4 as the DEFAULT import (not just an available build). Do not assume the measurement still holds
  after B01 without re-checking; leave a note under DECISIONS if anything about `.brand()` changed.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
