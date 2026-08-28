/**
 * PURPOSE: The paperwork of one round, exported one block at a time. Four sessions — the holder and
 * its planner, workers and reviewer — read and write one file, and every name they pass through it
 * lives here. Take a block from here rather than writing the names into a prompt: reach for the
 * `## Operating Rules` section of the `*-information` payload that reader fetches when the thing
 * you want is a RULE about how a turn runs, and for a role's own prompt when it is subject matter
 * only that role acts on.
 *
 * USAGE:
 * roundProtocolStatics.chunkFields;
 * // A markdown section, heading included. A prompt interpolates the blocks its reader takes.
 *
 * WHICH PROMPT TAKES WHICH BLOCKS:
 *
 * | Prompt | document | planBlocks | chunkFields | indexes | briefKeys | nextLine | commitSubjects |
 * |---|---|---|---|---|---|---|---|
 * | `<role>-prompt` | yes | — | — | yes | yes | yes | yes |
 * | `<role>-planner-minion` | yes | yes | yes | yes | yes | yes | yes |
 * | `<role>-worker-minion` | yes | — | yes | — | yes | yes | — |
 * | `<role>-reviewer-minion` | yes | yes | yes | yes | yes | yes | yes |
 *
 * The holder takes no `planBlocks` and no `chunkFields` because it never reads either: it takes the
 * two indexes off the document and nothing else, and every question about a chunk's contents belongs
 * to a session that may open a file. It DOES take `commitSubjects`, because that block names the
 * subject its second sweep reviewer commits under. The worker is the one session that takes no
 * `commitSubjects`: it commits nothing, and a subject list it cannot use is a list it might try to.
 *
 * A WRITE-SIDE RULE IS ATTRIBUTED; A READ-SIDE FACT IS NOT. Every block here reaches readers who
 * only READ the thing it describes, so an imperative addressed to whoever WRITES it arrives at three
 * sessions out of four as a command they cannot obey — and a write-side claim arrives at the holder
 * as a falsehood. Name the session that performs the rule, in the third person, and leave the fact
 * the rest of them act on unattributed. `**The planner puts the foundation … in a phase of its own**`
 * reads correctly to all four; `**Put the foundation …**` does not. Same for a literal wording: state
 * it as a wire format (`… in those words, and nothing else parses`) rather than as `write those
 * words`, and the writer still knows to write it while the reader learns what to expect. An audit
 * that read the whole primer once from each of the four chairs found ~55 defects, and nearly every
 * one was this.
 *
 * A BLOCK HERE HOLDS MEANING, NEVER SHAPE. This block says what `TOUCHES` IS and what every entry
 * owes. What one entry LOOKS LIKE is a product file on one role and a walk path on another, so it
 * is written out in that role's own prompt, with a worked example beside it. The same split the
 * three `*-information` payloads use: the rule is shared, the application is not. A block here that
 * needed a per-role clause would be the wrong block. That same split is why an ILLUSTRATION is thin
 * here and thick in the role prompt: the primer costs eight consumers a copy, the example costs one.
 *
 * NOTHING HERE CARRIES `$ARGUMENTS`. Every consuming template is substituted once, after this text is
 * already inside it, so a placeholder written here would be replaced in a prompt that never meant to
 * carry one — and the operation context of one session would land in the middle of another's
 * paperwork. The colocated test pins that.
 *
 * WHY IT EXISTS: the round document used to be described in four generic templates, kept in step by
 * tests that derived one file's needles from another's live text. Splitting those templates per role
 * turned four descriptions into twenty. Twenty copies of one wire format is twenty things to drift,
 * and a drifted name does not error — a worker appends its report under a heading its reviewer is not
 * reading, and the round grades a chunk against nothing.
 *
 * BUDGET: EIGHT consumers interpolate these blocks — the five `<role>-prompt-statics` and the three
 * `*-information` payloads — so one character here is eight characters served. The fifteen minion
 * prompts take none of them directly, and each pins all seven ABSENT. The tightest two consumers are
 * `plannerInformationStatics` and `reviewerInformationStatics`, which take all seven blocks each,
 * and the reviewer's carries the whole standing-concerns block on top. Each served text clears
 * `mcpToolResultStatics.maxVerbatimChars` ON ITS OWN, because a prompt and the payload its first
 * step fetches are two separate tool results. No headroom figure written down here stays true past
 * the next edit to a consumer — measure `plannerInformationStatics.markdown.length` and
 * `reviewerInformationStatics.markdown.length` against 50,000 before adding a sentence. Every
 * sentence in the served text must change what a reader DOES. Rationale that only explains WHY a
 * rule is right belongs down here, where it costs those eight nothing. What the trim from 17.4k to
 * 14.0k moved down:
 *
 * - THE HEREDOC IS QUOTED (`<<'DOC'`) so a `$` or a backtick in an appended section reaches the file
 *   as written rather than being expanded by the shell. The served text keeps the word QUOTED and the
 *   worked fence; this is the reason behind it.
 * - A COMMIT SUBJECT SPELT DIFFERENTLY is a round that reads as somebody else's work, because the
 *   next round's planner reconstructs the item from `git log` bodies matched on these six subjects.
 * - `--allow-empty` MATTERS because a clean round that left no trace in git reads exactly like a
 *   round nobody reviewed.
 * - A MISSING OR EMPTY `NO CHUNK` / `PHASES` / `WAVES` HEADING reads to the reviewer as a block it
 *   failed to parse, and the reviewer then grades the round against a list nobody narrowed. Hence
 *   the literal `none` wordings the served text still demands.
 * - `TOUCHES` IS THE ONLY PLACE the round says what an entry is FOR, so an entry written thinly there
 *   is inherited thinly by every block below it. It is also the DENOMINATOR the reviewer subtracts
 *   from, which is why the served text names it as such where the subtraction is described — the
 *   reviewer is the only session that performs it and was never told what it subtracted from.
 * - `DEPENDS` IS WRITTEN MOST-DEPENDED-ON FIRST because what such a thing must provide is the sum of
 *   what its consumers demand — the completeness check falls out of that order.
 * - TAKING `NO CHUNK` AND THE CHUNKS' `UNITS` OFF THE FULL LIST is how the reviewer computes what the
 *   round left uncovered; the served text states the two write-side rules that arithmetic depends on
 *   rather than the arithmetic four times over.
 * - THE WAVE ARITHMETIC (one past the highest wave among the chunks owning a `needs` link) is stated
 *   as arithmetic so a reviewer can REDO it off `DEPENDS`; the reviewer prompts carry that
 *   instruction themselves.
 * - PHASING THE FOUNDATION ALONE exists so the reviewer at that phase gate catches a wrong
 *   foundation before anything is built on it — the measured failure being a bad contract reaching
 *   the end of a round with three waves on top of it.
 * - A PASTED CHUNK in a brief hides the sibling chunks that say which paths are NOT that worker's,
 *   and can disagree with the document the worker is really working from.
 * - THE `NEXT:` LINE is the only control signal in a return; everything above it is evidence for the
 *   reviewer and for the next round's planner. The served text spends characters on the MISSING-line
 *   case rather than the malformed one, because a return that simply ends in prose is the shape a
 *   session lands in when it believes it is finished: the parent's routing table reads the absence as
 *   `rework`, and the round it then spends cannot repair a defect that lives in a message.
 * - THE OPERATION ITEM ID IN THE PATH matters because several pieces of work run on one quest, each
 *   opening at its own round 1, and they all share one worktree — bare `round-1.md` would collide.
 * - NO MINION CAN BUILD A `PLAN:` PATH: its own fetch hands back no operation item id, and nothing
 *   tells it which round is running. Hence the path arrives filled in. A path still carrying
 *   `<operationItemId>` opens nothing; one assembled wrong opens another item's document — which
 *   is the consequence, not the rule, so it lives here.
 * - ONE MORE CONSEQUENCE MOVED DOWN WHOLE to pay for tier 2's additions, and it is not a measured
 *   one: the operation item id in the path is what keeps the file its round's — the holder builds
 *   that path from its own `Operation Item ID:` and no other session builds one at all, so the
 *   served text spends nothing saying why. Two neighbouring consequences were only TRIMMED, and both
 *   still stand in `indexes`: `The holder never dispatches a chunk in no wave, and dispatches one in
 *   two waves twice.` keeps the consequence and drops only that the second lands on a `FILES` list a
 *   sibling is already writing, and `**Nobody but the planner re-cuts either index.**` still carries
 *   its whole reason — the planner grouped on what it read, and a group formed by anyone else rests
 *   on no such reading.
 * - THE `WAVE:` CROSS-CHECK MECHANICS LIVE IN THE WORKER PROMPTS, not here. Only the worker can catch
 *   the mismatch, because the session that dispatched it never opens the file the check is about —
 *   and the worker is the one reader of `briefKeys` that can ever receive a `WAVE:` line. What stays
 *   here is the fence line and the SHAPE of `WAVES`, which the worker needs because it does not take
 *   `indexes` and `1: 1, 2, 5` reads equally well backwards.
 * - AN `out-of-medium` LINE MAY NAME A LATER OWNER on some rounds and has nobody to name on others,
 *   which is why the primer requires only the SURFACE and defers the owner to the role prompt.
 * - A SENTENCE ANOTHER BLOCK THE SAME READER TAKES ALREADY CARRIES IS CUT. A reviewer holds this
 *   primer, the standards concerns and FIVE operating rules under their heading at once — roughly
 *   27,000 characters of shared text, and roughly 32,000 for the two reviewers that also take
 *   `flowEvidenceContractStatics.judgingMarkdown` — so a duplicated sentence costs it twice.
 *   `nextLine` restates neither the `[WALL]` operating rule (the wall vocabulary, and the
 *   restartable wall being `rework`) nor the rest of `[TURN END]` (no `signal-back`, the parent's
 *   `workItemId`, the final message being how a turn finishes) — every minion reads both off the
 *   `*-information` payload its first step fetches. What `nextLine` owes on top of `[TURN END]` is
 *   the EVERY-PATH claim and its measured cost, which is why those sit here rather than there;
 *   `commitSubjects` does not restate the completion-gate paragraph in
 *   `standardsReviewConcernsStatics`. Each of those arrives at the same reader from the other block,
 *   in longer form.
 */

const document = `## The round document

One file carries the whole round: \`.quest-plans/<operationItemId>-round-<n>.md\`. **It is the only
channel between the four sessions on it**, and every round brief is a PATH to it on a \`PLAN:\`
line, never a copy.

| Section | Written by | What it holds |
|---|---|---|
| \`# Round <n> — …\` | the holder (the session that dispatches the other three) | the round number and the work the holder owns |
| \`## Context\` | the holder | its whole Operation Context, word for word |
| \`## Rework\` | the holder | round 2 on: what last round's reviewer said is not done |
| \`## Plan\` | the planner | what it found, the chunks, then \`PHASES\` and \`WAVES\` |
| \`## Round log\` | the planner writes the heading, each worker appends under it | one \`### report — chunk <n>\` block per chunk |
| \`## Sweep\` / \`## Re-review\` | the holder | the paths a sweep must sort, or the refusal a re-review must settle |

**A brief's \`SECTION:\` line is what sends a session to \`## Sweep\` or \`## Re-review\`, and it
names the LAST section of that name** — a second sweep appends a second \`## Sweep\`.

**\`## Context\` carries the three ids on its first three lines** — \`Quest ID:\`, \`Work Item ID:\`
and \`Operation Item ID:\`. Read them from there, never from memory. The server checks each as a
UUID, so one retyped wrong is a REJECTED write.

**Nobody rewrites a section somebody else wrote.** A session alone on the file corrects its own
section with \`Edit\`, inside that section only; a session appending beside siblings never edits, and
gets one shot. The session that reviews and commits this file writes nothing into it.

**Every write after the holder's first — the planner's \`## Plan\`, each worker's report — is an
APPEND, with \`>>\`.** \`Write\` and \`Edit\` both read the whole file and write it back, so two
sessions appending at once lose a block between them. Append in ONE shot, with a QUOTED heredoc
delimiter:

\`\`\`bash
cat >> <the PLAN: path from your brief> <<'DOC'
<your section>
DOC
\`\`\`

**A \`### report — chunk 3\` heading is a REPORT and a \`### chunk 3\` heading is the PLAN's.**`;

const planBlocks = `## The plan's blocks

**\`## Plan\` is built in layers:** \`TOUCHES\` → \`DEPENDS\` → \`DECISIONS\` → \`ASSERTIONS\` →
\`NO CHUNK\` → the chunks → \`PHASES\` → \`WAVES\`. **The planner writes its first block with the
least understanding of the round**, so the first block is written from what the planner actually
found, and \`PHASES\` and \`WAVES\` come last because they name CHUNK NUMBERS.

| Block | What it is | The test it must pass |
|---|---|---|
| \`TOUCHES\` | everything the round touches, found or still to be made — what each is FOR, and every unit landing on it. | an entry with no unit still belongs here. |
| \`DEPENDS\` | one entry per \`TOUCHES\` entry: everything it \`needs\`, everything that \`needs\` it, and what crosses each link. | it is a COMPLETENESS CHECK, not bookkeeping. The \`needed by\` lines for the most-depended-on entries come FIRST. |
| \`DECISIONS\` | a call settled while READING, with the evidence that settled it. | it names something that was opened, or it is not a decision. |
| \`ASSERTIONS\` | a claim true of the WHOLE round when it is done. | a reader can CHECK it and get yes or no — "\`GET /api/health\` answers 200 with exactly seven keys". |
| \`NO CHUNK\` | every unit NO chunk covers, one line each, for exactly two reasons. | both are findings about the round, not work in it. |

**\`NO CHUNK\` is the other half of the chunks.** Two line shapes, no others:

| The reason | The line |
|---|---|
| already TRUE on disk | \`- settled <unit-id> at <sha> → <where it is already true> — <the assertion read there>\` |
| nothing this round is allowed to use can reach it | \`- out-of-medium <unit-id> — <what cannot be reached, and why>\` |

**\`settled\` and \`out-of-medium\` are literal, and nothing else parses.** **\`TOUCHES\` holds the
round's full unit list.** \`NO CHUNK\` and the chunks' \`UNITS\` are what is removed from the full
list; anything unparseable stays on it as uncovered.

**A \`settled\` line must state the sha and the assertion actually opened.** It is the cheapest line
in the plan to fake, and the reviewer opens what it cites. **An \`out-of-medium\` line names the
SURFACE that cannot be reached.** The rest of this prompt says whether it may ALSO name a later owner.

**Where every unit in scope IS work, the block reads \`NO CHUNK: none\` on one line, in those words,
and nothing else parses.**

**A unit that no chunk covers and no \`NO CHUNK\` line explains has nowhere left to hide.**

**Neither \`DECISIONS\` nor \`ASSERTIONS\` is a summary, and no block here carries narrative.**

**Keep every chunk small enough for ONE worker to hold in full**; its worker skims an over-large
one, and a green run hides what it skipped. Split when unsure. **Two chunks that genuinely need to
write one file are ONE chunk.** A unit split across two takes
\`(part <n> of <m>; chunk <k> owns the rest)\` in BOTH rows, each naming the other.

**Work the planner cannot plan cleanly still gets a chunk** — a spec that contradicts the tree, a
bug nobody could reproduce. Its \`INTENT\` names what must be settled and its \`NOTES\` names the
contradiction. Leaving it out of the plan routes it nowhere.`;

const chunkFields = `## A chunk's five fields

A chunk is one numbered piece of work, and one worker does one chunk. **The number is its name.**
The planner numbers chunks from 1 with no gaps, and no chunk section carries a wave of its own —
\`WAVES\` is where that is written.

\`\`\`
### chunk <n> — <one line a worker can hold in its head>
INTENT:
  - <an assertion TRUE when this chunk is done, and the observation that settles it>
FILES:
  - <one path per line>
UNITS:
  - <unit-id> → <where it gets proved> — <what that place must make TRUE>
MIRROR: <an existing file of the same kind whose shape this follows>
NOTES:
  <everything its worker cannot work out for itself>
\`\`\`

- **\`INTENT\` is a LIST of assertions, never a sentence about what the chunk is for.** Its worker
  rates its own work against that list, and the reviewer grades the round against it. **A line
  nobody can answer \`yes\` or \`no\` to is useless**: "wires the badge into the header" is a task,
  "\`SERVER_HEALTH_BADGE\` is in the DOM on \`/\`" is an assertion.
- **\`FILES\` is a COLLISION boundary, and the thing it keeps apart is two writers running AT ONCE.**
  Two chunks IN ONE WAVE must never list the same path they both WRITE: that wave runs at once in one
  worktree, so the second to write a shared file erases the first. **Across waves the ban does not
  bind** — one wave is committed before the next starts — and nor does it bind on a path only READ,
  driven through or warded over. **A worker's \`FILES\` GROWS**: anything it has to create or change to
  reach its own \`INTENT\` joins the list, and its own prompt says which paths those are. **Every path
  is a FILE**, never a directory, and starts with \`./\` or is absolute.
- **Each \`UNITS\` row names the ONE place that makes that unit true.** Its worker reads the row, and
  never pairs ids against \`FILES\` by eye. A chunk with no unit of its own carries
  \`UNITS: none — <why this chunk exists>\`, in those words, and nothing else parses.
- **One unit, ONE chunk — unless it is SPLIT, and then BOTH rows say so**, as
  \`(part <n> of <m>; chunk <k> owns the rest)\`, each part naming the other. Two chunks carrying the
  same bare id are both removed from the round's full unit list the moment EITHER lands. **A unit is
  covered only when EVERY part landed.**
- **\`MIRROR\` is a path somebody OPENED.** Its worker copies one that merely sounded right
  wholesale.
- **\`NOTES\` OWES whatever this chunk changes that other files USE** — an exported signature,
  a contract field, a renamed symbol, a moved path. A chunk whose \`NOTES\` names none of those is
  claiming nothing outside it uses this work.`;

const indexes = `## The two indexes: \`PHASES\` and \`WAVES\`

\`PHASES\` and \`WAVES\` sit below the chunks, just above \`## Round log\`, and are the round's
whole dispatch schedule: **\`PHASES\` is the outer loop, \`WAVES\` the inner one.**

\`\`\`
PHASES:
  1: waves 1-2 — the contracts every later phase imports
  2: wave 3 — the logic over them

WAVES:
  1: 1, 2, 5
  2: 3, 4
\`\`\`

- **\`WAVES\` IS THE ORDER OF WORK, and the ONE place that order is written.** One line per wave,
  numbered from 1 with no gaps. **Every chunk number appears in it exactly once.** The holder never
  dispatches a chunk in no wave, and dispatches one in two waves twice.
- **A chunk goes in a later wave than anything it depends on** — the planner read that off
  \`DEPENDS\`, the plan's map of what \`needs\` what: a chunk's wave is one past the highest wave
  among the chunks owning its \`needs\` links. A chunk depending on nothing goes in wave 1 however
  high its number.
- **Two chunks in one wave RUN AT THE SAME TIME, in ONE worktree, so they may not share anything.**
  Four kinds of sharing are invisible to \`FILES\`, the paths each chunk owns: a long-running server,
  a report path a test runner writes, a reset command, and any file two chunks READ THROUGH rather
  than own — a \`.proxy.ts\`, a \`.stub.ts\`, a harness, or a production line two chunks both change
  to prove their tests bite.
  **The planner put a chunk sharing one of those four in a later wave.**
- **\`PHASES\` groups the waves into review gates, and a phase boundary is where a fresh session reads
  what the last one built.** One line per phase, numbered from 1 with no gaps, naming its wave range
  and what that phase makes true. Every wave sits in exactly one phase and phases run in order. **The
  planner puts the chunks every later phase imports in a phase of its own.**
- **On a zero-chunk plan both read \`PHASES: none\` and \`WAVES: none\`, one line each, in those
  words, and nothing else parses.**

**Nobody but the planner re-cuts either index.** The planner grouped on what it read; a group
formed by anyone else rests on no such reading.`;

const briefKeys = `## The round's brief lines

A brief carries a PATH and at most one ASSIGNMENT — the \`WAVE:\`/\`CHUNK:\` pair, a \`PHASE:\`, or a
\`SECTION:\`; everything else is in the document at that path.

**Each line arrives exactly as written below, with only its \`<n>\` and its path filled in.** Nothing
else is part of a brief, beyond a line the sending prompt names itself. **A comment beside one reads
as an instruction.**

\`\`\`
PLAN: .quest-plans/<operationItemId>-round-<n>.md
WAVE: <n>
CHUNK: <n>
PHASE: <n>
SECTION: Sweep
SECTION: Re-review
\`\`\`

| The line | Who gets it |
|---|---|
| \`PLAN:\` | every brief, always, and it is the only line some briefs carry |
| \`WAVE:\` and \`CHUNK:\` | a worker on a plan chunk, always as a pair and never one without the other |
| \`PHASE:\` | a REVIEWER only: the gate at the end of one phase |
| \`SECTION: Sweep\` | a REVIEWER only: a sweep |
| \`SECTION: Re-review\` | a REVIEWER only: after a refused signal |

**\`SECTION:\` and \`PHASE:\` each REPLACE the \`WAVE:\`/\`CHUNK:\` pair, and no brief carries two of
the three.** A reviewer brief carrying none of them is the whole-round review, and that absence is the
only thing that says so.

**The \`PLAN:\` path arrives filled in — a real operation item id, a real round number. The holder
fills it in, and nobody it dispatches can build one.** A minion's own fetch hands back no operation
item id, and nothing tells it which round is running.

**\`WAVE:\` is a CROSS-CHECK, not an instruction.** \`WAVES\` is one line per wave,
\`<wave>: <the chunk numbers in it>\`, and every chunk number appears in it exactly once.

**The holder pastes no chunk into a brief.**`;

const nextLine = `## The \`NEXT:\` line

\`\`\`
NEXT: continue
NEXT: rework — <what is not done>
NEXT: wall — <what a person must change>
\`\`\`

| Value | What it means | What the parent does |
|---|---|---|
| \`continue\` | this session's own job is done and proved | keeps going; which step is next depends on whose line it is |
| \`rework\` | something is not done, named in the round's own chunk terms | keeps going; which step is next depends on whose line it is |
| \`wall\` | an ENVIRONMENT wall no session of any role could pass | stops the round and halts the quest |

**A role's own prompt may narrow this list. The values it names there are the only ones you have.**

**The parent matches the FIRST WORD of the LAST line.** Nothing else in a return is a control signal.

### The line is mandatory on every path, the clean pass most of all

**A minion writes \`NEXT:\` on ONE line and makes it the last line.** It writes one on EVERY path out
of its turn — a clean pass, a partial, a wall, a turn that found nothing left to do. No outcome ends
in prose instead.

**A return carrying no \`NEXT:\` line is read as \`rework\`**: the parent finds no word to match, and
its routing table has one entry for that. Measured on one such return — a final reviewer that
accepted every chunk, got a green ward, committed and pushed, and then ended in prose — its parent
spent a whole further round on it: a planner that cut ZERO chunks, then a reviewer that re-derived
the same verdict. 35 minutes and two sessions, for a \`plan round 2: 0 chunks\` commit and an
\`--allow-empty\` one. No chunk could have repaired it, because the defect was in a return message
rather than in the tree.

A \`wall\` option wrapped onto a second line is that same case: the wrapped part starts with \`|\`,
which matches none of the three, so the parent reads the return as carrying no \`NEXT:\` at all and
dispatches a full round into the wall just reported.

### The return is that block and nothing besides

**A minion returns exactly the block its own \`## What you return\` lays out, ending on \`NEXT:\`.**
Nothing goes beneath that line. Nothing goes beside the block either — no opening preamble, no
closing summary of the work, no parting remark, no next step offered. What any later session needs
is already in the round document and in the commit.

A worker's \`rework\` is a CLAIM about its own chunk. **Only the REVIEWER's line decides the
round**, because the reviewer reads every worker's report AND opens the files.`;

const commitSubjects = `## The round's commit subjects

**The commits below are the round's only record: the next round's planner reconstructs what
happened from these bodies.** A \`PHASE:\` or \`SECTION:\` line in a reviewer's brief scopes it to
one phase or one section of the round.

| Subject | Written by | What goes in the body |
|---|---|---|
| \`plan round <n>: <count> chunks\` | the planner | nothing. The document is the content. |
| \`phase <n>: <what the phase made true>\` | a reviewer on a \`PHASE:\` brief | what that phase's chunks landed |
| \`round <n>: <what the round made true>\` | the round's reviewer | one line per chunk saying what landed; every marker line — a worker report's \`MARKERS:\` entry, naming what that worker declared this round moved — copied word for word; then the reviewer's whole return block |
| \`sweep: <what these paths are>\` | a reviewer on a \`SECTION: Sweep\` brief | what it did with each path |
| \`sweep: uncommitted remainder\` | a reviewer on a SECOND \`SECTION: Sweep\` brief | the same, for paths committed whatever they are |

**Those five are the whole list** — anything else is a subject no later session knows how to read. **A
\`SECTION: Re-review\` brief reuses \`round <n>:\`** and mints no sixth. The committing reviewer
reads \`<n>\` off the document's own \`# Round <n>\` title.

**No worker commits anything.** A wave of them runs at once and concurrent commits in one worktree
collide on git's index lock — measured on twelve at once: three landed and nine died with
\`Unable to create index.lock\`. So no session that wrote a chunk commits it: every commit on the
round is a reviewer's, written by a session that has opened the files in it.

**The reviewer commits ONCE, and it is the LAST thing it does before pushing.** A round reaches it
entirely uncommitted, so everything it reviews, everything it fixes and everything it records lands in
that one commit — the work, the \`## Round log\`, and its own return block in the body.

**The ORDER is what makes that possible**: the reviewer enumerates its review units over the WORKING
TREE, before committing, because that is where the round is. Enumerating after the commit, or from a
range of published history, measures a surface the round never put there. It passes \`--allow-empty\`
where the round genuinely changed nothing.`;

export const roundProtocolStatics = {
  document,
  planBlocks,
  chunkFields,
  indexes,
  briefKeys,
  nextLine,
  commitSubjects,
} as const;
