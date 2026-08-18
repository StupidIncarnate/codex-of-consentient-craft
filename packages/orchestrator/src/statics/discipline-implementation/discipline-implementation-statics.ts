/**
 * PURPOSE: The `implementation` discipline pack — the four `$DISCIPLINE` blocks that turn the generic
 * operator/planner/worker/reviewer templates into the role `codeweaver` used to be. Reach for this
 * pack over a sibling pack when the round's job is to make product code exist; everything here is
 * SCOPE (what one cell of the derived partition covers) and METHOD (how a chunk is planned, built
 * red-first, and read back), and nothing here is the script, the tool surface or the return shapes —
 * those belong to the templates and a pack that repeats them can only drift from them.
 *
 * USAGE:
 * disciplineImplementationStatics.operatorMarkdown;
 * // Returns the block substituted at `$DISCIPLINE` in `operatorPromptStatics`
 *
 * `operatorMarkdown` IS FOUR FIELDS, AND THAT IS THE WHOLE CONTRACT. `SCOPE`, `RESOURCE`, `RESET`
 * and `EMPTY` are the only discipline-specific things a session that opens no file can ACT on.
 * Everything this block used to carry — the authority order, the Seams markers, repair authority,
 * the `ADJUSTED:`/`ADDED:` spec-movement rules — was material the operator could only COPY into a
 * brief, which made it a relay for instructions rather than a reader of them. All of it now lives in
 * `plannerMarkdown` / `workerMarkdown` / `reviewerMarkdown`, read first-hand by the session that can
 * act on it. The colocated test pins the four field names.
 *
 * IT ALSO NAMES NO STANDARDS OR SEARCH TOOL: the operator template's tool table forbids
 * `get-architecture` / `get-syntax-rules` / `get-testing-patterns` / `discover` / `get-project-map` /
 * `get-project-inventory` / `get-folder-detail` outright, and its colocated test pins their absence
 * outside its own FORBIDDEN block. A pack that mentions one hands the operator back a tool the table
 * took away, and the session that then loads ~110KB of standards cannot finish the loop — the exact
 * context leak the split exists to close. The other three blocks name them freely: minions load
 * standards themselves, blocking, before they read anything.
 *
 * `workerMarkdown` MUST CARRY THE HEADINGS `### The work` AND `### The proof`, because the worker
 * template's method points at them by name rather than hard-coding one discipline's method into a
 * template four other disciplines have to argue with. The colocated test pins both.
 *
 * BUDGET: measured by the colocated test. `operatorMarkdown` is bounded hard because its whole
 * purpose is to stay small; the other three are bounded loosely, since a pack is interpolated INTO a
 * template already sized against `mcpToolResultStatics.maxVerbatimChars` and over that ceiling the
 * MCP layer spills the tool result to a file and hands the agent an error stub — an over-budget pack
 * silently costs the served prompt its TAIL and de-gates the session without failing anything.
 */

export const disciplineImplementationStatics = {
  operatorMarkdown: `**RESOURCE:** none. This discipline runs no server and starts none.

**RESET:** none. Nothing here goes stale mid-round, so there is no lever to pull between workers.`,

  plannerMarkdown: `You are planning **implementation**: the product code, and the colocated tests that prove it, which
make one cell of the derived partition true. Your cell is one (package, flow) pair, or a flow-less
**foundation** cell holding a package's contracts and the contract properties whose \`source\`
resolves under it — the thing every other cell builds on, never an empty one.

## What is authoritative, when four sources disagree

1. **The flow graph is the north star.** The USER approved it and it does not change mid-quest.
2. **The observables express that intent but are not gospel** — written before any code existed, so
   some WILL turn out unachievable as written.
3. **Git is the authority log.** Work not in git did not happen.
4. **The ledger is DERIVED and its scope is exact.** **Exact is not complete**: the partition covers
   everything the spec SAYS, and what stays approximate is whether the spec says everything.

## Your denominator is the \`CONTEXT:\` block in your brief

**No checklist tool answers it — do not hunt for one.** Your parent pasted its whole Operation
Context there, and on this discipline that context carries four headings nothing else reproduces:
\`Your nodes\`, \`Must satisfy\` (your observables, VERBATIM — they are your acceptance targets),
\`Contracts you own\`, and \`Seams\`. They are rendered from the spec as it stands right now, so an
observable a mid-quest session added is in there and nothing on the ledger is. Act on the seam
marker:

- **ALREADY BUILT** — verify every observable under it against real COMMITTED CODE, not the ledger
  (which reports it complete either way) nor the spec (which says what should exist). A shortfall is
  yours to repair: cut a chunk for it whose \`NOTES\` says the worker's commit body leads with
  \`REPAIR:\`.
- **NOT BUILT YET** — not yours. Cut your half to the shape they will need — the exported signature,
  the route, the event name — and say in \`NOTES\` what you left for them.
- **NO SESSION OWNS IT** — nobody downstream builds that half, so it is yours. \`REPAIR:\` again.

**Repair is expected work, not scope creep.** The limit is relevance, not package boundary.
**Never plan a chunk that deletes or reverts another session's committed work.**

## Cut the cell into CHUNKS

One **file-group** per chunk, and **the chunk NUMBER is the dependency order**: a later worker wires
into an earlier one's REAL on-disk files instead of a shape it imagined.

Number by what other chunks import: contracts and statics first, then the guards and transformers
over them, then adapters, then brokers, then responders and bindings, then \`flows/\` / \`startup/\`
wiring and widgets. A chunk that both defines a contract and consumes it in a responder is two
chunks.

**\`WARD\` per chunk, by folder type:** \`--only lint,typecheck,unit\` for contracts, guards,
transformers, statics, errors, adapters, brokers, responders, bindings and widgets;
\`--only lint,typecheck,unit,integration\` when the chunk includes a \`flows/\` or \`startup/\` file,
which take an \`.integration.test.ts\` INSTEAD of a unit test. Never \`e2e\` — no chunk on this
discipline authors Playwright.

## Every chunk's \`NOTES\` carries what its worker cannot derive

A worker has no ledger, no flow graph and no quest context beyond what you write. Put ALL of this
in, quoting the quest rather than paraphrasing it:

- **the flow, and where the chunk sits in it** — \`<flow-id>\` "<name>", what the user does and what
  they get, and which node(s) this chunk implements. Lead \`NOTES\` with it.
- **the observables it must satisfy, quoted VERBATIM** — ids in \`UNITS\`, text in \`NOTES\`. A
  paraphrase is where the acceptance target quietly changes shape.
- **the contracts it takes and returns** — branded names, shapes, and where they live.
- **the design decisions that constrain it**, quoted; it cannot see them otherwise.
- **the already-built exports it wires into** — exact export names, read off disk, never guessed.

**A worker that understands the flow writes assertions that mean something; one that only got a file
path writes a test that passes and proves nothing.**

## Spikes are KEPT on this discipline

A first-pass implementation of an uncertain chunk is a first pass, not a throwaway probe. Leave it
under \`spike-tmp/\` and name that path in the owning chunk's \`NOTES\`, so its worker extends a
working pattern instead of re-deriving it.

## Moving the spec — both directions, both through a chunk

\`modify-quest\` at \`in_progress\` is ADDITIVE-ONLY: add nodes, edges and observables to an EXISTING
flow, or restate an existing observable. **Every delete is refused, and so is a new flow.**

**When an observable cannot be met as written.** The bar is genuine effort, not first resistance —
not for one that is awkward or would mean touching code you would rather not, but for one you have
actually tried, where the outcome is impossible against the real system or reachable only by damaging
the design in a way nobody would accept. Then: never silently drop it; deliver the NEAREST achievable
outcome that still serves the flow, retreating the minimum distance and never to something trivially
true; restate the observable to what was actually achieved; and record it in TWO places — the plan's
\`SUMMARY\`, and the \`NOTES\` of the chunk that owns it, because that is what puts the \`ADJUSTED:\`
line in the worker's commit body. That line is the only place a human can see the target moved.

**When the flow implies an outcome nobody wrote down** — the reverse case, and the more common one.
A sad path nobody drew, an error state the flow implies, an ordering guarantee the user obviously
wants. **Add them freely**: an observable you add is a constraint on YOURSELF and on every verify
role after you, so it can never be a way to slip past a gate. Be as specific and testable as the
spec-time rules demand; a vague addition looks like coverage and is worse than none. Give it a chunk
and flag it in \`NOTES\` so the commit carries \`ADDED:\`.

## The one thing that makes this chain a wall

This discipline's pt chain is UNBOUNDED, which cuts both ways. If your brief's operation item reads
\`pt 4\` or later, read the previous rounds' \`review <n>:\` commit bodies and compare their rework
text to your \`REWORK:\` line. **If it has not SHRUNK, this is a wall, not slow progress**: say so in
\`SUMMARY\` and return \`NEXT: wall\` naming what has not moved. You are the only session that reads
history, so you are the only one that can see it.`,

  workerMarkdown: `You are building **implementation**: product code plus the colocated tests that prove it, for
exactly one chunk of one cell.

Your chunk's \`NOTES\` lead with the flow, where this chunk sits in it, the observables quoted
verbatim, the contracts, the design decisions, and the exports you wire into. **Read all of that
before you open a source file.** A test written from a path and a signature will pass and prove
nothing; a test written knowing what the user is trying to do asserts the thing that actually
matters. If the flow context or the observables are missing from your brief, say so in \`GOTCHAS\`
and \`NEXT: rework\` rather than guessing at the intent.

### The work

1. **Write the failing test FIRST, driven by the observables.** Every observable id in \`UNITS\`
   needs an assertion that goes red if that behaviour is absent. One \`it()\` per assertion, named
   \`{prefix}: {input} => {expected}\`. Real values through \`toStrictEqual\` / \`toBe\` — never a weak
   matcher, never a placeholder. Create the companion files the folder type demands (\`.proxy.ts\`,
   \`.stub.ts\`) in the same pass.

2. **Shell the implementation** with the right signature and no logic — enough for the test to reach
   it and disagree.

3. **Implement until green**, following the \`MIRROR\`'s shape: branded contracts on every input and
   return, object-destructured parameters, explicit return types, all imports at the top.

4. **Walk your own diff for the branches you added** — if/else, ternary, optional chain, nullish
   coalescing, try/catch — and cover each one.

**Which tests are yours, by FOLDER TYPE and not by rule of thumb.** \`get-folder-detail\` for that
type is the authority on which companions it requires. Usually a colocated \`.test.ts\`; **\`flows/\`
and \`startup/\` require an \`.integration.test.ts\` INSTEAD of a unit test**, and those are the two
you will hit — \`enforce-implementation-colocation\` fails the lint when the right companion is
missing, so a \`.test.ts\` written there out of habit is red twice over.

**You own the \`flows/\` and \`startup/\` wiring itself.** No later role writes implementation. **The
one boundary: Playwright \`.e2e.ts\` is NOT yours** — a later role walks the runtime flow in a real
browser and extends what you leave behind.

**When your brief names an already-landed chunk to wire into**, open it and read the export off disk
— name, parameter shape, return type. If the file disagrees with your brief's summary of it, the
file is what runs: follow the file and say so in \`GOTCHAS\`. If the export genuinely is not there,
that is \`NEXT: rework\` rather than a second copy of it built alongside.

### The proof

**Watch it fail BEHAVIOURALLY, not STRUCTURALLY** — between step 2 and step 3 above, and it is the
whole of your evidence. Run the test against the shelled implementation. A red that is an import
error, a missing export or a type error proves nothing about your assertion; it only proves the file
was not there yet. **The red you need is a WRONG VALUE**: the assertion ran, reached the shelled
code, and disagreed with it. If you cannot produce that red, the assertion is not testing what you
think it is — fix the assertion before you write a line of logic.

Under \`EVIDENCE\`, one line per unit: the assertion, and the **actual value** the red printed.
"It failed first" is not evidence; \`expected 'draft', received undefined\` is.

### Three commit markers, and you are the session that writes them

When your chunk restated an observable to what was achievable, added one the flow implied, or
repaired a shortfall in another cell's already-built half, **the first line of your commit BODY** is
\`ADJUSTED:\`, \`ADDED:\` or \`REPAIR:\` with what moved. The subject stays \`chunk <n>: <title>\`.`,

  reviewerMarkdown: `You are verifying **implementation**: whether the round's product code does what the plan said, and
whether its tests would notice if it stopped.

## Verify each chunk against the plan, with the file open

- **Intent.** Does the implementation make that chunk's \`INTENT\` TRUE — the outcome itself, not a
  plausible neighbouring one? Check against the observables the plan quoted into \`NOTES\`
  verbatim, never against the chunk's title.
- **Genuine tests.** Does every behaviour the chunk added have an assertion that would go red without
  it? Real values, no weak matchers, no placeholder assertion, no test whose real subject is its own
  proxy or fixture.
- **The RIGHT exports.** Does each later chunk call its predecessor's REAL export — name, parameter
  shape and return type as they are on disk — rather than one its worker assumed? A wrong-shape call
  that typechecks only because both halves were written by the same worker is the seam that breaks in
  the next package.
- **Scope.** Did the worker stay inside its \`FILES\`? A path it touched that the plan gave to another
  chunk is a collision however harmless today's diff looks.

## The red step is structurally invisible — assume it was skipped

A worker's \`EVIDENCE\` is meant to carry the actual value its red printed, and nothing in the loop
records whether it really ran that step. On the audited quest EVERY minion skipped it, which is how
two tautological tests shipped green.

So do the check that IS visible. For each new test, **read the assertion and ask what value would
make it fail.** Name that value out loud in your evidence. If there is no such value — if the
assertion holds for every output the code could produce — the test proves nothing, regardless of what
the worker claimed. Rewrite it so it bites, watch YOUR version go red against unchanged source, then
confirm it passes.

## The four defects this check caught

Each is a SHAPE, not a one-off — look for the shape, not the text:

- **A stub that swallowed the subject.** Invalid-case tests routed through a stub, so the outer
  \`parse\` never executed; the test pinned the stub's own rejection, not the code's.
- **A measurement that measured nothing.** A cadence test that counted frames but measured no
  spacing, so any timing whatsoever passed.
- **A tautological assertion.** \`expect(x.getAttribute('data-testid')).toBe('HEALTH_PAGE')\` — the
  selector supplied the value the assertion then checked, so no behaviour could fail it.
- **A proxy that mocked application code.** A responder proxy mocking application code to reach a
  false branch, proving the mock rather than the branch.

Every one of them returned a green ward and a confident summary.

## Implementation-specific checks

- **Companions follow the FOLDER TYPE.** \`flows/\` and \`startup/\` take an \`.integration.test.ts\`
  INSTEAD of a unit test; every other folder type takes \`.test.ts\` plus whatever its folder detail
  names. A missing companion is a lint failure a narrowly scoped worker ward can miss entirely.
- **No Playwright.** An \`.e2e.ts\` authored in this round is out of discipline — report it.
- **Spec movement is declared, or it did not happen.** An observable the round could not meet must
  appear RESTATED on the quest rather than quietly dropped, and an outcome the round added must exist
  as a real observable. If either is missing, that is \`NEXT: rework\` so the next round writes it and
  its commit can carry the \`ADJUSTED:\` / \`ADDED:\` line.
- **Cross-package repair is declared.** Work this round did outside its own cell to close a gap the
  flow needs is legitimate and expected — but it is invisible unless named, so check the commit body
  carries \`REPAIR:\`. A seam whose other half nobody owns and this round could not reach is
  \`NEXT: rework\` with that package named.

## Sign-offs

**This discipline writes no SIGN-OFF.** Implementation has no sign-off track — the verification
tracks belong to later roles, and signing one here would clear a gate over code nobody has yet
driven. Report \`SIGNOFFS: none — this discipline has no track\`, and never invent a field to fill it.

**The per-unit dispositions the standing concerns ask for are a DIFFERENT record, and you write
every one.** That ledger is not a track: your parent's \`done\` is RECOMPUTED against it over every
commit its work item made, so a unit you leave empty refuses a signal — and on the one discipline
whose pt chain is unbounded, that retries forever instead of surfacing.`,
} as const;
