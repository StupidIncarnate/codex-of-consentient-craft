# A02: Delete the forwarder adapters

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/gateway/followup-sustainability.md` "Adapters the gateway does not replace" table row 1 (line 332); `scrolls/adapters-to-one-place.md` "The direction", item 8; `scrolls/brands-types-tests-rules.md` T6 (1855-1872), 2141, 2156-2158 |
| Needs | [A00](a00-orchestrator-own-proxy.md) |
| Runs with | any item outside `mcp`, `server` — and (see Traps) touches one file each in `orchestrator` and `siegelense` too, so [A10](a10-adapters-orchestrator.md) and [A13](a13-adapters-siegelense.md) must not schedule those two specific files while this item is active |
| Packages touched | mcp, server, orchestrator (one file), siegelense (one file) |
| Checks to run | lint, typecheck, unit |
| Split | operator splits: one agent group per package, 2 to 4 files per agent |
| Runs alone | no, but see the file-level exclusion above |

## Why

A one-line forward into another of our own packages earns nothing — direction #8 in
`scrolls/adapters-to-one-place.md` ("The direction") says our workspace packages call each other directly, with
no wrapper, and the follow-up doc's own table (line 332) counts 67 such files: 18 in `mcp/src/adapters/orchestrator/`,
47 in `server/src/adapters/orchestrator/`, plus `dungeonmaster-config-resolve-adapter.ts` in both `orchestrator` and
`siegelense`. Each caller today imports the adapter; after this item it imports `@dungeonmaster/orchestrator` or
`@dungeonmaster/config` directly. [A00](a00-orchestrator-own-proxy.md) already built the proxies this item's
callers need, so their tests can stage a real call into the other package without breaking T6 (no mocking another
workspace package's own exports).

## Current state

Census confirmed 2026-09-26 by directory listing (not just the doc's count):

- `packages/mcp/src/adapters/orchestrator/` holds exactly 18 files (matches the doc). Every one is a thin forward
  — confirmed by reading `orchestrator-get-quest-adapter.ts` (`StartOrchestrator.getQuest`) and
  `orchestrator-bootstrap-adapter.ts`.
- `packages/server/src/adapters/orchestrator/` holds exactly 47 files (matches the doc). **[A01](a01-dead-adapters.md)
  already deleted one of these — `orchestrator-recover-active-quests-adapter.ts` — because its census found zero
  real callers in `server`.** That leaves 46 real forwarders here. Confirmed by reading three of them:
  - `orchestrator-get-quest-adapter.ts` calls `StartOrchestrator.getQuest` (the common shape — most of the 46 call
    a `StartOrchestrator` method by the matching name).
  - `orchestrator-list-quests-full-adapter.ts` calls `questListBroker` directly (a SPECIFIC broker, not the
    `StartOrchestrator` barrel) — confirmed by reading it: `import { questListBroker } from '@dungeonmaster/orchestrator';`.
    Its proxy is `questListBrokerProxy`, imported per file as
    `@dungeonmaster/orchestrator/brokers/quest/list/quest-list-broker.proxy`.
  - `orchestrator-events-on-adapter.ts` calls `orchestrationEventsState.on` directly (the event-bus STATE MODULE,
    not a broker and not `StartOrchestrator`) — confirmed by reading it. Its proxy,
    `orchestration-events-state.proxy.ts`, exists on disk but is not yet exported from `testing.ts` — [A00](a00-orchestrator-own-proxy.md)'s
    step 2a covers adding that export.
  - `orchestrator-find-quest-path-adapter.ts` calls `questFindQuestPathBroker` (per `stays-as-adapter.md`) and
    `orchestrator-outbox-watch-adapter.ts` calls `questOutboxWatchBroker` — two more specific-broker forwards, not
    `StartOrchestrator` calls. Expect more of these among the 46; read each file rather than assuming the
    `StartOrchestrator` shape.
- `packages/orchestrator/src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` and
  `packages/siegelense/src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` are
  byte-identical forwards into `@dungeonmaster/config`'s `configResolveBroker` (confirmed by reading both).
  [A00](a00-orchestrator-own-proxy.md) already gave `config` per-file `./*.proxy` and `./*.stub` export keys, so
  `configResolveBrokerProxy` is imported as `@dungeonmaster/config/brokers/config/resolve/config-resolve-broker.proxy`.

## Work

For every file below (18 + 46 + 2 = 66 real forwarders — one fewer than the doc's 67 because A01 already deleted
the 67th as dead code):

1. Read the adapter file. Note exactly what it calls: `StartOrchestrator.<method>`, a specific named broker, or a
   state module.
2. Find every caller of the adapter within its own package (`discover` or a `python3` os.walk + regex one-liner —
   Bash `grep`/`find` and native Grep/Glob are blocked by hooks).
3. Change each caller to import the real thing directly:
   - `import { StartOrchestrator } from '@dungeonmaster/orchestrator';` and call `StartOrchestrator.<method>({...})`
     with the same arguments the adapter forwarded, when the adapter called `StartOrchestrator`.
   - `import { <brokerName> } from '@dungeonmaster/orchestrator';` directly, when the adapter called a specific
     broker.
   - `import { orchestrationEventsState } from '@dungeonmaster/orchestrator';` directly, for the event-bus case.
   - `import { configResolveBroker } from '@dungeonmaster/config';` directly, for the two config-resolve files.
4. Update the caller's own `.proxy.ts`: replace `registerMock({ fn: orchestratorXAdapter })` (or whatever it staged)
   with the composed gateway/workspace proxy — `startOrchestratorProxy()` for a `StartOrchestrator` call,
   `questListBrokerProxy()` (or the matching specific-broker proxy) for a specific-broker call, and so on. Per T3,
   named scenarios live on the proxy being composed, not reinvented in the caller's own proxy.
5. Delete the adapter file and its colocated `.test.ts` and `.proxy.ts`.
6. Preserve the caller's own behaviour exactly — do not change what arguments are passed or how the result is
   used; this item only removes a layer of indirection, and R1/T-rule compliance in the caller's OWN code is a
   later item's job unless the adapter's deletion forces a return-type change (a forwarder rarely changes the
   shape it passes through, so this should be rare — if it happens, report it under DECISIONS).

## Done when

- `packages/mcp/src/adapters/orchestrator/` no longer exists.
- `packages/server/src/adapters/orchestrator/` no longer exists (A01 already removed
  `recover-active-quests`; this item removes the other 46 plus the now-empty folder).
- `packages/orchestrator/src/adapters/dungeonmaster-config/` and
  `packages/siegelense/src/adapters/dungeonmaster-config/` no longer exist.
- Every caller in `mcp` and `server` that used to call one of these adapters now imports
  `@dungeonmaster/orchestrator` (or the specific broker/state module) directly, and its `.proxy.ts` composes
  `startOrchestratorProxy` or the matching broker-specific proxy, each imported per file, such as
  `@dungeonmaster/orchestrator/startup/start-orchestrator.proxy`. No caller imports a `/testing` barrel.
- `orchestrator` and `siegelense` each import `@dungeonmaster/config`'s `configResolveBroker` directly, and their
  proxies compose `configResolveBrokerProxy`, imported per file.
- `npm run ward -- --only lint,typecheck,unit -- packages/mcp packages/server packages/orchestrator/src/adapters/dungeonmaster-config packages/siegelense/src/adapters/dungeonmaster-config` (narrowed to the exact files touched) exits 0.

## Traps

- **Server and mcp typecheck `@dungeonmaster/orchestrator` from its compiled `dist`** (brands doc, 2156-2158). If
  [A00](a00-orchestrator-own-proxy.md)'s `testing.ts` additions landed after orchestrator's `dist/` was last built,
  this item's typecheck fails on a method that genuinely exists in source. Report BUILD NEEDED for
  `@dungeonmaster/orchestrator`; do not build it yourself.
- **Do not assume every one of the 46 remaining `server` forwarders calls `StartOrchestrator`.** At least three
  confirmed exceptions exist (`questListBroker`, `orchestrationEventsState`, `questFindQuestPathBroker`,
  `questOutboxWatchBroker`) — read each file.
- **The one-file overlap with `orchestrator` and `siegelense`.** This item's own package list is mostly `mcp` and
  `server`, but it also edits one file each in `orchestrator` and `siegelense`. [A10](a10-adapters-orchestrator.md)
  and [A13](a13-adapters-siegelense.md) must exclude `dungeonmaster-config-resolve-adapter.ts` from their own scope
  — it is not theirs to delete, it is this item's.
- A02's own agents must not edit anything under `mcp/src/adapters/` OR `server/src/adapters/` OUTSIDE the
  `orchestrator/` subfolder — those are [A09](a09-adapters-mcp.md)'s and [A11](a11-adapters-server.md)'s scope.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->

## Operator's split (2026-09-27)

Several callers use more than one forwarder, and several forwarders have more than one caller. So the split is by CALLER file, and no caller-group agent deletes an adapter. A last agent deletes every adapter folder once no caller imports one.

| Group | Caller files |
|---|---|
| S1 | server `responders/guild/{add,get,list,remove}` |
| S2 | server `responders/guild/update`, `responders/directory/browse`, `responders/orchestration/{bootstrap,dispatch-get}` |
| S3 | server `responders/orchestration/{dispatch-normalize-boot,dispatch-pause,dispatch-play,mode-get}` |
| S4 | server `responders/process/status`, `responders/quest-driven-watchers/bootstrap` (both responders), `responders/quest/abandon` |
| S5 | server `responders/quest/{chat,clarify,comment-batch,delete}` |
| S6 | server `responders/quest/{find-by-session,followup-stop,followup,get}` |
| S7 | server `responders/quest/{list,merge,modify,new}` |
| S8 | server `responders/quest/{pause,projection,resume,riftcarver-detail}` |
| S9 | server `responders/quest/{signal-back,start,summary,user-add}` |
| S10 | server `responders/quest/ward-detail`, `responders/quests/queue`, `responders/rate-limits/get`, `responders/tooling/smoketest-run` |
| S11 | server `responders/tooling/smoketest-state`, `responders/server/init`, `brokers/session/list`, `brokers/quest/wait-for-session-stamp` |
| M1 | mcp `responders/interaction/handle`, `responders/orchestration/bootstrap` |
| M2 | mcp `responders/quest/handle/{quest-handle-responder,get-quest-layer-responder,get-quest-work-layer-responder}` |
| M3 | mcp `responders/quest/handle/{blight-checklist,create-worktree,quest-summary,quest-work}-layer-responder` |
| C1 | `orchestrator` and `siegelense` `adapters/dungeonmaster-config/resolve` and their callers |
| Z | delete `server/src/adapters/orchestrator/`, `mcp/src/adapters/orchestrator/`, and C1's two adapter folders |

A00 named the proxy `StartOrchestratorProxy`, in PascalCase, and it is imported as `@dungeonmaster/orchestrator/startup/start-orchestrator.proxy`.
