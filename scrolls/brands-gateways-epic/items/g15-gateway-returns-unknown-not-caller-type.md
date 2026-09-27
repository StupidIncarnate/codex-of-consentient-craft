# G15: A gateway function returns a real type or `unknown`, never a type its caller picks

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 22, lines 522-557; `scrolls/brands-types-tests-rules.md` C4 (the gateway-`unknown` parts), lines 1161-1213 |
| Needs | nothing |
| Unblocks | [B01](b01-zod-v4.md), [B17](b17-predicates-and-json-parse.md) (both need this rule in place first) |
| Packages touched | `eslint-plugin` (new rule), `@gateway/node`, `@gateway/browser` (drop the two type parameters) |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

## Why

A gateway function must never cast its return value to a type its CALLER picked — that would be the
caller claiming what the data is, with nothing checking the claim. For our own data, the gateway
returns `unknown` and the caller parses it through a contract (the gateway cannot import our contracts,
so it cannot do this itself). A cast to a type the outside package declares, or a type the gateway
itself declares, is fine — that names a real type instead of copying one. Two gateway functions break
this today by taking a type parameter and casting to it: `fetchJson` (both the node and browser copies)
and `dynamicImport`. Nothing currently stops a caller writing `const quest: Quest = await
fetchJson(...)` and getting an inferred, unchecked cast.

## Current state

Checked 2026-09-26 against the code:

- `packages/@gateway/node/src/fetch/fetch-json/fetch-json.ts` takes `<TResponse>` and returns
  `Promise<TResponse>`, casting with `return JSON.parse(text) as TResponse;`.
- `packages/@gateway/browser/src/fetch/fetch-json/fetch-json.ts` is the same shape:
  `<TResponse>` in, `return JSON.parse(text) as TResponse;` out.
- `packages/@gateway/node/src/module/dynamic-import/dynamic-import.ts` takes `<T = unknown>` and
  returns `import(path) as Promise<T>`.
- **No production caller outside the gateway itself imports `fetchJson` or `dynamicImport` today.** A
  repo-wide search (excluding the gateway's own folder) for `\bfetchJson\b` and `\bdynamicImport\b`
  found zero matches on 2026-09-26. This means step 3 of the Work list below — "move every caller" —
  currently has nothing to move. Re-check this before starting: by the time this item is picked up, a
  caller may have appeared.
- Both functions' own tests pass the type parameter explicitly:
  `fetch-json.test.ts` (node): `const result = await fetchJson<{ id: string }>({...})`.
  `fetch-json.test.ts` (browser): the same, plus one case with `<never>` to type an expected `Error`.
  `dynamic-import.test.ts`: `const result = await dynamicImport<{ dynamicImport: unknown }>({...})`.
  Once the type parameter is dropped, these calls no longer compile as written — the test files need to
  change to work with a plain `unknown` return, typically by asserting the parsed shape directly rather
  than typing the call.
- `node/src/fs__promises/read-json-file/read-json-file.ts` is the source doc's own example of a
  function that ALREADY complies (declared return type `unknown`, with a `JSON.parse` inside) — read it
  as a model for what "left alone" looks like once this rule exists, though it is worth re-confirming
  its return type still reads `unknown` before citing it as the pattern.

## Work

1. **Build the rule.** A new lint rule, gateway files only, that needs the type checker (so it runs in
   ward's typecheck-backed lint pass, not pre-edit). It refuses:

   | Refused | Example |
   |---|---|
   | A cast whose target is a type parameter of the enclosing function | `JSON.parse(text) as T` |
   | A return type that is a bare type parameter, or a `Promise` of one | `async <T>(…): Promise<T>` |
   | An `any` leaving the function, from `JSON.parse` or `import()` | `const data = JSON.parse(text); return data;` in a function with no return type |

   It leaves alone a type parameter that only passes the caller's own value through unchanged (a
   generic array helper, for example), and any cast to `unknown` or to a type the outside package or
   the gateway declares. A `JSON.parse` inside a function whose declared return type is `unknown`
   passes.
2. **Change `fetchJson` (both copies) and `dynamicImport` to drop their type parameter and return
   `unknown` / `Promise<unknown>`.** Update each function's own `USAGE` comment (no more
   `<{ id: string }>` in the example) and its test file to work against an `unknown` result — the test
   still proves the wrapper parses real JSON and handles the same failure cases, it just does not lean
   on an inferred cast to do it. `dynamic-import.ts`'s own PURPOSE comment currently promises a typed
   `Promise<T>` in its `USAGE` block; rewrite that too (this same fix is also listed under item 46,
   "Review every `PURPOSE` comment", but do it here rather than leaving a comment that no longer matches
   the code).
3. **Move every caller to `contract.parse(await fetchJson(...))`, or to a contract parse of the
   imported module for `dynamicImport`.** Per "Current state," there are none today — re-check with a
   fresh search before skipping this step, since a caller may exist by the time this item runs. If a
   caller appears, this is exactly what BR's C4 example shows:

   ```typescript
   // after
   const quest = questContract.parse(await fetchJson({ url }));   // fetchJson returns unknown
   ```

   The typecheck after step 2 is what finds every affected caller — dropping the type parameter turns
   every inferred-cast call site into a type error, so `npm run ward -- --only typecheck` on the
   packages that import these functions is the actual "find every caller" mechanism, not a text search.

## Lint rules this item adds or changes

- **`gateway-returns-real-type-or-unknown`** (name is a placeholder — the executing agent may pick a
  clearer one and record it under DECISIONS): gateway files only, needs the type checker so it runs
  in ward's lint pass, not pre-edit. Refuses the three shapes in the table above. No autofix (the
  correct fix — pick `unknown` vs. a real declared type — is a judgment call per function).

## Teaching text this item changes

None yet. The gateway folder-type doc (Z01) already lists "Return types: the package's type, a
gateway-declared type, or `unknown`" as a topic pointing at this item (item 22) — that doc gets written
in Phase 6, once every code item, including this one, has landed. Do not write it now.

## Done when

- [ ] The new lint rule exists, targets gateway files only, and is registered in
      `src/startup/start-eslint-plugin.ts`, `config-dungeonmaster-broker.ts`, and
      `dungeonmaster-rule-enforce-on-statics.ts` (post-edit, since it needs the type checker).
- [ ] `fetchJson` (node and browser) and `dynamicImport` return `unknown` / `Promise<unknown>` with no
      type parameter.
- [ ] Every caller found by the post-fix typecheck (zero, as of 2026-09-26, but re-verified) is updated
      to parse the result through a contract.
- [ ] A scan of the whole repo with the rule on shows only the two functions above as pre-existing
      violations, both now fixed.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <files touched>` exits 0.

## Traps

- Do not build the rule so broadly that it flags a generic helper that only forwards its caller's own
  type parameter through untouched (e.g. a wrapper around `Array.prototype.map`) — that shape is
  explicitly left alone. Test both the flagged and the left-alone cases from BR's own C4 examples (in
  "What dungeonmaster ships" section is unrelated; the C4 examples are directly under its own heading)
  before switching the rule on.
- This rule needs the TypeScript type checker (to resolve "is this type a type parameter of the
  enclosing function"), which most gateway rules so far (`gateway-colocation`,
  `gateway-pure-reexport-statement-types`) do not need. Confirm `eslintRuleTesterAdapter` and the
  project's rule-testing setup support a type-aware rule before assuming the existing RuleTester
  pattern works unchanged — some type-aware rules need `parserOptions.project` pointed at a real
  tsconfig, which a RuleTester code string does not automatically get.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
