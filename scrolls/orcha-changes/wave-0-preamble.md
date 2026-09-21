# Wave 0 — how to run this

**Point a session at this file first, whatever layer it is on.** It says who does what, who is allowed
to do the dangerous things, and how a session hands its work to the next one.

**The work is one PR, in one worktree.** Nothing here merges on its own, and no wave is "shipped". The
wave boundaries exist so a session can hold its brief, and so layer 0 has somewhere to commit.

---

## Where this runs — a worktree, carved one way

**Layer 0 carves it, once, before wave 1:**

```
mcp__dungeonmaster__create-worktree({ name: "<something>" })
```

**That is the ONLY tool that makes one.** It returns a path under `worktrees/` with `node_modules`
hardlinked, the compiled output copied across, and every link verified to resolve inside the tree.
Claude Code's own worktree command is refused by a hook naming this tool, and a hand-assembled
`git worktree add` gives you a tree where nothing resolves — no `node_modules`, no binaries, so ward
cannot start.

**Every session in this epic runs inside that path**, layer 0 included. Nobody works in the root
checkout.

**Three traps, and the second one reaches outside the worktree:**

| | |
|---|---|
| **build nothing in a fresh worktree** | `create-worktree` already did it — `git worktree add` checks out TRACKED files and `dist` is gitignored, so the tool `cp -a`s the main checkout's `dist` across at carve time |
| **never `npm rebuild` inside one** | `node_modules` is hardlinked, so a package's files and the main checkout's are the same bytes. node-gyp writes its output THROUGH the existing path, so the build lands in the main checkout and every other worktree at once. Rebuild in the main checkout instead; every worktree gets the result through that same hardlink. Installing is safe — npm replaces a package directory, which breaks the link cleanly |
| **a worktree is NOT hermetic** | it sits under the main checkout, so node's walk-up escapes it. Move a package's compiled output aside inside the worktree and resolution keeps climbing until it finds the main checkout's copy — a typecheck that should have failed then passes, and reads back as "the premise was wrong" |

**Wave 3 has a build in it, and it is layer 0's.** `get-quest-work` and `quest-work` are MCP tools, and
MCP executes compiled output — this worktree's own `packages/mcp/dist/src/index.js`. So after wave 3
lands, **layer 0 builds `@dungeonmaster/mcp` and reconnects the MCP** before anything can exercise
those tools. Nothing else in the epic needs a build: ward, the dev server and every test read
TypeScript source.

---

## Read in this order

1. **This file.** Your layer, and the rules that bind it.
2. **`README.md`** — the wave table, the dependency order, and the four open questions.
3. **Your own `wave-N-*.md`** — your briefs, with their `OWNS` and `ASSERT` lines.
4. **Nothing else.** Each wave file carries the whole spec its briefs need — the config blocks, the
   contracts, the step maps, the rules. `../orchestrator-step-engine-plan.md` is the design argument
   behind them and is not required reading for doing the work.

**The session snippets arrive on their own** — `<dungeonmaster-ward>`, `<dungeonmaster-discover>`,
`<dungeonmaster-buildDiscipline>` and the rest are already in your context at session start, in this
repo and in every sub-agent. Do not go looking for them, and do not re-derive what they say.

---

## The three layers

| Layer | Who | Owns | Writes code? |
|---|---|---|---|
| **0 — the conductor** | one long-lived session | the worktree, the PR, wave gating, **every commit**, every ward gate, every build, the four open questions | no |
| **1 — a wave orchestrator** | one per wave | its wave file: decide, brief, verify, hand back | **no** |
| **2 — a worker** | dispatched by a wave orchestrator | 1–3 files, one brief, dispatches nothing | yes |

**Layer 1 orchestrates. It does not do the work.** Every brief in every wave file goes to a layer-2
worker, including the three in wave 1 and the four in wave 4. A wave orchestrator that opens an editor
has become a worker with a to-do list, and the second layer of orchestration is gone for that wave —
along with the thing it was for, which is that somebody is reading returns instead of producing them.

**Only layer 2 writes production code.** That is the line, and it is the same line the epic itself is
built on: the orchestrator runs the loop, the dispatched session does the work.

**Depth stops at layer 2.** A worker launches nothing. Three layers is already one more than this repo
has ever run, and the reason the limit is hard is that a layer-3 agent's failure reaches layer 0 as
"something went wrong somewhere", which is not a report anyone can act on.

---

## The dangerous things, and who may do them

**These are not style preferences. Each one has a measured failure behind it.**

| | Only layer 0 | Why |
|---|---|---|
| **commit** | yes | **nobody else commits, at any layer.** One worktree has one `index.lock`. Twelve concurrent sub-agent commits were measured here: three landed, nine died on `Unable to create index.lock`. One committer makes that impossible rather than unlikely |
| **run a build** | yes | a build rewrites every package's compiled output with no lock. One run lost seven ward integration tests to `TS2307` because a package's `dist` was absent for a few seconds. Only wave 3's MCP build is needed at all |
| **run a git-scoped or bare ward** | yes | `--committed`, `--uncommitted` and a bare run all grade work you did not do, and whoever runs one owns every failure in it |
| **answer an open question** | yes | a session that answers one itself has invented a design decision. Send it up and wait |

Everyone else: **ward your own paths only.** `npm run ward -- -- <the files you touched>`, repo-relative,
no `./`, every path a FILE rather than a directory. Give it `timeout: 600000`.

**This is why nothing below layer 0 runs git at all** — not a write, not a read. It is a cleaner rule
than "no git writes", easier to check, and it is the same rule the epic itself lands on for its own
sessions.

---

## The per-wave gate — layer 0's loop

**A wave is not finished when its orchestrator hands back. It is finished when it is committed.**

```
1  wave orchestrator hands back            "wave N — done"
2  npm run ward -- --committed --uncommitted    ← layer 0, timeout 600000
3  red?  → back to the wave orchestrator with the failure, scoped. Not to a worker
4  green? → git commit, one commit per wave
5  next wave
```

...and after the last wave, **once**:

```
npm run ward
```

**Why the git-scoped pair per wave, and a bare run only at the end.** `--committed` and `--uncommitted`
combine to cover the whole branch — everything landed so far plus everything still in the tree — so
each wave's gate is also a regression pass over every wave before it. That is the check that catches
wave 5 breaking something wave 2 built. The bare run is wider still and belongs at the end, because it
grades packages nobody in this epic touched.

**Neither flag accepts `--only`, `--onlyTests` or `-- <files>`.** If you need to narrow a red, re-run it
as `npm run ward -- --only <types> -- <files>` and iterate there; the pair is the gate, not the
debugging tool.

**One thing that reads as green and is not.** A 0-file git scope runs NOTHING — ward says so and exits
0. If a wave produced no tracked change, that pair is **empty, not green**, and it has proved nothing
about the wave. Read what it says, not just the exit code.

**Run it ONCE per tree state.** A fix makes a new state, so re-running after one is fine. Re-running
the same checks hoping for a different answer is not.

---

## The rule that makes parallel work possible at all

**The tree is GREEN when you stop.**

The next session has to be able to tell its own breakage from what it inherited, and it cannot if the
tree was already red. A brief that cannot leave the tree compiling is not a brief — it is half of one,
and its other half is named in the same wave file.

If you cannot get there, **say so and stop**. Do not hand on a red tree with a note. The next session
will spend its whole context finding out whether your red is its problem.

---

## Layer 1: how you fan out, not whether

**You always fan out. What varies is the batch and how hard you verify between batches.** Two shapes,
and picking the wrong one is the commonest way a wave goes bad.

| Shape | Use it when | How it runs |
|---|---|---|
| **Serial, reviewed** | the briefs share a design decision, or each hands the next a compiling tree | **decide the shared thing FIRST and put it in the brief.** Dispatch one worker. Read its return, verify it against the brief. Only then dispatch the next |
| **Parallel batches** | the briefs are file-disjoint and mechanical | dispatch a batch, wait, read every return, verify. Then the next |

| Wave | Shape | Why |
|---|---|---|
| 1 shapes | serial, reviewed | the graph grammar is ONE decision. You make it, then three workers build to it — three workers each deciding part of it will diverge |
| 2 engine | serial, reviewed | the router's four-question order is the heart. Nothing else matters if it is wrong, so you read every line that comes back |
| 3 tools | serial, reviewed | `get-quest-work`'s return shape is a design call 19 prompts depend on. Settle it, brief it, then 3B and 3C can go out together |
| 4 cutover | serial, reviewed | four briefs that hand each other a compiling tree. A batch here leaves nobody holding the middle state |
| 5 sign-offs | parallel, 1–3 files per worker | the one genuinely mechanical wave |
| 6 prompts | parallel, one prompt per worker | each is budgeted against a 50,000-char ceiling. Two in one session means one gets the leftover context |
| 7 UI | parallel, with 7A dispatched alone and read closely | 7A has a silent failure mode, so its return needs more from you than the others |
| 8 independent | parallel | small and unrelated to each other |

**"Serial, reviewed" is still orchestration — it is the harder kind.** The design decision is yours to
make and yours to write into the brief. What you must not do is make it by writing the code and letting
the shape fall out; then nothing is briefed, the next worker cannot read what you decided, and you are
the only place the reasoning lives.

**Why 1–3 files, and not "a sensible batch".** A worker handed a large batch optimises for throughput
over correctness and invents evasions — extracting violations to variables, `[\s\S]*` wildcards — that
pass lint without improving anything. That is measured in this repo, not a worry.

**Use `model: "sonnet"` for waves 5, 6 and 8.** Apply-the-contract work does not need opus, and these
waves spawn dozens of workers. Opus is for you and for the reviewer and planner prompt workers.

**Read every return against the brief, never at face value.** A worker reporting green on work it did
not do is the failure this repo has been bitten by, repeatedly and by name. Open what it says it wrote.
If its `DONE` line was checkable, check it — that is why the briefs are written that way.

---

## What every worker brief must carry

Copy the brief out of the wave file and add these four lines. A worker that has to go and find its own
scope will widen it.

```
OWNS      <the exact paths, from the wave file. Nobody else has these open>
NO TOUCH  <what its neighbours own right now>
DONE      <the condition, checkable rather than claimable>
WARD      npm run ward -- -- <its own paths>, and nothing wider
```

**`OWNS` is the load-bearing line.** Two workers in one batch sharing a file is the collision this
whole structure exists to prevent.

**For an assertion fix, tell the worker to run the test FIRST, capture the real output, and assert on
that.** Do not let it write an expected value from the code it is about to change.

---

## The 30-minute tick

**Every orchestrator runs on a 30-minute loop — layer 0, and every layer-1 wave orchestrator.** Layer 1
always has workers out, so this always applies to you. A layer-2 worker sets no loop; it does its
brief and returns.

```
/loop 30m <your standing instruction>
```

**The tick is a supervision tick.** It has three jobs, in this order:

1. **Which workers came back?** Read what they returned. Do not take a claim at face value — a worker
   reporting green on work it did not do is the failure this repo has been bitten by.
2. **Is anything stuck?** A worker that hangs never notifies, and that is the case the loop exists for.
   The harness re-invokes you when a tracked agent finishes, so the loop is the fallback, not the
   primary signal.
3. **Dispatch the next batch, or report up.**

**Keeping the context cache warm is a side effect worth having, not the reason.** Thirty minutes sits
inside the prompt-cache window either way, so the tick costs nothing it does not already earn as
supervision. Do not schedule extra wakeups on top of it.

**Set `noop: true` on a tick where nothing changed** — you checked, nothing came back, nothing is
stuck. Consecutive quiet ticks collapse in the terminal instead of scrolling.

---

## Ending a turn without losing work

**Two different mechanics, and getting them backwards strands work silently.**

| Still running when you stop | What happens |
|---|---|
| a background **command** — a ward, a build, an install | **it dies part-way**, your report reads clean, and nothing tells you. Never end your turn with one running |
| a dispatched **agent** | fine. Its notification re-enters you. This is why the 30-minute loop is a fallback rather than a poll |

**Never `sleep` a fixed duration and assume something finished.** Never `tail` an output file. Never
re-run a command to find out whether the first one did. Wait on the condition — a bounded loop that
returns the moment its marker appears.

---

## Handing a wave back to layer 0

**You hand back an UNCOMMITTED tree.** Layer 0 gates it and commits it; you never do either.

```
WAVE <n> — <done | blocked>

LANDED     <brief id> — <one line on what is now true>
           <brief id> — …

NOT DONE   <brief id> — <what is left, and what you learned>

PATHS      <every path this wave touched, for layer 0's commit message>

TREE       npm run ward -- -- <those paths> → exit 0
           (the --committed --uncommitted gate is layer 0's, not yours)

BLOCKED ON <an open question, quoted, and which brief it stops>
```

**`PATHS` is not bookkeeping.** Layer 0 writes one commit per wave and has no other route to what the
wave actually changed, because it did not do the work and does not run `git status` looking for
surprises.

**Never paste a file back.** Layer 0 can `Read` the path and pay once; a quoted file is paid three
times. Cite `path:line` with the line verbatim, and let them open it.

**`NOTHING FOUND` is a real answer.** If a brief turns out to be already done, or to describe code that
does not exist, say that and name where you looked. Do not build it anyway.

---

## Before you write any code — layer 2 only

**Layers 0 and 1 write no production code, so this section is for a worker.** A wave orchestrator that
finds itself calling `get-folder-detail` is about to do a worker's job.

**Once per session:**

- `get-architecture` — folder types, import rules, how to write the file itself
- `get-testing-patterns` — the proxy pattern, mock boundaries, assertion rules

**Once per folder type you write into:** `get-folder-detail({ folderType })`.

These override your training data. The defaults for a TypeScript project are wrong here — no
`export default`, no `jest.mock`, no `beforeEach`, no `toEqual`, branded Zod returns, purpose JSDoc
above the imports. Call them, read them, then plan.

**And search in the right order.** `get-project-map` or `get-project-inventory` for the package, THEN
`discover` with a glob into what those named, THEN `Read`. Reach for `discover` first and you are
guessing a path — a wrong glob returns nothing, which reads exactly like a package that holds nothing.
That is how a session decides code is missing and writes a second copy of it.
