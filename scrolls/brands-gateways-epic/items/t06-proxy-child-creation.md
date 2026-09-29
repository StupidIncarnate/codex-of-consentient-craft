# T06: A proxy composes the proxy beside each wrapper it calls

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, T1 (lines 1680-1716), T3's machine-check paragraph (line 1790), row 2234 |
| Needs | B03 |
| Unblocks | none named |
| Packages touched | `eslint-plugin` (`enforce-proxy-child-creation` rule change) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent |
| Runs alone | no |

## Why

The proxy of the file that makes a call is the one place that knows which call a test needs. A wrapper's
proxy carries the scenarios for its own handling; a caller that composes it tests against the wrapper's
real behaviour instead of re-staging the outside module by hand. Under EPIC.md concession 1, every stub
and proxy is imported from its own file, never a `_test_` barrel, so this rule's "find the `.proxy` file
beside the export" check constructs that sibling file's path directly, rather than resolving through any
barrel.

## Current state

- `rule-enforce-proxy-child-creation-broker.ts` already exists at
  `packages/eslint-plugin/src/brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.ts`,
  confirmed present. Its current behaviour (asking for `<export>Proxy` for a relative import, and for a
  `#gateway` import only when a `.proxy` file sits beside that export) was not re-read line-by-line in
  this pass — treat the doc's description of "today" as accurate pending the executing agent's own read
  of the file.
- The rule's own test, `rule-enforce-proxy-child-creation-broker.test.ts`, exists alongside it.

## Work

1. **Read the rule's current implementation** to confirm how it locates a `.proxy` file today (by
   relative path, or by resolving through the gateway's `exports` map).

2. **Change the rule so it looks for the `.proxy` file beside the imported export, in the gateway and in
   workspace packages alike** — under concession 1, every stub and proxy is imported from its own file, so
   this check constructs that file's specifier directly and confirms it exists, rather than resolving
   through any barrel. A caller importing
   `#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists` should have its proxy requirement
   resolved by checking whether `#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy`
   (the same path with `.proxy` appended) exists on disk. The same holds for a workspace package:
   `@dungeonmaster/orchestrator/startup/start-orchestrator` checks for
   `@dungeonmaster/orchestrator/startup/start-orchestrator.proxy`.

3. **Also refuse a `registerMock({ fn })` of a gateway wrapper in any proxy file outside the gateway
   itself.** This is the second half of T3's rule: the wrapper's own proxy is the only place allowed to
   mock the wrapper's underlying outside call directly; a caller's proxy may only compose the wrapper's
   proxy, never re-stage the outside function itself.

```
// before — the broker called a pass-through adapter, so the broker's proxy composed the adapter's proxy
// brokers/quest/archive/quest-archive-broker.proxy.ts
const rename = fsRenameAdapterProxy();
rename.succeeds({ from, to });

// after — the broker calls the gateway's rename, so its proxy composes the gateway's renameProxy
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
const rename = renameProxy();
rename.renames({ from, to });
```

```
// left alone
packages/@gateway/node/src/fs__promises/rename/rename.proxy.ts:   registerMock({ fn: rename })   // from 'fs/promises': the wrapper calls it
brokers/quest/archive/…-broker.proxy.ts:                  renameProxy()                  // the broker calls the wrapper
```

Note the import line above reads `#gateway/node/fs__promises/rename/rename.proxy`, the per-file form
concession 1 requires — this matches the source doc's own example at line 1691 directly. Do not resolve a
proxy through any `_test_` barrel.

## Lint rules this item adds or changes

| Rule | Change | Pre-edit? |
|---|---|---|
| `enforce-proxy-child-creation` | Looks for the `.proxy` file beside the imported export by constructing its per-file path directly, in the gateway and in workspace packages alike (not just the gateway worktree special case it has today); also refuses a `registerMock({ fn })` of a gateway wrapper in a proxy outside the gateway | No — as today, `'post-edit'`: it checks whether the sibling `.proxy` file exists on disk |

## Teaching text this item changes

None named for this specific item beyond what T01-T05/T09 already cover for testing-patterns text.

## Done when

- `enforce-proxy-child-creation` resolves a wrapper's proxy by its own per-file path, for both gateway and
  workspace-package imports.
- The rule refuses a `registerMock({ fn })` of a gateway wrapper in any proxy file outside the gateway.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- This item needs B03 done first — B03 is what moves every workspace package's own stubs and proxies onto
  the per-file `exports` form (the gateway's own equivalent, G26, already landed by this point); building
  this rule change before B03 lands means workspace packages have no per-file proxy path to resolve yet,
  and every test for the new rule behaviour would need fixtures pretending B03 already happened.
- Do not resolve a wrapper's proxy through a barrel — concession 1 means every proxy and stub is imported
  from its own file, so the source doc's own literal import path is now the correct one to use as-is.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>

## Plan

Planned 2026-09-29 from a static read of the code. No code was changed.

### Current state, checked against the code (the item's "Current state" is stale)

- Half 1 of the Work is already done for a GATEWAY import and for a BARE workspace-package ROOT import
  (`@dungeonmaster/orchestrator`). `rule-enforce-proxy-child-creation-broker.ts` (lines 248-344) builds
  `${scope}/${folder}/${subpath}/${relativeWrapperPath}.proxy` for a gateway name the subpath's barrel
  re-exports from a wrapper folder, and `${importPath}/${relativeWrapperPath}.proxy` for a root name whose
  colocated `.proxy.ts` exists on disk. It reads the barrel; it resolves nothing through a `_test_` barrel.
- One branch is still the old form. Lines 345-350 answer a `@scope/pkg/<folderType>` import
  (`@dungeonmaster/shared/brokers`, about 90 production files import one) with `${basePath}/testing`, a path
  that no longer exists. The check itself is by NAME (`<name>Proxy` imported and called), so only the reported
  `proxyPath` is wrong today, not what passes or fails. `parse-implementation-imports-transformer.ts` only
  recognises the 3-segment `^@[\w-]+\/[\w-]+\/(\w+)$` shape, which matches that folder-type barrel key.
- Half 2 (refuse `registerMock({ fn })` of a gateway wrapper in a proxy outside the gateway) does NOT exist.
  `ban-workspace-export-mocks` covers other workspace packages' exports only, and its `imports` check is
  `workspacePackageNames`, which never contains `#gateway/...`. `ban-jest-mock-in-proxies` and
  `ban-proxy-empty-called-with` are unrelated.
- The rule is already `'post-edit'` (it reads files); it stays so. No registration, config or statics change is
  needed, because the new check is a new messageId inside the existing rule.
- Measured (python3 scan of every non-gateway `*.proxy.ts`, `registerMock({ fn: X })` with X imported from
  `#gateway/...`, X re-exported by its subpath barrel from a wrapper folder): 33 proxy files in 8 packages, 35 mocks.
  Another 247 mocks of gateway pass-through names (`join`, `randomUUID`, `dirname`, `cp`) are NOT wrappers and stay
  legal; the rule must key on the barrel's wrapper map, as the child-creation check already does. Every wrapper
  involved ships a `.proxy.ts` (cwd, getEnv, dynamicImport, appendFile, ensureDir, isPortFree, freePortPair,
  spawnStreamJson), and most of the 33 already call that wrapper's proxy beside the `registerMock`.
- Consequence for order: the 33 proxies must be migrated BEFORE the rule lands, or lint goes red on all of them.

### What each migration batch does

Replace `registerMock({ fn: <wrapper> })` with the wrapper's own proxy scenario (`cwdProxy().setupCwd`,
`dynamicImportProxy`, `appendFileProxy`, and so on), delete the raw mock and the wrapper import if nothing else
uses it. A test file listed in a batch is edited only where it names the wrapper the proxy no longer exposes.
If a wrapper's proxy lacks the scenario the caller needs, STOP and report under LEFT STANDING; the gateway proxy
edit is outside this item (a possible one is `packages/@gateway/bin/src/claude/spawn-stream-json/spawn-stream-json.proxy.ts`
for batch O1). Checks per batch: `--only lint,typecheck,unit,integration -- <the batch's files>`.

### Batches (file lists are each agent's complete scope)

Gate column names the packages whose proxies the batch's proxies compose, so those must not be mid-edit.

| Batch | Package | Files | Composes proxies of |
|---|---|---|---|
| H1 | hooks | `packages/hooks/src/brokers/eslint/is-path-ignored/eslint-is-path-ignored-broker.proxy.ts` and its `.test.ts`; `packages/hooks/src/brokers/eslint/load-config/eslint-load-config-broker.proxy.ts` and its `.test.ts` | @gateway/node, shared, testing |
| H2 | hooks | `packages/hooks/src/responders/hook/session-snippet-packages/hook-session-snippet-packages-responder.proxy.ts` and its `.test.ts`; `packages/hooks/src/brokers/violations/check-new/violations-check-new-broker.proxy.ts` | @gateway/node, shared, testing |
| T1 | tooling | `packages/tooling/src/responders/adapter-census/run/adapter-census-run-responder.proxy.ts` and its `.test.ts`; `packages/tooling/src/responders/primitive-duplicate-detection/run/primitive-duplicate-detection-run-responder.proxy.ts` and its `.test.ts` | @gateway/node, testing |
| C1 | cli | `packages/cli/src/brokers/install/execute/install-execute-broker.proxy.ts`; `packages/cli/src/responders/cli/serve/cli-serve-responder.proxy.ts`; `packages/cli/src/responders/cli/siegelense/cli-siegelense-responder.proxy.ts` | @gateway/node, shared |
| O1 | orchestrator | `packages/orchestrator/src/brokers/agent/spawn-stream-json/agent-spawn-stream-json-broker.proxy.ts` and its `.test.ts` (alone: heaviest proxy, may expose a gateway-proxy gap) | @gateway/bin, @gateway/node, config, shared |
| O2 | orchestrator | `packages/orchestrator/src/brokers/quest/mcp-create/quest-mcp-create-broker.proxy.ts` and its `.test.ts`; `packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.proxy.ts` | @gateway/node, config, shared |
| O3 | orchestrator | `packages/orchestrator/src/brokers/chat/subagent-tail/chat-subagent-tail-broker.proxy.ts`; `packages/orchestrator/src/brokers/smoketest/run-teardown-checks/smoketest-run-teardown-checks-broker.proxy.ts`; `packages/orchestrator/src/brokers/lane/provision-batch/lane-provision-batch-broker.proxy.ts`; `packages/orchestrator/src/brokers/lane/kill/lane-kill-broker.proxy.ts` | @gateway/node, config, shared |
| O4 | orchestrator | `packages/orchestrator/src/brokers/orchestration-mode/get/orchestration-mode-get-broker.proxy.ts`; `packages/orchestrator/src/responders/worktree/create/worktree-create-responder.proxy.ts` | @gateway/node, config, shared |
| M1 | mcp | `packages/mcp/src/brokers/mcp/discover/mcp-discover-broker.proxy.ts` and its `.test.ts`; `packages/mcp/src/brokers/caller-repo-root/resolve/caller-repo-root-resolve-broker.proxy.ts` and its `.test.ts` | @gateway/node, orchestrator, shared |
| M2 | mcp + session-forensics | `packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts` and its `.test.ts`; `packages/session-forensics/src/brokers/quest/find/quest-find-broker.proxy.ts` | @gateway/node, @gateway/npm, orchestrator (mcp), shared |
| S1 | server | `packages/server/src/responders/quest-driven-watchers/bootstrap/quest-driven-watchers-bootstrap-responder.proxy.ts` and its `.test.ts`; `packages/server/src/responders/tooling/smoketest-run/tooling-smoketest-run-responder.proxy.ts` | @gateway/node, orchestrator, shared |
| G1 | siegelense | `packages/siegelense/src/brokers/step/seed/step-seed-broker.proxy.ts`; `packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.proxy.ts`; `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.proxy.ts` and its `.test.ts` | @gateway/node, config, orchestrator, shared |
| G2 | siegelense | `packages/siegelense/src/brokers/recipes/locate/recipes-locate-broker.proxy.ts`; `packages/siegelense/src/brokers/recipes/read/recipes-read-broker.proxy.ts`; `packages/siegelense/src/brokers/locations/repo-link-path-find/locations-repo-link-path-find-broker.proxy.ts`; `packages/siegelense/src/brokers/recipe/seed-run/recipe-seed-run-broker.proxy.ts` | same as G1 |
| G3 | siegelense | `packages/siegelense/src/brokers/locations/recipes-package-path-find/locations-recipes-package-path-find-broker.proxy.ts` and its `.test.ts`; `packages/siegelense/src/brokers/lane-spec/find/lane-spec-find-broker.proxy.ts` | same as G1 |
| E1 | eslint-plugin | AFTER L2 MERGES. `packages/eslint-plugin/src/brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.ts`; its `.test.ts`; NEW `packages/eslint-plugin/src/transformers/workspace-folder-barrel-proxy-path/workspace-folder-barrel-proxy-path-transformer.ts` and its `.test.ts` | @gateway/node, shared, eslint-plugin's own (read-only: `.proxy.ts` of the rule needs no change) |

E1 work: (a) replace lines 345-350's `/testing` with the per-file path, read from the package's folder barrel
(`src/<folderType>/<folderType>.ts`, via `packageRootSourcePathTransformer` and
`gatewayBarrelWrapperPathsTransformer`), keeping the by-name pass/fail; (b) add messageId
`composeWrapperProxy`: a `registerMock({ fn: X })` whose X is imported from `#gateway/<kind>/<subpath>`, whose
barrel lists X as wrapped, in a file outside `packages/@gateway/`, is reported; pass-through names and
`packages/@gateway/**` files are untouched; (c) update the ~10 tests that expect `.../testing` (test file lines
852-1409). Checks: `lint,typecheck,unit,integration` on those four files plus
`packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts` as a read-only regression.
Teaching text: none changes. `local-eslint` untouched.

### Waves

- Wave 1 (8 agents, file-disjoint, side by side, four at a time at most): O1, O2, O3, O4, H1, H2, T1, C1.
  Orchestrator goes first because M1, M2, S1, G1-G3 compose its proxies.
- Wave 2 (6 agents, file-disjoint, after O1-O4 pass): M1, M2, S1, G1, G2, G3.
- Wave 3 (1 agent, after L2 merges AND waves 1-2 land): E1. Final proof: `npm run ward -- scan` is not
  needed; the operator's whole-repo lint pass shows zero `composeWrapperProxy` reports.
- 15 agents in 3 waves (8, 6, 1). Runs beside other items: none of these files belongs to
  another item's plan except `packages/eslint-plugin/**` (L2) and any orchestrator file a T05-style sweep is still
  editing; the operator should confirm no such sweep is live before wave 1.
