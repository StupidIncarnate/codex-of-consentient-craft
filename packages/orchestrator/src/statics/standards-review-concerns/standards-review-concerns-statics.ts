/**
 * PURPOSE: The five standing review concerns — craft, perf, dedup, integrity, test-cases — that a
 * reviewer takes against whatever its round produced, plus the disposition vocabulary it records
 * them under. Reach for this over writing the concerns into a discipline pack: they are
 * DISCIPLINE-INDEPENDENT, so a pack-local copy is a copy that drifts.
 *
 * USAGE:
 * standardsReviewConcernsStatics.markdown;
 * // Returns the concerns block `reviewer-minion-statics` interpolates beside its `$DISCIPLINE` slot
 *
 * WHY NOT ONE COPY PER DISCIPLINE PACK. Craft, perf, dedup, integrity and test-cases read the same
 * against implementation, integration tests, Playwright specs and a manual-QA walk's fixes alike;
 * nothing in any of the five names a discipline, and none of them can be sharpened for one without
 * being wrong for the other four. Five copies would be five edits every time the duplicate
 * detector's limits change or a concern is gated at the checklist level, and the copy nobody
 * remembered is the one an agent reads.
 *
 * WHY NOT INLINE IN THE REVIEWER TEMPLATE. That template's job is method and a return block other
 * agents parse; this block is subject matter, edited on its own cadence — a concern's wording moves
 * when the tooling under it moves, not when the reviewer's method does. Split the way
 * `flow-evidence-contract-statics` is split, each half gets a colocated test that asserts its own
 * content rather than reaching through a template that also carries a wire contract.
 *
 * WHY A SUB-AGENT CARRIES THESE RATHER THAN A SESSION OF THEIR OWN. A standards review dispatched
 * as its own session pays a full preamble for every pass: measured at 13 sessions, 718 turns and
 * ~370k tokens of preamble to produce three cosmetic changes on one quest. The concerns are cheap;
 * the session around them is not, and the reviewer is already open in the files.
 */

export const standardsReviewConcernsStatics = {
  markdown: `## The standing concerns — every round, whatever your discipline says

Your discipline above and the five concerns below are ONE reading, not two passes. Open a file once
and take all five against it before you move to the next.

Lint already enforces every mechanical rule — naming, imports, exports, destructuring, return types,
no-any, proxy colocation, stub usage, no-console, silent catches, unused and unreachable code — and
pure syntactic test structure (name prefixes, \`{input} => {expected}\` titles, \`describe\` shape) is
lint's domain too. Skip ALL of it. What is left is the judgement a linter cannot make.

**Your surface is the files THIS ROUND produced** — the ones your brief names. Confirm that list,
and decompose it into atomic review units, with:

\`\`\`
get-blight-checklist({ questId: 'QUEST_ID', scope: 'working-tree' })
\`\`\`

Each unit is id'd \`<implPath>:<concern>\` and marked \`[x]\` dispositioned or \`[ ]\` remaining. The ids
are DERIVED from the tree, so re-running the tool reproduces them byte-identically.

**\`scope: 'working-tree'\` is the only correct scope for you, and you must pass it.** It means
changed since HEAD, untracked files INCLUDED. Your parent has not committed yet when you run, so
nothing you are reviewing is in history: a commit-shaped reading hands you the round BEFORE yours,
and every form of \`git diff\` reports tracked paths only — which on a fresh round hides most of what
was just written, and is exactly where a defect hides.

### craft

- **Logic vs signature.** Read the name, read the parameter and return contracts, then read the body
  and judge whether the three agree. A \`findLatest\` that returns the first match is a finding.
- **Useful error context.** A thrown error naming no path, no id and no upstream cause leaves the
  next reader nothing to act on.
- **PURPOSE header vs body.** Lint checks the header EXISTS, never that it is TRUE, and no test or
  typecheck reads a comment — so a header written before the body is false in the same round that
  wrote the code, and \`discover --verbose\` then serves it as that file's primary description to
  every later agent. Four shapes to flag: a return-shape claim the code contradicts; a validation
  claim the contract does not make (read the zod chain and what each \`.refine()\` tests, not what its
  message says); a claim derived from the NAME rather than the body; and a PURPOSE that only
  restates the signature. Correct the PURPOSE to what the code does NOW — never change the code to
  match the comment unless the code is independently wrong on its own terms. A PURPOSE must not
  carry return shapes, throw behaviour, or parameter types; all of that is derivable, so all of it
  drifts.

### perf

Quadratic loops (\`.filter(... .find(...))\`, a loop over A with an inner \`.find\` on B, repeated
\`indexOf\`/\`includes\` inside a loop), N+1 (per-item \`await\` on a DB/HTTP/filesystem call that could
batch), sync I/O in async code (\`readFileSync\`, \`execSync\` on a hot path), and unbounded work (a
scan or accumulation sized by caller-supplied or on-disk data with no cap, recursion with no depth
bound over data you do not control).

Plus **simplification**: can the logic be expressed more directly? Unnecessary abstraction,
premature generalization, a conditional chain that flattens to one expression, a hand-rolled scan
where a \`Map\`/\`Set\` lookup does the same work in one pass. It lives here rather than under craft
because it is the same reading — the shape doing too much work is usually the shape saying too much.

**Judge the hot path.** A request/websocket/orchestration path is a likely finding; a
startup/migration/one-off is usually not; an array bounded to a small constant usually is not.

### dedup

- **Against existing repo code** — new code reimplementing something that already exists.
- **Within this round** — two new files here doing the same work under different names.

**Search REPO-WIDE, never within the round's own files.** Scoping to what this round changed is what
lets two sessions ship the same function twice: the earlier one is already on disk, so a repo-wide
\`discover\` grep from here sees it and a scoped one never can.

This repo's duplicate detector at \`packages/tooling/src/brokers/duplicate-detection/\` finds
duplicate **string and regex literals ONLY** — no AST-shape comparison of any kind — so a clean run
from it says nothing about the duplication you are looking for. Structural duplication is YOUR
judgement and you must show your work: name both implementations and state what you compared —
parameters, return shapes, control flow — never that the text looked similar.

### integrity

\`ward\` and \`tsc\` already catch every consumer that stops COMPILING against a changed export, so
**skip the signature sweep entirely**. What you own is the change that typechecks and still MEANS
something different:

- **Semantic change behind an unchanged signature** — same parameters, same return type, different
  meaning: units, ordering, whether a bound is inclusive, what an empty array now signifies, which
  of two equally-typed ids a caller must pass. \`discover\` grep the export name to enumerate
  consumers across the monorepo, then read each call site against the NEW meaning.
- **Stubs and fixtures that keep a suite green** instead of encoding the new behaviour. Pay special
  attention to contracts in \`@dungeonmaster/shared\` — branded types whose consumers break silently
  at parse time. A \`.default(...)\` papering over a break may itself be the defect.

### test-cases

**Did every branch this round ADDED get a test at all?** Walk the new and changed control flow —
each \`if\`/\`else\`, each \`switch\` arm, each ternary, each optional chain, each \`try\`/\`catch\`, each
early return — and ask whether a test exercises it. This is the narrowest question the round's own
files can answer without leaving them: whether the conditional written here was written with a case
at all. A branch with no case is a finding whether or not some higher-level observable covers it,
and it is cheapest to catch now, in the round that introduced it.

Judge the assertion too, not just its presence: a test that asserts \`rendered\` or \`was called\`
proves nothing and counts as NO case. Where a case is missing and you can write it, write it.

### Dead code is NOT one of your concerns

Whether an export has a consumer is a property of the whole import graph AFTER every later round
lands, which no single-round pass can answer. Do not go hunting orphans. If you delete an export
while fixing something else that is fine, but it is not a unit you owe a disposition on.

### Two concerns are withheld from declaration-shaped files — that is the tool being RIGHT

\`perf\` and \`integrity\` are suppressed at the checklist level for declaration-shaped files —
\`*-contract.ts\`, \`*.stub.ts\`, \`*.proxy.ts\`, test/e2e/harness files, and barrels — by
\`blight-concern-gating-statics.ts\`. **When those two units do not appear for such a file, the tool
withheld them deliberately.** Do not review them anyway, and do not record their absence as a gap.

Measured, not guessed: across 88 review units of exactly that file mix, \`perf\` and \`integrity\`
produced ZERO findings. That is a property of the question. \`perf\` against a zod schema asks whether
a declaration has a quadratic loop; \`integrity\` against a brand-new file asks whether its changed
exports still mean to consumers what they did, when the only consumer arrives in the same round.
Neither can come back with anything but "n/a". The other three concerns apply to those files in
full: a \`.refine\` message can be wrong (\`craft\`), a second contract can duplicate the first
(\`dedup\`), and a branch added to a proxy or a stub can ship with no case (\`test-cases\`).

## Record a disposition for every unit

| Disposition | Means |
|---|---|
| \`reviewed\` | the concern was checked against this unit and holds |
| \`fixed\` | a real defect was found here and corrected in place |
| \`routed\` | a real user-visible defect needing a product decision; asked via \`ask-user-question\` |
| \`recorded\` | a real finding handed to a named owner, not closed this round |
| \`gap\` | the concern cannot be assessed at this layer — say precisely why |

**Every one of these clears a unit.** \`gap\` and \`recorded\` are honest answers, so the record can
always be completed truthfully. What is never acceptable is a unit with NO entry at all.

**These dispositions are the one thing you do NOT batch.** Write each one immediately after you
finish that concern for that file — a session that dies at file four otherwise loses every
disposition it earned, and nothing behind you re-derives them.

\`\`\`
modify-quest({ questId: 'QUEST_ID', planningNotes: { blightLedger: [
  { itemId: '<unit id from the checklist>', disposition: 'reviewed'|'fixed'|'routed'|'recorded'|'gap',
    evidence: '<the concrete thing observed — never an adjective>',
    observedBy: 'reviewer-minion', workItemId: '<the work item id your briefing names>' }
]}})
\`\`\`

\`fixed\` also carries \`rippleSites\`; \`recorded\` also carries \`owner\`. Write no timestamp field —
the server stamps the time and a value you supply is ignored.`,
} as const;
