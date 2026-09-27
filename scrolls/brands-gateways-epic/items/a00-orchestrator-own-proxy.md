# A00: Orchestrator ships its own proxy, and so does config

| | |
|---|---|
| Phase | Phase 2 — delete every adapter |
| Source | `scrolls/brands-types-tests-rules.md` T6 (lines 1855-1872) and T3's "a workspace package's own proxies" (1749-1790, esp. 1768-1771); `scrolls/gateway/followup-sustainability.md` "Delete every adapter" row 1 (lines 330-332); EPIC.md concession 3 |
| Needs | [P0-1](p0-1-baseline-ward.md), [G26](g26-per-file-proxy-and-stub-imports.md) (the per-file `exports` keys and the hoister resolvers that read them) |
| Unblocks | [A02](a02-forwarder-adapters.md), and every later item whose callers stop mocking `@dungeonmaster/orchestrator` or `@dungeonmaster/config` directly |
| Packages touched | orchestrator, config |
| Checks to run | lint, typecheck, unit |
| Split | one agent |
| Runs alone | no other agent may edit `orchestrator` or `config` while this item is active — both packages, not just orchestrator, because this item adds a `config` proxy too (EPIC.md's own "Runs with" column names only orchestrator; treat `config` as equally exclusive until the operator updates that column) |

## Why

`mcp/src/adapters/orchestrator/` (18 files) and `server/src/adapters/orchestrator/` (47 files) are one-line
forwarders into `@dungeonmaster/orchestrator`. Gateway follow-up item's "Delete every adapter" table (line 332)
says these get deleted outright — their callers import orchestrator directly (design direction #8). A02 does that
deletion. Two more one-line forwarders count in the same row's total of 67: orchestrator's own
`dungeonmaster-config-resolve-adapter.ts` and siegelense's copy, both of which forward into `@dungeonmaster/config`'s
`configResolveBroker`.

Once A02 deletes those forwarders, the callers left behind in mcp, server, orchestrator and siegelense import
`@dungeonmaster/orchestrator` or `@dungeonmaster/config` directly. T6 (brands doc, 1855-1872) then refuses any test
that mocks another workspace package's own exports with `registerMock`/`registerModuleMock` — the only legal way
left to stage what a real call into that package would return is the package's own proxy, built beside its own
entry point. That proxy has to exist BEFORE A02 deletes the forwarders, or A02's callers have nothing legal to
compose. EPIC.md's concession 3 is exactly this: build orchestrator's own proxy in Phase 2, item A00, ahead of
where T6 normally lands (Phase 5, T04) — the lint rule that ENFORCES T6 still waits for T04, but the proxy is built
here so A02's agents can follow the rule from day one instead of writing code that fails it later.

## Current state

Checked 2026-09-26 against the real files.

- `packages/orchestrator/src/startup/start-orchestrator.ts` exports `StartOrchestrator`, one object holding every
  orchestrator method (`getQuest`, `modifyQuest`, `getNextStep`, `handleSignalBack`, …). Confirmed by reading the
  file in full — every method delegates to a `Flow` (`QuestFlow.get`, `OrchestrationFlow.start`, and so on).
- `packages/orchestrator/src/startup/start-orchestrator.proxy.ts` does **not exist** (the `startup/` folder holds
  only `start-install.ts`, `start-install.integration.test.ts`, `start-orchestrator.ts`,
  `start-orchestrator.integration.test.ts`). This item creates it.
- `packages/orchestrator/testing.ts` is the package's `/testing` barrel. `packages/orchestrator/package.json`
  already has a `./testing` export pointing at it (confirmed). Today it re-exports individual broker proxies
  (`questGetBrokerProxy`, `questListBrokerProxy`, `guildAddBrokerProxy`, …) and stubs, one export line per broker —
  there is no proxy that composes `StartOrchestrator` as a whole.
- `packages/orchestrator/src/index.ts` / `index.proxy.ts` / `index.test.ts` is a **second, unrelated** barrel.
  `index.proxy.ts` today is exactly `export const indexProxy = (): Record<PropertyKey, never> => ({});` (confirmed
  by reading it) — an intentionally empty proxy for a package-import-order regression test (brands doc, 2129-2131).
  Do not confuse this file with the one this item creates, and do not add anything to it.
- The real failure shape this item must match: `packages/orchestrator/src/brokers/quest/get/quest-get-broker.ts`,
  lines 77-83, reads:
  ```ts
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return getQuestResultContract.parse({
      success: false,
      error: errorMessage,
    });
  }
  ```
  confirming the brands doc's claim verbatim — a missing quest (or any other failure inside `QuestFlow.get`) comes
  back as `{ success: false, error: <message> }`, never a thrown error.
- `packages/config/src/brokers/config/resolve/config-resolve-broker.ts` already has a colocated
  `config-resolve-broker.proxy.ts` beside it (confirmed by directory listing). Read it before writing anything —
  it may already stage what this item needs.
- `packages/config/package.json` `exports` has exactly two entries today: `.` (root `index.ts`) and `./contracts`
  (confirmed). There is **no** `./testing` entry, so no other workspace package can import
  `config-resolve-broker.proxy.ts` today, even though the file exists.
- `packages/orchestrator/src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` and
  `packages/siegelense/src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` both read,
  verbatim:
  ```ts
  import { configResolveBroker } from '@dungeonmaster/config';
  import type { DungeonmasterConfig } from '@dungeonmaster/config';
  export const dungeonmasterConfigResolveAdapter = async ({ startPath }: { startPath: FilePath }):
    Promise<DungeonmasterConfig> => configResolveBroker({ filePath: startPath });
  ```
  confirmed identical in both files. A02 deletes both and points their callers at `@dungeonmaster/config` directly.

## Work

1. Write `packages/orchestrator/src/startup/start-orchestrator.proxy.ts`, exporting `startOrchestratorProxy`.
   - It composes `registerMock({ fn: StartOrchestrator.<method> })` for every `StartOrchestrator` method a caller in
     `mcp` or `server` actually calls once A02 lands — read [A02](a02-forwarder-adapters.md)'s item file for the
     concrete list of 18 + 47 forwarders and the `StartOrchestrator` method each one names, so this proxy stages
     exactly what those callers need and nothing invented.
   - Give it at least one named scenario per method, built by reading that method's REAL broker/flow return shape —
     never invent one. Start with:
     - `questNotFound({ questId })` for `getQuest`, staged to resolve `{ success: false, error: 'Quest not found' }`
       (or whatever exact string the real failure chain produces — trace `QuestFlow.get` down to the error that is
       actually thrown for a missing quest file, and use that literal string, not a guess).
     - One scenario per other method A02's callers stage, each read from that method's own broker.
   - Follow T4 (brands doc, 1792-1830): no `calledWith([])` catch-all default for a method that takes arguments.
     Loose addressing (an end-of-pattern match, a predicate) and call read-back (`getCallsFor`) are fine and often
     needed — see T3's note on `globProxy`.
   - Follow T5 (brands doc, 1832-1853): never hand a mock's `rejects`/`throws` a hand-made `new Error(...)`. A
     failure scenario is built from what the REAL broker's own catch block already returns — which is itself often
     built from a recorded failure further down the stack. Trace the call chain to its root instead of inventing a
     shape.
2. Make orchestrator's proxies and stubs importable per file. Add the two per-file keys that G26 proved for
   the gateway to `packages/orchestrator/package.json`'s `exports`, beside the entries it has today:
   `"./*.proxy"` pointing at `./src/*.proxy.ts` and `"./*.stub"` pointing at `./src/*.stub.ts`, with the same
   conditions, in the same order, as the package's other entries. An exact key such as `./testing` still wins
   over a pattern, so nothing that works today breaks. Callers then import
   `@dungeonmaster/orchestrator/startup/start-orchestrator.proxy`. Do not add `startOrchestratorProxy` to
   `packages/orchestrator/testing.ts`: that barrel is deleted by [B03](b03-package-exports-and-per-file-test-imports.md),
   and no new code may depend on it.
2a. Not every mcp/server forwarder calls `StartOrchestrator` — [A02](a02-forwarder-adapters.md)'s census found some
   call a specific broker directly (`questListBroker`, proxied at
   `packages/orchestrator/src/brokers/quest/list/quest-list-broker.proxy.ts`) and at least one calls the event-bus
   state module directly (`orchestrationEventsState.on`, proxied at
   `packages/orchestrator/src/state/orchestration-events/orchestration-events-state.proxy.ts`). With step 2's keys,
   each of these is reachable per file, such as
   `@dungeonmaster/orchestrator/brokers/quest/list/quest-list-broker.proxy`. Read A02's item file for the full
   list, confirm a colocated proxy exists for each target, and build a new proxy file only where none exists.
3. Give `@dungeonmaster/config` the same, for its own single public entry point:
   - Read `config-resolve-broker.proxy.ts` in full first. If it already stages what A02's two callers
     (`orchestrator`, `siegelense`) need, reuse it as-is; do not rewrite a working proxy just to match this item's
     prose.
   - Add the same two per-file keys to `packages/config/package.json`'s `exports`, with the same conditions as its
     `.` and `./contracts` entries. Callers then import
     `@dungeonmaster/config/brokers/config/resolve/config-resolve-broker.proxy`. Add no `./testing` entry and no
     `testing.ts` barrel.
4. Prove the per-file import works end to end before handing back: write or change one test outside orchestrator
   (in `mcp` or `server`) that imports `startOrchestratorProxy` per file, and confirm the proxy-mock hoister hoists
   its `registerMock` calls (the test fails when you remove one). G26 taught the hoister's resolvers the per-file
   keys for the gateway; if they do not yet handle a workspace package's keys, fix that here and say so under
   DECISIONS.
5. Do not delete any forwarder adapter in this item — that is [A02](a02-forwarder-adapters.md)'s job. This item only
   makes the two proxies exist and be reachable from outside their own package, so A02 has something legal to
   compose into on day one.

## Done when

- `packages/orchestrator/src/startup/start-orchestrator.proxy.ts` exists, exports `startOrchestratorProxy`, and
  every scenario's failure shape is read from the real broker or flow it stages — report which file and line each
  scenario's shape came from.
- `packages/orchestrator/package.json` and `packages/config/package.json` each have `./*.proxy` and `./*.stub`
  export keys. Neither package gained a `./testing` entry or a `testing.ts` re-export in this item.
- One test outside orchestrator imports `@dungeonmaster/orchestrator/startup/start-orchestrator.proxy` per file,
  and its hoisted mocks are proven to bite.
- `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/startup/start-orchestrator.proxy.ts packages/orchestrator/package.json packages/config/package.json packages/config/src/brokers/config/resolve/config-resolve-broker.proxy.ts <the proving test>` exits 0.

## Traps

- T6's lint rule (`ban-workspace-export-mocks`) does not land until Phase 5 ([T04](t04-workspace-export-mocks-ban.md)),
  so nothing stops a stray `registerMock({ fn: StartOrchestrator.getQuest })` from compiling today. Build the proxy
  correctly anyway — do not wait for the rule to force it, and do not add one to make a demonstration test pass.
- Server and mcp typecheck `@dungeonmaster/orchestrator` from its **compiled** `dist/src/index.d.ts` (brands doc,
  2156-2158), not from source. A new export on `testing.ts` is visible to source-condition checks (ward's lint,
  typecheck, unit against `orchestrator` itself) immediately, but [A02](a02-forwarder-adapters.md)'s agents in mcp
  and server need `npm run build --workspace=@dungeonmaster/orchestrator` before their own typecheck sees it. Report
  this under BUILD NEEDED; do not run the build yourself (agents never build — see agent-brief.md).
- Do not touch `packages/orchestrator/src/index.proxy.ts` — it is a different, deliberately-empty barrel for a
  package-import-order regression test, not this item's target.
- `packages/orchestrator/package.json`'s `dependencies` already lists `@dungeonmaster/config` (confirmed) — this
  item does not need to add it. Nothing in `orchestrator`'s `package.json` needs a change for this item's own work.

## Concessions made while executing

<!-- Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table. -->
