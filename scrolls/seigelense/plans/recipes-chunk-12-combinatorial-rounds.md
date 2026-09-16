# Chunk 12 — the combinatorial rounds

> The plan for the session Part 5 calls *"The combinatorial planning session, and what it works from"*.
> It turns that section's two tables into cases somebody can execute. It builds nothing.

---

## 1. What this session is, and the one thing it must not do

**This session runs cases and writes findings. It writes no framework code.** The specification is
explicit about the split:

> **This is its own session, not a step inside a build chunk.** Every verb has a worked example and
> every one compiles; that says nothing about what happens when they compose. The session's job is to
> find what this document did not anticipate, and to write each finding back INTO this document rather
> than working around it.

**The case list below is not invented, and a session running it must not invent one either.** The
specification says why:

> **It opens from the two tables below, not from a blank page.** A session told "go try combinations"
> tries the ones it thought of first, which are the ones already written down.

So §3's coverage table is the contract. Every row of Table 1 and every bullet of Table 2 has a case
number against it. A row with no case is the failure this session exists to prevent.

**Round D drives; it does not implement.** The runner plan is explicit that chunk 6b owns the sad-path
rows and chunk 12 only walks them —
`scrolls/seigelense/plans/recipes-chunk-04-06-runner.md:1090` reads
*"| \"The combinatorial planning session\" | **chunk 12** — Round D DRIVES §2's rows; chunk 6b OWNS them |"*.
A round that finds a sad path unimplemented reports that it is blocked and on which chunk. It does not
implement the row.

**Assert on the MESSAGE, never on a field.** The framework's error classes fold every value into the
message string and store no context.
`scrolls/seigelense/plans/recipes-chunk-01-03-framework-types.md:1163` names this session directly:
*"Chunk 4 and chunk 12 assert on the message, not on fields — there are none to read."*

---

## 2. What is already answered, and is therefore CONFIRM rather than DISCOVER

**Several rounds' worth of findings already exist, and re-running them buys nothing.** A case marked
**CONFIRM** below still runs — the point is that the runner honours a decision already made — but it
starts from the answer rather than from the question, and a result matching the decision is not a
finding.

| Question | Answered where | The answer |
|---|---|---|
| a `filter` inside a nested `add` — what is its scope? | `siegelense-recipes.md:1402`, CLOSED | its immediate host. The op carries `scope`; the runner matches only rows whose ancestor chain contains it |
| a top-level `filter` — what is ITS scope? | `recipes-chunk-04-06-runner.md:297-300` (D11) | it has no `scope` key and is **instance-wide** |
| `filter` over rows a same-plan transition just minted | `recipes-chunk-04-06-runner.md:1014`, and chunk 7's `guild-mid-execution` test | the filter sees them; ordering is depth-first declaration order |
| `saveRecordAs` on a row a later `remove` deletes | `recipes-chunk-04-06-runner.md:302-304` (D12) | the record is **stale, not absent and not an error** — *"a stale record a caller can inspect beats a hole it cannot"* |
| are two sibling `add` indexes scoped to their own `add`? | `recipes-chunk-01-03-framework-types.md:904` | yes — both see 0 and 1 |
| ordering between two sibling `add` calls | `recipes-chunk-04-06-runner.md:787` | declaration order, asserted as a value array |
| is the runner serial? | `recipes-chunk-04-06-runner.md:268-273` (D6) | `for…of` with `await`, never `Promise.all`. A requirement, not an implementation detail |
| two ingredients sharing a `name` in one registry | `siegelense-recipes.md:1401` | not expressible in the type system; a runtime check at `registry()`, throwing with both keys |
| a top-level row whose `links` nothing supplies | `recipes-chunk-04-06-runner.md:202` | compiles clean by design; the **pre-flight** refuses it |
| a `write` route with no `copies:`, no routes at all, an extra shadowing a built-in | `recipes-ledger.md:88,91,110` | already refused at parse time by the contracts' own `superRefine`, with colocated tests |

**Four questions are answered as a permanent NO and must not be re-run as experiments.** Each is a
limit of the design, recorded in the ledger:

| Question | The standing answer |
|---|---|
| can `makes:` show an ingredient a transition alone mints? | no — `reach` is opaque and nothing ties a transition to the child it mints. Not even as `varies` (`recipes-ledger.md:94`) |
| can a foreign key inside an array be a `links` entry? | no — `as` names one field, not a position inside a collection (`recipes-ledger.md:96`) |
| can any chainable reach a row that already exists? | no — a documented hole in the chain, not something solved elsewhere (`recipes-ledger.md:102`) |
| can `copies:` point at a shape only an external tool writes? | not yet — the session-transcript case is an open blocker (`recipes-ledger.md:121`) |

**The whole sad-path vocabulary exists and nothing throws any of it.** Every error class this plan
names is defined and message-tested at chunk 1; the runner that would fire them is chunks 4, 5, 6 and
6b. `recipes-ledger.md:118` — *"every error CLASS a sad path needs is defined (chunk 1), but nothing
throws one yet (chunk 4–6b)."* That is why §7 marks every Round D case blocked today.

---

## 3. The coverage table

**Every row of Table 1 and every bullet of Table 2 maps to a case, or says here why it does not.**

### 3.1 Table 1 — what an ingredient MUST have, and what it MAY have

Each property has two questions: what its absence does, and what a wrong value does. Both get a case.

| Table 1 row | "If it is absent" | "If it is wrong" |
|---|---|---|
| `name` | **skipped** — *"the config does not compile"*, and chunk 1's contracts already refuse it at parse time. Nothing live to ask | **A1** |
| `description` | **skipped** — does not compile | **A2** |
| `fields` | **skipped** — does not compile | **A3** (narrower) · **A4** (wider) |
| `record` | **skipped** — does not compile | **A5** |
| `routes` | **skipped** — does not compile; the at-least-one `.refine` has its own test | **A6** |
| `links` | **A7** | **A8** |
| `transitions` | **A9** | **A10** (too narrow) · **A11** (too wide) |
| `defaults` | **A12** | **A13** (constant) · **A14** (not index-derived) |
| `copies` | **skipped** — does not compile, and `ingredientConfigContract.superRefine` already throws naming `copies` | **A15** |
| `extras` | **A16** | **A17** |

**Exactly the `must` properties have their "if it is absent" cell skipped, and the reason is the same
for every one of them.** The specification's own answer in each of those cells is *"does not compile"*,
and chunk 1 went further: the contract refuses each at PARSE time with a colocated test. There is no
live question left to ask. A session that wants the proof reads
`packages/hydration/test/type-fixtures/declaration/` — `no-routes.ts`, `write-without-copies.ts` and
their siblings are those cases, already written. **Every `may` property's absence IS a live question**,
because absence is legal there, and each of those has a case.

### 3.2 Table 2 — the rounds

| Round | Bullet | Case |
|---|---|---|
| A | a `defaults` that returns the same value for every index | **A13** |
| A | a `record` missing a field the server really returns | **A5** |
| A | a `to` list including a state the gates actually refuse | **A11** |
| A | a `copies` pointing at the wrong broker | **A15** |
| B | three levels proven. **Four? Five?** Where does the chain stop resolving, loudly or silently | **B1** (four) · **B2** (five and beyond) |
| B | an `add` inside an `add` inside an `add`, each with its own `defaults` | **B3** |
| B | a `filter` inside a nested `add` — confirm the runner enforces the scope | **B4** (CONFIRM) |
| B | an ingredient linking to a parent two levels up, skipping one | **B5** |
| C | `filter` over rows a `transition` in the same plan just minted | **C1** (CONFIRM) |
| C | `saveRecordAs` on a row a later `remove` deletes | **C2** (CONFIRM) |
| C | `fromSaved` pointing into a filtered SET rather than one row | **C3** |
| C | `set` with a transition, then another `set` with a different transition on the same row | **C4** |
| C | `setRaw` on a transition field, then `set` on the same field | **C5** |
| C | `remove` on a parent whose children exist | **C6** |
| C | two ingredients whose `links` name the same parent, under one `add` | **C7** |
| C | `under()` with an id that does not exist | **C8** |
| C | a transition whose gates mint rows another transition then removes — the count `makes:` reports | **C9** |
| D | *"Stop the server mid-plan"* | **D13** |
| D | *"Make the home read-only"* | **D5** (from the start) · **D15** (mid-plan) |
| D | *"Hand `under()` a dead id"* | **C8**, driven again as a sad path in **D16** |

### 3.3 The sad-path table, row by row

| Sad-path row | Case | Chunk that OWNS the behaviour |
|---|---|---|
| the connection is refused (`api`) | **D1** | 4 + 6b |
| the server answers 4xx or 5xx, body verbatim | **D2** | 6b |
| the server answers 2xx with a shape `record` rejects | **D3** | 4 |
| a `write` route answers with a shape `record` rejects | **D4** | 4 (the Q8 widening) |
| the write fails — `EACCES`, `ENOSPC`, a read-only mount | **D5** | 6b |
| the parent directory does not exist — **create it** | **D6** | 4 |
| `reach` throws — the gates refused the transition | **D7** | 5 |
| the query fails mid-plan, DISTINCTLY from zero match | **D8** | 6 |
| the transaction rolls back | **D9** | 6b proves it; **nothing in the framework throws it** |
| two ops race the same file | **D10** | 4 — the runner is serial, and there is no error class |
| the recipes package was never built | **D11** | 8 |
| a recipe's params fail validation | **D12** | 8 |

### 3.4 The two refusal tables

The specification splits the runner's refusals into pre-flight and mid-run
(*"The runner's refusals split into two groups, and conflating them is a bug"*). Both are drivable and
both are cheap, so both get cases.

| Refusal | Case |
|---|---|
| pre-flight: an ingredient needs a route this target cannot serve | **D17** |
| pre-flight: a `fromSaved` names a record no op saves, or one declared LATER | **D18** |
| pre-flight: a row whose `links` no ancestor supplies, including at TOP LEVEL | **D19** |
| pre-flight: a chain call needs `query`, `update` or `remove` and no such route is declared | **D20** |
| mid-run: a `filter` matched fewer rows than `expect` allows | **D8**, its second half |
| mid-run: a route threw | every other D case |
| behaviour: a half-run plan leaves what landed, and there is no undo | **D14** |
| behaviour: a mid-batch `seed` that fails halts the batch and marks the instance unusable | **D21** |

### 3.5 The five cases the build brief names explicitly

**Every one of these already appears in Table 2.** They are listed here so a reader can confirm none
was dropped, not as separate work.

| The brief's case | Where it already lives |
|---|---|
| a `filter` inside an `add` whose transition minted the rows it matches | Table 2 Round C row 1 → **C1**, with the nesting half at **B4** |
| a `saveRecordAs` on a row a later `remove` deletes | Table 2 Round C row 2 → **C2** |
| a `fromSaved` pointing at a row inside a `filter` | Table 2 Round C row 3 → **C3** |
| two ingredients whose `links` name the same parent | Table 2 Round C row 7 → **C7** |
| a transition that mints rows another transition removes | Table 2 Round C row 9 → **C9** |

### 3.6 Cases beyond the two tables

**These are not in Table 1 or Table 2.** Each came from reading what chunks 1 to 3 actually shipped,
and each is named against the file that produced it. They are additions, never substitutes: the tables
above stay the contract.

| Case | Came from |
|---|---|
| **B6**, **B7** — colliding row references from two sibling `add` calls | `src/transformers/row-ref/row-ref-transformer.ts:26` derives a ref from `(ancestors, ingredient, index)` and nothing else |
| **C10** — a `filter`'s placeholder ref colliding with a real row's ref | `recipes-chunk-04-06-runner.md:325-328`, the standing risk §4b names and does not close |
| **C11**, **C12** — one saved name, many rows | `hydration-run-state-contract.ts:25-27` types `saved` as a `Map<SavedRecordName, unknown>` |
| **C13** — `expect: 'one'` matching TWO rows | `hydration-filter-expectation-error.ts:17-18` triggers only on *"fewer rows than `expect` requires"* |
| **C14**, **C15** — `under()` against `defaults(index)` and against an ancestor link | `collection-chain-transformer.ts:85-88` spreads `defaults(index)` AFTER `underValues` |
| **C16**, **C17** — a transition set through `all` and through a matched set | both transformers map a transition op over every ref |
| **C18** — a verb on a handle whose row a previous op removed | nothing in the chain or the op tree orders `remove` against later ops on the same ref |
| **C19** — an `OpCreate` inside a filter's `ops` | `op-filter-contract.ts:51` admits `OpCreate` in `OpFilterNestedOp`, while the chain type refuses `filter(…).add(…)` |

---

## 4. The order to run them in

**Run the cheap environment to exhaustion before paying for the expensive one.** This build has already
proven the ordering pays — the migration section makes the same argument for the same reason:

> **Integration first, even though it is the smaller half.** It is the cheap environment — no server,
> no browser, seconds per run — so every defect in the runner, the links, the defaults and the
> transitions surfaces there, where a cycle costs seconds instead of minutes.

| Tier | What it needs | Cost per cycle | Cases |
|---|---|---|---|
| **0 — read only** | nothing. Open the declarations and the tests and read them | seconds, no run | A2's first half, A15's reasoning, A17's existing proof, B8's documentation half, C19's parse half |
| **1 — the chain only** | `recipe()` returning a plan. **No target, no runner, no disk** | milliseconds | A12, A13, B3, B6, B7, C10, C11, C12, C14, C15, C16 |
| **2 — the type fixtures** | `typescriptProgramDiagnosticsAdapter` over a fixture tree | seconds | A3, A4, A8, A16, A17, B1, B2, B5, C15 |
| **3 — the file target** | `fileTargetHarness`, a temp home, `write` routes, **no `baseUrl`** | seconds | A1, A7, A9, A10, A11, A14, B4, B8, C1–C10, C13, C17, C18, D3–D10, D14–D20 |
| **4 — a real server** | one in-process application object, `api` routes | ~a minute | A4's `api` half, A5, A6, D1, D2 |
| **5 — a live instance** | siegelense: `recipes {}`, a `seed` step, a browser | minutes | A2's listing half, C2's batch half, C9's `makes` half, D11, D12, D13, D21 |

**A tier-1 defect stops the tier-4 run.** The cases are ordered so that a broken ref, a lost saved name
or a mis-scoped filter is found by a plan nobody ran, before a server boots.

**Tier 1 is the surprise, and it is where this session should open.** Twelve cases need no target, no
disk and no server — they build a plan and read its op tree. `B6` and `C10` in particular are pure
build-time facts about the reference a row is given, and both are answerable the moment chunk 3 lands.

**Round B's depth cases run against a SYNTHETIC registry, not this repo's.** Real chains here top out
at three levels — `guild → quest → operation` and `guild → session → subagent`. A fourth and a fifth
level therefore belong in `packages/hydration/test/type-fixtures/`, beside `dm-target.ts` and
`sql-target.ts`, and need no ingredient from chunk 7 at all. That makes B1 and B2 among the earliest
cases available, not the latest.

---

## 5. What a round PRODUCES — the exit condition

**The specification states the exit condition, and this plan adopts it verbatim:**

> **What a round produces.** A finding goes back into this document as a rule, next to the verb it
> concerns. A finding that is really a defect in the app gets an observable instead. **A round that
> changes only the recipe to route around a finding has spent itself and recorded nothing.**

**A case closes in exactly one of four ways.** Anything else leaves it open.

| Outcome | What lands |
|---|---|
| **RULE** | a sentence in `siegelense-recipes.md`, in the section for the verb or the property it concerns — not in a plan, not in a chunk ledger. Plus a test in the package that owns the behaviour |
| **OBSERVABLE** | the finding is a defect in the APP, not in the framework. It gets an observable against the app, in the form the decision index already names: *"An oddity that is really an app defect gets an OBSERVABLE, not an entry"* |
| **CONFIRMED** | the behaviour matched a decision already made. Record the case id and the assertion that now holds. A confirmation is not a finding and must not be written up as one |
| **BLOCKED** | the verb, the route or the chunk does not exist. Record the case id and the chunk it waits on. **The round does not build it** |

**The forbidden outcome, written here because it is the easy one.** Rewriting the recipe until the case
passes closes nothing. If `filter(…).saveRecordAs({ name })` over two matches keeps one record, the
finding is that one name cannot hold two rows — not that this recipe should have used a narrower
`where`. The narrower `where` is exactly the route-around the specification refuses.

**A case with no observable cannot be run, and is not in this plan.** Every case below names the thing
that distinguishes right from wrong before it names what it expects.

**Write the round's record where the build already keeps them.** A finding's RULE lands in
`siegelense-recipes.md`; the round's own pass/fail per case lands in `recipes-ledger.md` as its own
section, the way every prior round's did.

---

## 6. Round A — one property at a time

**Take each row of Table 1 as a live question against a running instance, not a thought experiment.**
Each case below breaks one property deliberately in a scratch copy of an ingredient, runs it, and
records what noticed.

#### A1 — two ingredients sharing a `name` inside one registry

```ts
export const dm = registry({
  quests: questIngredient,
  tasks: questLikeIngredient,   // its own `name:` is also 'quest'
});
```

- **Wrong reading** — the registry KEY is the identity, so two keys holding the same `name` are two
  different ingredients.
- **Expect** — `registry()` throws `RegistryDuplicateNameError` naming **both keys**. The document says
  so: *"not expressible in the type system. A runtime check at `registry()`, throwing with both keys."*
- **Tell by** — the message names `quests` and `tasks`, not just `quest`. A message naming only the
  duplicated `name` leaves a caller hunting for the second declaration, which is the whole cost the
  check exists to remove.
- **Needs** — chunk 3 (`registryCreateBroker`).

#### A2 — every `description`, read as a session choosing between recipes would read it

```
recipes {}
→ guild-mid-execution
    one guild holding three quests, the first running with its riftcarver item dropped
```

- **Wrong reading** — a description that reads well to its author reads well to a chooser.
- **Expect** — the document does not say, and that is why this case exists. Table 1 asks for the
  reading explicitly: *"A round should read every description and ask whether a session could choose
  from it alone."*
- **Tell by** — for each ingredient and each recipe, answer two questions from the description ALONE,
  with the code closed: what exists after this runs, and can an assertion tell two of its rows apart?
  A description failing either is a finding, written as a corrected description plus the rule that
  caught it. The specification's own rejects are the rubric: `seeds a guild and some quests` fails
  because *"a session cannot tell whether it can distinguish two rows"*, and
  `calls questHydrateBroker three times` fails because *"that is how, not what"*.
- **Needs** — chunk 7 for the ingredients; chunk 8 to read the same descriptions through `recipes {}`,
  which is where a vague one actually costs something.

#### A3 — `fields` NARROWER than the real entity

```ts
fields: questFieldsContract.omit({ userRequest: true }),
// …
q[0].set({ userRequest: 'seeded' })     // a set the app would accept
```

- **Wrong reading** — a narrow `fields` is a safe default, because it only removes options.
- **Expect** — a compile error at the call site. Table 1: *"a contract narrower than the real entity
  makes a legal `set` impossible"*.
- **Tell by** — whether the error names the FIELD or only says the object is not assignable. A
  structural mismatch that names no field sends a session to the wrong file.
- **Needs** — chunk 3, and a `call-site/` fixture tree, which does not exist yet.

#### A4 — `fields` WIDER than the real entity

```ts
fields: questFieldsContract.extend({ priority: z.number() }),
// …
q[0].set({ priority: 3 })               // a set the app will reject
```

- **Wrong reading** — an extra field is inert; the route will just ignore it.
- **Expect** — it compiles, and the failure lands at RUN time or not at all. Table 1: *"wider makes an
  illegal one compile"*.
- **Tell by** — drive it against both routes. An `api` route should return a 4xx the run reports with
  the body verbatim; a `write` route will very likely write the field and say nothing. **A `write`
  route that accepts it silently is the finding** — it is the drift `copies:` exists to name, arriving
  through the ingredient's own contract rather than through the route.
- **Needs** — chunks 4 and 7, plus a server for the `api` half.

#### A5 — a `record` that omits a field the server really mints

```ts
record: guildRecordContract.omit({ urlSlug: true }),
// …
g[0].saveRecordAs({ name: 'guild' })
// a later step reads {g.guild.urlSlug}
```

- **Wrong reading** — the record is a view, so omitting a field only hides it from this recipe.
- **Expect** — the document says where it first hurts and this case checks that it hurts THERE:
  *"a record that omits a server-assigned field makes `saveRecordAs` hand back less than exists, and a
  later `fromSaved` cannot reach it"*.
- **Tell by** — three readings, and they should disagree in an informative way. (1) Does the create
  route's record parse succeed, silently dropping the field, or throw `HydrationRecordShapeError`?
  (2) Does `fromSaved({ name: 'guild', field: 'urlSlug' })` fail at pre-flight or at run time?
  (3) Does a batch's `{g.guild.urlSlug}` refuse and name the rows that step saved? **If (1) drops the
  field silently, the damage surfaces two steps away from its cause, and that is the finding.**
- **Needs** — chunks 4 and 7 for (1) and (2); chunk 8 for (3).

#### A6 — an `api`-only ingredient met by a caller with no `baseUrl`

```ts
routes: { api: ({ target, fields }) => httpPost({ target, path: '/api/guilds', fields }) },
// and an integration test calling run(plan, { home })
```

- **Wrong reading** — a missing route is caught when the route is reached, so a plan whose api-only
  ingredient comes last still does most of its work.
- **Expect** — refused BEFORE the first write, naming the ingredient and what the target lacks. Table
  1's own worry is the opposite: *"an `api`-only ingredient is unreachable from an integration test,
  and nothing says so until the run"*.
- **Tell by** — put the api-only ingredient LAST in the plan, and assert that nothing at all was
  written to the temp home. A plan that seeds the first three rows and then refuses is the failure;
  `HydrationRouteUnavailableError` before any write is the pass. Then read the listing's `runs` line
  and confirm it says `needs a server: <ingredient>` — the specification calls that *"the line that
  stops a wasted run"*.
- **Needs** — chunk 4 for the pre-flight; chunk 3 for `planRunsTransformer`; chunk 8 to see the line.

#### A7 — `links` absent, so the row lands at TOP LEVEL

```ts
// questIngredient with its links: [] — no guild anywhere
dm.quests.add(1, (q) => [q[0].set({ title: 'orphan' })]);
```

- **Wrong reading** — the type system catches an unparented row, because it catches a child accessor
  on the wrong host.
- **Expect** — it COMPILES and the runner refuses it. The gaps table measured this:
  *"`Entry<R>` hands out a collection for every registered ingredient, so `dm.quests.add(1, …)` at top
  level typechecks with no guild anywhere — measured against the prototype. The RUNNER must refuse
  it before the first write."*
- **Tell by** — `HydrationUnlinkedRowError` at pre-flight, its message naming both `quest` and the
  link it cannot fill. Assert the temp home is empty afterwards.
- **Needs** — chunk 4. **CONFIRM** — three tests for this already exist in the chunk-4 plan.

#### A8 — `links` wrong: `as` naming no field, `of` naming no ingredient

```ts
links: [{ of: 'guild', as: 'guildIdentifier' }],   // no such field on the quest
links: [{ of: 'guilds', as: 'guildId' }],          // the registry KEY, not the ingredient NAME
```

- **Wrong reading** — `of` takes the registry key, since that is what a chain types.
- **Expect** — split, and the split is the case. Table 1: *"a wrong `as` does not compile; a wrong `of`
  fails at `registry()`"*. The `of` half is the easy mistake to make, because the registry key and the
  ingredient name are usually near-identical (`guilds` against `guild`).
- **Tell by** — the `as` half is a compile error naming the field. The `of` half throws
  `RegistryDanglingLinkError`; assert it lists the names that ARE registered, so a caller sees
  `guild` next to the `guilds` they typed.
- **Needs** — chunk 3, plus a `call-site/` fixture tree for the `as` half.

#### A9 — `transitions` absent, and a caller sets that field anyway

```ts
// questIngredient declared with no `transitions` key at all
q[0].set({ status: 'in_progress' })
```

- **Wrong reading** — `set` on a lifecycle field always walks, because `set` is the one verb and the
  ingredient decides.
- **Expect** — *"the field is written, never walked"* — Table 1's own answer. So `set` becomes `setRaw`
  silently, and the caller cannot tell from the call site.
- **Tell by** — after the run, the quest's `status` reads `in_progress` and **no operation rows exist
  under it**. That ratio — a walked status with an empty relay — is the observable, and it is the exact
  state the specification warns about under *"One verb sets state"*: *"a walk measuring an empty screen
  and reporting a defect in working code"*. If nothing distinguishes this from a real walk, the
  finding is that an ingredient can silently downgrade `set` to `setRaw`, and the rule belongs beside
  `setRaw`'s own paragraph.
- **Needs** — chunks 4, 5 and 7.

#### A10 — a `to` list MISSING a state the app really reaches

```ts
transitions: { field: 'status', to: ['created', 'approved'], reach },
// …
q[0].set({ status: 'in_progress' })    // the state is real; the list omits it
```

- **Wrong reading** — a short `to` list is conservative and costs only convenience.
- **Expect** — a compile error at the call site, and no other signal anywhere. Table 1: *"a `to` list
  missing a state makes that state unreachable by any caller"*.
- **Tell by** — whether ANYTHING reports the gap between `to` and the field's own type. Nothing does
  today, so the reachable-but-undeclared state is invisible until a planner needs it. **Expect this
  case to produce a rule rather than a fix**: the honest answer is a note beside `transitions` saying
  a narrow `to` is deliberate and must be justified, since `blocked` being off the list is correct and
  `in_progress` being off it is a bug, and nothing distinguishes the two.
- **Needs** — chunk 3 and a `call-site/` fixture.

#### A11 — a `to` list INCLUDING a state the gates refuse

```ts
transitions: { field: 'status', to: ['created', 'approved', 'in_progress', 'blocked'], reach },
// …
q[0].set({ status: 'blocked' })        // compiles; the gates say no
```

- **Wrong reading** — `to` is the contract, so anything on it is reachable.
- **Expect** — *"a `to` list too wide lets a caller ask for something the gates refuse, and that
  surfaces as a `reach` throw"*. So the compile check passes and the run fails.
- **Tell by** — `HydrationTransitionRefusedError`, and specifically whether its message carries what
  the GATE said. The specification sets the bar: *"Name `from`, `to`, and what the gate said. 'Cannot
  go to in_progress from created' is a real answer; a stack trace is not."* A message that names
  `from` and `to` but swallows the gate's own sentence fails this case even though the error fired.
- **Needs** — chunks 5 and 7.

#### A12 — `defaults` absent, so every row is identical

```ts
// questIngredient with no `defaults` key
g[0].quests.add(3, (q) => [])
```

- **Wrong reading** — identical rows are fine as long as the count is right; an assertion can index
  them positionally.
- **Expect** — Table 1 says the cost precisely: *"every row gets identical fields — the 'two of
  anything' rule silently breaks"*. Nothing reports it.
- **Tell by** — build the plan and compare the three `create` ops' `fields` with `toStrictEqual`. Three
  equal objects is the observable, and it needs no target at all. Then ask the real question: should
  anything notice? **A rule saying an ingredient whose `add` count may exceed one must declare
  `defaults` is the candidate finding**, and it is enforceable in the same place `copies:` is — a
  `superRefine` on the declaration, not a lint rule.
- **Needs** — chunk 3. Tier 1.

#### A13 — `defaults` returning the same value for every index

```ts
defaults: () => ({ title: 'Quest' }),      // the index is ignored
```

- **Wrong reading** — `defaults` being present is the safeguard; what it returns is the author's
  business.
- **Expect** — the specification asks this one as an open question —
  *"does anything notice, or does a walk just quietly lose the ability to tell two rows apart?"* —
  and the answer today is that nothing notices. A12's op-tree comparison shows why: a constant
  `defaults` and an absent one produce byte-identical `create` ops.
- **Tell by** — the two plans' op trees are equal. If they are, the two failures are indistinguishable,
  and any check that catches A12 catches this one for free. **That equivalence is the finding.**
- **Needs** — chunk 3. Tier 1.

#### A14 — `defaults` varying by something other than the index

```ts
defaults: (index) => ({ title: `Quest ${index + 1} at ${Date.now()}` }),
```

- **Wrong reading** — a clock inside `defaults` only affects a field nobody asserts on.
- **Expect** — *"a default that varies by anything but the index breaks byte-identity across
  instances"*, and nothing in the repo stops it: the gaps table records that the determinism lint rule
  is **unbuilt and unowned**.
- **Tell by** — run the SAME plan twice against two fresh temp homes and diff the trees byte for byte.
  A difference is the observable, and it is the only one available until the rule ships. Record which
  files differed — that is what tells a later session whether the value reached a screen.
- **Needs** — chunks 4 and 7. **Blocked from being PREVENTED** until the
  `@dungeonmaster/eslint-plugin` rule lands; this case only detects it. A round that finds one must
  resist adding the eslint entry itself: `recipes-ledger.md:122` records that an entry naming a rule
  that does not exist *"crashed lint for every file in the package"*.

#### A15 — `copies:` pointing at the wrong production code

```ts
copies: 'questHydrateBroker',      // the write route actually imitates questPersistBroker
```

- **Wrong reading** — `copies:` is documentation, so a wrong one costs a reader a minute.
- **Expect** — **the two-route comparison test still PASSES.** Table 1 says so and flags it as the
  finding rather than the failure: *"a wrong pointer makes the two-route test assert against the wrong
  thing, and it PASSES"*.
- **Tell by** — run the ingredient's own two-route comparison with the pointer wrong and watch it go
  green. Then ask what WOULD have caught it. The answer is nothing, because the comparison runs the
  ingredient's `api` route against its `write` route and never reads `copies:` at all. **The finding is
  that `copies:` is unverified by construction**, and the rule it produces belongs beside `copies:`:
  the pointer is a diagnosis aid, not a checked claim, and a reader must treat it as a lead.
  A candidate observable, worth recording even if nobody builds it: `copies:` naming an export that does
  not exist in the repo is checkable, and an unchecked name is how the pointer rots.
- **Needs** — chunk 7, which is where the first two-route test exists. This case is a deliberate
  mutation of a passing test, which is the only way to prove a test's blind spot.

#### A16 — `extras` absent

```ts
// sessionIngredient with no `extras` key
s[0].withNestedChain({ depth: 2 })
```

- **Wrong reading** — an undeclared extra falls through to something generic.
- **Expect** — a compile error; *"the ingredient has only the built-in verbs"*. The prototype proves
  it (`withNestedChain` on a quest is one of the compiler's own negative cases).
- **Tell by** — the error names the verb. **CONFIRM.**
- **Needs** — chunk 3 and a `call-site/` fixture.

#### A17 — an `extra` named after a built-in

```ts
extras: { set: { args, apply } },
extras: { remove: { args, apply } },
```

- **Wrong reading** — an extra shadowing `set` overrides it for this ingredient.
- **Expect** — refused. **CONFIRM** — `extraVerbNameContract`'s `superRefine` over
  `reservedVerbStatics.verbs` already refuses it at parse time, with an `it.each` over every reserved
  verb (`recipes-ledger.md:87`).
- **Tell by** — the message names the verb AND says it is reserved. Confirm the `it.each` covers the
  whole statics list rather than a hardcoded subset; a reserved-verb list that drifts from the verbs
  the chain actually has is how this check quietly stops covering a new verb.
- **Needs** — nothing. The parse-time proof already landed, so the confirming half is tier 0, a read of
  `extra-verb-name-contract.test.ts`; the compile-time half is tier 2, and
  `test/type-fixtures/declaration/extra-named-set.ts` and `extra-named-remove.ts` are already written.

---

## 7. Round B — nesting

#### B1 — four levels

```ts
dm.as.add(1, (a) => [
  a[0].bs.add(1, (b) => [
    b[0].cs.add(1, (c) => [
      c[0].ds.add(1, (d) => [d[0].set({ label: 'depth four' })]),
    ]),
  ]),
]);
```

- **Wrong reading** — three levels working means N levels work, because the machinery is recursive.
- **Expect** — the document does not say. Three levels is all that is proven:
  *"three levels (guild → quest → operation) is proven at type level. **Four? Five?**"*
- **Tell by** — three separate readings, because they can disagree. (1) Does `d[0]` appear on `c[0]` at
  all, or does the accessor vanish? (2) Does the `create` op carry a full four-segment `ancestors`
  array, or a truncated one? (3) Does `link-values` fill `d`'s link to `a` — three levels up — from the
  ancestor chain? **A vanished accessor fails loudly; a truncated `ancestors` array fails silently and
  is the outcome to hunt for.**
- **Needs** — chunk 3 for (1) and (2), chunk 4 for (3). A synthetic registry in
  `packages/hydration/test/type-fixtures/`, not this repo's ingredients.

#### B2 — five levels, and where it stops

```ts
// the same shape, one level deeper, then deeper again until something gives
```

- **Wrong reading** — a depth limit, if there is one, announces itself.
- **Expect** — the document does not say, and the question it asks is specifically about the failure
  MODE: *"Where does the ancestor chain stop resolving, and does it fail loudly or silently?"*
- **Tell by** — add one level at a time and record, at each depth, whether the child accessor is still
  typed, whether `ancestors` is complete, and whether the TypeScript error (if any) is
  `TS2589: Type instantiation is excessively deep` or something that reads like a missing property.
  `rowRefContract`'s pattern has no depth limit — `(?:\/[A-Za-z][A-Za-z0-9-]*\[\d+\])*` — so any limit
  found is in the mapped types, not in the reference. **Record the depth and the exact error text**;
  a limit nobody wrote down becomes folklore the first time somebody hits it.
- **Needs** — chunk 3. Tier 2.

#### B3 — an `add` inside an `add` inside an `add`, each with its own `defaults`

```ts
dm.guilds.add(2, (g) => [
  g[0].quests.add(2, (q) => [
    q[0].operations.add(2, (o) => []),
  ]),
]);
```

- **Wrong reading** — the innermost `defaults` sees a running index across the whole plan.
- **Expect** — each `add`'s index restarts at 0. The document is explicit:
  *"The index is 0-based and scoped to ITS OWN `add`."*
- **Tell by** — the op tree's `create` ops carry `index: 0` and `index: 1` at every level, and their
  `fields` repeat per level. **CONFIRM** — `collection-chain-transformer`'s own test asserts it.
- **Needs** — chunk 3. Tier 1.

#### B4 — a `filter` inside a nested `add`, and whether the runner honours its scope

```ts
dm.guilds.add(2, (g) => [
  g[0].quests.add(1, (q) => [
    q[0].set({ status: 'in_progress' }),
    q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove(),
  ]),
  g[1].quests.add(1, (q) => [q[0].set({ status: 'in_progress' })]),
]);
```

- **Wrong reading** — a filter names an ingredient, so it matches that ingredient's rows.
- **Expect** — it matches only rows under `g[0]`'s quest. The gap is CLOSED and the round CONFIRMS
  rather than re-opens it: *"it is scoped to its immediate host. The `filter` op carries `scope`, the
  host's row reference, and the runner matches only rows whose ancestor chain contains it."*
- **Tell by** — after the run, `g[1]`'s quest still has its riftcarver operation. **Two guilds is the
  minimum shape**; a one-guild plan cannot catch a scope bug at all, which is exactly why chunk 7's
  own composition test uses three quests.
- **Needs** — chunk 6, and the Q2 route edit that gives `filter` a `query` route to run against at all.

#### B5 — an ingredient linking two levels up, skipping one

```ts
// an ingredient whose links name the GRANDPARENT and not the parent
links: [{ of: 'guild', as: 'guildId' }],
// and the chain asks for it under a quest:
g[0].quests.add(1, (q) => [q[0].skippers.add(1, (s) => [])]);
```

- **Wrong reading** — a quest's ancestor chain contains a guild, so the accessor is available under a
  quest.
- **Expect** — it is NOT. Both conditions bind, and the second one alone gives the wrong answer:
  *"the host is named in that child's `links`, and every one of that child's links is satisfied by
  something already in the ancestor chain … **Condition 2 alone gives you the second case wrong**,
  which is measured: dropping it makes `q[0].sessions` compile."* So the accessor appears on `g[0]`
  only.
- **Tell by** — `q[0].skippers` is a compile error and `g[0].skippers` is not.
- **Needs** — chunk 3. **There is a live lead waiting for this case.**
  `scrolls/seigelense/plans/recipes-chunk-07-repo-ingredients.md:287` writes
  `a[0].subagents.add(1, …)` while `:575` gives `subagent` links naming `session` and `guild` and no
  self-link — so that accessor cannot exist under the immediate-parent rule. Drive B5 against chunk 7's
  own recipe before writing the general case; a case that reproduces a real declaration beats a
  synthetic one.

#### B6 — two sibling `add` calls under one host mint COLLIDING references

```ts
dm.guilds.add(1, (g) => [
  g[0].quests.add(2, (q) => [q[0].saveRecordAs({ name: 'first-pair' })]),
  g[0].quests.add(2, (q) => [q[0].saveRecordAs({ name: 'second-pair' })]),
]);
```

- **Wrong reading** — per-`add` index scoping is a fact about `defaults`, so two sibling `add` calls
  are just four rows.
- **Expect** — the document does not say, and the mechanism says they collide. A row's reference is
  derived from the ancestor path, the ingredient name and the index, and from nothing else:

  ```ts
  // packages/hydration/src/transformers/row-ref/row-ref-transformer.ts:26
  const segments = [...ancestors, `${ingredient}[${index}]`];
  ```

  Both `add` calls see indexes 0 and 1 under the same ancestors, so both mint `guild[0]/quest[0]` and
  `guild[0]/quest[1]`. The runner's own carrier is a single flat map —
  `hydration-run-state-contract.ts:25-27` types `records: Map<RowRef, unknown>` — so the second pair
  overwrites the first.
- **Tell by** — build the plan and collect every `create` op's `ref`. Four ops, two distinct values, is
  the observable and it needs no runner. Then run it and read the saved output: does `first-pair` hold
  the first `add`'s row, or the second's? **Expect the existing test to pass while this is true** —
  `recipes-chunk-01-03-framework-types.md:904` asserts *"the four refs"*, which four ops with two
  distinct values satisfies. That is the "nothing notices" shape Table 1 warns about, arriving in
  Round B.
- **Needs** — chunk 3 for the op-tree half (tier 1), chunk 4 for the saved-output half.

#### B7 — two TOP-LEVEL `add` calls of the same ingredient

```ts
dm.guilds.add(1, (g) => [g[0].quests.add(1, (q) => [q[0].saveRecordAs({ name: 'a' })])]),
dm.guilds.add(1, (g) => [g[0].quests.add(1, (q) => [q[0].saveRecordAs({ name: 'b' })])]),
```

- **Wrong reading** — two top-level `add` calls are how you write a plan holding two guilds, and the
  specification's own scope discussion assumes exactly that plan.
- **Expect** — both guilds are `guild[0]`, and every descendant reference collides wholesale:
  `guild[0]/quest[0]` names two different quests under two different guilds. This is B6's mechanism
  with no ancestor segment to separate the two.
- **Tell by** — the op tree again, and then the sharper consequence: a `filter` scoped to
  `guild[0]/quest[0]` would match rows under BOTH guilds, which is precisely the outcome the scope rule
  was introduced to prevent — *"lets a recipe holding two guilds delete rows belonging to a parent it
  did not create"*. Drive the filter half only after the op-tree half is recorded.
- **Needs** — chunk 3 (tier 1), then chunk 6 for the filter consequence. **If B6 and B7 hold, the
  finding is one rule and it belongs beside `add`**: two `add` calls of the same ingredient under the
  same host are indistinguishable, so a plan wanting two of anything writes `add(2)`. Whether the
  framework should instead make the reference unique is a decision for whoever owns chunk 4, not for
  this round.

#### B8 — a TOP-LEVEL `filter`, in a plan holding two guilds

```ts
dm.guilds.add(2, (g) => [ /* … */ ]),
dm.operations.filter({ where: { role: 'riftcarver' } }).remove(),
```

- **Wrong reading** — a filter is scoped to its host, and every filter has one.
- **Expect** — a top-level filter has NO host and is instance-wide. **CONFIRM** —
  `recipes-chunk-04-06-runner.md:297-300` (D11) decided it, and the chain implements it:
  `collection-chain-transformer.ts:64` reads
  `const scope = ancestors.length === 0 ? undefined : ancestors[ancestors.length - 1];`.
- **Tell by** — the `filter` op has no `scope` key, and the run deletes rows under both guilds.
  **Then check the document.** Part 5's `filter` section says a filter *"is scoped to its immediate
  host, never the whole instance"* with no top-level exception, and the CLOSED gap row says the same.
  A decision that lives only in a chunk plan is a rule a recipe author will not find. **The candidate
  finding is a documentation one: the top-level exception belongs in Part 5 beside the scope rule.**
- **Needs** — chunk 6 to drive; the documentation half needs nothing and can land from tier 0.

---

## 8. Round C — composing the chainables

**Each case is a pair or a triple, and each has a plausible reading that is wrong.** That is the
specification's own framing and it is what makes a case worth running.

#### C1 — `filter` over rows a `transition` in the same plan just minted

```ts
q[0].set({ status: 'in_progress' }),
q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove(),
```

- **Wrong reading** — `filter` reads the plan, so it cannot see rows no op in the plan created.
- **Expect** — it sees them, and the ordering is guaranteed. *"`filter` reads live state, not the plan.
  It queries whatever exists at that moment"*, and *"Depth-first in declaration order … is the only
  ordering guarantee."*
- **Tell by** — the riftcarver operation is gone and the other roles survive, asserted as a complete
  array with `toStrictEqual`. **CONFIRM** — chunk 5 and chunk 7 both own a test for this.
- **Needs** — chunks 5, 6 and 7.

#### C2 — `saveRecordAs` on a row a later `remove` deletes

```ts
q[2].saveRecordAs({ name: 'third' }),
q[2].remove(),
```

- **Wrong reading** — the plan's output is assembled at the end, so a removed row drops out of it.
- **Expect** — the saved record is **stale**, and that is deliberate. **CONFIRM** —
  `recipes-chunk-04-06-runner.md:302-304` (D12) rules it: the record is as of the save, and
  *"a stale record a caller can inspect beats a hole it cannot"*.
- **Tell by** — the run's output carries `third` with the record's fields intact, and reading the home
  finds no such row. **Then drive the consequence the ruling does not cover**: a batch step reading
  `{g.third.id}` gets a real-looking id for a row that is gone, and the next `goto` 404s. If nothing
  in the batch layer warns, the finding is a rule belonging beside `saveRecordAs`, not beside `remove`.
- **Needs** — chunk 4 for the record half; chunk 8 for the batch half.

#### C3 — `fromSaved` pointing into a filtered SET rather than one row

```ts
q[0].operations.filter({ where: { role: 'ward' } }).saveRecordAs({ name: 'wardOp' }),
q[1].set({ userRequest: fromSaved({ name: 'wardOp', field: 'id' }) as never }),
```

- **Wrong reading** — a filter with `expect: 'one'` makes the saved name unambiguous, so `fromSaved`
  means that row.
- **Expect** — **the document does not say, and neither does any chunk plan.** The runner plan defers
  it — *"What chunk 6 keeps is the half that genuinely needs live state: `fromSaved` pointing into a
  filtered set"* — with no decision text and no named test. This is the most open case in Round C.
- **Tell by** — run it with the filter matching exactly one row, then with it matching two. Record
  three things: which record `saved` holds after each, whether the pre-flight accepted the `fromSaved`
  at all, and whether anything distinguishes the one-match case from the two-match case. The mechanism
  predicts the two-match case keeps the LAST match, silently — the matched set replays its nested ops
  once per matched row (`op-filter-contract.ts:5-6`) and `saved` is a `Map` keyed by name. **A silent
  last-wins is the finding**, and the rule it produces belongs beside `fromSaved`.
- **Needs** — chunk 6. **Blocked until then**, and worth flagging to whoever owns chunk 6, since it is
  their file group's undecided question and not this round's to decide.

#### C4 — two transitions on the same row, in one plan

```ts
q[0].set({ status: 'approved' }),
q[0].set({ status: 'in_progress' }),
```

- **Wrong reading** — the second `set` supersedes the first, so the row walks once, straight to
  `in_progress`.
- **Expect** — the document does not say. It says a plan is a tree walked depth-first in declaration
  order, and that `set` walks *"from the current value to the asked-for one"* — which reads as two
  walks, each from wherever the last one left the row.
- **Tell by** — the side effects, not the final status. Both orderings end at `in_progress`; only the
  ledger tells them apart. Assert on what the relay minted: one walk through `approved → in_progress`
  should mint a different set of operation rows than `created → approved` followed by
  `approved → in_progress`. **If the two produce identical state, the finding is that a second
  transition is a no-op the caller cannot see.** Also check whether `planFoldWritesTransformer` folds
  the two `set` ops into one — a fold that collapses two transitions into one is a silent behaviour
  change and is the outcome to hunt for.
- **Needs** — chunks 4 and 5.

#### C5 — `setRaw` on a transition field, then `set` on the same field

```ts
q[0].setRaw({ status: 'complete' }),
q[0].set({ status: 'in_progress' }),
```

- **Wrong reading** — `setRaw` writes a value, so the later `set` walks from `complete` like any other
  starting point.
- **Expect** — the document does not say, and the question has two halves it names itself:
  *"does the second walk from the raw value, and is that value even a legal `from`?"* A row written to
  `complete` by `setRaw` is a row the gates never produced, so `complete → in_progress` may be a
  transition no gate has an answer for.
- **Tell by** — whether `reach` receives `from: 'complete'` or `from:` whatever the row's last WALKED
  value was. Instrument the ingredient's `reach` to record its `from` — that one value answers the
  case. Then record what the gates do with it: a `HydrationTransitionRefusedError` naming a `from` the
  gates never mint is a good failure; a silent success is a finding.
- **Needs** — chunks 4 and 5.

#### C6 — `remove` on a parent whose children exist

```ts
g[0].quests.add(1, (q) => [
  q[0].set({ status: 'in_progress' }),        // mints operations under it
]),
g[0].quests.filter({ where: { title: '…' }, expect: 'one' }).remove(),
```

- **Wrong reading** — removing a parent removes its subtree, the way a directory delete does.
- **Expect** — the document does not say. It says only *"`remove()` — deletes a row, or every row a
  filter matched"*, and the `remove` ROUTE is the ingredient's own, so what happens to children is
  whatever that route does.
- **Tell by** — read the home afterwards and count what survives. Three outcomes and they are
  distinguishable: the children are gone (cascade), the children remain with a dangling parent id
  (orphaned), or the route throws. **An orphan is the dangerous one**, because the plan reports success
  and the next walk measures a screen rendered from half-deleted state. Whichever it is, it is a rule
  belonging beside `remove`, since a recipe author has no way to know today.
- **Needs** — chunks 6 and 7, plus the Q2 route edit that gives `remove` a route to call.

#### C7 — two ingredients whose `links` name the SAME parent, under one `add`

```ts
g[0].quests.add(1, (q) => [
  q[0].operations.add(1, (o) => []),      // links: quest, guild
  q[0].notes.add(1, (n) => []),           // links: quest, guild — the same two parents
]);
```

- **Wrong reading** — two children of one parent are independent, so their order is irrelevant.
- **Expect** — **the document does not say, and nothing in this build has asked.** A survey of every
  chunk plan found the two-links-to-DIFFERENT-parents case covered three ways and this one covered
  nowhere. Table 2 asks only for *"ordering between them"*.
- **Tell by** — three readings. (1) Do both children receive the same `guildId` and the same `questId`,
  read off the same ancestor records? (2) Do they run in declaration order, `operations` before
  `notes`? (3) Does either child's create see a parent record the other child's create MUTATED — which
  is the real risk, since both read the same entry from `records: Map<RowRef, unknown>`. Assert the two
  resolved link maps with `toStrictEqual` against each other.
- **Needs** — chunk 4 for `linkValuesTransformer` against a real ancestor chain, and a second
  ingredient sharing `quest`'s parentage. Chunk 7 declares no such pair today, so this case supplies
  its own synthetic ingredient rather than waiting on one.

#### C8 — `under()` with an id that does not exist

```ts
dm.sessions.under({ guildId: 'guild-that-was-never-created' }).add(1, (s) => [])
```

- **Wrong reading** — `under()` is a link like any other, so the pre-flight checks it the way it checks
  an ancestor link.
- **Expect** — the document asks it as an open question — *"a refused plan, or a foreign-key error from
  the database"* — and the mechanism says neither. `under()`'s values are folded into the create op's
  FIELDS at build time (`collection-chain-transformer.ts:85-88`), so the pre-flight sees a satisfied
  link and has nothing left to check. The id's validity is the target's business.
- **Tell by** — the two targets should diverge and that divergence is the case. A file target very
  likely writes a session under a guild directory that does not exist — which lands on the sad-path
  row that says *"the parent directory does not exist — **create it**"*, quietly manufacturing a guild
  nobody asked for. A database target raises a foreign-key error from the driver, not from the
  framework. **Two targets, two completely different outcomes for one call, is the finding**, and the
  rule belongs beside `under()`.
- **Needs** — chunks 4 and 7 for the file half; `sqlTargetHarness` (chunk 6b) for the database half.

#### C9 — a transition whose gates mint rows another transition removes

```ts
q[0].set({ status: 'in_progress' }),       // the relay seeds operation rows
q[0].set({ status: 'complete' }),          // whose gates tear some of them down
```

- **Wrong reading** — `makes:` counts the plan, so it reports what the plan ends up having made.
- **Expect** — `makes:` reports neither count and may not name the ingredient at all. The document is
  blunt: *"A transition's minted rows are invisible to `makes`, not merely their count … **The
  INGREDIENT cannot be known either**, wherever nothing else in the plan names it."*
- **Tell by** — print the listing for this exact plan and compare it with what the home holds. The
  listing should show `quest ×1` and no `operation` line at all; the home should hold whatever the two
  walks left. **The gap between them is the observable**, and the rule is already written — this case
  confirms it survives a plan where two transitions fight. Then add a `filter` naming `operation` and
  watch `operation (varies)` appear, which is the only way the listing ever mentions it.
- **Needs** — chunks 5 and 7 to drive; chunk 3's `planMakesTransformer` for the listing; chunk 8 to see
  it printed. **CONFIRM on the rule; the two-transition shape is new.**

#### C10 — a `filter`'s placeholder reference colliding with a real row's

```ts
q[0].operations.add(1, (o) => [o[0].set({ role: 'ward' })]),
q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove(),
```

- **Wrong reading** — a matched set's internal reference is private to the filter node, so it cannot
  clash with anything.
- **Expect** — the two references are the same string. A matched set derives its `matchedRef` from the
  scope, the ingredient and a fixed index 0
  (`matched-set-chain-transformer.ts:54-58`), and a real `add` derives the same value the same way. So
  `guild[0]/quest[0]/operation[0]` names both the added row and the filter's placeholder. §4b of the
  runner plan reviewed the filter-against-filter version and closed it as harmless *"because nothing
  resolves a row reference globally"*, then named the standing risk in the next breath:
  *"A placeholder reference is textually indistinguishable from a real row's reference at the same
  scope, ingredient and index."* **This case is the add-against-filter version, which §4b does not
  cover.**
- **Tell by** — build the plan and assert the two refs are equal, which needs no runner. Then run it
  and read `records`: does the filter's replay write over the added row's entry, and does a later
  `q[0].operations` verb resolve to the added row or to the last matched one? The `add` op runs first,
  so a later global resolution reads the filter's row — that is the failure shape.
- **Needs** — chunk 3 (tier 1), chunk 6 to drive. **Whatever the result, record the assertion**: it is
  the test that would fail if a later change resolved a matched reference by string across the tree,
  and §4b says that test does not exist today.

#### C11 — one saved name, many rows

```ts
g[0].quests.add(3, (q, all) => [all.saveRecordAs({ name: 'quest' })]),
q[0].operations.filter({ where: { role: 'ward' } }).saveRecordAs({ name: 'wardOp' }),
```

- **Wrong reading** — `all.saveRecordAs` saves the set, so the output carries an array.
- **Expect** — the output is flat and one name holds one record. *"A plan's output is FLAT, and there
  is exactly one shape. Every `saveRecordAs({ name })` puts that row's WHOLE record on the output under
  that name."* Both spellings above produce N `saveRecord` ops with the SAME name — `all` maps the verb
  over every ref (`collection-chain-transformer.ts:130-133`) — and `saved` is a
  `Map<SavedRecordName, unknown>`. So the last one wins, silently.
- **Tell by** — the output holds one record, and it is the LAST row's. Assert which row it is, not just
  that a record is there. **If `all.saveRecordAs` compiles, the finding is that the chain offers a call
  whose only possible meaning is "keep one of these and discard the rest"**, and the rule — either
  refuse it at the type level or say plainly which row survives — belongs beside `saveRecordAs`.
- **Needs** — chunk 3 for the op-tree half (tier 1), chunk 4 for the output half.

#### C12 — two `saveRecordAs` calls sharing a name on different rows

```ts
q[0].saveRecordAs({ name: 'target' }),
q[2].saveRecordAs({ name: 'target' }),
```

- **Wrong reading** — a duplicate name is a mistake somebody catches, the way a duplicate recipe name
  is caught by `recipeManifestContract`.
- **Expect** — nothing catches it. The pre-flight's checks are listed and this is not among them, and
  `saved` is a Map. `planSavedNamesTransformer` exists and collects the names — whether it notices a
  repeat is the question.
- **Tell by** — build the plan and see whether anything refuses it. Then run it and see which row
  `target` holds. A pre-flight refusal naming both refs is the good outcome; a silent last-wins is the
  finding, and it is the same rule C11 produces, which is worth noting rather than writing twice.
- **Needs** — chunk 3 (tier 1), chunk 4.

#### C13 — `expect: 'one'` matching TWO rows

```ts
q[0].operations.filter({ where: { role: 'ward' }, expect: 'one' }).remove()
// with two ward operations under that quest
```

- **Wrong reading** — `expect: 'one'` narrows to the first match, the way a singular selector does.
- **Expect** — it must throw, and the throw must name the candidates. The specification derives
  `expect` from the tool's own no-pick rule: *"`siegelense` already refuses an ambiguous DOM target and
  throws naming the candidates … A filter is the same question one layer down, so it answers the same
  way."* And Part 6 carries the rule the other way round:
  *"Never `.first()` / `.last()` in a command. Ambiguity THROWS, and the error carries the candidates."*
- **Tell by** — which error fires and what its message says.
  `HydrationFilterExpectationError`'s own header scopes it to the opposite direction —
  `hydration-filter-expectation-error.ts:17-18` reads
  *"once a `filter` op's query succeeds but returns fewer rows than `expect` requires (zero, for the
  default `'some'`)"* — so an over-match may fall through it entirely. Assert the message names how
  many matched AND enough of each row to tell them apart. **A silent pick of the first match is the
  worst outcome and the one to look for.**
- **Needs** — chunk 6.

#### C14 — `under()` and `defaults(index)` writing the same field

```ts
dm.sessions.under({ guildId }).add(2, (s) => [])
// sessionIngredient's defaults: (index) => ({ guildId: `seeded-${index}` })
```

- **Wrong reading** — a recipe INPUT is more specific than a default, so it wins.
- **Expect** — the default wins. `collection-chain-transformer.ts:85-88` spreads
  `{ ...(underValues ?? {}), ...(ingredientConfig.defaults?.(index) ?? {}) }`, so `defaults` is applied
  second and overwrites. **The caller's explicit input loses to the ingredient's default, silently.**
- **Tell by** — the `create` op's `fields.guildId` reads `seeded-0`, not the passed id. No runner
  needed. Then decide which precedence is right and write it down either way — the rule belongs beside
  `under()`, which today says only that it *"supplies a link from a recipe INPUT rather than from an
  ancestor"* and says nothing about precedence.
- **Needs** — chunk 3. Tier 1.

#### C15 — `under()` and an ANCESTOR link writing the same field

```ts
g[0].sessions.under({ guildId: someOtherGuildId }).add(1, (s) => [])
```

- **Wrong reading** — `under()` and an ancestor cannot both supply a link, because `under()` exists for
  the case with no ancestor.
- **Expect** — the document does not say. `under()` writes into the create op's fields at BUILD time;
  `links` are resolved by the runner at RUN time. So whether the ancestor's id overwrites the explicit
  one depends on which side `linkValuesTransformer` merges last, and nothing records that choice.
- **Tell by** — the written row's `guildId`. Two outcomes and both are defensible; what is not
  defensible is neither being written down. Note that the accessor `g[0].sessions` may not even offer
  `under()` — check that first, because a type-level refusal is the cleanest answer and would close the
  case without a run.
- **Needs** — chunk 3 to see whether it compiles, chunk 4 to see which value lands.

#### C16 — a transition set through `all`

```ts
g[0].quests.add(3, (q, all) => [all.set({ status: 'in_progress' })])
```

- **Wrong reading** — `all.set` is one op over a set, so one walk covers three rows.
- **Expect** — three walks. `all.set` maps the op over every ref
  (`collection-chain-transformer.ts:116-125`), each carrying the ingredient's `transitions`, and the
  runner is serial. So three relays seed, one after another.
- **Tell by** — the op tree holds three `set` ops with a `transition` half, and the run mints three
  relays' worth of rows. **Then check the cost**: `all.set({ status })` on `add(10, …)` is ten real
  gate walks, and a recipe author reading *"`all.set({ userRequest: 'seeded' })`"* in the worked example
  has no signal that the same call on a transition field is a different order of expense. A note beside
  `all` is the candidate finding.
- **Needs** — chunk 3 (tier 1), chunks 5 and 7 to drive.

#### C17 — a transition set through a matched set

```ts
q[0].operations.filter({ where: { role: 'ward' } }).set({ status: 'complete' })
```

- **Wrong reading** — a matched set's `set` writes, because a filter reaches existing rows and
  existing rows are updated through the `update` route.
- **Expect** — it walks, if the ingredient declares `transitions`.
  `matched-set-chain-transformer.ts:94-96` passes the ingredient's `transitions` into the nested
  `set` op exactly as the handle chain does. So `filter(…).set({ status })` runs the real gates once
  per matched row, against rows the recipe did not create.
- **Tell by** — whether `reach` fires, and how many times. Then the sharper question: `reach` receives
  `{ from, to, target, record }`, and `from` for a matched row must be read from the row itself rather
  than from anything the plan knows. **If `from` arrives undefined or defaulted, the walk starts from a
  state the row is not in**, which is the silent-wrong-state failure the whole `set`/`setRaw` split
  exists to avoid.
- **Needs** — chunks 5 and 6.

#### C18 — a verb on a handle whose row a previous op removed

```ts
q[1].remove(),
q[1].set({ title: 'after the fact' }),
q[1].saveRecordAs({ name: 'ghost' }),
```

- **Wrong reading** — the chain hands out handles, so a handle to a removed row is dead and the chain
  or the pre-flight says so.
- **Expect** — the document does not say. The chain builds one op at a time and does not track which
  refs a `remove` retired, and the pre-flight's listed checks do not include this one.
- **Tell by** — whether the plan is refused, whether the `set` throws at run time, or whether it
  silently writes a row back into existence. **The third outcome is the interesting one**: a `write`
  route that creates missing parents and writes the file would resurrect a row the plan deleted two ops
  earlier. Assert what the home holds at the end.
- **Needs** — chunks 4 and 6.

#### C19 — a `create` op nested inside a `filter`

```ts
// not writable through the chain — assembled as an op tree directly
{ op: 'filter', ingredient: 'operation', where: { … }, matchedRef: '…', ops: [
  { op: 'create', ingredient: 'operation', ref: '…', index: 0, ancestors: [], fields: {} },
]}
```

- **Wrong reading** — the chain refuses `filter(…).add(…)`, so a create inside a filter cannot exist.
- **Expect** — the op CONTRACT admits it. `op-filter-contract.ts:51` types
  `OpFilterNestedOp = OpCreate | OpSet | OpRemove | OpSaveRecord | OpExtra | OpFilter`, and the nested
  `z.union` parses an `OpCreate` without complaint. The type-level refusal lives on the chain only.
- **Tell by** — parse such a tree and see it succeed, then hand it to the runner and see what happens.
  This is reachable without hand-assembly the moment `include(otherRecipe({ … }))` ships, which the
  gaps table already schedules. **The finding is a divergence between what the chain can express and
  what the data can carry**, and the rule belongs beside `filter`: the no-`add` guarantee is a chain
  property, not a plan property.
- **Needs** — chunk 1 only for the parse half — runnable today, tier 0. Chunk 6 for the runner half.

---

## 9. Round D — the sad paths, driven for real

**Round D drives; chunk 6b implements.** The specification's gaps table states the position this round
starts from:

> **No sad path is implemented or tested** — the table above is a spec, not a report. Nothing has
> driven a refused connection or a failed write.

**That is still true today, and it is the single largest constraint on this session.** Every error CLASS
exists and is message-tested; nothing throws one.
`recipes-ledger.md:111` — *"**Nothing throws any of these yet** — the runner that would fire them
(`plan-run-broker.ts` and siblings, chunk 4/5/6/6b) is not built."* So **no Round D case can be driven
until at least chunk 4 lands**, and the table below says which chunk each one actually waits on.

**Each case asserts on the MESSAGE.** The classes carry no context fields to read.

**Each case asserts two things, not one.** That the error fired, and that it named what it was doing —
because the specification's whole demand of this table is the second one:
*"Every one of these must fail LOUDLY and name what it was doing."*

| Case | The row | Drive it by | Blocked on | The observable |
|---|---|---|---|---|
| **D1** | the connection is refused, on an `api` route | point the target's `baseUrl` at a closed port | 4 + 6b | `HydrationRouteFailedError` naming **the ingredient, the route and the URL**, and the plan halting before the next op. Assert the temp home holds only what the ops before it wrote |
| **D2** | the server answers 4xx or 5xx | a stub `node:http` server returning 500 with a diagnostic body | 6b | **the body, verbatim, in the message.** *"that body is usually the real diagnosis"*. A message carrying only the status code fails this case |
| **D3** | the server answers 2xx with a shape `record` rejects | a stub server returning 200 and a record missing a field | 4 | `HydrationRecordShapeError` **naming the field**. A message naming only the ingredient fails it — *"A silently wrong record poisons every `fromSaved` and every link after it"* |
| **D4** | a `write` route's record is rejected the same way | an ingredient whose `write` route returns a truncated record | 4 (the Q8 widening) | the same class and the same field-naming. **Also read the message's wording**: `recipes-ledger.md:112` records that it still says *"answered 2xx"* even for a `write` route, an accepted finding this round can confirm is still there |
| **D5** | the write fails — `EACCES` | `fileTargetHarness.denyWrites({ relativePath })`, which already exists and self-checks for root | 6b | `HydrationWriteFailedError` **naming the path, not just the errno**. The harness throws if `chmod 0o500` did not take effect, so a false pass is not available |
| **D6** | the parent directory does not exist | plan a child whose parent directory was never created | 4 | **no error at all — the adapter creates it.** This is the one row whose pass is silence. Assert the file landed. The reason is measured: *"binding under an absent directory failed as `EACCES`, not `ENOENT`, and three sessions read it as permissions"* |
| **D7** | `reach` throws — the gates refused | ask for a state the gates refuse, per **A11** | 5 | `HydrationTransitionRefusedError` naming `from`, `to` **and what the gate said** |
| **D8** | the query fails mid-plan, distinctly from zero match | two runs side by side: an unreachable query, and a `where` matching nothing | 6 | **two different classes.** `HydrationQueryFailedError` against `HydrationFilterExpectationError`. Their own headers set the bar: the first means *"the question was never answered"*, the second *"the row was not there"*. **Neither assertion is complete without the other** — run them in one `describe` |
| **D9** | the transaction rolls back | a `sqlTargetHarness` whose wrapper throws | 6b | **nothing inside the framework throws it.** The class exists with no thrower by design. This round confirms the repo's own wrapper is what raises it, and that the message names the op that triggered it. **It cannot be driven against a file target at all** |
| **D10** | two ops race the same file | two ops writing one file in one plan | 4 | **no error, and no race** — the runner is `for…of` with `await`. The observable is the recorded route order, asserted as an array. *"The runner is serial, and that is a requirement, not an implementation detail"* |
| **D11** | the recipes package was never built | delete `packages/hydration-recipes/dist/` and call `recipes {}` | 8 | **never an empty list.** An absent build and an empty package must say different things: *"a session cannot tell 'you have written none' from 'you have not built it'"* |
| **D12** | a recipe's params fail validation | a `seed` step whose `params` miss a required input | 8 | refused **before seeding anything**, naming the bad input **and listing what that recipe takes** |
| **D13** | **stop the server MID-PLAN** | kill the API server between op three and op four of a live `seed` | 7 + 11 | the same class as D1, but the state afterwards is the point: what landed stays. This is D1 plus the no-undo rule, and it is the row Round D's own sentence names |
| **D14** | a half-run plan leaves what landed | any mid-run failure above | 4 | **no undo, no cleanup.** Assert the rows before the failure are still on disk. *"The framework does not implement undo, and must not — half-undoing is worse than a dirty tree nobody trusted"* |
| **D15** | make the home read-only MID-plan | `denyWrites` after the first op has landed | 6b | D5's class, plus D14's leftovers. Together they are what a real disk filling up looks like |
| **D16** | hand `under()` a dead id | **C8**, driven as a failure rather than as a composition | 4 + 7 | see C8. Listed here because Round D's own text names it |
| **D17** | pre-flight: an unservable route | **A6** | 4 | `HydrationRouteUnavailableError` **before the first write** |
| **D18** | pre-flight: a `fromSaved` naming a record saved LATER, or never | a forward reference, and an unknown name | 4 | refused at pre-flight, the message listing **the names that ARE saved**. The document is specific that the chain cannot catch this and the pre-flight can |
| **D19** | pre-flight: a row whose `links` no ancestor supplies | **A7** | 4 | `HydrationUnlinkedRowError`, the home empty afterwards |
| **D20** | pre-flight: a verb with no matching route | `filter(…)` on an ingredient declaring no `query` | 6's route edit + 4 | `HydrationRouteVerbUnavailableError` naming **the ingredient and the verb** |
| **D21** | a mid-batch `seed` that fails | a batch whose second `seed` step fails | 8 | **the batch halts and the instance is marked unusable**, and the remaining steps do not run. *"A partially seeded live instance is exactly the state that manufactures false defects"*. Also confirm the tool does **not** offer to re-run it |

**One row cannot be driven by this repo at all, and that is worth stating rather than discovering.**
D9's transaction rollback needs a database-backed target, and dungeonmaster keeps its state in files.
Chunk 6b's `sqlTargetHarness` is the only place it can be observed, and even there the framework is not
the thrower. A round that reports D9 as "not reproduced" without that distinction has recorded nothing.

**Two rows belong to another package and are not chunks 4-6's.** D11 and D12 are `packages/siegelense`,
chunk 8 — `recipes-chunk-04-06-runner.md:177` names them so they are *"not read as unowned"*. A Round D
session that finds them missing reports the chunk, and does not build them.

---

## 10. What this round is NOT allowed to do

**No case below builds a verb.** The specification's spine puts chunk 12 last for a reason —
*"nothing to combine until 1-11 land"*. If a case needs `query`, needs `reach`, needs a `seed` step or
needs an ingredient chunk 7 has not written, the case reports BLOCKED and names the chunk. Building it
here puts the same code in two chunks, graded by neither.

**No case edits `eslint.config.js` to add a rule that does not exist.** `recipes-ledger.md:122` records
what happened last time: the entry *"crashed lint for every file in the package"*. A14 and the
DOM-handle rule are both findings this round can report and neither is a rule it can enable.

**No case loosens an assertion to make a run land.** The conversion rule is the same rule here:
*"If a converted test needs a different assertion to pass, the ingredient is wrong — not the test."*

**No case rewrites the recipe to avoid its own finding.** That is the exit condition in §5, and it is
the one failure mode the specification names by itself.
