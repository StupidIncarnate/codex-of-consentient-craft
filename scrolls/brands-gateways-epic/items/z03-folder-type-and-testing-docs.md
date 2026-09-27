# Z03: `get-folder-detail` and `get-testing-patterns`

| | |
|---|---|
| Phase | Phase 6 — docs and finish |
| Source | `scrolls/brands-types-tests-rules.md`, folder-type docs table (2346-2365), testing-patterns table (2367-2390); `scrolls/gateway/followup-sustainability.md`, rows 425-428 |
| Needs | every A, B, G, T item |
| Unblocks | Z07 |
| Packages touched | `mcp` (`folder-constraints-transformer.ts`, `architecture-folder-detail-broker.ts`, `architecture-testing-patterns-broker.ts`, the `*-constraints.md` files), `shared` (`folder-config-statics.ts`), `eslint-plugin` (`enforce-proxy-patterns` message), `testing` (`CLAUDE.md`) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent for `get-folder-detail`-side files, one agent for `get-testing-patterns`-side files |
| Runs alone | no (runs with Z01, Z02, Z04-Z06) |

## Why

`get-folder-detail` and `get-testing-patterns` are two more MCP-served teaching surfaces, alongside
`get-architecture` (Z02) and the gateway's own new doc (Z01). Both still teach pre-epic rules: ad-hoc
type bans that do not distinguish our types from a library's, brand rules from before B1-B9, "mock npm
dependencies at the adapter boundary" instead of composing a gateway wrapper's proxy, and a home-sandbox
section that does not exist yet.

## Current state

Confirmed present, exact current content not re-verified against the doc's line citations (dated
2026-09-24/25):

- `packages/mcp/src/transformers/folder-constraints/folder-constraints-transformer.ts`
- `packages/mcp/src/brokers/architecture/folder-detail/architecture-folder-detail-broker.ts`
- `packages/mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts`
- `packages/mcp/src/statics/folder-constraints/contracts-constraints.md`,
  `transformers-constraints.md`, `responders-constraints.md`, `adapters-constraints.md` (the last one
  goes away with the `adapters/` folder type per Phase 2/A19, not edited here — see Traps)
- `packages/shared/src/statics/folder-config/folder-config-statics.ts`
- `packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.ts`
- `packages/testing/CLAUDE.md`

## Work

### `get-folder-detail` side

| Where (approx.) | Says today | Change to | Doc rule |
|---|---|---|---|
| `folder-constraints-transformer.ts`, ~10 folder types | "All types must come from contracts/" | "Our own types come from contracts/. A library's types are imported from the library." | C2 |
| same file, a "must not" item | "Use raw primitives (string, number) in signatures" | "A field of an object contract is branded. A parameter, return or local is plain, unless it is a field taken through `Owner['key']`." | B1, B6 |
| `architecture-folder-detail-broker.ts` | "Ad-hoc Types Forbidden: All types must come from contracts" | "Ad-hoc types forbidden: our own types come from contracts/, and a library's types from the library." | C2 |
| `contracts-constraints.md` | "All contracts MUST use `.brand<'TypeName'>()` on primitives" | "Every object contract, every object nested in it, and every string and number field carries `.brand<'…'>()`, with the text derived from the owner and the key." | B1, B3 |
| `transformers-constraints.md` | "All transformers MUST validate output using contracts" | "A transformer that returns one of our objects builds it through the object's contract parse. Loose text and numbers are returned plain." | B1, B6 |
| `transformers-constraints.md`, example line | `return contentTextContract.parse(config.purpose);` | `return config.purpose;` | B6 |
| `folder-config-statics.ts`, contracts `allowRegex` | `false` | `true` | B2 |
| `folder-config-statics.ts`, contracts `purpose` | "All data structures must be defined here with branded types." | "Type definitions and validation schemas for the data we define. Every object and every field in it is branded." | B1, C2 |
| `folder-config-statics.ts`, contracts `allowedImports` | No npm package except zod, beside our own statics/errors/contracts and two workspace packages | Unchanged for values; `import type` from a package is allowed in every folder through `enforce-import-dependencies` | C2 |
| `folder-constraints-transformer.ts` / `responders-constraints.md` | "Mock only I/O boundaries (adapters)" | "Mock only what the I/O trap or MSW catches, through the gateway wrapper's proxy." | T2 |
| `contracts-constraints.md` | "Test files MUST import from `.stub.ts` files, NOT from `-contract.ts` files" | "Test files import each stub from its own `.stub.ts` file, never from a contract or a production barrel." | C6 |
| `contracts-constraints.md`, example stub path | `src/contracts/eslint-context/eslint-context.stub.ts` | Removed: that copy is deleted, and an outside type's stub comes from the gateway | C1, C5 |
| `contracts-constraints.md`, new section | nothing on a field holding an outside type | "A field holding an outside package's type reuses the gateway's schema, branded `'#Gateway<Type>'`. Never `z.custom` or `z.instanceof` in a contract." | C9 |
| `contracts-constraints.md`, new section | nothing on unused contracts | "A contract nothing in production parses is deleted, with its stub and test." | C1 |
| `folder-constraints-transformer.ts`, every folder type | no line on outside packages | "An outside package, type or value, is imported only through `#gateway/<folder>/<subpath>`." | C2, gateway |
| every function-exporting folder's `*-constraints.md` | the `void` ban, with `AdapterResult` as the way out | R1's wording, matching the `get-architecture` row in Z02 | R1 |

`adapters-constraints.md` and the adapters rows of `folder-config-statics.ts` go with the `adapters/`
folder type itself — do not edit `adapters-constraints.md` here; A19 (Phase 2, "adapters stops being a
folder type") deletes it. If A19 has not deleted it by the time this item runs, report that under LEFT
STANDING rather than editing it, since editing a file about to be deleted duplicates work.

### `get-testing-patterns` side

| Where (approx.) | Says today | Change to | Doc rule |
|---|---|---|---|
| `architecture-testing-patterns-broker.ts` | "Raw primitives: return types must be branded" | Drop the return rule. Keep "to test an invalid input, use `as never`". | B6 |
| same file | "define types in contracts/ and import them" | "define our types in contracts/ and import them" | C2 |
| same file | "**Adapters** - Mock npm dependencies (axios, fs, etc.) at adapter boundary" | "Mock a call the I/O trap or MSW catches: compose the gateway wrapper's proxy, imported from its own file, in the proxy of the file that calls it. Pass-throughs run real." | T1, T2 |
| same file | "Compose adapter proxies, provide semantic setup" | "Compose the proxies of the gateway wrappers the broker calls, each imported from its own `.proxy` file, and provide semantic setup." | T1, T2 |
| `packages/testing/CLAUDE.md` | "Path adapter proxies: real passthrough via `requireActual`" | Removed. `path` is a pass-through in the gateway, runs real, and has no proxy. | T2 |
| `architecture-testing-patterns-broker.ts` | constructor-level `calledWith([])` catch-all allowed "when a parent proxy builds this adapter without describing any call of its own" | Drop the exception. A function that takes arguments never gets a constructor default. | T4 |
| same file, example | `handle.calledWith([]).resolves(FileContentsStub({value: 'content'}))` | `handle.calledWith([filePath]).resolves('content')` | T4, B6 |
| `enforce-proxy-patterns` message | "This sets up default mock behavior when proxy is created." | Drop that sentence. | T4 |
| `architecture-testing-patterns-broker.ts` | says nothing about the home sandbox; lists `os.homedir` among no-argument functions to mock | Add the five author rules from T07's "Jest home sandbox" section. Add: "`os.homedir` needs no mock for isolation; it already returns the sandbox." | T2, T07 |
| `packages/testing/CLAUDE.md:105-107` | calls the teardown leak check "the one guard left for code the lint rule `ban-bare-os-home-tmp` can't see" | "The leak check is the guard that the sandbox held. The lint rule is gone." | T07 (do not duplicate — confirm T07 has not already made this exact edit before repeating it) |
| `architecture-testing-patterns-broker.ts` | "Branded Strings: Use single `value` property + `contract.parse(value)`" | Removed. No standalone brand contract exists (B2). | B2, B6 |
| same file | EndpointMock is not for "server-side tests"; enable by adding `start-endpoint-mock-setup.ts` to a package's own `setupFilesAfterEnv` | MSW loads in every package from the root Jest base config, server included | T8/T01 |
| same file | "Only 2 things mocked: I/O npm dependencies + global functions" diagram | "Mocked: what the I/O trap or MSW catches, and globals a test pins. Everything else runs real." | T1, T2 |
| same file | "Contracts ❌ No — Use stubs (.stub.ts files)" | Add: "An outside type — an AST node, a rule context, a `ChildProcess` — comes from the gateway's stub, imported from its own file. Never build one by hand and cast it." | C5 |
| same file, new section | nothing on where test support lives | "Import each stub and proxy from its own file. No production barrel exports them." | C6 |
| same file, new section | nothing on gateway proxies | "The proxy of a file that calls a gateway wrapper composes that wrapper's proxy, imported from the `.proxy` file beside the wrapper. A pass-through runs real and has no proxy. Tests import outside packages through the gateway too." | T1, T2, T3, T7 |
| same file, new section | nothing on catch-all answers | "No `calledWith([])`, and no predicate that is always true, in a proxy constructor for a function that takes arguments. Stage each call by its arguments." | T4 |
| same file, new section | nothing on gateway-branded fields | "A contract field branded `'#Gateway<Type>'` takes the gateway's stub in a stub argument: `ScanStub({ proc: ChildProcessStub() })`. A partial fake does not compile." | C9 |
| same file, new section | nothing on building failures | "A failure comes from a wrapper proxy's named scenario, such as `fileMissing`, or a recorded-failure stub from the gateway, such as `FileMissingErrorStub`. Never a hand-made `Error`." | T5 |
| same file, new section | nothing on mocking another workspace package | "Never `registerMock` another workspace package's export. Compose the proxy it ships beside its API, such as `startOrchestratorProxy`." | T6 |

## Lint rules this item adds or changes

None. Text only, plus one message-string change in `enforce-proxy-patterns` (already listed above), which
mirrors what T05 does to that same file — confirm T05 has not already made this exact edit before
repeating it; if it has, skip it here and note under DECISIONS.

## Teaching text this item changes

This entire item is teaching text: every file named in the two tables above.

## Done when

- Every row in both tables is applied to the finished code's actual current text.
- `adapters-constraints.md` is either already deleted (A19 done) or left untouched with a LEFT STANDING
  note.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- `enforce-proxy-patterns`'s message change overlaps with T05's own work on the same file — check T05's
  status before editing, to avoid two agents editing the same line inconsistently.
- `packages/testing/CLAUDE.md`'s home-sandbox sentence overlaps with T07 — same caution.
- Every stub/proxy import example written into any of these docs must read a per-file path —
  `#gateway/<kind>/<subpath>/<wrapper>/<wrapper>.proxy` or `@dungeonmaster/<pkg>/<path under src>.proxy` —
  per EPIC.md concession 1; never a `_test_` barrel path.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
