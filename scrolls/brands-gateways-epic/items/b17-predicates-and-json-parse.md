# B17: no type predicate onto our types; parsed JSON goes straight into a contract's parse

| | |
|---|---|
| Phase | Phase 4 — brands |
| Source | `scrolls/brands-types-tests-rules.md` (BR), C3 "a type predicate may narrow to a library type, never to one of our contract types", lines 1121-1159; C4 "parsed JSON goes straight into a contract's parse", lines 1161-1213; rows 2238, 2262-2264; docs row 2334 |
| Needs | [G15](../g15-gateway-returns-unknown-not-caller-type.md), [B01](b01-zod-v4.md) |
| Unblocks | Z01–Z07 |
| Packages touched | `hooks` (the `is-dungeonmaster-hooks-config` guard), `cli` (the `has-dev-dependencies` guard), and every file with a `JSON.parse`/`.json()` call that does not go straight into a contract's parse — census fresh at the start; the source doc's 2026-09-24 read found 87 of 139 production `JSON.parse` calls not going straight in, and none of 26 `response.json()` calls |
| Checks to run | `lint,typecheck,unit` |
| Split | One agent builds `ban-contract-type-predicates` (pre-edit, syntax) and fixes the two named guards; a second builds the C4 rule pair and fixes flagged `JSON.parse`/`.json()` call sites, batched 2-4 files |
| Runs alone | No |

## Why

**C3.** A guard written as `(value): value is X` tells the compiler "trust me". For a library union
that is normal narrowing — the compiler already trusts a real discriminated union's own tag. For one of
our contract types, it mints the type with no parse, which is a cast wearing a guard's clothes:

```
// before — hooks/src/guards/is-dungeonmaster-hooks-config/is-dungeonmaster-hooks-config-guard.ts:15
(value: unknown): value is DungeonmasterHooksConfig =>
  typeof value === 'object' && value !== null && 'preEditLint' in value;
// cli/src/guards/has-dev-dependencies/has-dev-dependencies-guard.ts:14
(params): params is { obj: { devDependencies: DependencyMap } } => …

// after — parse through the contract
const config = dungeonmasterHooksConfigContract.safeParse(value);
if (config.success) { … config.data … }
```

Most guards in the repo already return a plain `boolean` (all 52 in `shared`, all 26 in `siegelense` and
`web`, and all 23 that use the TSESTree copy in `eslint-plugin`, per the source doc's read) — the two
named above are the cases actually found. Casts mint brands the same way (`source as ModulePath`,
`imp.replace(...) as ImportPath`, `result.replace(pattern, '') as ErrorMessage`) and are already refused
by the rule that a brand is minted only by a parse; [B14](b14-type-alias-and-adhoc-type-rules.md)'s B6
removes most of these specific ones, since those values are loose and lose their brand under that item.

**C4.** Outside the gateway, the result of `JSON.parse(...)`, `response.json()`, or a gateway function
that returns `unknown` must be the direct argument of a contract's `.parse`/`.safeParse` — it may not be
stored, cast, returned or read first. Inside the gateway, `JSON.parse` follows the gateway's own rule
(cast to the package's type, or to `unknown` for our data) — this item does not touch gateway files.

```
// before — shared/src/adapters/fetch/get/fetch-get-adapter.ts:24 (folder now gone post-Phase-2; find its successor)
return JSON.parse(text) as TResponse;
// before — hooks/src/flows/hook-pre-edit/hook-pre-edit-flow.ts:20
const parsed: unknown = JSON.parse(inputData);
// before — web/src/transformers/format-tool-input/format-tool-input-transformer.ts:43-48
try { return JSON.parse(toolInput) as unknown; } catch { return undefined; }

// after
const quest = questContract.parse(await fetchJson({ url }));   // the gateway's fetchJson returns unknown
const hookInput = preEditHookInputContract.parse(JSON.parse(inputData));
try { return toolInputContract.parse(JSON.parse(toolInput)); } catch { return undefined; }
```

```
// flagged
JSON.parse(text) as Settings                           // a cast
(await fetchJson({ url })) as Quest                    // a gateway unknown, cast instead of parsed
const raw: unknown = JSON.parse(text);                 // stored before any check
JSON.parse(text).version                               // read before any check
return await response.json();                          // returned unchecked

// left alone
settingsContract.parse(JSON.parse(text))
statusContract.safeParse(await response.json())
questContract.parse(await fetchJson({ url }))           // fetchJson from #gateway/browser/fetch returns unknown
```

Storing the result as `unknown` and parsing it later is refused too — the rule is about *where the value
goes next*, checkable with no dataflow analysis, and the window between the two lines is exactly where
unchecked reads creep in. Malformed text throws before the contract runs — `safeParse` does not catch a
`JSON.parse` error, so a `try` around both, with a fallback, may sit in a transformer.

## Current state

Confirmed this session (2026-09-26): `packages/hooks/src/guards/` contains an
`is-dungeonmaster-hooks-config` folder (existence confirmed via this session's `packages/hooks` directory
reads while researching [B05](b05-other-library-type-copies.md); the guard's exact current body was
**not re-read this session** — read it fresh before editing). `packages/cli/src/guards/` was **not
checked this session** for `has-dev-dependencies` — confirm it still exists and still has the flagged
shape before treating it as live work.

`require-validation-on-untyped-property-access` (the existing rule C4 extends) — confirmed to exist in
name only via the source doc's citations; this session did not independently re-locate its file. Locate
it at the start of this item (likely under `packages/eslint-plugin/src/brokers/rule/` — search by name
with `discover`, since it was not part of this session's earlier rule-folder scan which targeted
brand/primitive-named folders specifically).

`require-gateway-unknown-parse` — confirmed not present as a rule folder name in this session's earlier
scan of `eslint-plugin`'s rule brokers (that scan did not target this specific name, so absence is not
fully confirmed — re-check at start).

The 87-of-139 and 26-of-26 `JSON.parse`/`.json()` figures are a 2026-09-24 snapshot; re-scan fresh.

## Work

1. **Build `ban-contract-type-predicates` (C3).** Refuses a type predicate (`(value): value is X`) whose
   target type `X` is imported from a `contracts/` path, or is an indexed type such as `Quest['id']`.
   Syntax only — pre-edit. [B14](b14-type-alias-and-adhoc-type-rules.md)'s B5 already bans every other
   alias of a field's type, so a branded type cannot reach a predicate under another aliased name — this
   rule does not need to chase aliases itself, only the two direct forms.
2. **Fix the two named guards** (and any others the fresh census finds): rewrite each as a `safeParse`
   check through the contract, returning the parsed, branded data on success rather than merely narrowing
   an `unknown`/loose type with no check.
3. **Extend `require-validation-on-untyped-property-access` for C4's syntax half.** Catches `JSON.parse`
   and `.json()` calls by walking up from the call through `await` and parentheses, requiring a `.parse`
   or `.safeParse` call as the direct consumer. Drop its existing `-adapter.ts` file exemption (the
   `adapters/` folder type is gone post-Phase-2 — A19 — so this exemption is dead code by the time this
   item runs; confirm and remove it). Skip gateway files, which follow the gateway's own separate
   `JSON.parse` rule. Pre-edit — syntax only.
4. **Build `require-gateway-unknown-parse` as the split-off type-checker half.** A call to a function
   imported from `#gateway` whose return type is `unknown` or `Promise<unknown>` gets the same
   "must go straight into a parse" walk. This needs the type checker (to know the function's return type
   resolves to `unknown`), so it is **ward only**, split from the syntax-only rule above per BR's naming
   convention for split rules.
5. **Census every `JSON.parse`/`.json()` call site fresh** and fix every flagged one: either it already
   parses through a contract directly (leave alone), or it needs converting to do so (store nothing,
   cast nothing, read nothing off the raw result first).
6. **Confirm both rules were scanned over the whole repo and hand-checked** before being switched on (they
   are pre-edit/ward-eligible immediately, per the source doc — these are not "landed off" rules the way
   [B12](b12-require-object-contract-brands.md)/[B13](b13-owner-field-reuse.md)'s were; C3 and C4 do not
   appear in EPIC.md's "lands OFF" list, so they should switch on directly once built and verified).

## Lint rules this item adds or changes

| Rule | What it refuses | Pre-edit? |
|---|---|---|
| `ban-contract-type-predicates` (C3) | A type predicate targeting a `contracts/`-imported type, or an indexed type (`Owner['key']`) | **Yes** — syntax only |
| `require-validation-on-untyped-property-access` (extended, C4 syntax half) | `JSON.parse`/`.json()` not going straight into `.parse`/`.safeParse`, through `await`/parens; storing, casting, or reading a property first. Drops the `-adapter.ts` exemption. Skips gateway files. | **Yes** — syntax only |
| `require-gateway-unknown-parse` (new, C4 type-checker half) | A `#gateway`-imported function returning `unknown`/`Promise<unknown>`, not going straight into a parse | **No** — needs the type checker |

## Teaching text this item changes

From BR "Architecture docs" (row 2334): `architecture-overview-broker.ts`, line 336: `` const data =
JSON.parse(response) as ApiResponse;  // ✅ you know what the compiler cannot `` → `` const data =
apiResponseContract.parse(JSON.parse(response)); ``. Doc rule: C4.

Finished in full in [Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md);
this item should leave the example above verified against real code before that phase copies it in.

## Done when

- [ ] `ban-contract-type-predicates` exists, is pre-edit, and both named guards (and any others the fresh
      census finds) are fixed to parse instead of predicate.
- [ ] `require-validation-on-untyped-property-access` is extended for C4's full syntax scope, with the
      dead `-adapter.ts` exemption removed.
- [ ] `require-gateway-unknown-parse` exists, is ward-only, and correctly identifies `#gateway` functions
      returning `unknown`.
- [ ] Every `JSON.parse`/`.json()` call site in production code (outside the gateway) goes straight into
      a contract's parse, with nothing stored, cast, or read first.
- [ ] Both new/extended rules were scanned over the whole repo and hand-checked.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- The `-adapter.ts` exemption on the existing rule is dead weight once `adapters/` is gone — removing it
  may surface new violations in files that used to be exempt; fix them, do not re-exempt.
- `safeParse` does not catch a `JSON.parse` syntax error — a `try`/`catch` around both calls together, not
  around the parse alone, is the correct shape when malformed input needs a fallback.
- Do not chase every alias of a branded type for C3 — [B14](b14-type-alias-and-adhoc-type-rules.md)'s B5
  already removes aliases, so this rule only needs the two direct forms (a `contracts/`-imported type, or
  an indexed type).

## Concessions made while executing

