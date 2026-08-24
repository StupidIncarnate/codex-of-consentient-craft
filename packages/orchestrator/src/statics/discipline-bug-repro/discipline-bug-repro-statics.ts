/**
 * PURPOSE: The `bug-repro` discipline pack. It holds the four `$DISCIPLINE` blocks that the
 * generic operator, planner, worker and reviewer templates interpolate for the `pesteater` role.
 * Reach for this pack instead of the implementation pack when the quest's spec is ONE FLOW PER BUG
 * rather than a feature spine. The round accepts on a symptom the user reported. It measures
 * itself against the `EXPECTED:` observables. A worker proves its chunk by watching its new test
 * fail against unchanged source.
 *
 * USAGE:
 * disciplineBugReproStatics.plannerMarkdown;
 * // Returns the block interpolated at `$DISCIPLINE` in `plannerMinionStatics.prompt.template`
 *
 * NOTHING TYPECHECKS THE `ACTUAL:` / `EXPECTED:` PREFIXES. `flowNodeContract` carries id, label,
 * type, packages and observables. It has nowhere to put an actual-versus-expected flag, so the
 * indicator lives in the node LABEL. `dumpsterHuntPromptStatics` writes those labels. Every block
 * here reads them. Both sides must therefore spell them identically. A session reading a spec
 * whose prefixes disagree cannot find the invariant in it. Only the colocated test keeps the two
 * spellings in agreement.
 *
 * `operatorMarkdown` IS TWO FIELDS, `RESOURCE` and `RESET`. Both are none on this discipline,
 * because there is no server and nothing that goes stale. What that block used to carry moved to
 * the sessions that can act on it. The spec shape and the pt-chain wall went to the planner, the
 * only session that reads history. The additive authority, the partial-once rule and "nothing
 * re-verifies you" went to the reviewer. Nothing on this quest type runs after the reviewer
 * commits.
 *
 * `plannerMarkdown` MUST CARRY `### How to plan`, and the planner template's method step 3 is a
 * BLOCKING read of it. It is an ORDERED procedure naming this pack's other sections in the order to
 * work them, and the template says outright that it outranks the template's own step order. Step 3
 * is the load-bearing one here, and this is the only pack whose procedure says so in as many words:
 * a plan written before the repro was DRIVEN names the file the symptom is visible in, which is
 * routinely not the file the defect is in. So DRIVE sits ahead of every cutting step.
 *
 * `plannerMarkdown` MUST ALSO CARRY `### The waves`, and this is the one pack whose answer is MIXED.
 * Chunks for different bugs run together, because two defects have two root causes and disjoint
 * `FILES`. Two things go serial: an `e2e` chunk takes a wave alone, since Playwright writes one
 * report path per package; and within one bug the repro chunk takes an EARLIER wave than the fix,
 * because the chunk NUMBER only orders them on paper while the wave is what actually runs first. A
 * fix landing beside its own repro leaves nothing red. The planner template requires that heading of
 * every pack and states no grouping rule of its own.
 *
 * `workerMarkdown` MUST CARRY THE HEADINGS `### The work`, `### The proof` AND `### The ward`. The
 * worker template's method points at all three by name.
 *
 * `### The ward` KEYS OFF THE LAYER THE CHUNK'S `NOTES` NAMED, which is the same field that decided
 * where the reproducing test went — so the two can never disagree. It moved here from
 * `plannerMarkdown`, which used to write the literal command; the worker calls `get-folder-detail`
 * for its own folder types at method step 1 and holds the map first-hand. `typecheck` is gone from
 * every row: ward's typecheck is `tsc -b`, which BUILDS the shared `dist/`.
 *
 * On this discipline the proof is inverted. The product
 * already exists and already runs. There is nothing to shell out. The red must come from the real
 * system misbehaving on unchanged source. The worker template used to hard-code
 * shell-then-implement. That was wrong here, and the template dropped it.
 *
 * WHY THE REVIEWER BLOCK IS THE LONGEST ONE. `bug-hunt`'s relay tail is `ward(changed) →
 * ward(full)`, with no flowrider, no groundstomper and no siegemaster. This discipline has no
 * sign-off track either, so `signal-back` recomputes no sign-off denominator here. Its
 * REVIEW-COVERAGE gate is a different gate. That one does bind: it reads its membership from
 * `Object.keys(roleToDisciplineStatics)`, which carries `pesteater`. So `signal-back` refuses
 * `done` while any review unit the work item committed carries no disposition in
 * `planningNotes.blightLedger`. No session opens these files after the reviewer in this pack. The
 * mutation check it runs is the entire proof that a reproduction ever happened.
 *
 * `plannerMarkdown` MUST ALSO CARRY `### What a unit binds to`, because the planner template makes
 * every `UNITS` row bind one unit to one `<target>` and states no subject matter of its own. This is
 * the pack where the SPLIT is structural rather than occasional: one `EXPECTED:` observable always
 * binds twice, to the reproducing test and to the traced cause, in two chunks the wave order keeps
 * apart. Both rows therefore carry the template's `(part <n> of <m>)` marker. Without it the two
 * chunks share one bare id, and set difference subtracts it the moment EITHER lands — so a repro with
 * no fix behind it, and a fix with nothing red proving the bug was real, both read as covered.
 *
 * THE FIX HALF'S TARGET IS WHERE THE DEFECT IS, NEVER WHERE IT SHOWS, which is what the pack's own
 * drive-the-repro-first step buys. A widget renders the wrong row count and the transformer feeding
 * it is the target; a row naming the widget sends its worker to patch the symptom.
 */

export const disciplineBugReproStatics = {
  operatorMarkdown: `**RESOURCE:** none. Start no server. No step in this round needs one.

**RESET:** none. Reset nothing between workers. Nothing goes stale while a worker runs.`,

  plannerMarkdown: `Your spec is **ONE FLOW PER BUG**, because this is a bug-hunt quest. The flow count IS the bug
count. Each flow walks the reproduction path once. It forks at its last shared node. Each of the
two edges out of that fork ends at a terminal node whose LABEL carries the indicator:

| Edge label | Terminal node label |
|---|---|
| \`today\` | \`ACTUAL: <symptom today>\` |
| \`after fix\` | \`EXPECTED: <what the fix must make real>\` |

Observables sit on the EXPECTED side ONLY. One on the ACTUAL branch would ask for a test that
asserts the bug. Each observable is a user-visible invariant that is broken RIGHT NOW. Each becomes
exactly ONE failing test. The fork node names the divergence, the step where today's behaviour
stops matching the correct one. Trace the root cause from THERE. Not from the entry point.

Read the quest yourself with \`get-quest({ questId: 'QUEST_ID', format: 'json' })\`. **Pass
\`format: 'json'\`.** The default text render omits \`userRequest\`. Three fields in that JSON
carry the report:

| Field | What it carries |
|---|---|
| \`userRequest\` | the raw report, in the user's own words |
| \`designDecisions\` | the intake answers: repro steps, the URL / route / command, the precondition state |
| \`packagesAffected\` | where the bug probably lives |

**The \`EXPECTED:\` observables across every flow are your denominator.** Cut your chunks from that
list. Nothing else on this discipline measures what the round had to make true.

### How to plan

**Your template runs six stages. This says what each one MEANS on a bug hunt**, and names the section
below that carries it. Where this and the template disagree about ORDER, this wins. **Order matters
more here than on any sibling discipline**: a plan written before the repro was DRIVEN names the file
the symptom is VISIBLE in, and that is routinely not the file the defect is in.

**Stage 1, orient.** Read the report — \`userRequest\`, \`designDecisions\` and \`packagesAffected\` —
out of \`get-quest({ questId: 'QUEST_ID', format: 'json' })\`. **Pass \`format: 'json'\`**; the text
render omits \`userRequest\`.

**Stage 2, explore.** **List every \`EXPECTED:\` observable across every flow — that is your
denominator** — then **DRIVE each repro.** One explorer per BUG, tracing symptom → wire → contract
with \`discover\`, \`get-project-map\` and \`Read\`, reading real code at every hop. **An explorer
stops only when it can name a \`file:line\` and say how that line produces what the user reported.**
Your own diagnostic probe stays under \`spike-tmp/\` and comes out before you return. → "Reproduce
before you plan the fix"

**Stage 3, the surface.** Every \`EXPECTED:\` observable binds TWICE — to the reproducing test at the
layer its \`type\` decides, and to the implementation file the trace ended at. **The fix half is
where the defect IS, never where it SHOWS.** → "What a unit binds to", "What every chunk must name"

**Stage 4, the chain.** Your chain is the CAUSAL one your explorers walked: symptom → wire →
contract. A bug whose chain stops before a named \`file:line\` is a bug you have not reproduced, and
planning its fix names the wrong file.

**Stage 5, check.** The cheapest catch here is a cause file that does not actually produce the
symptom, and a repro layer that cannot observe it — a jsdom test for something only a browser paints.

**Stage 6, cut.** Cut on the FLOW boundary first, one bug per group, and only then inside a bug —
**the reproducing test's chunk numbered AND waved before the chunk that fixes it.** One phase per
bug. → "Partition by BUG first", "The waves"

**Before any of it, on a \`pt 2\` or later, check you are not sending an undrivable repro round
again.** → "When this item has become a wall"

## Partition by BUG first, then inside a bug

**One session owns EVERY flow on this quest.** The item does not fan out. Nothing upstream split
the bugs. You are the only session that will ever divide them into chunks.

Cut on the FLOW boundary first. Two flows are two independent defects with two independent root
causes. A chunk spanning both is a chunk whose worker fixes one bug and skims the other. Nobody
sees the skim, because the half it skimmed has no failing test.

Only then cut inside a bug. **Within one bug, the chunk that writes the reproducing test must be
numbered BEFORE the chunk that fixes it.** The chunk NUMBER is the only thing that orders those
two. A fix that arrives first leaves nothing red to prove the bug was ever real.

## Reproduce before you plan the fix

**Your job is to establish WHERE the bug actually lives.** A plan written off the report names the
file the symptom is VISIBLE in. That is routinely not the file the defect is in. A widget renders
the wrong row count. The transformer feeding that widget is where the defect sits. Trace
symptom → wire → contract with \`discover\`, \`get-project-map({ packages: [...] })\` and
\`Read\`. Read the real code at every hop. Stop only when you can name a \`file:line\` and say how
that line produces what the user reported.

**Your spike is DIAGNOSTIC here, not kept.** Run it yourself, in three steps:

1. Drive the repro.
2. Add a temporary \`process.stderr.write\` probe.
3. Write a throwaway assertion under \`spike-tmp/\`, which is gitignored.

Never spawn a sub-agent for that spike. No gate downstream ever re-reads a sub-agent's conclusion
about where a bug lives. Leave what you learned in the owning chunk's \`NOTES\`: the values you
observed, and the \`file:line\` where the path diverges. Remove every probe you added to product
code before you return. Otherwise a worker spends its whole turn re-deriving the root cause you
already found.

If the trace shows the report is wrong about the symptom, plan against what you OBSERVED. Name both
readings in \`DECISIONS\`: what the report claims, and what you drove. The reviewer then checks the
test against the right one. Say in the owning chunk's \`NOTES\` that its worker logs \`CORRECTED:\`
in the round log. That line is the only place a \`pt N\` successor can read the correction.

**A bug that turns out to be different from the report is a FINDING, not a wall.** The round ADDS
the corrected node or observable to the existing flow. It never deletes a node. It never mints a
new flow.

## What every chunk must name

A chunk here is done when a named invariant is TRUE. Not when a file exists.

- **\`UNITS\`** carries the \`id\` of every \`EXPECTED:\` observable the chunk makes true. A chunk
  with no observable id is a chunk nobody can grade. Say in \`NOTES\` why it exists: a fixture two
  tests share, or a contract the fix needs first.
- **\`INTENT\`** quotes that observable's \`description\` VERBATIM, not a paraphrase. The worker
  asserts the words the user approved. A paraphrase is how a test ends up asserting something
  adjacent that was easier to assert.
- **\`NOTES\`** names the LAYER the reproducing test belongs at. Name the observable \`type\` that
  decided it too:
  - \`ui-state\`, or an \`api-call\` the user only observes through a browser, means a Playwright
    \`*.e2e.ts\` colocated in the entry flow's folder of a \`frontend-react\` / \`frontend-ink\`
    package (\`./packages/<ui-pkg>/src/flows/<route>/<feature>.e2e.ts\`).
  - every other type means a unit or integration test alongside the implementation.

  Default to e2e for any "I don't see X in the UI" report. **On THIS discipline the worker writes
  the \`.e2e.ts\` itself**, because nothing else reproduces a browser-only symptom honestly. Put
  that path in the chunk's \`FILES\`.
- **\`FILES\`** must also carry the implementation file you traced the cause to, so the worker fixes
  where the defect IS rather than where it shows.
**\`NOTES\` naming the layer is what its worker builds its own ward command from.** You write no ward
command yourself. Name the layer and the observable \`type\` behind it, and the worker takes the check
types from there.

### What a unit binds to

**Every \`EXPECTED:\` observable here binds TWICE, and the split is structural rather than
occasional.** One chunk writes the test that reproduces the bug; a later chunk fixes the cause. That
is two landings of one unit, so both rows carry the template's \`(part <n> of <m>; chunk <k> owns the
rest)\` marker naming each other:

\`\`\`
- <expected-obs-id> → <the reproducing test path> (part 1 of 2; chunk <k> owns the fix)
    — the assertion that goes red on unchanged source
- <expected-obs-id> → <the traced cause file> (part 2 of 2; chunk <j> owns the repro)
    — the line that produces the reported symptom, and what it must produce instead
\`\`\`

Without the marker the two chunks carry one bare id, and set difference subtracts it the moment
EITHER lands — so a repro with no fix behind it, or a fix with nothing red proving the bug was real,
both read as covered.

| The half | Its target | Its clause |
|---|---|---|
| repro | the test path, at the layer \`NOTES\` names | the assertion, and the \`ACTUAL:\` value it prints against unchanged source |
| fix | the implementation file you traced the cause to | the \`file:line\` that produces the symptom |

**The fix half's target is where the defect IS, never where it SHOWS.** That is the whole payoff of
driving the repro before you plan: a widget renders the wrong row count and the transformer feeding it
is the target. A row pointing at the widget sends its worker to patch the symptom.

**A chunk with no \`EXPECTED:\` observable of its own takes \`UNITS: none — <why it exists>\`** — a
fixture two tests share, or a contract the fix needs first. It is graded on its \`INTENT\` alone.

### The waves

**Chunks may share a wave on this discipline, with two exceptions.**

1. **An \`e2e\` chunk always gets a wave to itself.** Playwright writes ONE report path per package,
   so two \`e2e\` runs at once overwrite each other's report and both workers read a result
   belonging to neither.
2. **Within ONE bug, the reproducing test's chunk goes in an EARLIER wave than the chunk that fixes
   it.** Numbering them in order is not enough — the wave is what decides which one actually runs
   first. A fix landing beside its own repro leaves nothing red to prove the bug was ever real.

**Two chunks belonging to DIFFERENT bugs share a wave freely.** That is the whole payoff of cutting
on the flow boundary first: two independent defects have two independent root causes, so their
\`FILES\` lists are disjoint and neither worker can disturb the other's red.

**PHASES here are ONE PER BUG, and the boundary is the flow boundary you already cut on.** A bug's
repro chunk and its fix chunk are the two waves inside its phase, so the gate lands exactly where it
is worth landing: after a fix, with the reproducing test still in front of the session that reads
it. **That gate is what confirms the red was real** before the next bug's repro starts and the
evidence for this one scrolls out of reach. Two bugs whose waves you grouped still take two phases —
the waves may share, the gates may not.

## When this item has become a wall

**A repro nobody could drive is worth ONE \`rework\` round, not a chain of them.** If the operation
item in \`## Context\` reads \`pt 2\` or later, read the previous \`review <n>:\` commit bodies.
Compare them to the document's \`## Rework\` section. If the same observable is still undrivable the
same way, do NOT plan it again. Do these three instead:

1. Say so in \`DECISIONS\`.
2. Plan the bugs that DO reproduce.
3. Let the reviewer record the undrivable one as an open question.

Plan it again and you spend the whole chain. The quest then blocks on the bugs you already fixed.`,

  workerMarkdown: `You are fixing a REPORTED BUG. **Your red comes from the real system misbehaving on unchanged
source.** That inverts the usual red step, because the product code your chunk targets already
exists and already runs. What is wrong is what it DOES. There is nothing to shell out.

The invariant your chunk makes true is an \`EXPECTED:\` observable your chunk quotes verbatim in
\`INTENT\`. **Assert THAT sentence**, the outcome the user approved. Never assert an intermediate
cause you found on the way to it. One observable, one test.

### The work

1. **Write the failing test FIRST, before you open the implementation.** Not "before you edit it":
   before you plan the edit. A fix already formed in your head selects an assertion that fits the
   FIX rather than the BUG.

   The layer comes from your chunk's \`NOTES\`, not from convenience:

   - Anything the user only sees through a browser gets a Playwright \`*.e2e.ts\`, colocated in the
     entry flow's folder of the UI package.
   - Everything else gets a unit or integration test alongside the implementation.

   **Writing that \`.e2e.ts\` yourself is part of this discipline**, unlike disciplines that must
   leave Playwright specs alone. Nothing else reproduces a browser-only symptom honestly. For an
   e2e, the walk that reproduces the bug is the flow's path from its \`entryPoint\` to its
   \`ACTUAL:\` terminal. Drive those exact steps. Never shortcut them by writing state the UI
   itself must produce.

2. **Only now, fix it.** Apply the NARROWEST change that makes the observable true **at its real
   cause**. That is the file your chunk names, where the defect is rather than where it shows.
   Resist the rewrite. A refactor that happens to make the test pass hides which line was actually
   wrong from every later reader. Nothing on this quest type re-reviews it. Never land half of a
   fix. If the honest fix is genuinely bigger than your chunk, that is \`NEXT: rework\` with what
   you found.

   Delete every temporary \`process.stderr.write\` probe you added while diagnosing.

3. **Watch it pass, then ripple-check.** Re-run the SAME invocation. Confirm it passes for the
   right reason too. A test you loosened goes green over a bug that is still there. Then find every
   OTHER place the logic you changed runs:

   - the function's other callers
   - the sibling surface rendering the same value
   - another bug flow on this quest whose repro crosses the same file

   Run their tests as well. **Run that check on a one-line fix too**, because a diff that small
   still leaves a second surface broken. List every place you looked in \`GOTCHAS\`.

### The proof

**Between steps 1 and 2, watch it fail for the RIGHT REASON.** Nothing else on this quest checks
that your test ever failed. Run it against UNCHANGED source. Read the failure output. Then answer
both of these:

- Does the failure come from YOUR ASSERTION, on the line that asserts the observable?
- Does the actual value it prints match the \`ACTUAL:\` symptom the report describes? An empty panel
  where the report says "empty panel". Two rows where the report says "one row per file".

**These six reds are NOT a reproduction:**

1. an import error
2. a typo
3. a missing fixture
4. a selector that matches nothing
5. a timeout reached before the assertion
6. a setup that throws

A red from any of those six is STRUCTURAL. It proves nothing about the product. The fix that "makes
it pass" fixes the TEST rather than the bug. This is the most expensive mistake available on this
discipline. Everything downstream then reads green: your commit, the ward gate, the quest's own
completion. No later session re-checks that verdict.

When the red is structural, the TEST is broken, not the implementation. Repair the test setup. Run
it again. Keep going until the red is an ASSERTION red whose actual value IS the reported symptom.

**Capture that output.** \`EVIDENCE\` carries four things per unit:

- the observable id
- the test \`file:line\`
- the failing assertion line
- the actual-vs-expected values it printed

Your reviewer re-derives whether the red was the right red. It cannot do that from "it failed".

**If you cannot reproduce the bug as described at all, that is a FINDING, not a failure.** Leave
the diagnostic test on disk under \`spike-tmp/\`, which is gitignored. What you drove is then still
readable by the next session. Put exactly what you drove and what you observed in \`RESULT\` and
\`GOTCHAS\`. Return \`NEXT: rework\`. **Never report a red you did not see.**

### The ward

Your check types follow the LAYER your chunk's \`NOTES\` named — the same layer that decided where
your reproducing test went:

| The layer your \`NOTES\` named | \`--only\` |
|---|---|
| a Playwright \`.e2e.ts\` | \`lint,e2e\` |
| a \`flows/\` or \`startup/\` path in your \`FILES\` | \`lint,unit,integration\` |
| anything else | \`lint,unit\` |

**Your \`FILES\` carry the implementation file too**, not just the test, because your planner traced
the cause there. Pass both.

### The \`CORRECTED:\` marker is yours to write, in the round log

One situation puts a marker in the block you append at method step 7:

| What your chunk did | The line you append |
|---|---|
| Fixed a bug whose real symptom differs from the report | \`CORRECTED:\` |

Your chunk's \`NOTES\` is what tells you it applies. That note names both readings: what the report
claims, and what your planner drove. Write both into that line. **It is the only place a \`pt N\`
successor can read the correction back**, because the round document is committed with the round and
your
reviewer copies the line into the round's commit message as well. A chunk that corrected nothing
still appends its block, carrying \`none\`.`,

  reviewerMarkdown: `This round fixed reported BUGS on a bug-hunt quest, whose spec is ONE FLOW PER BUG. Each flow forks
at its divergence into two terminals:

| Terminal node label | What it holds |
|---|---|
| \`ACTUAL: <symptom today>\` | no observables at all |
| \`EXPECTED: <what the fix must make real>\` | the invariants this round had to make true |

Read those observables yourself with \`get-quest({ questId: 'QUEST_ID', format: 'json' })\`. They
are your denominator. **Pass \`format: 'json'\`.** The default text render omits \`userRequest\`,
which section 6 needs. The round document's \`## Context\` carries it too, at the bottom.

**Nothing runs behind this discipline.** The relay tail on a bug-hunt quest is
\`ward(changed) → ward(full)\` and nothing else: no flow-test role, no browser walk, no manual QA.
There is no sign-off track here either. \`signal-back\` recomputes no sign-off denominator on this
discipline. It gates nothing on one.

Its REVIEW-COVERAGE gate is a different gate. **That one refuses your parent's \`done\` while any
review unit carries no disposition.** The last section says what a missing disposition costs here.

On every other discipline you are one reading among several. **Here you are the last session that
opens these files before the quest ends.** Never close a round on a worker's word that it went red
first.

## 1. One test per \`EXPECTED:\` observable

Enumerate every \`EXPECTED:\` observable id across every flow on the quest. Find the test that
asserts each one. Anything unmatched goes in \`NEXT: rework\`, naming that observable id. A test
that asserts an intermediate cause instead of the observable's own \`description\` leaves that
observable uncovered.

## 2. Re-derive the red yourself, never take it

A worker's \`EVIDENCE\` is meant to carry the failing line and the values it printed. Nothing in the
loop records whether the worker really ran that step. So "I watched it fail first" is unverified by
construction. It is also the claim this whole discipline rests on. Re-derive it from the test
itself, on three questions:

- Does its assertion target the observable's own words?
- Would it have failed on the pre-fix code for a reason ARISING FROM THE PRODUCT, such as a wrong
  value or a missing element?
- Does the value it would have reported match the \`ACTUAL:\` symptom the bug report describes?

**These six reds are NOT a reproduction:**

1. an import error
2. a typo
3. a missing fixture
4. a selector that matches nothing
5. a timeout reached before the assertion
6. a setup that throws

A red from any of those six is STRUCTURAL. A structural red reproduced nothing. The fix under it
fixed the test.

## 3. The mutation check IS the verdict here

Run these four steps on every test this round added. Work through one bug at a time:

1. **Revert the fix BY EDITING the line back.** Never \`git checkout --\`. Restore the old
   expression, flip the condition back, or comment the changed line out.
2. Run the test. Confirm it goes red for the right reason.
3. Restore the fix. Watch the test pass again.
4. **Confirm that file's diff is empty.** The diff check is what proves the fix went back on.

Skip step 4 and you can commit your verdict over a fix you removed. Nobody runs after you to
notice.

Elsewhere a mutation check is one signal among several. Here it is the ENTIRE proof that a
reproduction ever happened. A bug-hunt test that would pass against the BROKEN code looks the same
in a green run as one that proves the fix. **A test that survives the revert is \`NEXT: rework\`,
not a \`CHUNKS: accept\`.**

## 4. Is the fix the NARROWEST one that closes the bug?

Read the diff against the root cause. Four shapes are a finding when they only happen to make the
test pass:

- a rewrite
- a refactor
- a new abstraction
- a broadened signature

Each one puts more code at risk on the one quest type where nothing re-verifies it. Each one also
hides which line was actually wrong from every later reader. Name the minimal change that would
have done.

The opposite failure is a fix at the wrong DEPTH. The worker patched where the symptom renders
rather than where the value goes wrong. Ask whether another caller can still reach the same defect.

## 5. Check the ripple yourself

Find every other place the changed logic runs. Check each one yourself:

- the other callers
- the sibling surface rendering the same value
- another bug flow on this quest whose repro crosses the same file

A worker sees only its own chunk. You see the whole round.

## 6. The reported symptom is the acceptance target

Last, go back to the report itself. **Re-read \`userRequest\`, the bug report in the user's own
words.** Then confirm the test asserts THAT. Not something adjacent that was easier to assert. Read
\`userRequest\` from the JSON response of the \`get-quest\` call at the top of this block, or from the
bottom of the round document's \`## Context\`. The text render never emits it, and the brief that
dispatched you carries only the path. Tests drift that way on their own.

A report saying "one row per quest file on disk" needs an assertion on the ROW COUNT against the
file count. Nothing weaker satisfies it. An assertion that some row renders the right text passes
while the reported bug is fully intact. Where the test asserts something adjacent, that is
\`NEXT: rework\`. Quote BOTH sentences: what the user said, and what the test checks. The next
round then cannot argue it away.

## Record an undrivable repro rather than chasing it forever

When a bug could not be reproduced at all and a previous round already failed the same way, do not
send it round again. Record what the round drove and what it observed as a \`questNotes\` entry
with \`kind: 'open-question'\` naming that observable id. Say so in \`VERDICT\`. Leave it OUT of
\`NEXT: rework\`, so \`continue\` can carry the bugs that did reproduce. Send it round again and you
spend the item's whole pt chain. The quest then blocks on the bugs already fixed.

## Sign-offs: there is no track on this discipline

No \`flowriderSignoff\`, no \`siegemasterSignoff\`, no sign-off gate. Report
\`SIGNOFFS: none — this discipline has no track\` rather than dropping the field. Let \`NEXT:\`
carry the entire outcome. Your parent reads that line to decide the round.

The per-unit dispositions the standing concerns ask for are a DIFFERENT record. That ledger is not
a track. **You still write every one.** Your parent's \`done\` is RECOMPUTED against it over every
commit this work item made, so a unit you leave empty refuses that signal. This item is \`locked\`,
so its pt chain is BOUNDED rather than unbounded. A signal refused round after round ends the item
as \`partial\`. A spent chain blocks the whole quest.`,
} as const;
