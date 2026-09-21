# The orchestrator step engine — the dispatch plan

**Start at [`wave-0-preamble.md`](wave-0-preamble.md), whatever layer you are on.** It has the three
layers, the worktree this runs in, the per-wave ward-and-commit gate, how a wave orchestrator fans its
briefs out, the 30-minute supervision tick, and the handoff shape. This file is the map; that one is
how to walk it.

**Two layers of orchestration, in one worktree.** The conductor launches one orchestrator per wave;
that orchestrator dispatches a worker per brief. **Only the workers write code**, and **only the
conductor commits** — a wave orchestrator decides, briefs, verifies and hands back an uncommitted
tree.

**One PR. Many sessions.** This directory exists to chunk the work in
`scrolls/orchestrator-step-engine-plan.md` into briefs a single agent session can hold, run and hand
off — not into things that ship separately. Nothing here merges on its own.

**Each wave file stands on its own.** It carries the whole spec its briefs need — the config blocks,
the contracts, the step maps, the rules — so a worker session reads one file and works. Nothing here
sends you to a 3,500-line document to find the four paragraphs that matter.

`scrolls/orchestrator-step-engine-plan.md` is the design ARGUMENT behind these — why the shape is this
shape, what it replaces, what was traded away. Read it to understand the system; you do not need it to
do the work.

## The rules are in wave 0, not here

The tree is green when you stop · ward your own paths, never git-scoped and never bare · you do not
build · nothing below layer 0 runs git at all · an open question goes up, never gets answered locally.
[`wave-0-preamble.md`](wave-0-preamble.md) has each one with the measured failure behind it.

## The waves

A wave's chunks are **file-disjoint**, so every chunk in one wave can run at once. A wave starts when
the one before it is green.

| Wave | Sessions | What it is | Can run beside |
|---|---|---|---|
| [**1** shapes](wave-1-shapes.md) | 3 | both graphs, the plan-file contract, the work-item fields, the reachability check | wave 8 |
| [**2** engine](wave-2-engine.md) | 3 | observation state, the signal gate, the router | wave 8 |
| [**3** tools](wave-3-tools.md) | 3 | `get-quest-work`, `quest-work`, the `signal-back` changes | wave 8 |
| [**4** cutover](wave-4-cutover.md) | 4 | advance, the selector, the deterministic handlers, capacity, the deletions | wave 8 |
| [**5** sign-offs](wave-5-signoffs.md) | a fan-out | retire three fields across the surfaces that read them | waves 6 and 7 |
| [**6** prompts](wave-6-prompts.md) | 19 + 2 | one session per prompt, each budgeted before it is written | waves 5 and 7 |
| [**7** UI](wave-7-ui.md) | ~7 | row identity, the projection, the churn view, seven broken surfaces | waves 5 and 6 |
| [**8** independent](wave-8-independent.md) | ~9 | `glyphsmith`, six defects, the whole `verifyByHuman` slice | **anything** |

**Two rows inside wave 8 do have an order**, and its own file says so: `verifyByHuman`'s scope value
goes after wave 5, because it is one more value in the field wave 5 re-keys; and the hydration tail
needs wave 1's contract. Everything else in wave 8 starts today.

```
wave 8  ══════════════════════════════════════════════════  any time, start it now

wave 1 ──► wave 2 ──► wave 3 ──► wave 4 ──┬──► wave 5  sign-offs  ┐
 shapes     engine     tools     cutover  │                       ├── all three
                                          ├──► wave 6  prompts    │   in parallel
                                          │                       │
                                          └──► wave 7  UI         ┘
```

**Waves 1 to 4 are serial and each is small.** They are the interesting design work and the least of
the volume. **Waves 5, 6 and 7 are where the hours are**, they are mostly mechanical, and all three
run at once because they touch three disjoint trees: `session-forensics` and the transformers, the
prompt statics, and `packages/web`.

**Wave 6 can be WRITTEN as soon as wave 3 is green**, before wave 4 lands. A prompt is text. What it
cannot do is run before the steps exist, so its verification waits even when its authoring does not.

## Which sessions get which model

| | Model | Why |
|---|---|---|
| waves 1–4, and each reviewer prompt in wave 6 | **opus** | design work and genuinely hard debugging. The router's four-question order is the heart; nothing else matters if it is wrong |
| wave 5, and most of wave 8 | **sonnet** | apply-the-contract work across many files. This is the fan-out the repo's own guidance sizes at 1–3 files per agent |
| the rest of wave 6, wave 7 | **sonnet** | writing to a map that already exists |

## The one job only layer 0 has that wave 0 does not cover

**Re-measure the two blast radii before scheduling wave 5.** The plan reports 77 non-test source files
for `quest.workItems` and 77 for sign-offs. The same figure for two different surfaces is suspicious
rather than impossible, and the sign-off number is what sizes the largest wave in this epic.

## Open questions, and which session each one blocks

| Question | Blocks | Where |
|---|---|---|
| Who writes an INGREDIENT — a step, or a sub-agent? And how does one `request` mint three at once? | wave 6, `recipe-maker` | wave-6-prompts.md, the recipe-maker rules |
| Does an all-operational quest get ONE whole-quest off-map item, or does siege close `empty`? | wave 6, `siege-planner` and the antagonist | wave-6-prompts.md, the antagonist rules |
| Is author-only on `verifyByReading` / `verifyByHuman` prompt text, or a real mechanism? | wave 8, `verifyByHuman` | wave-8-independent.md, 8C-1 |
| The `operational` docs scope — deleted, or re-pointed at the whole-quest off-map item? | wave 6, siege | `scrolls/seigelense/remaining-build-items.md` §9c |

## The brief shape

Every chunk in every wave file is written the same way, so it can be handed over unedited:
`READ` / `OWNS` / `NO TOUCH` / `DONE` / `ASSERT`. [`wave-0-preamble.md`](wave-0-preamble.md) has what a
dispatching agent adds to it, and why `OWNS` is the line that matters most.
