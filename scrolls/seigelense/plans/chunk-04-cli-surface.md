# Chunk 4 — the whole surface on the CLI, and the end of the MCP layer

Seven calls move from MCP tool registrations to `dungeonmaster siegelense <call>` subcommands; the MCP
layer and its whole registration cascade are deleted. **No business logic moves.** Every broker under
`packages/siegelense/src/brokers/**` is surface-agnostic already and is not touched by a single work item
below.

**All paths in this file are relative to the worktree root
`/home/brutus-home/projects/codex-of-consentient-craft/worktrees/siegelense`.** Never the main checkout.

Coverage is tracked in `scrolls/seigelense/build-ledger.md`. **This plan does not edit that file** — §10 lists
the rows it expects to move and the ledger's owner moves them.

Chunk 1 is `plans/chunk-01-registry-spine.md`; chunk 2 is `plans/chunk-02-driver-and-batch.md`; chunk 3 is
`plans/chunk-03-read-path-and-perception.md`. Every signature, field and line number quoted below was read off
disk in this worktree after chunk 3 landed. Where an earlier plan and the delivered code disagree, the code
wins and this file carries the code's shape.

**Spec line numbers here are against the CURRENT `siegelense-tooling.md`, 3,049 lines.** Re-derive from
heading text if they drift again.

---

## 1. Why this slice, and what it is

**The interface is the CLI, and the MCP tools are the mistake.** The spec's own opening section says so:

> line 29: `**It is a CLI, and not MCP, because an LLM should not need to install anything to use it.**` An MCP
> server has to be installed, configured per client, and reconnected whenever it changes. A CLI subcommand is
> reachable by any agent that already has a shell.

Seven calls are reachable today only through an MCP client — `start`, `run`, `kill`, `results`, `compare`,
and (alongside real subcommands) `status` and `cleanup`. This chunk moves all seven onto argv, gives the whole
surface `--help`, and deletes the MCP layer.

**The rework is small and the measurement says so.** The MCP surface is two thin responder files that parse
input, call one broker, and stringify the answer. The brokers they call are the same brokers the CLI's
existing `status` and `cleanup` responders already call directly. So the job is five new responders following
two that exist, a route table, argv parsing, help text, and a deletion.

**The failure this chunk exists to stop happening again.** `dungeonmaster siegelense status` and `cleanup`
shipped fully tested and untypeable, because `packages/cli/src/responders/cli/siegelense/cli-siegelense-responder.ts`
hard-coded an allow-list of subcommands that did not include them, and every test started BELOW that gate.
§4 closes that gate structurally and names the test that spans the seam.

**And there is a second gate nobody has noticed yet.** A dispatched agent has no interactive approver: a Bash
command outside `permissions.allow` comes back `This command requires approval` and is DENIED outright, never
prompted (`agent-qa-permissions-statics.ts:9-11`). The seven MCP tools each had an
`mcp__dungeonmaster__siegelense-*` grant. **There is no `Bash(dungeonmaster …)` grant of any kind**, so the
moment the surface becomes a CLI, every one of these calls is denied to the exact reader it was built for.
W15 closes it. A chunk that moved the calls and left that grant unwritten would have rebuilt the
untypeable-subcommand bug one layer over.

### Delivered by this chunk

| Spec section | Line | What lands |
|---|---|---|
| Decision: an INSTANCE service, reached over the CLI | 17 | The whole section's SURFACE claim: seven of the thirteen calls reachable as `dungeonmaster siegelense <call>`, none reachable any other way |
| The shape | 62 | `start`/`run`/`results`/`kill` typed at a terminal, in exactly the relationship this section words |
| The tool is `siegelense`, and its recipes live beside it (Part 6) | 1921 | The `dungeonmaster siegelense <name>` subcommand half, for every built call |
| The thirteen calls | 2217 | The seven built ones, each as `dungeonmaster siegelense <name>`, plus a distinct refusal for the six that are named but not built |
| `start` | 2240 | `--spec`, `--quest`, `--guild`; the manifest on stdout |
| `run` | 2287 | `--steps` / `--steps-file`, `--stop-on`; a STATUS on stdout, never payloads |
| `results` | 2289 | Every narrowing lever as a flag; the required-run-id refusal in help text AND in the error |
| `kill` | 2492 | `--instance`; accepts an already-dead id |
| `status` | 2443 | `[--instance]`; the no-browsing refusal in help text |
| `cleanup` | 2406 | No arguments; the ages-nothing sentence in help text |
| `compare` | 2420 | `--instance --run-a --run-b`; the no-cross-instance-form refusal by name |
| `docs` (the ARGUMENT for it, not the call) | 2366 | Not built. `--help` is the interim answer and §3.F says why that is not `docs` |
| Part 7 item 2 / 2a | 2028, 2029 | The surface half — every built call reachable without installing anything |

### Deliberately deferred

| Deferred | To | Why it is safe to wait |
|---|---|---|
| `capacity`, `profile`, `prune`, `snapshots`, `recipes`, `docs` | chunks 8, 9, 7, 7, 7, 11 — §11 has the map | Six names pinned in `siegelenseCallStatics` with nothing behind them. **This chunk makes them refuse by name** ("`capacity` is not built yet") rather than answering `Unknown siegelense subcommand`, which is the honest answer for a call the spec defines and the tool has not built |
| `look`, refs, the key, `elements`, the `dom` ladder | chunk 5 | Unchanged from chunk 3's reasoning. No step verb is added here — steps are DATA inside `run` (line 2234), so the CALL surface is what this chunk moves and the STEP surface does not grow |
| The settle detector, `until`, `hold`, `video`, `before` | chunk 6 | Unchanged from chunk 3's reasoning |
| `cleanup`'s `assetsAged`, retention, ageing, the citation resolver | chunk 9 | Unchanged. The field stays ABSENT from `cleanupAnswerContract`, so the CLI prints an answer with no `assetsAged` key rather than a zero |
| **The boot-poll side channel — "a 55-second start is indistinguishable from a hang"** (spec line 1542) | chunk 8 | `build-ledger.md:234` names this "carry it into chunk 4". **This chunk declines it, deliberately.** The fix is a failure marker the driver writes before dying plus a side channel `instance-start-boot-poll-layer-broker.ts` reads, which widens `registryEntryContract` — the same contract chunk 8's profile sampler widens. Doing it here means widening that contract twice, and it is not a surface concern: the CLI prints whatever `instanceStartBroker` returns, hang or not. **It must not be lost**; §10 keeps its ledger row open and §11 assigns it |
| A second exit code for "usage error" vs "runtime failure" | not scheduled | §3.D decides one code and says what changing it would cost |
| A progress indicator during `start`'s boot wait | not scheduled | §3.A's stdout invariant forbids it on stdout, and a spinner on stderr is a later call's business. The manifest's own `queuedMs` and `bootMs` are the after-the-fact account |

---

## 2. What exists, verified by reading it

| | Where | State |
|---|---|---|
| The CLI gate | `packages/cli/src/responders/cli/siegelense/cli-siegelense-responder.ts:45-52` | Hard-coded allow-list of `driver`, `status`, `cleanup`. Refuses anything else BEFORE the dynamic import |
| The route table | `packages/siegelense/src/flows/siegelense/siegelense-flow.ts:47-78` | Four branches: `driver`, `status`, `cleanup`, bare. Parses `--instance` inline, twice |
| The CLI entry | `packages/cli/bin/cli-entry.ts:39-45` | Any thrown error → `process.stderr.write('Error: ' + message)` and `process.exit(1)` |
| The existing responders | `packages/siegelense/src/responders/siegelense/{status,cleanup,fleet,driver}/` | Take TYPED params, call one broker, `process.stdout.write` a rendered string, return `adapterResultContract.parse({ success: true })` |
| The MCP responders | `packages/mcp/src/responders/siegelense/handle/siegelense-{handle,read-layer}-responder.ts` | Parse a `.strict()` contract, call one broker, `JSON.stringify(answer, null, 2)`. No business logic |
| The MCP registrations | `packages/mcp/src/flows/siegelense/siegelense-flow.ts:43-99` | Seven `ToolRegistration`s. **Each `description` carries that call's refusal sentence** — §3.C lifts all four verbatim |
| The name statics | `packages/siegelense/src/statics/siegelense-tools/siegelense-tools-statics.ts` | `{ tools: { prefix: 'siegelense-', names: [13] }, docs: { scopes: [7] } }`. `prefix` is an MCP artifact |
| The permission generator | `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.ts:96-103` | **Prunes** stale `mcp__dungeonmaster__*` grants, so removing the seven names from `mcpToolsStatics` and re-running `init` removes the seven rows with no hand-edit |
| The Bash grants | `packages/shared/src/statics/agent-qa-permissions/agent-qa-permissions-statics.ts:48` | `curl`, `kill`, `lsof`, `ps`, `python3`. **No `dungeonmaster` grant** |
| The spawn harness | `packages/cli/test/harnesses/cli-bin/cli-bin.harness.ts:63-72` | `runInit()` spawns `bin/cli-entry.ts` under `tsx --conditions=source`. **Hard-codes the single argument `'init'`** and swallows stdout — W16 generalises it |

---

## 3. The seven decisions this chunk makes

### A. Output: ONE JSON document on stdout, always. `--human` is the opt-out.

**Every one of the seven calls writes exactly one JSON document to stdout and nothing else** — no banner, no
progress line, no trailing prose. `JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)`
plus one `\n`. That is byte-for-byte what the MCP responders already returned, so no agent-facing consumer
changes shape.

Three reasons, in order of weight:

1. **The reader that cannot recover is the one the default must serve.** An LLM handed a human table has to
   parse prose and will get it wrong silently. A person handed JSON can still read it. A default that fails
   toward the recoverable reader is the correct default.
2. **A flag nobody types is a flag nobody gets.** `--json` as an opt-IN means every call an agent makes
   without it returns prose — and the agent has no way to know it asked the wrong way, because the answer
   looks like an answer. That is the `count: 0` ambiguity wearing a different hat.
3. **The spec's examples are all objects.** Every `→ { … }` block in Part 8 is the shape of a return, not a
   table. Printing the object IS printing the documented answer.

**`--human` renders the table instead, and only `status` and `cleanup` implement it**, because they are the
only two with a renderer (`statusAnswerRenderTransformer`, `cleanupAnswerRenderTransformer`) and the only two
an operator scans at a terminal. **`--human` on any other call is a REFUSAL naming the two that have it**,
never a silent fall-through to JSON — a flag that quietly does nothing is how a caller learns the wrong thing.

**`--json` is accepted on all seven as an explicit affirmation of the default.** It costs one line and it
means a caller that types it is never refused for being explicit.

**This flips the default for `status` and `cleanup`, and their existing exact-text assertions change.** W12
owns that edit and names every test that moves. The bare `dungeonmaster siegelense` fleet listing keeps its
human table unchanged: it is not one of the thirteen calls, it is the person-at-a-terminal entry point, and
`status` is its machine counterpart.

**Errors never touch stdout.** A refusal throws; `bin/cli-entry.ts` writes `Error: <message>` to stderr and
exits 1. So stdout carries a complete JSON document or nothing at all — a caller piping stdout into a parser
never gets half a document.

### B. Structured payloads over argv: `run`'s `steps` array

Two flags, mutually exclusive, exactly one required:

```
--steps <json>        a JSON array of step objects, as one argv value
--steps-file <path>   a file holding that same JSON array
```

`--steps-file` exists because **an agent writes a file more reliably than it quotes a 2KB JSON blob into a
shell command**, and `Write` is a tool it already has. `--steps` exists because a three-step batch inline is
one call instead of two. Naming both, or neither, is a refusal naming both flags — never a silent preference.

**Malformed JSON refuses with the parser's own message and the byte position**, not "invalid steps". A step
that fails `stepContract` refuses with the Zod message, which already names the array index and the field.

**`stepContract` gains three `.default(null)`s, and this is a real defect the move exposes.** `node` is
`.nullable()` but not optional on all six verbs, and `within`/`timeoutMs` are the same on the targeting
verbs — so `{ step: 'goto', path: '/' }` is REJECTED today and a caller must write `node: null` on every
step. The MCP contract's own USAGE example shows the tax:
`{ step: 'goto', path: '/', node: null, expect: 'ok' }`. Over argv, where a human types the batch, that is
unusable. W6 changes `.nullable()` to `.nullable().default(null)` on those three fields. It relaxes, so it
breaks no existing caller: an explicit `null` still parses to `null`, and `.strict()` still rejects an
unknown key.

**No other call takes a structured payload.** `results`' `where` clause becomes five discrete flags
(§3.C) rather than nested JSON, because five named flags are self-documenting in `--help` and a nested JSON
object is not.

### C. Flag vocabulary: the SPEC's field names, kebab-cased

The spec writes `results { instance, run, step, kind, where, fields, since }`. The flags are those words:
`--instance`, `--run`, `--step`, `--kind`, `--fields`, `--since`, and `--where-<member>` for each member of
`resultWhereContract`. Not the MCP contracts' camelCase (`instanceId`, `runId`) — those were an artifact of a
JSON schema, and a caller reading the spec should be able to type what it reads.

`--instance` is already the established flag on `status` and `driver`; every call keeps it.

| Call | argv |
|---|---|
| `start` | `--spec <specName>` required · `--quest <questId>` · `--guild <guildId>` · `--json` |
| `run` | `--instance <id>` required · `--steps <json>` XOR `--steps-file <path>` required · `--stop-on error\|never` · `--json` |
| `results` | `--instance <id>` required · `--run <runId>` · `--step <n>` · `--kind <kind>` · `--where-path <p>` · `--where-method <M>` · `--where-nth <n>` · `--where-level <l>` · `--where-steps <a-b>` · `--fields <a,b,c>` · `--since boot` · `--json` |
| `kill` | `--instance <id>` required · `--json` |
| `status` | `--instance <id>` · `--json` · `--human` |
| `cleanup` | `--json` · `--human` |
| `compare` | `--instance <id>` required · `--run-a <runId>` required · `--run-b <runId>` required · `--json` |

`--fields` takes one comma-separated value (`--fields status,responseBody`), not a repeated flag. One token,
and no member of `resultFieldContract` contains a comma. `--where-steps` takes the `stepRangeContract` form
(`4-9`).

**Every unknown flag refuses by name**, and the refusal prints the accepted flags — the shape
`createPackageArgsParseTransformer` already uses at `create-package-args-parse-transformer.ts:116-119`. A
positional argument after the call name is a refusal too: "Every value must directly follow the flag it
belongs to."

### D. Exit codes, and the one this chunk does not add

| Code | When |
|---|---|
| `0` | The call answered. **Including `instanceState: 'pruned'`, `instanceState: 'unknown'`, an empty fleet, an empty rows array, and `--help`.** These are answers, not failures — spec line 2319: "`pruned` and `unknown` are real answers, not empty results" |
| `1` | Every refusal and every failure. Message on stderr, stdout untouched |

**There is no second code, and that is a decision rather than an oversight.** `packages/cli/bin/cli-entry.ts`
maps any thrown error to `Error: <message>` on stderr and `process.exit(1)`, for every `dungeonmaster`
command. Splitting usage errors from runtime failures means changing that shared entry, which changes the
exit-code contract of `init`, `create-package`, `statusline-tap` and `serve` at the same time. The refusal
MESSAGE distinguishes them, and the message is what a caller reads. A later chunk that wants `2` changes
`cli-entry.ts` and owns the other four commands' tests with it.

### E. The refusals, and where each sentence lands

Four refusals live today only in MCP tool descriptions, which are about to be deleted. **Each one lands in two
places: the call's `--help` REFUSES block, and the error message the call throws when it is violated.** Help
teaches it before the mistake; the error teaches it after. Both texts come from one source —
`siegelenseHelpStatics.calls.<call>.refusals` — so they cannot drift.

| Call | Sentence, verbatim from the registration being deleted | Where it goes |
|---|---|---|
| `results` | "Against a finished instance you must name a runId (or since: 'boot'); omit both and the call refuses rather than guessing which run you meant." | help REFUSES; and `RunIdRequiredError`'s message, which already names the state and the run count and never a run id |
| `status` | "Never lists another instance's runs or evidence unless you name it." | help REFUSES only — it is a property of the answer, not a throw. `statusReadBroker` already withholds `evidence` and `lastStep` for every unnamed row |
| `compare` | "There is no cross-instance form: name one instanceId and two runs (runA, runB) inside its own timeline — two different instances share nothing but a spec." | help REFUSES; and the parse refusal when `--instance-a` / `--instance-b` is typed, which must name those two flags rather than saying "unknown flag" |
| `cleanup` | "Takes no input. Reaps and releases only — it ages no asset, so a clean baseline capture is never touched by this call." | help REFUSES; and the refusal for any flag other than `--json` / `--human` / `--help` |

Two more the registrations carry that must survive as help text, though neither is a throw:

- `run`: "Returns a STATUS — an index and a shot list — never the steps' own payloads; query those afterward
  with `dungeonmaster siegelense results`." Rewritten to name the subcommand, not the tool.
- `kill`: "Accepts an already-dead instance id too, reaping its orphaned process groups from its heartbeat
  file when the driver itself is unreachable." This one prevents a caller concluding `kill` is only for live
  instances, which is how an orphan survives.

**The wording adapts to the surface and nothing else.** `runId` becomes `--run`, `since: 'boot'` becomes
`--since boot`, `siegelense-results` becomes `dungeonmaster siegelense results`. The RULE each sentence states
is unchanged, word for word where the words still apply.

### F. `--help`: one shape, every call, and why it is not `docs`

```
dungeonmaster siegelense --help            → the index: one line per call
dungeonmaster siegelense <call> --help     → that call in full
dungeonmaster siegelense <call> -h         → the same
```

Both write to **stdout** and exit **0**. Asked-for output is not an error, and a caller that pipes stdout gets
the help it asked for.

Five sections, in this order, for every call, with no per-call variation:

```
siegelense results — query one instance's evidence off disk. Starts nothing.

USAGE
  dungeonmaster siegelense results --instance <id> [--run <runId> | --since boot]
                                   [--step <n>] [--kind <kind>] [--where-path <p>] …

FLAGS
  --instance <id>      required   the instance to read evidence from
  --run <runId>                   the run to read. Required against a finished instance
  …

REFUSES
  Against a finished instance you must name --run (or --since boot); omit both and this call
  refuses rather than guessing which run you meant.

OUTPUT
  One JSON document on stdout: the ResultsAnswer. Every answer carries instanceState.

EXAMPLE
  dungeonmaster siegelense results --instance inst_9b2c --run run_2 --step 7
```

The index adds a `NOT BUILT YET` block naming the six, so a caller learns the surface is thirteen and that six
of them are coming, rather than learning that six names it read in the spec are typos.

**`--help` is not `docs`, and the difference is the reason `docs` stays deferred.** `--help` is a flag
reference: flags, refusals, one example. `docs { for: 'walking' }` is a role's page — the naming ladder, the
reading rules, when to use which rung — and it is served to seven audiences with different needs. A manual
describing six calls that nothing can make is still the failure `docs` was invented to prevent (chunk 3 §1,
unchanged). `--help` carries no such claim: it describes exactly what is typeable, and the `NOT BUILT YET`
block says what is not.

### G. `siegelenseToolsStatics` becomes `siegelenseCallStatics`

It currently calls itself "the closed set of MCP tool names this package registers" and carries
`prefix: 'siegelense-'`. Both are wrong on a CLI: there is no registration and there is no prefix — the name
after `dungeonmaster siegelense` IS the call.

```
packages/siegelense/src/statics/siegelense-call/siegelense-call-statics.ts

export const siegelenseCallStatics = {
  calls: { names: [ 'start', 'run', 'results', 'kill', 'capacity', 'profile', 'status',
                    'cleanup', 'prune', 'compare', 'snapshots', 'recipes', 'docs' ] },
  docs:  { scopes: [ 'operating', 'planning', 'walking', 'attacking', 'fixing', 'driving', 'operational' ] },
} as const;
```

`prefix` is DELETED. `names` is unchanged in content and order — it is still the closed thirteen, still
without `look`, and still the thing that stops anyone inventing a fourteenth or dropping one. `docs.scopes`
is unchanged.

**The old file survives until the last work item.** `packages/mcp` imports `siegelenseToolsStatics` in four
files; renaming it before those files are deleted breaks `mcp`'s typecheck for the whole chunk. So W1 ADDS
the new statics, and W18 deletes the old one with everything else that reads it.

---

## 4. The gate, and the guarantee that it cannot close again

### What the gate is today

`CliSiegelenseResponder` hard-codes `driver`, `status`, `cleanup` and refuses anything else. `SiegelenseFlow`
then re-derives the same list one dynamic import later. Its own header calls the CLI-side copy "a fast,
friendly failure for a human at a terminal, not the source of truth" — but a copy that refuses is a source of
truth whether or not it says it is, and it is what made two shipped, fully tested subcommands untypeable.

### What replaces it

**The CLI responder validates nothing.** It forwards `args` verbatim to `StartSiegelense`. The subcommand
allow-list and the `--instance` pre-check both go. The cost is that an unknown subcommand now pays a dynamic
import before refusing — microseconds, against a class of bug that has already cost this build two shipped
commands.

**One place knows the routes: `siegelenseHelpStatics.calls`.** Its keys are exactly the built calls.
`SiegelenseFlow`'s route table is a `Map` whose keys must equal that key set, and a colocated test asserts the
two with `toStrictEqual`. So:

- A call routed with no help entry → the key-set test fails.
- A help entry with no route → the same test fails.
- A name in `siegelenseHelpStatics.calls` that is not in `siegelenseCallStatics.calls.names` → the help
  statics' own test fails, which is what stops a fourteenth call being invented.

### The refusal split

`SiegelenseFlow` now distinguishes three cases, and the distinction is the point:

| args[0] | Answer | Exit |
|---|---|---|
| a routed call | the call runs | 0 / 1 |
| a name in `siegelenseCallStatics.calls.names` with no route | `capacity is a siegelense call but is not built yet. Built calls: start, run, results, kill, status, cleanup, compare.` | 1 |
| anything else | `Unknown siegelense subcommand: statuss` + the usage line | 1 |
| absent | the bare fleet listing | 0 |

A caller typing `capacity` read it in the spec. Telling it "unknown subcommand" teaches it that the spec is
wrong. Telling it "not built yet" teaches it the truth.

### The test that spans the seam

**`packages/cli/bin/cli-entry.integration.test.ts`, driving the real spawned entry** — the only test in the
repo that starts ABOVE the CLI gate. `cliBinHarness` already spawns `bin/cli-entry.ts` under
`tsx --conditions=source`; W16 generalises `runInit()` into `runCommand({ args })` returning
`{ exitCode, stdout, stderr }`, then:

```
it.each(Object.keys(siegelenseHelpStatics.calls))(
  'VALID: {dungeonmaster siegelense %s --help} => exits 0 and prints that call's summary line',
  …
)
```

asserting `exitCode` is `0` and `stdout.split('\n')[0]` is `toBe` that call's `summary` from the statics.

**That assertion is not a tautology, and this is the sentence that says why.** The failure it catches is a
call that is built, helped and routed in `SiegelenseFlow` but refused by `CliSiegelenseResponder` before it
ever gets there — the exact shape of the bug that shipped. Against a closed gate the process exits 1 with
`Unknown siegelense subcommand` on stderr and nothing on stdout, and the test fails on both halves.

A sibling `it.each` over the six unbuilt names asserts `exitCode` is `1` and stderr names the call as not
built — so the second refusal branch is proven from the same altitude.

**And a cheaper one below it**: `packages/cli/src/flows/cli/cli-flow.integration.test.ts` already routes
`command: 'siegelense'` through the real dynamic import. W16 adds a derived `it.each` there too, so a red
shows up in a fast unit-speed suite as well as in the spawned one.

---

## 5. The deletion

Everything below goes in W18, as one item, because **splitting nine copies of one allow-list across two agents
is a merge conflict by construction** (chunk 3 §W17's own finding). `packages/mcp/CLAUDE.md`'s "one edit of
roughly 29" list is the checklist, run in reverse.

**Deleted outright**

| Path | What it is |
|---|---|
| `packages/mcp/src/flows/siegelense/` | `siegelense-flow.ts` + `siegelense-flow.integration.test.ts` — the seven registrations |
| `packages/mcp/src/responders/siegelense/` | `siegelense-handle-responder.{ts,proxy.ts,test.ts}` and `siegelense-read-layer-responder.{ts,proxy.ts,test.ts}` |
| `packages/mcp/src/contracts/siegelense-start-input/` | contract + test + stub |
| `packages/mcp/src/contracts/siegelense-run-input/` | contract + test + stub |
| `packages/mcp/src/contracts/siegelense-results-input/` | contract + test + stub |
| `packages/mcp/src/contracts/siegelense-kill-input/` | contract + test + stub |
| `packages/mcp/src/contracts/siegelense-status-input/` | contract + test + stub |
| `packages/mcp/src/contracts/siegelense-compare-input/` | contract + test + stub |
| `packages/mcp/src/contracts/siegelense-cleanup-input/` | contract + test + stub |
| `packages/siegelense/src/statics/siegelense-tools/` | `siegelense-tools-statics.ts` + `.test.ts` — replaced by `siegelense-call-statics` |

**Edited**

| Path | Edit |
|---|---|
| `packages/mcp/src/startup/start-mcp-server.ts:16,24` | drop the `SiegelenseFlow` import and its spread |
| `packages/shared/src/statics/mcp-tools/mcp-tools-statics.ts:44-50` | remove the seven `siegelense-*` names |
| `packages/shared/src/statics/mcp-tools/mcp-tools-statics.test.ts` | the full-value `toStrictEqual` |
| `packages/orchestrator/src/statics/smoketest-probe-args/smoketest-probe-args-statics.ts` | remove the seven probe entries. Its test asserts `Object.keys(probeArgs).sort()` equals the sorted tool names, so a leftover entry is a hard fail |
| `packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts` | the seven `describe('tools/call with siegelense-<name>')` blocks; the `siegelense`-filtered registration count test at ~106-123; the `@dungeonmaster/siegelense/{contracts,statics}` imports at 29-30; `TOOLS_EXEMPT_FROM_SIZE_CAP` at ~2087-2092 |
| `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts` | seven copies of the expected allow-list |
| `packages/mcp/src/flows/install/install-flow.integration.test.ts:93-99` | the eighth copy |
| `packages/mcp/src/transformers/mcp-permissions-creator/mcp-permissions-creator-transformer.test.ts:35-41` | the ninth. **Its test NAME carries the tool count** — update the name too |
| `packages/mcp/package.json` | drop `"@dungeonmaster/siegelense": "*"` from `dependencies`. Nothing else in `mcp` imports it after the deletions above |
| `packages/siegelense/statics.ts:14` | the barrel line for the deleted statics |

**Generated, never hand-edited**

`.claude/settings.json`'s seven `mcp__dungeonmaster__siegelense-*` rows in `permissions.allow[]` are written
by **`settingsPermissionsAddBroker`** (`packages/mcp/src/brokers/settings/permissions-add/`), from
`mcpPermissionsCreatorTransformer`, over `mcpToolsStatics.tools.names`. **That broker PRUNES stale grants** —
`settings-permissions-add-broker.ts:96-103` filters any `mcp__dungeonmaster__` entry not in the current
managed set — so removing the seven names and re-running the generator removes the seven rows with no
hand-edit and no permission prompt:

```
npm run build && npm link --workspaces && npm run init
```

**`.mcp.json` is NOT touched.** It carries the server entry, not per-tool entries, and the MCP server still
serves twenty-six other tools. Nothing in it names a siegelense tool.

**The same run adds W15's `Bash(dungeonmaster siegelense:*)` grant**, since `agentQaPermissionsStatics` feeds
the same managed set. `Bash(…)` entries are never pruned by that broker, only added — which is safe here,
because this chunk adds one and removes none.

**After the run, reconnect the MCP.** The stdio child is still serving the old `dist`, so the seven tools stay
visible in an already-open session until it reconnects. A session that calls one after the deletion is
calling code that no longer exists on disk.

---

## 6. Work items

**Maximum five agents at once.** Waves A, E and H run alone because everything downstream reads what they
write, or because one item owns files nothing else may touch.

| Wave | Items | Parallel? |
|---|---|---|
| A | W1 | alone — SEQUENCE |
| B | W2 · W3 | PARALLEL |
| C | W4 · W5 · W6 · W7 · W8 | PARALLEL (five) |
| D | W9 · W10 · W11 · W12 | PARALLEL (four) |
| E | W13 | alone — SEQUENCE |
| F | W14 · W15 | PARALLEL |
| G | W16 · W17 | PARALLEL |
| H | W18 | alone — SEQUENCE |

### Rules every work item respects

- **`discover` / `get-project-map` / `get-project-inventory` CAN see this worktree now** — the resolver reads
  the caller's own cwd and prints the root it resolved (`HANDOFF.md`, "The search tools CAN see this worktree
  now"). A call that answers `(empty)` for a package you can see on disk means the fix is not live in that
  checkout; it is never evidence of absence. `Read` for contents, `ls -R` for structure, a `python3 -c`
  `os.walk` for a content search, all still work and are still sanctioned.
- **No agent builds.** `<dungeonmaster-buildDiscipline>`. Report that a build is needed; the coordinator runs it.
- **No agent dispatches a sub-agent.** `HANDOFF.md` records one work item corrupted that way.
- **No agent runs `npm install`.** W18's `package.json` edit is reported to the coordinator.
- **Scoped ward only**, on exactly the files it touched:
  `npm run ward -- --only lint,typecheck,unit -- <files>`. Up to five agents work in parallel and a wider
  scope grades their half-written files.
- **Tests assert BEHAVIOUR** — the value returned, the exact text printed, the exit code. A test asserting
  that a function "was called", that a responder "ran", or that output "contains" a word is a FALSE POSITIVE
  and is worse than no test. Every item below names what each test must assert.
- **Unit and integration tests only. No e2e.**
- `export const` arrow, branded Zod contract on every return, purpose JSDoc above the imports, no `jest.mock`
  / `jest.spyOn` (`registerMock` through a `.proxy.ts`), no `beforeEach`/`afterEach` in a unit test,
  `toStrictEqual` / `toBe` only, tests import `.stub.ts` and never `-contract.ts`.
- **Rewrite the PURPOSE header after the file is real**, and make its second sentence say when to reach for
  THIS file over its nearest sibling — which for seven near-identical arg parsers is the sentence that earns
  its place.

### Three coordinator-owned actions

1. **After W18**: `npm run build && npm link --workspaces && npm run init`, then reconnect the MCP. This is
   what removes the seven `permissions.allow[]` rows, adds the Bash grant, and puts the new `dungeonmaster`
   binary on PATH for the manual drive.
2. **After W18, before that build**: `npm install`, for the `packages/mcp/package.json` dependency removal.
3. **Before the manual drive**: confirm `dungeonmaster siegelense --help` runs from a directory that is NOT
   this repo, since "reachable by any agent that already has a shell" is the claim being verified.

---

### W1 — `siegelenseCallStatics` and `siegelenseOutputStatics` (wave A, alone)

**Creates**

- `packages/siegelense/src/statics/siegelense-call/siegelense-call-statics.ts` + `.test.ts` — shape exactly as
  §3.G. No `prefix`.
- `packages/siegelense/src/statics/siegelense-output/siegelense-output-statics.ts` + `.test.ts` —
  `{ json: { indentSpaces: 2 }, flags: { json: '--json', human: '--human', help: '--help', helpShort: '-h' } }`.

**Edits** `packages/siegelense/statics.ts` — add both barrel lines. **Leave line 14
(`siegelense-tools-statics`) in place**; four files in `packages/mcp` still import it and W18 removes it with
them.

**Depends on** nothing.

**Tests**

- `siegelense-call-statics.test.ts` — `VALID: {complete object} => toStrictEqual` on the whole statics, the
  thirteen names literal and in order. `VALID: {calls.names} => does not contain "look"`, asserted as the
  complete array with `toStrictEqual` rather than a negative membership check, because `look` is a STEP and
  the absence is load-bearing (spec line 2234).
- `siegelense-output-statics.test.ts` — `VALID: {complete object} => toStrictEqual`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- packages/siegelense/src/statics/siegelense-call/siegelense-call-statics.ts packages/siegelense/src/statics/siegelense-call/siegelense-call-statics.test.ts packages/siegelense/src/statics/siegelense-output/siegelense-output-statics.ts packages/siegelense/src/statics/siegelense-output/siegelense-output-statics.test.ts packages/siegelense/statics.ts`

**Acceptance criteria, quoted**

> line 2232: `**Every call below is `dungeonmaster siegelense <name>`** — `dungeonmaster siegelense start`, `dungeonmaster`
> line 2234: `command outside that form. **Steps are not calls**: `look`, `click`, `health` and the rest are values inside `run`'s`

> line 42: `**The principle is that the CALL surface is bounded and the STEP surface is open.** Thirteen calls, and they stop`

---

### W2 — The help statics (wave B, PARALLEL with W3)

**Creates** `packages/siegelense/src/statics/siegelense-help/siegelense-help-statics.ts` + `.test.ts`, and its
barrel line.

Shape:

```
siegelenseHelpStatics = {
  index: { headline, notBuiltYet: [ 'capacity', 'profile', 'prune', 'snapshots', 'recipes', 'docs' ],
           footer: 'dungeonmaster siegelense <call> --help  for one call's flags and refusals' },
  calls: {
    start:   { summary, synopsis, flags: [{ name, value, required, description }], refusals: [], example },
    run:     { … }, results: { … }, kill: { … }, status: { … }, cleanup: { … }, compare: { … },
  },
  internal: { driver: { summary: '… (internal — `start` spawns it; nobody types it)', … } },
}
```

**`calls` holds exactly the seven built calls and `driver` sits in `internal`**, so the key-set test W13
writes stays exact. Every `refusals` array carries §3.E's sentences verbatim, re-worded only where a flag name
replaces a JSON field name.

**Depends on** W1.

**Tests**

- `VALID: {Object.keys(calls)} => toStrictEqual the seven built names`, in the order
  `siegelenseCallStatics.calls.names` declares them, filtered — derived from that statics, never a second
  hardcoded list.
- `VALID: {every calls key} => is a member of siegelenseCallStatics.calls.names`, as an `it.each` over the
  keys asserting membership. This is the test that refuses an invented fourteenth call.
- `VALID: {index.notBuiltYet} => toStrictEqual the six`, derived as `calls.names` minus `Object.keys(calls)`
  and asserted against the literal six, so the two halves must agree.
- `VALID: {results.refusals} => carries the run-id sentence`, asserted with `toStrictEqual` on the complete
  array. The sentence is quoted evidence; a substring check on it is not an assertion.
- `it.each` over `Object.keys(calls)`: `VALID: {%s} => has a non-empty summary, synopsis, flags, output and
  example`, asserting each field's actual value shape with `toBe`/`toStrictEqual`, never `.toBeDefined()`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- packages/siegelense/src/statics/siegelense-help/siegelense-help-statics.ts packages/siegelense/src/statics/siegelense-help/siegelense-help-statics.test.ts packages/siegelense/statics.ts`

**Acceptance criteria, quoted**

> line 2303: `**`run` defaults to the latest ONLY while you are the session driving that instance.** There it is the common case, and`
> line 2305: `finished instance the run id is required and `results` refuses to guess**, because that instance may hold the prelude's`

> line 2450: `**`status {}` lists instances and their state. It never lists their RUNS and never lists their evidence** — those appear`

> line 2415: `Acts on STALENESS only — never kills a live instance, never prunes evidence a `VERIFIED` prelude, an open issue or an`

---

### W3 — The flag-value reader (wave B, PARALLEL with W2)

**Creates** `packages/siegelense/src/transformers/flag-value-read/flag-value-read-transformer.ts` + `.test.ts`.

`({ args, flag }: { args: readonly string[]; flag: string }): ContentText | null` — returns the token after
`flag`, `null` when the flag is absent, and THROWS when the flag is present with no value or with a value that
itself starts with `--`. One place owns that refusal sentence, which
`siegelense-flow.ts:61-64` and `cli-siegelense-responder.ts:57-62` currently carry two copies of.

**Depends on** nothing. (Listed in wave B only so W4–W7 have it.)

**Tests**

- `VALID: {args: ['--instance','inst_7f3a9c21'], flag: '--instance'} => 'inst_7f3a9c21'`.
- `EMPTY: {flag absent} => null`.
- `INVALID: {flag last} => throws naming the flag`, asserting the complete message with an anchored
  `toThrow(/^…$/u)`.
- `INVALID: {next token starts with --} => throws naming the flag`, same anchored assertion.
- `EDGE: {flag repeated} => throws naming the flag as given twice` — a repeated flag is a caller mistake and
  silently taking the first or the last is how a caller queries the wrong instance.

**Ward** `npm run ward -- --only lint,typecheck,unit -- packages/siegelense/src/transformers/flag-value-read/flag-value-read-transformer.ts packages/siegelense/src/transformers/flag-value-read/flag-value-read-transformer.test.ts`

**Acceptance criteria, quoted**

> `siegelense-flow.ts:62`: `` `${INSTANCE_FLAG} is required: it cannot be missing, and the value cannot itself start ` ``

---

### W4 — `kill`, `status` and `cleanup` arg parsers (wave C, PARALLEL with W5·W6·W7·W8)

**Creates** under `packages/siegelense/src/transformers/`, each as `<name>-transformer.ts` + `.test.ts`:

- `kill-args-parse/` — `({ args }): KillArgs` = `{ instanceId }`, `--instance` required.
- `status-args-parse/` — `({ args }): StatusArgs` = `{ instanceId: InstanceId | null; human: boolean }`.
- `cleanup-args-parse/` — `({ args }): CleanupArgs` = `{ human: boolean }`; every flag other than
  `--json`/`--human` refuses.

**Creates** the three matching contracts under `packages/siegelense/src/contracts/` (`kill-args/`,
`status-args/`, `cleanup-args/`), each with `-contract.ts` + `-contract.test.ts` + `.stub.ts`, and their
barrel lines in `packages/siegelense/contracts.ts`. **Each output shape gets its own file** — the
transformers' variants-vs-options rule.

**Depends on** W1, W3.

**Tests** (each parser)

- `VALID: {the full flag set} => the complete parsed object`, `toStrictEqual`.
- `EMPTY: {no args} => the documented default` — for `status`, `{ instanceId: null, human: false }`; for
  `cleanup`, `{ human: false }`; for `kill`, a THROW naming `--instance` as required.
- `INVALID: {unknown flag} => throws naming the flag and listing the accepted ones`, anchored.
- `INVALID: {positional argument} => throws naming it`, anchored.
- `cleanup` specifically: `INVALID: {--instance inst_x} => throws naming --instance and stating cleanup takes
  no input`, with the refusal sentence from §3.E in the message.
- `status` specifically: `INVALID: {--instance with no value} => throws` — the existing behaviour the flow
  carries today at `siegelense-flow.ts:60-65`, now owned by the parser, and the existing anchored expectation
  in `siegelense-flow.integration.test.ts:85-88` must keep passing.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the fifteen files>`

**Acceptance criteria, quoted**

> line 2409: `cleanup {}`
> line 2446: `status {}                      → the machine, every instance alive or dead, and what is monitored`
> line 2495: `kill { instance: 'inst_7f3a' }`

---

### W5 — `start` and `compare` arg parsers (wave C, PARALLEL with W4·W6·W7·W8)

**Creates** under `packages/siegelense/src/transformers/`:

- `start-args-parse/` — `({ args }): StartArgs` = `{ specName, questId: QuestId | null, guildId: GuildId | null }`.
  `--spec` required; `--quest` and `--guild` optional, `null` when absent.
- `compare-args-parse/` — `({ args }): CompareArgs` = `{ instanceId, runA, runB }`, all three required.

**Creates** `contracts/start-args/` and `contracts/compare-args/` (contract + test + stub) and their barrel
lines.

**Depends on** W1, W3.

**Tests**

- `start`: `VALID: {--spec dungeonmaster-web} => quest and guild null` — the unowned case, spec line 2251.
  `VALID: {all three flags} => the complete object`. `INVALID: {no --spec} => throws naming --spec`.
- `compare`: `VALID: {all three} => the complete object`.
  `INVALID: {--instance-a X --instance-b Y} => throws naming BOTH flags and stating there is no
  cross-instance form`, with §3.E's sentence in the message, anchored. **This is the refusal the deleted
  `.strict()` contract used to carry and it must survive the move — a generic "unknown flag: --instance-a"
  teaches the caller nothing about why.**
  `INVALID: {--run-a without --run-b} => throws naming the missing flag`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the ten files>`

**Acceptance criteria, quoted**

> line 2251: `**`quest` is optional and decides two things.** It files the instance's evidence under that quest's guild, and it is how`

> line 2420: `**`compare`** — the index delta between two runs. A READING: a computed difference between measured values, never a`

> `packages/mcp/src/flows/siegelense/siegelense-flow.ts:94`: `"…There is no cross-instance form: name one instanceId and two runs (runA, runB) inside its own timeline — two different instances share nothing but a spec.…"`

---

### W6 — The `run` arg parser, and `stepContract`'s three defaults (wave C, PARALLEL with W4·W5·W7·W8)

**Creates** `packages/siegelense/src/transformers/run-args-parse/run-args-parse-transformer.ts` + `.test.ts`
and `contracts/run-args/` (contract + test + stub) + barrel line.

`({ args }): RunArgs` = `{ instanceId, steps, stopOn }`. Reads `--steps` or `--steps-file`, exactly one,
`JSON.parse`es it, and parses the array through `stepContract`.

**Edits** `packages/siegelense/src/contracts/step/step-contract.ts` — `node`, `within` and `timeoutMs` become
`.nullable().default(null)` on every member that carries them. §3.B has the reasoning.

**Edits** `packages/siegelense/src/contracts/step/step-contract.test.ts` — add the omitted-field cases.
**Read chunk 3 §"Adding a required field to a contract breaks CALLERS that typecheck clean" before starting**:
this is the inverse (a relaxation), so it breaks no construction site, but confirm that with a `python3`
`os.walk` for `stepContract.parse(` and run the unit tests of every hit, not only typecheck.

**Depends on** W1, W3.

**Tests**

- `VALID: {--steps with a two-step array} => the parsed steps and stopOn 'error'` — the documented default,
  `toStrictEqual` on the complete object.
- `VALID: {--steps-file pointing at a real temp file} => the same parsed steps`. Written with
  `installTestbedCreateBroker`; never a file inside the repo.
- `VALID: {--stop-on never} => stopOn 'never'`.
- `INVALID: {neither --steps nor --steps-file} => throws naming both flags`, anchored.
- `INVALID: {both --steps and --steps-file} => throws naming both flags`, anchored.
- `INVALID: {--steps '[{'} => throws carrying JSON.parse's own message`, asserting the real text the parser
  produces — run it, capture it, assert it.
- `INVALID: {a step with an unknown key} => throws naming the key`, proving `.strict()` survives.
- `step-contract.test.ts`: `VALID: {step: 'goto', path: '/'} => node null, expect 'ok'`, `toStrictEqual` on
  the complete parsed member. `VALID: {step: 'click', target: X} => within null, timeoutMs null, node null`.
  `VALID: {explicit node: null} => still node null` — the relaxation must not change an existing caller.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the eight files>`

**Acceptance criteria, quoted**

> line 2287: `**`run`** — submit a batch. Blocks. Returns a status, never a payload. See the worked example below.`

> line 2730: `  stopOn: 'error',              // 'error' | 'never' — stop at the first failure, or push through`

---

### W7 — The `results` arg parser (wave C, PARALLEL with W4·W5·W6·W8)

**Creates** `packages/siegelense/src/transformers/results-args-parse/results-args-parse-transformer.ts` +
`.test.ts` and `contracts/results-args/` (contract + test + stub) + barrel line.

`({ args }): ResultsArgs` — every member of `resultsQueryContract`, built from the flags in §3.C. The five
`--where-*` flags assemble one `ResultWhere`, and `where` is `null` when none of the five appears (never an
object of five nulls, which `resultsReadBroker` would treat as a filter). `--fields` splits on `,` and parses
each token through `resultFieldContract`.

**Read `result-field-contract.ts`, `result-kind-contract.ts`, `log-level-contract.ts`, `http-method-contract.ts`
and `step-range-contract.ts` before writing the flag list** — the help text prints each flag's accepted values
from those contracts' own enums, so an added kind never needs a second edit.

**Depends on** W1, W3.

**Tests**

- `VALID: {--instance only} => every other member null`, `toStrictEqual` on the complete query.
- `VALID: {--run run_2 --step 7} => that run and that step`.
- `VALID: {--kind network --where-path /api/quests --where-method POST} => where carries exactly those two,
  the other three null`.
- `VALID: {--fields status,responseBody} => the two-member array`, `toStrictEqual`.
- `VALID: {--since boot} => since 'boot', runId null`.
- `INVALID: {--kind bogus} => throws naming the value and listing the six kinds`, derived from
  `resultsStatics.kinds.all`, anchored.
- `INVALID: {--where-steps 9-4} => throws` if `stepRangeContract` refuses a reversed range; if it accepts one,
  assert the accepted value instead. **Read the contract and assert what it really does** — do not guess.
- `INVALID: {--fields status,bogus} => throws naming the bad member`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the five files>`

**Acceptance criteria, quoted**

> lines 2292-2296, the whole five-line `results` example block.

> line 2679: `results { instance, run: 'run_2', kind: 'network',`
> line 2680: `          where: { path: '/api/quests', method: 'POST', nth: 1 },`
> line 2681: `          fields: ['status', 'requestBody', 'responseBody'] }              // one exchange, projected`

---

### W8 — The help renderer (wave C, PARALLEL with W4·W5·W6·W7)

**Creates** `packages/siegelense/src/transformers/siegelense-help-render/siegelense-help-render-transformer.ts`
+ `.test.ts`.

`({ call }: { call: SiegelenseCall | null }): ContentText` — one call's page, or the index when `call` is
`null`. Sections exactly as §3.F: headline, `USAGE`, `FLAGS`, `REFUSES`, `OUTPUT`, `EXAMPLE`. A call with an
empty `refusals` array omits the whole `REFUSES` block rather than printing an empty heading.

**Pure rendering lives in a transformer so it is provable without stdout** — the same split
`statusAnswerRenderTransformer` and `registryEntryRowFormatTransformer` already use.

**Depends on** W1, W2.

**Tests**

- `VALID: {call: 'results'} => the exact rendered page`, asserted with `toBe` on the whole string. A
  substring check is not an assertion here; the whole point is what a caller reads.
- `VALID: {call: 'cleanup'} => the page carries the ages-nothing sentence`, again as the whole string.
- `VALID: {call: null} => the index listing all seven built calls and the six not built`, whole string.
- `EDGE: {a call whose refusals array is empty} => no REFUSES heading`, whole string.
- `it.each` over `Object.keys(siegelenseHelpStatics.calls)`: `VALID: {%s} => the first line is that call's
  summary` — the line the W16 seam test asserts against a real spawned process, pinned here at unit speed so
  a renderer change breaks fast.

**Ward** `npm run ward -- --only lint,typecheck,unit -- packages/siegelense/src/transformers/siegelense-help-render/siegelense-help-render-transformer.ts packages/siegelense/src/transformers/siegelense-help-render/siegelense-help-render-transformer.test.ts`

**Acceptance criteria, quoted**

> line 32: `whole reason the surface is `dungeonmaster siegelense <call>` rather than a tool registered with an MCP client.`

---

### W9 — The `start` and `kill` responders (wave D, PARALLEL with W10·W11·W12)

**Creates** under `packages/siegelense/src/responders/siegelense/`:

- `start/siegelense-start-responder.ts` + `.proxy.ts` + `.test.ts` —
  `({ specName, questId, guildId }): Promise<AdapterResult>`. Calls `instanceStartBroker`, writes the manifest
  as JSON per §3.A, returns `adapterResultContract.parse({ success: true })`.
- `kill/siegelense-kill-responder.ts` + `.proxy.ts` + `.test.ts` — `({ instanceId }): Promise<AdapterResult>`.
  Calls `registryReadBroker` FIRST and throws "no instance by the id "X" — unknown, never existed" on a miss,
  then `instanceKillBroker`.

**The registry-miss check is carried across from `siegelense-handle-responder.ts:222-243`, not reinvented**,
and its reasoning is carried with it: `instanceKillBroker` falls back to a deterministic socket path for an id
the registry never held, so without the check a typo answers `DriverUnreachableError` — a driver problem —
instead of what it is.

**Depends on** W1, W5.

**Tests**

- `siegelense-start-responder.test.ts` — the proxy mocks `instanceStartBroker` and spies `process.stdout.write`
  with `registerSpyOn`. `VALID: {specName} => writes the manifest as JSON`, asserting the written text with
  `toBe` against `JSON.stringify(manifest, null, 2) + '\n'`. `VALID: {no quest} => the broker was called with
  questId null and guildId null`, asserted via `callsMatching` on the complete argument object.
  `ERROR: {broker throws} => the error propagates unchanged` — the responder must not swallow it into a
  `{success:false}` document on stdout, because §3.A's stdout invariant says a refusal writes nothing there.
- `siegelense-kill-responder.test.ts` — `VALID: {a known id} => writes the KillResult as JSON`, exact text.
  `ERROR: {an id the registry never held} => throws naming the id as unknown, never existed`, anchored, and
  `instanceKillBroker` was never reached (`callsMatching([]).length` is `0`, paired with the assertion on what
  WAS called).
  `VALID: {a known but already-dead id} => the broker still runs` — the reap path, spec line 2492.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

**Acceptance criteria, quoted**

> line 2240: `**`start`** — stands up an instance and hands back its id.`

> line 2272: `**`evidence` is what a session with no record works from.** Everything `results` returns lives under it, and after the`

> line 2492: `**`kill`** — tear it down. Replaces `end`.`

---

### W10 — The `run` responder (wave D, PARALLEL with W9·W11·W12)

**Creates** `packages/siegelense/src/responders/siegelense/run/siegelense-run-responder.ts` + `.proxy.ts` +
`.test.ts` — `({ instanceId, steps, stopOn }): Promise<AdapterResult>`. Registry-miss check first, then
`instanceRunBroker`, then the `RunResult` as JSON.

**Depends on** W1, W6.

**Tests**

- `VALID: {a two-step batch} => writes the RunResult as JSON`, exact text with `toBe`.
- `VALID: {the written document} => carries index and shots and NO step payloads` — assert the parsed object
  with `toStrictEqual` against the `RunResult` the broker returned, which is what proves "a STATUS, never a
  payload" rather than restating it.
- `ERROR: {an id the registry never held} => throws naming the id`, anchored, `instanceRunBroker` unreached.
- `VALID: {stopOn 'never'} => the broker was called with 'never'`, via `callsMatching` on the complete
  argument object.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the three files>`

**Acceptance criteria, quoted**

> line 76: `run      → submit a BATCH of steps; blocks; returns a STATUS, never a payload`

> line 2208 (`packages/siegelense/CLAUDE.md`'s own entry): `**`run` returns a status; `results` returns payloads**`

---

### W11 — The `results` and `compare` responders (wave D, PARALLEL with W9·W10·W12)

**Creates** under `packages/siegelense/src/responders/siegelense/`:

- `results/siegelense-results-responder.ts` + `.proxy.ts` + `.test.ts` — `({ query }): Promise<AdapterResult>`,
  calling `resultsReadBroker` and writing the answer as JSON. **No registry-miss check**: `resultsReadBroker`
  already resolves an unrecognised id to a real `instanceState: 'unknown'` answer with `rows: []`, and that is
  an ANSWER (exit 0), not a refusal.
- `compare/siegelense-compare-responder.ts` + `.proxy.ts` + `.test.ts` — `({ query }): Promise<AdapterResult>`,
  calling `compareReadBroker`. It throws `InstanceUnknownError` / `RunMissingError` of its own, which
  propagate to exit 1.

**Chunk 3's plan said `results` and `compare` get NO subcommand, and this chunk reverses that.** The reason it
gave was that their output "belongs in an agent's context rather than a scrollback" — which assumed a second
surface existed for the agent. It does not any more. Reversing it is the whole point of the chunk.

**Depends on** W1, W5, W7.

**Tests**

- `siegelense-results-responder.test.ts` — `VALID: {a run named} => writes the ResultsAnswer as JSON`, exact
  text. `VALID: {an unknown instance id} => writes instanceState 'unknown' and exits normally`, asserting the
  parsed document with `toStrictEqual` and that the responder RETURNED rather than threw.
  `ERROR: {a finished instance with no --run and no --since} => RunIdRequiredError propagates`, asserting the
  error's own complete message, and that nothing was written to stdout
  (`stdoutSpy.callsMatching([]).length` is `0`).
- `siegelense-compare-responder.test.ts` — `VALID: {two runs} => writes the CompareAnswer as JSON`, exact
  text. `ERROR: {an unknown instance} => InstanceUnknownError propagates and stdout stays empty`.
  `ERROR: {a run with no stored return} => RunMissingError propagates`.

**Ward** `npm run ward -- --only lint,typecheck,unit -- <the six files>`

**Acceptance criteria, quoted**

> line 2289: `**`results`** — query narrowly, after a run. **Starts nothing, and answers for an instance that is long dead.**`

> line 2319: `**`pruned` and `unknown` are real answers, not empty results.** A query that lands on reclaimed evidence and returns`

> line 2934: `compare { instance, runA: 'run_4', runB: 'run_5' }`

---

### W12 — `status` and `cleanup` move to JSON, and gain `--human` (wave D, PARALLEL with W9·W10·W11)

**Edits**

- `packages/siegelense/src/responders/siegelense/status/siegelense-status-responder.ts` — signature becomes
  `({ instanceId, human }: { instanceId: InstanceId | null; human: boolean })`. JSON by default;
  `statusAnswerRenderTransformer` only when `human` is true.
- `packages/siegelense/src/responders/siegelense/cleanup/siegelense-cleanup-responder.ts` — same, with
  `({ human })`.
- Both `.proxy.ts` and both `.test.ts`.

**The existing exact-text assertions move, and every one of them is named here so none is missed:**

| File | Assertion | Becomes |
|---|---|---|
| `siegelense-status-responder.test.ts` | the rendered fleet text | the JSON document; a second test for `--human` keeping the rendered text |
| `siegelense-cleanup-responder.test.ts` | `'REAPED: none\nPORTS RELEASED: none\n…'` | the JSON document; a `--human` test keeping that exact string |
| `siegelense-flow.integration.test.ts:75` | `['No siegelense instances running.\n']` for `args: ['status']` | the JSON document for the empty-fleet `StatusAnswer` |
| `siegelense-flow.integration.test.ts:104-107` | the cleanup render | the JSON document |
| `siegelense-flow.integration.test.ts:441-444` | `No instance by the id "X" — unknown, never existed.\n` | the JSON document; a `--human` test keeping that sentence, since only the renderer can tell an unknown id from an empty fleet (that responder's own header says so) |
| `siegelense-flow.integration.test.ts:465-469` | the two rendered table lines | move under a `--human` invocation |

**The two render transformers are NOT deleted and NOT changed.** They are what `--human` prints, and their
own unit tests stay exactly as they are.

**Depends on** W1, W4.

**Tests**

- `VALID: {no --human} => the JSON document`, exact text with `toBe`.
- `VALID: {--human} => the rendered table`, exact text — the string the old test asserted, unchanged.
- `VALID: {--json} => the same JSON document as no flag at all`, asserting both calls produce identical text.
- `INVALID: {--human on a call that has no renderer}` — belongs to W13's route table, not here, but note it in
  the responder's header so the next reader knows where that refusal lives.

**Ward** `npm run ward -- --only lint,typecheck,unit,integration -- <the seven files>`

**Acceptance criteria, quoted**

> line 48: `CLI has no per-call size ceiling the way an MCP tool result does — output is stdout — but a `results` query with real`

> line 2412: `    leftAlone: [ { id: 'inst_7f3a', why: 'live — last beat 2s ago' } ] }`

---

### W13 — `SiegelenseFlow`: the route table, `--help`, and the three-way refusal (wave E, alone)

**Edits**

- `packages/siegelense/src/flows/siegelense/siegelense-flow.ts` — replace the four inline branches with:
  1. a `--help` / `-h` branch, BEFORE any parsing, writing `siegelenseHelpRenderTransformer` output to stdout
     and returning success;
  2. a `Map<SiegelenseCall, (args) => Promise<AdapterResult>>` whose seven entries each call that call's parse
     transformer and then its responder;
  3. the `driver` route, unchanged in behaviour, with its `--instance` parsing moved into the shared
     `flagValueReadTransformer`;
  4. the three-way refusal of §4 — routed / named-but-not-built / unknown;
  5. the bare invocation → `SiegelenseFleetResponder`, unchanged.
- `packages/siegelense/src/startup/start-siegelense.ts` — its USAGE header gains one line per new call.

**Creates** `packages/siegelense/src/flows/siegelense/siegelense-flow.test.ts`? **No** — flows take
`.integration.test.ts` only (`enforce-implementation-colocation`). Every assertion below goes in the existing
`siegelense-flow.integration.test.ts`.

**The `--human` refusal lives here**, in the route table: a call whose entry declares no human renderer
refuses `--human` naming `status` and `cleanup` as the two that have one.

**Depends on** W2, W4, W5, W6, W7, W8, W9, W10, W11, W12.

**Tests** (in `siegelense-flow.integration.test.ts`)

- `VALID: {Map keys} => toStrictEqual Object.keys(siegelenseHelpStatics.calls)` — **the key-set test of §4.**
  Exported route-key list or a derived read; whichever, assert the two sets as complete arrays.
- `VALID: {args ['--help']} => the index page on stdout`, exact text, and the call returns success.
- `it.each` over the seven: `VALID: {args ['%s','--help']} => that call's page on stdout`, first line asserted
  with `toBe`.
- `INVALID: {args ['capacity']} => throws naming capacity as a siegelense call that is not built yet, and
  listing the built ones`, anchored.
- `INVALID: {args ['statuss']} => throws "Unknown siegelense subcommand: statuss" plus the usage line`,
  anchored — the existing expectation at line 112-114, updated for the new usage string.
- `INVALID: {args ['results','--human']} => throws naming status and cleanup as the two that render`,
  anchored.
- `VALID: {args []} => the fleet responder still runs` — the existing route must survive, asserted on the
  exact text.

**Ward** `npm run ward -- --only lint,typecheck,integration -- packages/siegelense/src/flows/siegelense/siegelense-flow.ts packages/siegelense/src/flows/siegelense/siegelense-flow.integration.test.ts packages/siegelense/src/startup/start-siegelense.ts`

**Acceptance criteria, quoted**

> line 2237: `**Only `start`, `run` and `kill` need a live instance.** The other ten read the asset tree, the registry or the machine,`

> line 2232: `**Every call below is `dungeonmaster siegelense <name>`** — `dungeonmaster siegelense start`, `dungeonmaster`

---

### W14 — Strip the CLI gate (wave F, PARALLEL with W15)

**Edits**

- `packages/cli/src/responders/cli/siegelense/cli-siegelense-responder.ts` — delete the subcommand allow-list
  (lines 32-34, 44-52) and the `--instance` pre-check (lines 35, 54-63) and the `USAGE` constant. What remains
  is: resolve the module, dynamic-import it, call `StartSiegelense({ args })`, parse the result. **Rewrite the
  PURPOSE header**: it currently describes a validating gate, and after this edit it forwards. Its second
  sentence must say why it validates nothing — `SiegelenseFlow` is the single source of truth, and a second
  copy of the subcommand list is what made two shipped subcommands untypeable.
- `packages/cli/src/responders/cli/siegelense/cli-siegelense-responder.test.ts` — delete the two refusal tests
  (the `--instance` one at ~line 67 and the unknown-subcommand one at ~line 85); keep the dynamic-import
  failure test at ~line 94.
- `packages/cli/CLAUDE.md` — its `dungeonmaster siegelense` bullet lists two invocations. Replace with the
  seven calls plus `--help`.

**Depends on** W13.

**Tests**

- `VALID: {args ['bogus']} => forwarded verbatim to StartSiegelense` — assert via the import proxy's
  `callsMatching` that `StartSiegelense` received `['bogus']`, and that the responder did NOT throw. **This is
  the inverse of the deleted test and it is the one that proves the gate is gone.**
- `VALID: {args ['results','--instance','inst_7f3a9c21','--run','run_2']} => forwarded verbatim`, asserting
  the complete array with `toStrictEqual`.
- `VALID: {args []} => forwarded as []`.
- `ERROR: {the dynamic import rejects} => throws "Failed to load @dungeonmaster/siegelense: …"`, unchanged.

**Ward** `npm run ward -- --only lint,typecheck,unit -- packages/cli/src/responders/cli/siegelense/cli-siegelense-responder.ts packages/cli/src/responders/cli/siegelense/cli-siegelense-responder.test.ts packages/cli/src/responders/cli/siegelense/cli-siegelense-responder.proxy.ts`

**Acceptance criteria, quoted**

> `HANDOFF.md:87`: `2. **A person must be able to type it.** `dungeonmaster siegelense status` and `cleanup` were built, fully`
> `HANDOFF.md:89`:    `spanned the seam. A test that starts below the gate cannot catch a closed gate.`

---

### W15 — The Bash permission grant (wave F, PARALLEL with W14)

**Edits**

- `packages/shared/src/statics/agent-qa-permissions/agent-qa-permissions-statics.ts` — add
  `'Bash(dungeonmaster siegelense:*)'` to `allow`, and add a paragraph to the PURPOSE header stating the
  mechanism: a dispatched agent has no interactive approver, so an ungranted command is denied outright rather
  than prompted; the seven MCP tools each carried an `mcp__dungeonmaster__siegelense-*` grant and the CLI
  carries none, so without this entry every siege call is denied to the reader the CLI exists for.
- `packages/shared/src/statics/agent-qa-permissions/agent-qa-permissions-statics.test.ts` — the full-value
  assertion.
- `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts` — the seven
  copies of the expected allow-list gain the new Bash entry. **W18 also edits this file**, for the seven MCP
  names; the two items are in different waves so they never hold it at once.

**The grant is narrow on purpose.** `Bash(dungeonmaster siegelense:*)`, not `Bash(dungeonmaster:*)` — `init`
rewrites config, `create-package` writes a package, `start` boots a server, and none of those is a siege call.

**Depends on** nothing. (Placed in wave F so it lands near the deletion that regenerates the file.)

**Tests**

- `agent-qa-permissions-statics.test.ts` — `VALID: {allow} => toStrictEqual` the complete six-entry array.
- `settings-permissions-add-broker.test.ts` — the existing tests, asserting the written settings JSON's
  complete `permissions.allow`, now including the new entry. **These assert the file that is WRITTEN**, which
  is what proves the grant reaches `.claude/settings.json` rather than only the statics.

**Ward** `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/statics/agent-qa-permissions/agent-qa-permissions-statics.ts packages/shared/src/statics/agent-qa-permissions/agent-qa-permissions-statics.test.ts packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts`

**Acceptance criteria, quoted**

> `agent-qa-permissions-statics.ts:9`: `A dispatched agent has no interactive approver: a command outside `permissions.allow` comes back`
> `agent-qa-permissions-statics.ts:10`: `` `This command requires approval` and is DENIED outright, never prompted. ``

> line 30: `installed, configured per client, and reconnected whenever it changes. A CLI subcommand is reachable by any agent`

---

### W16 — The seam test, above the gate (wave G, PARALLEL with W17)

**Edits**

- `packages/cli/test/harnesses/cli-bin/cli-bin.harness.ts` — generalise `runInit()` into
  `runCommand({ args }): Promise<{ exitCode, stdout, stderr }>`, keeping `runInit()` as a caller of it so the
  existing test is untouched. It already spawns `bin/cli-entry.ts` under `tsx --conditions=source`; it must
  now CAPTURE stdout and stderr rather than consuming and discarding them (lines 79-80), and take a
  `DUNGEONMASTER_HOME` for the spawn env so a siege call never touches a real registry.
- `packages/cli/bin/cli-entry.integration.test.ts` — the two `it.each` blocks of §4.
- `packages/cli/src/flows/cli/cli-flow.integration.test.ts` — the same derived `it.each` one level down,
  through the real dynamic import, beside the existing bare-invocation test at line 244.

**Depends on** W13, W14.

**Tests**

- `it.each(Object.keys(siegelenseHelpStatics.calls))`:
  `VALID: {dungeonmaster siegelense %s --help} => exit 0, stdout's first line is that call's summary`.
  Assert `exitCode` with `toBe(0)` and the first line with `toBe`.
- `it.each` over the six not-built names:
  `INVALID: {dungeonmaster siegelense %s} => exit 1, stderr names it as not built yet`, asserting the exit
  code and the complete stderr line.
- `VALID: {dungeonmaster siegelense --help} => exit 0 and the index page`, first line asserted with `toBe`.
- `INVALID: {dungeonmaster siegelense statuss} => exit 1 and "Unknown siegelense subcommand: statuss" on
  stderr`, complete line.
- In `cli-flow.integration.test.ts`: the same seven-call `--help` `it.each`, asserting captured stdout.

**This item's assertions are the chunk's regression guard and the reason it exists is one sentence:** every
other test in this repo that touches a siegelense subcommand starts at `SiegelenseFlow` or below, and a test
below the gate cannot see a closed gate.

**Ward** `npm run ward -- --only lint,typecheck,integration -- packages/cli/test/harnesses/cli-bin/cli-bin.harness.ts packages/cli/bin/cli-entry.integration.test.ts packages/cli/src/flows/cli/cli-flow.integration.test.ts`

**Acceptance criteria, quoted**

> `HANDOFF.md:88`: `tested, and unreachable, because the CLI gate in `packages/cli` only admitted `driver` and nothing`

---

### W17 — The seven calls through `SiegelenseFlow`, against a real evidence tree (wave G, PARALLEL with W16)

**Edits** `packages/siegelense/src/flows/siegelense/siegelense-flow.integration.test.ts` — the read-path
describe block at line 132 already drives `results`, `status`, `compare` and `cleanup` against a REAL evidence
tree built by `evidenceTreeHarness`, but it calls the BROKERS (`tree.readResults(...)`). Add a sibling block
that drives the same tree through **`SiegelenseFlow({ args })`** and asserts the captured stdout.

**Depends on** W13.

**Tests**

- `VALID: {args ['results','--instance',<killed>,'--run','run_1']} => the stored RunResult as JSON on stdout`,
  the whole captured string asserted with `toBe` against
  `JSON.stringify(<the answer the harness wrote>, null, 2) + '\n'`.
- `VALID: {args ['results','--instance',<killed>,'--run','run_1','--kind','console','--step','2']} => only
  step 2's rows`, parsed from stdout and asserted with `toStrictEqual`.
- `ERROR: {args ['results','--instance',<killed>]} => exits via a throw carrying RunIdRequiredError's message,
  and stdout is empty` — **the required-run-id refusal, driven from argv rather than from a broker call.**
- `VALID: {args ['compare','--instance',<killed>,'--run-a','run_1','--run-b','run_2']} => the CompareAnswer as
  JSON`, parsed and asserted with `toStrictEqual`.
- `INVALID: {args ['compare','--instance-a',X,'--instance-b',Y]} => throws naming both flags and the
  no-cross-instance rule`, anchored.
- `VALID: {args ['status','--instance',<unknown>]} => instanceState/unknown answer as JSON, exit path normal`.
- `VALID: {args ['status','--human']} => the rendered table`, whole string.
- `VALID: {args ['cleanup']} => the CleanupAnswer as JSON with leftAlone present`, parsed and asserted with
  `toStrictEqual`.
- **Every path in every parsed answer is absolute and starts with `/`** — the existing assertion at line
  259-260, repeated on the argv-driven path, because a path a reader's `Read` cannot reach is a path that
  hands back nothing.

**`start`, `run` and `kill` get NO integration test here.** They need a live driver, which this suite
deliberately has none of; their coverage is W9's and W10's unit tests plus the manual drive in §8. Say so in
the suite's own comment rather than leaving the absence to be discovered.

**Ward** `npm run ward -- --only lint,typecheck,integration -- packages/siegelense/src/flows/siegelense/siegelense-flow.integration.test.ts`

**Acceptance criteria, quoted**

> line 2802: `**That `shot` path is absolute and inside the repo**, so the next move is a plain `Read` of it. A path under someone's`

> line 2305: `finished instance the run id is required and `results` refuses to guess**, because that instance may hold the prelude's`

---

### W18 — Delete the MCP layer (wave H, alone)

**Everything in §5.** One item, one agent, expect five or six scoped ward runs each fixing one red file —
`packages/mcp/CLAUDE.md` calls that treadmill the documented shape, not a sign anything is wrong.

**Depends on** W16, W17. Nothing is deleted until the replacement is proven from above the gate.

**Order within the item**, because it minimises red:

1. `packages/mcp/src/startup/start-mcp-server.ts` — drop the registration spread first, so nothing routes to
   code about to vanish.
2. Delete the two responder folders, the flow folder, the seven contract folders.
3. `mcpToolsStatics` + its test.
4. `smoketestProbeArgsStatics` + its test.
5. The nine allow-list copies and `mcp-server-flow.integration.test.ts`.
6. `packages/siegelense/src/statics/siegelense-tools/` + the barrel line.
7. `packages/mcp/package.json`.

**Tests** — this item writes no new test. It makes existing ones true:

- `mcp-tools-statics.test.ts` — the full-value `toStrictEqual` now lists twenty-six names.
- `smoketest-probe-args-statics.test.ts` — `Object.keys(probeArgs).sort()` equals the sorted twenty-six.
- `mcp-server-flow.integration.test.ts` — the registration count test and the size-cap suite pass with no
  siegelense tool present. **Add one assertion rather than only removing**: `VALID: {tools/list} => no tool
  name starts with "siegelense-"`, asserted as the complete filtered array being `[]`. An absence test is how
  a later session finds out it re-registered one.
- `mcp-permissions-creator-transformer.test.ts` — the expected array, and the test NAME's count.
- `install-flow.integration.test.ts` — the allow-list.

**Ward** `npm run ward -- --only lint,typecheck,unit,integration -- <every touched file>`, then report to the
coordinator that the build + `npm install` + `npm run init` + MCP reconnect are due.

**Acceptance criteria, quoted**

> `HANDOFF.md:48`: `**Every call is `dungeonmaster siegelense <call>`. There are no MCP tools.** The spec said otherwise for`

> line 29: `**It is a CLI, and not MCP, because an LLM should not need to install anything to use it.**`

---

## 7. Dependency graph

```
                           W1  (call + output statics)
                            │
              ┌─────────────┴─────────────┐
             W2                          W3
       (help statics)            (flag-value reader)
              │                           │
              └────────┬──────────────────┤
                       │                  │
     ┌───────┬─────────┼──────────┬───────┴───┐
    W8      W4        W5         W6          W7
  (help   (kill/    (start/     (run       (results
  render) status/   compare     parser +    parser)
           cleanup) parsers)    step
           parsers)             defaults)
     │       │         │          │           │
     │       └────┬────┴──────────┴───────────┤
     │            │                           │
     │      ┌─────┴─────┬──────────┬──────────┤
     │     W12         W9         W10        W11
     │  (status/    (start/      (run      (results/
     │   cleanup     kill        responder)  compare
     │   → JSON)     responders)             responders)
     │      │         │           │           │
     └──────┴─────────┴─────┬─────┴───────────┘
                            │
                           W13  (flow: routes, --help, refusals)
                            │
                  ┌─────────┴─────────┐
                 W14                 W15
            (strip the gate)   (Bash grant)
                  │
        ┌─────────┴─────────┐
       W16                 W17
  (seam test, spawned)  (seven calls
                         through the flow)
                  │
                 W18  (delete the MCP layer)
```

| Wave | Items | Each item's blockers |
|---|---|---|
| A | W1 | — |
| B | W2 · W3 | W2←W1 · W3←— |
| C | W4 · W5 · W6 · W7 · W8 | W4←W1,W3 · W5←W1,W3 · W6←W1,W3 · W7←W1,W3 · W8←W1,W2 |
| D | W9 · W10 · W11 · W12 | W9←W5 · W10←W6 · W11←W5,W7 · W12←W4 |
| E | W13 | W2,W4,W5,W6,W7,W8,W9,W10,W11,W12 |
| F | W14 · W15 | W14←W13 · W15←— |
| G | W16 · W17 | W16←W13,W14 · W17←W13 |
| H | W18 | W16,W17 |

---

## 8. The manual-drive script

**Drive the real CLI at a terminal, from a directory that is NOT this repo for step 0.** Every earlier chunk's
worst defects were found this way and by nothing else.

### 0 — Reachable with nothing installed

```
cd /tmp && dungeonmaster siegelense --help
```

The index page, exit 0, from a directory holding no `.dungeonmaster.json` and no MCP client. **If this needs a
config file to print help, the chunk has not delivered its claim.**

### 1 — Every call's help, and the six that are not built

```
dungeonmaster siegelense results --help
dungeonmaster siegelense compare --help
dungeonmaster siegelense capacity
```

`results --help` must carry the required-run-id sentence in `REFUSES`. `compare --help` must carry the
no-cross-instance sentence. `capacity` must say it is a siegelense call that is not built yet — **not**
"unknown subcommand".

### 2 — Stand an instance up, from argv

```
dungeonmaster siegelense start --spec dungeonmaster-web
```

One JSON document, nothing else on stdout. Carries `instance`, `baseUrl`, `home`, `evidence`, both log paths,
`queuedMs`, `aheadOfMe`, `bootMs`. **`HANDOFF.md` says this call was proven broken by a real run, fixed, and
never re-verified by a person — this is that verification.** Keep the instance id.

### 3 — Run a batch typed as a file

```
cat > /tmp/batch.json <<'EOF'
[ { "step": "goto",   "path": "/" },
  { "step": "screenshot", "name": "home.png" } ]
EOF
dungeonmaster siegelense run --instance <id> --steps-file /tmp/batch.json
```

**No `node: null` anywhere in that file** — W6's defaults are what make it parse. The answer is a STATUS: an
index and a shot list, no step payloads.

Then the inline form, to prove both:

```
dungeonmaster siegelense run --instance <id> --steps '[{"step":"goto","path":"/"}]'
```

And the refusals:

```
dungeonmaster siegelense run --instance <id>                                  # names both flags
dungeonmaster siegelense run --instance <id> --steps '[{' --steps-file x      # names both flags
dungeonmaster siegelense run --instance <id> --steps '[{'                     # JSON parse message
```

### 4 — Read what it saw

```
dungeonmaster siegelense results --instance <id> --run run_1
dungeonmaster siegelense results --instance <id> --run run_1 --step 2
dungeonmaster siegelense results --instance <id> --run run_1 --kind network --where-method GET --fields status
dungeonmaster siegelense results --instance <id> --kind console --since boot
```

Every answer carries `instanceState`. `Read` the shot path that comes back — it must be absolute and inside
the repo, through `<repoRoot>/.siegelense`.

### 5 — The refusal a caller would otherwise learn by getting it wrong

```
dungeonmaster siegelense kill --instance <id>
dungeonmaster siegelense results --instance <id>          # exit 1, the run-id sentence, stdout empty
echo $?
```

Check the exit code explicitly. And check stdout is EMPTY on that refusal:

```
dungeonmaster siegelense results --instance <id> > /tmp/out.json 2>/dev/null; wc -c /tmp/out.json
```

Zero bytes, or §3.A's invariant is broken.

### 6 — The operator's pair, both ways

```
dungeonmaster siegelense status
dungeonmaster siegelense status --human
dungeonmaster siegelense status --instance <id>
dungeonmaster siegelense cleanup
dungeonmaster siegelense cleanup --human
dungeonmaster siegelense results --instance <id> --human     # exit 1, names status and cleanup
```

### 7 — Compare, and the unknown-instance answers

```
dungeonmaster siegelense compare --instance <id> --run-a run_1 --run-b run_2
dungeonmaster siegelense compare --instance-a <id> --instance-b <other>   # names both flags
dungeonmaster siegelense results --instance inst_deadbeef                 # instanceState 'unknown', exit 0
dungeonmaster siegelense kill --instance inst_deadbeef                    # exit 1, unknown/never existed
```

### 8 — The MCP tools are gone

After the coordinator's rebuild and MCP reconnect, `/mcp` lists no `siegelense-*` tool, and
`.claude/settings.json` holds no `mcp__dungeonmaster__siegelense-*` row and DOES hold
`Bash(dungeonmaster siegelense:*)`. **Read the file; do not edit it.**

### What a person still CANNOT do after this chunk

`capacity`, `profile`, `prune`, `snapshots`, `recipes`, `docs` — all six refuse by name. No `look`, no key, no
refs, no settling, no snapshots, no recipes, no retention. §11 says which chunk each belongs to.

---

## 9. Risks this chunk takes on purpose

| Risk | Why it is taken |
|---|---|
| **Flipping `status` / `cleanup` from human text to JSON** breaks every existing exact-text assertion | §3.A's consistency argument. W12 names all six assertion sites, so none is discovered by a red run instead of by the plan |
| **`stepContract` gains three defaults**, which relaxes a contract three chunks of code already build against | A relaxation cannot break a caller that passes the value explicitly. The alternative is a CLI where every step a human types needs `node: null`, which makes the surface unusable at exactly the moment it becomes the only surface |
| **The deletion is last**, so the repo carries two surfaces for most of the chunk | The reverse ordering leaves a window where neither works. Two surfaces for a few waves costs nothing but a duplicated statics file, which W18 removes |
| **`--help` is not `docs`** and a reader may take it for one | §3.F states the difference in the index page's own footer. The risk is real and the mitigation is the wording, not a second mechanism |
| **`cli-entry.ts` keeps one exit code** for usage errors and runtime failures | §3.D. Splitting it changes four other commands' contracts in a chunk that is about one command |
| **The Bash grant is repo-wide once `init` runs** | It is narrow — `dungeonmaster siegelense:*`, not `dungeonmaster:*` — and every call behind it reads or drives an instance the session owns. `init`, `create-package` and `start` stay ungranted |
| **A stale socket directory still breaks the driver suite** (`HANDOFF.md`, "Stale sockets accumulate") | Untouched by this chunk, and still unexplained. `rm -rf /tmp/dm-siege-sockets` before any driver run, and do not read a red there as this chunk's regression |

---

## 10. Ledger rows this chunk expects to move

The ledger's owner moves these; this plan does not edit `build-ledger.md`.

| Row | From | To |
|---|---|---|
| Part 1 · Decision: an INSTANCE service, reached over the CLI | `DELIVERED chunk 3 (part) — wrong surface` | `DELIVERED chunk 4 (part)` — seven of thirteen on the right surface; the six unbuilt stay named |
| Part 6 · The tool is `siegelense`, and its recipes live beside it | `DELIVERED chunk 2 (part) — wrong surface for most calls` | `DELIVERED chunk 4 (part)` — the subcommand half complete for every built call |
| Part 8 · The thirteen calls | `DELIVERED chunk 3 (part) — wrong surface` | `DELIVERED chunk 4 (part)` |
| Part 8 · `start` / `run` / `results` / `kill` / `compare` (five rows) | each `… — reached today only as the MCP tool …` | drop the wrong-surface clause; each is now `dungeonmaster siegelense <name>` |
| Part 8 · `status` / `cleanup` | `the correct surface already exists for this call` | reword: the MCP tool is gone, the subcommand is the only surface |
| Part 4A · The service: instances, runs, batches | `DELIVERED chunk 3 (part) — wrong surface` | `DELIVERED chunk 4 (part)` |
| Part 7 item 2 / 2a | `DELIVERED chunk 3 (part) — wrong surface` | `DELIVERED chunk 4 (part)` |
| **Chunk 2 defect 3 — "the caller still waits out its own full poll deadline"** | `PARTLY closed`, "Carry it into chunk 4" | **stays open**, reassigned to the capacity chunk. §1's deferral table says why, and it must not be dropped |
| NEW row | — | The `Bash(dungeonmaster siegelense:*)` grant, under off-spec work delivered alongside chunk 4: not required by the spec, found by reading `agentQaPermissionsStatics` against the surface move, and without it every call is denied to a dispatched agent |

---

## 11. Chunks after this one

Grouped from the ledger's `NOT STARTED` rows, in build order. Each grouping is one coherent surface, and the
one-line reason is why its members ship together rather than apart.

### Chunk 5 — Addressing: `look`, the key, refs, and the `dom` ladder

Part 2 "Addressing: a listing, not a selector" (345), "The `attrs` column" (447), "Does this element have a
click handler?" (488), "Two key-level readings" (518), "What is deliberately NOT computed" (535), "`dom` is
the ESCAPE HATCH" (602), "Computed findings" (824); Part 4A "Addressing: the key, refs, the map" (1629); Part
8 "Refs are for DRIVING" (2141); the `elements` field on every acting step (2704) and `compare`'s fifth field;
the `ref` column in the ambiguity error (2078); Part 7 items 7 and 10's `dom` half; steps `key`, `paste`,
`box`, `dom`, `storage`, `file` (2501).

**Why together:** `elements` is a delta SCOPED to a container and the container tree IS the key, so it cannot
ship before `look`; the ambiguity error's candidate rows carry `within` instead of a `ref` for the same
reason; and `dom` is the last rung of a ladder whose first rung is `look`. **Ship without the map** — spec
line 2039 defers it explicitly, and the one trial arm that had a map rendered three and opened none. This is
the largest remaining chunk and the highest-value one: line 2039 records the arm that used the key spent 24%
fewer tokens.

### Chunk 6 — Time: settling, `until`, `hold`, `video`, `before`

Part 2 "Settling: a step ends when the page is DONE" (781), "Instrumentation: run a script before the page's"
(816), "Time: what is decidable, and what is not" (839); Part 5 "Animation is the one that conflicts with the
product"'s `before` lever (1871); Part 7 items 5, 9, 11.

**Why together:** network-quiet + paint-quiet + DOM-quiet with a repeating-request discount is ONE signal set,
and `until`, `hold` and settle-based stepping all read it. Building it for one and rewiring for the others is
the double work spec line 2064 warns about, arriving from inside. `before` joins them because it is the
substrate every injection stands on and `video` joins them because it is the other half of "what a human
watches when nothing else can decide".

### Chunk 7 — State: snapshots, `reset`, recipes, `seed`

Part 2 "Resetting: three layers" (1017), "The fixer writes the e2e, and the PRELUDE is what makes that
possible" (1337); Part 4A "Snapshots, reset, and the state/evidence line" (1732), "Recipes: what one is and
what holds it" (1797); Part 5 "What the CONTENT must guarantee" (1858); Part 7 items 3, 3a, 14, 16's
DOM-handle-in-a-recipe half; Part 8 "Interleaving recipes and steps" (2846), "Cycles" (2895); the `snapshots`
and `recipes` calls; `as` naming a step's output and `{name.field}` reading it back.

**Why together:** `snapshots` lists what `reset level: 'state'` can return to, so it ships with the thing that
mints them; `seed` mints runtime ids that no file contains, which is the only reason `{name.field}`
interpolation exists; and both cycle shapes need snapshot + reset + seed at once. The DOM-handle lint rule
ships here because it has nothing to fire against until recipes exist, and spec line 2134's caution — "a rule
people over-trust is worse than none" — makes a rule nobody has watched fire exactly that.

### Chunk 8 — Capacity and profiling

Part 3 whole (1453-1598): "Profiling: measure what an instance costs, then divide" (1455), "Phase zero IS the
profiling run" (1484), "The TOOL staggers, because nobody else can" (1523); Part 4A "Capacity and profiling"
(1777); the `capacity` and `profile` calls; `start`'s pool-size refusal and the one hard floor; append-only
profile samples under `profiles/<hash>/`. **Plus the carried-over boot-poll defect** — "a 55-second start is
indistinguishable from a hang" (line 1542), which needs a failure marker the driver writes and a side channel
the poller reads, widening `registryEntryContract` exactly as the sampler does.

**Why together:** `capacity` reads a measured profile; the profile needs a sampler; `start`'s refusal needs
`capacity`; and all three widen the same registry row. Chunk 3 already built the RSS-reading primitive
(`machineRssByPgidBroker`) this chunk's sampler calls. It also closes step 3 of the operator's own four
(line 1345).

### Chunk 9 — Retention, pruning and tombstones

Part 2 "Retention: assets outlive their instance" (232); Part 7 item 2c; the `prune` call with its three
refusals and the citation resolver through `.quest-plans/`; `cleanup`'s `assetsAged`; video's own shorter
window; a pruned query answering `pruned` rather than `[]`; the CONSUMING half of item 11g — nothing in
`packages/siegelense` reads a `walked` note yet.

**Why together:** every refusal is the same resolver seen from a different call, and ageing WITHOUT it is the
exact damage spec lines 260-263 describe — the operator's own `cleanup` ages out a clean happy walk's
baselines, and the attacker arrives with no baseline for the path it was sent to attack. The typed
`instanceId`/`runId` fields on `questNoteContract` already landed; the reader does not exist.

### Chunk 10 — The remaining steps and the non-browser surfaces

Part 2 "Survival: what a stress tester needs" (974) — `health`; Part 7 items 8, 12, 15 — `health`,
server-side failure injection, `resize` and a direct `request` step; the `process-state` / `environment`
surfaces item 11e names on the tooling side; steps `request`, `resize`.

**Why together:** each is a step verb, which is DATA inside `run` (line 2234), so the call surface does not
grow when they arrive — `stepContract`'s union gains a member and `stepStatics.verbs.all` gains a name. They
are cheap once the ladder and settling exist and expensive before, because `health` composes readings the
earlier chunks build.

### Chunk 11 — `docs`, and moving the lane spec where consumers get it

The `docs` call and its seven scopes (2323); Part 7 item 17 — `laneSpecStatics` still names
`@dungeonmaster/server` and `@dungeonmaster/web` directly, so a consumer repo installing this package gets a
tool that cannot boot its own app.

**Why last, both of them:** `docs` describes the surface, and a manual describing calls that do not exist is
the failure it was invented to prevent — it ships when the surface is complete. Item 17 is the largest
generalisation and spec line 2064 states the ordering outright: "Items 4 to 16 are additive to files item 17
moves. Doing 17 first means doing them twice." Item 17 also gets no help from lint, measured — line 2066-2069
records that `no-hardcoded-package-names` waves the `@scope/name` form through by design, so whoever does it
finds the literals by reading.

### Not this package, tracked but not scheduled here

Part 7 items 3b (the PLANNER role), 4b (the record's `WALKED` field), 11b, 11c, 11d (`siegemaster-reader`),
11e's minion half, 11f (the `(human-check)` panel in `packages/web`), 11h (`get-qa-checklist`'s node id). The
ledger marks each `N/A — spec-side, not tooling` or assigns it to `packages/orchestrator`, `packages/mcp` or
`packages/web`. **Item 4b still gates tooling**: a `WALKED` line is one of the citations chunk 9's `prune`
must refuse over.
