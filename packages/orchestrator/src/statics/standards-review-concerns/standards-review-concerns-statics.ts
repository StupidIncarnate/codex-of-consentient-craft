/**
 * PURPOSE: Holds the five standing review concerns — craft, perf, dedup, integrity, test-cases —
 * that a reviewer takes against whatever its round produced. It also holds the disposition
 * vocabulary the reviewer records them under. Use this rather than writing the concerns into a
 * role's own reviewer prompt. The five are ROLE-INDEPENDENT, so a per-prompt copy drifts from the
 * rest.
 *
 * USAGE:
 * standardsReviewConcernsStatics.markdown;
 * // Returns the concerns block each of the five `<role>-reviewer-minion-statics` prompts
 * // interpolates whole — codeweaver, pesteater, flowrider, groundstomper and siegemaster
 *
 * WHY NOT ONE COPY PER REVIEWER PROMPT. Craft, perf, dedup, integrity and test-cases read the same
 * against implementation, integration tests, Playwright specs and a manual-QA walk's fixes. None of
 * the five names one role's subject matter. A concern you sharpen for one role goes wrong for the
 * other four. You would also edit five copies every time a duplicate detector changes what it finds,
 * or `get-blight-checklist` starts withholding a concern. Any copy you forget to edit keeps serving
 * its old wording to the next agent.
 *
 * WHY NOT INLINE IN EACH REVIEWER PROMPT. Those prompts carry a method plus a return block other
 * agents parse. This block carries subject matter. It also moves on its own schedule: a concern's
 * wording changes when the tooling under it changes, not when a reviewer's method does. This file
 * splits the way `flow-evidence-contract-statics` splits, so the block gets a colocated test over
 * its own content — one that does not have to reach through a prompt also carrying a wire contract.
 * That test is the ONLY one over this text: none of the five reviewer prompts has a colocated test
 * of its own.
 *
 * WHY A SUB-AGENT CARRIES THESE RATHER THAN A SESSION OF THEIR OWN. A standards review dispatched
 * as its own session pays a full preamble on every pass. One quest spent 13 sessions, 718 turns and
 * ~370k tokens of preamble that way. Those sessions produced three cosmetic changes. The reviewer
 * already has the files open, so no second session has to load them again.
 *
 * BUDGET: five reviewer prompts interpolate this block WHOLE, so one character here is five
 * characters served, and four of the five clear `mcpToolResultStatics.maxVerbatimChars` by only two
 * to four thousand characters — siegemaster tightest, then pesteater, flowrider and groundstomper,
 * with only codeweaver's margin comfortable. Those margins shrink on every edit to a reviewer
 * prompt, so measure `<role>ReviewerMinionStatics.prompt.template.length` against 50,000 rather than
 * trusting a figure written here. Over that ceiling the MCP layer
 * writes the prompt to a file and hands the agent an error stub instead of its instructions — a
 * silent dispatch failure. Every sentence in the served
 * text must therefore change what a reader DOES; rationale that only explains why a rule is right
 * belongs down here, where it costs the five readers nothing.
 *
 * THE FLOOR IS ABOUT 8.8k, AND THE COLOCATED TEST IS WHY. It pins ~5.8k of the served text as exact
 * substring needles, and what is left over is section headings the heading-list assertion requires,
 * table headers, the four concern-defining lists, and the grammatical glue joining one pinned
 * sentence to the next. A trim below that is a rule, a disposition value, a concern or a measured
 * rationale coming out — measure before promising a number. What the trim from 10.5k to 8.8k
 * moved down:
 *
 * - THE CHECKLIST IDS ARE DERIVED FROM THE TREE, so every run reproduces them byte-identically.
 *   That is why a reviewer never invents or normalizes an id — but the derivation changes nothing
 *   a reviewer DOES, so the served text just states the id grammar.
 * - `scope: 'working-tree'` TAKES NO ID AND NO RANGE because the round is simply what is uncommitted:
 *   the reviewer's own push is the boundary, and git maintains `@{upstream}..HEAD` for it.
 * - SIMPLIFICATION SITS UNDER `perf` RATHER THAN `craft` because the reader takes both against one
 *   reading of the file; which heading it lives under changes nothing about the finding.
 * - A MISSING TEST CASE IS CHEAPEST TO CATCH in the round that introduced the branch, which is why
 *   `test-cases` is a standing concern rather than a later role's sweep.
 * - A PURPOSE CARRYING RETURN SHAPES, THROW BEHAVIOUR OR PARAMETER TYPES drifts because all three
 *   are derivable from the code beneath it. The rule survives in the served text; the reason is here.
 * - `integrity` AGAINST A BRAND-NEW FILE asks whether its changed exports still mean to consumers
 *   what they did, when the only consumer arrives in the same round — the second half of why the
 *   gating's measured ZERO is a property of the QUESTION. The served text keeps the `perf` half,
 *   which is the shorter and the more obviously vacuous of the two.
 * - THE OTHER THREE CONCERNS ON A DECLARATION-SHAPED FILE each have a worked instance: `craft` finds
 *   a `.refine` message that is wrong, `dedup` a second contract duplicating the first. The served
 *   text keeps only the `test-cases` one, because that is the concern a reviewer is likeliest to
 *   read as inapplicable to a stub or a proxy.
 */

export const standardsReviewConcernsStatics = {
  markdown: `## The standing concerns

**The per-file questions your own prompt sets, and the five concerns below, are ONE reading**: open
each file once and take them all against it before you move to the next.

Skip every mechanical rule, and pure syntactic test structure with it. Lint already enforces both.
Mechanical: naming, imports, exports, destructuring, return types, no-any, proxy colocation, stub
usage, no-console, silent catches, unused and unreachable code. Structure: name prefixes,
\`{input} => {expected}\` titles, \`describe\` shape. What is left is the judgement a linter cannot make.

**Your surface is the files THIS ROUND produced, and they are UNCOMMITTED when you enumerate.** No
worker commits anything, so the whole round sits in the working tree until you commit it — which you
do once, after this enumeration and after the records it produces.

\`\`\`
get-blight-checklist({ questId: 'QUEST_ID', scope: 'working-tree' })
\`\`\`

\`<implPath>:<concern>\` is the id of one unit — one implementation file crossed with one concern.

**On a whole-round brief, \`scope: 'working-tree'\` is the only correct scope and you must pass it.**
It measures everything changed since \`HEAD\` and not yet committed, **including untracked files** —
and a round is mostly net-new files, which no \`git diff\` reports at all. You pass no id and name no
range.

| Scope | What it hands you instead |
|---|---|
| \`unpushed\` | the PLAN COMMIT and nothing else — your planner committed the round document, and no worker committed a line of code |
| \`commit\` | that same plan commit, alone |
| \`quest\` | every file every session has ever touched, already dispositioned |

**Enumerate BEFORE you commit, never after.** Once you commit, \`working-tree\` is empty and this
call dispositions nothing.

**There is ONE exception, and you know it by the brief line \`SECTION: Re-review\`.** That brief is
the post-push re-review, where the round is long since committed and the working tree is clean, so
you pass \`scope: 'quest'\` instead. It over-reports — units earlier rounds dispositioned come back
marked done — and it is the only agent-facing scope that still spans a pushed round. **Your own
prompt names the step that makes the call.**

### craft

- **Logic vs signature.** Read the name, then the parameter and return contracts, then the body, and
  judge whether the three agree. A \`findLatest\` that returns the first match is a finding.
- **Useful error context.** A thrown error naming no path, no id and no upstream cause leaves the
  next reader nothing to act on.
- **PURPOSE header vs body.** Lint checks the header EXISTS; nothing checks it is TRUE, because no
  test and no typecheck reads a comment. A false header is not inert: \`discover --verbose\` then
  serves it as that file's primary description to every later agent. Four shapes to flag: (1) a
  return-shape claim the code contradicts; (2) a validation claim the contract does not make; (3) a
  claim derived from the NAME rather than the body; (4) a PURPOSE that only restates the signature.
  For shape 2, read the zod chain itself and what each \`.refine()\` tests; never take the
  \`.refine()\` message as the claim. Correct the PURPOSE to what the code does NOW, never the code
  to match the comment unless the code is independently wrong. Keep return shapes, throws and
  parameter types out of a PURPOSE.

### perf

Flag four shapes:

1. **Quadratic loops** — \`.filter(... .find(...))\`, repeated \`indexOf\`/\`includes\` in a loop.
2. **N+1** — a per-item \`await\` on a DB/HTTP/filesystem call that could batch.
3. **Sync I/O in async code** — \`readFileSync\` or \`execSync\` on a hot path.
4. **Unbounded work** — a loop or a recursion with no cap over caller-supplied or on-disk data.

Plus **simplification**: an abstraction nothing needs, a conditional chain that flattens to one
expression, a hand-rolled scan where a \`Map\`/\`Set\` lookup does it in one pass.

**Judge the hot path.**

| What you are reading | Is it a finding? |
|---|---|
| a request, websocket or orchestration path | likely |
| a startup, migration or one-off path | usually not |
| an array bounded to a small constant | usually not |

### dedup

New code reimplementing what the repo already has, or two new files here doing one job under two
names.

**Search REPO-WIDE, never within the round's own files.** Scope your search to the round and two
sessions ship the same function twice: the earlier is already on disk, where only a repo-wide
\`discover\` grep sees it.

This repo's duplicate detector at \`packages/tooling/src/brokers/duplicate-detection/\` finds
duplicate **string and regex literals ONLY** and compares no AST shapes, so a clean run from it says
nothing about the duplicate code you are looking for. Structural duplication is YOUR judgement: name
both implementations and state what you compared — parameters, return shapes, control flow. Never
report that the text looked similar.

### integrity

**Skip the signature sweep entirely** — \`ward\` and \`tsc\` already catch every consumer that stops
COMPILING. What you own is the change that typechecks and still MEANS something different:

- **Semantic change behind an unchanged signature** — same parameters, same return type, different
  meaning: units, ordering, whether a bound is inclusive, what an empty array now signifies.
  \`discover\` grep the export name to enumerate consumers across the monorepo, then read each call
  site against the NEW meaning.
- **Stubs and fixtures that keep a suite green** instead of encoding the new behaviour. Read
  \`@dungeonmaster/shared\`'s contracts hardest: branded types break consumers silently at parse
  time, and a \`.default(...)\` papering over a break may itself be the defect.

### test-cases

**Did every branch this round ADDED get a test at all?** Walk the new and changed control flow —
each \`if\`/\`else\`, each \`switch\` arm, each ternary, each optional chain, each \`try\`/\`catch\`, each
early return — and ask whether a test exercises it. **A branch with no case is a finding**, whether
or not some higher-level observable covers it.

Judge the assertion too, not just its presence. A test that asserts \`rendered\` or \`was called\`
proves nothing and counts as NO case. Write the missing case yourself where you can.

### Dead code is NOT one of your concerns

Do not go hunting orphans. Whether an export has a consumer is a property of the whole import graph
AFTER every later round lands. You cannot answer that from inside one round. Deleting an export
while you fix something else is fine. That deletion is still not a unit you owe a disposition on.

### Two concerns are withheld from declaration-shaped files

The checklist itself withholds \`perf\` and \`integrity\` from declaration-shaped files:
\`*-contract.ts\`, \`*.stub.ts\`, \`*.proxy.ts\`, test/e2e/harness files, and barrels.
\`blight-concern-gating-statics.ts\` holds that rule.

**When those two units do not appear for such a file, the tool withheld them deliberately.** Do not
review them anyway, and do not record their absence as a gap. Across 88 review units of exactly that
file mix, \`perf\` and \`integrity\` produced ZERO findings. That ZERO comes from the question itself:
\`perf\` against a zod schema asks whether a declaration has a quadratic loop.

The other three concerns apply to those files in full. \`test-cases\` alone still finds a branch
added to a proxy or a stub that ships with no case.

## Record a disposition for every unit

| Disposition | Means |
|---|---|
| \`reviewed\` | you checked the concern against this unit. It holds. |
| \`fixed\` | you found a real defect here. You corrected it in place. |
| \`routed\` | a real finding needing a decision this round cannot make. Name it in your \`NEXT: rework\` line, or no later session ever acts on it. |
| \`recorded\` | you handed a real finding to a named owner outside this quest. It is not closed this round. |
| \`gap\` | no one can assess the concern at this layer. Say precisely why. |

**You have no way to ask the user anything.** You are a sub-agent inside your parent's turn, so no
human sees your questions and nothing resumes you with an answer. Answer your own question, or hand
it up in \`NEXT: rework\`.

**Every one of these dispositions clears a unit**, \`gap\` and \`recorded\` included, so you can
always complete the record truthfully. **A unit with NO entry is never acceptable**: the completion
gate recomputes this ledger against everything your parent's work item committed and REFUSES your
parent's \`done\` while any unit carries no entry, so a unit you skip stops your parent's session
from ending.

**These dispositions are the one thing you do NOT batch.** Write each one immediately after you
finish that concern for that file. A session that dies at file four otherwise loses every
disposition it recorded, and nothing behind you re-derives them.

\`\`\`
modify-quest({ questId: 'QUEST_ID', planningNotes: { blightLedger: [
  { itemId: '<unit id from the checklist>', disposition: 'reviewed'|'fixed'|'routed'|'recorded'|'gap',
    evidence: '<the concrete thing observed — never an adjective>',
    observedBy: 'reviewer-minion', workItemId: '<the work item id your briefing names>' }
]}})
\`\`\`

| Disposition | Extra field |
|---|---|
| \`fixed\` | \`rippleSites\` |
| \`recorded\` | \`owner\` |

Write no timestamp field. The server stamps the time. It ignores any value you supply.`,
} as const;
