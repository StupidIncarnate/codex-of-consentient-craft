# DEF-230: quest update, reach and operation write routes read the global DUNGEONMASTER_HOME, not the target's home

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Package | hydration-recipes |
| Found | 2026-09, `scrolls/seigelense/remaining-build-items.md` item 8a |
| Moved from | `scrolls/seigelense/remaining-build-items.md` section 8, 2026-09-30 |

## What is wrong

A `write` route must honour the `target` it is given. The guild write route now does: it hands `guildAddBroker` `home: target.home`. Three routes still do not.

- `quest-update-route-broker.ts` and `quest-reach-route-broker.ts` call `questModifyBroker` and `questGetBroker`.
- `operation-write-route-broker.ts` calls `questGetBroker`.
- Neither orchestrator broker takes a `home` or `target` parameter. Both resolve `process.env.DUNGEONMASTER_HOME`.

A caller that builds a `DmTarget` by hand and does not set the env var writes quest files under `target.home`, then reads and modifies whatever `~/.dungeonmaster` the process defaults to. The failure is inconsistent: a loud error in one shape, a silently empty result in another. A silently empty result manufactures a false defect report against working code.

Checked 2026-09-30: `quest-modify-broker.ts` has no `home` in it. `packages/hydration-recipes/CLAUDE.md`, section "A `DmTarget` alone does not isolate every `write` route from the real machine", still describes the gap.

## What should happen

Every route reaches storage only through the target it was handed. Add an optional `home` parameter to `questModifyBroker` and `questGetBroker` (the shape `guildAddBroker` carries) and pass `target.home` from each route. `fileTargetHarness` can then stop pinning the env var.

The general rule belongs in `packages/hydration/CLAUDE.md` under "A route lives on the INGREDIENT; the target picks which one runs": a route that reaches code resolving its own storage location escapes the target. Check whether that sentence is there; add it if not.

## Where to look

- `packages/hydration-recipes/src/brokers/quest/update-route/quest-update-route-broker.ts`
- `packages/hydration-recipes/src/brokers/quest/reach-route/quest-reach-route-broker.ts`
- `packages/hydration-recipes/src/brokers/operation/write-route/operation-write-route-broker.ts`
- `packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts`, `quest-get-broker.ts`
- `packages/hydration-recipes/test/harnesses/file-target/file-target.harness.ts`

## History

- Item 8a named the guild and quest write routes as spanning two stores. The guild half was fixed (`home: target.home` in `guild-write-route-broker.ts`; the quest write route uses `${target.home}/...`). This file is the half that remains.
- Full reasoning: `packages/hydration-recipes/CLAUDE.md`, section named above.
