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

None yet.

## Plan

Checked against code on 2026-09-27:
- `packages/hooks/src/guards/is-dungeonmaster-hooks-config/is-dungeonmaster-hooks-config-guard.ts:15`: confirmed present with type predicate `(value: unknown): value is DungeonmasterHooksConfig`; has no callers outside its companion test (`is-dungeonmaster-hooks-config-guard.test.ts:9,19`).
- `packages/cli/src/guards/has-dev-dependencies/has-dev-dependencies-guard.ts:14`: confirmed present with type predicate `(params): params is { obj: { devDependencies: DependencyMap } }`; has no callers outside its companion test (`has-dev-dependencies-guard.test.ts:6,12`).
- `packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access/rule-require-validation-on-untyped-property-access-broker.ts:17`: located (item listed location unconfirmed); line 46 retains the dead `filenameStr.endsWith('-adapter.ts')` exemption; rule currently flags only `Reflect.get` and `JSON.parse(...).field` property accesses, not raw/stored `JSON.parse` or `.json()` calls.
- `packages/orchestrator/src/guards/is-array-of-items-with-id/is-array-of-items-with-id-guard.ts:13`: unlisted third guard exists predicating `params is { value: ItemWithId[] }` where `ItemWithId` is a shared contract type, called by 2 guards and 3 transformers in `orchestrator`.
- `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts:336`: confirmed line 336 holds the stale teaching comment `const data = JSON.parse(response) as ApiResponse;  // ✅ you know what the compiler cannot`.
- `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts:65`: confirmed neither `ban-contract-type-predicates` nor `require-gateway-unknown-parse` exists yet in `eslint-plugin`.

### Files touched

#### Created (6 files)
- `packages/eslint-plugin/src/brokers/rule/ban-contract-type-predicates/rule-ban-contract-type-predicates-broker.proxy.ts`
- `packages/eslint-plugin/src/brokers/rule/ban-contract-type-predicates/rule-ban-contract-type-predicates-broker.test.ts`
- `packages/eslint-plugin/src/brokers/rule/ban-contract-type-predicates/rule-ban-contract-type-predicates-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/require-gateway-unknown-parse/rule-require-gateway-unknown-parse-broker.proxy.ts`
- `packages/eslint-plugin/src/brokers/rule/require-gateway-unknown-parse/rule-require-gateway-unknown-parse-broker.test.ts`
- `packages/eslint-plugin/src/brokers/rule/require-gateway-unknown-parse/rule-require-gateway-unknown-parse-broker.ts`

#### Edited (84 files)
- `packages/cli/src/brokers/http-backend-package/resolve/http-backend-package-resolve-broker.test.ts`
- `packages/cli/src/brokers/http-backend-package/resolve/http-backend-package-resolve-broker.ts`
- `packages/cli/src/guards/has-dev-dependencies/has-dev-dependencies-guard.test.ts`
- `packages/cli/src/guards/has-dev-dependencies/has-dev-dependencies-guard.ts`
- `packages/cli/src/responders/cli/create-package/cli-create-package-responder.test.ts`
- `packages/cli/src/responders/cli/create-package/cli-create-package-responder.ts`
- `packages/cli/src/responders/cli/statusline-tap/cli-statusline-tap-responder.test.ts`
- `packages/cli/src/responders/cli/statusline-tap/cli-statusline-tap-responder.ts`
- `packages/config/src/brokers/config-file/load/config-file-load-broker.test.ts`
- `packages/config/src/brokers/config-file/load/config-file-load-broker.ts`
- `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.test.ts`
- `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`
- `packages/eslint-plugin/src/brokers/config/gateway-lint-config/config-gateway-lint-config-broker.test.ts`
- `packages/eslint-plugin/src/brokers/config/gateway-lint-config/config-gateway-lint-config-broker.ts`
- `packages/eslint-plugin/src/brokers/config/workspace-package-names/config-workspace-package-names-broker.test.ts`
- `packages/eslint-plugin/src/brokers/config/workspace-package-names/config-workspace-package-names-broker.ts`
- `packages/eslint-plugin/src/brokers/repo-scope/resolve/repo-scope-resolve-broker.test.ts`
- `packages/eslint-plugin/src/brokers/repo-scope/resolve/repo-scope-resolve-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access/check-is-json-parse-call-layer-broker.test.ts`
- `packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access/check-is-json-parse-call-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access/rule-require-validation-on-untyped-property-access-broker.test.ts`
- `packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access/rule-require-validation-on-untyped-property-access-broker.ts`
- `packages/eslint-plugin/src/brokers/workspace-root/find/workspace-root-find-broker.test.ts`
- `packages/eslint-plugin/src/brokers/workspace-root/find/workspace-root-find-broker.ts`
- `packages/eslint-plugin/src/flows/eslint-plugin/eslint-plugin-flow.integration.test.ts`
- `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.proxy.ts`
- `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.test.ts`
- `packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts`
- `packages/eslint-plugin/src/startup/start-eslint-plugin.integration.test.ts`
- `packages/hooks/src/flows/hook-post-edit/hook-post-edit-flow.integration.test.ts`
- `packages/hooks/src/flows/hook-post-edit/hook-post-edit-flow.ts`
- `packages/hooks/src/flows/hook-pre-bash/hook-pre-bash-flow.integration.test.ts`
- `packages/hooks/src/flows/hook-pre-bash/hook-pre-bash-flow.ts`
- `packages/hooks/src/flows/hook-pre-edit/hook-pre-edit-flow.integration.test.ts`
- `packages/hooks/src/flows/hook-pre-edit/hook-pre-edit-flow.ts`
- `packages/hooks/src/flows/hook-pre-folder-detail/hook-pre-folder-detail-flow.integration.test.ts`
- `packages/hooks/src/flows/hook-pre-folder-detail/hook-pre-folder-detail-flow.ts`
- `packages/hooks/src/flows/hook-pre-mcp-caller/hook-pre-mcp-caller-flow.integration.test.ts`
- `packages/hooks/src/flows/hook-pre-mcp-caller/hook-pre-mcp-caller-flow.ts`
- `packages/hooks/src/flows/hook-pre-search/hook-pre-search-flow.integration.test.ts`
- `packages/hooks/src/flows/hook-pre-search/hook-pre-search-flow.ts`
- `packages/hooks/src/flows/hook-subagent-stop/hook-subagent-stop-flow.integration.test.ts`
- `packages/hooks/src/flows/hook-subagent-stop/hook-subagent-stop-flow.ts`
- `packages/hooks/src/flows/hook-worktree-create/hook-worktree-create-flow.integration.test.ts`
- `packages/hooks/src/flows/hook-worktree-create/hook-worktree-create-flow.ts`
- `packages/hooks/src/guards/is-dungeonmaster-hooks-config/is-dungeonmaster-hooks-config-guard.test.ts`
- `packages/hooks/src/guards/is-dungeonmaster-hooks-config/is-dungeonmaster-hooks-config-guard.ts`
- `packages/hooks/src/transformers/ask-question-to-design-decisions/ask-question-to-design-decisions-transformer.test.ts`
- `packages/hooks/src/transformers/ask-question-to-design-decisions/ask-question-to-design-decisions-transformer.ts`
- `packages/hydration-recipes/src/brokers/package-json/read/package-json-read-broker.test.ts`
- `packages/hydration-recipes/src/brokers/package-json/read/package-json-read-broker.ts`
- `packages/orchestrator/src/brokers/guild-config/read/guild-config-read-broker.test.ts`
- `packages/orchestrator/src/brokers/guild-config/read/guild-config-read-broker.ts`
- `packages/orchestrator/src/brokers/quest/find-quest-path/match-candidates-layer-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/find-quest-path/match-candidates-layer-broker.ts`
- `packages/orchestrator/src/brokers/quest/folder-find/quest-folder-find-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/folder-find/quest-folder-find-broker.ts`
- `packages/orchestrator/src/brokers/quest/list/quest-list-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/list/quest-list-broker.ts`
- `packages/orchestrator/src/brokers/quest/modify/resolve-package-entry-facts-layer-broker.test.ts`
- `packages/orchestrator/src/brokers/quest/modify/resolve-package-entry-facts-layer-broker.ts`
- `packages/orchestrator/src/brokers/rate-limits/watch/rate-limits-watch-tick-layer-broker.test.ts`
- `packages/orchestrator/src/brokers/rate-limits/watch/rate-limits-watch-tick-layer-broker.ts`
- `packages/orchestrator/src/guards/has-duplicate-id-in-array/has-duplicate-id-in-array-guard.test.ts`
- `packages/orchestrator/src/guards/has-duplicate-id-in-array/has-duplicate-id-in-array-guard.ts`
- `packages/orchestrator/src/guards/is-array-of-items-with-id/is-array-of-items-with-id-guard.test.ts`
- `packages/orchestrator/src/guards/is-array-of-items-with-id/is-array-of-items-with-id-guard.ts`
- `packages/orchestrator/src/guards/quest-has-unique-sibling-ids/quest-has-unique-sibling-ids-guard.test.ts`
- `packages/orchestrator/src/guards/quest-has-unique-sibling-ids/quest-has-unique-sibling-ids-guard.ts`
- `packages/orchestrator/src/transformers/normalize-ask-user-question-input/normalize-ask-user-question-input-transformer.test.ts`
- `packages/orchestrator/src/transformers/normalize-ask-user-question-input/normalize-ask-user-question-input-transformer.ts`
- `packages/orchestrator/src/transformers/quest-duplicate-id-message/quest-duplicate-id-message-transformer.test.ts`
- `packages/orchestrator/src/transformers/quest-duplicate-id-message/quest-duplicate-id-message-transformer.ts`
- `packages/orchestrator/src/transformers/quest-find-duplicate-id/quest-find-duplicate-id-transformer.test.ts`
- `packages/orchestrator/src/transformers/quest-find-duplicate-id/quest-find-duplicate-id-transformer.ts`
- `packages/orchestrator/src/transformers/quest-item-deep-merge/quest-item-deep-merge-transformer.test.ts`
- `packages/orchestrator/src/transformers/quest-item-deep-merge/quest-item-deep-merge-transformer.ts`
- `packages/orchestrator/src/transformers/stream-json-to-clarification/stream-json-to-clarification-transformer.test.ts`
- `packages/orchestrator/src/transformers/stream-json-to-clarification/stream-json-to-clarification-transformer.ts`
- `packages/server/src/brokers/local-image/copy/local-image-copy-broker.test.ts`
- `packages/server/src/brokers/local-image/copy/local-image-copy-broker.ts`
- `packages/server/src/brokers/web-bundle-package/resolve/web-bundle-package-resolve-broker.test.ts`
- `packages/server/src/brokers/web-bundle-package/resolve/web-bundle-package-resolve-broker.ts`
- `packages/session-forensics/src/brokers/quest/index-load/quest-index-load-broker.test.ts`
- `packages/session-forensics/src/brokers/quest/index-load/quest-index-load-broker.ts`
- `packages/session-forensics/src/brokers/quest/load/quest-load-broker.test.ts`
- `packages/session-forensics/src/brokers/quest/load/quest-load-broker.ts`
- `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.test.ts`
- `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts`
- `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.test.ts`
- `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.test.ts`
- `packages/siegelense/src/adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.ts`
- `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.test.ts`
- `packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.ts`
- `packages/siegelense/src/brokers/driver/handle-request/driver-handle-request-broker.test.ts`
- `packages/siegelense/src/brokers/driver/handle-request/driver-handle-request-broker.ts`
- `packages/siegelense/src/brokers/lane/workspace-resolve/lane-workspace-resolve-broker.test.ts`
- `packages/siegelense/src/brokers/lane/workspace-resolve/lane-workspace-resolve-broker.ts`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.test.ts`
- `packages/siegelense/src/brokers/profile/read/profile-read-broker.ts`
- `packages/siegelense/src/brokers/results/read/buffer-read-layer-broker.test.ts`
- `packages/siegelense/src/brokers/results/read/buffer-read-layer-broker.ts`
- `packages/ward/src/brokers/check-run/lint/check-run-lint-broker.test.ts`
- `packages/ward/src/brokers/check-run/lint/check-run-lint-broker.ts`
- `packages/ward/src/brokers/duplicate-install/check/duplicate-install-check-broker.test.ts`
- `packages/ward/src/brokers/duplicate-install/check/duplicate-install-check-broker.ts`
- `packages/ward/src/brokers/storage/load/storage-load-broker.test.ts`
- `packages/ward/src/brokers/storage/load/storage-load-broker.ts`
- `packages/ward/src/responders/install/write-scripts/install-write-scripts-responder.test.ts`
- `packages/ward/src/responders/install/write-scripts/install-write-scripts-responder.ts`
- `packages/ward/src/transformers/open-handle-report-parse/open-handle-report-parse-transformer.test.ts`
- `packages/ward/src/transformers/open-handle-report-parse/open-handle-report-parse-transformer.ts`
- `packages/web/src/adapters/fetch/delete/fetch-delete-adapter.test.ts`
- `packages/web/src/adapters/fetch/delete/fetch-delete-adapter.ts`
- `packages/web/src/adapters/fetch/get/fetch-get-adapter.test.ts`
- `packages/web/src/adapters/fetch/get/fetch-get-adapter.ts`
- `packages/web/src/adapters/fetch/patch/fetch-patch-adapter.test.ts`
- `packages/web/src/adapters/fetch/patch/fetch-patch-adapter.ts`
- `packages/web/src/adapters/fetch/post/fetch-post-adapter.test.ts`
- `packages/web/src/adapters/fetch/post/fetch-post-adapter.ts`
- `packages/web/src/state/comment-queue/comment-queue-state.test.ts`
- `packages/web/src/state/comment-queue/comment-queue-state.ts`
- `packages/web/src/widgets/chat-entry-list/chat-entry-list-widget.test.tsx`
- `packages/web/src/widgets/chat-entry-list/chat-entry-list-widget.tsx`
- `packages/web/src/widgets/chat-input/chat-input-widget.test.tsx`
- `packages/web/src/widgets/chat-input/chat-input-widget.tsx`

#### Deleted (0 files)
None.

---

### Batches

| Batch ID | Files | Description | Dependencies | Runs beside | Verification |
|---|---|---|---|---|---|
| **B17-1** | `packages/eslint-plugin/src/brokers/rule/ban-contract-type-predicates/rule-ban-contract-type-predicates-broker.ts`<br/>`packages/eslint-plugin/src/brokers/rule/ban-contract-type-predicates/rule-ban-contract-type-predicates-broker.proxy.ts`<br/>`packages/eslint-plugin/src/brokers/rule/ban-contract-type-predicates/rule-ban-contract-type-predicates-broker.test.ts`<br/>`packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`<br/>`packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.test.ts`<br/>`packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts`<br/>`packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.proxy.ts`<br/>`packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.test.ts`<br/>`packages/eslint-plugin/src/flows/eslint-plugin/eslint-plugin-flow.integration.test.ts`<br/>`packages/eslint-plugin/src/startup/start-eslint-plugin.integration.test.ts`<br/>`packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`<br/>`packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.test.ts` | Builds C3 rule `ban-contract-type-predicates` (syntax, pre-edit), registering it in plugin create responder, statics, and config. | None | B17-2 through B17-9 | `npm run ward -- --only lint,typecheck,unit -- packages/eslint-plugin packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.test.ts` |
| **B17-2** | `packages/hooks/src/guards/is-dungeonmaster-hooks-config/is-dungeonmaster-hooks-config-guard.ts`<br/>`packages/hooks/src/guards/is-dungeonmaster-hooks-config/is-dungeonmaster-hooks-config-guard.test.ts`<br/>`packages/cli/src/guards/has-dev-dependencies/has-dev-dependencies-guard.ts`<br/>`packages/cli/src/guards/has-dev-dependencies/has-dev-dependencies-guard.test.ts` | Migrates `isDungeonmasterHooksConfigGuard` and `hasDevDependenciesGuard` to validate through contracts instead of type predicates. | None | B17-1, B17-3 through B17-9 | `npm run ward -- --only lint,typecheck,unit -- packages/hooks/src/guards/is-dungeonmaster-hooks-config packages/cli/src/guards/has-dev-dependencies` |
| **B17-3** | `packages/orchestrator/src/guards/is-array-of-items-with-id/is-array-of-items-with-id-guard.ts`<br/>`packages/orchestrator/src/guards/is-array-of-items-with-id/is-array-of-items-with-id-guard.test.ts`<br/>`packages/orchestrator/src/guards/has-duplicate-id-in-array/has-duplicate-id-in-array-guard.ts`<br/>`packages/orchestrator/src/guards/has-duplicate-id-in-array/has-duplicate-id-in-array-guard.test.ts` | Rewrites `isArrayOfItemsWithIdGuard` to return boolean (non-predicating) and updates caller `hasDuplicateIdInArrayGuard` to parse via `itemWithIdContract`. | None | B17-1, B17-2, B17-6, B17-8, B17-9 | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/guards/is-array-of-items-with-id packages/orchestrator/src/guards/has-duplicate-id-in-array` |
| **B17-4** | `packages/orchestrator/src/guards/quest-has-unique-sibling-ids/quest-has-unique-sibling-ids-guard.ts`<br/>`packages/orchestrator/src/guards/quest-has-unique-sibling-ids/quest-has-unique-sibling-ids-guard.test.ts`<br/>`packages/orchestrator/src/transformers/quest-duplicate-id-message/quest-duplicate-id-message-transformer.ts`<br/>`packages/orchestrator/src/transformers/quest-duplicate-id-message/quest-duplicate-id-message-transformer.test.ts` | Updates callers of `isArrayOfItemsWithIdGuard` in orchestrator guards/transformers to parse via `itemWithIdContract`. | B17-3 | B17-1, B17-2, B17-6, B17-8, B17-9 | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/guards/quest-has-unique-sibling-ids packages/orchestrator/src/transformers/quest-duplicate-id-message` |
| **B17-5** | `packages/orchestrator/src/transformers/quest-find-duplicate-id/quest-find-duplicate-id-transformer.ts`<br/>`packages/orchestrator/src/transformers/quest-find-duplicate-id/quest-find-duplicate-id-transformer.test.ts`<br/>`packages/orchestrator/src/transformers/quest-item-deep-merge/quest-item-deep-merge-transformer.ts`<br/>`packages/orchestrator/src/transformers/quest-item-deep-merge/quest-item-deep-merge-transformer.test.ts` | Updates remaining callers of `isArrayOfItemsWithIdGuard` in orchestrator deep merge / duplicate finder to validate via `itemWithIdContract`. | B17-3 | B17-1, B17-2, B17-6, B17-8, B17-9 | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/transformers/quest-find-duplicate-id packages/orchestrator/src/transformers/quest-item-deep-merge` |
| **B17-6** | `packages/hooks/src/transformers/ask-question-to-design-decisions/ask-question-to-design-decisions-transformer.ts`<br/>`packages/hooks/src/transformers/ask-question-to-design-decisions/ask-question-to-design-decisions-transformer.test.ts`<br/>`packages/server/src/brokers/local-image/copy/local-image-copy-broker.ts`<br/>`packages/server/src/brokers/local-image/copy/local-image-copy-broker.test.ts` | Replaces inline `.filter()` contract type predicates with `NonNullable<typeof x>` in hooks and server. | None | B17-1, B17-2, B17-3, B17-7, B17-8, B17-9 | `npm run ward -- --only lint,typecheck,unit -- packages/hooks/src/transformers/ask-question-to-design-decisions packages/server/src/brokers/local-image/copy` |
| **B17-7** | `packages/orchestrator/src/brokers/quest/list/quest-list-broker.ts`<br/>`packages/orchestrator/src/brokers/quest/list/quest-list-broker.test.ts`<br/>`packages/orchestrator/src/brokers/quest/folder-find/quest-folder-find-broker.ts`<br/>`packages/orchestrator/src/brokers/quest/folder-find/quest-folder-find-broker.test.ts` | Replaces inline `.filter()` contract type predicates with `NonNullable<typeof x>` in orchestrator quest brokers. | None | B17-1, B17-2, B17-6, B17-8, B17-9 | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/quest/list packages/orchestrator/src/brokers/quest/folder-find` |
| **B17-8** | `packages/siegelense/src/brokers/profile/read/profile-read-broker.ts`<br/>`packages/siegelense/src/brokers/profile/read/profile-read-broker.test.ts`<br/>`packages/ward/src/brokers/duplicate-install/check/duplicate-install-check-broker.ts`<br/>`packages/ward/src/brokers/duplicate-install/check/duplicate-install-check-broker.test.ts` | Replaces inline `.filter()` contract type predicates with `NonNullable<typeof x>` in siegelense and ward. | None | B17-1, B17-2, B17-6, B17-7, B17-9 | `npm run ward -- --only lint,typecheck,unit -- packages/siegelense/src/brokers/profile/read packages/ward/src/brokers/duplicate-install/check` |
| **B17-9** | `packages/web/src/widgets/chat-entry-list/chat-entry-list-widget.tsx`<br/>`packages/web/src/widgets/chat-entry-list/chat-entry-list-widget.test.tsx`<br/>`packages/web/src/widgets/chat-input/chat-input-widget.tsx`<br/>`packages/web/src/widgets/chat-input/chat-input-widget.test.tsx` | Replaces inline `.filter()` contract type predicates with `NonNullable<typeof x>` in web chat widgets. | None | B17-1 through B17-8 | `npm run ward -- --only lint,typecheck,unit -- packages/web/src/widgets/chat-entry-list packages/web/src/widgets/chat-input` |
| **B17-10** | `packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access/check-is-json-parse-call-layer-broker.ts`<br/>`packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access/check-is-json-parse-call-layer-broker.test.ts`<br/>`packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access/rule-require-validation-on-untyped-property-access-broker.ts`<br/>`packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access/rule-require-validation-on-untyped-property-access-broker.test.ts` | Extends C4 syntax rule: removes dead `-adapter.ts` exemption, skips gateway files, flags `JSON.parse` and `.json()` calls not immediately consumed by `.parse()` / `.safeParse()`. | None | B17-2 through B17-9, B17-12, B17-13 | `npm run ward -- --only lint,typecheck,unit -- packages/eslint-plugin/src/brokers/rule/require-validation-on-untyped-property-access` |
| **B17-11** | `packages/eslint-plugin/src/brokers/rule/require-gateway-unknown-parse/rule-require-gateway-unknown-parse-broker.ts`<br/>`packages/eslint-plugin/src/brokers/rule/require-gateway-unknown-parse/rule-require-gateway-unknown-parse-broker.proxy.ts`<br/>`packages/eslint-plugin/src/brokers/rule/require-gateway-unknown-parse/rule-require-gateway-unknown-parse-broker.test.ts`<br/>`packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts`<br/>`packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.proxy.ts`<br/>`packages/eslint-plugin/src/responders/eslint-plugin/create/eslint-plugin-create-responder.test.ts`<br/>`packages/eslint-plugin/src/flows/eslint-plugin/eslint-plugin-flow.integration.test.ts`<br/>`packages/eslint-plugin/src/startup/start-eslint-plugin.integration.test.ts`<br/>`packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`<br/>`packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.test.ts` | Builds C4 typechecker rule `require-gateway-unknown-parse` (ward-only, typed config), requiring `#gateway` functions returning `unknown` to feed directly into a parse. | B17-1 | B17-2 through B17-9, B17-12, B17-13 | `npm run ward -- --only lint,typecheck,unit -- packages/eslint-plugin` |
| **B17-12** | `packages/cli/src/responders/cli/create-package/cli-create-package-responder.ts`<br/>`packages/cli/src/responders/cli/create-package/cli-create-package-responder.test.ts`<br/>`packages/cli/src/responders/cli/statusline-tap/cli-statusline-tap-responder.ts`<br/>`packages/cli/src/responders/cli/statusline-tap/cli-statusline-tap-responder.test.ts` | Fixes C4 raw `JSON.parse` call sites in CLI responders (pipes parse directly into contract). | None | B17-1, B17-10, B17-11, B17-13 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/cli/src/responders/cli/create-package packages/cli/src/responders/cli/statusline-tap` |
| **B17-13** | `packages/cli/src/brokers/http-backend-package/resolve/http-backend-package-resolve-broker.ts`<br/>`packages/cli/src/brokers/http-backend-package/resolve/http-backend-package-resolve-broker.test.ts`<br/>`packages/config/src/brokers/config-file/load/config-file-load-broker.ts`<br/>`packages/config/src/brokers/config-file/load/config-file-load-broker.test.ts` | Fixes C4 raw `JSON.parse` call sites in CLI and config load brokers. | None | B17-1, B17-10, B17-11, B17-12, B17-14 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/cli/src/brokers/http-backend-package/resolve packages/config/src/brokers/config-file/load` |
| **B17-14** | `packages/eslint-plugin/src/brokers/config/gateway-lint-config/config-gateway-lint-config-broker.ts`<br/>`packages/eslint-plugin/src/brokers/config/gateway-lint-config/config-gateway-lint-config-broker.test.ts`<br/>`packages/eslint-plugin/src/brokers/config/workspace-package-names/config-workspace-package-names-broker.ts`<br/>`packages/eslint-plugin/src/brokers/config/workspace-package-names/config-workspace-package-names-broker.test.ts` | Fixes C4 raw `JSON.parse` calls in eslint-plugin config brokers (pipes directly into contracts). | None | B17-12, B17-13, B17-16 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/eslint-plugin/src/brokers/config/gateway-lint-config packages/eslint-plugin/src/brokers/config/workspace-package-names` |
| **B17-15** | `packages/eslint-plugin/src/brokers/repo-scope/resolve/repo-scope-resolve-broker.ts`<br/>`packages/eslint-plugin/src/brokers/repo-scope/resolve/repo-scope-resolve-broker.test.ts`<br/>`packages/eslint-plugin/src/brokers/workspace-root/find/workspace-root-find-broker.ts`<br/>`packages/eslint-plugin/src/brokers/workspace-root/find/workspace-root-find-broker.test.ts` | Fixes C4 raw `JSON.parse` calls in eslint-plugin repo-scope and workspace-root brokers. | None | B17-12, B17-13, B17-16 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/eslint-plugin/src/brokers/repo-scope/resolve packages/eslint-plugin/src/brokers/workspace-root/find` |
| **B17-16** | `packages/hooks/src/flows/hook-post-edit/hook-post-edit-flow.ts`<br/>`packages/hooks/src/flows/hook-post-edit/hook-post-edit-flow.integration.test.ts`<br/>`packages/hooks/src/flows/hook-pre-bash/hook-pre-bash-flow.ts`<br/>`packages/hooks/src/flows/hook-pre-bash/hook-pre-bash-flow.integration.test.ts` | Fixes C4 raw `JSON.parse` in hook post-edit and pre-bash flows. | None | B17-10, B17-11, B17-12 to B17-15, B17-20 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/hooks/src/flows/hook-post-edit packages/hooks/src/flows/hook-pre-bash` |
| **B17-17** | `packages/hooks/src/flows/hook-pre-edit/hook-pre-edit-flow.ts`<br/>`packages/hooks/src/flows/hook-pre-edit/hook-pre-edit-flow.integration.test.ts`<br/>`packages/hooks/src/flows/hook-pre-folder-detail/hook-pre-folder-detail-flow.ts`<br/>`packages/hooks/src/flows/hook-pre-folder-detail/hook-pre-folder-detail-flow.integration.test.ts` | Fixes C4 raw `JSON.parse` in hook pre-edit and pre-folder-detail flows. | None | B17-10, B17-11, B17-12 to B17-15, B17-20 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/hooks/src/flows/hook-pre-edit packages/hooks/src/flows/hook-pre-folder-detail` |
| **B17-18** | `packages/hooks/src/flows/hook-pre-mcp-caller/hook-pre-mcp-caller-flow.ts`<br/>`packages/hooks/src/flows/hook-pre-mcp-caller/hook-pre-mcp-caller-flow.integration.test.ts`<br/>`packages/hooks/src/flows/hook-pre-search/hook-pre-search-flow.ts`<br/>`packages/hooks/src/flows/hook-pre-search/hook-pre-search-flow.integration.test.ts` | Fixes C4 raw `JSON.parse` in hook pre-mcp-caller and pre-search flows. | None | B17-10, B17-11, B17-12 to B17-15, B17-20 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/hooks/src/flows/hook-pre-mcp-caller packages/hooks/src/flows/hook-pre-search` |
| **B17-19** | `packages/hooks/src/flows/hook-subagent-stop/hook-subagent-stop-flow.ts`<br/>`packages/hooks/src/flows/hook-subagent-stop/hook-subagent-stop-flow.integration.test.ts`<br/>`packages/hooks/src/flows/hook-worktree-create/hook-worktree-create-flow.ts`<br/>`packages/hooks/src/flows/hook-worktree-create/hook-worktree-create-flow.integration.test.ts` | Fixes C4 raw `JSON.parse` in hook subagent-stop and worktree-create flows. | None | B17-10, B17-11, B17-12 to B17-15, B17-20 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/hooks/src/flows/hook-subagent-stop packages/hooks/src/flows/hook-worktree-create` |
| **B17-20** | `packages/hydration-recipes/src/brokers/package-json/read/package-json-read-broker.ts`<br/>`packages/hydration-recipes/src/brokers/package-json/read/package-json-read-broker.test.ts`<br/>`packages/orchestrator/src/brokers/guild-config/read/guild-config-read-broker.ts`<br/>`packages/orchestrator/src/brokers/guild-config/read/guild-config-read-broker.test.ts` | Fixes C4 raw `JSON.parse` in hydration-recipes manifest reader and orchestrator guild config reader. | None | B17-10, B17-11, B17-12 to B17-19, B17-24 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/hydration-recipes/src/brokers/package-json/read packages/orchestrator/src/brokers/guild-config/read` |
| **B17-21** | `packages/orchestrator/src/brokers/quest/find-quest-path/match-candidates-layer-broker.ts`<br/>`packages/orchestrator/src/brokers/quest/find-quest-path/match-candidates-layer-broker.test.ts`<br/>`packages/orchestrator/src/brokers/rate-limits/watch/rate-limits-watch-tick-layer-broker.ts`<br/>`packages/orchestrator/src/brokers/rate-limits/watch/rate-limits-watch-tick-layer-broker.test.ts` | Fixes C4 raw `JSON.parse` in orchestrator quest matching and rate limit tick brokers. | None | B17-10, B17-11, B17-12 to B17-19, B17-24 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/quest/find-quest-path packages/orchestrator/src/brokers/rate-limits/watch` |
| **B17-22** | `packages/orchestrator/src/brokers/quest/modify/resolve-package-entry-facts-layer-broker.ts`<br/>`packages/orchestrator/src/brokers/quest/modify/resolve-package-entry-facts-layer-broker.test.ts`<br/>`packages/orchestrator/src/transformers/normalize-ask-user-question-input/normalize-ask-user-question-input-transformer.ts`<br/>`packages/orchestrator/src/transformers/normalize-ask-user-question-input/normalize-ask-user-question-input-transformer.test.ts` | Fixes C4 raw `JSON.parse` in orchestrator modify broker and ask-user-question normalizer. | None | B17-10, B17-11, B17-12 to B17-19, B17-24 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/quest/modify packages/orchestrator/src/transformers/normalize-ask-user-question-input` |
| **B17-23** | `packages/orchestrator/src/transformers/stream-json-to-clarification/stream-json-to-clarification-transformer.ts`<br/>`packages/orchestrator/src/transformers/stream-json-to-clarification/stream-json-to-clarification-transformer.test.ts`<br/>`packages/server/src/brokers/web-bundle-package/resolve/web-bundle-package-resolve-broker.ts`<br/>`packages/server/src/brokers/web-bundle-package/resolve/web-bundle-package-resolve-broker.test.ts` | Fixes C4 raw `JSON.parse` in orchestrator clarification stream transformer and server bundle resolver. | None | B17-10, B17-11, B17-12 to B17-19, B17-24 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/transformers/stream-json-to-clarification packages/server/src/brokers/web-bundle-package/resolve` |
| **B17-24** | `packages/session-forensics/src/brokers/quest/index-load/quest-index-load-broker.ts`<br/>`packages/session-forensics/src/brokers/quest/index-load/quest-index-load-broker.test.ts`<br/>`packages/session-forensics/src/brokers/quest/load/quest-load-broker.ts`<br/>`packages/session-forensics/src/brokers/quest/load/quest-load-broker.test.ts` | Fixes untyped property access on `safeJsonParseTransformer` in session-forensics quest loaders (parses via contract). | None | B17-10, B17-11, B17-12 to B17-23, B17-25 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/session-forensics/src/brokers/quest/index-load packages/session-forensics/src/brokers/quest/load` |
| **B17-25** | `packages/siegelense/src/adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.ts`<br/>`packages/siegelense/src/adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter.test.ts`<br/>`packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.ts`<br/>`packages/siegelense/src/brokers/boot-lock/release/boot-lock-release-broker.test.ts` | Fixes C4 raw `JSON.parse` in siegelense bin-resolve adapter and boot-lock release broker. | None | B17-10, B17-11, B17-12 to B17-24, B17-27 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/siegelense/src/adapters/cli-package/bin-resolve packages/siegelense/src/brokers/boot-lock/release` |
| **B17-26** | `packages/siegelense/src/brokers/driver/handle-request/driver-handle-request-broker.ts`<br/>`packages/siegelense/src/brokers/driver/handle-request/driver-handle-request-broker.test.ts`<br/>`packages/siegelense/src/brokers/results/read/buffer-read-layer-broker.ts`<br/>`packages/siegelense/src/brokers/results/read/buffer-read-layer-broker.test.ts` | Fixes C4 raw `JSON.parse` in siegelense driver request handler and results buffer reader. | None | B17-10, B17-11, B17-12 to B17-24, B17-27 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/siegelense/src/brokers/driver/handle-request packages/siegelense/src/brokers/results/read` |
| **B17-27** | `packages/siegelense/src/brokers/lane/workspace-resolve/lane-workspace-resolve-broker.ts`<br/>`packages/siegelense/src/brokers/lane/workspace-resolve/lane-workspace-resolve-broker.test.ts`<br/>`packages/ward/src/brokers/check-run/lint/check-run-lint-broker.ts`<br/>`packages/ward/src/brokers/check-run/lint/check-run-lint-broker.test.ts` | Fixes C4 raw `JSON.parse` in siegelense workspace resolver and ward lint broker. | None | B17-10, B17-11, B17-12 to B17-26, B17-28 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/siegelense/src/brokers/lane/workspace-resolve packages/ward/src/brokers/check-run/lint` |
| **B17-28** | `packages/ward/src/brokers/storage/load/storage-load-broker.ts`<br/>`packages/ward/src/brokers/storage/load/storage-load-broker.test.ts`<br/>`packages/ward/src/responders/install/write-scripts/install-write-scripts-responder.ts`<br/>`packages/ward/src/responders/install/write-scripts/install-write-scripts-responder.test.ts` | Fixes C4 raw `JSON.parse` in ward storage loader and write-scripts responder. | None | B17-10, B17-11, B17-12 to B17-27, B17-30 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/ward/src/brokers/storage/load packages/ward/src/responders/install/write-scripts` |
| **B17-29** | `packages/ward/src/transformers/open-handle-report-parse/open-handle-report-parse-transformer.ts`<br/>`packages/ward/src/transformers/open-handle-report-parse/open-handle-report-parse-transformer.test.ts`<br/>`packages/web/src/state/comment-queue/comment-queue-state.ts`<br/>`packages/web/src/state/comment-queue/comment-queue-state.test.ts` | Fixes C4 raw `JSON.parse` in ward open-handle transformer and web comment queue state. | None | B17-10, B17-11, B17-12 to B17-28, B17-30 to B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/ward/src/transformers/open-handle-report-parse packages/web/src/state/comment-queue` |
| **B17-30** | `packages/web/src/adapters/fetch/get/fetch-get-adapter.ts`<br/>`packages/web/src/adapters/fetch/get/fetch-get-adapter.test.ts`<br/>`packages/web/src/adapters/fetch/post/fetch-post-adapter.ts`<br/>`packages/web/src/adapters/fetch/post/fetch-post-adapter.test.ts` | Replaces unvalidated `(await response.json()) as TResponse` in web GET and POST adapters with direct contract validation. | None | B17-10, B17-11, B17-12 to B17-29, B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/web/src/adapters/fetch/get packages/web/src/adapters/fetch/post` |
| **B17-31** | `packages/web/src/adapters/fetch/patch/fetch-patch-adapter.ts`<br/>`packages/web/src/adapters/fetch/patch/fetch-patch-adapter.test.ts`<br/>`packages/web/src/adapters/fetch/delete/fetch-delete-adapter.ts`<br/>`packages/web/src/adapters/fetch/delete/fetch-delete-adapter.test.ts` | Replaces unvalidated `(await response.json()) as TResponse` in web PATCH and DELETE adapters with direct contract validation. | None | B17-10, B17-11, B17-12 to B17-29, B17-32 | `npm run ward -- --only lint,typecheck,unit -- packages/web/src/adapters/fetch/patch packages/web/src/adapters/fetch/delete` |
| **B17-32** | `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts`<br/>`packages/shared/src/brokers/architecture/overview/architecture-overview-broker.test.ts` | Updates architecture overview teaching text at line 336 from `JSON.parse(x) as ApiResponse` to `apiResponseContract.parse(JSON.parse(x))`. | None | B17-10 through B17-31 | `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/brokers/architecture/overview` |

---

### Builds and consumer checks

- **Builds required**:
  - `packages/eslint-plugin`: needs build (`npm run build --workspace=@dungeonmaster/eslint-plugin`) after B17-1, B17-10, and B17-11 so eslint rules take effect during subsequent passes.
  - `packages/shared`: needs build (`npm run build --workspace=@dungeonmaster/shared`) after B17-1 because `dungeonmasterRuleEnforceOnStatics` was updated.
- **Consumer check**:
  - Neither rule changes `init` output or consumer file templates. Run `npm run check:consumer` after B17-11 and building `@dungeonmaster/eslint-plugin` to verify consumer projects typecheck and lint cleanly under the new rules.

---

### Open questions

1. **`safeJsonParseTransformer` in `shared`**: `packages/shared/src/transformers/safe-json-parse/safe-json-parse-transformer.ts` wraps `JSON.parse` in a try/catch and returns `{ ok: true, value: unknown } | { ok: false }`. Should `safeJsonParseTransformer` be exempt from C4 since it acts as a low-level parsing helper, or should it take a contract schema parameter `safeJsonParseTransformer({ value, contract })`?
2. **Web `fetch-*-adapter.ts` response parsing**: The browser fetch adapters (`web/src/adapters/fetch/*`) currently accept a generic `TResponse` and cast `(await response.json()) as TResponse`. To strictly satisfy C4, should these adapters require a `contract: z.ZodType<TResponse>` parameter, or will Phase 2/gateway migration deprecate these adapters in favor of `#gateway/browser/fetch`?
3. **Refactoring `isArrayOfItemsWithIdGuard`**: Callers of this guard in `orchestrator` perform duplicate checking or deep merging. Is it preferred to rewrite the guard to return a plain `boolean` and have callers run `z.array(itemWithIdContract).safeParse(...)`, or to convert it directly into a parsing transformer?
