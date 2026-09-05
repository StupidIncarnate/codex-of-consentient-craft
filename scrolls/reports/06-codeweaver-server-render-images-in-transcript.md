# Work item 06 — codeweaver — server / render-images-in-transcript

## 0. Identity

This section identifies the work item — which package and **flow** it targeted (a flow is a named slice of the
product being built, here `render-images-in-transcript`, with its own map of proof points to confirm) — and how the
session that ran it structured its own sub-agents.

| Field | Value |
|---|---|
| Work item id | `6ab40559-0e08-4547-9af4-b0cfb34c342b` |
| Operation item id | `83c9f2ce-f00c-4dda-bf2d-594e5dacc074` |
| Session id | `d33c5e58-ec5b-470a-a888-fc492e9e1d1c` |
| Role | codeweaver (operator) |
| Model | `claude-opus-5` (186/186 assistant records) |
| Operation text | `Codeweaver: build this slice — package: server · flow: render-images-in-transcript` |
| `dependsOn` | `["3050a3ae-aafb-4f3b-9fd3-8367b5168ebb"]` — the previous server codeweaver, work item [5] |
| Work item status | `complete`, `actualSignal: "complete"`, `retryCount: 0` |
| Operation status | `complete`, `locked: false`, `flowIds: ["render-images-in-transcript"]`, `packageNames: ["server"]` |
| `startRef` | `4b8d9871033ef1a7665dc9f18d274e7ed910ae6a` |
| `agentId` | `null` |

The session ran from `createdAt 2026-09-01T23:10:44.707Z` to `completedAt 2026-09-02T00:05:20.532Z`, a window of
**54.6 min**. The transcript itself spans `2026-09-01T23:10:59.019Z` to `2026-09-02T00:05:34.474Z`, or
`0:54:35.455` — the same 54.6 minutes, measured a second way.

The codeweaver role is an **operator**: the agent that reads a work item, writes the code itself, and dispatches
other agents to write pieces of it. This session ran the whole 54.6 minutes alone, on `claude-opus-5`, for all 186
of its assistant turns.

The operator dispatched **22 sub-agents** — child agents given one self-contained task each — all part of one
family tree. **Spawn depth** counts how many hops a sub-agent sits from the operator: depth 1 means the operator
spawned it directly; depth 2 means one of those depth-1 sub-agents spawned it in turn. Eleven sub-agents sat at
`spawnDepth: 1`: ten `general-purpose/sonnet` code-writers, plus one `general-purpose/sonnet` **reviewer** — a
separate agent, described in section 4, that checks the finished code before it ships. The other eleven sat at
`spawnDepth: 2`, spawned by four of the depth-1 workers; none of their metadata recorded a `model` field (7 were
`general-purpose`, 4 were `Explore`). Reading `<agentId>.meta.json` for each gives their parentage:

| Grandchild | parentAgentId | agentType | description |
|---|---|---|---|
| `agent-a8ff85c334f81e44e` | `a995a941d06bcccc2` | general-purpose | Find absoluteFilePathContract definition |
| `agent-aa5fe92033845efbd` | `a995a941d06bcccc2` | general-purpose | Find guard folder param-optional lint rule pattern |
| `agent-a31dd93510ddf2059` | `a27a312c5341195a1` | Explore | Look up chatOutputPayloadContract and stubs |
| `agent-a518409ae05c25b1a` | `a27a312c5341195a1` | Explore | Check registerMock unaddressed-call semantics |
| `agent-a13136d97aeb2b06c` | `a27a312c5341195a1` | Explore | Read monitor-session-filter-chat-output-transformer |
| `agent-a7c675d6151c7ee25` | `a27a312c5341195a1` | Explore | Check parseChatOutputEntriesTransformer … malformed entries |
| `agent-a78c632de7c44f6c4` | `a29585323b34abdad` | general-purpose | Check Hono query decoding and ServerFlow mount order |
| `agent-acc7f6c306b497bee` | `a29585323b34abdad` | general-purpose | Find pastedImageStatics.serveRoutePath value … |
| `agent-a6194b5b48a5721c6` | `a29585323b34abdad` | general-purpose | Check image content type transformer and broker … |
| `agent-a30762dabaa00e1af` | `a9c5859dc182ad5c5` | general-purpose | Find ImageServeResponder and absoluteFilePathContract |
| `agent-ab1850a934166e238` | `a9c5859dc182ad5c5` | general-purpose | Find imageServeBroker implementation |

The outcome: one pass, with no round of rework needed. The work landed in commit
`cffccb20463d61aa1885786e44b205bf7f68de14` — 23 files changed, 1,101 lines added, 0 removed.

The session also gave 21 **sign-offs** — its recorded claims, written into the quest file, that a specific piece of
behavior was proven true. Each sign-off covers one **unit**: either an **observable** (a fact the code demonstrably
does, such as "the server returns this file's bytes") or a labelled decision branch in the flow. All 21 came back
`confirmed`, and zero came back `unconfirmable` (the state meaning the evidence could not settle the claim). This is
confirmed by walking `quest.json` for every entry where `codeweaverSignoff.workItemId == 6ab40559-…`: 18 observables,
1 terminal node, and 2 labelled edges.

---

## 1. Chronological breakdown — where the time went

Elapsed time is measured from the transcript's start, `23:10:59.019`. Gap seconds come from the `GAP` column in
`transcript-digest.py timeline`.

| # | Clock | Elapsed | Min | What happened | Evidence |
|---|---|---|---|---|---|
| 1 | 23:11:00–23:11:41 | 0.0→0.7 | 0.7 | Fetch prompt (33,701 B) and the flow slice (24,004 B) | `0.1m CALL mcp__dungeonmaster__get-agent-prompt(agent=codeweaver …)`; `0.3m CALL mcp__dungeonmaster__get-quest(questId=… packageName=server)` |
| 2 | 23:11:41–23:19:02 | 0.7→8.0 | 7.3 | Standards triple, `git log` ×2, then 29 Reads / 11 discovers / project-map / project-inventory | `0.7m CALL get-architecture({})` … `7.3m CALL Read(… server-app.harness.ts)` |
| 3 | 23:19:02–23:19:20 | 8.0→8.3 | 0.3 | Write the map (6,890 B) | `8.0m CALL Write(file_path=… .quest-plans/83c9f2ce-f00c-4dda-bf2d-5…)` |
| 4 | 23:19:20–23:21:41 | 8.3→10.7 | 2.4 | Dispatch GROUP 1 — six `Agent` calls, all `model: sonnet` | `8.6m/9.0m/9.4m/9.8m/10.3m/10.6m CALL Agent(…)` |
| 5 | 23:21:41–23:30:41 | 10.7→19.7 | 9.0 | Idle + route five group-1 returns. Gaps 107 s, 12 s, 6 s, 120 s, 146 s, 107 s | `12.5m 107s`, `14.8m 120s`, `17.3m 146s`, `19.7m 107s` |
| 6 | 23:30:41–23:30:59 | 19.7→20.0 | 0.3 | Sign 3 replay observables via `modify-quest` | `20.0m CALL mcp__dungeonmaster__modify-quest(questId=1be07040-…)` |
| 7 | 23:30:59–23:32:53 | 20.0→21.9 | 1.9 | Wait for broker (84 s), dispatch GROUP 3 responder | `21.4m 84s`; `21.9m CALL Agent(description=Image serve responder …)` |
| 8 | 23:32:53–23:37:35 | 21.9→26.6 | 4.7 | Wait for responder (232 s), dispatch GROUP 4 | `25.8m 232s`; `26.6m CALL Agent(description=Images flow and mount …)` |
| 9 | 23:37:35–23:48:41 | 26.6→37.7 | **11.1** | **Pure idle**, one helper out (`agent-a29585323b34abdad`, 10.9 min) | `37.7m 665s` — the single largest gap. Buckets show no operator activity at all across `23:37–23:46` |
| 10 | 23:48:41–23:50:05 | 37.7→39.1 | 1.4 | Read the diff: `git status`, `git diff --stat`, 2 scoped `git diff`, 7 Reads; find the over-long-path defect; dispatch the fixer | `38.7m say: "One real defect in the flow test: the over-long path case uses 'a'.repeat(4097) with no leading slash …"`; `39.1m CALL Agent(description=Fix overlong and header proofs …)` |
| 11 | 23:50:05–23:51:29 | 39.1→40.5 | 1.4 | Hunt for the two EDGE IDS the flow render never printed: 3 `ls` probes, then fall back to `get-qa-checklist` | `39.2m say: "I need the edge ids to sign the two branch units — the flow render prints labels but not ids."`; `39.6m CALL get-qa-checklist(questId=…)` |
| 12 | 23:51:29–23:58:29 | 40.5→47.5 | 7.0 | Idle waiting on the fixer (`agent-a9c5859dc182ad5c5`, 8.3 min) | `47.5m 421s` |
| 13 | 23:58:29–23:59:47 | 47.5→48.8 | 1.3 | Re-read `images-flow.integration.test.ts` at the fixer's final line numbers; sign 21 units | `47.6m CALL Read(… images-flow…)`; `48.7m CALL modify-quest(…)`; `48.8m say: "21 units signed."` |
| 14 | 23:59:52–00:05:11 | 48.9→54.2 | 5.3 | Reviewer running; parent idle | `48.9m CALL Agent(description=Codeweaver reviewer …)`; `54.2m 320s` |
| 15 | 00:05:11–00:05:34 | 54.2→54.6 | 0.4 | `git status --porcelain`, `signal-back`, final report | `54.4m CALL mcp__dungeonmaster__signal-back(questId=… workItemId=6ab40559-…)` |
| | | | **54.6** | | |

### Time by category

Ward is the repo's combined check command — lint, typecheck, and every test suite, run together as one gate before
code ships.

| Category | Minutes | Share | Basis |
|---|---:|---:|---|
| Orientation / reading (steps 1–2) | 8.0 | 14.7% | phases 1–2 |
| Planning (write the map, step 3) | 0.3 | 0.5% | phase 3 |
| Sub-agent dispatch + routing returns (active turns) | 8.9 | 16.3% | 54.6 − 8.0 − 0.3 − 37.0 − 0.4 |
| **Idle-waiting on sub-agents** | **37.0** | **67.8%** | sum of the 11 notification gaps: 107+12+6+120+146+107+84+232+665+421+320 = 2,220 s = 37.0 min |
| — of which the reviewer alone | 5.3 | 9.7% | the 320 s gap at 54.2m plus the reviewer's own 5.3-min wall |
| Verification / ward run by the operator | 0.0 | 0% | forbidden by `[BUILD]`; the operator ran neither, correctly |
| Signal / wrap | 0.4 | 0.7% | phase 15 |

The operator spent two thirds of this work item sitting still, waiting on sub-agents. The prompt's `[HELPERS]` rule
asks for exactly that: `With everything you can do done and a helper still out, end your turn on a plain message and
no tool call.` The session obeyed it exactly — the transcript contains not one `sleep`, poll, or re-run. But the
cost is structural, not a behavior problem: the plan split the work into four groups, and each group's wall-clock
time is set by its slowest member.

---

## 2. Chronological token buckets

This section breaks the session's token spend into 3-minute windows. **Context-in** is the tokens fed into the
model for a call — the prompt, the conversation so far, and tool results — as opposed to **output**, the tokens the
model writes back.

`python3 tmp/transcript-digest.py buckets d33c5e58-ec5b-470a-a888-fc492e9e1d1c --minutes 3`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/d33c5e58-ec5b-470a-a888-fc492e9e1d1c.jsonl
LINES     581
START     2026-09-01T23:10:59.019000+00:00
END       2026-09-02T00:05:34.474000+00:00
WALL      0:54:35.455000  (54.6 min)

BUCKETS of 3 min
WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS
09-01 23:10-23:13    55     32    21,536     6,410,278       282,939  Readx17, mcp__dungeonmaster__discoverx6, Bashx2, ToolSearchx1
09-01 23:13-23:16    27     15    19,103     5,448,514        37,288  Readx10, mcp__dungeonmaster__discoverx4, mcp__dungeonmaster__get-project-inventoryx1
09-01 23:16-23:19    18      9    37,397     4,431,702        32,212  Bashx3, mcp__dungeonmaster__discoverx2, Readx2, Writex1
09-01 23:19-23:22     8      5    13,043     2,119,221        28,251  Agentx5
09-01 23:22-23:25     8      0     2,026     2,202,282             0  
09-01 23:25-23:28     4      1    14,043     1,126,682         8,102  Agentx1
09-01 23:28-23:31     6      2     6,935     1,870,312           185  ToolSearchx1, mcp__dungeonmaster__modify-questx1
09-01 23:31-23:34     4      1    10,506     1,358,685         7,641  Agentx1
09-01 23:34-23:37     4      1    17,166     1,385,612        10,453  Agentx1
09-01 23:46-23:49    21     11    12,194     7,550,742        29,083  Readx6, Bashx5
09-01 23:49-23:52    14      7    14,643     5,240,028        25,744  Bashx4, Agentx1, ToolSearchx1, mcp__dungeonmaster__get-qa-checklistx1
09-01 23:55-23:58     5      1    13,831     1,946,965         3,869  Readx1
09-01 23:58-00:01     5      2     8,394     1,979,380           722  mcp__dungeonmaster__modify-questx1, Agentx1
09-02 00:04-00:07     7      2     3,089     2,797,317           430  Bashx1, mcp__dungeonmaster__signal-backx1
```

Three bucket windows are missing entirely — `23:37–23:46`, `23:52–23:55`, `00:01–00:04` — 15 minutes in which the
operator made no API call at all. Those are phases 9, 12 and 14 above.

### Sub-agent spend, attributed to the bucket each sub-agent STARTED in

| Bucket | Agents started | Sub-agent OUT | Sub-agent CTX-IN | Which |
|---|---:|---:|---:|---|
| 23:16-23:19 | 1 | 9,868 | 4,841,733 | `a35d65`(d1) |
| 23:19-23:22 | 8 | 108,089 | 26,024,551 | `acb5e3`(d1), `a995a9`(d1), `a8ff85`(d2), `abf424`(d1), `a27a31`(d1), `ae1ef8`(d1), `a31dd9`(d2), `aa5fe9`(d2) |
| 23:22-23:25 | 3 | 3,027 | 427,738 | `a51840`(d2), `a13136`(d2), `a7c675`(d2) |
| 23:25-23:28 | 1 | 15,265 | 5,891,083 | `a325e3`(d1) |
| 23:31-23:34 | 1 | 18,197 | 3,569,812 | `ad8dd7`(d1) |
| 23:34-23:37 | 1 | 43,223 | 6,438,022 | `a29585`(d1) |
| 23:37-23:40 | 2 | 8,141 | 1,347,864 | `a78c63`(d2), `acc7f6`(d2) |
| 23:40-23:43 | 1 | 2,138 | 200,504 | `a6194b`(d2) |
| 23:49-23:52 | 3 | 34,799 | 6,880,947 | `a9c585`(d1), `a30762`(d2), `ab1850`(d2) |
| 23:58-00:01 | 1 | 23,149 | 12,908,941 | `a40392`(d1, the reviewer) |
| **TOTAL** | **22** | **265,896** | **68,531,195** | |

Depth split: depth-1 (11 agents) `out=239,444  ctx-in=64,501,925`; depth-2 (11 agents)
`out=26,452  ctx-in=4,029,270`. The eleven grandchildren are 50% of the agent head-count but only 5.9% of the
context-in.

### Totals, cache_read stated separately from cache_creation

`cache_read` is context served from Anthropic's prompt cache — the model already saw this exact text in an earlier
call, so it costs far less to re-serve. `cache_creation` is the opposite: new context, not yet in the cache, being
written to it for the first time. Both count toward context-in; the table below reports the two separately.

| | input (uncached) | cache_read | cache_creation | TOTAL ctx-in | output | of which thinking |
|---|---:|---:|---:|---:|---:|---:|
| Main session (186 API responses) | 372 | 45,069,876 | 797,472 | 45,867,720 | 193,906 | 94,197 |
| Sub-agents, 22 (751 API responses) | 1,502 | 63,537,175 | 4,992,518 | 68,531,195 | 265,896 | 140,627 |
| **Grand total (937 responses)** | **1,874** | **108,607,051** | **5,789,990** | **114,398,915** | **459,802** | **234,824** |

Arithmetic: 45,069,876 + 63,537,175 = 108,607,051 cache_read. 797,472 + 4,992,518 = 5,789,990 cache_creation.
372 + 1,502 = 1,874 uncached input. 45,867,720 + 68,531,195 = 114,398,915 ctx-in.
193,906 + 265,896 = 459,802 output. Tool-result bytes fed into the main session: 466,919.

---

## 3. Was the prompt fit for the work?

The prompt this session actually received (`result d33c5e58-… get-agent-prompt`, 34,132 chars / 33,701 B in the
transcript) comes from one template, `codeweaverPromptStatics.prompt.template`. That template has
`spilledToolResultStatics.markdown` inserted at step 1, and its `$ARGUMENTS` placeholder replaced by exactly four
lines:

```
## Operation Context

Quest ID: 1be07040-b9ec-476c-a439-0b4fbb0123cd
Work Item ID: 6ab40559-0e08-4547-9af4-b0cfb34c342b
Operation Item ID: 83c9f2ce-f00c-4dda-bf2d-594e5dacc074
Your operation item: [codeweaver] Codeweaver: build this slice — package: server · flow: render-images-in-transcript
```

Nothing else was substituted. That matches what `workItemToPromptTransformer` is supposed to do exactly: it adds
four parts, plus three extras that only apply to certain roles — none of which apply to codeweaver. Outside that
one block, the template and the rendered prompt are byte-identical.

### 3.1 What the prompt got right, with the behaviour it produced

**Step 2's standards-first ordering.** The prompt says: `Load the repo's standards before you read anything else:
get-architecture, get-syntax-rules and get-testing-patterns. None takes an argument. They override your training
defaults, which are wrong for this codebase — read code first and you will copy patterns you cannot yet judge.` The
session obeyed this literally. It made the three calls at `0.7m`, `0.7m`, and `0.8m`, all before its first `Read`
call at `0.9m`.

**Step 3's map format.** The prompt says: `A map, not an essay. One line per file.` The session's written map
(`.quest-plans/83c9f2ce-f00c-4dda-bf2d-594e5dacc074-map.md`, 67 lines, 6,890 B) follows the template shape exactly —
`GROUP 1..4`, `PROVES`, `TRAPS`. But it orders the groups by dependency, not by flow shape the way the prompt
demands (`Contracts and statics first, then the code that reads them, then the code that calls that`). In this map:
statics, transformer, guard, and adapter form group 1; broker is group 2; responder is group 3; flow and mount form
group 4.

**Step 5's "read the diff, not the files."** At `37.7m` the operator ran `git status --porcelain`, `git diff
--stat`, then two scoped `git diff -- <paths>` calls, and opened only 7 files at the seams between packages. It
never re-read the whole package. This found one real defect: at `38.7m` it said: `"One real defect in the flow
test: the over-long path case uses 'a'.repeat(4097) with no leading slash, so the absoluteness rule refuses it
first and the length rule is never exercised."` That is exactly the kind of bug step 5's question 3 is meant to
catch.

**The `[BUILD]` rule, which forbids the operator from building or running ward itself.** The operator's 15 Bash
calls include zero `npm run build` and zero `npm run ward` calls. It followed this rule completely. Its sub-agents
did not — see section 5.1.

**The rule `Never sign one your test proves against a MOCK.`** The operator's own report at `54.6m` says:
`"#check-bytes-match-disk is settled against a real file, not a mocked read: a harness method writes bytes to a
temp dir and the test compares the HTTP response body to them byte for byte."` The map put the harness seeder in
group 1 for exactly this reason — so nothing would sign off the byte-equality unit against a stub.

### 3.2 The scope block: accurate, but built by hand from a render that is missing one field

The session's scope came from the `get-quest` flow slice (24,004 B), and that scope was accurate. Checking the
render against `quest.json` confirms 7 nodes carry `◀ YOURS`, holding 18 server-attributed observables
(`#request-replay` 1, `#replay-user-line` 1, `#deliver-entry` 1, `#request-bytes` 9, `#image-not-served` 3,
`#serve-bytes` 3), plus the terminal `#image-not-served` and the two labelled edges off `#file-readable` — 21 units
in total. The session signed exactly 21.

That render has two measurable defects.

**(a) The operator's first count was wrong, and the render never corrected it.** At `0.7m` it said: `"Seven nodes
are mine, with 15 observables, two labelled edges off #file-readable, one terminal (#image-not-served)"` — 15, not
18. The render prints a per-node tally by package (`{web ● 1, server ● 9}`) but never a total for the whole
**cell** (the full set of nodes and units one role owns in one flow), so nothing in the tool output contradicted
the undercount. The operator corrected itself only at `47.9m`, saying: `"All 18 of my units have their evidence."`
That self-correction cost no time here, but nothing in the tooling would have caught the error if the operator had
not caught it itself.

**(b) The render shows edge labels but not edge ids, and signing off an edge needs the id.** The payload reads:

```
[#file-readable] {server} Readable file at that path with an image extension? (decision) ◀ YOURS
  →"missing, unreadable or not an image" [#image-not-served]
  →"readable image" [#serve-bytes]
```

The real ids behind those two branches are `not-readable` and `readable`. The prompt's step 1 tells the session
`a labelled edge is a UNIT your track can sign`, and its **Recording what you claim** section shows the format
`edges: [ { id: '<the labelled edge id>', … } ]` — but the only artefact the prompt points it to is this render, and
the render never prints an id. The session said exactly this at `39.2m`: `"I need the edge ids to sign the two
branch units — the flow render prints labels but not ids."` It then spent three `ls` probes hunting for the quest
file on disk, before concluding at `39.6m`: `"The quest file sits outside my sandbox, and guessing an edge id would
append a phantom unit."` This cost **1.4 minutes** (`39.1m` then `40.5m`) plus one extra MCP round-trip.

### 3.3 The one tool the session needed and the prompt does not name

The tool `get-qa-checklist` appears nowhere in the codeweaver prompt — not in its `YOURS` tool block, not in any
step. The session invented the call itself to recover the edge ids: first `39.6m CALL
ToolSearch(query=select:mcp__dungeonmaster__get-qa-checklist)`, then `39.6m CALL
mcp__dungeonmaster__get-qa-checklist(questId=1be07040-…)`. This is the clearest case in this work item of the
session inventing something missing from the prompt — and the invention was correct: the checklist is the only
surface that carries unit ids. But the session called it with `questId` alone, without the `operationItemId` that
`operationSignoffScopeTransformer` uses to narrow the result. That is why the answer came back wider than the
session's own cell: at `40.5m` it said `"The checklist is authoritative and wider than the flow render: 25 units
await my sign-off."`

### 3.4 `codeweaverScopeBlockTransformer` is written, tested, and never called

The file `packages/orchestrator/src/transformers/codeweaver-scope-block/codeweaver-scope-block-transformer.ts`
renders two blocks that would otherwise leave the session to work them out by hand: SEAMS (`each line is a node you
share with another package, and where that package's half of it stands`) and SHARED HOMES. A repo-wide scan for
`codeweaverScopeBlock` finds exactly two files: the transformer itself and its own colocated test.
`workItemToPromptTransformer` does not import it. Its last commit, `4419d0d43 2026-08-30 Prompt refactors AGAIN`,
landed two days before this quest ran — so at run time it was written but not wired in, and the rendered prompt
confirms that: the Operation Context block ends at the fourth id line, with no SEAMS or SHARED HOMES section.

That missing block is exactly what step 5's question 4 asks the session to answer without any data to work from:
`Does the seam hold? Where your flow's node names another package too, your half has to match what that package's
half expects. If that half is not built yet, write down what you assumed.` Six of the session's seven owned nodes
are shared with other packages (`#request-bytes` `{web, server}`, `#serve-bytes` `{web, server}`, `#request-replay`
`{web, server}`, `#replay-user-line` `{server, orchestrator}`, `#deliver-entry` `{orchestrator, server, web}`,
`#image-not-served` `{web, server}`). The seam block would have told the session directly that the orchestrator's
half was already complete and web's half was not built yet — instead, the session spent its `40.5m` turn reasoning
that out for itself.

### 3.5 What the prompt said and the session did NOT do

**`git log --name-only -n 10`.** The prompt prints this exact command. The session instead ran
`git log --name-only -n 4` (`0.9m CALL Bash(command=git log --name-only -n 4 …)`) — a shorter window than
instructed. This made no real difference here, since the previous server commit `4b8d98710` still fell inside the
last 4 commits, but the deviation from the instruction is real.

**Reading what the previous cell had already done.** The prompt's reason for the git-log step is `A file that is
already there is a change you do not have to brief.` The previous server codeweaver (`edaf4b8a`, work item [5])
wrote its own map to `.quest-plans/c47eeba9-87ce-42e7-822e-ef7ef9ccfe08-map.md`. Scanning this session's whole
transcript for a `Read` whose `file_path` contains `.quest-plans` finds none — the session never opened that file.
Its only exposure to it was seeing the filename inside the `git log --name-only -n 4` result. The prompt never
tells a session to read a prior map, so this is a gap in the prompt, not a case of the session disobeying it.
Measured cost was small regardless — see section 5.6.

---

## 4. What went well

1. **Zero rework rounds, zero retries, one commit.** `retryCount: 0`. The reviewer passed the work on its first
   look: `BUILD: green`, `WARD: … green (lint PASS 22/22, typecheck PASS 6171/6171 across 12 packages, unit PASS
   9/9, integration PASS 20/20)`. The final commit, `cffccb204`, held 23 files, 1,101 insertions, and 0 deletions.
   Why: the operator wrote the map before dispatching anything, then checked the finished diff against that map at
   step 5 — at `38.7m` it said: `"The diff matches the map — nothing extra, nothing missing."`

2. **Not one `sleep`, poll, or re-run across 37 minutes of waiting.** The session hit eleven task-notification gaps
   (from 107 seconds to 665 seconds), and every single time the operator ended its turn on a plain message instead
   of polling — for example `17.9m say: "The broker is out. Two agents running now"` and `26.6m say: "The last
   group is out."` Why: the `[HELPERS]` rule names this exact failure mode and forbids the workaround outright.
   Following it cost 0 tokens. For comparison, the `<dungeonmaster-wardDiscipline>` guidance records 815 seconds
   lost to exactly this mistake on a different quest (a7520e60); this session lost none.

3. **The operator never re-read a file it had already read for no reason.** It made 36 `Read` calls over 34
   distinct paths, and both repeats were legitimate. It read `server-init-responder.test.ts` at `4.62m offset=1
   limit=62`, then again at `4.72m offset=941 limit=80` — two different windows of the same file. It read
   `images-flow.integration.test.ts` in full at `38.14m`, then again at `47.56m offset=100 limit=100` after a
   sub-agent fixed a bug in it, so the line numbers it copied into 15 sign-offs were the final, correct ones. That
   second read is why its evidence includes lines like:
   `"packages/server/src/flows/images/images-flow.integration.test.ts:155-175 — a fresh Hono app mounts
   ImagesFlow() the way ServerFlow does and then registers app.get('*', …)"`.

4. **It refused to sign what it could not see, and that refusal turned out to be right.** At `40.5m` the checklist
   handed the operator 25 units. Seven of them belonged to web, and the flow render had collapsed their text down
   to a bare count. At `40.5m` the operator said: `"I'll sign the 18 that are mine and leave those seven for web's
   cell rather than marking them unconfirmable, which would hide them from the session that can actually confirm
   them."`
   `quest.json` now shows all seven of those units (`check-image-get-issued`, `check-img-actually-loads`,
   `check-replay-frame-sent`, `check-entry-lands-in-transcript`, `check-broken-thumbnail-in-place`,
   `check-broken-thumbnail-fixed-size`, `check-other-images-unaffected`) carrying `codeweaverSignoff.workItemId =
   71c1fd22…` — the web codeweaver, work item [9]. Why: the prompt's rules `Sign only observables printed in full`
   and `Never sign one you did not settle`.

5. **It reported an honest weakness instead of an overstated success.** At `47.5m` it said: `"The fixer landed with
   an honest caveat: at HTTP level the OS's own name-length limit also refuses that path, so the black-box test
   can't isolate which layer said no."` It repeated that caveat in its final signal, too. This cost nothing, and it
   means `#check-overlong-path-404`'s sign-off honestly states what it does not prove.

6. **The briefs the operator wrote for its sub-agents match the template and carry the required warnings.** All ten
   code briefs use the section headers `FILES / DO / MUST BE TRUE / TRAPS / DO NOT TOUCH / READ FIRST / PROVE /
   RETURN` word for word, all were dispatched with `model: "sonnet"` and `subagent_type: "general-purpose"`, and
   every one lists both required `[GIT FORMS]` refusals under `TRAPS`, as instructed. Each `MUST BE TRUE` section
   quotes its observable word for word — for example, brief #5 reads: `#check-server-relays-replay: "the server
   calls replayChatHistory exactly once for that sessionId"`. The reviewer went out on its own at `48.9m`, with the
   exact four-line brief the prompt prescribes for it.

7. **The reviewer was cheap and correct.** It ran for 5.3 minutes of wall-clock time: one `npm run build` at its
   `3.6m`, one `npm run ward -- --staged` at its `4.1m` — both green on the first try — then `git add -A`, a
   commit, and a bare `git push` at `5.1m`. It made 27 `Read` calls over 26 distinct files, meaning it opened every
   file the pass produced in full, exactly as its step 4 requires.

---

## 5. What agents did that they should not have

### 5.1 Nine forbidden `npm run build` runs by code-writing sub-agents, three of them concurrent

Eight of the eleven depth-1 sub-agents ran a full, repo-wide build — something they were explicitly told not to do.
Every brief's `PROVE` block reads `no npm run build · no run-ward MCP tool · no commit · never widen the ward`, and
the operator's own `[BUILD]` rule explains why: `tsc writes one shared dist/ per package and ward's typecheck is
tsc -b, which builds — so a second builder hands every sibling session type errors on correct code.`

| Parent elapsed | Clock | Agent | Command, verbatim |
|---:|---|---|---|
| 10.7m | 23:21:43 | `agent-acb5e37eff892f346` | `npm run build 2>&1 \| tail -40` |
| 11.0m | 23:21:59 | `agent-abf4245ad71a7250c` | `npm run build 2>&1 \| tail -40` |
| 11.9m | 23:22:54 | `agent-ae1ef845edab97bf2` | `npm run build` |
| 15.7m | 23:26:42 | `agent-a995a941d06bcccc2` | `npm run build 2>&1 \| tail -n 50` |
| 16.7m | 23:27:38 | `agent-a27a312c5341195a1` | `npm run build 2>&1 \| tail -60` |
| 20.3m | 23:31:18 | `agent-a325e3864e93ac438` | `npm run build` |
| 34.2m | 23:45:13 | `agent-a29585323b34abdad` | `npm run build 2>&1 \| tail -40` |
| 42.8m | 23:53:48 | `agent-a9c5859dc182ad5c5` | `npm run build 2>&1 \| tail -50` |
| 46.4m | 23:57:20 | `agent-a9c5859dc182ad5c5` | `npm run build 2>&1 \| tail -20` (second time) |
| 52.4m | 00:03:24 | `agent-a40392bf657347096` | `npm run build` — **legitimate**, the reviewer |

Three of those builds ran within 71 seconds of each other (23:21:43, 23:21:59, 23:22:54). The predicted symptom
showed up directly in the operator's own routing: at `12.7m` it said `"It flagged a transient type error in the
harness file another agent was mid-write on — a race artifact I'll confirm once that agent returns,"` and cleared
it at `12.8m` with `"That also settles the type error the adapter agent saw — it was reading the file mid-write."`
This is the exact false type error the `[BUILD]` rule was written to prevent, and it still cost the operator two
routing turns to reason past.

Seven of the nine builds also piped their output (`2>&1 | tail -N`), which the `<dungeonmaster-wardDiscipline>`
guidance forbids, because piping the command throws away its exit code.

**Prompt status: forbidden.** Cost: nine repo-wide `tsc -b` runs, at roughly 25–30 seconds each by the reviewer's
own timing (`3.6m CALL Bash(npm run build)` to `4.0m say: "Build is green"` is 27 seconds) — about 4 minutes of
wasted compute, plus 2 operator routing turns spent chasing a phantom error, plus the ongoing risk of a false
failure.

### 5.2 The standards triple was re-served twelve times — 1,044,835 duplicate bytes

Every session that loaded the repo's three standards documents received the exact same bytes, every time:
`get-architecture` (19,056 B), `get-syntax-rules` (24,528 B), and `get-testing-patterns` (51,401 B), totaling
**94,985 B** per session. Twelve sessions loaded them: the operator, plus eleven sub-agents (`a27a312c5341195a1`,
`a29585323b34abdad`, `a325e3864e93ac438`, `a35d6584fbe4e4d1a`, `a40392bf657347096`, `a995a941d06bcccc2`,
`a9c5859dc182ad5c5`, `abf4245ad71a7250c`, `acb5e37eff892f346`, `ad8dd7f78bb7051ed`, `ae1ef845edab97bf2`).

The math: 94,985 times 12 = **1,139,820 B** served in total. Since the first read already paid the cost, 94,985 times 11 =
**1,044,835 B** of that was pure duplication. At roughly 4 characters per token, that is about 285,000 tokens
served and about **261,200 tokens** read a second, third, fourth… time with nothing new in them. For scale: 94,985
B alone is 27.3% of everything the operator read during its whole 8.4-minute orientation phase (0.0m–8.4m, 348,117
B total).

**Prompt status: required.** The operator's own step 2 demands these three calls, and every brief's `READ FIRST`
block demands them again (`READ FIRST\n  get-architecture, get-syntax-rules, get-testing-patterns`). This is the
largest single duplicated payload in the whole work item, and it happens because the prompt requires it — not by
accident.

### 5.3 Eight sessions hit the native-search PreToolUse block because the brief never warned them

The brief template requires the `[GIT FORMS]` warning in every `TRAPS` section, and the operator included it every
time. But the repo also blocks `grep`/`find`/`rg` for every session, and nothing in the brief warned the sub-agents
about that separate rule.

| Parent elapsed | Agent | Blocked call |
|---:|---|---|
| 7.2m | **the parent itself** | `find … /packages/server/test -type f \| head -50` |
| 10.7m | `agent-acb5e37eff892f346` | `grep -n "absolute-file-path" …` |
| 11.1m | `agent-a31dd93510ddf2059` (d2) | `find …` |
| 13.1m | `agent-a518409ae05c25b1a` (d2) | `find …` |
| 25.0m | `agent-ad8dd7f78bb7051ed` | `find packages/server/src/responders/image -type f` |
| 27.2m | `agent-a78c632de7c44f6c4` (d2) | `find …` |
| 49.3m | `agent-a40392bf657347096` | `find packages/server/src/adapters/fs/read-file-bytes …` |
| 52.4m | `agent-a40392bf657347096` | `grep -n "pasted-image" …` |

Each blocked call returns the same 500-byte hook error and costs one wasted turn — eight wasted turns in total.
**Prompt status: mentioned, but not required inside the briefs.** The `[WALL]` rule tells the operator itself that
`Read with an offset, discover and python3 -c do what grep, find and sed would` — and the operator tripped the
block anyway, once. Nothing carries that warning into a sub-agent's `TRAPS` section.

### 5.4 The prompt's own recommended escape hatch is itself denied for sub-agents

At `13.8m`, `agent-a995a941d06bcccc2` ran `python3 -c "path = 'packages/server/src/guards/…'; with
open(path,'rb')…"` and got back `Permission to use Bash has been denied.` The `[WALL]` rule names `python3 -c` as
one of three substitutes for a denied search. It works for the operator — a different session, `edaf4b8a`, used it
three times at its `5.68–5.78m` — but it was denied here to at least this one sub-agent. A prompt that recommends a
tool its reader cannot actually use has built its own wall. **Prompt status: recommended.** Cost: one turn.

### 5.5 Two sub-agents independently invented the same denied `cp` backup and both lost a turn

- At `17.9m`, `agent-a27a312c5341195a1` ran `cp packages/server/src/responders/server/init/server-init-responder.test.ts /tmp/server-init-responder.test.ts.bak && echo backed…` and was denied.
- At `36.4m`, `agent-a29585323b34abdad` ran `cp packages/server/src/flows/images/images-flow.ts /tmp/images-flow.ts.bak` and was denied.

Both agents were trying to satisfy the brief's `RETURN` requirement to report `the red I watched before the code
made it pass` — they wanted a safe way to break a test, watch it fail, then restore it. The brief demands that
watched failure but names no safe way to produce one. **Prompt status: the evidence is required; the method for
getting it is not specified.** Cost: 2 turns, and in one case, a test the agent gave up watching fail at all — at
`25.9m` the operator noted: `"Responder back pass — though it skipped watching a red, which its reviewer will
grade."`

### 5.6 Cross-session duplication with the previous server codeweaver was real but SMALL

This analysis specifically checked whether this session re-derived work that `edaf4b8a` (work item [5], the other
server codeweaver, which ran for 87.6 min) had already established. Pulling the full orientation phase from both
sessions gives:

| | prior `edaf4b8a` (0.0–8.3m) | this `d33c5e58` (0.0–8.3m) |
|---|---:|---:|
| Read calls | 26 | 29 |
| discover calls | 9 | 11 |
| standards / map MCP calls | 4 | 5 (`get-project-map` is new here) |

**Exact overlaps — 5 of 45 exploration actions (11.1%):**

| Item | prior elapsed | this elapsed |
|---|---:|---:|
| `get-architecture({})` | 0.60m | 0.71m |
| `get-syntax-rules({})` | 0.60m | 0.73m |
| `get-testing-patterns({})` | 0.61m | 0.77m |
| `get-project-inventory(packageName=server)` | 1.25m | 3.65m |
| Read `packages/shared/src/statics/pasted-image/pasted-image-statics.ts` | 0.74m | 0.93m |

Zero `discover` globs or greps matched between the two sessions. Only one `Read` out of 29 was a repeat (3.4%). The
two cells genuinely touched different parts of the server package: the earlier one worked in
`contracts/message-body`, `responders/quest/*`, and `adapters/fs/write-file`; this one worked in `flows/`,
`responders/server/init`, `adapters/fs/read-file`, and `statics/api-routes`.

The duplicated slice cost 94,985 B of standards, plus 3,984 B of project-inventory, plus 3,860 B of
pasted-image-statics — **102,829 B** of the orientation phase's 348,117 B total, or **29.5%**. But 94,985 B of that
is the mandated standards triple already counted in section 5.2. Strip that out, and the duplication this session
could actually have avoided by reading a prior session's work is only 7,844 B — well under 1 minute.

Summing the three buckets that cover the orientation phase (0.0–8.3m: 23:10-23:13, 23:13-23:16, 23:16-23:19) gives
its total cost: `21,536 + 19,103 + 37,397 = 78,036` output tokens, and `6,410,278 + 5,448,514 + 4,431,702 =
16,290,494` context-in tokens. That is 40.2% of the whole session's output and 35.5% of its context-in, spent on
just 14.7% of its wall-clock time.

**Verdict: the theory that "the second server codeweaver re-derived the first one's context" is not supported.**
The prior map was never read — no `.quest-plans` Read appears anywhere in the transcript — but reading it would
have saved very little. The two cells overlap in only 5 actions out of 45, and 4 of those 5 are calls the prompt
orders every session to make regardless. The expensive duplication in this work item happens inside a single
session (section 5.2), not between sessions.

### 5.7 Eleven grandchildren at spawn depth 2, four of them re-discovering the fleet's own output

The prompt authorizes the operator to dispatch explorer sub-agents (`Dispatch explorer sub-agents where the package
is too large to read yourself`). It says nothing about letting a code-writing sub-agent spawn its own sub-agents.
Four of them did exactly that, 11 times in total:

- `agent-a8ff85c334f81e44e` @ 23:20:45 — "Find absoluteFilePathContract definition"
- `agent-a30762dabaa00e1af` @ 23:50:26 — "Find ImageServeResponder and absoluteFilePathContract" — the same
  contract, found again 30 minutes later by a different branch of the same fleet.
- `agent-acc7f6c306b497bee` @ 23:39:20 — "Find pastedImageStatics.serveRoutePath value and check images dir usage"
  — a value the operator itself had already read at its `0.9m` and had already quoted, word for word, into brief
  #1.
- `agent-a6194b5b48a5721c6` @ 23:41:47 — "Check image content type transformer and broker for extension-based
  detection" — re-reading two files that sibling agents in the same fleet had written 20 minutes earlier.
- `agent-ab1850a934166e238` @ 23:52:15 — "Find imageServeBroker implementation" — the same kind of repeat.

`agent-a78c632de7c44f6c4` spent six consecutive denied calls in 30 seconds (`27.2m`–`27.6m`) trying to reach Hono's
own source code inside `node_modules`: `cat` denied, `Read` denied three times, `find` blocked, `ls` denied.

In total, the 11 grandchildren cost 121 turns, `out=26,452`, `ctx-in=4,029,270`. Their wall-clock time is
mostly hidden inside their parent sub-agents' own durations. But one parent, `agent-a29585323b34abdad` — the
10.9-minute agent that owns the session's single largest idle gap (section 1, phase 9, 11.1 min) — spawned three
of these grandchildren itself.

**Prompt status: not addressed at all.** The reviewer is explicitly told `You start no sub-agent` (`[TURN END]`);
code-writing sub-agents are told nothing on this point.

### 5.8 Repeated identical ward invocations inside single sub-agents

- `agent-acb5e37eff892f346` ran the identical command
  `npm run ward -- --only unit -- packages/server/src/transformers/image-content-type/image-content-type-transformer.test.ts 2>&1 | tail -80`
  three times in a row.
- `agent-a35d6584fbe4e4d1a` ran `npm run ward -- --only unit -- packages/server/src/statics/api-routes/api-routes-statics.test.ts` twice, identically.
- `agent-a9c5859dc182ad5c5` ran `npm run ward -- --only integration --onlyTests "over-long path" -- …` twice,
  identically, plus `npm run ward -- detail 1788306900438-217f`, plus two builds — 7 ward or build calls total for
  a fix to one file.
- `agent-a27a312c5341195a1` ran ward five times, including one call with `--only lint,test` and one with
  `--only lint,unit` on the same file.

The brief's `PROVE` block names exactly one command to run. **Prompt status: not forbidden, but not licensed
either.** Cost: at least 5 redundant scoped ward runs.

### 5.9 Brief length correlates with the slowest and most expensive agent

The ten code briefs, in the order the operator dispatched them, ran 3,759 / 4,644 / 5,897 / 4,909 / 6,065 / 3,636 /
7,429 / 6,970 / **9,740** / 4,969 characters, plus a 247-character reviewer brief. The prompt itself warns:
`Write a FILE MAP and terse instructions. Never prose. A paragraph of explanation is a paragraph the sub-agent
skims — long briefs are how adherence dies.` The 9,740-character brief — the longest by far — went to
`agent-a29585323b34abdad` ("Images flow and mount"), and that agent turned out to be the fleet's most expensive
member on every measure: 10.9 minutes, `out=43,223`, `ctx-in=6,438,022`, 3 grandchildren spawned, 2 PreToolUse lint
rejections, 1 denied `cp`, and 1 forbidden build. It also owns the session's 665-second idle gap. That is a
correlation from one sample, not proof — but it is exactly the sample the prompt's own warning predicts.

### 5.10 Five PreToolUse edit-lint rejections, each costing a whole-file re-write

Six PreToolUse rejections hit five agents: `agent-a995a941d06bcccc2` at `11.1m`, `agent-abf4245ad71a7250c` at
`10.4m`, `agent-ae1ef845edab97bf2` at `11.2m`, `agent-a325e3864e93ac438` at `19.1m`, and
`agent-a29585323b34abdad` twice, at `31.6m` and `32.5m`. Two rules account for all six hits:
`Line 1:1 - Metadata comment must appear before all import statements` (4 hits) and `Raw string type is not
allowed. Use the discover endpoint to search for existing contracts` (2 hits). The hook returns `Your edit was NOT
applied — the file is unchanged. Re-submit the ENTIRE corrected edit, not a surgical follow-up`, so each rejection
costs a full re-write of the file, not a small fix. **Prompt status: the brief's `TRAPS` block is exactly where
these two rules belong, and the operator did put some repo-specific traps there** (`exactOptionalPropertyTypes`,
`ban-silent-catch`, `No magic numbers`) **— just not these two**, because the map's own `TRAPS` section did not
carry them either.

---

## 6. Suggested fixes

These are ranked by their estimated saving per codeweaver work item.

**1. Serve the standards triple once per work item, not once per session.**
File: `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts` (the brief template's
`READ FIRST` block), plus the MCP responders behind `get-architecture` / `get-syntax-rules` / `get-testing-patterns`.
Concrete edit: replace the brief template's

```
READ FIRST
  get-architecture, get-syntax-rules, get-testing-patterns
```

with a directive telling the operator to write the standards to a single shared file once — or have the three MCP
tools accept a `folderTypes: [...]` filter, so each tool returns only the slice a given brief's own paths actually
touch (a guard brief needs `guards-constraints`, not all 51,401 B of testing patterns). *Saving: up to 1,044,835 B,
about 261,000 tokens, per codeweaver work item (section 5.2). Across the eight codeweaver items on this quest, that
is about 2.1 million tokens.* This is the highest-value fix here, by an order of magnitude.

**2. Print edge and terminal ids in the `get-quest` flow render.**
File: the flow-render transformer behind `get-quest` (the render whose key reads
`→"label"  labeled edge (decision branch — each one is a unit)`). Concrete edit: render
`→"label" [#edge-id] [#target-node]` instead of `→"label" [#target-node]`, and put the terminal node's id where the
`(terminal)` marker currently sits. *Saving: 1.4 minutes plus one MCP round-trip per codeweaver item that owns a
branch (section 3.2b).* Right now, every unit the codeweaver signs off on an edge needs a second tool call just to
find out its name.

**3. Wire `codeweaverScopeBlockTransformer` into `workItemToPromptTransformer`.**
File: `packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts`. Concrete
edit: after the four `parts` lines, when `workItem.role === 'codeweaver'`, push
`...codeweaverScopeBlockTransformer({ quest, operationItem: linkedOperation })`. This transformer is already
written and tested, but has zero call sites (section 3.4). Six of this cell's seven nodes were seams with other
packages, and the session had to work out their status by hand at `40.5m`. *Saving: roughly 1–2 minutes of seam
reasoning per item, and — more importantly — it removes the guesswork from step 5's question 4.* The purpose block
on `work-item-to-prompt-transformer.ts` will also need updating: it currently claims the block carries "FOUR IDS …
nothing else," and `packages/orchestrator/CLAUDE.md` repeats that same claim.

**4. Enforce `no npm run build`, don't just ask for it.**
File: `packages/hooks` — add a `PreToolUse` Bash guard that refuses `npm run build` whenever the session is a
depth-1 sub-agent of a codeweaver (or, more simply, refuses it for any session whose brief was not the reviewer's).
The instruction not to build already sits in three places — the operator's `[BUILD]` rule, the brief template's
`PROVE` line, and the `READ FIRST` framing — and it was violated 9 times out of 9 opportunities to violate it
(section 5.1). *Saving: about 4 minutes of wasted compute per item, plus the routing turns spent chasing the
phantom type error.* If a hook feels too blunt, the cheaper fix is to move `no npm run build` out of the `PROVE`
block's trailing sentence and give it its own line at the top of `TRAPS`, where the operator already puts the
warnings its sub-agents actually follow.

**5. Put the native-search block into the brief template's mandatory `TRAPS`.**
File: `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`. Concrete edit: next to
`Put both [GIT FORMS] refusals in every brief's TRAPS, substitute included`, add a third mandatory trap:
`Bash grep / find / rg and the native Glob/Grep/Search tools are refused in this repo — use discover, or Read with
an offset.` *Saving: 8 wasted turns per item (section 5.3).* The same edit belongs in
`codeweaver-reviewer-statics.ts` — its own reviewer tripped the same block twice, at its own `3.5m` and `0.4m`.

**6. Name a non-destructive way to watch a test fail, in the brief template.**
File: `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, the `RETURN` block's
requirement for `the red I watched before the code made it pass`. Concrete edit: add one line to `TRAPS`:
`To watch a red: edit the assertion in place with Edit, run the scoped ward, then Edit it back. Never cp/mv a file
to /tmp — that form is denied.` Two agents independently invented the same denied `cp` trick (section 5.5), and one
of them gave up and skipped watching the failure entirely. *Saving: 2 turns per item, plus one sign-off that would
otherwise rest on an unverified assertion.*

**7. Forbid grandchildren in the brief template.**
File: `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, brief template `TRAPS`.
Concrete edit: add the line `You start no sub-agent of your own — anything you need to look up, look up yourself`
(the same sentence `codeweaver-reviewer-statics.ts` already carries under `[TURN END]`). The eleven grandchildren in
this item burned `ctx-in=4,029,270`, and four of them re-discovered artefacts the fleet had already produced
(section 5.7). *Saving: about 4 million context-in tokens per item, and it removes the depth-2 layer's contribution
to the session's longest idle gap.*

**8. Cap brief length in the template.**
File: same file. Concrete edit: after `long briefs are how adherence dies`, add an actual number:
`A brief over ~5,000 characters is a brief to split into two changes.` The one 9,740-character brief in this item
produced the fleet's slowest, most expensive, most rule-breaking agent (section 5.9). *Saving: not quantifiable
from a single sample — but the prompt already names this mechanism, it just never gives it a threshold to enforce
against.*

**9. Tell the codeweaver about `get-qa-checklist`, and to pass `operationItemId`.**
File: `packages/orchestrator/src/statics/codeweaver-prompt/codeweaver-prompt-statics.ts`, the `YOURS` tool block.
Concrete edit: add the line
`get-qa-checklist({ questId, operationItemId })   the ids of every unit in your cell — call it at step 8 if you
need one the flow render did not print`. This session invented the call itself, and, with no guidance, called it
with `questId` alone — getting back a 25-unit list where only 18 were actually its own (section 3.3). *Saving: the
1.4 minutes from section 3.2b overlaps with fix 2 above; the distinct extra saving here is the `40.5m` turn spent
reasoning out whose the other 7 units were.* Fix 2 is the better long-term answer; this one is the fallback for
when the render itself cannot carry ids.

**10. Say `-n 10` explicitly, or drop the number entirely.**
File: same file, step 2. The prompt prints `git log --name-only -n 10`; the session ran it with `-n 4` instead
(section 3.5). Either state clearly that this count is a minimum, not a target, or accept that a literal number
printed in a prompt will sometimes be treated as a suggestion rather than a rule. *Saving: none measured in this
item — it is listed because it is a small divergence between what the prompt says and what the session did, and
that kind of drift tends to cost more elsewhere.*

---

## 7. Raw figures appendix

### `python3 tmp/transcript-digest.py summary d33c5e58-ec5b-470a-a888-fc492e9e1d1c`

```
FILE      /home/brutus-home/.claude/projects/-home-brutus-home-projects-codex-of-consentient-craft-worktrees-try-2-paste-images-into-web-chat-render-inline-s-1be07040/d33c5e58-ec5b-470a-a888-fc492e9e1d1c.jsonl
LINES     581
START     2026-09-01T23:10:59.019000+00:00
END       2026-09-02T00:05:34.474000+00:00
WALL      0:54:35.455000  (54.6 min)
TYPES     {'queue-operation': 24, 'attachment': 195, 'user': 101, 'last-prompt': 38, 'atis-latch': 37, 'assistant': 186}
MODELS    {'claude-opus-5': 186}

TOKENS (this transcript only, excludes subagents)
  assistant API responses : 186
  input (uncached)        : 372
  cache_read              : 45,069,876
  cache_creation          : 797,472
  output                  : 193,906
  of which thinking       : 94,197
  TOTAL context-in        : 45,867,720

TOOL CALLS (89 total)
     36  Read
     15  Bash
     12  mcp__dungeonmaster__discover
     11  Agent
      3  ToolSearch
      2  mcp__dungeonmaster__modify-quest
      1  mcp__dungeonmaster__get-agent-prompt
      1  mcp__dungeonmaster__get-quest
      1  mcp__dungeonmaster__get-architecture
      1  mcp__dungeonmaster__get-syntax-rules
      1  mcp__dungeonmaster__get-testing-patterns
      1  mcp__dungeonmaster__get-project-map
      1  mcp__dungeonmaster__get-project-inventory
      1  Write
      1  mcp__dungeonmaster__get-qa-checklist
      1  mcp__dungeonmaster__signal-back

TOOL RESULT BYTES fed back: 466,919

SUBAGENTS 22  (run `subagents` subcommand for the roster)
```

### `python3 tmp/transcript-digest.py subagents d33c5e58-ec5b-470a-a888-fc492e9e1d1c`

```
09-01 23:19:36  +   3.8m  agent-a35d6584fbe4e4d1a  general-purpose/sonnet  turns= 55 out=9,868 ctx-in=4,841,733
           desc: Add images route to statics
           tools: {'ToolSearch': 3, 'Read': 6, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 2, 'Edit': 7, 'Bash': 6}
09-01 23:19:59  +   5.8m  agent-acb5e37eff892f346  general-purpose/sonnet  turns= 60 out=19,725 ctx-in=6,223,236
           desc: Image content-type transformer
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 3, 'Read': 11, 'Write': 2, 'Bash': 7, 'Edit': 8}
09-01 23:20:24  +   7.5m  agent-a995a941d06bcccc2  general-purpose/sonnet  turns= 68 out=27,942 ctx-in=5,749,320
           desc: Servable image path guard
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 11, 'Agent': 2, 'Write': 7, 'Edit': 6, 'Bash': 6}
09-01 23:20:45  +   0.5m  agent-a8ff85c334f81e44e  general-purpose/None  turns= 13 out=1,995 ctx-in=505,824
           desc: Find absoluteFilePathContract definition
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 4, 'Read': 3}
09-01 23:20:48  +   2.8m  agent-abf4245ad71a7250c  general-purpose/sonnet  turns= 36 out=9,103 ctx-in=2,429,065
           desc: Binary file read adapter
           tools: {'ToolSearch': 1, 'Read': 7, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Bash': 5, 'mcp__dungeonmaster__discover': 1, 'Write': 4}
09-01 23:21:16  +   9.1m  agent-a27a312c5341195a1  general-purpose/sonnet  turns= 52 out=35,842 ctx-in=8,620,168
           desc: Replay relay tests
           tools: {'ToolSearch': 1, 'Read': 7, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Agent': 4, 'Edit': 8, 'Bash': 8}
09-01 23:21:35  +   2.2m  agent-ae1ef845edab97bf2  general-purpose/sonnet  turns= 21 out=5,586 ctx-in=1,399,038
           desc: Harness image file seeder
           tools: {'ToolSearch': 1, 'Read': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Edit': 4, 'Bash': 2}
09-01 23:21:53  +   1.0m  agent-a31dd93510ddf2059  Explore/None  turns= 15 out=5,272 ctx-in=459,619
           desc: Look up chatOutputPayloadContract and stubs
           tools: {'ToolSearch': 1, 'Bash': 2, 'mcp__dungeonmaster__discover': 3, 'Read': 4}
09-01 23:22:19  +   0.7m  agent-aa5fe92033845efbd  general-purpose/None  turns= 16 out=2,624 ctx-in=638,281
           desc: Find guard folder param-optional lint rule pattern
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 5, 'Read': 3}
09-01 23:23:52  +   0.4m  agent-a518409ae05c25b1a  Explore/None  turns=  9 out=1,389 ctx-in=231,352
           desc: Check registerMock unaddressed-call semantics
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 1, 'Bash': 1, 'Read': 1}
09-01 23:24:34  +   0.2m  agent-a13136d97aeb2b06c  Explore/None  turns=  4 out=572 ctx-in=87,652
           desc: Read monitor-session-filter-chat-output-transformer
           tools: {'Read': 1}
09-01 23:25:39  +   0.3m  agent-a7c675d6151c7ee25  Explore/None  turns=  5 out=1,066 ctx-in=108,734
           desc: Check parseChatOutputEntriesTransformer and chatEntriesExtractQuestIdTransformer behavior on malformed entries
           tools: {'Read': 2}
09-01 23:28:52  +   3.3m  agent-a325e3864e93ac438  general-purpose/sonnet  turns= 62 out=15,265 ctx-in=5,891,083
           desc: Image serve broker
           tools: {'Read': 12, 'ToolSearch': 2, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 14, 'Write': 4, 'Bash': 3}
09-01 23:32:55  +   3.4m  agent-ad8dd7f78bb7051ed  general-purpose/sonnet  turns= 47 out=18,197 ctx-in=3,569,812
           desc: Image serve responder
           tools: {'ToolSearch': 2, 'Read': 18, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__discover': 2, 'Write': 3, 'Bash': 5}
09-01 23:37:33  +  10.9m  agent-a29585323b34abdad  general-purpose/sonnet  turns= 62 out=43,223 ctx-in=6,438,022
           desc: Images flow and mount
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Read': 11, 'Agent': 3, 'Write': 4, 'Edit': 4, 'Bash': 9}
09-01 23:38:00  +   1.1m  agent-a78c632de7c44f6c4  general-purpose/None  turns= 29 out=6,919 ctx-in=1,173,407
           desc: Check Hono query decoding and ServerFlow mount order
           tools: {'Bash': 3, 'Read': 4, 'ToolSearch': 1, 'mcp__dungeonmaster__discover': 9}
09-01 23:39:20  +   0.3m  agent-acc7f6c306b497bee  general-purpose/None  turns=  5 out=1,222 ctx-in=174,457
           desc: Find pastedImageStatics.serveRoutePath value and check images dir usage
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 1, 'Read': 1}
09-01 23:41:47  +   0.4m  agent-a6194b5b48a5721c6  general-purpose/None  turns=  6 out=2,138 ctx-in=200,504
           desc: Check image content type transformer and broker for extension-based detection
           tools: {'Read': 3}
09-01 23:50:05  +   8.3m  agent-a9c5859dc182ad5c5  general-purpose/sonnet  turns= 68 out=31,544 ctx-in=6,431,507
           desc: Fix overlong and header proofs
           tools: {'ToolSearch': 1, 'Read': 8, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'Agent': 2, 'Edit': 6, 'Bash': 16, 'Write': 1}
09-01 23:50:26  +   0.4m  agent-a30762dabaa00e1af  general-purpose/None  turns=  9 out=2,096 ctx-in=293,593
           desc: Find ImageServeResponder and absoluteFilePathContract
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 3, 'Read': 2}
09-01 23:52:15  +   0.3m  agent-ab1850a934166e238  general-purpose/None  turns=  5 out=1,159 ctx-in=155,847
           desc: Find imageServeBroker implementation
           tools: {'ToolSearch': 1, 'mcp__dungeonmaster__discover': 1, 'Read': 1}
09-01 23:59:50  +   5.3m  agent-a40392bf657347096  general-purpose/sonnet  turns=104 out=23,149 ctx-in=12,908,941
           desc: Codeweaver reviewer
           tools: {'ToolSearch': 3, 'mcp__dungeonmaster__get-agent-prompt': 1, 'mcp__dungeonmaster__get-architecture': 1, 'mcp__dungeonmaster__get-syntax-rules': 1, 'mcp__dungeonmaster__get-testing-patterns': 1, 'mcp__dungeonmaster__get-quest': 1, 'Bash': 15, 'mcp__dungeonmaster__discover': 15, 'Read': 27}

SUBAGENT TOTALS  agents=22 turns=751 output=265,896 context-in=68,531,195
```

### Sub-agent fleet token split (script over all 22 `subagents/*.jsonl`)

```
SUBAGENT FLEET (22 agents)
  assistant API responses : 751
  input (uncached)        : 1,502
  cache_read              : 63,537,175
  cache_creation          : 4,992,518
  output                  : 265,896
  of which thinking       : 140,627
  TOTAL context-in        : 68,531,195

PARENT + FLEET
  cache_read   : 108,607,051
  cache_create : 5,789,990
  input        : 1,874
  output       : 459,802
  ctx-in total : 114,398,915
```

### Standards-payload bytes per session (script over `message.content[].tool_result` by originating tool name)

```
agent                        arch   syntax  testing       sum
agent-a27a312c5341195a1    19,056   24,528   51,401    94,985
agent-a29585323b34abdad    19,056   24,528   51,401    94,985
agent-a325e3864e93ac438    19,056   24,528   51,401    94,985
agent-a35d6584fbe4e4d1a    19,056   24,528   51,401    94,985
agent-a40392bf657347096    19,056   24,528   51,401    94,985
agent-a995a941d06bcccc2    19,056   24,528   51,401    94,985
agent-a9c5859dc182ad5c5    19,056   24,528   51,401    94,985
agent-abf4245ad71a7250c    19,056   24,528   51,401    94,985
agent-acb5e37eff892f346    19,056   24,528   51,401    94,985
agent-ad8dd7f78bb7051ed    19,056   24,528   51,401    94,985
agent-ae1ef845edab97bf2    19,056   24,528   51,401    94,985
SUBAGENT TOTAL            209,616  269,808  565,411 1,044,835
agents that loaded standards: 11
PARENT (from toolUseResult):  19,056   24,528   51,401    94,985
FLEET GRAND TOTAL: 1,139,820
```

### Parent orientation-phase tool-result bytes (0.0m–8.4m), per call

```
 elapsed     bytes  tool / target
    0.13       667  ToolSearch
    0.28    33,701  get-agent-prompt (codeweaver, workItemId 6ab40559-…)
    0.32    24,004  get-quest (flowId=render-images-in-transcript, packageName=server)
    0.71    19,056  get-architecture {}
    0.73    24,528  get-syntax-rules {}
    0.77    51,401  get-testing-patterns {}
    0.83     1,745  Bash git log --oneline -n 20
    0.86    24,663  Bash git log --name-only -n 4
    0.93     3,860  Read pasted-image-statics.ts
    0.99     2,387  Read api-routes-statics.ts
    1.04     9,692  get-project-map {"packages": ["server"]}
    1.50    44,904  Read server-init-responder.ts            <- largest single Read
    3.65     3,984  get-project-inventory server
    7.21       816  Bash find … (BLOCKED by PreToolUse hook)
    7.28     9,923  Read server-app.harness.ts
    8.08     6,890  Write .quest-plans/83c9f2ce-…-map.md
    … (39 further calls, all < 11,000 B)

ORIENTATION TOOL-RESULT BYTES (0.0-8.4m): 348,117
```

### Sign-off outcome (script over `quest.json`, filtering `codeweaverSignoff.workItemId == 6ab40559-…`)

```
observables signed: 18  terminals: 1  edges: 2  total: 21
verdicts: {'confirmed': 21}
```

### Commit `cffccb204` return block (from `git show`)

```
codeweaver-reviewer: server's half of render-images-in-transcript — /api/images serve route, replay-relay coverage

VERDICT:   Right. New /api/images route serves pasted-image bytes with hardened path validation and never 403s;
           three new server-init-responder tests prove the pre-existing WS replay-relay path already carries
           entries with replay:true intact.
FIXES:     none — the sub-agent output was correct as delivered.
FINDINGS:  none.
BUILD:     green
WARD:      npm run ward -- --staged — green (lint PASS 22/22 files, typecheck PASS 6171/6171 files across 12
           packages, unit PASS 9/9 files, integration PASS 20/20 files, e2e skip — server is not e2e-eligible)
NEXT:      pass

 23 files changed, 1101 insertions(+)
```

### Cross-session comparison source

The prior server codeweaver session, `edaf4b8a-fbc5-45c6-8c52-7ffce709c6f6` — its `summary` output:

```
WALL      1:27:38.621000  (87.6 min)
MODELS    {'claude-opus-5': 168}
  assistant API responses : 168
  input (uncached)        : 336
  cache_read              : 40,239,119
  cache_creation          : 1,150,961
  output                  : 397,064
  of which thinking       : 107,296
  TOTAL context-in        : 41,390,416
TOOL RESULT BYTES fed back: 554,166
SUBAGENTS 27
```

Two files carry every number quoted above, in full, without being reproduced here:
`/home/brutus-home/projects/codex-of-consentient-craft/worktrees/try-2-paste-images-into-web-chat-render-inline-s-1be07040/.quest-plans/83c9f2ce-f00c-4dda-bf2d-594e5dacc074-map.md` (the map, 67 lines), and
`/home/brutus-home/projects/codex-of-consentient-craft/.dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests/1be07040-b9ec-476c-a439-0b4fbb0123cd/quest.json` (the ledger and sign-offs).
