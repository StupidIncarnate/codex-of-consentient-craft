# CHG-2: `get-project-map` should list the gateway as one name, `#gateway`

| | |
|---|---|
| Kind | change |
| Status | ready |
| Package | shared |
| Found | 2026-09-30, read-only check of `scrolls/gateway/followup-sustainability.md` after the gateway pivot merged (788165421) |
| Moved from | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" and "Work carried over from the gateway build", 2026-09-30. That doc is deleted; git history holds it |

## What to build

`get-project-map` and `get-project-inventory` already accept `#gateway` and render its grouped section. But `get-project-map`'s list of valid names shows the four gateway packages separately: "Valid: bin, browser, cli, config, …, node, npm, …". An agent picking a package from that list never learns `#gateway` exists. The `<dungeonmaster-packages>` snippet already lists `#gateway` as one entry.

Make the valid-name list show `#gateway` in place of `bin`, `browser`, `node` and `npm`. Decide whether the four bare names stay accepted as aliases.

## Where to look

- The `get-project-map` error that lists valid names; find it with `discover` under `packages/shared/src/brokers/architecture/` and `packages/mcp/src/`
- `architecture-gateway-inventory-broker.ts` for how `#gateway` is rendered

## History

Planned in the gateway follow-up doc ("The discovery tools show the gateway as `#gateway`", and the `<dungeonmaster-packages>` row). The rendering half is done; the valid-name list was still split on 2026-09-30.
