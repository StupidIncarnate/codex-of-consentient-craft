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

The directory-name rule fires on the literal itself, wherever it sits.

*Tried:*

```ts
  subagentsDir: 'subagents',
```

*Blocked:*

```
@dungeonmaster-local/no-bare-location-literals Do not use the raw location literal 'subagents'. It belongs to `locationsStatics.userHome.claude.subagentsDir` — compose the absolute path via the corresponding resolver under @dungeonmaster/shared/brokers/locations instead of hardcoding the literal.
```

Shared's three `locationsClaude*FindBroker` resolvers were read and deliberately NOT used: each needs
a known `guildPath` to encode the project-dir slug, and `transcriptResolveBroker` exists precisely
because the caller has only a bare id. It composes the same primitives instead.

Two one-line additions were made to shared, each in the sanctioned home for what it adds:
`locationsStatics.repoRoot.dungeonmasterDevHome` and the `fs-read-file-sync-adapter.proxy` export in
`testing.ts`.

## Rules the pre-edit hook enforces, each of which blocked a write here

1. **No regex literals in `statics/`** — only `contracts`, `guards`, `transformers` may hold one.

   *Tried*, in a since-deleted `transcript-location-statics.ts`:

   ```ts
   cwdSeparatorPattern: /[^A-Za-z0-9]/gu,
   ```

   *Blocked:* `Line 22:24 - Regex literals are not allowed in statics/ folder. Only allowed in: contracts, guards, transformers.`

2. **Stub signature is exactly `({ ...props }: StubArgument<T> = {})`.**

   *Tried*, in `token-usage.stub.ts`:

   ```ts
   export const TokenUsageStub = (overrides: StubArgument<TokenUsage> = {}): TokenUsage =>
   ```

   *Blocked:*

   ```
   Line 4:32 - Stub functions must use spread operator in parameters: ({ ...props }: StubArgument<Type> = {})
   Line 4:32 - Function parameters must use object destructuring pattern: ({ param }: { param: Type })
   ```

3. **No two `expect(x.a)` / `expect(x.b)` assertions on one object** — that reads as property bleedthrough.

   *Tried*, in `transcript-location-statics.test.ts`:

   ```ts
   expect(transcriptLocationStatics.subagentMetaExtension).toBe('.meta.json');
   expect(transcriptLocationStatics.transcriptExtension).toBe('.jsonl');
   ```

   *Blocked:* `Use single toStrictEqual on complete object instead of testing individual properties. Testing 2 properties of "transcriptLocationStatics" separately allows property bleedthrough`

4. **A `transformers/` file cannot import `zod`.** Narrow loose external data with native TypeScript
   (`typeof x === 'object' && x !== null && 'key' in x`), then hand the assembled object to a
   CONTRACT's `.parse()`. `as`, `any` and `Reflect.get` are all banned as escape hatches.

   *Tried*, in `record-to-token-usage-transformer.ts`:

   ```ts
   import { z } from 'zod';

   const rawUsageContract = z.object({
     input_tokens: z.number().int().nonnegative().optional(),
     output_tokens: z.number().int().nonnegative().optional(),
   ```

   *Blocked:* `Line 18:1 - transformers/ cannot import external package "zod". Only internal imports allowed.`
   — and, cascading off the same schema, five of
   `Line 24:17 - z.number() must be chained with .brand() - use z.number().positive().brand<'PositiveNumber'>() instead of z.number().positive()`

5. **Guard parameters must be optional** (`enforce-optional-guard-params`); return `false` when any is missing.

   *Tried*, in `is-terminal-unit-guard.ts`:

   ```ts
   export const isTerminalUnitGuard = ({
     nodeId,
     nodeType,
     edgeSourceIds,
   }: {
     nodeId: FlowNodeId;
     nodeType: FlowNodeType;
     edgeSourceIds: readonly FlowNodeId[];
   }): boolean => {
   ```

   *Blocked:*

   ```
   Line 21:3 - Parameter "nodeId" in guard function must be optional (use "nodeId?: Type")
   Line 22:3 - Parameter "nodeType" in guard function must be optional (use "nodeType?: Type")
   Line 23:3 - Parameter "edgeSourceIds" in guard function must be optional (use "edgeSourceIds?: Type")
   ```

   `is-track-owed-unit-guard.ts` took the identical block on its `track` and `unit` parameters.

6. **A test file cannot import from `contracts/`** — build data through `.stub.ts`.

   *Tried*, in `record-to-token-usage-transformer.test.ts`:

   ```ts
   import { transcriptRecordContract } from '../../contracts/transcript-record/transcript-record-contract';
   ```

   *Blocked:* `Line 2:1 - Test files must not import from contracts (including types). Use ../../contracts/transcript-record/transcript-record.stub instead.`

7. **`brokers/` and `responders/` both require a two-level `<domain>/<action>/` path.**

   *Tried:*

   ```
   src/brokers/transcript-resolve/transcript-resolve-broker.ts
   src/responders/digest-run/digest-run-responder.ts
   ```

   *Blocked* — the violation is reported against line 1 of the import block, not against a name:

   ```
   Line 13:1 - Lvl2: Folder "brokers/" requires depth 2 but file is at depth 1. Expected pattern: src/brokers/brokers/[domain]/[action]/[domain]-[action]-broker.ts
   Line 12:1 - Lvl2: Folder "responders/" requires depth 2 but file is at depth 1. Expected pattern: src/responders/responders/[domain]/[action]/[domain]-[action]-responder.ts
   ```

8. **`ban-primitives` reaches further than expected** — it blocks `as readonly string[]`, a `Map<string, X>`
   generic (use `Map<X['idField'], X>`), and a return-type annotation on an inline `.map()` callback.

   All three land the same message, so it is the *shape* that has to be recognised, not the wording:
   `Raw string type is not allowed. Use the discover endpoint to search for existing contracts (e.g., EmailAddress, UserName, FilePath, etc.). If none fits, create a new contract.`

   *Tried*, in `track-denominator-statics.test.ts`:

   ```ts
   (trackDenominatorStatics.byTrack[track].unitKinds as readonly string[]).includes('off-map'),
   ```

   *Tried*, in `coverage-to-text-transformer.ts` (`Line 44:26`):

   ```ts
   const byFlow = new Map<string, TrackCoverage[]>();
   ```

   `records-to-summary-transformer.ts` took eight at once — `Line 37:26` string / `Line 37:34` number, and
   the same pair on lines 38 and 39 — from three consecutive `new Map<string, number>()` declarations.

   *Tried*, in `record-to-flat-text-transformer.ts` (`Line 25:42`):

   ```ts
   const pieces = blocks.flatMap((block): string[] => {
   ```

   and in `tool-use-to-brief-transformer.ts` (`Line 31:17`):

   ```ts
   .map((key): string => {
   ```

9. **A NAMED helper `const fn = () => {}` is blocked even at module scope** (`forbid-non-exported-functions`);
   only the file's primary export may be a named function. Anonymous callbacks are fine.

   *Tried*, at module scope in `summary-to-text-transformer.ts`:

   ```ts
   const formatNumber = (value: number): string => value.toLocaleString('en-US');
   ```

   *Blocked:* `Line 20:22 - Non-exported functions are forbidden. All functions must be the primary export of their file. This appears to be a data transformation. Extract it to a new file in transformers/ folder with a DOMAIN-SPECIFIC name (e.g., transformers/format-user-name/format-user-name-transformer.ts). DO NOT use generic names like "helper", "util", "formatter". First, search the codebase to see if this functionality already exists before creating a new file.`

   The first cut of `quest-find-broker.ts` took the same on a module-scope `const findQuestUnderRoot = ({ rootPath, questId }) => …`.

10. **`enforce-stub-usage` blocks a `const` whose initializer is not built from `*Stub()` spreads** — test
    data that must bypass a contract's validation has to be inlined at the call site.

    *Tried*, in `quest-to-units-transformer.test.ts`:

    ```ts
    const validNode = FlowNodeStub({ id: 'done', type: 'terminal', packages: ['web'] });
    const node = {
      ...validNode,
      codeweaverSignoff: {
        evidence: 'packages/x/src/a-transformer.test.ts:42',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        at: '2026-01-01T00:00:00.000Z',
      } as never,
    };
    const validFlow = FlowStub({ id: 'malformed-flow', nodes: [], edges: [] });
    const flow = { ...validFlow, nodes: [node] };
    ```

    *Blocked* — four times in that write, at `497:20`, `506:20`, `535:20`, `545:20`:
    `Line 497:20 - Use stub function instead of inline object/array literal. Create or use existing stub for type "Object".`

    A plain shared constant in the same file, `const UNSIGNED_TRACKS = { codeweaverSignoff: false, flowriderSignoff: false, siegemasterSignoff: false };`,
    took the identical message at `Line 13:25`.

11. **zod v3: a key present but `undefined` is not an absent key.** `Stub({ field: undefined })` yields an
    own-property set to `undefined`, which `toStrictEqual` distinguishes from omission. To test a
    genuinely absent optional, parse a literal that omits it and compare against a stub that omits it too.
    Three agents hit this independently.

    *Tried*, in `transcript-record-content-block-contract.test.ts`:

    ```ts
    const result = transcriptRecordContentBlockContract.parse({
      type: 'tool_use',
      name: 'Read',
      input: { file_path: '/tmp/x.ts' },
    });

    expect(result).toStrictEqual(
      TranscriptRecordContentBlockStub({
        type: 'tool_use',
        text: undefined,
        name: 'Read',
        input: { file_path: '/tmp/x.ts' },
      }),
    );
    ```

    *Blocked* — not by lint, by jest (`npm run ward -- detail <runId> <filePath>`):

    ```
    FAIL  "transcriptRecordContentBlockContract valid input VALID: {type: tool_use, name, input} => returns the branded block"
      Error: expect(received).toStrictEqual(expected) // deep equality

    - Expected  - 1
    + Received  + 0

      Object {
        "input": Object {
          "file_path": "/tmp/x.ts",
        },
        "name": "Read",
    -   "text": undefined,
        "type": "tool_use",
      }
    ```

    The whole failure is that one `-   "text": undefined,` line: the stub carried the own-property, the
    parse omitted it. The fix asserted against a literal with `text` left out entirely.

12. **Two lint rules fight over nullable `let`s.** `@typescript-eslint/init-declarations` wants
    `= undefined`; `no-undef-init` strips it back off, so ward's `--fix` oscillates. Track the underlying
    value instead and derive the nullable at the end.

    *Tried*, in `records-to-summary-transformer.ts`:

    ```ts
    let earliestTimestamp: TranscriptRecord['timestamp'];
    let latestTimestamp: TranscriptRecord['timestamp'];
    ```

    *Blocked:*

    ```
    @typescript-eslint/init-declarations Variable 'earliestTimestamp' should be initialized on declaration. (line 44)
    @typescript-eslint/init-declarations Variable 'latestTimestamp' should be initialized on declaration. (line 45)
    ```

    Appending `= undefined` to both lines and re-running ward produced those same two errors, verbatim,
    twice more. A `Read` at offset 40 after each run showed line 44 back to
    `let earliestTimestamp: TranscriptRecord['timestamp'];` — the `--fix` lint pass had already stripped
    the initializer. `no-undef-init` never prints a message; it only autofixes, so the loop looks like
    the same single error refusing to be fixed.

## Four provisional shapes, and what they turned out to be

Each of these passed lint and shipped, then a later pass tested its premise. Three were unnecessary;
one was a real gap. The ratio is the point — most of what reads as sloppiness in agent-written code is
a reasonable local decision made without context a later file created.

| Was | Now | Why it existed |
|---|---|---|
| `ReturnType<typeof Math.floor>` in `records-to-buckets` | `ReturnType<typeof Number>` | an invented variant of a real idiom; the precedented spelling works in the same position |
| `String(block.type) === 'tool_use'` | `block.type === 'tool_use'` | written to "sidestep branded-type comparability ambiguity" that was never tested for. `block.type` is `string & {brand}`; the direct comparison typechecks |
| an inline `{ name?: string; input?: … }` in `tool-use-to-brief` | `TranscriptRecordContentBlock` | when that file was written the block schema was still a private const inside `transcript-record-contract.ts`. A later agent extracted it for unrelated reasons, which made the fix possible |
| four contracts carrying their own timestamp | `isoTimestampContract` | a genuine gap. `transcript-record` and `turn-gap` branded their own (`TranscriptRecordTimestamp`, `TurnGapStartedAt`); `transcript-summary` and `time-bucket` carried bare `z.string().datetime()` with **no brand at all** |

Consolidating the timestamps needed **zero downstream re-brands**, for a reason worth knowing before
attempting a similar change: a brand is a covariant subtype of `string`, and `.parse()` takes
`unknown`. So every consumer either handed the value to a contract or read it as a plain string, and
neither cared which brand it wore.

`coverage` reproduces the parity table above unchanged after all four.
