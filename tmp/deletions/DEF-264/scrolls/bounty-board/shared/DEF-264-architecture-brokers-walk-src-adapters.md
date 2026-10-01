# DEF-264: Project-map brokers in `shared` still look for `src/adapters/` paths, which no longer exist

| | |
|---|---|
| Kind | defect |
| Status | suspected |
| Package | shared |
| Found | 2026-09-30, read-only check of `scrolls/gateway/followup-sustainability.md` after the gateway pivot merged (788165421) |
| Moved from | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" and "Work carried over from the gateway build", 2026-09-30. That doc is deleted; git history holds it |

## What is wrong

Some of the code behind `get-project-map` finds cross-package edges by looking inside `src/adapters/`. That folder is gone from every package, so these probably find nothing now, and say nothing about it. `adapter-census` fails the same way (F133).

- `packages/shared/src/brokers/architecture/import-edges/architecture-import-edges-broker.ts:89` — `` `${root}/${PACKAGES_REL}/${consumerPkgName}/src/adapters/${sourcePackageName}/` ``
- `packages/shared/src/brokers/architecture/orchestrator-method-extract/architecture-orchestrator-method-extract-broker.ts:20` — `const ORCHESTRATOR_ADAPTER_MARKER = 'adapters/orchestrator/';`
- `packages/shared/src/brokers/architecture/ws-gateway/architecture-ws-gateway-broker.ts:3` — "A gateway is detected by walking adapters"
- `architecture-boot-tree-broker.ts:2` — "startup → flows → responders → adapters" (comment)

## What should happen

Confirm first. Run `get-project-map` for `server` and `web`, and check whether the cross-package edges and the orchestrator method lines still appear. If they are missing, find edges the way callers import today: `@dungeonmaster/<pkg>/<barrel>` imports and the orchestrator's startup API. Add a test that fails when the map loses those edges.

## Where to look

The three brokers above, and their tests under `packages/shared/src/brokers/architecture/`.

## History

Found by the 2026-09-30 docs check, which looked for leftover adapter paths in source as well as in docs. Not yet confirmed against a real map.
