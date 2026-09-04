# Delivery-chain audit — quest 1be07040

**Quest** `1be07040-b9ec-476c-a439-0b4fbb0123cd` · "Try 2: Paste images into web chat" · three flows,
sixteen work items, **paused inside item [17]**.

Phase 1 asked how each session ran. This document answers a different question:

> **Did the approved flow map turn into the delivery it promised, and if not, where did the chain
> break? Is a middle step missing between an approved flow map and a delivered flow?**

A **flow map** is the approved diagram of one user journey: a node for each step or surface, and a
labelled edge between the nodes. Three roles turn that map into working software. The **codeweaver**
writes one package's product code and the unit tests that prove it. The **flowrider** writes the
integration and e2e suites for a whole flow. The **siegemaster** hand-drives the finished flow the
way a user would. §A gives the full table.

**Sources.** Three per-flow chain audits, run independently against the same brief, plus the Phase 1
compilation. Citations are `[chain paste §S]`, `[chain send §S]`, `[chain render §S]` for the three
chain reports, `[report NN §S]` for a Phase 1 forensic, and `[post-mortem §S]` for
`00-QUEST-1be07040-POST-MORTEM.md`. Claims I verified myself against repo source for this
compilation are marked **[verified at source]** with a file and a line.

**Scope caveat, stated once and honoured at every figure it touches.** The quest is **paused, not
finished.** Siegemaster ran to completion on `paste-image-into-composer` only. On
`send-message-with-images` it ran 655 minutes and was cut off mid-loop by an API outage. On
`render-images-in-transcript` **no siegemaster work item was ever dispatched.** So every unsigned
siegemaster unit on flows 2 and 3 is **not yet attempted**. None of them is a role failure, and
nothing below scores them as one.

**The answer, up front.** Nothing is missing *between the approved flow map and the first codeweaver
brief.* All three reports found operators inventing artifacts there. Every one of those artifacts
turns out to already exist in the repo — it just never reaches the session. There are four of them:
a transformer with no caller, an id the renderer withholds, a tool the prompt does not name, and a
field the scope derivation does not read. The genuinely missing steps sit at the **other** end of the
chain, and §G states them.

---

## A. The chain as designed, and the chain as run

### The design

The repo owner approves flow maps and observables at Gate #2. An **observable** is one named,
checkable statement about behaviour — "the thumbnail sits where the token was". Three roles then turn
that approved artifact into a delivered flow. Each role signs its own independent field on every
verification unit, and that field is its **sign-off track**.

| Role | Owes | Fan-out | Sign-off field |
|---|---|---|---|
| codeweaver | one package's half of one flow — product code plus the unit tests that prove it | one item per **(package, flow) cell** — one package's work on one flow | `codeweaverSignoff` |
| flowrider | the integration and e2e suites that prove that flow **as a whole** | one item per **flow** | `flowriderSignoff` |
| siegemaster | hand-drives the flow as a user would and finds the glaring gaps | one item per **flow** | `siegemasterSignoff` |

A verification unit is one of four things: a terminal node with no outgoing edge, a labelled edge, an
embedded observable, or one of seven **off-map probe families**. The off-map families are standard
breakage classes the system adds to every flow automatically, because no flow map can draw them. Each
sign-off is `{ verdict: confirmed | unconfirmable, evidence, toSettle?, workItemId, at }`.

`signoffTrackEligibilityStatics.byTrack` decides which units a track is measured over. It applies
five exclusions, and all five are data rather than code
**[verified at source: `packages/orchestrator/src/statics/signoff-track-eligibility/signoff-track-eligibility-statics.ts:120-186`;
`packages/orchestrator/src/transformers/signoff-flow-outstanding/signoff-flow-outstanding-transformer.ts:65-91`]**.

### The chain as run

| Flow | codeweaver cells | flowrider | siegemaster | Chain wall clock |
|---|---|---|---|---|
| `paste-image-into-composer` (20 nodes, all `web`) | **1** — [7], 219.9 min | [13], 183.8 min | **[16], 553.4 min — complete** | **957.1 min** [chain paste §8] |
| `send-message-with-images` (18 nodes; web 11 · server 6 · orch 4 · shared 1) | **4** — [2] 24.3, [3] 41.3, [5] 87.7, [8] 174.6 min | [14], 249.3 min | **[17], 655.0 min — CUT OFF mid-loop** | **1,232.07 min** [chain send §8] |
| `render-images-in-transcript` (19 nodes; web 16 · server 7 · orch 3) | **3** — [4] 88.4, [6] 54.6, [9] 109.0 min | [15], 219.0 min | **never dispatched** | **471.0 min** [chain render §8] |

One more gate sits outside those three rows. Items [10]–[12] are a shared `ward(changed)`, then
spiritmender, then `ward pt 2` sequence — ward is this repo's combined lint, typecheck and test gate, and
the spiritmender is the role that repairs what ward reddens. That gate cost **31.3 min**. It failed
on work landed by items [7] and [8], and root-caused to contracts from items [2] and [7]
[post-mortem §E27, §H7].

**Quest total: 2,691.8 min = 44 h 51.8 min; 318 sub-agents; 18,374,912 output tokens;
5,150,449,667 context-in tokens** [post-mortem §B]. Context-in counts every token read into the model
across all of a session's calls. The per-flow sums above come from the chain reports. They differ
from the post-mortem's per-item figures by under half a minute per item, which is rounding. Nothing
below averages the two sets together.

**Three flows, three different chain shapes — and that is what makes this quest a usable experiment.**
Flow 1 is the control: all three roles ran to signal. Flow 3 is the negative control: the
hand-driven role never came. Flow 2 is the stress case: the widest fan-out, four cells, and a
siegemaster cut off mid-loop.

---

## B. Coverage — every flow, every track, owed / signed / unsigned

A **denominator** is the number of units a role owes a verdict on — the bottom half of "signed /
owed". All three chain reports independently checked their denominators against
`get-qa-checklist({ questId, operationItemId })`, one call per role. An `operationItemId` names one
numbered work item on the quest, such as `[7]` or `[16]`. The corrected
`scripts/quest-forensics.py coverage` reproduces those figures exactly. These are the figures;
nothing below recomputes them.

**Read the unsigned column with its two meanings kept apart.** Two unsigned units are **genuinely
missing** — real gaps, and no session on this quest can ever close them. The other 79 are **not yet
attempted** — the quest paused before those sessions ran. No role failed on any of the 79.

| Flow | codeweaver | flowrider | siegemaster |
|---|---|---|---|
| `paste-image-into-composer` | 58 owed / **58 signed** / 0 unsigned | 58 / **58** / 0 | 74 / **74** / 0 |
| `send-message-with-images` | 61 / **60** / **1 genuinely missing** | 59 / **59** / 0 | 71 / **67** / 4 — *not yet attempted: item [17] was cut off* |
| `render-images-in-transcript` | 69 / **68** / **1 genuinely missing** | 68 / **68** / 0 | 75 / **0** / 75 — *not yet attempted: never dispatched* |
| **Quest** | **188 / 186 / 2 genuinely missing** | **185 / 185 / 0** | **220 / 141 / 79 not yet attempted** |

**593 units owed across the three tracks. 512 signed. 81 unsigned — of which 79 are the paused
siegemaster and 2 are genuine.**

### The two genuinely unsigned units, named

Both are the same seam, on two different flows. Neither is a miss by the cell that owes it. The
`addedBy` column records which role authored the observable, and that record is what the audit calls
provenance.

| Unit | Flow | `addedBy` | Authored | Owning cell closed | Gap |
|---|---|---|---|---|---|
| `check-typing-after-end-of-content-newline` | send-message | **flowrider** [14] | 2026-09-02T15:51:07Z | [8] `web`, 06:39:48Z | **9.2 h earlier** [chain send §1c] |
| `check-modal-width-tracks-modal-inner` | render-images | **flowrider** [15] | 2026-09-02T17:49:58Z | [9] `web`, 08:28:32Z | **9 h 21 m earlier** [chain render §1] |

`signoffTrackEligibilityStatics` keeps a `flowrider` origin on codeweaver's list on purpose. A
`pt N` item is a "part N" continuation — a second, later session for the same package and flow. The
statics say why: *"a `flowrider` origin reaches a codeweaver session on a LATER `pt N` continuation
of that package, and dropping it would park such an observable outside every codeweaver denominator
permanently"* **[verified at source: `signoff-track-eligibility-statics.ts:87-90`]**.

**No `pt N` codeweaver item exists on this quest for either package.** So both cells' checklists read
`REMAINING: 1`, and no session will ever clear either one. Two of three flows carry one instance
each. A flowrider authored both. Neither has a carrier [chain send §1c; chain render §1].

### The 79 not-yet-attempted units

| | Unit | Status |
|---|---|---|
| send-message | off-map `staleness`, `configuration`, `hostile-input`, `perf` | Ordered last per the prompt's own rule; item [17] was cut off before reaching them [chain send §1c; report 17 §3 S7] |
| render-images | all 75 units — 2 terminal, 7 branch, 59 observable, 7 off-map | No siegemaster work item was ever dispatched [chain render §0, §1] |

### Off-map probe families — the quest's only security and performance coverage

The system emits seven canonical families for **every** flow unconditionally. Nobody authors them in
the spec; the transformer derives them from `qaOffMapFamilyContract.options`
**[verified at source: `packages/orchestrator/src/transformers/qa-unit-enumerate/qa-unit-enumerate-transformer.ts:91-101`]**:

```
paste-image-into-composer     offMapSignoffs = 7   all confirmed, wi 3a00404a (item [16], complete)
send-message-with-images      offMapSignoffs = 3   re-entry, interruption, concurrency (item [17], cut off)
render-images-in-transcript   offMapSignoffs = 0   never dispatched
```
[chain render §8]

**10 of 21 owed off-map units are signed. Eleven — 52.4% — are not yet attempted**, and among them
sit both `hostile-input` and `perf` on two of three flows. The siegemaster prompt names the stake
itself: *"These seven are the only security and performance coverage this quest has"*
[post-mortem §E23].

### Sign-off records actually written, and the four that measure nothing

| Flow | codeweaver | flowrider | siegemaster | Records | Notes |
|---|---|---|---|---|---|
| paste-image | 58 | 58 | 74 | **190** | zero phantoms [chain paste §1] |
| send-message | 62 | 61 | 67 | **190** | **4 phantom** (nodes typed `terminal` that still point onward), **2 more destroyed in transit** [chain send §2c, §2d] |
| render-images | 68 | 68 | 0 | **136** | [chain render §8] |
| **Quest** | **188** | **187** | **141** | **516** | |

The codeweaver column reconciles exactly: **188 records − 2 phantom = 186 units**, which is the
validated signed figure. Nobody ever wrote the two records destroyed on cell [5].

### `coverage.txt` is not a denominator, and all three reports say so independently

The measuring script disagreed with `get-qa-checklist` on every flow. All three reports found the
same four defects [chain paste §0; chain send §1a; chain render §0]:

1. It omits terminal units.
2. It ignores `observableOrigins`.
3. It ignores `verificationMethods`.
4. It derives the off-map denominator from the entries *present on disk* rather than from the seven
   canonical families.

The fourth defect is the consequential one on `render-images-in-transcript`. There, `coverage`
printed `off-map families 0`. That is a **signed** count printed where a reader expects an **owed**
count. So a script reading `coverage.txt` cannot show that a flow's entire security probe was never
attempted [chain render §0 item 3].

---

## C. Did the spec give the workers what they needed?

### Provenance: 90.2% of the definition of done survived Gate #2

| Flow | observables | `spec` | `siegemaster` | `flowrider` | `codeweaver` |
|---|---|---|---|---|---|
| paste-image | 50 | 41 | **9** | 0 | 0 |
| send-message | 53 | 47 | **5** | 1 | 0 |
| render-images | 60 | 59 | 0 *(not yet attempted)* | 1 | 0 |
| **Quest** | **163** | **147 (90.2%)** | **14** | **2** | **0** |

[chain paste §6; chain send §6a; chain render §6]

Two facts about that table carry the whole section.

**First: `addedBy: 'codeweaver'` is zero, quest-wide.** That is not a codeweaver virtue. A
codeweaver's evidence is a unit test in the package it owns, and a passing unit test says nothing
about a route the graph did not draw [chain send §6a]. One cell *did* notice a missing observable. It
wrote a quest note instead of authoring the observable, because the codeweaver prompt buries the
route for authoring one: a single sentence in the *Recording what you claim* section, after the
sign-off template, with no step in the script that asks the question [chain send §6e].

**Second: 14 of the 16 mid-quest observables came from the last role in the relay**, and 9 of those
14 came from the one flow where that role finished. The other two flows do not have fewer latent
defects. They have less siegemaster [chain paste §6].

### What each role had to derive for itself, consolidated across the three flows

| Derived fact | Who paid it | Where it should have come from | Measured cost |
|---|---|---|---|
| **The seam disposition** — whose half is the other side of this glue node, has it landed, what did it assume | **all 8 codeweaver cells** | `codeweaverScopeBlockTransformer`, which is written, documented, unit-tested and has **zero production call sites** **[verified at source: 2 files reference the symbol — itself and its own `.test.ts`]** | 0.3 min [report 02] · 1–2 min [report 06] · 4 min [report 08] · 4–6 min [report 04] · 3–5 min [report 07] · **6.3 min and 30 `Read` + 9 `discover` calls** [report 05 §3.2] |
| **An edge's id, to sign a branch unit** | cells [3], [5], [6], [8], [9] | `flowGraphToTextTransformer`, which prints `[C✓]` beside an id it withholds **[verified at source: `flow-graph-to-text-transformer.ts` — `edge.id` occurrences = **0**, `edge.label` = 4; lines 275 and 281]** | 1.4 min + one MCP round-trip [report 06] · 1.1 min and ~2,750 output [report 09] · ~0.6 min [report 03] · **two sign-offs silently destroyed** [report 05 §3.3] |
| **Its own denominator** | 6 of 8 codeweaver cells | `get-qa-checklist`, which **appears 0 times in `codeweaver-prompt-statics.ts` and 0 times in `codeweaver-reviewer-statics.ts`** | four wrong counts on flow 2 alone (§D) |
| **Which packages the flow crosses** | flowrider [15] | the work item's own `packageNames`, which is `[]`; the three codeweaver items for the same flow carry the answer | **≈8 min, 4 sub-agents, 98,288 output, 31.8 M ctx-in** [report 15 §3] |
| **A sibling's map or walker guide** | flowrider [14], [15]; siegemaster [17] | a flow-scoped rather than item-scoped path | **≈30–37 min and ≈475k tokens** [report 14 §5 f9] · **≈4.2 explorer agent-min, ≈7.0 M ctx-in** [report 15 §5.9] · **83.8 min of combined guide authoring for 10.1% shared content** [report 17 §5.6] |
| **"No walker while a fixer is saving"** | siegemaster [16] | a prompt line naming this repo's watcher hazard | *"the single largest cost driver in the item — it forces 292.4 min of QA and 205.9 min of repair to run end-to-end rather than overlapped"* [report 16 §1] |
| **That `git diff` is blind to new files** | codeweaver [7], flowrider [13], [15] | the sentence the sibling **reviewer** prompts already carry | 39.3 min, 17.9% of item [7] [report 07 §3.2]; ~2 min [report 13 §3A] |
| **That `--staged` never typechecks an untracked file** | flowrider [13] reviewer | ward's own `git-diff-unpushed-broker` | **51 type errors past four rounds of sign-off**, 5.3 min of reviewer cleanup, and the reviewer only found it by breaking its own "twice at most" cap [report 13 §3B, §5.1] |
| **That `[GIT FORMS]` is factually wrong** | every session, in every brief | a re-measurement | piping git through `head`/`tail` and chaining with `&&` both **work**; `find`, `grep`, `sed` and shell redirection are what actually fail, and neither prompt warns about them [report 07 §3.4; report 16 §3] |

**Priced total on flow 3 alone: about 15–20 opus-minutes and about 39 M context-in tokens** [chain render §3],
*"all of it spent re-establishing facts that already existed in `quest.json`, on sibling work items,
or in a transformer with no caller."*

### The cost of each late find

**Flow 1 — nine siegemaster observables, and the earlier tracks could have reached most of them.**
[chain paste §6] prices each one at the phase it consumed. It judges each against the fixer's own
`RED FIRST` test, which says what environment the proof actually needs:

| | Codeweaver could have caught | Flowrider could have caught |
|---|---|---|
| Yes, with a test in its own existing files | **5** | **9 (all)** |
| Structurally could not | 2 — no layout engine, no `indexedDB` | 0 |
| Possible but out of its brief's scope | 2 | — |

*"Aggregate wall clock spent finding and repairing them at siegemaster time: phases 4, 6, 9, 10, 11,
12 and 13 sum to 7.2 + 29.0 + 50.8 + 30.3 + 36.9 + 75.3 + 102.7 = **332.2 of 553.4 minutes, 60.0% of
the longest item on the quest.** Not all of that is attributable — the off-map walks that surfaced
them were owed work either way — but the repair half is: **205.9 minutes of fixer time, 37.2% of the
session**"* [chain paste §6].

The single most expensive was `check-restore-never-misattributes-image`: five agents,
**501,974 output tokens, 112.3 minutes — 20.3% of the item**. All of that went on a pure
index-mapping bug in a broker the codeweaver's own cell built, and its repair tests landed in two
jsdom test files the codeweaver already had open [report 16 §5 Finding 5].

**Flow 2 — five siegemaster observables, two of them within the flowrider's reach.**
`check-composer-typable-while-agent-streams` and `check-draft-is-scoped-to-its-own-composer`
*"together cost roughly **135 sub-agent minutes and ~306M context-in tokens** at siege time. A
flowrider e2e for the draft-scoping one is two tabs and one assertion"* [chain send §6b].

**Flow 3 — one flowrider observable, found at the cheapest possible place.** The codeweaver had
already marked `check-modal-is-three-quarters-wide` `unconfirmable`, and gave the right reason:
*"Mantine's own Modal sizing sits between the prop and the pixels"*. The flowrider then measured
864 px against a required 960 px in a real browser, and authored the observable rather than signing a
green. *"This is the cheapest possible place for that discovery, and it cost ≈0 additional wall clock
— the wave was running anyway and returned 10/10 green"* [chain render §6].

### The most expensive chain on the quest, and it is not a mid-quest observable at all

`check-new-quest-first-message` is a **spec observable a codeweaver signed `confirmed` while the
system was broken** [chain send §6d]:

```
2026-09-01T20:08:05Z  codeweaver [3]   signs it CONFIRMED off a correct orchestrator unit test
2026-09-01T22:56:15Z  codeweaver [5]   +168.2 min — writes a 2,430-char out-of-scope note naming the
                                        hole in 0.3 min: "no cell on this quest owns the orchestrator
                                        step that would write those files"
2026-09-02T08:28:53Z  ward [10]        red on an unrelated defect; this one is invisible to it
2026-09-02T15:51:07Z  flowrider [14]   +19.72 h — UNCONFIRMABLE, root cause + a fix instruction,
                                        red test deleted so nothing red ships
2026-09-03T06:06:56Z  sm-walker [17]   rediscovered live on P3; falls BETWEEN two walkers' assignments
2026-09-03T06:54:59Z  siegemaster [17] +31.98 h from the first naming — CONFIRMED against a real spawn
```

The repair is the P3 spawn-permission chain: **126.8 minutes across four agents**, 104.8 min of wall
clock, and the single biggest block of the item. Agent 14 alone burned **287,865 output and
172,918,166 context-in — 11.1% of the item's output and 15.8% of its context-in on one fix**
[report 17 §5.3; post-mortem §E19].

**Root cause, stated by [chain send §6d]:** *"it survived all of that because the artifact that
decides who builds what — the flow graph — draws one `post-chat` node and one edge into the write
chain for three routes."* The spec knew there were three routes. `check-chat-post-carries-images`,
`check-followup-post-carries-images` and `check-create-post-carries-images` are three separate
observables on that one node. The information exists; only the topology is missing.

### Verdict on spec adequacy

**The spec was not the bottleneck for units it named.** 147 of 163 observables survived Gate #2. On
the control flow the codeweaver had a 165-line map on disk at 9.1 minutes — **4.1% of its session on
orientation** — and it needed only four mid-run edits [chain paste §7]. Where the approved artifact
fell short is narrower and sharper. It was silent about **surfaces no observable claims** (§G), and
it under-drew **convergence** (three HTTP routes on one node).

---

## D. Obligation versus delivery, per role

### codeweaver — 188 owed, 186 signed, 8 cells, a 9.4× efficiency spread

| Cell | Package · flow | Wall | Sign-off records | min/unit |
|---|---|---:|---:|---:|
| [2] | shared · send-message | 24.3 | **1** | **24.30** |
| [3] | orchestrator · send-message | 41.3 | 11 | 3.75 |
| [4] | orchestrator · render-images | 88.4 | 12 | 7.37 |
| [5] | server · send-message | 87.7 | 13 *(claimed 15; 2 destroyed in transit)* | 6.75 |
| [6] | server · render-images | 54.6 | 21 | **2.60** |
| [7] | web · paste-image | 219.9 | **58** | 3.79 |
| [8] | web · send-message | 174.6 | 37 records / 35 units *(2 phantom)* | 4.72 |
| [9] | web · render-images | 109.0 | 35 | 3.12 |

**The spread the brief asked about is wide.** Cells signed between 1 and 58 units each. Cost per unit
ran from 2.60 to 24.30 minutes — a 9.4× efficiency spread. Per flow:

| Flow | cells | codeweaver wall | units | min/unit | partition quality |
|---|---:|---:|---:|---:|---|
| paste-image | **1** | 219.9 | 58 | **3.79** | one package tags all 20 nodes; no seam exists |
| render-images | **3** | 252.0 | 68 | **3.71** | **zero overlap, zero gap** — 12/18/29 exactly matching each observable's own `package` tag [chain render §2] |
| send-message | **4** | 327.9 | 62 | **5.29** | **18 of 61 units double-owned**; per-cell denominators sum to **79 over a 61-unit union** [chain send §2a] |

**Two reports disagree about whether the fan-out is the problem. Reconciling them produces a finding
neither states alone.** [chain paste §2] concludes *"the single cell served this flow, and it should
not have split"*. [chain render §2] concludes the three-cell split *"matched the work — perfectly."*
Both are right. **The number of cells is not the cost driver. The cleanness of the partition is.**
Flow 3 split three ways at 3.71 min/unit, which is statistically indistinguishable from flow 1's
single cell at 3.79. Flow 2 split four ways at 5.29, and produced a cell that signed one unit in
24.3 minutes.

**What made flow 3's partition clean was not the mechanism.** [chain render §2] is explicit:
*"Two things then saved the split, and neither is a rule"*. Build order drained the overlap for
whoever ran later, and the server operator wrote the judgement down by hand:

> `40.5m say: "I'll sign the 18 that are mine and leave those seven for web's cell rather than
> marking them unconfirmable, which would hide them from the session that can actually confirm them."`

Those seven all now carry `codeweaverSignoff.workItemId = 71c1fd22…`, the web cell. *"That is a
correct outcome resting on judgement, not on the mechanism."* The **same** mechanism on flow 2 gave
the `shared` cell a prompt-visible denominator of 1 against an authoritative 6 [chain send §2b].

### flowrider — 185 owed, 185 signed, 0 unsigned, on all three flows

**The flowrider is the only track that closed its denominator on every flow it was dispatched
against.** It spent 652.3 minutes across three items. It is also the only track that used its
denominator tool. `get-qa-checklist` has a whole numbered step in the flowrider prompt
(`### 2. Get the full list of units`)
**[verified at source: `flowrider-prompt-statics.ts:180`]**, and all three flowriders called it:
`0.5m say: "58 units, all mine."` [report 13 §3]; `0.6m … "58 units across 5 walk paths."`
[report 14 §1 P1]; and [15] closed 68 of 68 [chain render §1].

What the flowrider did **not** do is author. It wrote two observables across three flows, against the
siegemaster's fourteen. On the control flow, where nine were there to be found, **it authored none**:
*"it refused four sign-offs and amended one description, which is the same instinct pointed at the
existing list rather than past it"* [chain paste §7].

### siegemaster — 220 owed, 141 signed, 79 not yet attempted

Two items ran, for 1,208.5 minutes — **44.9% of the quest's wall clock and 42.9% of its context-in**
[post-mortem §B] — covering two of three flows. Here is what that bought on the one flow that
finished:

- **74 of 74 units signed**, from a starting denominator of 65 [chain paste §0].
- **Nine observables authored, ten defects fixed and re-proved by walkers that did not make the
  fix**, twelve quest notes [post-mortem §F7].
- **Fourteen named regression cases committed in `e4d5e8218`** — ten Playwright, four jsdom — into
  `composer-paste-{refusals,inserts-thumbnail,draft-reload}.e2e.ts` and `composer-paste.harness.ts`,
  **which are the flowrider's own files**, and `chat-input-widget.test.tsx`, **which is the
  codeweaver's own file** [chain paste §6].

One measurement gives the shape of the whole session: *"The siegemaster settled the entire
denominator it shares with the codeweaver and the flowrider by **+212.0 minutes — 38% of its
session.** The remaining 341 minutes, 62%, produced the sixteen units no other track measures"*
[chain paste §6].

---

## E. Where the chain leaks

**No unit on any flow is owned by nobody.** That is the strongest single statement the audit
supports, and all three reports reach it independently [chain paste §4; chain send §1c;
chain render §4]. Every observable, terminal and branch sits inside at least one track's denominator
under `signoffTrackEligibilityStatics`. The five exclusions that remove a unit from a track are all
correct, and all correctly applied. The leaks are elsewhere.

### E1. The closed-denominator seam — 2 units, permanently open

Covered in §B. A `flowrider` origin stays in codeweaver's denominator so a later `pt N` can carry it.
Nothing mints that `pt N`. Two instances, both real, both permanent.

### E2. The last-role-in-the-relay seam — 14 units, single-tracked forever

`observableOrigins` excludes `addedBy: 'siegemaster'` from both earlier tracks outright, and the
statics are honest about why: *"A role that runs strictly AFTER a track cannot produce work that
track was able to sign."* That is true — **and there is no `pt N` after the siegemaster.** So *"A
siegemaster-origin observable is structurally single-tracked forever, on every quest, by
construction"* [chain paste §6]. [chain send §1c] reaches the same conclusion from the other flow:
*"A mid-quest observable authored by the last role in the relay is closed the moment it is written,
whatever its evidence is worth."*

**On flow 1 this costs nothing in real coverage and everything in reported coverage.** Eight of the
nine now have automated tests. Ten of the fourteen new cases are Playwright cases in the flowrider's
own spec files. The flowrider's harness had to be extended by 228 lines to support them — **and no
earlier track's sign-off will ever record any of it.** A human reading a coverage report sees
"9 unsigned on codeweaver, 9 unsigned on flowrider". That reader would reasonably conclude those nine
have one hand-driven confirmation and nothing else. In fact they have a Playwright case each
[chain paste §6].

### E3. Silent data loss — 2 sign-offs destroyed, 4 more measuring nothing

Cell [5] sent `edges: [...]` **nested inside** the node object, keyed on the edge **label**, because
the label is the only string its render printed. `flowNodeContract` is a plain `z.object` with **no
`.strict()` and no `.passthrough()` [verified at source:
`packages/shared/src/contracts/flow-node/flow-node-contract.ts:31` — `.strict()` count 0,
`.passthrough()` count 0, no `edges` key]**. So zod's default *strip* discarded the array, and
`modify-quest` answered `{"success": true}` on both calls. That destroyed *"~2,300 characters of
already-built red-then-green evidence"*. The session then reported *"15 units, every one carrying a
verdict"* over 13 written [chain send §2c; report 05 §3.3].

Separately, cells [8] and [14] each wrote a sign-off on `send-rejected` and `insert-newline`. Those
nodes are typed `terminal` but still point onward, so they are **not terminal units**
**[verified at source: `qa-unit-enumerate-transformer.ts:46-49` filters `!nodesWithOutgoing.has(...)`]**.
That leaves four records no checklist counts, no summary reads and no reviewer grades. The flowrider
prompt warns about exactly this. The codeweaver prompt does not — and the flowrider wrote them
anyway [chain send §2d].

### E4. The code seam with no unit over it

The create route's image write belongs to `server` by file path, and to `post-chat`/`resolve-images-dir`
by node. **No observable on those nodes says "on all three routes."** [chain send §4b]. It cost
31.98 hours (§C).

[chain send §4b] also names the near-miss the quest did not have. The 18 double-owned units all
landed *"because the prompt's 'sign only observables printed in full' rule happens to partition them
— each glue observable's own `package` tag names exactly one of the two owning cells. **That is a
coincidence of tagging, not a mechanism.** An observable on a seam node whose `package` tag names a
third package, or is absent, would be printed in full to neither cell and signed by nobody, while
both cells' checklists counted it. Nothing on this quest tests for that."*

**Two routing rules disagree, and both are deliberate.** The checklist routes a unit by its owning
**node's** tags (`qaUnitsInPackageScopeTransformer`, intersection semantics, glue included, *"no
track mints a seam item, so a glue unit a stricter reading dropped would be owned by nobody"*). The
codeweaver prompt routes it by the **observable's own `package` tag** (*"Sign only observables
printed in full"* **[verified at source: `codeweaver-prompt-statics.ts:189-192`]**). On a seam node
those two rules disagree, and every seam node on flow 2 is one [chain send §2a].

### E5. Cross-flow findings route to a channel that closes nothing

Siegemasters on flows 1 and 2 found three defects, **explicitly attributed in writing to flow 3** and
deferred to its session [chain render §6]:

| Defect | Found by | Recorded as | Unit exists today? |
|---|---|---|---|
| `transcript-image-unbounded-render` — a 2000×1333 image grows its container to ~610 px of an 813 px viewport | item [16], 21:28:53Z | quest note, `out-of-scope`, `flowId: render-images-in-transcript` | **No** |
| `failed-send-leaves-duplicate-optimistic-bubble` — a retry shows one message twice, 2 files on disk rather than 4 | item [16], 01:42:58Z | quest note, `out-of-scope` | **No** |
| `siege-transcript-bubble-renders-plain-text` — no thumbnail, no placeholder, no token; two screenshots | item [17] walker, 07:49:45Z | quest note, `flowId: None` | **No** |

*"The session all three were deferred to was never dispatched"*. The mechanism that would have turned
them into units is per-flow by construction: a siegemaster on one flow writing an observable onto
another *"would be authoring units against a flow it will never walk and cannot sign."* So the three
went into `planningNotes.questNotes`, *"a channel whose own contract is that it settles nothing"* —
`packages/orchestrator/CLAUDE.md`: **"A note NEVER closes a unit; only a sign-off does."**

**Cost where they were found: near zero. Cost downstream: three known, reproduced, screenshot-backed
defects on a flow whose delivered state reads 68/69 codeweaver and 68/68 flowrider.**
[report 15 §5.11] verified that no assertion in the flowrider's 3,564-line commit `99587913a` would
have caught any of the three.

### E6. Overlap — defence in depth on the whole, one named waste

**109 units on this quest carry three independent `confirmed` verdicts** — 55 on flow 1, 54 on flow
2, and zero on flow 3, where the third track never came.

**Depth is real and measurable.** On `check-composer-locked-in-flight` the three layers caught three
different failures. jsdom proved the render props. Playwright proved a MutationObserver state
sequence in real Chromium. An instrumented XHR on a live server measured `contenteditable="false"`
**53.6 ms before that XHR's own `loadend`** — *"Only the third could have found the defect that
became `check-composer-typable-while-agent-streams`"* [chain send §4a].

On flow 1 the escalation ladder ran the other way. The codeweaver refused three units it could not
reach, and wrote the exact experiment that would settle each one. The flowrider then ran that
experiment in Playwright, and the siegemaster ran it by hand [chain paste §4]. On flow 3 all five
codeweaver `unconfirmable` verdicts were jsdom limits stated honestly. Four came back `confirmed`
from a real browser, and the fifth escalated into a genuine spec defect [chain render §4].

**Where overlap is waste, it has a named cause, not a structural one.**
`check-images-dir-name-is-shared` asserts that one literal lives in one file. Three sessions across
two days measured it. The flowrider's *"flow-perspective"* proof is the codeweaver's own unit test at
a different line number in the same file. Two sibling observables assert exactly the same kind of
thing, carry `verifyByReading: true`, and are therefore off both later tracks' lists by rule.
*"Setting `verifyByReading` on this observable would remove two sign-offs, one of which is not
flow-perspective evidence at all. That is a one-field spec fix, not a process change"*
[chain send §4a].

**The largest identifiable inefficiency on the control flow is real and unavoidable as designed:**
*"the siegemaster spent 212 minutes settling the 58 units the other two tracks had both already
settled … spending 38% of the longest session on the second look at units two tracks already
confirmed is the flow's largest identifiable inefficiency. It is also, unavoidably, how it got to the
off-map probes"* [chain paste §4].

---

## F. Reviewer burden as a signal of upstream gaps

**Twelve reviewers ran across the three chains. All twelve returned `pass` on the first round. Zero
`rework` rounds anywhere.** The thirteenth reviewer — siegemaster [17]'s — never ran. That item was
cut off at steps 4–7 of an unbounded loop, which left **67 uncommitted paths and nine fixers' work**
with `git log --oneline -1` still at its own `startRef` [chain send §5d; post-mortem §E2].

### "Certifying without reading" does NOT replicate

The brief flagged this as a convergence. All three reports reject it in its stated form. The evidence
is specific: a reviewer that produces a finding only a reader could produce, demonstrably read.

| Reviewer | Read? | Evidence |
|---|---|---|
| [7] codeweaver · paste | **YES** | 103 `Read` calls; reported that `#check-thumbnail-has-no-remove-control` landed in a different file than its parent's map predicted [chain paste §5] |
| [16] siegemaster · paste | **YES** | 30 Bash, 17 Read, 11 discover in 9.7 min; found ~50 duplicated lines across two adapters [chain paste §5] |
| [5] codeweaver · server | **YES** | *"caught two false-green tests and one bad ward scope, inside its own turn, with zero rework"*; `Read 54`, `Edit 7` [chain send §5a] |
| [8] codeweaver · web | **YES** | found a genuinely missing test on a `throw err;` path nothing exercised [chain send §5a] |
| [13] flowrider · paste | code yes, **units no** | fixed 51 type errors (needs opening files) but dropped `BITES:`, `UNCOVERED:` and `FINDINGS:` and replaced 58 per-unit citations with one blanket sentence [chain paste §5] |
| [9] codeweaver · web · render | **partly — forbidden** | graded **7 of 25 files from a diff, six of them test/proxy files**, the exact shortcut its own prompt names: *"Every one, in full. Not the diff — the file"* [chain render §5] |
| [2], [3] codeweaver | **weak** | `FINDINGS: none` / `FIXES: none`; [3] missed its own standing concern — three verbatim copies of the same 2-line helper shipped in `f48bbc660` [chain send §5a] |
| [15] flowrider · render | **YES, and still wrong** | read all eleven test files in full and returned *"Found no weak assertions, no existence-only claims, no vacuous negatives"* — false on the flow-evidence contract's own terms, on three assertions [chain render §5] |

### What all of them share is larger, and it is one thing

[chain paste §5]: **"Each reviewer certified at least one claim nobody measured."**
[chain send §5a]: **"every one certified the sign-off ledger, and not one of them counted it."**

Both statements are the same finding at different resolutions. The second is sharper, because it
names the unmeasured claim: *the count of what was signed.* **No reviewer prompt on any track has a
step that re-reads coverage after the writes.** Here is what that cost on flow 2, all of it invisible
to the reviewer that passed the pass [chain send §5a]:

- [5]'s reviewer certified a closing report saying `"15 units, every one carrying a verdict"` over 13
  records. Two of those records had been silently discarded 15 minutes earlier by a call that
  returned `{"success": true}`. The reviewer ran build and ward and read 54 files, *"and neither
  instrument looks at `quest.json`."*
- [8]'s reviewer certified 37 records of which 2 are phantom.
- [7]'s reviewer certified its parent's explicit written claim that *"eighteen e2e specs driving the
  element I just replaced"* were untouched. Its `--staged` run reported `e2e skip (none in scope)`,
  and its 20 Bash calls contain no Playwright invocation. **The reviewer prompt has no slot for a
  parent-supplied claim, so the reviewer was compliant and the design was wrong** [chain paste §5].

**Why the reviewers structurally cannot catch it.** The codeweaver prompt orders the pass so that the
operator signs from an ungraded claim and the reviewer grades it afterwards: *"Sign an observable only
where a sub-agent returned it under `PROVED`. **You have not read the test** — step 4 says so, and it
is the step that signs. You transcribe that evidence; your reviewer opens the file and grades it."*
Cell [5] wrote all 13 sign-offs between 52.5m and 72.9m, and its reviewer ran from roughly 73.6m. *"A
reviewer that finds a dead assertion is finding a unit that is already `confirmed` on the record, and
nothing walks those sign-offs back"* [chain send §5a].

### What the reviewer burden says about upstream

**It says the chain did not leak forward.** [chain paste §5]: *"Nothing was handed down from upstream
that a reviewer had to absorb. No reviewer on this flow repaired a defect caused by a prior role, and
none returned `rework`."* The one class-repair — 51 type errors — is a hole in the role's own
toolchain instructions, composed from three prompt statements that together guarantee no flowrider
suite is ever typechecked before its reviewer sees it. **A reviewer repairing the same class on every
pass is a missing step; on this quest no reviewer repaired the same class twice.**

**And that is exactly why §E matters.** The chain leaked *sideways*, into a notes channel that
settles nothing, and *backwards*, into a last role whose work no earlier ledger can record. Neither
route passes through a reviewer. That is why twelve first-pass passes and zero rework rounds are
compatible with three reproduced defects sitting unowned.

---

## G. The missing middle step — stated, or explicitly ruled out

**The answer is no. No step is missing between the approved flow map and the first codeweaver
brief.** Two steps *are* missing, and both sit later in the chain: nothing ever asks what a node
claims that no observable asserts, and only the last of the three roles is told it may look past its
list. The rest of this section shows how three reports that appeared to disagree all reach that
answer.

### The three reports' verdicts, side by side

| Report | Verdict on "is a step missing between the approved flow map and the first codeweaver brief?" |
|---|---|
| [chain paste §7] — **the control** | **"Nothing is missing … What is missing is a step that puts adversarial thinking in front of the two tracks that write tests, instead of only behind them."** |
| [chain render §7] — the negative control | **"No.** What every operator had to invent was not a planning artifact — it was information that already existed and was not wired to reach them. Three of those are wiring bugs. The one thing genuinely missing sits at the OTHER end of the chain." |
| [chain send §7] — the stress case | **"Yes, one step is missing, and it is small.** Between the approved flow map and the first codeweaver brief, nothing turns the graph into a per-cell work order." |

### Reconciled

**The three verdicts differ in wording, not in substance.** Separate a missing *artifact* from a
missing *wire* and they line up. [chain send] is the one that says yes — so read its own fix list.
Its three fixes are: name an existing MCP tool in a prompt; correct a filter in a transformer; and
draw a node the spec already has the observables for. **Not one of them is a new artifact, a new
phase, or a new role.** Every one is an existing thing that fails to reach the session. So
[chain send]'s "missing step" is [chain render]'s "wiring bug" under a different name. And
[chain paste] is the control flow, the only one where all three roles ran, so it outranks both on
this question — it reaches [chain render]'s answer too.

**So the plain answer to the phase question is: NO. The path from an approved flow map to the first
codeweaver brief is complete. Nothing needs to be authored there that is not already authored.**
What the codeweaver was actually short of is four things that exist and do not reach it:

| What the session needed | Where it already lives | Why it does not arrive |
|---|---|---|
| the seam disposition | `codeweaverScopeBlockTransformer` | **zero production call sites** [verified at source] |
| the labelled edge's id | `flow.edges[].id` in `quest.json` | the renderer prints the label and the target and **never the id** [verified at source] |
| its own denominator | `get-qa-checklist({ questId, operationItemId })` | **0 occurrences in its prompt and 0 in its reviewer's** [verified at source] |
| which glue units are its own | the observable's own `package` field | the scope derivation reads the owning **node's** tags instead |

### But every operator *does* quietly invent the same artifact — and the design already asks for it

All three reports found the same thing at the same place. The codeweaver writes a map, 165 lines on
flow 1. The flowrider writes a map, 40,302 chars on flow 1. The siegemaster's step 3 requires a
**walker guide** before the first walk — 542 lines on flow 1, read by every one of 23 walkers. Its
stated rationale is precisely this phase's question:

> *"Without it each walker re-derives the same things out of the codebase — how to reach the entry
> point, how to seed two of something, where a value lives that the page never shows — and pays for
> that reading again on every re-walk."*

**That is the middle-step artifact, and it exists — for one role, inside one session, and it is
thrown away at the end of it** [chain paste §7]. Three sessions on one flow each built a private
orientation document, and none read another's. Two siegemasters wrote two 36 KB guides for the same
composer nine hours apart, with **10.1% shared content and zero reuse**. Step 3 builds the guide path
from the operator's own Operation Item ID, *"so a sibling flow's guide is unreachable by
construction"* [report 17 §5.6].

**That is not a missing step. It is a path-naming change** — make
`.quest-plans/<operationItemId>-*.md` flow- or quest-scoped, so the flowrider opens the codeweaver's
map and the siegemaster opens both.

### Two things ARE missing, and both are at the other end of the chain

**G-i. The licence to look past the list exists in exactly one of the three prompts, and it is the
LAST one on the relay.**

`siegemasterPromptStatics` step 5 carries this, and no other operator prompt carries anything like
it:

> **"'No observable claims it' is not a reason to leave something broken.** This product is judged in
> a browser by a person, and a flow that technically completes while looking wrong has failed for
> them. You are the only session that ever sees it running — nothing downstream of you will catch
> what you wave past."

Measured yield: *"This passage bought the item its yield: nine observables were added mid-session and
four of the ten fixed defects had no observable behind them when found"* [report 16 §3]. Quest-wide,
**14 of 16 mid-quest observables trace to that one sentence.**

The other two prompts have the opposite posture by construction. The flowrider's step 2 is *"Get the
full list of units"*, and everything after it is about proving that list well.
`flowEvidenceContractStatics` governs how hard each assertion bites, never whether more units should
exist. The codeweaver signs *"the observables its unit tests prove"* [chain paste §7].

Two structural facts compound that. `observableOrigins` excludes `siegemaster` from both earlier
tracks, and there is no `pt N` after the last role. Together they mean **late-found coverage can never
be recorded** (§E2). And on the flow where that last role never ran, late-found coverage does not
exist at all (§E5).

**G-ii. There is exactly one coverage check in the whole system, and it runs the wrong direction.**

> - **Uncovered spec (Critical).** Walk every flow and every observable and ask which item would
>   produce it. An observable no item covers ships as unbuilt work that Siegemaster later fails on.
> — `chaoswhisperer-gap-minion-statics.ts:266`

That check runs `observable → which item builds it`. **Nothing anywhere runs `node/surface → which
observable claims it`.** [chain render §7] searched every prompt statics file in
`packages/orchestrator/src/statics/` for such a check and found none. The flowrider's `UNCOVERED:`
and the codeweaver's both mean *a checklist unit no test carries* — inside the denominator, never
outside it.

Flow 3's delivered state is the proof this matters. Its flowrider's denominator derivation is not the
problem; *"its coverage of its own denominator is total"* — 68 of 68. The three defects it does not
cover **had no units on the checklist to be covered by** [chain render §7]:

- On node `render-inline` (*"Thumbnail sits where the token was, text on both sides"*), the check
  asks whether any observable bounds how large the thumbnail may paint. There is none.
- On node `drop-optimistic` (*"Drop the optimistic copy and render the transcript entry in its
  place"*), it asks what happens when there is nothing to replace it with. There is none.

**Both would have surfaced before item [4] was ever dispatched.** The check is cheap: compare a
node's own label against its observable set, statically, once at Gate #2 and again in every checklist
render. Then a flow that grows a node later grows the question with it.

### The one-sentence answer

**Nothing is missing before the first codeweaver brief. The chain breaks in two places, and both are
after the map:**

1. **Between the flow map and the checklist** — nothing asks what a node claims that no observable
   asserts, so un-specified surfaces reach the first role that is licensed to look past the list, and
   that role is last, runs once per flow, and on one of three flows never came.
2. **Between the checklist and the two tracks that write tests** — the adversarial licence, and the
   seven off-map probe families, are both withheld from them. The families sat on the siegemaster's
   checklist from its first read and printed on **nobody's** earlier checklist, by design
   (`unitKinds` gives `off-map` to siegemaster alone). **Seven of flow 1's nine late observables came
   out of probing them** [chain paste §7].

The two ends of the experiment are the evidence for that shape. On the flow where the last role
finished, it minted nine observables and wrote fourteen regression cases **into the earlier roles' own
files**, where their tracks can never sign them. On the flow where it never ran, three reproduced,
screenshot-backed defects sit in a channel that closes nothing, on a ledger reading 68/69 and 68/68.

---

## H. Fixes, ranked, naming the file and the edit

Grouped as the brief requires. Each fix says what it is, what it saves, then the arithmetic behind
the saving. Nothing is averaged across measurements of different things.

### (i) One-line code changes

**H1. Wire `codeweaverScopeBlockTransformer` into the prompt renderer, or delete it — about 21–48 min per
quest.**

**What it is.** The transformer that hands a codeweaver its seam disposition already exists. Nothing
calls it. Either call it, or delete it.
**What it saves:** about 21–48 min per quest, across eight cells.
**File:** `packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts`.
**Edit:** after the four-id `parts` array is built, add a `codeweaver` branch beside the existing
`siegemaster` / `warpgate` / `spiritmender` extras:

```typescript
if (workItem.role === 'codeweaver') {
  parts.push(...codeweaverScopeBlockTransformer({ quest, operationItem: linkedOperation }));
}
```

**Arithmetic:** the reports measured per-cell re-derivation at 0.3 [report 02] · 0.5 [report 09] ·
1–2 [report 06] · 3–5 [report 07] · 4 [report 08] · 4–6 [report 04] · 6.3 min [report 05]. The
midpoint of those carrying a number is about 3–6 min. Multiply by **8 codeweaver cells = 24–48 min**.
Report 07 does its own multiplication and gets 3–5 × 7 = 21–35 min. **All eight codeweaver reports**
proposed this fix in identical form [post-mortem §E4].
**The alternative is equally acceptable:** delete the 175-line transformer and its test, and cut the
seam question from step 5, so the prompt stops asking for something no data supports.

**H2. Print the edge id in the flow render — about 3.1 min of measured recovery, two spilled tool results,
and the precondition for H3.**

**What it is.** The flow render prints a `[C✓]` sign-off marker beside an edge id it never prints.
Print the id.
**What it saves:** about 3.1 min of measured recovery across three cells, plus roughly 400k characters of spilled
tool results, plus two prompt-forbidden `stage:` calls.
**File:** `packages/shared/src/transformers/flow-graph-to-text/flow-graph-to-text-transformer.ts`,
**lines 275 and 281** — verified to contain **zero** `edge.id` references and four `edge.label`
[verified at source]. **Edit:** add an edge-id part to the emitted line, plus one KEY legend line, so
the form is self-describing. Line 281 currently reads
`` `${indent}${SYM.indent}${SYM.rightArrow}${labelPart}[#${String(toId)}]${edgeSignoffMarker}` ``.

**Arithmetic:** 1.4 min + one MCP round-trip [report 06] + 1.1 min and roughly 2,750 output [report 09] +
roughly 0.6 min [report 03] = **about 3.1 min across three cells**. Add a **135,813-character** spill
[report 03 §3.3] and a **263,665-character** spill [report 09 §5 f4], plus the two prompt-forbidden
`stage:` calls the prompt currently forces.

**H3. Add `.strict()` to `flowNodeContract` — recovers 2 destroyed sign-offs and converts a class of
silent data loss into a visible error.**

**What it is.** A malformed sign-off write currently answers `{"success": true}` after silently
stripping the payload. Make it refuse instead.
**What it saves:** 2 sign-offs on this quest, and every future instance of a failure mode nobody can
currently detect.
**File:** `packages/shared/src/contracts/flow-node/flow-node-contract.ts:31` — verified a bare
`z.object`, zero `.strict()`, zero `.passthrough()` [verified at source]. **Edit:** `.strict()`, or
an explicit `edges: z.never().optional()` rejection.
**Arithmetic:** on this quest, 2 of cell [5]'s claimed 15 units. The recurring value is larger,
because the failure mode is undetectable by construction — *"a `modify-quest` that returned `success`
may still have written nothing"* [report 05 §6 Fix 9].

**H4. Route the checklist header's denominator through the same filter as its remainder — three
measured over-counts, and a legend whose stated reasons are false.**

**What it is.** The checklist header counts an unfiltered set while the remainder counts a filtered
one, so the header over-states the denominator.
**What it saves:** zero realized minutes on this quest, and full exposure on every later read (see
the arithmetic below).
**File:** `packages/orchestrator/src/transformers/qa-checklist-to-text/qa-checklist-to-text-transformer.ts`.
Verified at source: `items` is filtered at **lines 80–85** by `unitKinds` and `verificationMethods`
**only**; the header at **lines 121–122** counts that set; `remainingItemIds` arrives already narrowed
five ways by `signoffFlowOutstandingTransformer`. `qaChecklistBuildTransformer` builds `items`
straight off `qaUnitEnumerateTransformer` with no filter at all
(`qa-checklist-build-transformer.ts:83`, `:136-139`).

Measured consequences:

| Call | Header prints | Real denominator | Over-count | Cause |
|---|---|---|---|---|
| codeweaver `581f205a` (flow 1) | `Units: 67` | **58** | **+9** | provenance [chain paste §0] |
| flowrider `90f5c4af` (flow 1) | `Units: 67` | **58** | **+9** | provenance [chain paste §0] |
| codeweaver `f21eacd1` (flow 2) | `Units: 66` | **61** | **+5** | provenance [chain send §1a-bis] |
| codeweaver `332e0da3` (flow 3) | `REMAINING: 1 of 69` | 55 formal / 69 flow | **+14** | package scope [chain render §7] |

**Two edits, both one line.** (a) Apply `observableOrigins` and the package narrowing to `items` as
well, or count the header off `remainingItemIds`' own eligible set. (b) The rendered legend at
**lines 113–115** names two reasons — *"it is already signed on the … track, or another track owns
its package kind"* — while the file's own doc comment at **lines 33–36** names **three**: *"Package
kind, flow type and provenance."* **Add provenance to the caption.** Nine units on flow 1 and five on
flow 2 render as `[x]` under a legend whose stated reasons are both false for them.

**Arithmetic — and this is the honest part.** *Realized cost on this quest: zero minutes.* The last
role in the relay authored every mid-quest observable, so at run time the earlier tracks read correct
headers. Flow 1's flowrider read `58` and its siegemaster read `65`, and 41 + 9 = 50
[chain paste §0]. The bug bites only a reader who arrives **after** a later role authored an
observable: a `pt N` continuation, a resumed session, the quest summary, and every auditor. Rank it
by exposure, not by minutes.

### (ii) Prompt edits

**H5. Give the flowrider the sentence the siegemaster has — the largest saving in this document.**

**What it is.** Only the siegemaster prompt licenses an operator to fix what no observable claims.
Give the flowrider the same licence, and the right to author the observable for what it finds.
**What it saves:** an estimated **205–467 min per quest of this shape**. Rank: #1.
**File:** `packages/orchestrator/src/statics/flowrider-prompt/flowrider-prompt-statics.ts`, after
step 2. **Edit:** transplant `siegemasterPromptStatics` step 5's passage — *"'No observable claims
it' is not a reason to leave something broken"* — plus the corollary that a defect it measures is a
new observable it may author.

**The mechanism already exists and needs no code:** `addedBy: 'flowrider'` is a valid provenance,
`observableOrigins` includes `flowrider` on **both** the codeweaver and flowrider tracks
[verified at source: `signoff-track-eligibility-statics.ts:137, 157`], and the quest already carries
two flowrider-authored observables.

**Arithmetic.** *Ceiling:* on flow 1, all nine late defects were reachable from a Playwright walk on
the composer route — *"the exact thing the flowrider did 89 times"* — and the phases that found and
repaired them cost **332.2 of 553.4 minutes**. On flow 2, two of five were flowrider-reachable at
**about 135 sub-agent minutes and about 306M context-in** [chain send §6b]. *Floor:* the walks were owed work
either way, so charge only the repair half — **205.9 minutes, 37.2% of item [16]** [report 16 §1] —
plus flow 2's 135 sub-agent minutes.

**H6. Name `get-qa-checklist` in the codeweaver prompt and its reviewer — a correctness fix, not a
time fix.**

**What it is.** The codeweaver has no tool named in its prompt for enumerating its own denominator.
Name the one that exists.
**What it saves:** 0.2 min of direct time. What it actually buys is correctness: four wrong counts on
flow 2 and one falsely-reported compliance.
**Files:** `codeweaver-prompt-statics.ts` (add at step 1 or step 8, `### 8. Record what you claim`,
line 416) and `codeweaver-reviewer-statics.ts`. **Verified at source: `get-qa-checklist` occurs 0
times in both**, against 2+1 for the flowrider family and 4+1 for the siegemaster family. **Edit:**
transplant `flowrider-prompt-statics.ts:180-190` verbatim — *"### 2. Get the full list of units"* —
adjusted for the codeweaver's own track.

**Arithmetic — and the natural experiment this quest ran.** **Two of eight cells invented the call
anyway, and both closed clean ledgers:**

| Cell | Called it? | Result |
|---|---|---|
| [7] web · paste | **yes, twice** (169.1m and 219.6m) [report 07 §1 phases K and O, §7 tool histogram] | **58 owed / 58 signed / 0 unsigned** — the only cell on the quest with a perfect ledger |
| [6] server · render | **yes, once** at 39.6m, **without `operationItemId`**, so the answer came back wider still [report 06 §3.3] | 21 signed, all `confirmed`, and it partitioned seven glue units to the right sibling by hand |
| [2], [3], [5], [8], [4], [9] | **no** | on flow 2 alone: `shared` read 1 against 6; `orchestrator` read 11 against 12; `server` **claimed 15, wrote 13, owed 23**; `web` claimed 35, wrote 37 records over 35 units, owed 38 [chain send §3a] |

*"Four cells, four numbers derived by eye, zero red"* [chain send §3a]. The prompt gates the session
on **"EVERY UNIT IN YOUR CELL CARRIES ONE OF THOSE TWO VERDICTS BEFORE YOU SIGNAL"** — a hard
completion criterion over a set the session has no tool to enumerate [report 08 §3.7]. Direct time
cost of the fix: *"0.2 min and one call, against a verification record that was wrong by two units"*
[report 05 §6 f9].

**H7. Give the siegemaster the step its own operation item promises — 0.0 min spent across 1,208.5
min of siegemaster.**

**What it is.** The operation item promises a test-suite review. No prompt step asks for one, and the
colocated test pins that no step may exist.
**What it saves:** roughly 5 min buys a question that got 0.0 min across 1,208.5 min of siegemaster.
**File:** `siegemaster-prompt-statics.ts`, a step 7b. The operation text is *"Siegemaster: manual-QA
this flow **and review its test suite**"*, seeded from
`packages/shared/src/statics/quest-type-registry/quest-type-registry-statics.ts`. **The prompt has no
step for it, and its colocated test pins that it must not have one**
(`{ judging: false, authoring: false, standards: false }`). **Measured: zero minutes of test-suite
review in 553, and zero in 655** [post-mortem §E15].

**Arithmetic.** Roughly 5 min to buy the question `flowrider-reviewer` exists to ask. On flow 1 the omission
mattered exactly once, and it mattered. The only test-suite critique in 553 minutes is a single
sentence at 117.9m, folded into a fix brief: *"The existing overlay e2e passes while this is broken,
so it asserts something weaker than the real behaviour."* **A step 7b would have produced nine of
those lines as a deliverable. Instead the siegemaster reached the same place by writing the missing
tests itself, into the flowrider's files, where the flowrider's track cannot sign them**
[chain paste §7]. Alternative, equally acceptable: change the operation text so it stops promising
what nothing scripts — *"0 min saved, 1 lie removed"* [post-mortem §G17].

**H8. Scope the walker guide and the operator maps to the QUEST or the FLOW, not the operation item —
about 8–75 min per sibling flow.**

**What it is.** Guide and map paths are built from the operator's own item id, so a sibling's
orientation document is unreachable. Key them to the quest or the flow instead.
**What it saves:** about 8–75 min per sibling flow.
**Files:** `siegemaster-prompt-statics.ts` step 3 (the guide path); `codeweaver-prompt-statics.ts`
step 3 and `flowrider-prompt-statics.ts` step 4 (the map path).
**Edit:** `.quest-plans/<operationItemId>-walker-guide.md` becomes `.quest-plans/<questId>-walker-guide.md`,
and instruct the writer to read and extend an existing guide rather than author a fresh one.
**Arithmetic:** two guides, 35,438 and 36,164 chars, identical heading sets, **37 substantive lines
identical = 10.1%**, written nine hours apart with zero reuse; **83.8 min of combined authoring**
(75.4 + 8.4) [report 17 §5.6]. Flowrider companion: **about 30–37 min and about 475k tokens** between items
[13] and [14] [report 14 §5 f9]. Item [15]'s operator already read its predecessor's map voluntarily
and called it *"the house pattern"* — **the fix makes a proven behaviour mandatory, not a new one up**
[post-mortem §E18, §F2].

**H9. Correct the two prompt statements that cost time on every pass.**

**What it is.** Two prompt statements are factually wrong. Each is independently justified in Phase 1
and each is one paragraph.
**What it saves:** 10–25 min on one item, plus about 2–4 min per cell.
(a) Replace *"Read the diff, not the files"* with the sentence the sibling **reviewer** prompts
already carry — *"New files are most of what gets built here, and a diff never mentions them"*
(`codeweaver-prompt-statics.ts` step 5, `flowrider-prompt-statics.ts` step 6). **10–25 min on item
[7]** [post-mortem §G12].
(b) Delete or re-measure `[GIT FORMS]`, which asserts something measured false five times across two
items, and replace it with what is actually blocked. **about 2–4 min per cell and roughly 34 lines out of three
prompts** [post-mortem §G5].

### (iii) Design changes needing the owner's decision

**H10. Draw the fan-in, or mint a seam owner — 31.98 hours of latency and 126.8 minutes of repair on
one bug.**

**What it is.** Three HTTP routes converge on one `post-chat` node, so one of the three was built by
nobody.
**What it saves:** 126.8 minutes of repair and 31.98 hours of latency, on one bug.
**The question for the owner:** should the spec be required to draw one node per route where routes
differ in the code that serves them?
**Evidence:** three HTTP routes enter one `post-chat` node and one edge leaves it. The observables
already distinguish the three (`check-chat-post-carries-images` /
`check-followup-post-carries-images` / `check-create-post-carries-images`), **so the information
exists and only the topology is missing** [chain send §7]. The create route's write was built by
nobody for 32 hours, after a codeweaver named it in writing in 18 seconds and a flowrider measured it
with a fix instruction attached.
**Alternative (b):** mint a flow-less seam cell for a package's cross-node glue.
`signoffTrackEligibilityStatics` already contemplates *"a single flow-less item for a package that
owns contracts and tags no node anywhere"*. `shared` tags exactly one node on the whole quest and
**missed that path by one tag**, which is why it got a 24.3-minute session for one sign-off
[chain send §2b].

**H11. Add the coverage check that runs node to observable — prevents 2 of 3 known-open defects
reaching a human.**

**What it is.** The system checks that every observable has a builder. Nothing checks that every node
has an observable. Add the reverse check.
**What it saves:** prevents 2 of 3 known-open defects reaching a human.
**The question for the owner:** is spec completeness the riftcarver's/chaoswhisperer's job, or
something the checklist should compute?
**Evidence:** §G-ii. The one existing check runs `observable → which item builds it`
(`chaoswhisperer-gap-minion-statics.ts:266`); nothing runs the reverse. **Cheapest shape:** a
`## UNCOVERED SURFACES` block in `get-qa-checklist`'s render that walks each node's own label against
its observable set and names what nothing asserts — a static comparison, run at Gate #2 and again on
every render, so a flow that grows a node later grows the question with it [chain render §7;
report 15 §6 f10].

**H12. Give a late-authored observable a carrier — 2 permanently open units, 0 minutes.**

**What it is.** An observable authored after its owning cell closed has nowhere to be signed. Give it
somewhere.
**What it saves:** closes 2 permanently open units. No minutes attributable.
**The question for the owner:** when a later role authors an observable inside a closed cell's scope,
should the ledger mint a `pt N` for that cell, or should the unit record its arrival time so a reader
can tell "owed" from "arrived too late"?
**Evidence:** §B. `signoffTrackEligibilityStatics`' own comment anticipates the `pt N` continuation;
nothing mints one. Two of three flows carry one instance each and neither has a carrier.

**H13. Decide which routing rule governs a glue unit — the node's tags or the observable's own
`package`.**

**What it is.** Two deliberate routing rules disagree on every seam node. Pick one.
**What it saves:** correctness. No minutes attributable.
**The question for the owner:** both rules are deliberate and they disagree on every seam node.
`qaUnitsInPackageScopeTransformer` uses node-tag intersection *"so a glue unit a stricter reading
dropped would be owned by nobody"*; the codeweaver prompt says *"Sign only observables printed in
full"*, which routes by the observable's own tag.
**Evidence:** on flow 3 the two rules produce **100 ownerships over 69 units** formally, against a
delivered **12/18/29 partition with zero overlap and zero gap** — and what closed the gap was build
order plus one operator writing the judgement down [chain render §2, §7]. On flow 2 the same
mechanism gave one cell a prompt-visible denominator of 1 against an authoritative 6. **The current
outcome rests on judgement, not on the mechanism**, and an observable on a seam node whose tag names
a third package would be printed in full to neither cell and signed by nobody [chain send §4b].

**H14. Print the off-map families on the codeweaver's and flowrider's checklists as CONTEXT, not as
units.**

**What it is.** The seven off-map families print on the siegemaster's checklist alone. Show them to
the other two as context, without adding them to either denominator.
**What it saves:** correctness. No minutes attributable.
**The question for the owner:** this is a deliberate exclusion —
`signoffTrackEligibilityStatics` rule 2 says *"The off-map probe families are Siegemaster's charter:
they are the breakage classes a flow graph structurally cannot draw, probed by hand against a running
system, which is not what a Codeweaver or Flowrider test suite is for."*
**The counter-evidence [chain paste §7]:** *"That reasoning holds for the probe. It does not hold for
the observables the probe mints, and this flow proves it does not: eight of the nine now have
automated tests, ten of the fourteen are Playwright cases, and the flowrider's own harness had to be
extended by 228 lines to support them."* Printing them as context changes no `unitKinds`, adds
nothing to either denominator, and reports no hole no session could close. But a flowrider writing
`composer-paste-refusals.e2e.ts` would see `concurrency`, `interruption` and `staleness` named beside
the flow it is proving, with the browser, the harness and the page already open. **Four of flow 1's
nine late observables are pure concurrency/interruption cases on a composer.**

### Ranked, across all three groups

| # | Fix | Group | Saving |
|---|---|---|---|
| 1 | **H5** — the adversarial licence for the flowrider | prompt | **205–467 min** per quest of this shape |
| 2 | **H10** — draw the fan-in / mint a seam owner | design | **126.8 min of repair, 31.98 h of latency**, one bug |
| 3 | **H1** — wire the scope block | code | **21–48 min** per quest |
| 4 | **H8** — flow-scope the guides and maps | prompt | **≈84 min** of guide authoring + **≈30–37 min** of flowrider duplication |
| 5 | **H9a** — the untracked-files sentence | prompt | **10–25 min** on one item |
| 6 | **H6** — name `get-qa-checklist` | prompt | **0.2 min**; four wrong counts and one falsely-reported compliance |
| 7 | **H11** — node → observable coverage check | design | prevents **2 of 3** known-open defects reaching a human |
| 8 | **H7** — siegemaster step 7b | prompt | **~5 min** to buy a question that got 0.0 min across 1,208.5 |
| 9 | **H2 + H3** — edge id, then `.strict()` | code | **≈3.1 min**, 2 recovered sign-offs, ~400k chars of spill |
| 10 | **H4** — the header denominator and its legend | code | 0 realized min; **three measured over-counts** and full exposure on every resume |
| 11 | **H12, H13, H14** | design | correctness; no minutes attributable |

---

## I. Open questions

**I1. Whether codeweaver [7]'s two `get-qa-checklist` calls carried an `operationItemId`.**
[report 07 §1] records the calls at phases K and O, and the tool histogram counts two. Neither
records the arguments. Cell [6]'s call demonstrably omitted the id and got a wider answer
[report 06 §3.3]. **Not measurable from the Phase 1 report.** It matters because it decides whether
the cleanest ledger on the quest came from the correct call, or from a wider one read carefully.

**I2. A correction to [chain send §3a] that only a cross-flow reading exposes.** That report states
*"no codeweaver on this flow ever called the tool"* — **true for its four cells, and its measurement
of 0 occurrences in the prompt is verified.** But it then generalises to *"No codeweaver read
anything, because the tool is absent from its prompt"* [chain send §8]. **Quest-wide that is false:
two of eight cells invented the call.** Both were on other flows, so neither report could see the
other's. The corrected quest-wide statement is in H6, and it strengthens the fix rather than
weakening it.

**I3. Whether the off-map families were "in the approved artifact at Gate #2".**
[chain paste §7] says *"the seven off-map probe families were in the spec at Gate #2"*.
[chain render §4] says *"They are not authored at all — they are derived, identically, for every
flow."* **[chain render] is better evidenced and is verified at source**
(`qa-unit-enumerate-transformer.ts:91-101` maps `qaOffMapFamilyContract.options` unconditionally).
Both reach the same operational conclusion, which is the one that matters: **the families were
enumerable for every flow from the moment the flow existed, and they printed on nobody's earlier
checklist.**

**I4. Whether the header over-count has ever misled a live session.** My reading of the run-time
figures says no on this quest (H4). It is not established for a quest where a flowrider or a
codeweaver `pt N` runs after a later role has authored observables — which is exactly the case the
exclusion was designed for.

**I5. Who or what paused the quest.** Phase 1 left this unresolved [post-mortem §H13]. No human
interjection exists anywhere in item [17]'s transcript, and the 79.1 minutes before the pause are
fifteen zero-token 529 cycles. Settling it needs the server-side ledger, which no report examined.
**It gates whether flow 3's siegemaster ever runs**, and therefore whether the three defects in §E5
are ever owned.

**I6. Whether the three questNote-only defects on flow 3 should be minted as observables now.**
[post-mortem §G25] proposes it. The counter-argument is in the design's own words: a session that did
not measure a defect should not author the observable for it. The owner's decision.

**I7. Whether `check-modal-is-three-quarters-wide` means the viewport or the modal-inner content
box.** Both tracks left it `unconfirmable` with a live `toSettle` naming a decision. Design decision
`#one-overlay-widget-two-callers` still says viewport, and the implementation renders 864 px where
960 px is required at a 1280 px viewport [chain render §4]. **A product question sitting on the
ledger, correctly not answered by an agent.**

**I8. What a siegemaster walking flow 3 today would find.** [chain render §6] enumerates five items,
grounded in what the sibling siegemasters actually found: the three deferred defects immediately, on
paths P1/P2/P4/P5; `hostile-input` and `perf`, untouched, **on the flow carrying the traversal /
null-byte / `/etc/passwd` matrix** where the flowrider already demonstrated an arbitrary-file-read
(`/etc/passwd` returning 200, 3,546 bytes, `Content-Type: image/png`) with one transformer neutered; the
three assertions with no proof they can fail; the unresolved modal-width decision; and the
`__no_session__` dedupe hole the flowrider itself flagged and could not cover.
**Every one of those five is a claim the ledger currently reads as delivered.**
