# B01: zod is upgraded to v4, and the v4-only breaks it causes are fixed

| | |
|---|---|
| Phase | Phase 3 — brands foundation |
| Source | `scrolls/brands-types-tests-rules.md` (BR), "Contracts and library types" intro and B1's zod-version ins-and-outs, lines 346-368 (the upgrade table); "A contract that holds itself", lines 269-320; "Build an object through its root contract's parse", lines 321-331 |
| Needs | [G15](g15-gateway-returns-unknown-not-caller-type.md) |
| Unblocks | [B06](b06-gateway-schema-fields-in-contracts.md), [B12](b12-require-object-contract-brands.md), [B17](b17-predicates-and-json-parse.md), and Z01–Z07 (the docs phase needs every item done) |
| Packages touched | Root `package.json`; `packages/@gateway/npm` (the pass-through home for `zod`); every package that lists `zod` directly today — see Current state; every contract file with a `z.function()` field or a fake-UUID literal, wherever they live |
| Checks to run | `lint,typecheck,unit` on every touched contract and its callers; add `integration` for any touched file that already has an integration test |
| Split | Operator splits into: (1) the version bump and `package.json` cleanup, one agent; (2) the 22 `z.function()` moves across 14 files, one agent; (3) the 451-literal-upper-bound `.uuid()` fixes across 68 files, batched 2-4 files per agent; (4) the five self-referencing contracts' getter rewrite, one agent; (5) the `.extend()`/`.pick()`/`.omit()`/`.partial()` brand fixes across 14 files, one agent |
| Runs alone | No — runs with any Phase 2 item whose files it does not touch |

## Why

Every rule in the brands doc (B01–B18) is written against zod v4's behavior. In zod v3, `.brand()` on an
object wraps it, and the wrapper has no `.shape`: `questContract.shape` is `undefined` at runtime and a
type error. Every `questContract.shape.id` reuse this epic depends on needs `.shape` to exist on a
branded object. The repo runs zod 3.25.76 today, which also ships a v4 build under the `zod/v4` subpath.
Both were checked against that package: v3 in `tmp/zod-recursive/proto-object-brand.ts`, v4 in
`proto-object-brand-v4.ts`. The upgrade has to land before B12 (the brand rule) or B06 (gateway schema
fields) can be built, because both write code that reads `.shape` off a branded object.

The upgrade is not a version bump alone. Four things break, measured 2026-09-25 against the `zod/v4`
build inside zod 3.25.76 (`tmp/zod-v4-probe.cjs`, `tmp/zod-v4-uuid-scan.cjs`):

| What changes in v4 | What it hits here |
|---|---|
| `z.function()` is no longer a schema. An object with a function field throws when it is declared: "expected a Zod schema". | 22 uses in 14 contract files. B9 (handled in [B14](b14-type-alias-and-adhoc-type-rules.md)) already puts functions outside the parse, so these fields move there. |
| `.uuid()` checks the version and variant digits. | 451 UUID-shaped literals in 68 files fail it, such as `'12345678-1234-1234-1234-123456789abc'`. v3 accepts them. Not every one reaches a `.uuid()` check, so 451 is an upper bound. Each becomes a real UUID, or its field uses v4's `z.guid()`, which keeps v3's looser check. |
| Error maps, `.superRefine` and `ZodError.errors` changed. | Not measured by the source doc. This item's agent measures it as part of the upgrade: run the full contracts test suite after the bump and read every new failure for one of these three causes before assuming it is unrelated. |
| A branded contract that holds itself needs a local type and a `z.core.$ZodType` annotation. | The five self-referencing contracts (see Work, step 4). Each moves from `z.lazy` to an annotated getter and drops its `as unknown as z.ZodType` cast. |

A fifth break, not in the doc's table but stated elsewhere in B01: in zod v4, `.extend()` on a branded
object returns an object without the brand, so the compiler refuses the result where the original type
is expected (`tmp/zod-v4-extend-probe.ts`). 14 contract files use `.extend()` today, and a few use
`.pick()`, `.omit()` or `.partial()`.

## Current state

Checked this session (2026-09-26) with a `python3` scan of every `package.json` under `packages/*` and
the root, for a `zod` entry in `dependencies`, `devDependencies` or `peerDependencies`:

| File | Version listed |
|---|---|
| `package.json` (root) | `^3.25.76` |
| `packages/@gateway/npm/package.json` | `^3.25.76` |
| `packages/mcp/package.json` | `^3.22.0` |
| `packages/cli/package.json` | `^3.22.4` |
| `packages/web/package.json` | `^3.22.4` |
| `packages/orchestrator/package.json` | `^3.22.4` |
| `packages/shared/package.json` | `^3.22.4` |
| `packages/server/package.json` | `^3.22.4` |
| `packages/tooling/package.json` | `^3.22.4` |
| `packages/hydration-recipes/package.json` | `^3.25.76` |
| `packages/session-forensics/package.json` | `^3.25.76` |
| `packages/eslint-plugin/package.json` | `^3.25.76` |
| `packages/hydration/package.json` | `^3.25.76` |
| `packages/ward/package.json` | `^3.25.76` |
| `packages/local-eslint/package.json` | `^3.25.76` |
| `packages/hooks/package.json` | `^3.25.76` |
| `packages/siegelense/package.json` | `^3.25.76` |

`packages/config/package.json` and `packages/testing/package.json` list no `zod` entry at all — confirm
whether they use zod transitively or not at all before assuming they need no change. This is today's
state, not the source doc's: the doc did not enumerate these files, so treat every row above as freshly
checked, not carried from the doc.

This confirms the item's premise: zod is declared directly in most packages' own `package.json`, at
three different version ranges (`^3.22.0`, `^3.22.4`, `^3.25.76`), not only as a gateway pass-through.
`packages/@gateway/npm/src/typescript-eslint__utils/typescript-eslint__utils.ts` and its sibling files
confirm the gateway package exists and already lists `zod`.

The five self-referencing contracts named by the source doc were not individually re-checked for exact
line numbers this session; confirm each still exists and still uses `z.lazy` before rewriting it (see
Work, step 4).

## Work

1. **Decide where the version lives, and check it resolves everywhere.** The doc's default position is
   that zod is a pass-through at `#gateway/npm/zod`, so one `package.json` — the gateway's — should carry
   the real version, and every other package should resolve to that copy through the workspace, not
   declare its own range. Recommended — the executing agent may change it with a reason in DECISIONS:
   bump `packages/@gateway/npm/package.json`'s `zod` to a real v4.x release (not the `zod/v4` subpath of
   3.25) if the gateway pass-through and every consumer resolve it under npm workspaces' hoisting; state
   the check you ran (a real `npm ls zod` or equivalent showing one resolved version) in your report.
   Update every other package's `package.json` that lists `zod` directly (see Current state) to match or
   to drop the direct dependency if it can resolve through the workspace instead. **The operator runs
   `npm install` — you do not.** Report what installs are needed and stop there if the change requires
   one.
2. **Move every `z.function()` field out of the parse.** 22 uses across 14 contract files. Each is a
   contract that mixes data and functions — B9's "a shape mixing data and functions is a contract for
   its data" (BR B9, "Ins and outs") already says how: the data members are parsed, and the functions are
   attached outside the parse, the way `browser-session-contract.ts` already does and
   `contracts-constraints.md:132-133` already teaches. Do not invent a new pattern; follow that one.
   ```typescript
   // before — a function field inside the parse (throws under v4)
   export const handleContract = z.object({
     stop: z.function(),
     flush: z.function(),
   });

   // after — the data half is parsed; functions are attached outside it
   export const handleDataContract = z.object({ /* whatever data fields exist */ }).brand<'HandleData'>();
   export type Handle = z.infer<typeof handleDataContract> & { stop: () => void; flush: () => Promise<void> };
   ```
3. **Fix every `.uuid()` break.** 451 UUID-shaped literals in 68 files is an upper bound — not every one
   reaches a `.uuid()` check. For each file: run its tests first under the bumped zod, read the real
   failure, and only then decide the fix. Two fixes, per field:
   - The literal is test data standing in for a real UUID: mint a real v4 UUID literal (any valid one;
     it does not need to be random per call unless the test asserts uniqueness).
   - The field's check should stay loose (any UUID-shaped string, not RFC 4122-strict): change that
     field's schema from `.uuid()` to `z.guid()`, which keeps v3's looser check. Do this only where the
     field's own contract, not a test fixture, needs the loose check — do not weaken a check to avoid
     fixing test data.
4. **Rewrite the five self-referencing contracts to the getter form.** `chat-entry-group-contract.ts`,
   `op-filter-contract.ts`, `playwright-json-report-contract.ts`, `quest-contract-property-contract.ts`
   and `widget-node-contract.ts` use `z.lazy`, a hand-written type and an `as unknown as` cast today. Each
   moves to the three-part getter form below, checked 2026-09-26 against zod v4
   (`tmp/zod-recursive/probe11.ts`, `probe12.ts`, `cross2/`):
   ```typescript
   // contracts/tree-node/tree-node-contract.ts
   const treeNodeFields = z.object({                          // 1. the fields, local and unbranded
     name: z.string().brand<'TreeNodeName'>(),
   });
   type TreeNodeSelf = z.infer<typeof treeNodeFields>         // 2. the recursive type, local
     & { children: TreeNodeSelf[] }
     & z.$brand<'TreeNode'>;

   export const treeNodeContract = z
     .object({
       ...treeNodeFields.shape,
       get children(): z.ZodArray<z.core.$ZodType<TreeNodeSelf>> {   // 3. a getter typed with it
         return z.array(treeNodeContract);
       },
     })
     .brand<'TreeNode'>();
   export type TreeNode = z.infer<typeof treeNodeContract>;
   ```
   The rules for this form, all five must follow:
   1. The field list and the local type are not exported. The exported type is `z.infer` of the
      contract.
   2. The field list carries no object brand of its own. Its leaves take the owner's texts.
   3. The local type ends in `z.$brand<'…'>` with the owner's text.
   4. The getter's return type wraps `z.core.$ZodType<Self>`, not `z.ZodType<Self>` — `z.ZodType`
      compares zod's older `_output` property, which `.brand()` leaves unbranded, so it refuses the
      contract.
   5. The getter is the only allowed form in `contracts/`. `z.lazy` and a cast to `z.ZodType` are
      refused there (this becomes a lint rule in [B12](b12-require-object-contract-brands.md); this item
      only needs the five files rewritten, not the rule built).

   `op-filter-contract.ts` also drops its hand copy of the op union while you are in the file — do not
   leave a second definition of the same union sitting beside the getter form.
5. **Fix every `.extend()`, `.pick()`, `.omit()` and `.partial()` break.** 14 contract files use
   `.extend()` today, plus a few using the other three. Under v4 each of these on a branded object
   returns an object with no brand, so the compiler refuses the result where the original branded type is
   expected. The new object gets its own brand from its own const name — it is a new object contract, not
   a reuse (BR B1, "Ins and outs" table row: "Part of another contract written inline... It is a new
   object... The owner plus the key: `'DealUser'`"). Fields it keeps are reuses, so they keep their
   source's brands. Do not try to preserve the original brand on the extended object; give it its own.
6. **Run the whole contracts test suite once all five fixes land**, and read every remaining failure for
   an error-map, `.superRefine` or `ZodError.errors` change (the doc's fourth "not measured" row). Report
   what you found, even if nothing broke.

## Done when

- [ ] Every `package.json` that declares `zod` resolves to one version repo-wide (state the check you
      ran).
- [ ] Every `z.function()` field is out of the parse, attached outside it, in all 14 files.
- [ ] Every `.uuid()` break is fixed with a real UUID literal or `z.guid()`, in all touched files.
- [ ] The five self-referencing contracts use the getter form, with no `z.lazy` or `as unknown as
      z.ZodType` left in any of them.
- [ ] Every `.extend()`/`.pick()`/`.omit()`/`.partial()` break is fixed with the new object's own brand.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.
- [ ] A report of what the error-map/`.superRefine`/`ZodError.errors` sweep found, even if "nothing".

## Traps

- Do not run `npm install`, `npm ci` or `npm link` yourself — report what install is needed and stop.
- Do not build any package as part of this item unless the next check you must run needs compiled
  output; report "build needed" instead.
- A branded object's `.shape` access (`questContract.shape.id`) is the whole reason for this upgrade;
  after the bump, spot-check that at least one such access compiles before declaring the item done.
- Fixing a `.uuid()` failure by weakening the field's check to `z.guid()` everywhere is not the default —
  only do it where the field's own semantics call for a loose check, not to avoid touching test data.

## Concessions made while executing

