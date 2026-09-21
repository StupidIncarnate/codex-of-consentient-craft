# Wave 0 — how to run this

**Point a session at this file first, whatever layer it is on.** It says who does what, who is allowed
to do the dangerous things, and how a session hands its work to the next one.

**The work is one PR.** Nothing here merges on its own, and no wave is "shipped". The wave boundaries
exist so a session can hold its brief.

---

## Read in this order

1. **This file.** Your layer, and the rules that bind it.
2. **`README.md`** — the wave table, the dependency order, and the four open questions.
3. **Your own `wave-N-*.md`** — your briefs, with their `OWNS` and `ASSERT` lines.
4. **`../orchestrator-step-engine-plan.md`, the sections your brief cites — and nothing wider.** It is
   3,500 lines. A brief names `§3b` or `§9d` because that is the part you need. Reading the whole
   thing spends the context your work needs.

**The session snippets arrive on their own** — `<dungeonmaster-ward>`, `<dungeonmaster-discover>`,
`<dungeonmaster-buildDiscipline>` and the rest are already in your context at session start, in this
repo and in every sub-agent. Do not go looking for them, and do not re-derive what they say.

---

## The three layers

| Layer | Who | Owns |
|---|---|---|
| **0 — the conductor** | one long-lived session | the PR, the branch, wave gating, every bare ward, every build, the four open questions |
| **1 — a wave agent** | one per wave | its wave file. It either does the briefs itself or fans them out |
| **2 — a worker** | dispatched by a wave agent | 1–3 files, one brief, no dispatching of its own |

**Depth stops at layer 2.** A worker launches nothing. Three layers is already one more than this repo
has ever run, and the reason the limit is hard is that a layer-3 agent's failure reaches layer 0 as
"something went wrong somewhere", which is not a report anyone can act on.

---

## The dangerous things, and who may do them

**These are not style preferences. Each one has a measured failure behind it.**

| | Only layer 0 | Why |
|---|---|---|
| **run a build** | yes | a build rewrites every package's compiled output with no lock. One run lost seven ward integration tests to `TS2307` because a package's `dist` was absent for a few seconds. **Nothing in this epic needs one** — ward and the dev server read TypeScript source |
| **run a bare `npm run ward`** | yes | whoever runs one owns every failure in it, including ones they did not cause. A wave agent running one inherits the whole repo |
| **answer an open question** | yes | a session that answers one itself has invented a design decision. Send it up and wait |
| **commit** | layer 0 and layer 1 | **a layer-2 worker NEVER commits.** Twelve concurrent sub-agent commits in one worktree were measured here: three landed, nine died on `Unable to create index.lock` |

Everyone else: **ward your own paths only.** `npm run ward -- -- <the files you touched>`, repo-relative,
no `./`, every path a FILE rather than a directory. Give it `timeout: 600000`.

---

## The rule that makes parallel work possible at all

**The tree is GREEN when you stop.**

The next session has to be able to tell its own breakage from what it inherited, and it cannot if the
tree was already red. A brief that cannot leave the tree compiling is not a brief — it is half of one,
and its other half is named in the same wave file.

If you cannot get there, **say so and stop**. Do not hand on a red tree with a note. The next session
will spend its whole context finding out whether your red is its problem.

---

## Layer 1: do it yourself, or fan out?

**Fan out when the briefs are file-disjoint AND mechanical. Do it yourself when they share a design
decision.**

| Wave | Call | Why |
|---|---|---|
| 1 shapes | **yourself**, all three | the graph grammar is one decision and the whole epic is written against it |
| 2 engine | **yourself** | the router's four-question order is the heart. Nothing else matters if it is wrong |
| 3 tools | **mostly yourself**; 3C can go out | `get-quest-work`'s return shape is a design call that 19 prompts depend on |
| 4 cutover | **yourself**, serially | four briefs that hand each other a compiling tree |
| 5 sign-offs | **fan out, 1–3 files per worker** | the one genuinely mechanical wave |
| 6 prompts | **fan out, one prompt per worker** | each is budgeted against a 50,000-char ceiling. Two in one session means one gets the leftover context |
| 7 UI | **fan out**, except 7A | 7A has a silent failure mode and deserves your own attention |
| 8 independent | **fan out** | small and unrelated to each other |

**Why 1–3 files, and not "a sensible batch".** An agent handed a large batch optimises for throughput
over correctness and invents evasions — extracting violations to variables, `[\s\S]*` wildcards — that
pass lint without improving anything. That is measured in this repo, not a worry.

**Use `model: "sonnet"` for waves 5, 6 and 8.** Apply-the-contract work does not need opus, and these
waves can spawn dozens of workers. Reserve opus for yourself and for the reviewer and planner prompts.

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

**Every orchestrator — layer 0, and any layer-1 agent that has fanned out — runs on a 30-minute loop.**

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

```
WAVE <n> — <done | blocked>

LANDED     <brief id> — <the commit sha, one line on what is now true>
           <brief id> — …

NOT DONE   <brief id> — <what is left, and what you learned>

TREE       npm run ward -- -- <paths> → exit 0
           (a bare run is layer 0's, not yours)

BLOCKED ON <an open question, quoted, and which brief it stops>
```

**Never paste a file back.** Layer 0 can `Read` the path and pay once; a quoted file is paid three
times. Cite `path:line` with the line verbatim, and let them open it.

**`NOTHING FOUND` is a real answer.** If a brief turns out to be already done, or to describe code that
does not exist, say that and name where you looked. Do not build it anyway.

---

## Before you write any code

**Once per session, including every worker:**

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
