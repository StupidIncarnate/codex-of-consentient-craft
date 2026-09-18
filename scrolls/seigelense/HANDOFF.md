# Siegelense — the build

**Valid as of the `key` commit, 2026-09-17.** Re-derive the counts below before trusting them; the
command for each is given beside it. **A count in this file is a claim about a moment, and this file does
not update itself.**

## The score

| | Built | Total | |
|---|---|---|---|
| **Calls** | **13** | 13 | every name in the closed set routes; `notBuiltYet` is empty |
| **Step verbs** | **12** | 23 | `goto` `waitFor` `click` `type` `screenshot` `eval` `look` `box` `seed` `until` `dom` `key` |
| **Results kinds** | **6** | 6 | `console` `network` `ws` `server` `screenshots` `steps` |
| **Build-order items** | see the table | 30 | Part 7 of the spec. Count the rows yourself; the tally is what rots |

**The CALL surface is complete and the STEP surface is not**, and that split is the whole state of this
build. Every call is reachable, driven by hand and tested. `look` reads a page and mints element-bound
refs, `seed` runs a recipe, and `until` waits on something other than a locator state — so a session can
create a state, wait for the app to react to it, and then look at it. **That is the first round where a
whole browser feature can be verified end to end without racing or sleeping.**

What is left is the rest of the step vocabulary. Read "What this cannot do yet" before promising anyone a
walkthrough.

---

## The prompt

Copy the block below into a new session. It is self-contained.

> Work on `master` in `/home/brutus-home/projects/codex-of-consentient-craft`. **Read
> `scrolls/seigelense/HANDOFF.md` before anything else**, then `scrolls/seigelense/build-ledger.md`. The
> handoff carries the feature set and the definition of done; the ledger carries the row-by-row state.
>
> We are implementing the tooling described in `scrolls/seigelense/siegelense-tooling.md` in all its nitty
> gritty detail, so that I can manually test everything once without finding holes that are documented as
> requirements.
>
> **ONE PIECE AT A TIME.** Pick one piece, finish it completely — built, tested,
> warded, DRIVEN, documented, committed — then stop and tell me what you did. Do not start the next piece
> in the same turn. I would rather have one finished thing I can read than three half-done ones I have to
> untangle.
>
> **SUB-AGENT DISPATCH FOR IMPLEMENTATION AND REVIEW:**
> Launch sub-agents in sequence to do the build and verification:
>
> 1. **Coding sub-agent (The Builder):**
>    - Reads architecture (`get-architecture`, `get-testing-patterns`, `get-folder-detail`).
>    - Reads the piece requirements from `siegelense-tooling.md` and the piece's plan.
>    - Implements all source code across architectural layers: statics, contracts & stubs, adapters (impl, proxy, unit test), brokers (impl, proxy, unit test), transformers, and guards.
>    - Writes comprehensive unit tests following testing patterns (proxy pattern, strict assertions, branded Zod contracts).
>    - Runs scoped ward on touched files until 100% green (`npm run ward -- --only lint,typecheck,unit -- <files>`).
>    - Does not boot real background server processes or leave running instances.
>    - Reports back to parent with touched files, test results, and implementation notes.
>
> 2. **Manual verification & review sub-agent (The Driver & Fixer):**
>    - Reads `scrolls/seigelense/manual-verification-runbook.md` before driving.
>    - Builds compiled output (`npm run build --workspace=@dungeonmaster/siegelense && npm run build --workspace=@dungeonmaster/cli`).
>    - Cleans up stale sockets (`rm -rf /tmp/dm-siege-sockets`).
>    - Boots a real instance (`CLAUDE_CLI_PATH=... WARD_CLI_PATH=... node packages/cli/dist/bin/dungeonmaster.js siegelense start --spec dungeonmaster-web`).
>    - Drives the new verb via the CLI (`dungeonmaster siegelense run`), covering happy paths, edge cases, error conditions, invalid arguments, and projections.
>    - Queries real step results off disk (`dungeonmaster siegelense results --instance <id> --run <runId> --step <N>`).
>    - Inspects real stdout/JSON for compliance with `siegelense-tooling.md`.
>    - If any defects, omissions, or surprises are found: fixes the code directly, re-builds, and re-tests until solid.
>    - Tears down instance (`dungeonmaster siegelense kill`) and verifies process table and socket directories are swept clean.
>    - Reports real command invocations, verbatim stdout/JSON outputs, and verification evidence back to parent.
>
> 3. **Parent agent (The Coordinator):**
>    - Selects the piece, creates the plan document in `scrolls/seigelense/plans/<piece>.md`.
>    - Dispatches the coding sub-agent, then dispatches the manual verification sub-agent once coding is done.
>    - Verifies documentation updates (`HANDOFF.md`, `build-ledger.md`, `siegelense-tooling.md`).
>    - Runs final ward check and commits directly to `master`.
>
> **The interface is the CLI.** Every call is `dungeonmaster siegelense <call>`. There are no MCP tools and
> none are wanted — we should not have to install an MCP server for an LLM to use this. If you find MCP
> framing anywhere it is a leftover, not an instruction.
>
> **DONE IS THE FEATURE SET, NOT A GREEN TEST RUN.** A ward run cannot fail for code nobody wrote, so ward
> is a quality gate and never a completeness one. Re-derive the counts from the code before claiming
> anything; the command for each is in the handoff.
>
> **Manual verification means typing the command.** Every round of this build has found defects that way
> and only that way, and several had passing tests sitting on top of them. A piece is not done until you
> have driven it.

---

## How to pick the next piece

**Read this before choosing.** The score table tells you what is missing; it does not tell you what is
worth doing next, and the two are not the same.

### The rule, in order

1. **Does a BUILT thing currently lie, or half-work?** Fix that first. A call that ships and misleads
   costs more than a call that does not exist, because a reader trusts it. Nothing is in this state right
   now — but check, because each round has added one.
2. **What blocks a session from verifying a browser feature end to end?** That is this tool's whole
   purpose. Rank by how many walks are impossible without it, not by how interesting it is.
3. **What unblocks the most other rows?** Part 7's order is a good guide but not a law; it was written
   before `look` and `seed` existed.
4. **What would a consumer hit first?** This is a published npm package. A thing that works here and
   breaks in a consumer's repo is worse than a missing feature, because it fails after they have
   committed to using it.

**Tie-break toward the smaller piece.** A finished small thing beats a stalled big one, and this build's
evidence is that pieces sized to one sitting get driven properly and pieces larger than that do not.

### The shortlist, as it stands

Re-derive this before trusting it — it is a judgement about a moment, and the moment has passed.

| Candidate | Why it might be next | Why it might not |
|---|---|---|
| **A capture on `until`'s TIMEOUT path** | A timed-out `until` is the case a fixer opens first and it currently carries no picture. Finding 6 in the log below was this exact shape on another verb. `stepDispatchBroker` already has the machinery | It needs a decision about what `shots[]` means once a non-acting verb can appear in it. The argument both ways is in `plans/step-until.md` §4 |
| **`health`** — one reading, one verdict line (item 8) | The stress-testing role has no counterpart to the key. Nothing takes a one-shot reading two runs can be held against | Serves one role, where `until` serves every walk |
| **`reset` + the `snapshot` verb** (item 14) | `snapshots` is a built call that can only ever return automatic rows. Closest thing to rule 1 above | Three reset levels is a big piece; `page` needs a browser-storage surface that does not exist |
| **`hold` and `video`** (item 11) | The stuck-loader and non-settlement classes; human-verifiable artifact | Neither judges motion automatically |
| **Item 17** — the lane spec still names this repo's own server and web packages | Rule 4. A consumer installs `dungeonmaster` and gets a tool that cannot boot their app | Not a verification feature, so it competes on a different axis |
| **Item 3a** — the `production` recipe has no shared-instance suite | Its only proof today is one manual drive | Newly unblocked; the drive did pass |

### What NOT to pick

- **Anything marked spec-side** in the build-order table — items 4b, 11b, 11c. Those are prompt or
  contract work in other packages, not tooling here.
- **The orchestrator and web rows** — 3b, 11d, 11e, 11f, 11h. They need a decision about roles that this
  build has not taken.

---

## The loop for one piece

1. **Pick**, using the rule above. Say out loud which row it closes and why it beat the others.
2. **Notarize** — read the spec range for it and write a numbered requirements table, one row per thing
   the spec says, each citing its line. **Re-derive the line numbers**; every status marker added to the
   spec shifts everything below it, and the ledger's numbers go stale the moment one lands.
3. **Plan** to `scrolls/seigelense/plans/<piece>.md` before writing code.
4. **Build (Coding sub-agent)** — dispatch ONE sub-agent for the build itself (contracts, statics, adapters, brokers, transformers, and tests). Tell it not to dispatch its own.
5. **Ward** it: `npm run ward -- --only lint,typecheck,unit,integration -- <files>`, `timeout: 600000`.
   Check the EXIT CODE — a pipeline's exit code is the last command's, so `ward | tail && git commit`
   commits on red.
6. **DRIVE IT (Review & test sub-agent).** Build first (the CLI runs compiled output), then dispatch ONE sub-agent to boot a real lane, type the commands per `manual-verification-runbook.md`, verify behaviors, and fix any issues found. **Kill your instance and sweep afterwards.**
7. **Update the docs** — this handoff, the ledger row, and the spec's inline status marker.
8. **Commit**, and stop. Report what you did and what you found.

---

## Rules this build paid for

**A green ward is necessary and nowhere near sufficient.** Every round has found defects only by driving.
Two had passing tests sitting on top of them — one test set both roots to the same value, so the wrong
one was indistinguishable from the right one; one mock helper re-wrapped cross-realm errors, so a unit
test could not reproduce the shape production produces.

**A header that CLAIMS the rule is not the rule. Read the code under it.** `stepUntilBroker` shipped with
a header saying "a real error underneath propagates unchanged" above a `catch` that folded every error
into a ceiling. Ward was green, the tests asserted real message strings, and the two disagreed silently
because no test staged a failure that was not a timeout. The header is the thing a later reader trusts,
so a header the code contradicts is worse than no header.

**A test whose staged value cannot be told from the wrong one proves nothing.** The same fix needed the
`until` proxy to stage a DECOY `bufferLengths()` return, so that a regression back to reading the buffer
at step start produces a timeout rather than a silently-green test. Without the decoy, the right source
and the wrong source both answered the same rows. This is the third time this exact shape has bitten:
see the teardown SIGKILL row and the two-roots row.

**Never trust a sub-agent's "swept clean" claim — run the sweep yourself.** A `seed` agent reported both
its instances killed and the process table clear. A driver was still alive, reparented to systemd, with
its servers up. It had run nearly twelve hours and crossed a date boundary, so its own leftovers looked
fresh rather than stale when it checked.

```bash
ps -eo pid,etime,cmd | grep -E "siegelense driver|bin/server-entry" | grep -v grep
ls -d /tmp/dm-siege-inst_* ; ls /tmp/dm-siege-sockets/
```

**A leaked lane whose home is gone cannot be reaped by the tool.** The registry lives inside the home, so
deleting the home destroys the only record of the pgids. Recovery is by hand:
`kill -TERM -<pgid>`, then `-KILL`, then clear the socket and the home.

**Re-derive every spec line number you are handed.** Each status marker shifts everything below it. Numbers
in the ledger were true when written and are the first thing to rot.

**Do not hand a sub-agent a fact you have not checked.** One prompt told an agent the spec's `driving`
table had four rows; it had five. The agent checked and corrected it — which is the behaviour to want, and
also the reason not to rely on it.

**A doc written while a parallel lane builds the thing it describes will be wrong.** The `docs` manual
shipped telling an operator `capacity` was unbuilt, because `capacity` was being built in the next lane
while it was written. This is one of the reasons the working model is now one piece at a time.

## Definition of done

**Done is this checklist, fully checked.** Not a green ward. Not a planner's opinion that there is nothing
left. Ward grades code that exists and is structurally blind to code nobody wrote — a repo with 6 of 23
step verbs goes green exactly as hard as one with 23 of 23.

Re-derive each count from the code before claiming it. The command is given under each table.

### The thirteen calls

Every call is `dungeonmaster siegelense <name>`. Steps are DATA inside `run`, never calls of their own.

| Call | State |
|---|---|
| `start` | **built** — and now refuses outright when `capacity` answers 0, before minting a reservation |
| `run` | **built** |
| `results` | **built** |
| `kill` | **built** |
| `capacity` | **built** |
| `profile` | **built** — reads what was measured; the measurement path is new too |
| `status` | **built** |
| `cleanup` | **built** — including `assetsAged`, through the same reclaim path `prune` uses |
| `prune` | **built** — minus the `open-issue` citation kind, which cannot be built (see below) |
| `compare` | **built** — minus `elements`, which waits on `look` |
| `snapshots` | **built** — every row reports `manual: false` until the `snapshot` VERB lands |
| `recipes` | **built** — recipes are declared and listable, not runnable |
| `docs` | **built** — seven scopes |

**Reachability is no longer the question; depth is.** Three of these are complete calls sitting on an
incomplete substrate, and each says so in its own output rather than in this file only: `snapshots` can
only ever return automatic rows, `recipes` lists states nothing can create, and `prune` names its
unchecked citation kind in `unresolved[]` on every answer.

```
# the names, pinned so nobody invents a fourteenth or drops one
packages/siegelense/src/statics/siegelense-call/siegelense-call-statics.ts
# which of them route
packages/siegelense/src/flows/siegelense/siegelense-flow.ts   → CALL_ROUTES
```

### The twenty-three step verbs

| Verb | State | Verb | State |
|---|---|---|---|
| `goto` | **built** | `before` | not built |
| `waitFor` | **built** | `health` | not built |
| `click` | **built** | `reset` | not built |
| `type` | **built** | `snapshot` | not built |
| `screenshot` | **built** | `seed` | **built** |
| `eval` | **built** | `until` | **built** |
| `look` | **built** | `hold` | not built |
| `key` | **built** | `video` | not built |
| `paste` | not built | `request` | not built |
| `box` | **built** | `resize` | not built |
| `dom` | **built** | | |
| `storage` | not built | | |
| `file` | not built | | |

```
packages/siegelense/src/statics/step/step-statics.ts   → verbs.all
```

**`look`, `box`, `dom`, `seed`, `until` and `key` are built.** What is next is in "How to pick the next piece" — re-derive it
rather than trusting a shortlist written before this round.

### The build-order items

The spec's Part 7 is the canonical order, and the table below is the state of each row. Three rows are
spec-side — prompt or contract work in other packages rather than tooling here. **Count the rest
yourself from the table rather than trusting a tally; a tally is the first thing to rot.**

| # | Item | State |
|---|---|---|
| 1 | Gate the smoketest HTTP route at registration | **done** |
| 2 | The instance service — the thirteen calls | **done** — 13 of 13 route, driven by hand |
| 2a | The evidence read path off the asset tree | **done** |
| 2b | Teardown and crash recovery, tests red-first | **done** — 16 of 16 green against real processes |
| 2c | Retention and tombstones | **done** minus one citation kind — ageing, refusals and the resolver all real; `open-issue` is unbuildable, see below |
| 3 | The recipe book | **done** — both recipes execute; `guild-with-three-quests` goes through the app's own API, `session-with-nested-subagent` writes the transcript shape and declares what it mirrors |
| 3a | Recipe integration tests | part: the `direct` recipe has a real-filesystem suite; the `production` one has no shared-instance suite and its proof today is the manual drive |
| 3b | The PLANNER role | **not started** — orchestrator prompt work |
| 4 | A transcript of every step and reading | **done** |
| 4b | The record's `WALKED` field | spec-side |
| 5 | `before` — a script ahead of the page's own | **not started** |
| 6 | Capture on every acting step, frozen, with a change number | **done** |
| 7 | **The key as a tree — refs, `within`, four columns** | **done** minus the numbered map, which the spec itself defers — `look` plus `look { within }`, and ref driving on `click` and `type` |
| 8 | `health` — one reading, one verdict line | **not started** |
| 9 | `until` — wait on a response, a file, a predicate | **done** — all five forms, each driven against a real lane |
| 10 | Selectable readings — `network` projection, `box`, `dom` cap | **done** — network projection, box geometry, and dom projection with self-reporting cap built |
| 11 | `hold` and `video` | **not started** |
| 11b | The human-check route | spec-side |
| 11c | The declared-value block and its third reader | spec-side |
| 11d | `siegemaster-reader` | **not started** — orchestrator |
| 11e | `siegemaster-operational`, and the surfaces it needs | **not started** — split ownership |
| 11f | The `(human-check)` panel on the quest | **not started** — web |
| 11g | A `walked` kind on `questNotes` | part: the contract landed, nothing consumes it |
| 11h | Print the owning node id in `get-qa-checklist` | **not started** — orchestrator/mcp |
| 12 | Server-side failure injection | **not started** |
| 13b | `compare` — the index delta between two runs | **done** minus `elements` |
| 14 | Three reset levels with named snapshots | part: the `snapshots` call and the automatic `run_N:start`/`run_N:end` pair are real copies; no `reset`, no manual `snapshot` verb |
| 15 | `resize`, and a direct `request` step | **not started** |
| 16 | The two local lint rules | part: `.first()`/`.last()` done, DOM-handle rule open |
| 17 | The lane spec and N ports, moved where consumers get it | part: it is data; it still names two packages directly |

The ledger carries the reasoning per row. **Read it before planning.**

---

## What this cannot do yet

### It CAN wait now — the TIME gap the last round called the worst is closed

`until` waits on something other than a locator state, in five forms. Every one was driven against a real
lane:

| Form | Driven reading |
|---|---|
| `visible` | `[data-testid="CHAT_MESSAGE_TEXT"] became visible after 10ms` |
| `predicate` | `predicate became true after 14ms` |
| `console` | `console line matching /connected/ arrived after 0ms — "[vite] connected."` |
| `response` | `POST /api/guilds answered 201 after 0ms` |
| `file` | `guilds/<id>/quests/<id>/quest.json appeared after 0ms` |

**`waitFor` cannot do what `visible` does, and that is by design rather than by omission.** `waitFor` is
a member of `verbs.targeting`, so `runVerbLayerBroker` sends it through `stepTargetResolveBroker` before
the wait, and a count of zero throws `StepNoMatchError`. An element that has not rendered yet is a
no-match, so `waitFor` fails instantly where a wait is what you wanted. `until { visible }` skips that
pre-resolve. That is the whole difference between them.

**Only a CEILING answers `status: 'timeout'`.** Skipping the pre-resolve means Playwright's strict
locator is what meets an ambiguous selector, so `until { visible }` discriminates and rethrows anything
that is not a `TimeoutError`. Driven against the spec's own example selector, which matches twice on a
nested-subagent page:

```
status: "failed"
strict mode violation: locator('[data-testid="SUBAGENT_CHAIN"]') resolved to 2 elements:
    1) … aka getByText('▾ SUB-AGENT"Outer chain" (2 entries, 0 context)…')
    2) … aka getByText('▾ SUB-AGENT"Nested chain" (1 entries, 0 context)…')
```

Before that discrimination existed it printed `never resolved in 20000ms` — telling a walker to wait
longer for an element already on the screen twice. The same rule covers a `predicate` whose source
cannot evaluate: a broken predicate and a false one would otherwise read identically.

**`console` and `response` scan THIS RUN's window**, not this step's. A `click`'s own POST resolves for
an `until` later in the same batch; a match from an earlier run does not, and the timeout says which:

```
console matching /connected/ never resolved in 3000ms — 0 of 0 console lines since this step
began matched. A match DID arrive earlier in this instance's buffer, 2 lines before this run's
own window began — it belongs to an earlier run, not this one: read it back with
`results --kind console --since boot`.
```

**Three things to know before you rely on it:**

| What | Consequence |
|---|---|
| `console` takes a regex SOURCE STRING, not `/hydrated/` | A batch arrives as JSON over argv and JSON carries no regex literal. A slash-wrapped value is refused by name |
| `file` is HOME-RELATIVE and a leading `/` is refused | The path joins onto the lane's throwaway home. The refusal names that home rather than silently waiting on a file outside the lane |
| `until` takes NO capture, on success or on timeout | It is absent from `verbs.capturing` deliberately — the spec's capture rule covers acting steps and `look`, and names neither. A capture on the TIMEOUT path only is the shape worth considering next, and `stepDispatchBroker` already has the machinery; it needs a decision about what `shots[]` then means. The argument both ways is in `plans/step-until.md` §4 |

Only `file` runs on a browserless lane. The other four refuse by name and say so:

```
Step until { response } needs a browser, but spec dungeonmaster-headless declares browser: false
— until { file } is the form that runs on a lane with no screen
```

### It CAN read a page now — this gap is closed

`look` returns the KEY: a tree of every addressable element with an element-bound `ref` per row, and it
writes the shot beside it. `look { within }` scopes the same reading to one region. `click` and `type`
take a `ref`, because a key full of refs nothing can act on closes nothing.

**The dead end this replaced**, driven before and after against the same page — same rects both times:

```
click [data-testid="PIXEL_BTN"] within=[data-testid="MAP_FRAME"]

BEFORE → AMBIGUOUS: 2 elements match … Pick one by narrowing with `within`.
         (both candidates already carried that same `within`, so the advice could not be
          followed, and it repeated verbatim)

AFTER  → AMBIGUOUS: 2 elements match target [data-testid="PIXEL_BTN"] within=[...MAP_FRAME].
           [0] ref=19 within=[data-testid="MAP_FRAME"] text="BROWSE" rect=(742,433) 66x27
           [1] ref=20 within=[data-testid="MAP_FRAME"] text="CREATE" rect=(607,472) 66x27
         Pick one by ref — { "step": "click", "ref": N } — or narrow with `within`.
```

Following it works: `click ref 20` resolves and acts.

**A ref binds to an ELEMENT, never to a row number**, and fails loudly at all four boundaries rather
than resolving to the wrong thing. Driven across a navigation:

```
STALE REF: ref 20 no longer reaches an element — boundary crossed: navigation. A ref binds to an
ELEMENT and never to a row number, so this is never a different element. Run `look` again for the
current key.
```

**Still missing from the ladder**: `box { ref }` is rung 3, `dom { target }` is rung 4, and neither is
built. The numbered map is absent by the spec's own deferral, not by omission. `compare`'s `elements`
delta still waits on a threaded last-listing accessor.

**Three flags are unit-shaped but not field-proven** — `low-contrast`, `covered` and `scrollable` never
fired on the screens the build drove. `empty`, `not-tabbable`, `[n/m]`, the duplicate-testId line and
the attrs column all fired on real pages.

**Ref driving briefly mutates the DOM.** `clickRef`/`fillRef` stamp a non-`data-` attribute on the
element, drive a locator against it, and unstamp in a `finally`. That is what lets Playwright's strict
mode do the no-pick work for a ref; the `ElementHandle` route needs a cast this package's tsconfig
cannot make. The reasoning is in `refRegistryLayerAdapter`'s own header.

### It CAN seed now — this gap is closed too

`seed` runs a recipe against a live instance and returns the ids it made. `as:` names a binding that
later steps in the same batch read back. Driven, two recipes composed in one batch:

```
{ step: 'seed', recipe: 'guild-with-three-quests', as: 'g' }
  → {"guildId":"aa45f61c-…","guildSlug":"siege-guild","questId":"d278ce4e-…"}
{ step: 'seed', recipe: 'session-with-nested-subagent', guild: '{g.guildId}', as: 's' }
  → {"sessionId":"a1b2c3d4-…","sessions.outer":"/siege-guild/session/…","sessions.nested":"…"}
```

**`production` fidelity is honoured, not approximated.** `guild-with-three-quests` POSTs a guild, POSTs
three quests, then walks seven PATCHes along `questStatusTransitionsStatics` — the same walk
`questHydrateBroker` performs. It deliberately avoids `POST /:id/start`, which would also spawn the
orchestration loop and leave the fixture still moving. That choice caught a defect: the app refused a
`changeType: 'edit'` shape a hand-written `quest.json` would have accepted.

**A recipe is handed `{ apiBaseUrl, homePath }`, strict.** No field a DOM handle could live in, so "a
recipe touches state, never a screen" is held by a shape rather than by a comment.

**A bad binding stops the batch and names itself**, rather than interpolating a literal:

```
UNKNOWN BINDING: {g.guildId} cannot be resolved — no `seed` step in this batch has bound anything
yet … Nothing is interpolated as a literal: a placeholder that survived would become a URL nobody
meant.
```

**Three things to know before you rely on it:**

| What | Consequence |
|---|---|
| `guild-with-three-quests` is not repeatable inside ONE instance — the guild path is fixed, which is what keeps it deterministic | A second seed of it in the same lane answers a raw 500 body naming the path. Actionable, but it is the app's error surfacing, not a siegelense refusal naming the recipe |
| `sessions.outer` and `sessions.nested` resolve to the SAME url | One page renders both chains. The two names are kept because the spec's worked batch reads `{s.sessions.nested}` back |
| The seed reading is a FLAT map (`{"sessions.nested": "…"}`) | The spec prints a nested object. Flat is what the manifest declares its return names in and what a placeholder resolves against |

### The spec's own worked example uses a route that does not exist

`siegelense-tooling.md:2917` writes `goto /{g.guildSlug}`. **There is no such route.** Driven, it answers
`blank: true` on both shots and a one-row key. `AppFlow` has `/`, `/queue`, `/:guildSlug/quest/:questId`
and `/:guildSlug/session/:sessionId`.

A session copying that batch out of the spec lands on a white screen and will reasonably suspect the
tool. **This is the spec's error, not the tool's**, and it is recorded here rather than fixed because
changing the spec's worked example is a decision about the spec.

### `prune` cannot check one of its three citation kinds, and never will as things stand

A `VERIFIED` prelude and an open quest's `WALKED` note both resolve, and a refusal names the citing file
and the run id. **An open issue record does not, because no such record exists anywhere in this repo.**
`signoffContract` carries no instance or run id; `questNoteKindContract` has no `issue` member; no issue
contract folder exists in any package. A walker's defect becomes a failing test on disk or prose in a
note, neither of which a resolver can match an instance against.

It is declared in code as a permanent gap and rides `unresolved[]` on every `prune` and every `cleanup`
answer, **so an empty `refused` can never be read as "nothing cites any of this"**. It needs the
treatment item 11g gave `walked`: a typed record carrying `instanceId` and `runId`.

### It loses the lane under a person

A driver reaps itself after 900s with no `run`. `status` and `results` read off DISK and never touch the
driver socket, so a human clicking around the UI resets nothing. Measured: three instances booted and left
alone died at exactly 900s each.

---

## Findings log

Defects the manual walkthrough surfaced, in the order found. A defect goes to a sonnet sub-agent; this
table is how the walk tracks what is out and what landed.

| # | Stop | Defect | State |
|---|---|---|---|
| 1 | pre-walk | `start` printed its manifest and never exited — `detached: true` without `unref()` left the parent's event loop holding the driver. Manifest at `bootMs: 4269`, command still alive ten minutes later | **FIXED** `ac3827f8f` |
| 2 | pre-walk | `aheadOfMe` counted killed tombstones as queued boots, so it climbed by one per failed boot and never came down. Read 3 on an empty fleet | **FIXED** `ac3827f8f` |
| 3 | pre-walk | A `screenshot` step whose name carried no extension failed with Playwright's `path: unsupported mime type "null"`, naming neither the step nor the field | **FIXED** `ac3827f8f` |
| 4 | discovery | **Any unrecognized word booted the HTTP server.** `CliFlow` routed five commands and let everything else fall through to `CliServeResponder`, so `dungeonmaster seigelense` — two transposed letters — bound `dungeonmaster.port` and a second attempt died on `EADDRINUSE`. `COMMANDS.start` was declared and never referenced, so `dungeonmaster start` only worked through the same hole | **FIXED** `766d4c175` |
| 5 | discovery | The fleet table was unreadable — tabs with no padding, raw epoch ms in `LAST BEAT`, a full absolute path repeated per row — and a `killed` row explained nothing | **FIXED** `add570c57` |
| 6 | discovery | A step that failed for a REAL reason captured its shot and never read it. Two layers dropped the readings, so `blank` — the one field in this design that is a VERDICT — was null on the one shot a fixer opens first | **FIXED** `add570c57` |
| 7 | `start` | A boot failure took 3m0.724s to report `api, web never answered their ready path`, while the real cause sat in `driver.log` from the first 50ms. Now 1.459s, naming the missing variables | **FIXED** `add570c57` |
| 8 | `start` | Every failed boot leaked its reservation — an `alive` row with `bootedAtMs: null` holding a claimed port pair with no process | **FIXED** `add570c57` |
| 9 | `start` | **A lane reaped by its own idle timeout reported a MEMORY death.** `likelyCause` recited RSS and kernel OOM counts for a shutdown the tool scheduled itself, and a session is told to bubble that up as `rework`. The driver now writes a shutdown reason before teardown, and `start` takes `--idle-timeout-ms` to raise the ceiling for a person driving a browser. Driven: a 15s ceiling reaped on time and reported `reaped by idle timeout after 15s with no run received`, with no RSS text; an instance with no recorded reason still reports the old sentence unchanged | **FIXED** |
| 12 | test infra | **Composing two proxies that mock the same raw builtin steals one-shots, and this is the FOURTH agent to hit it.** Adding one real `pathJoinAdapter` call to a write path forced a hand-counted drain in `siegelense-driver-responder.proxy.ts` from 3 entries to 6 — a magic number that must be recomputed by hand every time anything upstream stages differently. The ledger names the real fix: scope one-shots to the proxy that staged them. Until then every change near a locations resolver pays this tax | **OPEN** — `@dungeonmaster/testing` |
| 10 | `run` | `StepAmbiguousError`'s structured `candidates` array is EMPTY while the human-readable message carries the text and rects. A session parsing the JSON gets nothing. Root cause: the run layer hardcoded `candidates: []` on every failure. **The trap in fixing it — on an acting step the ambiguity arrives wrapped in `StepFailureCaptureError`, so the `instanceof` must run against the UNWRAPPED error, or it misses every ambiguity on a click, which is all of them** | **FIXED** `1d985f8f2` |
| 11 | `run` | The ambiguity error advises narrowing with `within` when both candidates already share one. The advice cannot be followed and repeats verbatim | **FIXED** `1d985f8f2` — closed with `look`, as predicted |
| 13 | `docs` | **The manual told an operator that `capacity` was not built and to read `status` instead.** It was written from the spec while `capacity` was being built in a parallel lane, which is correct procedure — but five passages shipped describing calls that had landed by the time they were read. Found by typing `docs --for operating --human`, not by any test | **FIXED** `09ce4a9eb` |
| 14 | `--human` | `HUMAN_RENDERER_CALLS.join(' and ')` read as a sentence at two names and broke at three: "only status and cleanup and recipes render a human table". Found by typing a refused `--human` | **FIXED** `09ce4a9eb` |
| 15 | `--help` | With every call built, the index printed a bare `NOT BUILT YET` heading over an empty list — a finished tool reading as a truncated page. The renderer now omits an empty block heading and all, the rule it already applied to `REFUSES` | **FIXED** `09ce4a9eb` |
| 16 | `cleanup` | Its help refusal said "it ages no asset, so a clean baseline capture is never touched by this call" — false the moment `assetsAged` landed. The same sentence was duplicated in `cleanupArgsParseTransformer`, which is how it went stale in two places at once | **FIXED** `09ce4a9eb` |
| 17 | `seed` drive | **A sub-agent reported "both instances killed, ps sweep clean" while a driver was still alive**, reparented to systemd with its servers up. It had run nearly twelve hours across a date boundary, so its own leftovers read as fresh rather than stale. Its home was gone, so the registry that held the pgids was gone with it and no siegelense call could reap it — killed by hand via the process group | **FIXED** by hand; the LESSON is in "Rules this build paid for" |
| 18 | spec | `siegelense-tooling.md:2917`'s worked batch does `goto /{g.guildSlug}`, and no such route exists. Driven: `blank: true` on both shots. A session copying the spec's own example lands on a white screen and blames the tool | **OPEN** — the spec's error, not the tool's |
| 19 | `until` build | **The two Playwright-owned forms reported EVERY failure as a ceiling.** `visible` and `predicate` wrapped whatever came back into `UntilCeilingHitError`, which is what `timedOut` reads — so an ambiguous selector answered `status: 'timeout'` and advised waiting longer for an element already on screen twice, and a predicate whose source threw read as one that was merely false. `waitFor` is protected from this by accident, through its pre-resolve; `until { visible }` skips that pre-resolve on purpose, so it had no protection at all. The broker's header CLAIMED the correct behaviour while the code did the opposite. Found by reading the code against the plan, before any drive | **FIXED** — `isPlaywrightTimeoutErrorGuard`; confirmed against a real strict locator |
| 20 | `until` drive | **A `click` followed by an `until { response }` in ONE batch always timed out.** The click's POST landed during the click step, so it sat behind a scan index taken at the start of the `until` step. The verifier needed two concurrent CLI processes to get a real match — not something a walker should have to discover. Found only by driving | **FIXED** — the two buffer forms now scan the RUN's own window, the unit spec line 90 already names |
| 21 | `docs` | **`docs --for operational` claimed `until { response }` runs on a browserless lane.** It refuses — the network buffer lives on the browser session. Two more false lines sat beside it, both pre-existing: "all six verbs error by name here" when there are seven, and "network works the same way on a browserless lane" when no network line is ever written without a browser. Found by typing `docs --for operational --human`, which is the second time this exact method has caught a docs lie | **FIXED** — all three, plus a fourth in `walking` that announced five forms and listed four |
| — | parked | `CliServeResponder` runs `xdg-open` unconditionally, with no flag, config knob or env var. Every server launch opens a browser tab | **PARKED** by request |

---

## The other documents, and what each is for

| File | What it holds | When to read it |
|---|---|---|
| `siegelense-tooling.md` | **the spec**, 3,087 lines, with inline `> **Status:**` markers under delivered headings | living in it while building a chunk |
| `build-ledger.md` | one row per spec section, with the reasoning behind each verdict | before planning, always |
| `manual-verification-runbook.md` | how to drive the real binary, and the housekeeping that stops a clean run reading as a failure | before any manual pass |
| `siegelense-recipes.md` | the recipe book design | when item 3 comes up |
| `siege-verification-remainder.md` | the ROLE — what a siegemaster is for, the perception trial, the prompts | context, not tooling |
| `plans/chunk-0*.md` | one plan per chunk, 1 to 5. Chunk 5 is planned and unstarted | picking up chunk 5 |
| `plans/call-*.md` | one plan per call built in the six-call pass — `capacity`, `docs`, `profile`, `prune`, `recipes`, `snapshots`. Each opens with a numbered requirements table citing spec lines, and grades itself against it | before changing any of those six |
| `plans/step-*.md` | one plan per step verb built one at a time — `look`, `seed`, `until`. Same shape: a numbered requirements table citing spec lines. `step-until.md` also carries a §4 naming what was deliberately left out and why | before changing any of those three |

**Keep the markers in the spec matching this file.** They read `> **Status: DELIVERED (chunk N)** — …` or
`PARTIAL` or `BLOCKED`. Match that format exactly so a search finds them.

---

## Knowledge that cost time to learn

Condensed, and none of it guessed. The full traces are in the ledger. The rules ABOVE are the ones about
how to work; these are the ones about this machine and this code.

**A child spawned with `env` omitted does not read the live `process.env`.** From inside a Jest worker it
resolves against a stale pre-strip snapshot, so `--conditions=source` reaches the child and every
`@dungeonmaster/*` import resolves to TypeScript. Always pass `env:` explicitly. Three sessions lost time
to this, all of them measuring the PARENT.

**`detached: true` does not let the parent exit.** It sets the child's process group. The parent's event
loop still holds a reference until the child dies, and every child here is a long-lived server. Pair it
with `unref()`.

**Binding a unix socket whose parent directory is absent fails with `EACCES`, not `ENOENT`.** Three
sessions read that as permissions or contention.

**A raw control byte in a source file is invisible to every text tool.** A `0x00` renders as a space in
`Read`, in an edit diff and in jest's own printed diff. Sweep with `os.walk` + `'rb'`, never with `Read` or
grep — those are the tools that cannot see it.

**A lane leaked by a test is unreapable by construction.** A test driver runs under a testbed
`DUNGEONMASTER_HOME`, and `testbed.cleanup()` deletes it with the registry row inside — so the only record
of the pgids is gone. Sweep by hand: `ps -eo pid,etime,cmd | grep "bin/server-entry"`.

**Stale socket files are inert.** The teardown suite's flake was the machine's PROCESS TABLE, not
`/tmp/dm-siege-sockets`. Measured: a first heartbeat write costs 56.8ms at 435 processes and 276.7ms at
3,430, past the 250ms poll — so `ping` could answer before `heartbeat.json` existed. Fixed by gating the
reply on the first beat.

**Do not put a bare extension in `locationsStatics`.** That file's ban is repo-wide, so a fragment like
`.json` claims every other package's unrelated use of the string. A guard in `packages/local-eslint` now
refuses it.
