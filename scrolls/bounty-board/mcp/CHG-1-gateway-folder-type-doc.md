# CHG-1: Write a `gateway` folder-type doc for `get-folder-detail`

| | |
|---|---|
| Kind | change |
| Status | ready |
| Package | mcp |
| Found | 2026-09-30, read-only check of `scrolls/gateway/followup-sustainability.md` after the gateway pivot merged (788165421) |
| Moved from | `scrolls/gateway/followup-sustainability.md`, "Docs and teaching text to update" and "Work carried over from the gateway build", 2026-09-30. That doc is deleted; git history holds it |

## What to build

Every folder type has a doc that `get-folder-detail({ folderType })` serves, from `packages/mcp/src/statics/folder-constraints/<type>-constraints.md`, mapped in `folderConstraintsStatics`. The gateway has none: the `get-folder-detail` enum has no `gateway`. Part of the topic is covered by `get-architecture`'s "Outside Packages: the Gateway" section and the `consumerGatewayWrapper` snippet.

Add `gateway-constraints.md`, served as `get-folder-detail({ folderType: "gateway" })`. How `folderConfigStatics` describes the gateway is open: its fields assume a `fileSuffix` and an `exportSuffix`, and gateway files carry neither.

Write it from the code as it is, not from this list. Topics to cover:

| Topic | Where it stands today |
|---|---|
| What goes in: anything whose shape someone else controls, reached through `npm`, `node`, `browser` or `bin`. Jest is `#gateway/npm/jest__globals` | `packages/@gateway/npm/src/jest__globals/` |
| The import form `#gateway/<kind>/<subpath>`, `__` for `/` and scopes, no `.js` | `gatewayPathFromImportSourceTransformer` in `shared` |
| Layout: subpath folder, `{subpath}.ts` barrel, `{subpath}.proxy.ts`, one folder per export with its test, proxy, stubs and schemas, `.error.ts` beside the thrower, nothing deeper | `packages/@gateway/node/src/fs`; the `gateway-colocation` and `gateway-layout` rules |
| What a barrel may hold; a named re-export replacing the raw one from `export *`; the global form `export const { document } = globalThis;` | `packages/@gateway/browser/src/document/document.ts` |
| Side-effect-only pass-throughs and the `sideEffects` list | `packages/@gateway/npm/package.json` |
| Composing two outside calls is a broker in the owning package, not a gateway function | `portKillListenersBroker` in `shared` |
| Return types: the package's type, a gateway-declared type, or `unknown` | the `gateway-return-unknown-not-caller-type` rule |
| Stubs, and `#Gateway<Type>` schemas | the `gateway-schema-brand` rule; `child-process-schema.ts` |
| Proxies: no catch-all defaults, recorded failures, read-back; callers import each proxy from its own file | `get-testing-patterns`; `ban-proxy-catch-all-defaults` |
| The `gateway` config: `bannedExports`, `restrictedTo` | `.dungeonmaster.json`; `gateway-lint-config-contract.ts` |
| Dependencies: each outside package listed in its gateway package, one installed copy | `gateway-dependency-declared`; the dedupe check in ward lint |
| Worked examples: `fs`, `glob`, `zod`, `document` | those folders under `packages/@gateway/*/src/` |

## Where to look

- `packages/mcp/src/statics/folder-constraints/`
- `packages/shared/src/statics/folder-config/folder-config-statics.ts`

## History

Planned in the gateway follow-up doc's "A `gateway` folder-type doc" (2026-09-26), and as epic item Z01 (`scrolls/brands-gateways-epic/items/z01-gateway-folder-type-doc.md`, P3). Still not built on 2026-09-30.
