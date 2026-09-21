# The orchestrator step engine — the dispatch plan

**One PR. Many sessions.** This directory exists to chunk the work in
`scrolls/orchestrator-step-engine-plan.md` into briefs a single agent session can hold, run and hand
off — not into things that ship separately. Nothing here merges on its own.

**The plan is the spec, and these files do not repeat it.** A brief says what to read, which files it
owns, what it may not touch, and what "done" means. Every `§n` is a pointer into the plan. Copy a rule
out of the plan into a brief and you have made two copies of it, which is exactly what this repo spent
a session removing from the siegelense scroll.

## The three rules every session gets, whatever wave it is in

**1. The tree is GREEN when you stop.** This is the rule that makes parallel sessions possible at all.
The next agent has to be able to tell its own breakage from what it inherited, and it cannot if the
tree was already red. A chunk that cannot leave the tree compiling is not a chunk — it is half of one,
and its other half is named in the same wave.

**2. Ward your own paths, never bare.** `npm run ward -- -- <the files you touched>`. A bare run grades
the whole repo and lands somebody else's red on your work item. The bare regression run belongs to
whoever is coordinating the PR, once per wave.

**3. You do not build.** A build rewrites every package's compiled output with no lock, so a build in
flight breaks every other session's checks. Nothing in this epic needs one — ward and the dev server
read TypeScript source. If you think you need a build, say so and stop.

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

## What the coordinator does, and nobody else

| | |
|---|---|
| runs the bare `npm run ward` at the end of each wave | a session that runs one owns every failure in it, including ones it did not cause |
| runs any build | one process builds at a time, and a dispatched session is never it |
| re-measures the two blast radii before scheduling wave 5 | the plan reports 77 files for `quest.workItems` and 77 for sign-offs. The same number for two different surfaces is suspicious rather than impossible, and the sign-off figure is what sizes the largest wave |
| answers the four open questions below | each one blocks a specific session, and a session that answers one itself has invented a design decision |

## Open questions, and which session each one blocks

| Question | Blocks | Where |
|---|---|---|
| Who writes an INGREDIENT — a step, or a sub-agent? And how does one `request` mint three at once? | wave 6, `recipe-maker` | plan §9b |
| Does an all-operational quest get ONE whole-quest off-map item, or does siege close `empty`? | wave 6, `siege-planner` and the antagonist | plan §9e |
| Is author-only on `verifyByReading` / `verifyByHuman` prompt text, or a real mechanism? | wave 8, `verifyByHuman` | plan §10d |
| The `operational` docs scope — deleted, or re-pointed at the whole-quest off-map item? | wave 6, siege | `scrolls/seigelense/remaining-build-items.md` §9c |

## The brief shape

Every chunk in every wave file is written the same way, so a dispatcher can hand one over unedited:

```
### <id> — <one line>
  READ      the plan sections that specify this, and nothing wider
  OWNS      the exact paths this session writes. Nobody else in this wave touches them
  NO TOUCH  what it must leave alone, and who owns it instead
  DONE      the condition, stated so it can be checked rather than claimed
  ASSERT    the tests, naming behaviour rather than wiring
```

**`OWNS` is the load-bearing line.** Two sessions in one wave sharing a file is the collision this
whole structure exists to prevent — measured in this repo at twelve concurrent sub-agents, three
landing and nine dying on `Unable to create index.lock`.
