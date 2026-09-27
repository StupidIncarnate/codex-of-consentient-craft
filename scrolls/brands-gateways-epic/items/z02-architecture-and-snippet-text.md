# Z02: `get-architecture` and the session snippets

| | |
|---|---|
| Phase | Phase 6 — docs and finish |
| Source | `scrolls/gateway/followup-sustainability.md`, "Existing text that changes" rows for `get-architecture` and the session snippets (lines 416-435); `scrolls/brands-types-tests-rules.md`, "Architecture docs: `get-architecture` and the session snippets" (2324-2344) |
| Needs | every A, B, G, T item |
| Unblocks | Z07 |
| Packages touched | `shared` (`architecture-overview-broker.ts`, `session-snippet-statics.ts`) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent |
| Runs alone | no (runs with Z01, Z03-Z06) |

## Why

`architecture-overview-broker.ts` (served by `get-architecture`) and
`session-snippet-statics.ts` (served at every session start, in every repo `dungeonmaster init` has
touched) both teach a rule this epic replaces at several places: `adapters/` as the only way to wrap an
npm package, `node10` module resolution, brand rules from before B1-B9, return-type rules from before R1,
and no line at all on the gateway, test barrels, or the home sandbox. A model that reads either source
today learns rules the code no longer enforces once this epic lands.

## Current state

- `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts` exists, confirmed
  present. Its exact current line numbers were not re-verified against the source doc's citations
  (`:76`, `:96`, `:104`, `:110`, `:119`, `:177`, `:250`, `:264`, `:274`, `:279`, `:336`, `:352`, `:393`) —
  treat every specific line number below as approximate; search the file's text for the quoted sentence
  rather than trusting the number.
- `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` exists, confirmed present.
  Line numbers cited (`:103`, `:104`, `:105`) are similarly approximate.

## Work

Apply every row below to the finished code, not to what the row's "Says today" cell describes — by the
time this item runs, the exact wording may already differ from what these rows quote, since the source
docs were written 2026-09-24 to 2026-09-26. Search for each quoted sentence's substance, not its exact
line number.

### `get-architecture` (`architecture-overview-broker.ts`)

| Says today (approx.) | Change to |
|---|---|
| `lib/` → `adapters/`: "Only adapters wrap an npm package"; forbidden-folders table | "An outside package is reached only through the gateway: `#gateway/<folder>/<subpath>`." Drop the `adapters/` rows. |
| "node10 resolution (`moduleResolution: "node"`, used everywhere) ignores the `exports` map…" | `node16` with the `source` condition; how that resolves a root barrel and `#gateway` |
| layer diagram and import rules: `adapters/` alone may import `node_modules` | every folder type imports outside things through `#gateway`; nothing imports a raw package |
| `adapters/axios/get/axios-get-adapter.ts` as the naming example | a broker path as the example instead |
| "A `brokers/` file may import another package's `contracts`/`adapters`/`brokers`" | drop `adapters` from that list |
| "In `adapters/` only: the npm-package call stays in the parent" | removed with `adapters/`; the layer list adds `contracts`, `transformers`, `statics` and `bindings` (C7, epic item B07) |
| "Returns must be branded Zod contracts — inputs MAY take a raw `string`. The asymmetry is deliberate" | "Every object contract and every string and number field in it is branded. A loose parameter, return or local is plain." (B1, B6) |
| "`ban-primitives` is asymmetric on purpose…" | "Brands live on object contracts: every object and every field there is branded, and nothing else is." |
| "An adapter mocks its own npm package" | "The proxy of the file that calls a gateway wrapper composes that wrapper's proxy, imported from its own file. MSW answers HTTP and WebSocket." |
| `const dagNodeId = dagNodeIdContract.parse(stepId); // ✅ re-brands through validation` | removed — a field that holds another object's id reuses that id's schema (B4), and parsing one id into another brand is refused (B8) |
| `const data = JSON.parse(response) as ApiResponse; // ✅ you know what the compiler cannot` | `const data = apiResponseContract.parse(JSON.parse(response));` (C4) |
| `const indexMap = new Map<ChatEntry, number>(); // ❌ raw number trips ban-primitives` | the `number` form is right; drop the ❌ line (B6) |
| "Types supporting the file's one export may sit beside it" | "An object type that leaves a function is a contract in `contracts/`. A type used only inside one function body stays inline." (B9) |
| no section on where test support lives | add: "A stub sits beside its contract and a proxy beside the file it mocks. No barrel exports either. Tests import each from its own file. Production code never imports one." (C6, adjusted for concession 1) |
| no section on returns beyond the `void` ban | add: "Return what your calls told you. `void` only when every call you discard returned `void`. `{ success: true }` counts as `void`." (R1) |

### Session snippets (`session-snippet-statics.ts`)

| Says today (approx.) | Change to |
|---|---|
| "Returns must be branded Zod contracts — inputs MAY take a raw `string`. The asymmetry is deliberate" | "Every object contract and every string and number field in it is branded. A loose parameter, return or local is plain." (B1, B6) |
| "Tests import `.stub.ts`, never `-contract.ts`; Stubs import contract to parse with" | "Tests import each stub and proxy from its own file, never from a production barrel. A stub for our type parses through its contract. A stub for an outside type comes from the gateway." (C5, C6, adjusted for concession 1) |
| "No `as unknown as` on a brand mismatch — re-parse it: `dagNodeIdContract.parse(stepId)`" | "No `as unknown as` on a brand mismatch. A field that holds another object's id reuses that id's schema. Never parse one id into another brand." (B4, B8) |
| `modifyingCodeGuidance` snippet: no line on outside packages or per-file test imports | add: "Import outside packages only through `#gateway/<folder>/<subpath>`, types included. Import each stub and proxy from its own file." (C2, C6, gateway) |
| `folderTypes` snippet: has an `adapters/` row | remove the `adapters/` row entirely (gateway) |
| `<dungeonmaster-packages>` snippet: lists `@gateway` as one package | change to `#gateway` — the gateway is reached and referred to by its import prefix, not a package name (per "The discovery tools show the gateway as `#gateway`" in the GW follow-up doc) |

## Lint rules this item adds or changes

None. This item is text only.

## Teaching text this item changes

This item's whole output IS teaching text: `architecture-overview-broker.ts` and
`session-snippet-statics.ts`.

## Done when

- Every row above is applied to the finished code's actual current text (not blindly pasted over
  whatever the row's "Says today" cell shows, since that cell may already be stale).
- `<dungeonmaster-packages>` and `<dungeonmaster-folderTypes>` snippets (as served to a live session) show
  `#gateway` and no `adapters/` row respectively.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- Do not paste the row text verbatim without first confirming it against the file — the "Says today"
  column is dated and the file may already read differently by the time this item runs.
- This item and Z01/Z03 both touch documentation served by MCP tools; coordinate scope so no two agents
  edit `architecture-overview-broker.ts` or `folder-config-statics.ts` at once — this item owns
  `architecture-overview-broker.ts` and `session-snippet-statics.ts` only, not the folder-constraints
  `.md` files (Z01, Z03) or `architecture-testing-patterns-broker.ts` (Z03).

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
