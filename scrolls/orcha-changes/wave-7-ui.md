# Wave 7 — the UI

**The blast radius is narrower than expected and concentrated in one place.** Two whole surfaces are
safe, one is largely dead, and one has to be rebuilt. Seven sessions, all inside `packages/web`, so
this wave runs beside waves 5 and 6 without collision.

**Model: sonnet**, except 7A.

---

## Verified safe — do not audit these again

The chat surface entire — panel, entries, messages, tool rows, sub-agent chains, the follow-up tab —
reads `ChatEntry[]` off the wire and already buckets by work item, because sibling sub-agents share a
session. Parallel dispatch does not touch it. The queue page knows nothing about ledgers or work
items. **The flow diagram and the whole SPEC tab never rendered a sign-off at all**, so wave 5 costs
the diagram nothing. Home, sidebars, session view, rate limits, the image pipeline: untouched.

**Only three web files touch execution semantics at all.**

---

### 7A — row identity, and why nothing will report it broken

```
OWNS      the execution panel's row naming and grouping
DONE      rows are grouped under their SCOPE, and every row on screen is distinguishable
          from every other
ASSERT    not "the panel renders". Assert **no two rows carry the same name**, given a
          codeweaver cell that ran plan, three workers, review, commit, ward and repair
MODEL     opus — this is the one with a silent failure mode
```

**A row's identity is its OPERATION, and that identity silently stops being unique.** Under strict 1:1
it is a key; under one scope holding many sessions it is a category label, so that cell renders as
eight consecutive rows with the same name, told apart only by a role badge.

**It will be missed because nothing fails.** No contract rejects it, no test breaks, nothing errors.
The panel keeps working and keeps looking plausible while the user loses the ability to tell which
session is which — which is the exact thing this redesign exists to give them. **And it passes the
repo's own browser-is-the-verdict check**: a panel of eight identically-named rows is neither blank
nor frozen. That is why the assertion above is specific.

**This lands in the same pass as `workItem.step`.** It is not presentation polish.

---

### 7B — the projection: what probably happens next

```
OWNS      a new transformer — graph plus current state, walked forward — and its view
DONE      the projection renders the likely remainder, recomputes as sessions land, and
          REDRAWS on a back-edge rather than being wrong
ASSERT    on the rendered output, never on a call. Given a mid-run state it renders the
          remaining path; after a back-edge it renders the new one
```

**The ledger cannot be the map, because the map has cycles.** Today the ledger doubles as the plan —
the queue page reads it to show what is coming — and that only works while the run is a straight line.
`work ⇄ review` and `happyWalk ⇄ fixHappy` are cycles, and how many times either runs is not knowable
in advance. A list can only say what happened.

**Reuse the summary refresh chain** — outbox event, refetch, re-render. It is the right shape for the
projection and for observations too, both computed server-side. Do not build a second channel.

---

### 7C — the churn view, and the units readout

```
OWNS      the per-unit churn view — four work items, four complete records, in order
          the per-row **units assigned versus units marked** readout
DONE      both render off the observation sets, with nothing reconstructed
ASSERT    the churn sequence is legible without reconstruction: codeweaver marks obs-3
          unmet, a second codeweaver marks it met, its reviewer marks it unmet, a third
          gets it met
```

**The units readout slot already exists and is dead** — declared and rendered, passed by no production
caller, built for exactly this. Find it before writing a second one.

---

### 7D — the seven broken surfaces

```
OWNS      the unclaimed-operations tail · the progress counter · the COVERAGE section ·
          the UNCONFIRMABLE debt list · the ward-mode tag · the retry badge ·
          the DETAILS-tab ledger
DONE      each either works against the new record or is deliberately removed, with the
          reason written down
ASSERT    the progress figure is **not asserted to rise** — it cannot. The denominator
          grows as families are routed to, and a rework edge raises both numbers, so the
          ratio genuinely falls. Assert instead that it never exceeds 1, that it is
          recomputed from the PROJECTION rather than the ledger, and that `AWAITING PLAN`
          never fires for a quest with a running session
```

The COVERAGE section is the largest block in the always-visible right panel and it is three sign-off
tracks per flow, so it blanks when wave 5 lands. The debt list needs new vocabulary as well as a new
shape: two verdicts become three, `unconfirmable` becomes `cant-meet`, and the new `unmet` — the one
meaning *work is outstanding right now* — has nowhere to appear at all.

---

### 7E — what needs rework rather than rebuilding

```
OWNS      auto-expand and auto-scroll · dependency labels · the role-colour map ·
          command-row rendering · the PARTIAL status and the `pt N` continuation trail
DONE      four concurrent transcripts do not fight over the scroll position
ASSERT    `pt N` is asserted TODAY as user-visible behaviour, and it retires with
          duplicate-on-partial. Find that assertion and change it deliberately
```

Auto-expand and auto-scroll were written for exactly one running row. The role-colour map is keyed on
family when the useful dimension is now step role. Command-row rendering keys on role rather than step
kind, so a `commit` step's git output would render as markdown.

---

### 7F — what is newly required

```
OWNS      a back-edge badge · a planned-versus-actual view · a step-args display ·
          a live `unmet` list near the execution rows · a concurrency readout ·
          a step-name-unknown fallback
DONE      each renders, and the fallback does not throw
ASSERT    the fallback first: wave 1 opened the step-name contract so unrecognised names LOAD, and
          today the row renderer indexes a closed record unguarded. That is a crash, not a
          blank
```

"This session exists because work item 4 marked obs-3 unmet" is the commonest way work items will now
be created, and there is no way to say it. The planned-versus-actual view matters because the plan
calls the gap between forecast and record *the useful thing to look at when a quest goes wrong*, and
nothing reads the plan file.

---

### 7G — recipes on the SPEC tab

```
OWNS      the flow diagram's seed display
DONE      a flow shows the recipes a walk of it starts from
```

Recipes are flow data now — `quest.flows[].recipes[]`. This is the one newly-required surface a user
would reach for deliberately rather than just read, and the diagram is its natural home.

---

## The end-to-end check, and why the usual one is not enough

A real quest in this repo through the Node dispatcher. Repo policy is that the browser is the verdict:
a blank panel or a frozen spinner is a failure even if `quest.status` reads `complete`.

**But that check does not catch 7A**, and it is worth saying why rather than discovering it. The
row-identity defect produces a panel that is neither blank nor frozen and is still broken. So assert
the specific thing — every row distinguishable, by scope and step — alongside live output on each
concurrent row without the scroll fighting itself, the churn view showing what each work item marked,
and a loop-back redrawing the projection rather than appending to it.
