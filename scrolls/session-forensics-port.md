# `packages/session-forensics`

Digests Claude Code session transcripts and a quest's sign-off ledger, for post-mortem analysis of a
quest run. A single quest's transcripts routinely exceed 200 MB across a dozen sessions and 300
sub-agents; this turns them into something an analyst — human or agent — can work from.

Run it:

```bash
node packages/session-forensics/dist/bin/session-forensics-entry.js <command> <target>
```

| Command | Target | Gives |
|---|---|---|
| `summary` | a session id, or `agent-<hex>` | wall clock, API responses, the five token counts, tool histogram |
| `buckets` | same | spend per fixed window, so a total does not hide where it landed |
| `gaps` | same | every gap over the floor, labelled with the sub-agents live across it, split into blocked versus truly idle |
| `coverage` | a quest id | per flow, per sign-off track: owed, signed, confirmed, unconfirmable, unsigned |

The package is a workspace but **deliberately absent from the root `package.json` dependencies**, so
ward covers it and users who install `dungeonmaster` never receive it. Adding that one line is how it
ships, when you want it to.

## Parity

`coverage` reproduces, exactly, the denominators three independent analyses derived against
`get-qa-checklist` for quest `1be07040-b9ec-476c-a439-0b4fbb0123cd`:

| Flow | codeweaver | flowrider | siegemaster |
|---|---|---|---|
| `paste-image-into-composer` | 58 owed / 58 signed | 58 / 58 | 74 / 74 |
| `send-message-with-images` | 61 / 60 | 59 / 59 | 71 / 67 |
| `render-images-in-transcript` | 69 / 68 | 68 / 68 | 75 / 0 |

`summary` on session `d1b89f89-6f71-40c8-aaf3-094dedb15b8d` reproduces that item's forensic report:
219.9 min, 714,282 output, 69,432,974 context-in.

## Two numbers the output labels, because both were misread

**`API CALLS` carries the parenthetical `(assistant records — one API response spans several
transcript lines)`.** One response is split across a text record, a thinking record and one per
tool_use, and every one of them repeats that response's usage. Counting lines overstates it several
times over.

**`coverage` ends every render with `NOT AUTHORITATIVE`.** `isTrackOwedUnitGuard` applies four of the
six exclusions in the orchestrator's `signoffTrackEligibilityStatics` — flow type, unit kind,
observable provenance, verification method. The other two, flow slice and package slice, narrow by
what an individual OPERATION ITEM declares, and a whole-quest reading has no operation item. So every
number is an upper bound and `get-qa-checklist({ questId, operationItemId })` stays the authority.

## Two rules that cost real measurement error

**A node typed `terminal` that still points onward is not a terminal unit** (`isTerminalUnitGuard`,
quoting `flowriderPromptStatics`). On `paste-image-into-composer`, 7 nodes are typed terminal and 4
carry an outgoing edge; the real count is 3. Counting all 7 put every track 4 above the true
denominator.

**All seven off-map probe families are OWED on every runtime flow**, whatever `offMapSignoffs`
contains — that array holds only the ones already signed. Counting the array under-reports what is
owed, and on one flow reported 0 owed where 7 were.

## Reuse from `@dungeonmaster/shared` — check here before building

Eight things were reused rather than rebuilt. The first cut of this port duplicated shared's path
layer and had to be deleted:

| Need | Use |
|---|---|
| `SessionId`, `AgentId`, `AbsoluteFilePath`, `FilePath`, `ContentText`, `QuestId`, `FlowNodeId`, `FlowNodeType`, `SignoffVerdict` | `@dungeonmaster/shared/contracts` |
| the whole flow graph shape — `flowContract.array()` validates nodes, edges, observables and off-map sign-offs in one call | `flowContract` |
| `DUNGEONMASTER_HOME` else `~/.dungeonmaster` | `dungeonmasterHomeFindBroker` |
| safe JSON parsing | `safeJsonParseTransformer` |
| the seven off-map probe families | `qaOffMapProbeStatics` |
| every directory-name literal | `locationsStatics` — `no-bare-location-literals` enforces it |
| fs / path / os I/O | the adapters, and their proxies from `@dungeonmaster/shared/testing` |

Shared's three `locationsClaude*FindBroker` resolvers were read and deliberately NOT used: each needs
a known `guildPath` to encode the project-dir slug, and `transcriptResolveBroker` exists precisely
because the caller has only a bare id. It composes the same primitives instead.

Two one-line additions were made to shared, each in the sanctioned home for what it adds:
`locationsStatics.repoRoot.dungeonmasterDevHome` and the `fs-read-file-sync-adapter.proxy` export in
`testing.ts`.

## Rules the pre-edit hook enforces, each of which blocked a write here

1. **No regex literals in `statics/`** — only `contracts`, `guards`, `transformers` may hold one.
2. **Stub signature is exactly `({ ...props }: StubArgument<T> = {})`.**
3. **No two `expect(x.a)` / `expect(x.b)` assertions on one object** — that reads as property bleedthrough.
4. **A `transformers/` file cannot import `zod`.** Narrow loose external data with native TypeScript
   (`typeof x === 'object' && x !== null && 'key' in x`), then hand the assembled object to a
   CONTRACT's `.parse()`. `as`, `any` and `Reflect.get` are all banned as escape hatches.
5. **Guard parameters must be optional** (`enforce-optional-guard-params`); return `false` when any is missing.
6. **A test file cannot import from `contracts/`** — build data through `.stub.ts`.
7. **`brokers/` and `responders/` both require a two-level `<domain>/<action>/` path.**
8. **`ban-primitives` reaches further than expected** — it blocks `as readonly string[]`, a `Map<string, X>`
   generic (use `Map<X['idField'], X>`), and a return-type annotation on an inline `.map()` callback.
9. **A NAMED helper `const fn = () => {}` is blocked even at module scope** (`forbid-non-exported-functions`);
   only the file's primary export may be a named function. Anonymous callbacks are fine.
10. **`enforce-stub-usage` blocks a `const` whose initializer is not built from `*Stub()` spreads** — test
    data that must bypass a contract's validation has to be inlined at the call site.
11. **zod v3: a key present but `undefined` is not an absent key.** `Stub({ field: undefined })` yields an
    own-property set to `undefined`, which `toStrictEqual` distinguishes from omission. To test a
    genuinely absent optional, parse a literal that omits it and compare against a stub that omits it too.
    Three agents hit this independently.
12. **Two lint rules fight over nullable `let`s.** `@typescript-eslint/init-declarations` wants
    `= undefined`; `no-undef-init` strips it back off, so ward's `--fix` oscillates. Track the underlying
    value instead and derive the nullable at the end.

## Open cleanup

None of these changes behaviour; each is a lint-satisfying shape worth a second look.

1. `records-to-buckets-transformer.ts` uses `ReturnType<typeof Math.floor>`. The sibling form
   `ReturnType<typeof Number>` is precedented in `dependencyGraphTopologicalOrderTransformer` and ward's
   runner harness; the `Math.floor` variant appears nowhere else. Prefer the precedented spelling.
2. The same file compares `String(block.type) === 'tool_use'`. Check whether the direct branded
   comparison actually fails before keeping the wrapper.
3. `tool-use-to-brief-transformer.ts` takes an inline structural type rather than the block contract.
   `transcriptRecordContentBlockContract` now exists — point it there.
4. `transcript-record`, `transcript-summary`, `time-bucket` and `turn-gap` each brand their own
   timestamp inline. `isoTimestampContract` was added after they were written; point all four at it.
