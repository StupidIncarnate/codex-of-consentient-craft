# B07: `contracts/`, `transformers/`, `statics/` and `bindings/` allow layer files; `statics/` allows a regex

| | |
|---|---|
| Phase | Phase 3 — brands foundation |
| Source | `scrolls/brands-types-tests-rules.md` (BR), C7 "contracts, transformers, statics and bindings may split into layer files", lines 1382-1466; B2's statics pattern, lines 463-481; rows 2198, 2199, 2202, 2231, 2237 ("Today's rules and docs that change"); docs rows 2340 and 2356 |
| Needs | [P0-1](../p0-1-baseline-ward.md) |
| Unblocks | Z01–Z07. Cross-reference: the brand-text checks of contract layers (whether a layer's texts follow the parent's key) belong to `require-object-contract-brands-indexed`, built in [B12](b12-require-object-contract-brands.md) — this item builds the *structural* allowance (config flag, `enforce-project-structure`, colocation rules) and the statics-regex allowance; it does not build the brand-text check itself. |
| Packages touched | `shared` (`folder-config-statics.ts`, `enforce-import-dependencies`/`enforce-regex-usage`/`enforce-implementation-colocation` rule configs), plus any package with a `statics/` file over 300 lines that needs the regex allowance immediately (see Current state) |
| Checks to run | `lint,typecheck,unit` |
| Split | One agent: this is mostly config-flag and rule-config work in one file (`folder-config-statics.ts`) plus the `enforce-implementation-colocation` behavior change |
| Runs alone | No |

## Why

Today only `flows/`, `adapters/`, `brokers/`, `responders/` and `widgets/` allow layer files — the
architecture's way to split a file past 300 lines: `{name}-layer-{suffix}`, flat beside the parent,
imported only by the parent. Four more folder types need this because the brand rules ([B12](b12-require-object-contract-brands.md)
onward) make every object, nested object and field carry a brand, which makes contracts longer, and their
stubs with them:

| Folder type | Files over 300 lines (2026-09-24) | Largest | Why it grows under the brand rules |
|---|---|---|---|
| `statics/` | 20 | `eslint-rule-statics.ts`, 1,036 lines | Shared regex patterns move here ([B12](b12-require-object-contract-brands.md)'s B2) |
| `transformers/` | 5 | `next-action-transformer.ts`, 619 lines | Parsing of outside text stays here (C1) |
| `contracts/` | 2 | `step-contract.ts`, 396 lines | Every object, nested object and field carries a brand ([B12](b12-require-object-contract-brands.md)'s B1) |
| `bindings/` | 1 | `use-quest-chat-binding.ts`, 961 lines | — |

`guards/`, `errors/`, `middleware/` and `state/` stay without layers: none has a file over 300 lines
today, and the largest is 288 (2026-09-24 figures — re-check before assuming they still hold, since other
items may have added lines to these folders by the time this item runs).

Separately, `statics/` needs to allow a regex literal. A format check that many owners need (a path
pattern, for instance) lives in `statics/` as a pattern, so contracts across the repo can share one regex
instead of each writing its own inline. Contracts may already import `statics/`, so this adds no new
folder type and no new type name:

```typescript
// statics/path/path-statics.ts
export const pathStatics = { absolutePattern: /^(\/|[A-Za-z]:\\)/u } as const;
// guild-contract.ts
path: z.string().regex(pathStatics.absolutePattern).brand<'GuildPath'>(),
```

Two rule changes make this work, both this item's job: `statics/` joins the folders that may hold a
regex (today `enforce-regex-usage` allows regex literals only in `contracts/`, `guards/` and
`transformers/`), and a statics file needs a colocated test only when it holds a regex, not the "every
layer carries its own test" default that `enforce-implementation-colocation` applies today — because the
rest of a statics file is data, and a regex is logic.

## Current state

Confirmed this session (2026-09-26) by reading `packages/shared/src/statics/folder-config/folder-config-statics.ts`:

- The `statics` entry has `allowsLayerFiles: false` and `allowRegex: false` today, exactly as the doc
  describes.
- The `contracts` entry has `allowsLayerFiles: false` and `allowRegex: true` **already** — this
  contradicts the doc's row 2198 claim that `contracts/` needs no change to `allowRegex` (the doc's own
  table lists `allowRegex` as a *statics* change, not a contracts one, and this checked reading confirms
  `contracts` already has it true — so nothing to do there for regex; only `allowsLayerFiles` is false and
  needs to flip to `true` for `contracts`).
- `transformers` and `bindings` entries' current `allowsLayerFiles`/`allowRegex` values were **not
  individually re-read this session** — read them before editing; do not assume both are `false` without
  checking, since the pattern above shows a config entry can already partially match the target state.
- The specific file-over-300-lines figures (`eslint-rule-statics.ts` at 1,036 lines, etc.) were **not
  re-counted this session** — treat them as the doc's 2026-09-24 snapshot, not a live count; re-derive
  with a line count if the "Done when" checklist needs a fresh number.
- No `enforce-implementation-colocation` behavior change for "statics needs a test only when it holds a
  regex" was found in place — this is new work.

## Work

1. **Set `allowsLayerFiles: true` for `contracts`, `transformers`, `statics` and `bindings`** in
   `packages/shared/src/statics/folder-config/folder-config-statics.ts`. Confirm each entry's current
   value first (see Current state) rather than assuming all four are `false` — at least `contracts`
   appears to already have `allowRegex: true`, so read the whole file's four entries before editing any of
   them.
2. **Set `allowRegex: true` for `statics`** in the same file, if not already true (confirmed false this
   session).
3. **`enforce-project-structure` reads `allowsLayerFiles`** — confirm it already reads the flag generically
   (it should, since the flag already drives the five folder types that allow layers today) rather than
   hardcoding a folder-type list; if it hardcodes a list, add the four new folder types to it. This half
   of the rule is syntax-only and runs pre-edit, as it does today.
4. **`enforce-implementation-colocation` applies each folder type's own test and proxy requirements to its
   layers.** A layer file in any of the four new folder types gets the same colocation rule its folder
   type already has for a non-layer file — a `contracts/` layer gets a test per the contract test rule
   ([B12](b12-require-object-contract-brands.md) and the stub rule cover *what* a contract's test looks
   like; this item only ensures the colocation *requirement* extends to layer files structurally).
5. **Change `enforce-implementation-colocation`'s statics rule**: a statics file needs a colocated test
   only when it holds a regex, not unconditionally. This needs reading the file's content (whether it
   contains a regex literal), so it stays in the same category ward already runs it in today
   (`'post-edit'`, not `'pre-edit'` — this is a content read, and the pre-edit hook may not read file
   content beyond the file being edited itself; confirm this is compatible with pre-edit's rule before
   assuming it stays post-edit only, since the file being edited *is* the statics file itself here — if
   the rule can read only the file being edited (its own new text), it may qualify for pre-edit; if it
   needs to read other files, it does not. Read the existing rule's implementation before deciding, and
   report the actual pre-edit tag you set with the reason.)
   ```
   before: all 324 statics files have a colocated test, and 178 of those tests are a single
   toStrictEqual that restates the whole object.
   after: a statics file needs a test only when it holds a regex.
   ```
6. **A layer contract's brand-text check is NOT this item's job.** `require-object-contract-brands-indexed`
   (built in [B12](b12-require-object-contract-brands.md)) is what derives a layer contract's expected
   brand text from its parent's key and checks that exactly one file imports it. This item only makes the
   *structural* allowance (the folder type may hold a layer file at all, and gets the same colocation
   rules as its parent type) — do not build the brand-text check here; cross-reference it in your report
   so [B12](b12-require-object-contract-brands.md)'s agent knows this item has landed the structural half.
7. **A layer contract gets a test, not a stub.** This is a rule *about contracts*, so note it for
   [B12](b12-require-object-contract-brands.md)'s agent rather than building the enforcement here — this
   item's colocation change (step 5) is generic across folder types and does not special-case "no stub for
   a layer contract" on its own.
8. **A stub file in `contracts/` also splits into layers.** Confirm `enforce-implementation-colocation`'s
   pairing (contract ↔ stub) still works when the stub itself is split:
   ```text
   contracts/assistant-stream-line/assistant-stream-line.stub.ts      the parent: re-exports its layers
   contracts/assistant-stream-line/tool-use-layer.stub.ts             the stubs for one part of the line
   ```
   A stub layer is re-exported by its parent stub file — this is the one re-export of a stub that C6
   (built in [B03](b03-package-exports-and-per-file-test-imports.md)) allows. Coordinate with B03's agent if both
   items are active at once so the barrel rule and this colocation rule agree on the exception.

## Lint rules this item adds or changes

| Rule | Change | Pre-edit? |
|---|---|---|
| `enforce-project-structure` | Reads `allowsLayerFiles: true` for `contracts`, `transformers`, `statics`, `bindings` (config change, not a rule-logic change, unless the rule hardcodes today's five folder types) | Yes, as today |
| `enforce-regex-usage` | No code change; reads `allowRegex: true` from the `statics` config entry | Yes, as today |
| `enforce-implementation-colocation` | A statics file needs a colocated test only when it holds a regex (a content read); applies each folder type's own test/proxy rules to its layers in the four new folder types | Report the pre-edit status you determine after reading the current implementation — do not assume `'post-edit'` without checking whether it can run on the single file being edited |

## Teaching text this item changes

From BR "Today's rules and docs that change":

- Row 2199 (`folder-config-statics.ts` `allowsLayerFiles`): "`true` only for `flows`, `adapters`,
  `brokers`, `responders` and `widgets`" → "Also `true` for `contracts`, `transformers`, `statics` and
  `bindings` (C7). `get-architecture` lists the allowed folders from this flag, so its text follows."
- Row 2198 (`enforce-regex-usage`): "Regex literals only in `contracts/`, `guards/` and `transformers/`"
  → "`statics/` allows regex too (`allowRegex: true` in `folder-config-statics.ts`), so a shared pattern
  can live there."
- Row 2202 (`enforce-implementation-colocation`): "Every implementation file needs a colocated test,
  statics included. All 324 statics files have one, and 178 of those tests are a single `toStrictEqual`
  that restates the whole object." → "A statics file needs a test only when it holds a regex."

From BR "Architecture, folder-type and testing docs: the work" (docs rows 2340 and 2356):

- Row 2340 (`architecture-overview-broker.ts`, line 177): "In `adapters/` only: the npm-package call
  stays in the parent" → Removed with `adapters/`. The layer list adds `contracts`, `transformers`,
  `statics` and `bindings`.
- Row 2356 (`folder-config-statics.ts:22`, the statics entry): `allowRegex: false` → `allowRegex: true`.

Both rows are finished in full by
[Z01](../z01-gateway-folder-type-doc.md)–[Z03](../z03-folder-type-and-testing-docs.md); this item makes
the underlying config/rule change true, and should leave a short note in its report confirming the exact
wording each Z-phase doc row should end up with, since the "adapters/" removal (row 2340) also depends on
Phase 2 (A19) having actually removed the folder type by the time the doc is edited.

## Done when

- [ ] `folder-config-statics.ts` has `allowsLayerFiles: true` for `contracts`, `transformers`, `statics`
      and `bindings` (confirmed against each entry's actual prior value, not assumed).
- [ ] `statics` has `allowRegex: true`.
- [ ] `enforce-project-structure` allows a layer file in all four new folder types.
- [ ] `enforce-implementation-colocation` requires a colocated test for a statics file only when it holds
      a regex.
- [ ] `enforce-implementation-colocation` applies each folder type's own layer rules (test, proxy where
      relevant) to a layer file in the four new folder types.
- [ ] A stub file in `contracts/` can split into layer stub files, re-exported by the parent stub.
- [ ] `npm run ward -- --only lint,typecheck,unit -- <touched files>` exits 0.

## Traps

- `contracts` may already have `allowRegex: true` (confirmed this session) — read all four folder configs
  before editing, or you may "fix" something that is not broken and miss what actually needs the flip.
- The statics-test-only-for-regex change requires reading file content, which changes what "pre-edit
  eligible" means for it — do not assume it stays `'post-edit'` without checking the actual mechanics
  against the three pre-edit conditions in BR "Where each rule runs".
- Do not build the layer *brand-text* check here — that is `require-object-contract-brands-indexed`'s
  job in [B12](b12-require-object-contract-brands.md). Building it twice, differently, in two items is
  worse than building it once correctly in the right one.

## Concessions made while executing

