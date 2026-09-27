# T04: No test mocks another workspace package's exports

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, T6 (lines 1855-1872), row 2275, "Found along the way" quest-pause row (line 2479) |
| Needs | A02 |
| Unblocks | none named |
| Packages touched | `eslint-plugin` (new rule), `server`, `mcp` (fixing the 40 thrown-error stagings this rule would catch) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent for the new rule, then agents of 2-4 files each fixing violations per package |
| Runs alone | no |

## Why

A consumer package's test that mocks another workspace package's export directly (instead of composing
that package's own shipped proxy) can drift from what the real code does. Today, 40 places stage
orchestrator's `getQuest` as a thrown error and 4 stage `success: false`, but the real `getQuest` always
reports a missing quest as `{ success: false }` (`quest-get-broker.ts:77-80`). Because of this,
`quest-pause-responder.ts:40` — the "Quest not found" branch the real system actually takes — has no
real test coverage; every test that exercises that branch is testing an invented failure shape instead.

## Current state

- The new rule `ban-workspace-export-mocks` does not exist yet — confirmed absent from
  `packages/eslint-plugin/src` by a directory walk for that name on 2026-09-26.
- Root `package.json` `workspaces` is `["packages/*", "packages/@gateway/*"]`, confirmed by reading the
  file. This is the field `eslint.config.js` reads once at load to build the rule's package-name option
  (matching T6's mechanism table and row 2275, which says the rule option comes from this field so the
  rule reads no file at rule-run time and can run pre-edit).
- `startOrchestratorProxy` (the package's own proxy, mentioned by T3/T6 as the composable replacement for
  a raw mock) is built by A00 (concession 3 in EPIC.md), ahead of the forwarder-adapter deletion — this
  item's fixes should compose that proxy once A00 has landed, not before.
- The exact current count of thrown-error stagings (40) and `success: false` stagings (4) was not
  re-verified in this worktree; treat it as the doc's own snapshot from 2026-09-24/25, not a live count —
  a fresh scan for `getQuest` mock sites is worth doing as this item's first step, since Phase 2's adapter
  deletion may have already changed some of these sites.

## Work

1. **Build `ban-workspace-export-mocks`** in `packages/eslint-plugin`. It refuses:
   - `registerMock({ fn: SomePackage.someExport })` where the import specifier names one of the repo's
     own workspace packages, the file mocking it is not a `.proxy.ts` file, and that package is not the
     file's own package.
   - `registerModuleMock({ module: '@dungeonmaster/<pkg>', factory: () => ({ … }) })` for the same
     condition.

   The package names come from the root `package.json` `workspaces` field, read once when
   `eslint.config.js` loads and passed in as a rule option — the rule itself reads no file, so it can run
   as a pre-edit hook rule. In this repo the packages happen to share the `@dungeonmaster/` prefix; do not
   hard-code that prefix into the rule — read it from the workspace member's own `name` field so the rule
   works unchanged in a consumer repo with a different scope.

2. **Left alone (the rule must not flag these):**
   ```
   const orchestrator = startOrchestratorProxy();   // from @dungeonmaster/orchestrator/startup/start-orchestrator.proxy
   const fs = readFileIfExistsProxy();              // a gateway wrapper's proxy, from #gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy
   ```

3. **Flagged:**
   ```
   // in server or mcp
   registerMock({ fn: StartOrchestrator.getQuest });
   registerModuleMock({ module: '@dungeonmaster/orchestrator', factory: () => ({ … }) });
   ```

4. **Fix every violation the rule finds**, replacing the invented failure shape with
   `startOrchestratorProxy().questNotFound({ questId })` (or the equivalent real scenario for whatever
   export is being mocked), so `{ success: false }` is what the test actually stages — this closes the
   test gap named in "Found along the way": `quest-pause-responder.ts:40`'s "Quest not found" branch gets
   real coverage.

5. **Scan first, hand-check a sample, then turn the rule on.** Per EPIC.md's per-item lint-rule
   procedure: run the new rule as a scan over the whole repo before switching it on, hand-check what it
   flags and what it lets through, then fix violations in batches of 2-4 files per agent, split per
   package.

## Lint rules this item adds or changes

| Rule | Refuses | Pre-edit? |
|---|---|---|
| `ban-workspace-export-mocks` | `registerMock` of another workspace package's export, or `registerModuleMock` of another workspace package, outside that package's own `.proxy.ts` files | Yes — the rule reads no file at run time; the package-name list is a rule option computed once when `eslint.config.js` loads |

Tag it `'pre-edit'` in `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`.

## Teaching text this item changes

Per the T6 doc row (2390 in the testing-patterns table): `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts`, new section — "Never `registerMock` another workspace package's export. Compose the proxy it ships beside its API, such as `startOrchestratorProxy`." Do not write this into the doc directly here; hand it to Z03, which owns `get-testing-patterns` text changes, so the wording is not duplicated or drifted between items.

## Done when

- `ban-workspace-export-mocks` exists, is tagged `'pre-edit'`, and is on.
- A scan of the whole repo was run before turning it on, with a hand-checked sample of what it flags and
  lets through.
- Every violation the rule finds is fixed: real workspace-package proxies (`startOrchestratorProxy` or
  equivalent) replace the raw mocks.
- `quest-pause-responder.ts`'s "Quest not found" branch (or its equivalent path if Phase 2 moved this
  code) has a passing test that reaches it through the real `{ success: false }` shape.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- This item needs A02 (forwarder adapters deleted) done first — some of the 40+4 mock sites may live in
  adapter files Phase 2 deletes outright, in which case the fix is "delete the site with the adapter,"
  not "convert its mock."
- Do not fix these sites before A00's `startOrchestratorProxy` exists — that proxy is what every fix in
  `server` and `mcp` composes instead of a raw mock.
- The rule's package list must come from `package.json` `workspaces`, never a hard-coded scope prefix —
  this is what keeps the rule working in a consumer repo with a different npm scope.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
