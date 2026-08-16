/**
 * PURPOSE: The `bug-repro` discipline pack — the four `$DISCIPLINE` blocks that turn the generic
 * orchestrator/planner/worker/reviewer templates into the role `pesteater` used to play alone.
 * Reach for this pack over the implementation pack when the quest's spec is ONE FLOW PER BUG rather
 * than a feature spine: the acceptance target is a symptom the user reported, the denominator is the
 * `EXPECTED:` observables, and the round's whole proof is a red witnessed on unchanged source.
 *
 * USAGE:
 * disciplineBugReproStatics.plannerMarkdown;
 * // Returns the block interpolated at `$DISCIPLINE` in `plannerMinionStatics.prompt.template`
 *
 * THE `ACTUAL:` / `EXPECTED:` PREFIXES ARE A LABEL CONVENTION WITH NO CONTRACT BEHIND THEM.
 * `flowNodeContract` carries id/label/type/packages/observables and has nowhere to put an
 * actual-vs-expected flag, so the indicator rides in the node LABEL — which means
 * `dumpsterHuntPromptStatics` (which writes them) and every block here (which reads them) must spell
 * them identically or a session reads a spec it cannot find the invariant in. Nothing typechecks
 * that; the colocated test is the only thing holding it.
 *
 * WHY THE REVIEWER BLOCK IS THE LONGEST ONE. `bug-hunt`'s relay tail is `ward(changed) →
 * ward(full)` — no flowrider, no groundstomper, no siegemaster — and no sign-off track exists on
 * this discipline, so `signal-back` recomputes no denominator and refuses no `done`. The reviewer in
 * this pack is the only thing standing between a false green and a shipped bug, and the mutation
 * check it runs is the entire proof that a reproduction ever happened.
 */

export const disciplineBugReproStatics = {
  orchestratorMarkdown: `Your item is the bug-hunt front: reproduce every bug this quest captured, prove each with a failing
test, then fix it.

**The spec shape is ONE FLOW PER BUG** — the flow count IS the bug count. Each flow is the
reproduction path run once, forking at its last shared node (two outgoing edges labelled \`today\`
and \`after fix\`) into two terminal nodes whose LABELS carry the indicator: \`ACTUAL: <symptom
today>\` and \`EXPECTED: <what the fix must make real>\`. Observables sit on the EXPECTED side ONLY —
an observable on the ACTUAL branch would ask for a test that asserts the bug.

**One item, every bug.** This seed has no fan-out, so ONE session owns every flow on the quest
however many bugs the report named. Nothing upstream split them for you, and nothing downstream will
pick up the one you skimmed: how your planner partitions those flows is the whole difference between
a focused run and a skim. Say so in the brief you write it.

**Your denominator is the \`EXPECTED:\` observables across every bug flow.** Fetch them at gate 3
with \`get-quest({ questId: 'QUEST_ID' })\` and count them — one failing test per observable is the
target, and that recomputed count, never your recollection, is what gate 10 signals on.

**Nothing re-verifies you.** This quest type's relay tail is \`ward(changed) → ward(full)\` and
nothing else — no flow-test role, no browser walk, no manual QA follows, and this discipline has no
sign-off track, so nothing server-side recomputes a denominator when you signal. The reviewer you
dispatch is the only thing between a false green and a shipped bug. Never close a round on a
worker's word that it went red first.

**Additive spec authority.** A bug that turns out to be different from the report is a FINDING, not
a wall: have the round ADD the corrected node or observable to the existing flow — never delete a
node, never mint a new flow — and put what the report got wrong in your commit body. A repro nobody
could drive at all is a \`partial\` with the evidence committed, never a \`done\`.`,

  plannerMarkdown: `This is a **bug-hunt** quest, and its spec is **ONE FLOW PER BUG**. Each flow is the reproduction
path run once, forking at its last shared node (two outgoing edges labelled \`today\` and
\`after fix\`) into two terminal nodes whose LABELS carry the indicator — \`ACTUAL: <symptom today>\`
and \`EXPECTED: <what the fix must make real>\`. Observables sit on the EXPECTED side only; each is a
user-visible invariant that is broken RIGHT NOW, and each becomes exactly ONE failing test. The fork
node names the divergence — the step where today's behaviour stops matching the correct one — so a
root-cause trace starts THERE, not at the entry point.

Read the quest yourself with \`get-quest({ questId: 'QUEST_ID' })\`: \`userRequest\` is the raw report
in the user's own words, \`designDecisions\` holds the intake answers (repro steps, the URL / route /
command, the precondition state), \`packagesAffected\` says where the bug probably lives.

## Partition by BUG first, then by piece inside a bug

**One session owns EVERY flow on this quest.** The item does not fan out, so nothing upstream split
the bugs and your partition is the only one there will ever be. Cut on the FLOW boundary first: two
flows are two independent defects with two independent root causes, and a piece spanning both is a
piece whose worker fixes one and skims the other — invisibly, because the half it skimmed has no
failing test to notice. Only then cut inside a bug: usually the reproducing test at its layer, then
the fix, then a second test where the same defect is observable at another layer.

\`dependsOn\` carries more weight here than on a feature quest. Within one bug, the piece that writes
the reproducing test must land BEFORE the piece that fixes it — a fix that arrives first leaves
nothing red to prove the bug was ever real.

## Reproduce before you plan the fix

**Your job is to establish WHERE the bug actually lives.** A plan written off the report names the
file the symptom is VISIBLE in, and that is routinely not the file the defect is in — a wrong row
count rendered by a widget whose real cause is the transformer feeding it. Trace symptom → wire →
contract with \`discover\`, \`get-project-map({ packages: [...] })\` and \`Read\`, reading the real
code at every hop, and stop only when you can name a \`file:line\` and say why it produces the symptom.

**You may spike to find out, and on this discipline the spike is diagnostic rather than net-new.**
Drive the repro, add a temporary \`process.stderr.write\` probe, write a throwaway assertion — do it
YOURSELF rather than spawning for it: a sub-agent's conclusion about where a bug lives is exactly
the conclusion no gate downstream ever re-reads. Leave what you learned in the piece's \`notes\` —
the observed values, the \`file:line\` where the path diverges — and remove any probe you added to
product code before you finish. A worker forced to re-derive the root cause spends its whole turn on
your job instead of its own.

If the trace shows the report is wrong about the symptom, plan against what you OBSERVED and name
both readings in \`DECISIONS FOR YOU\`.

## Every piece names its observable verbatim and its test layer

A piece here is not done when a file exists; it is done when a named invariant is TRUE.

- **\`unitIds\`** carries the \`id\` of every \`EXPECTED:\` observable the piece makes true. A piece
  with no observable id is a piece nobody can grade — say in \`notes\` why it exists (a fixture two
  tests share, a contract the fix needs first).
- **\`intent\`** quotes that observable's \`description\` VERBATIM, not a paraphrase. The worker
  asserts the words the user approved; a paraphrase is how a test ends up asserting something
  adjacent that was merely easier to assert.
- **\`notes\`** names the LAYER the reproducing test belongs at, and why. The observable's \`type\`
  decides it: \`ui-state\` — or an \`api-call\` the user only observes through a browser — means a
  Playwright \`*.e2e.ts\` colocated in the entry flow's folder of a \`frontend-react\` /
  \`frontend-ink\` package (\`./packages/<ui-pkg>/src/flows/<route>/<feature>.e2e.ts\`); every other
  type means a unit or integration test alongside the implementation. Default to e2e for any "I
  don't see X in the UI" report. **On THIS discipline the worker writes the \`.e2e.ts\` itself** — a
  browser-only symptom has no other honest reproduction — so put that path in the piece's \`files\`.
- **\`files\`** must also carry the implementation file you traced the cause to, so the worker fixes
  where the defect IS rather than where it shows.`,

  workerMarkdown: `You are fixing a REPORTED BUG. The product code your piece targets already exists and already runs;
what is wrong is what it DOES. That inverts the usual red step — there is nothing to shell out, and
the red you must witness is the real system misbehaving on unchanged source.

The invariant your piece makes true is an \`EXPECTED:\` observable your brief quotes verbatim from
the quest's bug flow. Assert THAT sentence — the outcome the user approved — never an intermediate
cause you found on the way to it. One observable, one test.

## 1. Write the failing test FIRST — before you open the implementation

Not "before you edit it": before you plan the edit. A fix already formed in your head selects an
assertion that fits the FIX rather than the BUG.

The layer comes from your brief, not from convenience — a Playwright \`*.e2e.ts\` colocated in the
entry flow's folder of the UI package for anything the user only sees through a browser, a unit or
integration test alongside the implementation for everything else. **Writing that \`.e2e.ts\`
yourself is part of this discipline**, unlike disciplines that must leave Playwright specs alone: a
browser-only symptom has no other honest reproduction. For an e2e, the walk that reproduces the bug
is the flow's path from its \`entryPoint\` to its \`ACTUAL:\` terminal — drive those exact steps, and
never shortcut them by writing state the UI is supposed to write.

## 2. Watch it fail for the RIGHT REASON — this is the whole gate

Run it against UNCHANGED source and **read the failure output**, then answer both of these:

- Does the failure come from YOUR ASSERTION, on the line that asserts the observable?
- Does the actual value it prints match the \`ACTUAL:\` symptom the report describes? An empty panel
  where the report says "empty panel"; two rows where the report says "one row per file".

**A test that fails on an import error, a typo, a missing fixture, a selector that matches nothing,
a timeout reached before the assertion, or a setup that throws is NOT a reproduction.** It proves
nothing about the product, and the fix that "makes it pass" fixes the TEST rather than the bug. This
is the most expensive mistake available on this discipline: everything downstream — your parent's
commit, the ward gate, the quest's own completion — then reads green, and no later session re-checks
it.

When the red is structural, the TEST is broken, not the implementation. Repair the test setup and
run it again. Keep going until the red is an ASSERTION red whose actual value IS the reported
symptom.

**Capture that output.** The failing line and the actual-vs-expected values go in your return under
\`GOTCHAS\`. Your reviewer re-derives whether the red was the right red, and it cannot do that from
"it failed".

## 3. Only now, fix it

Apply the NARROWEST change that makes the observable true at its real cause — the file your brief
names, which is where the defect is rather than where it shows. Resist the rewrite: a refactor that
happens to make the test pass hides which line was actually wrong from every later reader, and on
this quest type nothing re-reviews it. If the honest fix is genuinely bigger than your piece, say so
in \`UNFIXABLE\` with what you found rather than half-landing it.

Delete every temporary \`process.stderr.write\` probe you added while diagnosing.

## 4. Watch it pass, then ripple-check

Re-run the SAME invocation and confirm it passes for the right reason too — a test that now passes
because you loosened it certifies the bug. Then find every OTHER place the logic you changed runs:
the function's other callers, the sibling surface rendering the same value, another bug flow on this
quest whose repro crosses the same file. Run their tests as well, and name in \`GOTCHAS\` which ones
you checked. A one-line fix with an unchecked ripple is how one bug becomes two.

If you cannot reproduce the bug as described at all, that is a FINDING, not a failure: leave the
diagnostic test on disk, put exactly what you drove and what you observed in \`RESULT\` and
\`GOTCHAS\`, and let your parent route it. Never report a red you did not see.`,

  reviewerMarkdown: `This round fixed reported BUGS on a bug-hunt quest, whose spec is ONE FLOW PER BUG: each flow forks
at its divergence into a terminal labelled \`ACTUAL: <symptom today>\` and one labelled
\`EXPECTED: <what the fix must make real>\`, and the observables on the EXPECTED terminal — never on
the ACTUAL one — are the invariants this round had to make true. Read them yourself with
\`get-quest({ questId: 'QUEST_ID' })\`. They are your denominator.

**Nothing runs behind this discipline.** The relay tail on a bug-hunt quest is
\`ward(changed) → ward(full)\` and nothing else — no flow-test role, no browser walk, no manual QA —
and there is no sign-off track here, so \`signal-back\` recomputes no denominator and refuses no
\`done\`. On every other discipline you are one reading among several. Here you are the only thing
standing between a false green and a shipped bug.

## 1. Coverage — one test per \`EXPECTED:\` observable, as a set difference

Enumerate every \`EXPECTED:\` observable id across every flow on the quest, then find the test that
asserts each. Anything unmatched is a \`REMAINDER\` line naming that observable id. An observable
"covered" by a test that asserts an intermediate cause instead of the observable's own
\`description\` is ALSO unmatched.

## 2. Was the red real — re-derive it, never take it

**A worker's return reports \`WARD: green|red\` and says nothing about WHICH red it saw.** So "I
watched it fail first" is unverified by construction, and it is the claim this whole discipline
rests on. Re-derive it from the test itself:

- Does its assertion target the observable's own words?
- Would it have failed on the pre-fix code for a reason ARISING FROM THE PRODUCT — a wrong value, a
  missing element — rather than an import error, a typo, a missing fixture, a selector matching
  nothing, or a timeout before the assertion was reached? A structural red reproduced nothing, and
  the fix under it fixed the test.
- Does the value it would have reported match the \`ACTUAL:\` symptom the bug report describes?

## 3. The mutation check — here it IS the verdict

For every test this round added: **revert the fix and confirm the test fails.** Restore the old
expression, flip the condition back, comment the changed line out — run it, watch it go red for the
right reason, then restore the fix and watch it pass again. Do this per bug.

Elsewhere a mutation check is one signal among several. Here it is the ENTIRE proof that a
reproduction ever happened, because a bug-hunt test that would pass against the BROKEN code is
indistinguishable — from the outside, in a green run — from one that proves the fix. A test that
survives the revert is a \`REMAINDER\`, not a \`PIECES: accept\`.

## 4. Is the fix the NARROWEST one that closes the bug?

Read the diff against the root cause. A rewrite, a refactor, a new abstraction or a broadened
signature that happens to make the test pass is a finding: it enlarges the blast radius on the one
quest type where nothing re-verifies it, and it hides which line was actually wrong from every later
reader. Name the minimal change that would have done.

The opposite failure is a fix at the wrong DEPTH — patched where the symptom renders rather than
where the value goes wrong. Ask whether another caller can still reach the same defect.

## 5. Did the ripple get checked?

Find every other place the changed logic runs — the other callers, the sibling surface rendering the
same value, another bug flow on this quest whose repro crosses the same file — and check them
yourself. A worker sees one piece; you see the round.

## 6. The reported symptom is the acceptance target

Last, go back to the source: **re-read \`userRequest\`, the bug report in the user's own words, and
confirm the test asserts THAT** — not something adjacent that was easier to assert. Tests drift that
way on their own. A report saying "one row per quest file on disk" is satisfied only by an assertion
on the ROW COUNT against the file count; an assertion that some row renders the right text passes
happily while the reported bug is fully intact. Where the test asserts something adjacent, that is a
\`REMAINDER\` — and quote BOTH sentences, what the user said and what the test checks, so the next
round cannot argue it away.

## Sign-offs: there is no track on this discipline

No \`flowriderSignoff\`, no \`siegemasterSignoff\`, no completion gate. Report
\`SIGNOFFS WRITTEN: 0 (no track on this discipline)\` rather than dropping the field, and let
\`REMAINDER\` carry the entire outcome — it is the only channel that survives you. (The per-unit
dispositions the standing concerns ask for are a different record; you still write those.)`,
} as const;
