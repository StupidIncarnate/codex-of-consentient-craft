# `packages/session-forensics`

This package turns a finished quest into a report you can actually read. It takes two inputs: the transcripts Claude
Code writes for every session, and the sign-off ledger the quest keeps as it runs. Use it after a quest ends, to work
out where the time and the tokens went.

One quest's transcripts routinely run past 200 MB, spread across a dozen sessions and 300 sub-agents. Nobody reads that.
The reports here are small enough that a person, or an agent, can.

Run it:

```bash
node packages/session-forensics/dist/bin/session-forensics-entry.js <command> <target>
```

| Command    | Target                         | Gives                                                                                                                                               |
|------------|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `summary`  | a session id, or `agent-<hex>` | How long it ran, how many API responses came back, the five token counts kept separate, and how many times each tool was called                     |
| `buckets`  | same                           | The same spend split into fixed time windows, so you can see when it happened instead of only the total                                             |
| `gaps`     | same                           | Every pause longer than the cutoff, each one labelled with the sub-agents that were running during it, and split into blocked versus genuinely idle |
| `coverage` | a quest id                     | For each flow and each sign-off track: how many units were owed, signed, confirmed, unconfirmable and unsigned                                      |

Four of those words mean something specific in this repo. A **flow** is a graph of the paths through one feature — nodes
are steps, edges join them. A **unit** is one thing inside a flow that has to be verified: a terminal node, a branch, an
**observable** (something the flow says must be true or visible, which is not itself a step in the graph), or an off-map
probe. A **sign-off track** is one reviewer role's column of sign-offs. There are three roles — codeweaver, flowrider
and siegemaster — and each signs the same units separately.

The five token counts are `input (uncached)`, `cache_read`, `cache_creation`, `output`, and the thinking share of that
output. `summary` never adds them together. Reading from the cache and writing to the cache are priced differently, so
one combined total cannot tell an expensive session apart from a well-cached one.

The package is a workspace, but it is deliberately missing from the root `package.json` dependencies. That buys two
things. Ward still runs its checks over it — ward is the repo's runner for lint, typecheck and the tests. And people who
install `dungeonmaster` never receive the package. To ship it, add that one line.

## The output matches three counts done by hand

Three separate analyses worked out these numbers by hand, using the `get-qa-checklist` tool, for quest
`1be07040-b9ec-476c-a439-0b4fbb0123cd`. `coverage` now produces the same numbers, exactly. Each cell reads owed /
signed. The owed figure is that track's **denominator** — the bottom half of "signed out of owed".

| Flow | codeweaver | flowrider | siegemaster |
|---|---|---|---|
| `paste-image-into-composer` | 58 owed / 58 signed | 58 / 58 | 74 / 74 |
| `send-message-with-images` | 61 / 60 | 59 / 59 | 71 / 67 |
| `render-images-in-transcript` | 69 / 68 | 68 / 68 | 75 / 0 |

`summary` reproduces the forensic report for one session, `d1b89f89-6f71-40c8-aaf3-094dedb15b8d`, to the digit: 219.9
min, 714,282 output, 69,432,974 context-in. Context-in is everything fed into the model on that session — uncached input
plus `cache_read` plus `cache_creation`, added up.

## Two numbers the output warns you about

Both of these numbers were misread before, so the output now labels each one.

**`API CALLS` prints a warning beside it: `(assistant records — one API response spans several
transcript lines)`.** The transcript writes a single API response as several lines: a text line, a thinking line, and
one more line per tool_use. Every one of those lines repeats the same usage figures. Count the lines and you overstate
the API calls several times over.

**`coverage` prints `NOT AUTHORITATIVE` at the end of every render.** Deciding whether a track owes a unit means
applying six exclusions, which live in the orchestrator's `signoffTrackEligibilityStatics`.
`isTrackOwedUnitGuard` applies four of them: flow type, unit kind, who added the observable, and how the unit gets
verified. It cannot apply the other two, flow slice and package slice. Both of those narrow by what a single operation
item declares, and reading a whole quest at once means there is no single operation item to read. So every `coverage`
number is an upper bound, and
`get-qa-checklist({ questId, operationItemId })` stays the authority.

## Two counting rules people got wrong, and by how much

**A node labelled `terminal` that still has an arrow leaving it is not a terminal unit.**
`isTerminalUnitGuard` enforces that, quoting `flowriderPromptStatics`. On the
`paste-image-into-composer` flow, 7 nodes are labelled terminal and 4 of them carry an outgoing edge, so the real count
is 3. Counting all 7 put every track's denominator 4 too high.

**Every runtime flow owes all seven off-map probe families, whatever `offMapSignoffs` contains.** An off-map family is
one of seven classes of breakage a flow graph structurally cannot draw: re-entry, concurrency, interruption, staleness,
configuration, hostile input and performance. The
`offMapSignoffs` array holds only the families someone has already signed, so counting the array under-reports what is
owed. On one flow it reported 0 owed where the true answer was 7.

## What this package borrowed from `@dungeonmaster/shared`

Check this table before you build anything new. Eight things were reused rather than rebuilt. The first cut of this port
wrote its own copy of shared's path layer, and the whole copy had to be deleted.

In the table below, a **contract** is a zod schema file. It is the only place raw data is allowed to become a validated,
typed value.

| Need                                                                                                                             | Use                                                                                                                               |
|----------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| `SessionId`, `AgentId`, `AbsoluteFilePath`, `FilePath`, `ContentText`, `QuestId`, `FlowNodeId`, `FlowNodeType`, `SignoffVerdict` | `@dungeonmaster/shared/contracts`                                                                                                 |
| The whole flow graph shape. `flowContract.array()` validates nodes, edges, observables and off-map sign-offs in one call         | `flowContract`                                                                                                                    |
| `DUNGEONMASTER_HOME`, falling back to `~/.dungeonmaster`                                                                         | `dungeonmasterHomeFindBroker`                                                                                                     |
| Safe JSON parsing                                                                                                                | `safeJsonParseTransformer`                                                                                                        |
| The seven off-map probe families                                                                                                 | `qaOffMapProbeStatics`                                                                                                            |
| Every directory-name literal                                                                                                     | `locationsStatics`. The `no-bare-location-literals` rule enforces it                                                              |
| fs / path / os I/O                                                                                                               | The adapters, plus their proxies from `@dungeonmaster/shared/testing`. A proxy is the sanctioned way to mock an adapter in a test |

The directory-name rule fires on the string literal itself, wherever you put it.

*Tried:*

```ts
  subagentsDir: 'subagents',
```

*Blocked:*

```
@dungeonmaster-local/no-bare-location-literals Do not use the raw location literal 'subagents'. It belongs to `locationsStatics.userHome.claude.subagentsDir` — compose the absolute path via the corresponding resolver under @dungeonmaster/shared/brokers/locations instead of hardcoding the literal.
```

Shared has three `locationsClaude*FindBroker` resolvers. We read all three and chose not to use them. Each one needs a
known `guildPath`, which it uses to build the project-directory slug.
`transcriptResolveBroker` exists precisely for the case where the caller has nothing but a bare id, so it can never
supply a `guildPath`. It composes the same primitives itself instead.

We added two lines to shared, each in the place that already owns what it adds:
`locationsStatics.repoRoot.dungeonmasterDevHome`, and the `fs-read-file-sync-adapter.proxy` export in
`testing.ts`.

## Twelve rules that blocked a write here, with the code that tripped each one

A pre-edit hook lints a proposed file before the write lands, so a violation blocks the write rather than surfacing
later in a test run. Every rule below stopped a real write in this package. The code under *Tried* is what triggered it.
The text under *Blocked* is the message it printed, verbatim.

1. **A `statics/` file cannot hold a regular-expression literal.** Only `contracts`, `guards` and
   `transformers` may hold one.

   *Tried*, in `transcript-location-statics.ts`, since deleted:

   ```ts
   cwdSeparatorPattern: /[^A-Za-z0-9]/gu,
   ```

   *Blocked:* `Line 22:24 - Regex literals are not allowed in statics/ folder. Only allowed in: contracts, guards, transformers.`

2. **A stub takes one parameter and its shape is fixed: `({ ...props }: StubArgument<T> = {})`.** A stub is the factory
   that builds valid test data for one contract.

   *Tried*, in `token-usage.stub.ts`:

   ```ts
   export const TokenUsageStub = (overrides: StubArgument<TokenUsage> = {}): TokenUsage =>
   ```

   *Blocked:*

   ```
   Line 4:32 - Stub functions must use spread operator in parameters: ({ ...props }: StubArgument<Type> = {})
   Line 4:32 - Function parameters must use object destructuring pattern: ({ param }: { param: Type })
   ```

3. **Do not check two properties of one object in two separate assertions.** That means `expect(x.a)`
   followed by `expect(x.b)`. Check the whole object once instead. Two separate checks leave every other property
   unchecked, which is how a wrong value bleeds through unnoticed.

   *Tried*, in `transcript-location-statics.test.ts`:

   ```ts
   expect(transcriptLocationStatics.subagentMetaExtension).toBe('.meta.json');
   expect(transcriptLocationStatics.transcriptExtension).toBe('.jsonl');
   ```

   *Blocked:* `Use single toStrictEqual on complete object instead of testing individual properties. Testing 2 properties of "transcriptLocationStatics" separately allows property bleedthrough`

4. **A `transformers/` file cannot import `zod`.** Narrow loose external data with plain TypeScript checks
   (`typeof x === 'object' && x !== null && 'key' in x`), then hand the assembled object to a contract's `.parse()`.
   There is no escape hatch: `as`, `any` and `Reflect.get` are all banned.

   *Tried*, in `record-to-token-usage-transformer.ts`:

   ```ts
   import { z } from 'zod';

   const rawUsageContract = z.object({
     input_tokens: z.number().int().nonnegative().optional(),
     output_tokens: z.number().int().nonnegative().optional(),
   ```

   *Blocked:* `Line 18:1 - transformers/ cannot import external package "zod". Only internal imports allowed.`
   The same schema then cascaded into five more, all of this shape:
   `Line 24:17 - z.number() must be chained with .brand() - use z.number().positive().brand<'PositiveNumber'>() instead of z.number().positive()`
   A brand is an invisible tag zod attaches to a type, so a plain `number` cannot be passed where a
   `PositiveNumber` is required. Every number and string contract in this repo has to carry one.

5. **Every parameter of a guard must be optional**, enforced by `enforce-optional-guard-params`. The guard returns
   `false` when any of them is missing.

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

   `is-track-owed-unit-guard.ts` hit the identical block on its `track` and `unit` parameters.

6. **A test file cannot import from `contracts/`.** Build its data through the matching `.stub.ts`
   instead.

   *Tried*, in `record-to-token-usage-transformer.test.ts`:

   ```ts
   import { transcriptRecordContract } from '../../contracts/transcript-record/transcript-record-contract';
   ```

   *Blocked:* `Line 2:1 - Test files must not import from contracts (including types). Use ../../contracts/transcript-record/transcript-record.stub instead.`

7. **`brokers/` and `responders/` both need a two-level `<domain>/<action>/` path.**

   *Tried:*

   ```
   src/brokers/transcript-resolve/transcript-resolve-broker.ts
   src/responders/digest-run/digest-run-responder.ts
   ```

   *Blocked.* Note where the error points: at line 1 of the import block, not at the offending name.

   ```
   Line 13:1 - Lvl2: Folder "brokers/" requires depth 2 but file is at depth 1. Expected pattern: src/brokers/brokers/[domain]/[action]/[domain]-[action]-broker.ts
   Line 12:1 - Lvl2: Folder "responders/" requires depth 2 but file is at depth 1. Expected pattern: src/responders/responders/[domain]/[action]/[domain]-[action]-responder.ts
   ```

8. **`ban-primitives` catches more than you expect.** It blocks three things that do not look like raw primitives at a
   glance: the cast `as readonly string[]`, the generic `Map<string, X>` (write
   `Map<X['idField'], X>` instead), and a return-type annotation on an inline `.map()` callback.

   All three produce the same message, so learn to recognise the *shape* rather than the wording:
   `Raw string type is not allowed. Use the discover endpoint to search for existing contracts (e.g., EmailAddress, UserName, FilePath, etc.). If none fits, create a new contract.`

   *Tried*, in `track-denominator-statics.test.ts`:

   ```ts
   (trackDenominatorStatics.byTrack[track].unitKinds as readonly string[]).includes('off-map'),
   ```

   *Tried*, in `coverage-to-text-transformer.ts` (`Line 44:26`):

   ```ts
   const byFlow = new Map<string, TrackCoverage[]>();
   ```

   `records-to-summary-transformer.ts` took eight of these in a single write, from three consecutive
   `new Map<string, number>()` declarations: `Line 37:26` for the string and `Line 37:34` for the number, then the same
   pair again on lines 38 and 39.

   *Tried*, in `record-to-flat-text-transformer.ts` (`Line 25:42`):

   ```ts
   const pieces = blocks.flatMap((block): string[] => {
   ```

   and in `tool-use-to-brief-transformer.ts` (`Line 31:17`):

   ```ts
   .map((key): string => {
   ```

9. **A named helper like `const fn = () => {}` is blocked anywhere in a file, module scope included.**
   `forbid-non-exported-functions` allows one named function per file: the file's primary export. Anonymous callbacks
   are fine.

   *Tried*, at module scope in `summary-to-text-transformer.ts`:

   ```ts
   const formatNumber = (value: number): string => value.toLocaleString('en-US');
   ```

   *Blocked:* `Line 20:22 - Non-exported functions are forbidden. All functions must be the primary export of their file. This appears to be a data transformation. Extract it to a new file in transformers/ folder with a DOMAIN-SPECIFIC name (e.g., transformers/format-user-name/format-user-name-transformer.ts). DO NOT use generic names like "helper", "util", "formatter". First, search the codebase to see if this functionality already exists before creating a new file.`

   The first cut of `quest-find-broker.ts` hit the same rule, on a module-scope
   `const findQuestUnderRoot = ({ rootPath, questId }) => …`.

10. **`enforce-stub-usage` blocks any `const` whose value is not built out of `*Stub()` spreads.**
    Test data that has to bypass a contract's validation must be written inline at the call site instead.

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

    *Blocked* four times in that one write, at `497:20`, `506:20`, `535:20` and `545:20`:
    `Line 497:20 - Use stub function instead of inline object/array literal. Create or use existing stub for type "Object".`

    A plain shared constant in the same file drew the identical message at `Line 13:25`:
    `const UNSIGNED_TRACKS = { codeweaverSignoff: false, flowriderSignoff: false, siegemasterSignoff: false };`

11. **In zod v3, a key that is present and set to `undefined` is not the same as a missing key.**
    `Stub({ field: undefined })` gives you an object that owns `field`, holding `undefined`, and
    `toStrictEqual` treats that as different from an object with no `field` at all. To test an optional that is
    genuinely absent, parse a literal that omits it, and compare against a stub that omits it too. Three agents hit this
    independently.

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

    *Blocked* by jest rather than by lint. `npm run ward -- detail <runId> <filePath>` printed this:

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

    The whole failure is that one `-   "text": undefined,` line. The stub carried the property; the parsed result did
    not. The fix was to assert against a literal with `text` left out entirely.

12. **Two lint rules contradict each other over a nullable `let`.**
    `@typescript-eslint/init-declarations` demands `= undefined`. `no-undef-init` then strips it back off, so ward's
    `--fix` pass oscillates between the two. Track the underlying value instead, and derive the nullable one at the end.

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

    We appended `= undefined` to both lines and re-ran ward. It printed those same two errors, verbatim. That happened
    twice more. After each run, a `Read` at offset 40 showed line 44 back to
    `let earliestTimestamp: TranscriptRecord['timestamp'];` — ward's `--fix` lint pass had already stripped the
    initializer off again. `no-undef-init` never prints a message of its own; it only autofixes. So from the outside the
    loop looks like one error that refuses to be fixed.

## Four bits of code we wrote, then later replaced

All four of these passed lint and shipped. A later pass went back and tested the assumption behind each one. Three
turned out to be unnecessary. One was a real gap in the code.

Notice the ratio. Three of the four were reasonable decisions at the moment they were made. Most of what reads as
sloppiness in agent-written code is exactly that: a sensible local decision, made by an agent that did not have context
a later file went on to create.

| Was                                                             | Now                            | Why it existed                                                                                                                                                                                                                      |
|-----------------------------------------------------------------|--------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ReturnType<typeof Math.floor>` in `records-to-buckets`         | `ReturnType<typeof Number>`    | An invented variation on a real idiom. The spelling that already had precedent works in the same position                                                                                                                           |
| `String(block.type) === 'tool_use'`                             | `block.type === 'tool_use'`    | Written to "sidestep branded-type comparability ambiguity", which nobody ever tested for. `block.type` has type `string & {brand}`, so the direct comparison typechecks                                                             |
| An inline `{ name?: string; input?: … }` in `tool-use-to-brief` | `TranscriptRecordContentBlock` | When that file was written, the block schema was still a private const inside `transcript-record-contract.ts`, so there was no type to import. A later agent extracted it for an unrelated reason, and that made this fix possible  |
| Four contracts each carrying their own timestamp                | `isoTimestampContract`         | A genuine gap. `transcript-record` and `turn-gap` branded their own (`TranscriptRecordTimestamp`, `TurnGapStartedAt`), while `transcript-summary` and `time-bucket` carried a bare `z.string().datetime()` with **no brand at all** |

Consolidating those four timestamps onto one contract needed **zero re-brands downstream**. The reason is worth knowing
before you attempt a similar change. A branded type is `string` with an invisible tag attached, so a branded string is
accepted anywhere a plain `string` is accepted. And `.parse()` takes
`unknown`, so it accepts any value at all. Every consumer of these timestamps did one of those two things: it handed the
value to a contract, or it read it as a plain string. Neither cares which brand the value wears, so neither needed
changing.

After all four changes, `coverage` still produces the table of numbers above, unchanged.
