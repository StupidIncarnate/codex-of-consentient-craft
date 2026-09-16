# Siegelense — the build

**Valid as of `5562b4c1c`, 2026-09-16.** Re-derive the counts below before trusting them; the command for
each is given beside it. **A count in this file is a claim about a moment, and this file does not update
itself.**

## The score

| | Built | Total | |
|---|---|---|---|
| **Calls** | **7** | 13 | `start` `run` `results` `kill` `status` `cleanup` `compare` |
| **Step verbs** | **6** | 23 | `goto` `waitFor` `click` `type` `screenshot` `eval` |
| **Results kinds** | **6** | 6 | `console` `network` `ws` `server` `screenshots` `steps` |
| **Build-order items** | **6** | 30 | Part 7 of the spec — plus 6 more in part and 3 that are spec-side, not tooling |

**Roughly a third of the feature set exists.** The parts that do exist are solid and have been driven by
hand. The parts that do not include the entire ADDRESSING story and the entire SEEDING story, which
together are what let a session verify a browser feature at all. Read "What this cannot do yet" before
promising anyone a walkthrough.

---

## The prompt

Copy the block below into a new session. It is self-contained.

> Work on `master` in `/home/brutus-home/projects/codex-of-consentient-craft`. **Read
> `scrolls/seigelense/HANDOFF.md` before anything else**, then `scrolls/seigelense/build-ledger.md`. The
> handoff carries the feature set and the definition of done; the ledger carries the row-by-row state.
>
> We are implementing the tooling described in `scrolls/seigelense/siegelense-tooling.md` in all its nitty
> gritty detail, so that I can manually test everything once without finding holes that are documented as
> requirements.
>
> **The interface is the CLI.** Every call is `dungeonmaster siegelense <call>`. There are no MCP tools and
> none are wanted — we should not have to install an MCP server for an LLM to use this. If you find MCP
> framing anywhere it is a leftover, not an instruction.
>
> **DONE IS THE FEATURE SET, NOT A GREEN TEST RUN.** The checklist in the handoff is the contract. A ward
> run cannot fail for code nobody wrote, so ward is a quality gate and never a completeness one. Before you
> tell me anything is finished, re-count the checklist against the code and paste the counts.
>
> You must use sub agents for everything including planning, work, ward runs, and manual verification.
> Commit as you see fit. Only 5 sub agents in parallel. Opus for planning, sonnet for everything else.
> **Tell every agent not to dispatch its own sub-agents.**
>
> Build in CHUNKS. The loop for each chunk:
>
> 1. A planner reads the spec and the ledger and picks the next chunk. It names which checklist rows the
>    chunk closes, and in what order. Parallelism is good, not required.
> 2. Sub agents build those rows, with unit and integration tests. No e2e needed for this package.
> 3. A reviewer reads the code against the plan and hunts for holes and blind spots.
> 4. A sub agent DRIVES THE REAL CLI against the chunk's requirements — not a script calling brokers.
> 5. A sub agent updates the ledger, the spec's inline status markers, and **the checklist counts in the
>    handoff**.
> 6. Start over.
>
> Repeat until every row of the checklist is checked. Then drive the whole surface by hand, once, against
> the spec.
>
> **Manual verification means typing the command.** Several of the worst defects in this build were caught
> only that way, and two of them had passing tests sitting on top of them.
>
> Ward discipline: agents run `npm run ward -- -- <files>` on what they touch. Before a commit, `npm run
> ward -- --uncommitted`. Check the EXIT CODE — a pipeline's exit code is the last command's, so
> `ward | tail && git commit` commits on red. A bare repo-wide `npm run ward` before merging to the default
> branch, and only then; it costs ten minutes.
>
> Only the coordinator builds. A build takes no lock and rewrites every package's output, breaking every
> other agent's checks mid-run.
>
> This is a real package in `packages/`, so it follows the repo architecture and testing standards every
> agent pulls from the MCP tools.

---

## Definition of done

**Done is this checklist, fully checked.** Not a green ward. Not a planner's opinion that there is nothing
left. Ward grades code that exists and is structurally blind to code nobody wrote — a repo with 6 of 23
step verbs goes green exactly as hard as one with 23 of 23.

Re-derive each count from the code before claiming it. The command is given under each table.

### The thirteen calls

Every call is `dungeonmaster siegelense <name>`. Steps are DATA inside `run`, never calls of their own.

| Call | State |
|---|---|
| `start` | **built** |
| `run` | **built** |
| `results` | **built** |
| `kill` | **built** |
| `status` | **built** |
| `cleanup` | **built** — minus `assetsAged`, which waits on the citation resolver |
| `compare` | **built** — minus `elements`, which waits on `look` |
| `capacity` | not built |
| `profile` | not built |
| `prune` | not built |
| `snapshots` | not built |
| `recipes` | not built |
| `docs` | not built |

The six unbuilt ones refuse BY NAME rather than as an unknown subcommand, which is reachability, not
delivery. Do not read that refusal as progress.

```
# the names, pinned so nobody invents a fourteenth or drops one
packages/siegelense/src/statics/siegelense-call/siegelense-call-statics.ts
# which of them route
packages/siegelense/src/flows/siegelense/siegelense-flow.ts   → CALL_ROUTES
```

### The twenty-three step verbs

| Verb | State | Verb | State |
|---|---|---|---|
| `goto` | **built** | `before` | not built |
| `waitFor` | **built** | `health` | not built |
| `click` | **built** | `reset` | not built |
| `type` | **built** | `snapshot` | not built |
| `screenshot` | **built** | `seed` | not built |
| `eval` | **built** | `until` | not built |
| `look` | not built | `hold` | not built |
| `key` | not built | `video` | not built |
| `paste` | not built | `request` | not built |
| `box` | not built | `resize` | not built |
| `dom` | not built | | |
| `storage` | not built | | |
| `file` | not built | | |

```
packages/siegelense/src/statics/step/step-statics.ts   → verbs.all
```

**`look` is the one to build first**, and the reason is in "What this cannot do yet" below.

### The build-order items

The spec's Part 7 is the canonical order. **Thirty items. Six are done whole, six more in part, three are
spec-side — prompt or contract work in other packages rather than tooling here — and fifteen are
untouched.** Count them yourself from the table; the tally above is a claim about one moment.

| # | Item | State |
|---|---|---|
| 1 | Gate the smoketest HTTP route at registration | **done** |
| 2 | The instance service — the thirteen calls | part: 7 of 13 |
| 2a | The evidence read path off the asset tree | **done** |
| 2b | Teardown and crash recovery, tests red-first | **done** — 16 of 16 green against real processes |
| 2c | Retention and tombstones | part: the fields exist; no ageing, no refusals, no citation resolver |
| 3 | The recipe book | **not started** |
| 3a | Recipe integration tests | **not started** |
| 3b | The PLANNER role | **not started** — orchestrator prompt work |
| 4 | A transcript of every step and reading | **done** |
| 4b | The record's `WALKED` field | spec-side |
| 5 | `before` — a script ahead of the page's own | **not started** |
| 6 | Capture on every acting step, frozen, with a change number | **done** |
| 7 | **The key as a tree — refs, `within`, four columns** | **not started** |
| 8 | `health` — one reading, one verdict line | **not started** |
| 9 | `until` — wait on a response, a file, a predicate | **not started** |
| 10 | Selectable readings — `network` projection, `dom` cap | part: the `network` half only |
| 11 | `hold` and `video` | **not started** |
| 11b | The human-check route | spec-side |
| 11c | The declared-value block and its third reader | spec-side |
| 11d | `siegemaster-reader` | **not started** — orchestrator |
| 11e | `siegemaster-operational`, and the surfaces it needs | **not started** — split ownership |
| 11f | The `(human-check)` panel on the quest | **not started** — web |
| 11g | A `walked` kind on `questNotes` | part: the contract landed, nothing consumes it |
| 11h | Print the owning node id in `get-qa-checklist` | **not started** — orchestrator/mcp |
| 12 | Server-side failure injection | **not started** |
| 13b | `compare` — the index delta between two runs | **done** minus `elements` |
| 14 | Three reset levels with named snapshots | **not started** |
| 15 | `resize`, and a direct `request` step | **not started** |
| 16 | The two local lint rules | part: `.first()`/`.last()` done, DOM-handle rule open |
| 17 | The lane spec and N ports, moved where consumers get it | part: it is data; it still names two packages directly |

The ledger carries the reasoning per row. **Read it before planning.**

---

## What this cannot do yet

Three gaps, and they compound. A session that can drive every built verb still cannot verify a browser
feature end to end, because of the first one.

### It cannot read a page

`look` returns the KEY — a tree of every addressable element with element-bound refs — and writes the shot
beside it. It is the answer to both "what is on this screen" and "how do I address the second of two
identical controls". Neither `results` nor any built step produces a node tree, and `results` never will:
it reads evidence off disk, and a tree is a live reading.

**Driven, and this is the dead end:**

```
click [data-testid="PIXEL_BTN"]
→ AMBIGUOUS: 2 elements match.
    [0] within=[data-testid="MAP_FRAME"] text="BROWSE" rect=(742,433) 66x27
    [1] within=[data-testid="MAP_FRAME"] text="CREATE" rect=(607,472) 66x27
  Pick one by narrowing with `within`.

click [data-testid="PIXEL_BTN"] within=[data-testid="MAP_FRAME"]
→ AMBIGUOUS: 2 elements match … Pick one by narrowing with `within`.
```

Both candidates carry the SAME `within`, so the instruction the error gives cannot be followed, and it
repeats itself verbatim. With `look`, the second button is `ref: 26` and the problem disappears. Today the
only way to discover what is on a page at all is to fail a click on purpose and read the near-miss list
out of the error message.

### It cannot seed anything

The lane runs a MOCK Claude CLI, and that is correct — `dungeonmaster-web` refuses to boot without
`CLAUDE_CLI_PATH` and `WARD_CLI_PATH`, in its own words *"Refusing to boot against the real CLI — that
spends real API usage and produces a non-deterministic reading."*

The mock is a QUEUE CONSUMER. Each spawn pops one JSON file:

```
<home>/claude-queue/__by_cwd__/<guildPath, every non-[A-Za-z0-9._-] byte replaced by _>/0000.json
                               metadata.json    ← the counter, so ordering is explicit
```

`<home>` comes back in `start`'s manifest, so the queue is reachable BY HAND and reachable through no built
call. `seed`, recipes and `file` are all unbuilt, and **none of the six built verbs writes a file**. `eval`
cannot stand in: it runs in the browser, and the queue is on the driver's disk.

Worse, the queue lives inside the throwaway home, which `kill` deletes — so the evidence directory keeps no
record of what the lane was fed, and a walk is reproducible only if whoever repeats it still has the JSON.

### It loses the lane under a person

A driver reaps itself after 900s with no `run`. `status` and `results` read off DISK and never touch the
driver socket, so a human clicking around the UI resets nothing. Measured: three instances booted and left
alone died at exactly 900s each.

---

## Findings log

Defects the manual walkthrough surfaced, in the order found. A defect goes to a sonnet sub-agent; this
table is how the walk tracks what is out and what landed.

| # | Stop | Defect | State |
|---|---|---|---|
| 1 | pre-walk | `start` printed its manifest and never exited — `detached: true` without `unref()` left the parent's event loop holding the driver. Manifest at `bootMs: 4269`, command still alive ten minutes later | **FIXED** `ac3827f8f` |
| 2 | pre-walk | `aheadOfMe` counted killed tombstones as queued boots, so it climbed by one per failed boot and never came down. Read 3 on an empty fleet | **FIXED** `ac3827f8f` |
| 3 | pre-walk | A `screenshot` step whose name carried no extension failed with Playwright's `path: unsupported mime type "null"`, naming neither the step nor the field | **FIXED** `ac3827f8f` |
| 4 | discovery | **Any unrecognized word booted the HTTP server.** `CliFlow` routed five commands and let everything else fall through to `CliServeResponder`, so `dungeonmaster seigelense` — two transposed letters — bound `dungeonmaster.port` and a second attempt died on `EADDRINUSE`. `COMMANDS.start` was declared and never referenced, so `dungeonmaster start` only worked through the same hole | **FIXED** `766d4c175` |
| 5 | discovery | The fleet table was unreadable — tabs with no padding, raw epoch ms in `LAST BEAT`, a full absolute path repeated per row — and a `killed` row explained nothing | **FIXED** `add570c57` |
| 6 | discovery | A step that failed for a REAL reason captured its shot and never read it. Two layers dropped the readings, so `blank` — the one field in this design that is a VERDICT — was null on the one shot a fixer opens first | **FIXED** `add570c57` |
| 7 | `start` | A boot failure took 3m0.724s to report `api, web never answered their ready path`, while the real cause sat in `driver.log` from the first 50ms. Now 1.459s, naming the missing variables | **FIXED** `add570c57` |
| 8 | `start` | Every failed boot leaked its reservation — an `alive` row with `bootedAtMs: null` holding a claimed port pair with no process | **FIXED** `add570c57` |
| 9 | `start` | **A lane reaped by its own idle timeout reported a MEMORY death.** `likelyCause` recited RSS and kernel OOM counts for a shutdown the tool scheduled itself, and a session is told to bubble that up as `rework`. The driver now writes a shutdown reason before teardown, and `start` takes `--idle-timeout-ms` to raise the ceiling for a person driving a browser. Driven: a 15s ceiling reaped on time and reported `reaped by idle timeout after 15s with no run received`, with no RSS text; an instance with no recorded reason still reports the old sentence unchanged | **FIXED** |
| 12 | test infra | **Composing two proxies that mock the same raw builtin steals one-shots, and this is the FOURTH agent to hit it.** Adding one real `pathJoinAdapter` call to a write path forced a hand-counted drain in `siegelense-driver-responder.proxy.ts` from 3 entries to 6 — a magic number that must be recomputed by hand every time anything upstream stages differently. The ledger names the real fix: scope one-shots to the proxy that staged them. Until then every change near a locations resolver pays this tax | **OPEN** — `@dungeonmaster/testing` |
| 10 | `run` | `StepAmbiguousError`'s structured `candidates` array is EMPTY while the human-readable message carries the text and rects. A session parsing the JSON gets nothing | **OPEN** |
| 11 | `run` | The ambiguity error advises narrowing with `within` when both candidates already share one. The advice cannot be followed and repeats verbatim | **OPEN** — closes with `look` |
| — | parked | `CliServeResponder` runs `xdg-open` unconditionally, with no flag, config knob or env var. Every server launch opens a browser tab | **PARKED** by request |

---

## The other documents, and what each is for

| File | What it holds | When to read it |
|---|---|---|
| `siegelense-tooling.md` | **the spec**, 3,087 lines, with inline `> **Status:**` markers under delivered headings | living in it while building a chunk |
| `build-ledger.md` | one row per spec section, with the reasoning behind each verdict | before planning, always |
| `manual-verification-runbook.md` | how to drive the real binary, and the housekeeping that stops a clean run reading as a failure | before any manual pass |
| `siegelense-recipes.md` | the recipe book design | when item 3 comes up |
| `siege-verification-remainder.md` | the ROLE — what a siegemaster is for, the perception trial, the prompts | context, not tooling |
| `plans/chunk-0*.md` | one plan per chunk, 1 to 5. Chunk 5 is planned and unstarted | picking up chunk 5 |

**Keep the markers in the spec matching this file.** They read `> **Status: DELIVERED (chunk N)** — …` or
`PARTIAL` or `BLOCKED`. Match that format exactly so a search finds them.

---

## Knowledge that cost time to learn

Condensed. The full traces are in the ledger.

**A green ward is necessary and nowhere near sufficient.** Eleven defects were found after the code went
green, and two had passing tests sitting on top of them — one test set both roots to the same value, so
the wrong one was indistinguishable from the right one; one mock helper re-wrapped cross-realm errors, so a
unit test could not reproduce the shape production produces. **Drive the thing.**

**A child spawned with `env` omitted does not read the live `process.env`.** From inside a Jest worker it
resolves against a stale pre-strip snapshot, so `--conditions=source` reaches the child and every
`@dungeonmaster/*` import resolves to TypeScript. Always pass `env:` explicitly. Three sessions lost time
to this, all of them measuring the PARENT.

**`detached: true` does not let the parent exit.** It sets the child's process group. The parent's event
loop still holds a reference until the child dies, and every child here is a long-lived server. Pair it
with `unref()`.

**Binding a unix socket whose parent directory is absent fails with `EACCES`, not `ENOENT`.** Three
sessions read that as permissions or contention.

**A raw control byte in a source file is invisible to every text tool.** A `0x00` renders as a space in
`Read`, in an edit diff and in jest's own printed diff. Sweep with `os.walk` + `'rb'`, never with `Read` or
grep — those are the tools that cannot see it.

**A lane leaked by a test is unreapable by construction.** A test driver runs under a testbed
`DUNGEONMASTER_HOME`, and `testbed.cleanup()` deletes it with the registry row inside — so the only record
of the pgids is gone. Sweep by hand: `ps -eo pid,etime,cmd | grep "bin/server-entry"`.

**Stale socket files are inert.** The teardown suite's flake was the machine's PROCESS TABLE, not
`/tmp/dm-siege-sockets`. Measured: a first heartbeat write costs 56.8ms at 435 processes and 276.7ms at
3,430, past the 250ms poll — so `ping` could answer before `heartbeat.json` existed. Fixed by gating the
reply on the first beat.

**Do not put a bare extension in `locationsStatics`.** That file's ban is repo-wide, so a fragment like
`.json` claims every other package's unrelated use of the string. A guard in `packages/local-eslint` now
refuses it.
