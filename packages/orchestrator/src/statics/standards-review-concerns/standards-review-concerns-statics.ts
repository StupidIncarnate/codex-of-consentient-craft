/**
 * PURPOSE: Holds the five standing review concerns — craft, perf, dedup, integrity, test-cases —
 * that a reviewer takes against whatever its round produced. It also holds the disposition
 * vocabulary the reviewer records them under. Use this rather than writing the concerns into a
 * discipline pack. The five are DISCIPLINE-INDEPENDENT, so a pack-local copy drifts from the rest.
 *
 * USAGE:
 * standardsReviewConcernsStatics.markdown;
 * // Returns the concerns block `reviewer-minion-statics` interpolates beside its `$DISCIPLINE` slot
 *
 * WHY NOT ONE COPY PER DISCIPLINE PACK. Craft, perf, dedup, integrity and test-cases read the same
 * against implementation, integration tests, Playwright specs and a manual-QA walk's fixes. None of
 * the five names a discipline. A concern you sharpen for one discipline goes wrong for the other
 * four. You would also edit five copies every time a duplicate detector changes what it finds, or
 * `get-blight-checklist` starts withholding a concern. Any copy you forget to edit keeps serving
 * its old wording to the next agent.
 *
 * WHY NOT INLINE IN THE REVIEWER TEMPLATE. That template carries a method plus a return block other
 * agents parse. This block carries subject matter. It also moves on its own schedule: a concern's
 * wording changes when the tooling under it changes, not when the reviewer's method does. This file
 * splits the way `flow-evidence-contract-statics` splits, so each half gets a colocated test over
 * its own content. Neither test has to reach through a template that also carries a wire contract.
 *
 * WHY A SUB-AGENT CARRIES THESE RATHER THAN A SESSION OF THEIR OWN. A standards review dispatched
 * as its own session pays a full preamble on every pass. One quest spent 13 sessions, 718 turns and
 * ~370k tokens of preamble that way. Those sessions produced three cosmetic changes. The reviewer
 * already has the files open, so no second session has to load them again.
 */

export const standardsReviewConcernsStatics = {
  markdown: `## The standing concerns

These five concerns are yours every round, whatever your discipline says.

Your discipline above and the five concerns below are ONE reading, not two passes. Open each file
once. Take all five against it before you move to the next.

Skip every mechanical rule. Lint already enforces all of them. Skip pure syntactic test structure
too, for the same reason.

| What you skip | The rules lint already enforces |
|---|---|
| Mechanical rules | naming, imports, exports, destructuring, return types, no-any, proxy colocation, stub usage, no-console, silent catches, unused and unreachable code |
| Pure syntactic test structure | name prefixes, \`{input} => {expected}\` titles, \`describe\` shape |

What is left is the judgement a linter cannot make.

**Your surface is the files THIS ROUND produced.** Enumerate it at your method's ENUMERATE step.
Commit your own fixes before you enumerate, never after.

\`\`\`
get-blight-checklist({ questId: 'QUEST_ID', scope: 'unpushed' })
\`\`\`

The tool returns one unit per implementation file crossed with one concern.

| In the checklist | What it means |
|---|---|
| \`<implPath>:<concern>\` | the id of one unit |
| \`[x]\` | that unit already carries a disposition |
| \`[ ]\` | that unit is still remaining |

The ids are DERIVED from the tree, so the tool reproduces them byte-identically on every run.

**\`scope: 'unpushed'\` is the only correct scope for you. You must pass it.** It measures
everything committed in this worktree and not yet pushed. That is the SAME boundary your OWN
\`npm run ward -- --staged\` used, because you have not pushed yet — you push as your LAST act, after
the verdict commit. You pass no id. You name no range. Git already knows where the round began.

Each of the other three scopes fails you in its own direction.

| Scope | What it hands you instead |
|---|---|
| \`working-tree\` | NOTHING. You committed the whole round yourself, at the step before this one. |
| \`commit\` | the last commit alone, one chunk out of the round's several |
| \`quest\` | every file every session has ever touched. That buries this round in work already dispositioned. |

**There is ONE exception: \`SCOPE: quest\`.** Your brief says so in as many words. That brief is the
post-push re-review. There, \`unpushed\` is empty. An empty scope dispositions nothing. \`quest\`
over-reports instead: units already dispositioned come back marked done. You re-read those rather
than miss a new one. \`quest\` is also the only agent-facing scope that still spans a pushed round.

### craft

- **Logic vs signature.** Read these three, in this order:

  1. the name
  2. the parameter and return contracts
  3. the body

  Judge whether the three agree. A \`findLatest\` that returns the first match is a finding.
- **Useful error context.** A thrown error naming no path, no id and no upstream cause leaves the
  next reader nothing to act on.
- **PURPOSE header vs body.** Lint checks that the header EXISTS. Nothing checks that it is TRUE.
  No test and no typecheck reads a comment. So a header written before the body is false in the
  round that wrote the code. \`discover --verbose\` then serves it as that file's primary
  description to every later agent. Four shapes to flag:

  1. a return-shape claim the code contradicts
  2. a validation claim the contract does not make
  3. a claim derived from the NAME rather than the body
  4. a PURPOSE that only restates the signature

  For shape 2, read the zod chain itself. Read what each \`.refine()\` tests. Never take the
  \`.refine()\` message as the claim. Correct the PURPOSE to what the code does NOW. Never change the
  code to match the comment, unless the code is independently wrong on its own terms. A PURPOSE must
  not carry return shapes, throw behaviour, or parameter types. All of that is derivable, so all of
  it drifts.

### perf

Flag four shapes:

1. **Quadratic loops** — \`.filter(... .find(...))\`, a loop over A with an inner \`.find\` on B,
   repeated \`indexOf\`/\`includes\` inside a loop.
2. **N+1** — a per-item \`await\` on a DB/HTTP/filesystem call that could batch.
3. **Sync I/O in async code** — \`readFileSync\` or \`execSync\` on a hot path.
4. **Unbounded work** — a loop with no cap, scanning or accumulating caller-supplied or on-disk
   data. A function that recurses with no depth bound over data you do not control counts too.

Plus **simplification**: does the code say the same thing more directly? Look for four more shapes:

1. an abstraction nothing needs
2. a generalization written too early
3. a conditional chain that flattens to one expression
4. a hand-rolled scan where a \`Map\`/\`Set\` lookup does the same work in one pass

Simplification sits under perf rather than under craft because you read the code once for both.

**Judge the hot path.**

| What you are reading | Is it a finding? |
|---|---|
| a request, websocket or orchestration path | likely |
| a startup, migration or one-off path | usually not |
| an array bounded to a small constant | usually not |

### dedup

- **Against existing repo code** — new code reimplementing something that already exists.
- **Within this round** — two new files here doing the same work under different names.

**Search REPO-WIDE, never within the round's own files.** If you scope the search to what this
round changed, two sessions ship the same function twice. The earlier one is already on disk. A
repo-wide \`discover\` grep from here sees it. A scoped grep never can.

This repo's duplicate detector at \`packages/tooling/src/brokers/duplicate-detection/\` finds
duplicate **string and regex literals ONLY**. It compares no AST shapes at all. So a clean run from
it says nothing about the duplicate code you are looking for. Structural duplication is YOUR
judgement. Show your work. Name both implementations. State what you compared: parameters, return
shapes, control flow. Never report that the text looked similar.

### integrity

A signature sweep re-reads every consumer of a changed export to check it still compiles.
**Skip that sweep entirely.** \`ward\` and \`tsc\` already catch every consumer that stops COMPILING.
What you own is the change that typechecks and still MEANS something different:

- **Semantic change behind an unchanged signature** — same parameters, same return type, different
  meaning. The meaning that moved is units, ordering, whether a bound is inclusive, what an empty
  array now signifies, or which of two equally-typed ids a caller must pass. \`discover\` grep the
  export name to enumerate consumers across the monorepo. Then read each call site against the NEW
  meaning.
- **Stubs and fixtures that keep a suite green** instead of encoding the new behaviour. Read the
  contracts in \`@dungeonmaster/shared\` hardest of all. Their branded types break their consumers
  silently at parse time. A \`.default(...)\` papering over a break may itself be the defect.

### test-cases

**Did every branch this round ADDED get a test at all?** Walk the new and changed control flow:
each \`if\`/\`else\`, each \`switch\` arm, each ternary, each optional chain, each \`try\`/\`catch\`, each
early return. Ask whether a test exercises it. This is the narrowest question the round's own files
can answer without leaving them. Did the conditional written here get a case at all? A branch with
no case is a finding, whether or not some higher-level observable covers it. It is also cheapest to
catch now, in the round that introduced it.

Judge the assertion too, not just its presence. A test that asserts \`rendered\` or \`was called\`
proves nothing. It counts as NO case. Write the missing case yourself where you can.

### Dead code is NOT one of your concerns

Do not go hunting orphans. Whether an export has a consumer is a property of the whole import graph
AFTER every later round lands. You cannot answer that from inside one round. Deleting an export
while you fix something else is fine. It is still not a unit you owe a disposition on.

### Two concerns are withheld from declaration-shaped files

The checklist itself withholds \`perf\` and \`integrity\` from declaration-shaped files:
\`*-contract.ts\`, \`*.stub.ts\`, \`*.proxy.ts\`, test/e2e/harness files, and barrels.
\`blight-concern-gating-statics.ts\` holds that rule.

**When those two units do not appear for such a file, the tool withheld them deliberately.** Do not
review them anyway. Do not record their absence as a gap.

A count backs that rule, not a guess. Across 88 review units of exactly that file mix, \`perf\` and
\`integrity\` produced ZERO findings. That ZERO comes from the question itself. \`perf\` against a
zod schema asks whether a declaration has a quadratic loop. \`integrity\` against a brand-new file
asks whether its changed exports still mean to consumers what they did. The only consumer arrives
in the same round. Neither question can come back with anything but "n/a".

The other three concerns apply to those files in full.

| Concern | What it can still find in a declaration-shaped file |
|---|---|
| \`craft\` | a \`.refine\` message that is wrong |
| \`dedup\` | a second contract duplicating the first |
| \`test-cases\` | a branch added to a proxy or a stub, shipping with no case |

## Record a disposition for every unit

| Disposition | Means |
|---|---|
| \`reviewed\` | you checked the concern against this unit. It holds. |
| \`fixed\` | you found a real defect here. You corrected it in place. |
| \`routed\` | a real finding needing a decision this round cannot make. Name it in your \`NEXT: rework\` line, or it goes nowhere. |
| \`recorded\` | you handed a real finding to a named owner outside this quest. It is not closed this round. |
| \`gap\` | no one can assess the concern at this layer. Say precisely why. |

**You have no way to ask the user anything.** You are a sub-agent inside your parent's turn. No
human sees your questions. Nothing resumes you with an answer. Answer your own question, or hand it
up in \`NEXT: rework\`.

**Every one of these clears a unit.** \`gap\` and \`recorded\` are honest answers, so you can always
complete the record truthfully. A unit with NO entry at all is never acceptable. This is not a style
note. The completion gate recomputes this ledger against everything your parent's work item
committed. It REFUSES your parent's \`done\` while any unit carries no entry. A unit you skip stops
your parent's session from ending.

**These dispositions are the one thing you do NOT batch.** Write each one immediately after you
finish that concern for that file. A session that dies at file four otherwise loses every
disposition it earned. Nothing behind you re-derives them.

\`\`\`
modify-quest({ questId: 'QUEST_ID', planningNotes: { blightLedger: [
  { itemId: '<unit id from the checklist>', disposition: 'reviewed'|'fixed'|'routed'|'recorded'|'gap',
    evidence: '<the concrete thing observed — never an adjective>',
    observedBy: 'reviewer-minion', workItemId: '<the work item id your briefing names>' }
]}})
\`\`\`

Two dispositions carry one extra field each.

| Disposition | Extra field |
|---|---|
| \`fixed\` | \`rippleSites\` |
| \`recorded\` | \`owner\` |

Write no timestamp field. The server stamps the time. It ignores any value you supply.`,
} as const;
