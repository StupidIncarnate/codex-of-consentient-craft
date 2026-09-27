# B06: a contract field that holds a gateway type reuses the gateway's schema, branded `#Gateway<Type>`

| | |
|---|---|
| Phase | Phase 3 — brands foundation |
| Source | `scrolls/brands-types-tests-rules.md` (BR), C9 "a contract field that holds a gateway type reuses the gateway's schema, branded `#Gateway<Type>`", lines 1529-1589; `StubArgument` row, line 2213 (with its type-level test); rule `enforce-gateway-schema-fields`, line 2268; docs rows, lines 2362 and 2388 |
| Needs | [G20](../g20-gateway-schemas-gateway-brand.md), [B01](b01-zod-v4.md) |
| Unblocks | Z01–Z07 |
| Packages touched | Every contract file with a field holding an outside package's type today — census this at the start; known candidates from the source doc's own examples: work-item-like contracts holding a `ChildProcess`, scan-result-like contracts holding gateway `fs` results (e.g. walked files). `packages/shared` is the most likely home for the widest-used ones. |
| Checks to run | `lint,typecheck,unit` |
| Split | One agent per contract family found in the census, 2-4 files each |
| Runs alone | No |

## Why

Some of our objects hold a value of an outside package's type: a work item holding a `ChildProcess`, a
scan result holding the `WalkedFile`s that `#gateway/node/fs` returned. Today this is written as a bare
`z.custom<ChildProcess>()`, which infers the TypeScript type `ChildProcess` and makes the field required
in the type — but checks nothing at runtime. It accepts a missing field and any junk, in both zod v3 and
v4 (checked 2026-09-26 against zod 3.25.76 and its `zod/v4` build, `tmp/zod-lib-field/`). `z.instanceof`
is a real check but is a *second* check for a type the gateway already owns and already checks once.

The fix: the gateway exports one schema per outside type it owns, beside the type itself, branded
`'#Gateway<Type>'` — `childProcessSchema` beside `child_process.ts`, `walkedFileSchema` beside the `fs`
subpath's walk-files code. Our contract reuses that schema exactly the way B4 reuses another owner's
field — it is not a new brand, it is the gateway's one check, shared by every contract that holds that
type:

```ts
// before — a bare custom schema: the type says ChildProcess, the runtime checks nothing
proc: z.custom<ChildProcess>(),

// after — the gateway exports the schema (child_process/child-process/child-process-schema.ts, fs/walk-files-sync/walked-file-schema.ts)
export const childProcessSchema = z.instanceof(ChildProcess).brand<'#GatewayChildProcess'>();
export const walkedFileSchema = z.custom<WalkedFile>((v) => isWalkedFile(v)).brand<'#GatewayWalkedFile'>();

// our contract reuses it
import {childProcessSchema} from '#gateway/node/child_process';
import {walkedFileSchema} from '#gateway/node/fs';

export const scanContract = z
  .object({
    id: z.string().brand<'ScanId'>(),
    proc: childProcessSchema,              // ChildProcess & brand '#GatewayChildProcess'
    files: z.array(walkedFileSchema),      // WalkedFile & brand '#GatewayWalkedFile'
  })
  .brand<'Scan'>();
```

The `#Gateway` prefix is deliberate and shared on purpose: every contract holding a `WalkedFile` carries
`'#GatewayWalkedFile'`, whatever key it sits under, so one brand text always means the gateway's one
check. No text B3 derives (the normal owner-plus-key brand naming) starts with `#`, so the two brand
families never collide.

## Current state

Confirmed this session (2026-09-26): no `*-schema.ts` file exists anywhere under `packages/@gateway/`
today (a walk of the whole `packages/@gateway` tree for any filename containing `schema` found only
`zod-to-json-schema.ts` and its test — an unrelated npm-package wrapper, not a `#Gateway<Type>` schema).
**This confirms G20 has not landed yet.** This item cannot start until it has; do not attempt to write
the gateway's own schema files as part of this item — that is G20's job. This item's job is entirely on
the contract side: find every contract field that should reuse one of G20's schemas, and make it do so.

The specific contracts named in the source doc's own examples (a work item holding a `ChildProcess`, a
scan result holding `WalkedFile`s) were **not located this session** — they may be illustrative rather
than literal file names from this repo. Census the real contract fields holding outside-package types
before starting; do not assume the doc's `scanContract`/`proc`/`files` example names a real file.

`mcpServerClientContract`'s `process: z.unknown()` field (named in BR "Found along the way" and in
`b02-contract-index-and-unused-contracts.md`'s Current state) looked like a C9 candidate at first glance,
but it is not: that contract has no production importer at all and is simply deleted (by `b02` or `b05`,
whichever runs first) rather than migrated to a gateway schema.

## Work

1. **Wait for G20.** Confirm `#Gateway<Type>` schemas exist in the gateway (e.g.
   `childProcessSchema`, `walkedFileSchema`, or whatever set G20 actually ships) before starting. If
   dispatched early, report it as blocked.
2. **Census every contract field that holds an outside package's type today.** Look for `z.custom<T>()`
   and `z.instanceof(...)` inside any `*-contract.ts` file in every workspace package, where `T` or the
   instance's class comes from an npm package or Node built-in rather than from our own `contracts/`.
   `z.unknown()` fields that comment-describe an outside type (like the dead `mcpServerClientContract`
   example, and possibly others that are alive) are also candidates — but confirm each is actually parsed
   in production (per C1) before spending time branding a dead field; a dead one is `b02`'s or `b05`'s job
   to delete, not this item's job to migrate.
3. **For each live field, replace the bare `z.custom`/`z.instanceof` with the gateway's schema import**:
   ```
   // flagged — in contracts/
   proc: z.custom<ChildProcess>(),                         // checks nothing at runtime, in zod v3 and v4 alike
   proc: z.instanceof(ChildProcess),                       // a second check for a type the gateway owns
   walked: z.custom<WalkedFile>(isWalkedFile).brand<'#GatewayWalkedFile'>(),   // a copy of the gateway's schema

   // left alone
   proc: childProcessSchema,
   files: z.array(walkedFileSchema).default([]),
   ```
   A class and plain data take the same shape at the call site (import the gateway's schema and reuse
   it); the difference between `z.instanceof` (classes, like `ChildProcess`, Playwright's `Page`) and
   `z.custom` with a check (plain data, like `WalkedFile`) is the gateway's business, not this contract's
   — this item never writes a `z.custom`/`z.instanceof` itself, it only imports.
4. **Confirm the parse keeps the value itself, not a copy.** `parsed.proc === proc` must be `true` after
   the parse — methods and getters must survive, such as `stats.mtime` and `proc.kill()`. Write or run a
   test that asserts this identity for at least one migrated field per contract family, since a `.extend()`
   elsewhere in the same file could otherwise silently break it (checked against zod 3.25.76's v4 build,
   `tmp/zod-lib-field/`, as "the parse keeps the value itself").
5. **A plain value now needs a parse to get in.** Spreading a raw `WalkedFile` straight from a gateway
   call into a `Scan`-shaped object without a parse fails to compile once the field is branded. Callers
   that build these objects need `scanContract.parse({ …, files })`, or `walkedFileSchema.parse(file)` for
   one value — fix every caller the type-check surfaces, do not suppress the error.
6. **Update `StubArgument`** (`packages/shared/src/@types/stub-argument.type.ts`) so it leaves any field
   whose brand starts with `#Gateway` exactly as it is — no recursion into its members, no brand
   stripping. Today it recurses into every object field, making each member optional, which is why a
   class such as `ChildProcess` currently accepts `{ pid: 5 }` in a stub call; that has to stop for
   `#Gateway`-branded fields specifically, while every other field keeps today's behavior.
   ```typescript
   // after: a stub call for a contract holding a #Gateway-branded field must pass the gateway's own stub
   ScanStub({ proc: ChildProcessStub() })   // compiles
   ScanStub({ proc: { pid: 5 } })           // fails to compile: not the gateway's stub
   ```
   Stripping the brand via `Omit` was tried and fails for classes — TypeScript's `Omit` rebuilds the
   type and breaks methods that return `this`, such as `addListener` (checked 2026-09-26). Do not retry
   that approach; leave the field untouched instead.
7. **Add a type-level test for the `StubArgument` change** — this is the "type-level test in
   `@dungeonmaster/shared`" the source doc calls for specifically (BR C9's "How a machine checks it"
   closing line: "`StubArgument`'s change is a type-level test in `@dungeonmaster/shared`"). Confirm the
   test actually fails when the change is reverted (the standing "prove your tests bite" rule from
   `agent-brief.md`).

## Lint rules this item adds or changes

**`enforce-gateway-schema-fields`** — syntax only, so it runs pre-edit.

| What it checks | Where | Message |
|---|---|---|
| No `z.custom` or `z.instanceof` anywhere in `contracts/` | Every `z.object(...)` call, at any depth | `{{key}} uses z.custom/z.instanceof directly. A field holding an outside package's type reuses the gateway's schema, imported from #gateway.` |
| A field whose value must be an outside package's type has only one way in: a schema imported from `#gateway` | Same scope | (same rule; the "left alone" case is exactly a `#gateway`-imported schema identifier used as the field value) |

This rule is new work for this item unless another item has already built it — check before duplicating.
If it does not exist yet when this item starts, build it as part of this item's work, since the caller
migration and the rule that enforces it going forward are the same change in practice (there is nothing
to migrate callers *to* without the rule naming what "the gateway's schema" means structurally).

## Teaching text this item changes

From BR "Folder-type docs: `get-folder-detail`", new section (line 2362): "A field holding an outside
package's type reuses the gateway's schema, branded `'#Gateway<Type>'`. Never `z.custom` or
`z.instanceof` in a contract."

From BR "Testing patterns: `get-testing-patterns`", new section (line 2388): "A contract field branded
`'#Gateway<Type>'` takes the gateway's stub in a stub argument: `ScanStub({ proc: ChildProcessStub() })`.
A partial fake does not compile."

Both are folded into the general Z-phase doc sweep
([Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md)); this item should
leave both statements true for the packages it touches, but the doc files themselves are edited in the
Z phase, not here — unless no later item will touch that specific doc section, in which case write it now
and note it in your report so the Z-phase agent does not duplicate the edit.

## Done when

- [ ] Every live contract field holding an outside package's type imports the gateway's `#Gateway`-branded
      schema instead of writing its own `z.custom`/`z.instanceof`.
- [ ] `parsed.field === originalValue` holds for at least one migrated field per family (identity
      preserved through the parse).
- [ ] Every caller that built one of these objects from a raw gateway value now parses it in.
- [ ] `StubArgument` leaves `#Gateway`-branded fields untouched, with a type-level test that fails when
      reverted.
- [ ] `enforce-gateway-schema-fields` exists, runs pre-edit, and is confirmed against a reintroduced
      `z.custom<ChildProcess>()` mutation.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- Do not start before G20 is `done` (confirmed not landed this session — no `*-schema.ts` file exists
  anywhere in the gateway yet).
- The doc's `scanContract`/`ChildProcess`/`WalkedFile` example is illustrative — find the real fields in
  this repo rather than searching for a file named `scan-contract.ts`.
- `Omit`-based brand stripping for class fields was already tried and rejected (breaks `this`-returning
  methods) — do not re-attempt it.
- `mcpServerClientContract` is a decoy: it looks like a C9 candidate but is dead code for `b02`/`b05` to
  delete, not for this item to migrate.

## Concessions made while executing

