# T05: No catch-all proxy defaults; no invented failures

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, T4 (lines 1792-1830), T5 (1832-1853), rows 2271-2273, `enforce-proxy-patterns` message row (2378), testing-patterns rows 2376-2377 |
| Needs | G19 |
| Unblocks | T08 |
| Packages touched | `eslint-plugin` (three new rules), every package with a `.proxy.ts` file (fixing violations) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent per new rule (three agents), then fixing agents of 2-4 proxy files each, split per package |
| Runs alone | no |

## Why

A proxy constructor that answers every unexpected call with a canned success (`calledWith([]).returns('')`)
hides a forgotten call from the I/O trap, because the call now counts as staged. 90 adapter proxies stage
a `calledWith([])` answer; 22 of those are honest (the function takes no arguments), but at least 44 put a
canned answer in the constructor for a function that takes arguments. Separately, a hand-made failure
(`new Error('ENOENT')` with no `code`) has the shape the author imagined, not the shape Node actually
produces — 179 of the adapter proxies take a generic `error`, "file not found" is built without Node's
`code` 193 times and with it only 70 times, and of the 92 implementations tested with a code-less error,
64 catch errors themselves and 58 of those catch everything — the only shape that passes such a test.

## Current state

Checked 2026-09-26: none of the three rules named below exist yet in `packages/eslint-plugin/src`
(confirmed by a directory walk for each name). `rule-enforce-proxy-patterns-broker.ts` exists at
`packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.ts`
(its message text at the cited line was not independently re-read here; treat the exact wording as
"not checked" until the executing agent opens the file).

## Work

Build three rules. All apply inside the gateway's own proxies too, not just workspace-package proxies.

### 1. `ban-proxy-catch-all-defaults` (pre-edit)

Refuses a `calledWith` argument in a proxy constructor that is a function literal returning `true` with
no condition — a catch-all, whether written directly (`calledWith([() => true])`) or hidden behind a
helper (`calledWith([anyArg()])` where `anyArg` returns `() => true`). Syntax-only check.

```
// flagged — every unexpected read now "succeeds" with ''
export const fsReadFileProxy = () => {
  const mock = registerMock({ fn: readFileSync });
  mock.calledWith([]).returns('');
  return { … };
};

// left alone
registerMock({ fn: randomUUID }).calledWith([]).returns(uuid);                  // no arguments: [] is the only address
mock.calledWith([filePath]).returns(content);                                    // addressed
return { existsOnlyFor: ({ filePaths }) => mock.calledWith([isPath]).implement(…) };  // opt-in scenario
```

A helper built only to dodge this rule (`anyArg()` returning `() => true`) still gets past a pure syntax
check; the rule's message names the fix (stage each call by its arguments) so such a helper shows up in
review instead of passing silently. Closing that gap fully needs refusing every argument that is not a
literal, a variable, or a predicate built from a staged value — leave that for later, per the doc's own
open scope note.

### 2. `ban-proxy-empty-called-with` (ward only — needs the type checker)

Refuses a `calledWith([])` answer on a handle from `registerMock({ fn })` where `fn`'s declared signature
takes arguments. Needs the type checker to know `fn`'s signature (so `randomUUID`, which takes none,
passes), so this rule cannot run pre-edit.

### 3. `ban-invented-failures` (pre-edit)

Refuses a hand-made `Error` given to a mock's `rejects`, `throws`, or a throwing `implement`, in a proxy
or test file. Its message names the recorded-failure stub to use instead.

```
// flagged — as the value given to a mock's rejects / throws / a throwing implement
proxy.throws({ filePath, error: new Error('ENOENT') });
handle.calledWith([p]).throws(Object.assign(new Error('x'), { code: 'ENOENT' }));   // still hand-made

// left alone
fs.fileMissing({ path });                                   // a wrapper proxy's scenario, built on a recorded failure
handle.calledWith([p]).rejects(FileMissingErrorStub({ syscall: 'open', path: p }));   // a recorded failure, from #gateway/node/fs__promises/file-missing-error/file-missing-error.stub
orchestrator.questNotFound({ questId });                    // provider-owned scenario
expect(() => run()).toThrow(/^Quest not found$/u);          // asserting what the code under test throws
```

### 4. Drop the old exception in `enforce-proxy-patterns`

`rule-enforce-proxy-patterns-broker.ts`'s `adapterProxyMustSetupMocks` message currently reads: "This
sets up default mock behavior when proxy is created." Drop that sentence — only the check for a
`jest.mocked` proxy with no staging at all stays. A constructor-level `calledWith([])` catch-all is no
longer allowed "when a parent proxy builds this adapter without describing any call of its own"; a
function that takes arguments never gets a constructor default, full stop.

### 5. Fix every violation, split per package

Once the three rules are built and scanned (not yet turned on for real code), fix violations in agents of
2-4 proxy files each, split per package. Each fix either:
- addresses the call by its real arguments instead of a catch-all `[]`, or
- replaces a hand-made `Error` with the matching recorded-failure stub or wrapper-proxy scenario.

## Lint rules this item adds or changes

| Rule | Refuses | Needs | Pre-edit? |
|---|---|---|---|
| `ban-proxy-catch-all-defaults` | A `calledWith` argument that is a function literal returning `true` with no condition | Syntax | Yes |
| `ban-proxy-empty-called-with` | A `calledWith([])` on a handle from `registerMock({ fn })` where `fn` takes arguments | Syntax for the empty array, the type checker for `fn`'s signature | No — ward only |
| `ban-invented-failures` | A hand-made `Error` given to a mock's `rejects`, `throws`, or a throwing `implement`, in a proxy or test file | Syntax | Yes |

Tag `ban-proxy-catch-all-defaults` and `ban-invented-failures` `'pre-edit'` in
`packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`.
`ban-proxy-empty-called-with` gets no `'pre-edit'` tag.

## Teaching text this item changes

Per rows 2376-2378: `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:297`
drops its "allowed when a parent proxy builds this adapter without describing any call of its own"
exception, and its line-38 example (`handle.calledWith([]).resolves(FileContentsStub({value: 'content'}))`)
becomes `handle.calledWith([filePath]).resolves('content')`. Hand these specific line-level rewrites to
Z03, which owns `get-testing-patterns` text, so the wording lands once, not once per item.

## Done when

- All three rules exist, are scanned over the whole repo, hand-checked on a sample, then turned on.
- `enforce-proxy-patterns`'s `adapterProxyMustSetupMocks` message no longer describes a default-behavior
  exception.
- Every proxy the rules flag is fixed: addressed calls replace catch-alls, recorded failures replace
  hand-made errors.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- Fixing a catch-all default can silently change a test's outcome from "passes because everything is
  staged" to "the trap fires because nothing was staged for this specific call" — read what test actually
  needs the call before just adding an address; do not just widen the address until it passes.
- A recorded-failure stub does not exist for every kind of hand-made error yet — some of these fixes may
  need a new stub built first, which is G16/G18's job in the gateway (a Phase 1 item), not this item's. If
  a fix needs a stub that does not exist, report it under LEFT STANDING rather than inventing one inline.
- Do this per package, in small batches — the CLAUDE.md dispatch rule caps cleanup agents at 1-3 files;
  this item's own split note allows up to 4 for migration-shaped work, but stay on the low end when a
  proxy file is large.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>

## Plan — T05 ward

Scanned `packages/ward/**/*.ts` with all three rules on, through a temporary config
(`tmp/t05-ward.config.js`, extends `eslint.config.js`) driven by the ESLint Node API
(`tmp/t05-scan.js`; bare `npx eslint` is hook-blocked). One violation, before any edit:

- `packages/ward/src/brokers/command/run/multi-package-layer-broker.proxy.ts:77`
  `ban-proxy-empty-called-with` — `configResolveHandle.calledWith([])` on `configResolveBroker`,
  which takes `{ filePath }`.

`ban-proxy-catch-all-defaults` and `ban-invented-failures` flag nothing in ward. Fix: the proxy
stages the default config per rootPath, addressed by the exact `{ filePath }`, from the shared
`resolveWardBin` step every setup method already calls; the one test that calls
`setupWardConcurrency` now calls it after `setupSpawnAndLoad`, since the later staging wins.
Rescanned after the edit: 0 violations across the three rules.

## Plan — T05 cli, config, hooks

Scanned each package alone with all three rules on (`node tmp/t05-scan-pkgs.js <pkg>`). Violations before any edit:

- `packages/cli/src/brokers/gateway/source-copy/gateway-source-copy-broker.proxy.ts:17`
  `ban-proxy-empty-called-with` — `cpHandle.calledWith([])` on `cp`, which takes source, destination, options.
- `packages/cli/src/brokers/package/scaffold-write/package-scaffold-write-broker.proxy.ts:26`
  `ban-proxy-empty-called-with` — `dirnameHandle.calledWith([])` on `dirname`.
- `packages/cli/src/responders/cli/create-package/cli-create-package-responder.proxy.ts:44`
  `ban-proxy-empty-called-with` — `basenameHandle.calledWith([])` on `basename`.
- `packages/cli/src/responders/install/setup-gateway/install-setup-gateway-responder.proxy.ts:35`
  `ban-proxy-empty-called-with` — `basenameHandle.calledWith([])` on `basename`.
- `packages/hooks/src/responders/hook/session-snippet-packages/hook-session-snippet-packages-responder.proxy.ts:80`
  `ban-invented-failures` — `Object.assign(new Error('ENOENT: ...'), { code: 'ENOENT' })`.
- `packages/config`: none.

Fixes: `copySucceeds({ folder, packageRoot })` computes the real source root the way the broker does and
stages `cp` by exact source, destination and `{ recursive: true }`; the setup-gateway responder proxy
drops its constructor-time staging and exposes `setupGatewayCopy` instead. `dirname` needs no default
because `setupTargetMissing` already stages each exact path. Both responder proxies stage `basename` by
the exact project root their setup method is handed. The hooks proxy stages `FileMissingErrorStub`.
Rescanned: 0 violations across the three rules in all three packages.

## Plan — T05 server, mcp, tooling

Scanned each package alone with all three rules on. Violations before any edit (three in all):

- `packages/server/src/brokers/image/serve/image-serve-broker.proxy.ts:30`
  `ban-proxy-empty-called-with` — `dirnameHandle.calledWith([])` on `dirname`, which takes a path.
- `packages/mcp/src/brokers/orchestrator/get-quest-status/orchestrator-get-quest-status-broker.test.ts:30` and `:41`
  `ban-invented-failures` — `new Error(...)` handed to the proxy's `throws`.
- `packages/tooling`: none.

Fixes: the image-serve proxy stages `dirname` by the exact path each setup method is handed and by that
path's parent, the two calls the broker makes. The get-quest-status proxy's `throws({ processId, error })`
becomes `setupServerError({ processId, message })`, since what it stages is the server's HTTP 500 body and
never a thrown error; both tests pass the message.

## Plan — T05 eslint-plugin, local-eslint

Scanned each package alone with all three rules on (`node tmp/t05-scan-pkgs.js <pkg>`). Violations before any edit:

- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.proxy.ts:51`
  `ban-proxy-empty-called-with` — `readHandle.calledWith([])` on raw `readFileSync`.
- `packages/local-eslint`: none.

Fix: the proxy stages two complementary predicates on the path, each with the gateway's fixed `'utf8'`
encoding, one returning the `getContents` text and one throwing `FsErrorStub` ENOENT. Rescanned: 0.

## Plan — T05 shared, hydration, session-forensics

Scanned each package alone with all three rules on. Violations before any edit: `packages/shared` 54
(35 `ban-proxy-empty-called-with`, 19 `ban-invented-failures`), spread over 33 proxy files under
`src/brokers/architecture/**` (boot-tree, edge-graph, event-bus, export-name-resolve, import-edges,
orphan-detect, package-e2e-eligible-detect, package-inventory, package-type-detect, project-map,
responder-annotations, source-read, state-writes, widget-tree, ws-edges, ws-gateway), plus
`config-root/find`, `cwd/resolve`, `port/config-walk`, `project-root/find` and one test
(`import-edges/read-source-layer-broker.test.ts`). `packages/hydration`: none. `packages/session-forensics`: none.

Fixes: the read-file layer proxies drop the constructor `calledWith([]).returns('')` fallback; their
`setupImplementation` addresses `[anyPath]` (a `typeof value === 'string'` predicate), one argument short of
the gateway's `[path, 'utf8']` or `[path, { withFileTypes: true }]`, so an exact `setupReturns` / `setupError`
still outranks it regardless of call order. A full-arity predicate ties the exact address and lets the
later staging win, which broke `architectureProjectMapBrokerProxy` and `httpEdgesToAnnotationsLayerBrokerProxy`.
Every `new Error('ENOENT')` becomes `FileMissingErrorStub({ path })`. The three path-walk proxies drop their
`dirname` passthrough default, since each setup already stages `dirname` by exact path. Rescanned: 0 violations.

## Plan — T05 last hits and switch-on

Planned 2026-09-29 by a read-only agent (no code changed, no ward run). Re-scanned with
`node tmp/t05-scan-pkgs.js <pkg>` (an ESLint Node API run through `tmp/t05-ward.config.js`, not ward),
one package at a time, with all three rules on:

| Package | Result |
|---|---|
| `orchestrator` | 3 `ban-proxy-empty-called-with`: `src/brokers/quest/get-next-step/build-spawn-instruction-layer-broker.proxy.ts:11`, `src/startup/start-orchestrator.proxy.ts:398`, `src/startup/start-orchestrator.proxy.ts:400` |
| `testing` | 2 `ban-invented-failures`, both in `src/transformers/mock-staging-create/mock-staging-create-transformer.test.ts` (lines 35 and 86) — concession 13's file |
| `siegelense`, `hydration-recipes`, `web`, `@gateway/node`, `@gateway/npm`, `@gateway/browser`, `@gateway/bin` | 0 (the EPIC T05 row lists these as "not yet swept"; they are swept and clean) |

So three orchestrator hits and one concession-13 file are all that is left. B18 and T06 did not move any of
them. The `enforce-proxy-patterns` message no longer carries the "default mock behavior" sentence (item
Work 4 is done); the `get-testing-patterns` wording at `architecture-testing-patterns-broker.ts:297` is Z03's.

### 1. The two `start-orchestrator.proxy.ts` constructor defaults

The two are the ones whose function takes an argument; the other six constructor defaults (`getServerConfig`,
`listGuilds`, `getRateLimits`, `getDispatchState`, `normalizeDispatchBoot`, `stopAllChats`) stage functions that
take none, which the rule passes.

- `removeGuildHandle.calledWith([]).resolves(undefined)` (line 398). `StartOrchestrator.removeGuild` takes `{ guildId }`.
- `findQuestByWorkItemIdHandle.calledWith([]).resolves(null)` (line 400). It takes `{ workItemId }`.

Callers, found by a walk over `packages/server` and `packages/mcp`. `mcp` has none: its proxies compose
`StartOrchestratorProxy` but nothing in `packages/mcp` reaches either method.

- `removeGuild`: only `packages/server/src/responders/guild/remove/guild-remove-responder.ts:36`. Its one test that
  relies on the default is the success case at `guild-remove-responder.test.ts:6`; the four other cases never reach the
  orchestrator or stage their own error. `packages/server/src/flows/guild/guild-flow.integration.test.ts` runs the real
  harness and is unaffected.
- `findQuestByWorkItemId`: only `packages/server/src/responders/server/init/server-init-responder.ts:629`, in the
  cache-miss branch of the chat-output relay. The only test that sends a workItemId-only payload is
  `server-init-responder.test.ts:1158`, and it subscribes to quest X first, which fills `workItemQuestIdCache` (source
  lines 260 and 873), so the call may never fire in any current test. This is unproven until the default is deleted and
  the file runs.

Options:

1. **Address by argument, drop the constructor default (recommended for both).** Delete lines 398 and 400. Add a
   named scenario `removeGuildResolves({ guildId })` to `StartOrchestratorProxy` staging
   `removeGuildHandle.calledWith([{ guildId }]).resolves(undefined)`. `findQuestByWorkItemIdReturns({ workItemId, questId })`
   already exists (it stages `calledWith([{ workItemId }])`), so `findQuestByWorkItemId` needs no new orchestrator
   scenario: a test that needs the miss calls `findQuestByWorkItemIdReturns({ workItemId, questId: null })`.
   Every caller opts in by argument, which is what the trap wants: a forgotten call now fails loudly.
2. Named opt-in scenario with a wildcard address (`isObjectArgument`, as `replayChatHistorySetupSuccess` does).
   Rejected: `removeGuild` and `findQuestByWorkItemId` both have an obvious real address, and concession 10 admits an
   any-argument address only for a virtual-file-tree `setupImplementation`.
3. Concession (keep the two defaults with a file-scoped `off`). Rejected: one caller each, so the concession would
   cost more than the edit.

Two things the agent must check rather than assume. An unstaged call on a `registerMock` handle throws
(`packages/testing/CLAUDE.md`: "the unconditional throw-on-unmatched default"), so a test that reached the deleted
default now fails on that throw. For `findQuestByWorkItemId` the throw is synchronous inside the event handler, before
the `.then(...).catch(...)` chain at `server-init-responder.ts:629-637` is attached, so that chain does not absorb it.
If `server-init-responder.test.ts` goes red after the deletion, add
`setupWorkItemLookupMiss: ({ workItemId }) => void` to `ServerInitResponderProxy` (it calls
`orchestrator.findQuestByWorkItemIdReturns({ workItemId, questId: null })`) and call it in the red test, asserting the
same frames as before.

Files that change (full paths):

- `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/packages/orchestrator/src/startup/start-orchestrator.proxy.ts` (delete lines 398 and 400; add `removeGuildResolves` to the return type and body)
- `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/packages/server/src/responders/guild/remove/guild-remove-responder.proxy.ts` (add `setupRemoveGuildSuccess({ guildId })` over `orchestrator.removeGuildResolves`)
- `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/packages/server/src/responders/guild/remove/guild-remove-responder.test.ts` (the test at line 6 calls it)
- only if `server-init-responder.test.ts` goes red: `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/packages/server/src/responders/server/init/server-init-responder.proxy.ts` and `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/packages/server/src/responders/server/init/server-init-responder.test.ts`

### 2. The `stderr` recorder: a rule fix, and F72

The third orchestrator hit is `build-spawn-instruction-layer-broker.proxy.ts:10-11`:
`registerSpyOn({ object: stderr, method: 'write' })` then `stderrSpy.calledWith([]).implement(() => true)`, with
`callsMatching([])` reading the calls back at line 16. It is an honest recorder (`@gateway/node`'s own
`stderr.proxy.ts` is the same shape over `process.stderr` and passes). The rule misreads it because
`voidSinkSpyLayerBroker` matches `process.stderr` member-expression text, and an Identifier object is accepted only as
`process` with `on` (`void-sink-spy-layer-broker.ts:23-25`). The other spy in orchestrator,
`orchestration-resume-responder.proxy.ts:118`, only reads the shared spy and stages nothing, so it needs no change.

Fix: track the import, do not match the bare name. A name match on `stderr` would exempt any local variable called
`stderr`.

- `packages/eslint-plugin/src/brokers/rule/ban-proxy-empty-called-with/rule-ban-proxy-empty-called-with-broker.ts`:
  add an `ImportDeclaration` listener. For a source starting with `#gateway/node/process`, record the LOCAL name of each
  specifier whose imported name is `stderr` or `stdout` in a `Set<Identifier>` (an `as` alias records the alias). Pass
  the set to the layer in the `VariableDeclarator` branch that already calls it (line 121).
- `.../void-sink-spy-layer-broker.ts`: take `gatewaySinkNames`; in the Identifier branch return
  `(node.name === 'process' && method === 'on') || (method === 'write' && gatewaySinkNames.has(node.name))`.
- Tests: `.../void-sink-spy-layer-broker.integration.test.ts` gains rows (`stderr` and `stdout` with `write` and the
  name in the set: true; the same name not in the set: false; `stderr` with `on`: false; an aliased local name in the
  set: true). `.../rule-ban-proxy-empty-called-with-broker.integration.test.ts` gains one valid case
  (`import { stderr } from '#gateway/node/process'`, spy, `calledWith([])`, `callsMatching([])` read-back) and one
  invalid case where `stderr` is a local `const stderr = { write: (chunk: string): boolean => chunk.length > 0 }` with a
  read-back (not imported, so still a catch-all). Do NOT write an invalid case that needs the gateway import to resolve
  its type: the fixture tsconfig (`test/fixtures/ban-proxy-empty-called-with/tsconfig.node.json`) will not resolve
  `#gateway/node/process`, and an unresolvable type makes the rule stay silent. The two typed integration tests already
  run about 10 s each (F92), so add cases sparingly.

**F72: close it, do not fold it in.** The rule already covers `registerSpyOn`: its header names it, its
`VariableDeclarator` reads `object` and `method`, `typed-spy-method-takes-no-args-layer-broker.ts` reads the method's
signature, and the integration test's first invalid case is "ward's own stderr spy" (`process.stderr`, `write`,
`emptyCalledWithRequiresArgs`). The EPIC row's "still inspect only `registerMock`" is stale. `ban-proxy-catch-all-defaults`
is not handle-based (it flags a function literal returning `true` inside a constructor-scoped `calledWith`), so F72 does
not apply to it. The operator marks F72 done in EPIC.md; this item file cannot.

### 3. Switch-on

Order matters: the two `ban-*` rules read 0 in every package only after batches A and B below land.

1. Scan first, one package at a time, until each reads 0: `node tmp/t05-scan-pkgs.js orchestrator` (expect `total 0`),
   then `node tmp/t05-scan-pkgs.js testing` (expect the 2 concession-13 hits and nothing else). `siegelense`,
   `hydration-recipes`, `web` and the four `@gateway/*` packages were scanned clean and need no re-scan unless files in
   them change first.
2. `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`: lines 201 and 202 change
   `'off'` to `'error'` for `ban-proxy-catch-all-defaults` and `ban-invented-failures`, and the comment at 198-200 is
   rewritten to state the rule as it stands. Replace the commented-out line 219 with the live entry
   `'@dungeonmaster/ban-proxy-empty-called-with': 'error'` and rewrite the comment above it (215-218).
3. `packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts`, the `WARD_ONLY_TYPE_CHECKED_RULES`
   array (lines 16-24): add `'@dungeonmaster/ban-proxy-empty-called-with'`. Without it the test at line 308 fails, because
   registering the rule in the config demands an enforce-on entry and this rule cannot have one (it needs the type
   checker; the statics header says a type-checked rule "carries no entry here at all"). The other two rules already
   carry `'pre-edit'` at `packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts:90-91`, so `shared` does not change.
4. `eslint.config.js`, after the `packages/testing/src/index.ts` entry (line 322-327), before the commented block at 328:
   a file-scoped entry with `files: ['packages/testing/src/transformers/mock-staging-create/mock-staging-create-transformer.test.ts']`
   and `rules: { '@dungeonmaster/ban-invented-failures': 'off' }`, under a comment giving the reason (that test checks an
   opaque value passes through the mock-staging API; the rule reads no message or `code`), naming concession 13. Same
   shape as concessions 14 and 9 at lines 304-319. No inline disable.
5. `dungeonmasterCustomRules` feeds the gateway block by omission (config broker lines 268-279 omit only six other
   rules), so all three rules also apply inside `packages/@gateway/*`, as the item requires.

### Batches

| Batch | Files | Runs | Checks and gate |
|---|---|---|---|
| A (1 agent) | `packages/orchestrator/src/startup/start-orchestrator.proxy.ts`, `packages/server/src/responders/guild/remove/guild-remove-responder.proxy.ts`, `packages/server/src/responders/guild/remove/guild-remove-responder.test.ts` | side by side with B (disjoint packages) | `npm run ward -- --only lint,typecheck,unit -- <those three> packages/server/src/responders/server/init/server-init-responder.test.ts`. The fourth path is run, not edited, to learn whether the `findQuestByWorkItemId` default was load-bearing. Typecheck grades `orchestrator` and `server` whole. No `mcp` gate: no `mcp` file calls either method. |
| A2 (only if server-init is red) | `packages/server/src/responders/server/init/server-init-responder.proxy.ts`, `packages/server/src/responders/server/init/server-init-responder.test.ts` | after A | same command over those two files |
| B (1 agent) | `packages/eslint-plugin/src/brokers/rule/ban-proxy-empty-called-with/void-sink-spy-layer-broker.ts`, `.../void-sink-spy-layer-broker.integration.test.ts`, `.../rule-ban-proxy-empty-called-with-broker.ts`, `.../rule-ban-proxy-empty-called-with-broker.integration.test.ts` | side by side with A | `npm run ward -- --only lint,typecheck,unit,integration -- <those four>`; gate `eslint-plugin`. F92: the two typed integration tests may trip the slow-test gate again, report it as the known row. |
| C (operator or 1 agent, alone) | `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`, `packages/eslint-plugin/src/dungeonmaster-rule-enforce-on.integration.test.ts`, `eslint.config.js` | after A and B, and after step 1's scans read as expected; nothing beside it, because it changes every package's lint verdict | `npm run ward -- --only lint,typecheck,unit,integration -- <the two eslint-plugin files>`, then one lint pass over every package that has proxies, or a single `npm run ward -- --only lint` at a quiet tree, to prove no package went red. Gate: `eslint-plugin` on all four checks, then lint on `orchestrator`, `server`, `mcp`, `testing`, `shared`, `ward`, `cli`, `hooks`, `siegelense`, `web` and the `@gateway/*` packages. |

Three batches (four if A2 is needed). No build: ward and the scan script load the rules from TypeScript source, and
the `shared` statics do not change. The operator decides afterwards whether to rebuild `eslint-plugin` for the
pre-edit hook to see the two newly-on `pre-edit` rules, and `npm run check:consumer` at the Phase 3 close proves a
consumer's copied gateway proxies pass them.

Tracking edits for the operator, since this file cannot carry them: EPIC.md's T05 row loses "Not yet swept: ..." and
gains "orchestrator: 3 left, testing: 1 file under concession 13"; F72 becomes done; step 5 and "Open decisions" drop
the two constructor defaults once batch A lands.
