# B18: a function returns what its calls told it, and `void` only when they told it nothing

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), R1 "a function returns what its calls told it, and `void` only when they told it nothing", lines 1593-1658; rows 2193, 2236 (moves from pre-edit to ward only); `StartOrchestrator.bootstrap()` may return `void`, line 2141; docs rows 2342 and 2365 |
| Needs | [A19](../a19-adapters-folder-type-gone-caller-rules-on.md) |
| Unblocks | Z01–Z07 |
| Packages touched | Every package with a function returning `Promise<{ success: true }>` or an equivalent single-value shape today — census fresh; known concrete case: `StartOrchestrator.bootstrap()` in `orchestrator` once `A02`'s forwarder-adapter deletion has landed (already a Phase 2 dependency via A19) |
| Checks to run | `lint,typecheck,unit,integration` — this rule needs the type checker, so failures may only surface at `typecheck`, but the behavior change (returning a real value instead of a constant) changes what tests assert, hence `unit`/`integration` too |
| Split | Operator splits per package, 2-4 files per agent — this is a wide, shallow migration (many small functions), not a deep one |
| Runs alone | No |

## Why

`{ success: true }` says nothing: it can only ever be `true`, because a failure throws instead. A caller
that gets it back learns only that nothing threw — which a resolved `Promise<void>` already says. It is
the `ContentText` pattern applied to returns: the old rule demanded a value, nothing checked that the
value said anything, and models returned a constant. 116 of 118 `adapterResultContract` parses were
exactly this shape.

```
// before — 116 of 118 adapterResultContract parses are this literal
export const fsRmIfExistsAdapter = async ({ filePath }: { filePath: string }): Promise<AdapterResult> => {
  try { await rm(filePath); } catch (error) { if (!isNotFoundError(error)) throw error; }
  return adapterResultContract.parse({ success: true });   // was the file there? the caller cannot tell
};

// after — a gateway wrapper returns what the handling learned. One fact, so a plain boolean
// packages/@gateway/node/src/fs__promises/rm-if-exists/rm-if-exists.ts
export const rmIfExists = async ({ filePath }: { filePath: string }): Promise<boolean> => {
  try { await rm(filePath); return true; }
  catch (error) { if (isFsError(error) && error.code === 'ENOENT') return false; throw error; }
};
```

```
// flagged — mkdir reported the first directory it created, and the wrapper threw that away
export const ensureDir = async ({ dirPath }: { dirPath: string }): Promise<void> => {
  await mkdir(dirPath, { recursive: true });
};
// flagged — rmIfExists said whether the file was there, and the broker threw that away
export const questCleanupBroker = async ({ filePath }: { filePath: string }): Promise<void> => {
  await rmIfExists({ filePath });
};
// flagged — a return that can hold only one value says nothing, so it counts as void
): Promise<{ success: true }> => …

// left alone — mkdir's own answer, passed on
export const ensureDir = async ({ dirPath }: { dirPath: string }): Promise<string | undefined> =>
  mkdir(dirPath, { recursive: true });
// left alone — writeFile and rename both return Promise<void>, so there is nothing to report
export const writeFileAtomic = async ({ filePath, contents }: { filePath: string; contents: string }): Promise<void> => {
  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, contents, 'utf8');
  await rename(tempPath, filePath);
};
```

**Which calls count:** calls to a gateway export or a broker whose result the function discards. Inside
the gateway, calls to the outside package count too. Built-in methods such as `array.push` or `map.set`
do not count. **Nothing is invented** — a function whose calls told it nothing genuinely returns `void`;
this rule does not make up a value to satisfy itself. **R1 sets a floor, not a ceiling** — a broker may
still return more than its calls told it, such as the updated quest.

`adapterResultContract` goes entirely — the `AdapterResult` shape this rule's predecessor pointed callers
at is deleted, since it is exactly the shape that said nothing.

`StartOrchestrator.bootstrap()` currently returns `{ success: true }`, which R1 counts as `void`. Once the
forwarder adapters that only wrapped it are deleted (Phase 2, already this item's Needs via A19) and this
rule lands, the bootstrap responders call `StartOrchestrator.bootstrap()` directly, and it may return
`void`.

## Current state

Confirmed by reading the source doc's own record of the committed I/O-trap work: `bootstrap()` is
described as returning `{ success: true }` as of commit `fe456add9`, and the doc explicitly says this
becomes `void` once R1 lands and the forwarder adapters (Phase 2) are gone. **Not independently
re-verified this session** — read `packages/orchestrator/src/startup/start-orchestrator.ts` fresh before
editing, since Phase 2 work may have already changed its return shape.

No rule folder named `enforce-folder-return-types` was part of this session's targeted scan (that scan
looked for brand/primitive-named folders specifically) — locate it at the start of this item; it is named
explicitly in the source doc as the rule this item rewrites, and is currently tagged `'pre-edit'` in
`dungeonmaster-rule-enforce-on-statics.ts` (confirmed file exists, tag content not independently
re-checked this session).

## Work

1. **Rewrite `enforce-folder-return-types`.** Today it always refuses `void`/`Promise<void>` and
   recommends `AdapterResult`. The new check: allow `void` **exactly when** every discarded call the
   function makes also returned `void`. A return type that can only ever hold one value (`{ success: true
   }`, `Promise<true>`, a single-member literal union with no real variance) counts as `void` for this
   purpose too — it is refused the same as an explicit `void` return would be refused if the calls it
   discarded returned something real.
2. **This needs the type checker** (to know what each discarded call's own return type is), so it **moves
   from pre-edit to ward only**. Remove its `'pre-edit'` tag in
   `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`.
   A wrong `void` is now caught by ward, not at the edit — this is a deliberate behavior change (row
   2236), not a bug to avoid.
3. **Census every function returning `Promise<{ success: true }>` or an equivalent single-value shape**,
   fresh (the 116-of-118 `adapterResultContract` figure is a pre-Phase-2 snapshot; most of these adapters
   are already gone or renamed by the time this item runs — find the current equivalents, likely now
   gateway wrappers or brokers).
4. **For each flagged function, trace what its discarded calls actually told it**, and return that instead
   of the constant:
   - A gateway wrapper around a Node/npm call that reports something real (existed, was created, byte
     count, etc.) returns that real value, typed as plainly as the fact allows (a `boolean` for a yes/no
     fact, per [B14](b14-type-alias-and-adhoc-type-rules.md)'s B6 — "one fact is better as `Promise<boolean>`
     than a one-field object").
   - A broker that only forwards a wrapper's own `void`/no-real-signal result stays `void`.
   - A broker that discards a call telling it something real (like `rmIfExists`'s existed/didn't-exist
     fact) must stop discarding it — pass the real value through, or use it to decide what to return.
5. **Fix every test asserting the old constant.** 87 adapter tests (pre-Phase-2 snapshot) assert the
   literal `{ success: true }` — each surviving test now asserts what the function actually returns, such
   as `resolves.toBeUndefined()` for an `mkdir` wrapper that created nothing new, or
   `resolves.toBe(true)`/`resolves.toBe(false)` for a real yes/no fact.
6. **Delete `adapterResultContract`** (its contract, stub, test, and every import) once its last caller is
   migrated.
7. **Confirm `StartOrchestrator.bootstrap()` may now return `void`.** Once Phase 2's forwarder-adapter
   deletion (A02, upstream of this item's A19 dependency) has removed every adapter that only wrapped
   `bootstrap()`, change its return type to `void` and update its one caller-facing test
   (`start-orchestrator.integration.test.ts`, which today asserts `bootstrap()` twice returns `{ success:
   true }` both times — per the committed I/O-trap record) to assert the new `void`/no-throw behavior
   instead.
8. **Read the wider context of the committed I/O trap work** (`packages/orchestrator/src/startup/start-orchestrator.ts`,
   its integration test, the server/mcp `orchestrator-bootstrap` adapters mentioned in the source doc's
   "Status" section) before touching any of it — this code was deliberately shaped this way as an interim
   step, explicitly waiting for R1 and the forwarder-adapter deletion to both land before it could be
   simplified further.

## Lint rules this item adds or changes

| Rule | Change | Pre-edit? |
|---|---|---|
| `enforce-folder-return-types` | Rewritten per R1: `void` allowed exactly when every discarded call also returned `void` (a single-value return type counts as `void`); message no longer recommends `AdapterResult` | **No — moves from `'pre-edit'` to ward only**, since it now needs the type checker |

## Teaching text this item changes

From BR "Architecture docs" (row 2342): "Same file [`architecture-overview-broker.ts`], new section:
Nothing on returns beyond the `void` ban" → "Return what your calls told you. `void` only when every
call you discard returned `void`. `{ success: true }` counts as `void`." Doc rule: R1.

From BR "Folder-type docs" (row 2365): "Every function-exporting folder's `*-constraints.md`: The `void`
ban, with `AdapterResult` as the way out" → "R1's wording, as in the `get-architecture` row." (i.e., every
per-folder-type constraints doc gets the same replacement text, not just the general architecture doc.)

Finished in full in [Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md);
this item should confirm the rule's final behavior and message text in its report so that phase copies
accurate wording.

## Done when

- [ ] `enforce-folder-return-types` is rewritten per R1, uses the type checker, and its `'pre-edit'` tag
      is removed from `dungeonmaster-rule-enforce-on-statics.ts`.
- [ ] `adapterResultContract` and every import of it are deleted.
- [ ] Every function that discarded a call telling it something real now returns that real value (or
      passes it through) instead of a constant.
- [ ] Every test asserting the old `{ success: true }` constant now asserts the real returned value.
- [ ] `StartOrchestrator.bootstrap()` returns `void` (confirmed Phase 2's forwarder-adapter deletion has
      landed first), with its integration test updated.
- [ ] `npm run ward -- --only lint,typecheck,unit,integration -- <touched files>` exits 0.

## Traps

- Do not invent a value where calls genuinely told the function nothing — `void` is still correct there;
  this rule does not ban `void`, it bans a `void` in disguise as a fake-informative constant.
- `StartOrchestrator.bootstrap()`'s return type depends on Phase 2 (forwarder-adapter deletion) having
  actually landed — check A02's/A19's status before changing it, or you will change a signature something
  else in Phase 2 still depends on.
- Removing the `'pre-edit'` tag is a real behavior change for every developer's edit-time feedback loop —
  a wrong `void` now only surfaces at `npm run ward`, not at the moment of the edit. This is deliberate,
  not an oversight — do not try to "fix" it by finding a way to keep it pre-edit.

## Concessions made while executing

