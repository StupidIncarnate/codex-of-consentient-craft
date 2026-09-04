# Chain audit — flow `render-images-in-transcript`

This is quest `1be07040-b9ec-476c-a439-0b4fbb0123cd`, flow 3 of 3. A **codeweaver** is the role that writes
code and tests for one package's slice of a flow; each codeweaver work session is called a **cell**. Three
codeweaver cells built this flow. One **flowrider** — the role that later drives the whole flow end-to-end
in a real browser and signs off on it as a whole — then reviewed it. No **siegemaster** — the role that
manually explores the running app, by hand, hunting for what the automated checks above it would miss —
ever ran on this flow.

> **Scope caveat, stated once here.** It applies to every siegemaster figure this report cites for this
> flow. No siegemaster **operation item** — the tracked unit of work that assigns one role to one part of
> the flow, identified by an id — was ever dispatched for this flow. The item exists:
> `c435c149-60d4-40e0-a380-ec896759a22a`, `status: pending`,
> `Siegemaster: manual-QA this flow and review its test suite — flow: render-images-in-transcript`. But the
> quest paused during the PREVIOUS flow's siegemaster (item [17], `send-message-with-images`, cut off
> mid-loop by an API outage) before this flow's siegemaster could start. So every siegemaster figure on
> this flow means **not yet attempted**. None of them is a role failure, and this report never scores one
> as a failure below.

That missing role is what makes this flow useful as a comparison. The report on `paste-image-into-composer`
shows what the process delivers when all three roles — codeweaver, flowrider, and siegemaster — run to
completion. This report shows what it delivers with the hand-driven role missing. Each role keeps its own
**sign-off track**: an independent list of checklist items that role alone signs off on. Here, the
codeweaver track stands at 68 of 69 items signed, and the flowrider track stands at 68 of 68.

---

## 0. The flow as approved

The `coverage` tool's own summary of this flow reads like this:

```
render-images-in-transcript  (runtime)  Render images inline in the chat transcript
  nodes 19 {'state': 3, 'decision': 2, 'action': 12, 'terminal': 2}
  edges 22 (7 labelled = signable branches)
  observables 60   off-map families 0
  package tags on nodes: {'web': 16, 'server': 7, 'orchestrator': 3}
  entry Any chat transcript rendering a user message that carries image paths
  exits ['Images inline in the message bubble, text on both sides', 'Full-size overlay open',
         'Thumbnail showing its broken state in place', 'Optimistic copy replaced by the transcript entry']
```
*(`tmp/quest-analysis/coverage.txt`, lines 21–26.)*

An **observable** is one specific, checkable claim about the feature's behavior — the smallest unit on the
checklist. An **off-map family** is one of seven fixed categories of manual probe (re-entry, concurrency,
interruption, staleness, configuration, hostile-input, perf) that only the siegemaster checks; a family is
not tied to any single node in the flow diagram. The `off-map families 0` line above counts how many
families have been signed, not how many are owed — see §1.

Here are the same sixty observables, broken down by their own `package` field and by type:

```
--- package tally of observables ---
Counter({'web': 30, 'server': 18, 'orchestrator': 12})
--- obs type tally ---
Counter({'ui-state': 24, 'api-call': 20, 'custom': 15, 'log-output': 1})
--- addedBy tally ---
Counter({'spec': 59, 'flowrider': 1})
```

**59 of the 60 observables survived Gate #2.** The flowrider authored the other one, during execution. No
codeweaver authored any. No siegemaster authored any, because no siegemaster ran on this flow.

Six of the flow's nineteen nodes are glue nodes — nodes tagged with more than one package because two or
more packages both touch that step:

```
  node request-bytes              packages=['server', 'web'] observables=10
  node serve-bytes                packages=['server', 'web'] observables=4
  node request-replay             packages=['server', 'web'] observables=2
  node replay-user-line           packages=['orchestrator', 'server'] observables=2
  node deliver-entry              packages=['orchestrator', 'server', 'web'] observables=3
  node image-not-served           packages=['server', 'web'] observables=6
  total double/triple-owned observables: 27
```

The total, 27, is the number section 2 depends on.

### Reconciling the denominator

A **denominator** is the total number of checklist items a role must sign off before it is done — the "of
N" figure in "X of N remaining." No single denominator can work for all three roles here, because **each
role is owed a different set of checks.** The codeweaver track counts terminals and read-checks that the
flowrider does not. The flowrider track excludes the one read-check unit by rule. The siegemaster track
adds seven off-map probe families that neither of the other two owes at all. A tool that reports one shared
number for all three roles is reporting the wrong number for at least two of them — and that is exactly
what happened here.

The audit brief requires calling `get-qa-checklist({ questId, operationItemId })` once per role and
checking its answer against `coverage`. I called it for three of the four operation items on this flow —
the fourth, `check-modal-width-tracks-modal-inner`, is already covered by the codeweaver call. **The three
answers disagree with each other, and all three disagree with `coverage`:**

| Track | operation item | MCP `Units:` | breakdown | `REMAINING` **now** | `coverage` says |
|---|---|---|---|---|---|
| codeweaver (web cell) | `332e0da3-…` | **69** | 2 terminal, 7 branch, 60 observable, 0 off-map | **1 of 69** | 67 |
| flowrider | `c0f5d521-…` | **68** | 2 terminal, 7 branch, 59 observable, 0 off-map | **0 of 68** | 67 |
| siegemaster *(never dispatched)* | `c435c149-…` | **75** | 2 terminal, 7 branch, 59 observable, **7 off-map** | **75 of 75** | 67 |

Before the specifics: a **terminal unit** is a checklist item tied to one of the flow's end states, and a
**branch unit** is a checklist item tied to one labeled decision point (edge) in the flow diagram — this
flow has seven of the latter, matching the seven labelled edges counted in the flow summary above.

Four separate disagreements, and every one of them is a fact about the artifact, not a mistake in how I
counted:

1. **`coverage` counts no terminal units.** This flow has two: `image-not-served`, signed by item [6], and
   `images-visible`, signed by item [9]. Both carry `codeweaverSignoff` and `flowriderSignoff` fields in
   `quest.json`, and both were also signed by item [15]. `coverage` leaves out both, so it under-reports
   every track's total by exactly 2 on this flow.
2. **`coverage` counts the read-check against the flowrider, and against the siegemaster too.**
   `check-patterns-come-from-shared` is marked `verifyByReading: true` — meaning it is settled by reading
   the source code, not by running a test. The eligibility rules
   (`signoffTrackEligibilityStatics.byTrack.flowrider.verificationMethods`) allow the flowrider only
   `['test']`, while the codeweaver is allowed `['test', 'reading']`. The flowrider's own prompt says so
   directly:
   > **An observable your `get-quest` render marks `(read-check)` is settled by reading source, which is
   > another track's method** — it is off this list and out of your count, so never chase one.
   > — `flowrider-prompt-statics.ts:187-189`
   So the `coverage` line that reads "flowriderSignoff 1 unsigned" on this flow is **not a gap**. The tool
   removed that one unit from the flowrider's list on purpose, and the flowrider's own prompt told it never
   to chase it.
3. **`coverage`'s "off-map families 0" is a count of what has been signed, not a count of what is owed.**
   `flow.offMapSignoffs` reads `[]` on this flow simply because nothing has signed one yet. The seven
   standard families are not something a person writes into the flow — they are derived the same way for
   every flow. The siegemaster checklist lists all seven for this flow, exactly as it does for the other
   two: `re-entry`, `concurrency`, `interruption`, `staleness`, `configuration`, `hostile-input`, `perf`.
   See §4.
4. **`coverage`'s figure of 67 for the codeweaver misses one observable added mid-quest.** The
   codeweaver's real denominator is 60 observables, not 59, because the codeweaver's allowed
   `observableOrigins` include `flowrider` — an observable the flowrider adds still counts against the
   codeweaver.

The audit brief's own rule holds here: *where the two disagree, the MCP tool is right.* `coverage` is a
convenient index, not the denominator. No session should ever be graded against it. Report 17 found the
same pattern on `send-message-with-images`, where it counted 71 against `coverage`'s 66, for the same
reasons.

---

## 1. Obligation versus delivery, per role

Here are the totals, computed directly from `quest.json`:

```
WHO SIGNED WHAT, PER CELL (codeweaver):
  [4] orchestrator {'observable': 12, 'confirmed': 12}  first 2026-09-01T20:31:16.649Z  last 2026-09-01T21:34:10.574Z
  [6] server       {'observable': 18, 'confirmed': 18, 'terminal': 1, 'branch': 2}  first 2026-09-01T23:30:57.577Z  last 2026-09-01T23:59:38.672Z
  [9] web          {'observable': 29, 'confirmed': 24, 'unconfirmable': 5, 'terminal': 1, 'branch': 5}  first 2026-09-02T06:56:14.934Z  last 2026-09-02T08:28:32.549Z

FLOWRIDER totals:
  {'observable': 59, 'confirmed': 58, 'terminal': 2, 'unconfirmable': 1, 'branch': 7}  first 2026-09-02T16:34:48.209Z  last 2026-09-02T19:44:41.883Z
```

| Track | Owed (MCP) | Signed | confirmed | unconfirmable | Unsettled |
|---|---|---|---|---|---|
| codeweaver | 69 | **68** (12 + 21 + 35) | 63 | 5 | **1** |
| flowrider | 68 | **68** | 67 | 1 | **0** |
| siegemaster | 75 | 0 | 0 | 0 | **75 — not yet attempted** |

### The full unit table

The `addedBy` column records each unit's **provenance** — which role or process created it. Almost every
unit here was written when the flow was specified (`spec`); one was added later, mid-quest, by the
flowrider. The `CW` and `FR` columns below give each unit's verdict — `conf` for confirmed, `unco` for
unconfirmable — and the work item that signed it. The `SM` column is the siegemaster. It reads unsigned all
the way down, **because that role was never dispatched.**

| unit id | kind | pkg | addedBy | CW | FR | SM |
|---|---|---|---|---|---|---|
| `images-visible` | terminal | web | spec | conf [9] | conf [15] | not attempted |
| `image-not-served` | terminal | web,server | spec | conf [6] | conf [15] | not attempted |
| `origin-live` | branch | — | — | conf [9] | conf [15] | not attempted |
| `origin-replay` | branch | — | — | conf [9] | conf [15] | not attempted |
| `inline-to-click` | branch | — | — | conf [9] | conf [15] | not attempted |
| `memory-recheck` | branch | — | — | conf [9] | conf [15] | not attempted |
| `not-readable` | branch | — | — | conf [6] | conf [15] | not attempted |
| `readable` | branch | — | — | conf [6] | conf [15] | not attempted |
| `open-to-normalise` | branch | — | — | conf [9] | conf [15] | not attempted |
| `check-panel-mounts-on-both-routes` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-optimistic-shows-image-immediately` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-image-get-issued` | api-call | web | spec | **unco [9]** | conf [15] | not attempted |
| `check-route-answers` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-traversal-segments-404` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-null-byte-404` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-newline-in-path-404` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-relative-path-404` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-missing-param-404` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-empty-param-404` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-overlong-path-404` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-handler-never-throws` | log-output | server | spec | conf [6] | conf [15] | not attempted |
| `check-bytes-match-disk` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-png-content-type` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-webp-content-type` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-img-actually-loads` | ui-state | web | spec | **unco [9]** | conf [15] | not attempted |
| `check-image-sits-between-sentence-halves` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-bubble-text-matches-composed` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-transcript-click-opens-overlay` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-modal-is-three-quarters-wide` | ui-state | web | spec | **unco [9]** | **unco [15]** | not attempted |
| `check-image-fits-modal-width` | ui-state | web | spec | **unco [9]** | conf [15] | not attempted |
| `check-tall-image-scrolls` | ui-state | web | spec | **unco [9]** | conf [15] | not attempted |
| `check-close-button-visible` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-modal-max-height` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-modal-width-tracks-modal-inner` | ui-state | web | **flowrider** | **UNSIGNED** | conf [15] | not attempted |
| `check-escape-closes-overlay` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-click-outside-closes-overlay` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-close-button-closes-overlay` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-exactly-one-bubble` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-surviving-bubble-uses-url` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-replay-frame-sent` | api-call | web | spec | conf [9] | conf [15] | not attempted |
| `check-server-relays-replay` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-user-line-yields-one-entry` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-entry-emitted-as-replay` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-path-becomes-query-url` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-non-image-link-untouched` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-rewrite-applies-to-session-without-quest` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-space-encoded` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-ampersand-encoded` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-hash-encoded` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-question-mark-encoded` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-percent-encoded` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-plus-encoded` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-non-ascii-encoded` | custom | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-payload-carries-http-url` | api-call | orchestrator | spec | conf [4] | conf [15] | not attempted |
| `check-ws-frame-reaches-client` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-entry-lands-in-transcript` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-token-becomes-img` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-text-renders-around-image` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-trailer-not-rendered` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-missing-file-404` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-non-image-extension-404` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-never-403` | api-call | server | spec | conf [6] | conf [15] | not attempted |
| `check-broken-thumbnail-in-place` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-broken-thumbnail-fixed-size` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-other-images-unaffected` | ui-state | web | spec | conf [9] | conf [15] | not attempted |
| `check-both-sides-normalise-alike` | custom | web | spec | conf [9] | conf [15] | not attempted |
| `check-trailer-cut-before-compare` | custom | web | spec | conf [9] | conf [15] | not attempted |
| `check-text-only-still-compares` | custom | web | spec | conf [9] | conf [15] | not attempted |
| `check-patterns-come-from-shared` | custom (read-check) | web | spec | conf [9] | *(not on its list)* | *(not on its list)* |
| **off-map ×7** — `re-entry`, `concurrency`, `interruption`, `staleness`, `configuration`, `hostile-input`, `perf` | off-map | — | derived | *(not eligible)* | *(not eligible)* | **not attempted** |

### Every unit no track settled

**Exactly one unit went unsigned by every track, and it happened by a timing gap, not because any role
failed.**

The unit is `check-modal-width-tracks-modal-inner`. The flowrider added it — `addedBy: 'flowrider'` — at
`2026-09-02T17:49:58.211Z`, during wave 3 of item [15]. By then the last codeweaver cell on this flow had
already signed its final unit, at `2026-09-02T08:28:32.549Z` — **9 hours 21 minutes earlier**. The unit is
nonetheless owed by the codeweaver track, because the codeweaver's allowed origins
(`signoffTrackEligibilityStatics.byTrack.codeweaver.observableOrigins`) include `flowrider`:
`['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator']`. Here, `pt N` means a follow-up
dispatch of the same role and package, launched after the first pass finished, to pick up anything left
over. The design's own reasoning for this rule says so:

> Codeweaver's list is Flowrider's rather than a shorter one: a `flowrider` origin reaches a codeweaver
> session on a LATER `pt N` continuation of that package, and dropping it would park such an observable
> outside every codeweaver denominator permanently.
> — `signoff-track-eligibility-statics.ts:87-90`

That escape hatch depends on a follow-up codeweaver item existing to pick the unit up. No `pt N` codeweaver
item was ever created on this quest for `web · render-images-in-transcript`. So the escape hatch was never
opened, and the web cell's checklist will read **`REMAINING: 1 of 69` forever.** That is the seam: the
flowrider really can add a new observable at any time, but nothing routes the resulting obligation back to
the codeweaver track once that track's cell has already finished.

The other 75 unsettled entries are simply the siegemaster's whole checklist. None of them is a failure.
They are **not yet attempted**, because the siegemaster role was never dispatched on this flow.

---

## 2. Cell decomposition — did the fan-out match the work?

**Yes — perfectly. But the match came from the operators' own judgement, not from any tool.**

Here is the delivered split, measured against each observable's own `package` field:

| Cell | wall clock | sub-agents | observables signed | terminals | branches | **total** | flow's observables with that `package` |
|---|---|---|---|---|---|---|---|
| [4] orchestrator `0bd22bc6` | 88.4 min | 18 | 12 | 0 | 0 | **12** | 12 |
| [6] server `6ab40559` | 54.6 min | 22 | 18 | 1 | 2 | **21** | 18 |
| [9] web `71c1fd22` | 109.0 min | 27 | 29 | 1 | 5 | **35** | 30 (29 + the 1 the flowrider added later) |

Twelve, eighteen, twenty-nine — that is how the three cells split the sign-offs. Between them they covered
fifty-nine of the sixty observables, **with zero overlap and zero gap**, and each cell's count matches
exactly the number of observables that carry its own package name. The audit brief asked about a spread of
sign-off counts from 1 to 55 per cell across the whole quest; on this flow that spread is 12, 21, and 35,
and it tracks the actual work. The web cell carries every `ui-state` unit and every layout claim. The
server cell carries the `/api/images` refusal matrix. The orchestrator cell carries the ten path-encoding
invariants plus the rewrite.

**But that even split is not the denominator the tool gave the cells.** `qaUnitsInPackageScopeTransformer`
narrows its count using the owning NODE's `packages` tags:

```
105 |     return owningPackages.some((name) => declaredNames.has(name));
```

It never reads the observable's own `package` field at all. Under that rule, the three cells' formal
denominators come out much larger:

```
FORMAL DENOMINATOR per cell (node-tag intersection, as qaUnitsInPackageScopeTransformer computes it):
  orchestrator  observables  15  terminals 0  branches 0  = 15 units
  server        observables  27  terminals 1  branches 2  = 30 units
  web           observables  48  terminals 2  branches 5  = 55 units
  SUM of the three = 100 ownerships over 69 units
```

**That is one hundred ownerships spread over sixty-nine units.** Twenty-seven of the sixty observables are
claimed by two cells at once, and three of those are claimed by all three cells. The eligibility rules call
this overlap deliberate:

> every track reads `intersection`: an item is measured over every unit whose owning node tags any of its
> names, GLUE NODES INCLUDED. No track mints a separate seam item, so a glue unit dropped here would be
> owned by nobody. — `signoff-track-eligibility-statics.ts:66-69`

Two things rescued the even split above, and neither one is an enforced rule:

**(a) Build order drained the overlap.** Cells run in a fixed order — library, then
programmatic-service, then http-backend, then frontend-react (`packageBuildOrderStatics.tiers`). So the
orchestrator cell ran first, the server cell second, and the web cell last. By the time each cell checked
its own remaining list, its predecessors had already signed the glue units between them. Whoever ran first
got first pick.

**(b) The server operator reasoned out the split and wrote it down.** Report 06 §3.4 records this, in the
operator's own words:

> `40.5m say: "I'll sign the 18 that are mine and leave those seven for web's cell rather than marking them
> unconfirmable, which would hide them from the session that can actually confirm them."`

The server operator then left seven units — `check-image-get-issued`, `check-img-actually-loads`,
`check-replay-frame-sent`, `check-entry-lands-in-transcript`, `check-broken-thumbnail-in-place`,
`check-broken-thumbnail-fixed-size`, `check-other-images-unaffected` — for the web cell instead of marking
them unconfirmable. All seven now carry `codeweaverSignoff.workItemId = 71c1fd22…`, the web cell's id. The
server operator got the split exactly right, using the `package` field that the scope tool ignores, because
its own checklist told it those seven belonged to someone else.

That same operator also invented the `get-qa-checklist` call on its own. No codeweaver prompt names that
tool (report 06 §3.3 calls this "the single clearest 'missing from the prompt, had to be invented' finding
in this item"). The operator called it without an `operationItemId`, so the answer it got back was wider
still:

> `40.5m say: "The checklist is authoritative and wider than the flow render: 25 units await my
> sign-off"`

**Verdict: the split matched the work, but only because three separate opus operators each reasoned out the
same 27-unit overlap by hand**, using a field the scope tool never consults. One of them did this while
reading a tool that its own prompt never told it existed. The outcome was correct. The mechanism that
produced it was judgement, not design — see §7.

---

## 3. What each role had to derive for itself

Every one of the four sessions on this flow had to work out the same kind of fact for itself: where its own
slice of work sat inside the shape of the whole flow. Below are six of those facts, and what each session
spent finding out something the system already knew.

### 3.1 The seam disposition — `codeweaverScopeBlockTransformer` has no production caller

`codeweaverScopeBlockTransformer` is written, documented, and has its own unit test — but nothing in the
codebase ever calls it. `workItemToPromptTransformer`, the function that actually builds each session's
prompt, only builds four id lines plus three role-specific extras, and nothing else [report 09 §3a]. So all
three codeweaver cells had to work out, by hand, what that unused transformer would have told them for
free:

| Cell | Derivation | Cost the Phase 1 report attributes |
|---|---|---|
| [4] orchestrator | `0.6m git log --oneline -n 20`, `0.6m git log --name-only -n 3`, `1.5m` read `pasted-image-statics.ts`, `3.6m` read `api-routes-statics.ts`, then wrote the conclusion into its own map: *"`/api/images` lands in `pastedImageStatics` (shared) rather than in the orchestrator, because the server's own route … has to read the same value and the server's cell has NOT committed yet"* | *"the seam-and-shared-home block, re-derived by an opus session at ~4 minutes of exploration"* — **4–6 min of opus exploration** [report 04 §3.2, fix 4] |
| [6] server | six of its seven owned nodes are glue; the unwired block *"would have told it that the orchestrator's half was already complete and web's was not built yet — which is the exact judgement it spent the 40.5m turn reasoning out for itself"* | **~1–2 min of seam reasoning** [report 06 §3.4, fix 3] |
| [9] web | `0.9m` two `git show --stat --name-only` calls to reconstruct what the two prior web cells landed — *"a reconstruction of a fact the ledger already held"* | not separately priced; covered by the `git log` step [report 09 §3a] |

### 3.2 Which packages the flow crosses — the flowrider was never told

The flowrider called `get-agent-prompt` with both `questId` and `workItemId`, but the prompt it got back
contained neither a `Work item context` section nor a `packagesAffected` field [report 15 §3]. The work
item's own `packageNames` field is empty: `[]`.

> **the flowrider was told which flow it owned and nothing about which packages that flow crosses.** It
> spent P1 and half of P2 (**≈8 min, 4 sub-agents, 98,288 output tokens and 31.8 M context-in**) discovering
> that the flow crosses `orchestrator`, `shared`, `server` and `web`. Those four package names exist on the
> codeweaver items [4], [6] and [9] that built this exact flow. — report 15 §3

### 3.3 The edge ids — the flow render prints a sign-off marker beside an id it withholds

```
              →"no transcript entry yet" [#render-from-memory]
              →"transcript entry present" [#drop-optimistic]
                      →"missing, unreadable or not an image" [#image-not-served] [C✓]
```

That line shows a checkmark, `[C✓]`, next to the edge — but it never prints the id a session would need to
actually write that sign-off.

- **[6] server**: `39.2m say: "I need the edge ids to sign the two branch units — the flow render prints
  labels but not ids."` → `39.6m say: "The quest file sits outside my sandbox, and guessing an edge id
  would append a phantom unit."` Cost: **1.4 minutes plus one extra MCP round-trip** [report 06 §3.2b].
- **[9] web**: `79.0m say: "Edge ids are author-chosen, and the quest file sits outside my worktree.
  Fetching the quest as JSON to read them."` A blocked `ls`, a speculative `discover`, a `ToolSearch`, then
  a bare `get-quest({questId})` — the exact call its own prompt forbids — which blew the ceiling (`Error:
  result (263,665 characters across 4,359 lines) exceeds maximum allowed tokens`) and spilled to a file it
  parsed with three `python3 -c` calls. Cost: **1.1 minutes and ≈2,750 output tokens** [report 09 §3c(i),
  §4]. Report 09's verdict: *"forbidden, but the forbidden route was the only route."*

### 3.4 `get-qa-checklist` itself, for the codeweaver

The codeweaver prompt (`codeweaver-prompt-statics.ts`) never names this tool anywhere. Item [6] invented it
on its own. Item [4] never called it at all — its full 69-call tool histogram contains zero calls to it —
and worked instead from the `get-quest` flow render, correcting its own miscount along the way: at 0.7
minutes it said *"Seven nodes are mine, with 15 observables…"*, then at 47.9 minutes said *"All 18 of my
units have their evidence."* Report 06's note on it: *"No time was lost, but nothing in the tooling would
have caught it if it had not."*

### 3.5 `packagesAffected` — no tool returns the current array

Item [4] needed the current value of `packagesAffected` to add `eslint-plugin` to it, after repairing a
repo lint rule — and no tool exists to read that value. It spent phase 13 (minutes 45.1 to 45.8) hunting for
`quest.json` directly on disk, hitting two refusals along the way: `45.3m Error: … The following parts
require approval: ls …/.dungeonmaster/` and `45.3m Error: PreToolUse:Bash hook error:
[dungeonmaster-pre-bash]: BLOCKED: Native search tools are disabled.` Cost: **about 30 seconds and 4 tool
calls** [report 04 §3.5].

### 3.6 The shared e2e substrate, a third time

This flowrider is the third flowrider on this quest. **14 of its 65 explorer-read files — 22 % — had already
been read by an earlier flowrider's explorer**: `playwright.config.ts`, `e2e-fixtures.ts`, the
`claude-mock` harness, `quest.harness.ts`, `environment.harness.ts`, `server-app.harness.ts`,
`api-routes-statics.ts`, `pasted-image-statics.ts`, `web-config-statics.ts`, `image-overlay-widget.tsx`,
`images-flow.ts`, `images-flow.integration.test.ts`, and `start-server.ts`. Pro-rated by file share, that
cost **about 4.2 explorer agent-minutes and about 7.0 million context-in tokens** [report 15 §5.9]. A
second, larger duplicate sits alongside it: the standards triple, 94,985 bytes, was fetched **11 times**
within that one session tree — **1,044,835 bytes of identical text** — because the prompt requires
fetching it.

**Total priced cost of this re-derivation on this flow: roughly 15 to 20 opus-minutes and about 39 million
context-in tokens.** Every bit of it went toward re-establishing facts that already existed — in
`quest.json`, on a sibling work item, or inside a transformer that nothing calls.

---

## 4. Overlaps and seams

### Where two tracks on one unit is defence in depth

**The five codeweaver `unconfirmable` verdicts are the clearest evidence in this whole audit that running
two tracks on the same unit is worth its cost.** All five are `ui-state` claims on `web` nodes. The
codeweaver refused to confirm all five for the same honest reason: the test environment, jsdom, has no real
layout engine, never decodes images, and never fetches a `src` attribute:

> `check-img-actually-loads` — *"jsdom decodes no images, so an img's load event never fires and
> naturalWidth is 0 for every element in every unit test here. Asserting a src attribute would not stand
> in for a decode. Nothing below a real browser can settle this."*

> `check-modal-is-three-quarters-wide` — *"jsdom performs no layout … What is provable is the declared
> value: `image-overlay-widget.test.tsx:118` asserts the Modal's size prop is exactly
> `${webConfigStatics.pastedImage.overlayWidthPercent}%` … That proves the rule was written; it cannot
> prove a browser painted it, because Mantine's own Modal sizing sits between the prop and the pixels."*

**The flowrider then settled four of the five in a real browser**: `check-image-get-issued`,
`check-img-actually-loads`, `check-image-fits-modal-width`, and `check-tall-image-scrolls` — all `confirmed`
by item [15]. **The fifth turned into a genuine defect in the design:**

> `check-modal-is-three-quarters-wide` / flowriderSignoff / **unconfirmable**
> *"MEASURED FALSE in a real browser. Mantine resolves a percentage Modal size against
> `.mantine-Modal-inner`'s padding-excluded content box, not the viewport: that element carries a fixed 36px
> 64px padding, so at a 1280px viewport the available width is 1152px and the modal renders 864px. This
> observable requires 960px (1280 * 0.75). … Design decision #one-overlay-widget-two-callers states 75
> percent of the viewport, so the implementation does not currently satisfy it."*

This is the handoff working exactly as it was designed to. The codeweaver declined to sign what its own
layer cannot see, named that layer, and left an instruction for the next role. The flowrider took all five
to a real browser and came back with four confirmations and one real defect against the design decision.
**That is defence in depth, not wasted effort** — and it is why the web cell's 5 unconfirmable verdicts
count as a credit, not a debit.

### Where two tracks on one unit is close to waste

Twenty `api-call` observables sit on the server nodes. Item [6] proved the whole refusal matrix in
`image-serve-responder.test.ts`, an integration test that drives real HTTP against the app. Item [15] then
re-proved ten of those same rows in `image-route-answers.e2e.ts`, a real browser driving the server. The
flowrider filed its own note explaining why that second pass adds less than it looks like it does:

> **Making `isServableImagePathGuard` return true unconditionally leaves all ten `/api/images` refusal rows
> green, because each is independently defended downstream.** … *This is defence in depth working as
> intended, not a defect — and the guard's own contribution is isolated by
> `is-servable-image-path-guard.test.ts`. Recorded because it means an end-to-end refusal test cannot be
> used to prove the guard specifically does anything*
> — quest note, flowrider, item [15], `2026-09-02T18:37:13.983Z`

So the e2e rows cannot isolate what the unit test can isolate, and the unit test cannot see the real wire
shape the e2e rows can see. Both passes earned their keep, but not for the reason "two independent proofs
of the same claim" suggests. The flowrider actually proved these rows can still fail by breaking something
else entirely: it disabled `imageContentTypeTransformer`, and that flipped the `/etc/passwd` row to **200,
with 3,546 real bytes returned** — a demonstrated ability to read an arbitrary file off disk, found only
because a real HTTP exchange was driven [report 15 §3].

### Where there is a seam

**No unit on this flow belongs to nobody.** Every observable, terminal, and branch sits inside at least two
tracks' denominators, under the rules in `signoffTrackEligibilityStatics`. The one read-check unit is
inside the codeweaver's denominator alone, and that is by design.

Two real seams exist, and both are structural, not accidental:

1. **`check-modal-width-tracks-modal-inner`.** Owed by the codeweaver track, authored after every
   codeweaver cell had already finished, with no follow-up (`pt N`) item to carry it. See §1.
2. **The seven off-map probe families.** These belong to the siegemaster alone — its allowed unit kinds
   are `['terminal', 'branch', 'observable', 'off-map']`, while the other two tracks' rules omit `off-map`
   entirely. All seven are **not yet attempted**, because the siegemaster role never ran.

The audit brief asked directly: was leaving out the off-map families correct for this flow, or did nobody
write them down? **Neither.** Nobody writes them down at all — they are derived the same way for every
flow, automatically. `get-qa-checklist`, called for this flow's siegemaster item, lists all seven with their
standard descriptions. `flow.offMapSignoffs` reads `[]` here for one reason only: nothing has signed any of
them yet:

```
=== paste-image-into-composer offMapSignoffs= 7   (hostile-input, re-entry, concurrency, interruption, staleness, configuration, perf — all confirmed by wi 3a00404a)
=== send-message-with-images  offMapSignoffs= 3   (re-entry, interruption, concurrency — all confirmed by wi db0acadb)
=== render-images-in-transcript offMapSignoffs= 0
```

`paste-image-into-composer`'s 7 comes from a siegemaster that ran to completion. The 3 on
`send-message-with-images` comes from a siegemaster cut off by an API outage after three families. The 0 on
this flow comes from a siegemaster that never started at all. **The `coverage` line "off-map families 0"
reports how many have been signed, and it is easy to misread as how many are owed. It should be read as `0
of 7`.**

Do the same seven probe families even apply to this flow? Every one of them does. This flow has a
`re-entry` surface: reload a transcript, deep-link into `/:guildSlug/session/:sessionId`, navigate away and
back. It has a `concurrency` surface: two browser tabs open on one transcript, both firing `/api/images`
requests at once. It has an `interruption` surface: drop the WebSocket connection mid-replay. It has a
`staleness` surface: an `/api/images` URL whose file was deleted after the entry was delivered. It has a
`configuration` surface: a wrong `serverBaseUrl` baked into the rewritten token. It has a `hostile-input`
surface — **this is the flow carrying the path-traversal, null-byte, and `/etc/passwd` matrix, and
`hostile-input` is exactly where the composer flow's siegemaster found its sharpest results.** And it has a
`perf` surface: N images in one transcript means N separate GET requests. Nothing about this flow makes any
of the seven families not applicable. All seven are owed, and none has been attempted.

---

## 5. Reviewer burden, and what it says about upstream

Four reviewers ran on this flow. **All four passed on the first try. Not one rework round happened anywhere
in the chain.** The table below tracks each reviewer's own timing and what it found, alongside its build and
**ward** run — ward is the repo's automated build, lint, and test gate.

| Reviewer | Wall | What it fixed itself | What it returned as `rework` | Build / ward |
|---|---|---|---|---|
| [4] `codeweaver-reviewer` | 7.1 min, 92 turns, out 24,937 | one `Edit`: an `as` cast replaced with a type-predicate `.find(...)` in a sub-agent's test file — **folded into the commit without reporting it as a rework** [report 04 §5 finding 12] | none | build green, ward green, commit `022d408cb` |
| [6] `codeweaver-reviewer` | 5.3 min | `FIXES: none — the sub-agent output was correct as delivered.` `FINDINGS: none.` | none | one `npm run build` (27 s, green), one `ward -- --staged` (green first time), commit `cffccb204` |
| [9] `codeweaver-reviewer` | 8.6 min, 113 turns | settled the read-check with a real `file:line`; `FINDINGS: none outstanding` | none | one build (24 s), one `--staged` (59.7 s), commit `9f8ab692a` |
| [15] `flowrider-reviewer` | 6.8 min, 87 turns | nothing in the suite; **found and filed a defect in the repo's own pre-push gate** | none | build green, `--staged` green, plus a compensating scoped run, commit `99587913a` |

**No pass repaired anything.** So the audit brief's usual diagnostic — that a reviewer repairing the same
class of problem on every pass reveals a missing step upstream — does not apply here in its stated form.
What applies instead is the mirror image of it: **a reviewer certifying the same class of thing on every
pass, without having read enough to actually certify it.**

**The reviewer on item [9] graded 7 of its 25 changed files from the diff alone, and six of those seven
were test and proxy files** — exactly the files step 4's question 3 exists to interrogate, and exactly the
shortcut its own prompt forbids: *"**Every one, in full.** Not the diff — the file. Reading whole files is
what finds the false green a diff hides"* [report 09 §5 finding 5, verdict FORBIDDEN].

**The reviewer on item [15] read all eleven test files in full, and still got the central question wrong.**
It reported back: *"Found no weak assertions, no existence-only claims, no vacuous negatives."* Report 15
§5.10 shows that claim is false, by the flow-evidence contract's own rule. Here is that rule, verbatim:

> - **Vacuous negatives.** Assert a count of 0, or an absence, only where the same suite shows that
>   selector reaching non-zero.
> — `flow-evidence-contract-statics.ts`

Three assertions in the shipped commit violate it:

- `packages/web/src/flows/session-view/transcript-renders-images.e2e.ts:160` —
  `expect(consoleErrors.getErrors()).toStrictEqual([]);`
- `packages/web/src/flows/session-view/transcript-broken-image.e2e.ts:257` —
  `expect(pageErrors.getErrors()).toStrictEqual([]);`
- `packages/web/src/flows/session-view/transcript-renders-images.e2e.ts:239` —
  `await expect(page.getByText(String(images.getPromptInstructionText()))).toHaveCount(0);`

> Nowhere in the 3,564-line diff does any test deliberately trigger one of those recorders or make that
> locator match. A recorder wired to nothing, or a `getPromptInstructionText()` that returns a string no
> element ever carries, passes all three forever. — report 15 §5.10

There is a fourth weak spot too: at `transcript-image-overlay.e2e.ts:485-486`, a `toBeVisible()` check
stands in for a content claim. The test's actual claim is that the transcript image is *still rendered*
after the overlay closes, but `toBeVisible()` never re-checks the image's `src` attribute.

### What that means for the 68 flowrider sign-offs, with no siegemaster coming

Three facts stack on top of each other here:

1. **The flowrider operator ran `git diff` zero times across 219 minutes of work, and opened only 2 of the
   12 files it produced.** At the 211.5-minute mark it wrote *"Verifying that against the checklist, and
   reading what actually changed"* — and then ran `git status --short` instead of actually reading a diff
   [report 15 §5 finding 2]. The other two flowriders on this quest both read their own output back: FR1
   dispatched 3 rework sub-agents after doing so, and FR2 dispatched 4. **FR3 dispatched 0.**
2. **The reviewer that did read the files certified there were no vacuous negatives — and it was wrong**,
   as shown above.
3. **The siegemaster track has never run, and no item is queued to run it.**

So on this flow, the weak assertions at `transcript-renders-images.e2e.ts:160` and
`transcript-broken-image.e2e.ts:257` are not "a weak assertion some later pass will catch." They are the
final state of this flow's evidence. No walker will open that page. No fresh browser drive is coming. No
`siegemasterSignoff` will ever have to be earned against them.

**This finding does not condemn the other 65 assertions.** Report 15 §5.10 is careful about this, and its
positive case is strong: 121 runtime test cases across 10 files, six of those ten files containing no weak
assertion at all. `transcript-image-path-encoding.e2e.ts` polls `naturalWidth` against nine distinct
expected widths — **29, 28, 31, 33, 35, 37, 39, 41, 43** — which rules out a fixed placeholder ever passing
by accident. `image-serve-responder.test.ts` pairs its negative assertion with a genuine positive control in
the same file. The honest reading is narrower: **three assertions, across two files, carry no proof that
they are even capable of failing, and on this flow nothing downstream exists to notice if they never do.**
On `paste-image-into-composer`, a siegemaster would have driven those same surfaces by hand regardless of
what the test suite asserted. Here, the test suite is the whole verdict, because nothing else is coming.

### Reviewer burden as an upstream signal

Two of the four reviewers spent turns fighting the environment instead of reviewing the work. The reviewer
on item [6] tripped the native-search block twice — a blocked `find` at the 49.3-minute mark, a blocked
`grep` at 52.4 minutes. The reviewer on item [9] tripped it three times [report 09 §5 finding 6]. Across all
27 of item [9]'s sub-agents, there were **18 hook-blocked native-search attempts** in total. Every code
brief the operator itself wrote carried a warning about this. The `codeweaver-reviewer` prompt — which the
operator does not write — carries no such warning. That is a tax charged on every pass, handed down by a
prompt, and it has nothing to do with the spec.

---

## 6. Late discoveries — what was found where it was most expensive

### What this flow contributes to the quest-wide 16-of-163

This flow contributes exactly one observable to that quest-wide count, and the flowrider authored it:

```
render-images-in-transcript  flowrider  check-modal-width-tracks-modal-inner
  the modal's rendered width equals 75 percent of .mantine-Modal-inner's padding-excluded content
  width — which at a 1280px viewport is 864px, not the 960px that 75 percent of the viewport would
  be, because Mantine's modal-inner carries a fixed 64px horizontal padding on each side
```

A 29.5-minute sonnet sub-agent found it during wave 3 of item [15]. The operator recorded it at the
95.6-minute mark: *"Wave 3 came back 10/10 green — but it found something that changes a verdict rather
than confirming one."* Instead of signing the original observable green, the operator marked it
`unconfirmable` with a `toSettle` note, and added this new observable beside it.

**Could a codeweaver's unit test have caught this? No — and the codeweaver said so first.** Item [9] had
already marked `check-modal-is-three-quarters-wide` `unconfirmable`, with exactly the right reason:
*"Mantine's own Modal sizing sits between the prop and the pixels."* The chain worked as intended here. The
96-pixel gap was found at the first layer that could actually see it, by the very next role after the layer
that could not see it, and that earlier role had already named the boundary in advance. **This is the
cheapest possible place this discovery could have happened, and it cost roughly 0 additional wall
clock** — the browser wave that found it was already running for another reason, and it came back 10 out
of 10 green regardless.

**Zero observables on this flow were authored by a siegemaster. That role has not yet been attempted.**

### The three defects that were found, tagged to this flow, and never became units

This is the sharpest evidence in the whole audit, and it sits on this flow. Report 15 §5.11 names three
defects that siegemasters reported and tagged to `render-images-in-transcript`, and shows that **no
assertion in commit `99587913a` would have caught any of them.** I checked all three against `quest.json`
myself and confirmed it.

| Defect | Where found | How recorded | Does a unit exist for it today? |
|---|---|---|---|
| **`transcript-image-unbounded-render`** — *"The transcript's CHAT_MESSAGE_IMAGE renders with no size bound, the same defect just fixed on the composer side."* A 2000×1333 image grows its container to ~610 px of an 813 px viewport. | item **[16]**, siegemaster on `paste-image-into-composer`, `2026-09-02T21:28:53.578Z` | **quest note**, `kind: out-of-scope`, `flowId: render-images-in-transcript`, `unitId: None` | **No.** No observable on this flow makes any painted-bound claim about the loaded inline thumbnail. `check-broken-thumbnail-fixed-size` pins the BROKEN placeholder at 32×32 — a different element. |
| **`failed-send-leaves-duplicate-optimistic-bubble`** — a failed send's optimistic YOU bubble is never removed, so a successful retry shows one message twice (two bubbles, **2 files on disk rather than 4**). | item **[16]**, `2026-09-03T01:42:58.708Z` | **quest note**, `kind: out-of-scope`, `flowId: render-images-in-transcript` | **No.** `check-exactly-one-bubble` covers the successful-replay dedupe only. Nothing on the flow drives a failed POST followed by a retry, and the `drop-optimistic` node carries 2 observables, neither about failure. |
| **`siege-transcript-bubble-renders-plain-text`** — the YOU bubble rendered as plain text: *"no thumbnail, no broken-image placeholder, and no visible token either. Screenshots ss_02677n6tn and ss_1979tvl20 both show the same plain-text bubble."* | item **[17]**, `siegemaster-walker` on `send-message-with-images`, `2026-09-03T07:49:45.840Z` | **quest note**, `kind: out-of-scope`, `flowId: **None**` | **No.** `transcript-broken-image.e2e.ts` covers a missing file, which always renders `CHAT_MESSAGE_IMAGE_BROKEN` — never "nothing at all." |

**The session that found each defect deliberately deferred it to this flow's own session, in writing, every
time:**

> *"It was NOT fixed here: it belongs to flow render-images-in-transcript, which another session is
> actively QA-ing, and editing it would have collided with that session's files."* — note 1

> *"NOT FIXED HERE to avoid colliding with the session that owns that flow's optimistic/transcript
> dedupe."* — note 2

> *"Recorded here so the session that owns render-images-in-transcript can drive it deliberately rather
> than assume the surface is clean."* — note 3

**The session all three defects were deferred to was never dispatched.** Note 1's own premise — that
"another session is actively QA-ing" this flow — was already false at the moment it was written. Item [15]
had signalled `done` at 19:52:11, and item [16] began at that same instant, 19:52:11. The siegemaster that
should have owned this flow was two slots away in the queue, and it never got dispatched at all.

### The mechanism that should have carried them, and the one that did

The siegemaster's own prompt is unambiguous about which channel a finding like this should go through:

> **"No observable claims it" is not a reason to leave something broken.** This product is judged in a
> browser by a person, and a flow that technically completes while looking wrong has failed for them. You
> are the only session that ever sees it running — nothing downstream of you will catch what you wave past.
> — `siegemaster-prompt-statics.ts:329-332`

> **Write into the quest any defect a walker measured that no observable claims.** It is a new observable,
> not a verdict. — `siegemaster-prompt-statics.ts:414-415`

That authority to write a new observable was used **14 times across the whole quest**, and **zero times on
this flow's behalf.** The authority is scoped per flow: a siegemaster walking `paste-image-into-composer`
cannot write a new observable onto `render-images-in-transcript`, because it will never walk that flow and
can never sign it. So all three defects went into `planningNotes.questNotes` instead — a side channel whose
own contract says plainly that it settles nothing:

> `quest.planningNotes.questNotes[]` is the durable side channel … **A note NEVER closes a unit; only a
> sign-off does.** — `packages/orchestrator/CLAUDE.md`

**Finding these three defects cost almost nothing.** All three were side observations that fell out of
probes running on other flows for other reasons: note 1 fell out of the composer flow's own size-bound fix,
note 2 fell out of its interruption probe, and note 3 fell out of a walker reading a transcript after an
accepted send. None of them added measurable extra wall clock to the session that found it. **The entire
cost sits downstream, and that downstream cost is the whole story here**: three known, reproduced,
screenshot-backed defects sit against a flow whose delivered state reads 68 of 69 for the codeweaver track
and 68 of 68 for the flowrider track. None of the three shows up in any denominator. All three sit in a
channel no denominator ever reads. All three are waiting on a role that was never dispatched.

### What a siegemaster walking this flow today would most likely find

This list is grounded in two things: what the siegemasters on the other two flows actually found, and what
report 15 already established about what this flow's own test suites do and do not catch.

1. **The three defects above, immediately, on paths P1, P2, P4, and P5.** All three sit on this flow's main
   walks. Two were reproduced with repro steps, one with screenshots. Report 15 confirms: *"no assertion in
   commit `99587913a` would have caught any of them."*
2. **The `hostile-input` and `perf` families — the two families that yielded the most on the sibling flow,
   and both are still untouched here.** This is the flow carrying the path-traversal, null-byte, and
   `/etc/passwd` matrix. The flowrider already demonstrated an arbitrary-file-read here — requesting
   `/etc/passwd` returned **200, with 3,546 bytes, `Content-Type: image/png`** — when
   `imageContentTypeTransformer` was broken, and it filed a note that the ten refusal rows cannot isolate
   the guard by themselves. A hand probe, run against a live server and a real filesystem, is the layer
   that would close that gap.
3. **The three unproven assertions from §5.** A siegemaster driving the broken-image and renders-images
   paths by hand would either see the console-error and page-error surfaces actually reach a non-zero count
   — which would turn them into real controls — or discover they never fire at all.
4. **`check-modal-is-three-quarters-wide` is still an open product question.** Both tracks left it
   `unconfirmable`, each with a live `toSettle` note naming the same decision: *"Decide whether 75 percent
   means the viewport or the modal-inner content box."* The design decision
   `#one-overlay-widget-two-callers` still says viewport. Nothing in this flow's delivered state resolves
   that conflict.
5. **A dedupe hole in the `__no_session__` bucket, flagged by the flowrider itself, which it could not
   cover.** Its own note on `check-exactly-one-bubble` reads: *"whether a plain chat turn actually streams
   a role:'user' entry back at all, because if it does the optimistic copy and it would BOTH render, which
   is the duplicate-bubble defect this quest exists to remove, on a path this flow's tests do not cover."*

The quest's own ledger currently reads every one of those five as delivered.

### The ward gate at [10]–[12], and what it says about gate placement

This gate is not a discovery about this flow's own work — **it did not fail because of anything this flow's
cells did** — but where it lands in the chain is itself a fact worth recording, and it lands right after
this flow's last cell.

The ward run in question is result `229c5454-3b1c-4f04-aa67-97350a357b20`, run id `1788337745350-9780`,
timestamped `2026-09-02T08:29:05.350Z`, mode `changed`, and it exited 1 (failed). Lint passed. Typecheck
passed. Unit tests passed — 120 web files, 1,187 tests passing, 0 failures. Integration tests failed — 128
web files, 1,204 tests passing, but **2 failures**. E2E was skipped. The two failing files are
`pasted-image-draft-contract.test.ts` and `data-url-split-transformer.test.ts`. **Neither file is in item
[9]'s commit `9f8ab692a`.** Items [7] and [8] landed them, and the spiritmender that diagnosed the root
cause traced it to contracts from items [2] and [7]. Reports 04 and 06 do not mention this gate at all.

The structural point [report 09 §5 finding 8]:

> **No reviewer on this quest could ever have seen it.** `ward(changed)` sits in `relayTail`, after all
> eight codeweaver cells. Eight cells ran, each verified against a `--staged` window that shrank to its own
> commit, and the first whole-branch run of any kind was the gate at 08:29 — the ninth verification event on
> a branch with eight commits on it.

Work item [7] landed the defective contract at `03:45:15.738Z`. The gate did not run until
`08:29:05.350Z` — **4 hours 44 minutes, and four codeweaver sessions, later.** Item [9]'s own reviewer had
run its `--staged` check on the same tree and gone green at `08:25:21.833Z`, **223.5 seconds before the gate
ran** — but that scoped run only graded **16 unit files, against the gate's 120**, and **25 integration
files, against the gate's 128**. The two files that crashed were outside its scope from the start, by
construction.

The second half of this finding is sharper: **even a whole-branch run would have been a coin flip.** In
that same gate run, minutes apart, the web `unit` check passed all 1,187 of its tests while the web
`integration` check failed the same two files. The defect depends on the order Jest happens to batch files
in, exactly as the spiritmender diagnosed: *"a bare `u`-flag drop 'fixed' it in isolation but still crashed
once other files in the batch ran first."*

The tail of this flow's chain absorbed the cost: 5.0 minutes for the failed gate, 23.6 minutes for the
spiritmender that fixed it, and 2.7 minutes for the pt-2 gate — about **31 minutes total**. None of it
was caused by any of this flow's three cells.

---

## 7. The missing middle step

**Is a middle step missing between the approved flow map and the first codeweaver brief?**

**No, nothing is missing there.** Everything every operator on this flow had to invent was information that
already existed somewhere in the system — it just was not wired to reach them. Three of those are wiring
bugs, plain and simple. The one thing genuinely missing sits at the OTHER end of the chain, not between the
map and the first brief.

### What each operator had to invent, and where it belongs

| Invented | By | Belongs in |
|---|---|---|
| The seam disposition — whose half is the other side of this glue node, has it landed, what did it assume | [4], [6], [9] | **A prompt-render wiring fix.** `codeweaverScopeBlockTransformer` is written, documented and unit-tested with **zero production callers**. One branch in `workItemToPromptTransformer` for `role === 'codeweaver'` closes all three derivations. |
| Which packages the flow crosses | [15] | **The same wiring fix.** `workItemContextBlockTransformer` is in the identical state, and the flowrider work item's `packageNames` is `[]` where the three codeweaver items for the same flow carry the answer. 8 min, 4 sub-agents, 98,288 output tokens. |
| An edge's id, in order to sign a branch unit | [6], [9] | **A renderer fix.** `flowGraphToTextTransformer` lines 275/281 print `[C✓]` beside an id they withhold. This is precisely what `packages/orchestrator/CLAUDE.md` rule 4 warns about — *"Check the RENDERER before promising a session what it will be handed"* — and the prompt promises an id the renderer never emits. |
| That `get-qa-checklist` exists at all | [6] | **A prompt edit.** The codeweaver prompt does not name the tool that computes its denominator. [4] never called it. |
| The glue-unit partition — which of the 27 double-owned observables are mine | [4], [6], [9] | **A scope-derivation fix, and this is the one that actually matters.** See below. |
| The current value of `packagesAffected` | [4] | A prompt edit or a tool field; ~30 s and 2 refusals. |

### The one real derivation gap: the checklist over-reports a cell to itself

`qaUnitsInPackageScopeTransformer` narrows its count using the **owning node's** `packages` tags —
`owningPackages.some((name) => declaredNames.has(name))` — and it never reads the observable's own
`package` field. On this flow that hands the three cells 15, 30, and **55** units each — **100 ownerships
spread over 69 real units**, with 27 observables claimed by two or three cells at once.
`qaChecklistBuildTransformer` then makes this worse: it prints a package-scoped numerator over a
denominator that was never narrowed to match (`REMAINING: 1 of 69`). Its own header comment warns about
exactly this: *"PASS THE PACKAGE SCOPE TOO, or the count over-reports."*

Two accidents rescued the split on this flow: build order drained the overlap for whichever cell ran later,
and the server operator reasoned the partition out by hand and wrote it down. Both worked here. Neither one
is a mechanism anyone can rely on next time. **Every observable already carries the field that would
resolve this** — its own `package` field — and the scope derivation simply does not read it. That is a
one-line fix, and it belongs inside `qaUnitsInPackageScopeTransformer`, not somewhere between the flow map
and the first brief.

### The thing that IS missing, and it is at the wrong end of the chain

Report 15's conclusion about the three defects says: *"the corresponding units did not exist on the
checklist, so that is a spec-completeness gap upstream of the flowrider."* That conclusion is **correct on
the facts, and incomplete as a diagnosis.** I verified every part of it myself: the flowrider's checklist
held 68 units, it closed all 68, and no unit for a bounded inline thumbnail, a removed failed-send bubble,
or a plain-text bubble exists on this flow today — nor did one exist back then. The flowrider's own
denominator was never the problem. Its coverage of that denominator was total.

But calling this "a spec-completeness gap upstream of the flowrider" implies the fix belongs in the
spec-writing phase, and the evidence says otherwise. **There is exactly one coverage check anywhere in this
system, and it runs in the wrong direction.**

> - **Uncovered spec (Critical).** Walk every flow and every observable and ask which item would produce
>   it. An observable no item covers ships as unbuilt work that Siegemaster later fails on. Name the
>   specific observable/node IDs that fall through.
> — `chaoswhisperer-gap-minion-statics.ts:266`

That check runs `observable → which item builds it`. **Nothing anywhere runs the other direction: `node or
surface → which observable even claims it`.** I searched every prompt statics file in
`packages/orchestrator/src/statics/` looking for one, and found none. The flowrider's own `UNCOVERED:`
marker means *a checklist unit that no test carries* — that is still inside the denominator, never a check
for something missing from the denominator entirely. The codeweaver's marker means the same thing. The
only role ever charged with looking at surfaces the checklist does not even name is the siegemaster, by
hand, and **last in the chain**:

> **"No observable claims it" is not a reason to leave something broken.** … You are the only session that
> ever sees it running — nothing downstream of you will catch what you wave past.

That sentence is literally true, and this flow is the proof of it. Siegemasters on other flows found all
three defects, and every one of them was routed into a channel that closes nothing — because the only role
that could have turned any of them into a real checklist unit was a session on THIS flow, and that session
never ran.

### The answer

**Nothing is missing between the approved flow map and the first codeweaver brief.** Two things are missing
elsewhere, and one of them is not really a "step" at all:

1. **Not a step at all — three wiring fixes.** Wire `codeweaverScopeBlockTransformer` and
   `workItemContextBlockTransformer` into `workItemToPromptTransformer`. Print the edge id in
   `flowGraphToTextTransformer`, instead of withholding it. Make `qaUnitsInPackageScopeTransformer` read the
   observable's own `package` field. Together, these three fixes close every derivation §3 priced — roughly
   15 to 20 opus-minutes and about 39 million context-in tokens, on this one flow alone — and they replace
   the judgement call that happened to save the cell partition with an actual mechanism. None of the three
   is a new phase, a new role, or a new artifact.

2. **A real step, but it belongs between the flow map and the CHECKLIST — not between the map and the first
   brief.** The system needs a derivation — or a `## UNCOVERED SURFACES` block inside `get-qa-checklist`'s
   output, which report 15 already proposed — that walks each node's own claim and names whatever no
   observable on that node actually asserts. Run that check against the `render-inline` node ("*Thumbnail
   sits where the token was, text on both sides*"), and it asks whether any observable bounds how large the
   thumbnail may paint. None does. Run it against the `drop-optimistic` node ("*Drop the optimistic copy and
   render the transcript entry in its place*"), and it asks what happens when there is nothing to replace
   the optimistic copy with. Nothing answers that either. **Both gaps would have surfaced before item [4]
   was ever dispatched.** This is a cheap, static comparison between a node's label and its observable set —
   run once at Gate #2, and again every time the checklist renders, so that a flow that grows a new node
   later grows the matching question along with it.

The siegemaster's hand-driven authority to find what nobody specified is still worth keeping. It caught 14
observables across the whole quest, and it is the only thing that will ever catch the ones a static check
cannot even phrase. But **it must not be the first and only pass over un-specified surfaces**, because it
sits last in the chain, one session per flow — and on this flow, that session never came.

---

## 8. Raw figures appendix

### Denominator reconciliation — `get-qa-checklist` versus `coverage`

```
codeweaver  (op 332e0da3, web cell)   Units: 69 (2 terminal, 7 branch, 60 observable, 0 off-map)
                                      REMAINING (awaiting your `codeweaverSignoff`): 1 of 69
flowrider   (op c0f5d521)             Units: 68 (2 terminal, 7 branch, 59 observable, 0 off-map)
                                      REMAINING (awaiting your `flowriderSignoff`): 0 of 68
siegemaster (op c435c149, NEVER DISPATCHED)
                                      Units: 75 (2 terminal, 7 branch, 59 observable, 7 off-map)
                                      REMAINING (awaiting your `siegemasterSignoff`): 75 of 75

coverage.txt (all three tracks)       67  of 67
```

Here are `coverage`'s own per-track lines for this flow:

```
render-images-in-transcript
  track                   signed  confirmed  unconfirmable  UNSIGNED  of 67
  codeweaverSignoff           66         61              5         1  of 67
  flowriderSignoff            66         65              1         1  of 67
  siegemasterSignoff           0          0              0        67  of 67
```

Both `1 UNSIGNED` figures here are artifacts of how `coverage` reads the data. The codeweaver's real
remainder is 1 of 69 — the same unit, `check-modal-width-tracks-modal-inner`, correctly counted. The
flowrider's real remainder is **0 of 68**, because `check-patterns-come-from-shared` is a `verifyByReading`
unit and is off its list by rule. The siegemaster's line is **0 of 75, not yet attempted.**

### Delivered sign-offs, computed from `quest.json`

```
WHO SIGNED WHAT, PER CELL (codeweaver):
  [4] orchestrator {'observable': 12, 'confirmed': 12}
        first 2026-09-01T20:31:16.649Z  last 2026-09-01T21:34:10.574Z
  [6] server       {'observable': 18, 'confirmed': 18, 'terminal': 1, 'branch': 2}
        first 2026-09-01T23:30:57.577Z  last 2026-09-01T23:59:38.672Z
  [9] web          {'observable': 29, 'confirmed': 24, 'unconfirmable': 5, 'terminal': 1, 'branch': 5}
        first 2026-09-02T06:56:14.934Z  last 2026-09-02T08:28:32.549Z

FLOWRIDER totals:
  {'observable': 59, 'confirmed': 58, 'terminal': 2, 'unconfirmable': 1, 'branch': 7}
        first 2026-09-02T16:34:48.209Z  last 2026-09-02T19:44:41.883Z
```

### Package accounting

```
NODE TAG MEMBERSHIP (a node with 2 packages counts on both):
  {'web': 16, 'server': 7, 'orchestrator': 3}

OBSERVABLES BY OWNING NODE TAG (intersection semantics — a glue node counts on both sides):
  {'web': 48, 'server': 27, 'orchestrator': 15}

OBSERVABLES BY THEIR OWN `package` FIELD:
  {'web': 30, 'server': 18, 'orchestrator': 12}

FORMAL DENOMINATOR per cell (as qaUnitsInPackageScopeTransformer computes it):
  orchestrator  observables  15  terminals 0  branches 0  = 15 units
  server        observables  27  terminals 1  branches 2  = 30 units
  web           observables  48  terminals 2  branches 5  = 55 units
  SUM of the three = 100 ownerships over 69 units

GLUE NODES:
  request-bytes      ['server','web']                  10 observables
  serve-bytes        ['server','web']                    4
  request-replay     ['server','web']                    2
  replay-user-line   ['orchestrator','server']           2
  deliver-entry      ['orchestrator','server','web']     3
  image-not-served   ['server','web']                    6
  total double/triple-owned observables: 27
```

### Chain cost

| Item | Role · package | Wall | Sub-agents | Units signed | Commit |
|---|---|---|---|---|---|
| [4] `0bd22bc6` | codeweaver · orchestrator | 88.4 min | 18 | 12 | `022d408cb` (29 files, +965 / −17) |
| [6] `6ab40559` | codeweaver · server | 54.6 min | 22 | 21 | `cffccb204` (23 files, +1,101 / −0) |
| [9] `71c1fd22` | codeweaver · web | 109.0 min | 27 | 35 | `9f8ab692a` (26 paths) |
| [15] `b52b4841` | flowrider · whole flow | 219.0 min | 26 | 68 | `99587913a` (13 files, +3,564 / −29) |
| — | siegemaster | **never dispatched** | — | 0 of 75 | — |
| **Total** | | **471.0 min (7 h 51 m)** | **93** | **136** | 4 commits |

Here is how much of each session's wall clock went to waiting on a sub-agent rather than working directly:

| Item | Waiting | Detail |
|---|---|---|
| [4] | **75.2 %** | Waiting on code-writing sub-agents. Report 04 §1 also records: *"There is no dead time in this session."* |
| [6] | **67.8 %** | Idle-waiting: 2,220 seconds across 11 notification gaps. |
| [9] | **74.5 %** waiting, plus 8.1 % on its reviewer | 90.0 minutes total idle, 19.0 minutes parent-active. |
| [15] | **83.2 %** | Waiting; only 2.8 minutes (1.3 %) had no sub-agent live. |

### The five codeweaver `unconfirmable` verdicts and where they landed

| Unit | CW verdict [9] | FR verdict [15] |
|---|---|---|
| `check-image-get-issued` | unconfirmable — *"jsdom never fetches an img's src"* | **confirmed** |
| `check-img-actually-loads` | unconfirmable — *"jsdom decodes no images"* | **confirmed** |
| `check-image-fits-modal-width` | unconfirmable — *"jsdom measures neither"* | **confirmed** |
| `check-tall-image-scrolls` | unconfirmable — *"jsdom reports both as 0"* | **confirmed** |
| `check-modal-is-three-quarters-wide` | unconfirmable — *"Mantine's own Modal sizing sits between the prop and the pixels"* | **unconfirmable — MEASURED FALSE**, 864 px vs 960 px required |

### Off-map probe families

```
=== paste-image-into-composer  offMapSignoffs= 7
    hostile-input | re-entry | concurrency | interruption | staleness | configuration | perf
    all confirmed, wi 3a00404a (item [16], siegemaster complete)
=== send-message-with-images   offMapSignoffs= 3
    re-entry | interruption | concurrency
    all confirmed, wi db0acadb (item [17], cut off mid-loop by an API outage)
=== render-images-in-transcript offMapSignoffs= 0
    all 7 families owed and NOT YET ATTEMPTED — no siegemaster work item was ever dispatched
```

### Mid-quest observables on this flow

```
render-images-in-transcript  flowrider  check-modal-width-tracks-modal-inner
    addedBy: flowrider   flowriderSignoff at 2026-09-02T17:49:58.211Z (wi b52b4841)
    codeweaverSignoff: NONE   siegemasterSignoff: NONE
```

This is one of the quest's 16 mid-quest observables overall — 14 from siegemasters, 2 from flowriders, 0
from codeweavers. Zero of the siegemaster-authored ones are on this flow, because the siegemaster role here
is **not yet attempted**.

### Quest notes tagged to this flow

Seven, plus one attributed to it with `flowId: None`:

| kind | role | wi | unit | at |
|---|---|---|---|---|
| tooling-error | codeweaver | [4] | — | 2026-09-01T21:00:37.011Z — ban-primitives blind spot on a defaulted destructured parameter; the cell repaired `packages/eslint-plugin` |
| open-question | flowrider | [15] | `check-trailer-not-rendered` | 2026-09-02T17:17:30.659Z — `'AB\n\n'` vs `'AB'`; renders and normalises differently |
| out-of-scope | flowrider | [15] | — | 2026-09-02T18:37:13.983Z — Hono answers a 404 with `Content-Type: text/plain; charset=UTF-8`, not no header |
| open-question | flowrider | [15] | — | 2026-09-02T18:37:13.983Z — neutering `isServableImagePathGuard` leaves all ten refusal rows green |
| open-question | flowrider | [15] | `check-exactly-one-bubble` | 2026-09-02T19:44:41.883Z — the `__no_session__` bucket dedupe hole, *"on a path this flow's tests do not cover"* |
| **out-of-scope** | **siegemaster** | **[16]** | — | 2026-09-02T21:28:53.578Z — **unbounded inline thumbnail**; deferred to this flow's session |
| **out-of-scope** | **siegemaster** | **[16]** | — | 2026-09-03T01:42:58.708Z — **failed-send duplicate bubble**; deferred to this flow's session |
| **out-of-scope** | **siegemaster-walker** | **[17]** | — | 2026-09-03T07:49:45.840Z (`flowId: None`) — **plain-text bubble, no image**; *"Recorded here so the session that owns render-images-in-transcript can drive it deliberately"* |

The last three rows carry no `unitId`, and no matching observable exists on the flow for any of them. Under
the quest's own rule — *"A note NEVER closes a unit; only a sign-off does"* — all three sit outside every
denominator.

### Ward gate `229c5454-3b1c-4f04-aa67-97350a357b20`

```
reviewer --staged ward  2026-09-02T08:25:21.833Z  1788337521833   (green,  59.7s)  <- [9]'s reviewer
ward GATE (changed)     2026-09-02T08:29:05.350Z  1788337745350   (FAIL, exit 1)   <- work item [10]
ward pt2 (changed)      2026-09-02T08:57:32.894Z  1788339452894   (green)          <- work item [12]
gap reviewer->gate = 223.517 s

== unit pass        @dungeonmaster/web pass files= 120 disc= 401 fails= 0 errs= 0 pass= 1187
== integration fail @dungeonmaster/web fail files= 128 disc=   8 fails= 2 errs= 0 pass= 1204
```

The failing files were `pasted-image-draft-contract.test.ts` and `data-url-split-transformer.test.ts`.
Items [7] and [8] landed them, and the root cause traces back to contracts from items [2] and [7]. **Neither
file is in item [9]'s commit `9f8ab692a`.** Work item [7] completed at `2026-09-02T03:45:15.738Z`; the gate
did not run until `08:29:05.350Z` — a **4-hour 44-minute latent window** spanning four codeweaver sessions.

### Eligibility rules governing every figure above

```
codeweaver   flowTypes ['runtime','operational']  unitKinds ['terminal','branch','observable']
             observableOrigins ['spec','chaoswhisperer','codeweaver','flowrider','operator']
             verificationMethods ['test','reading']    packageScope 'intersection'
flowrider    flowTypes ['runtime']                unitKinds ['terminal','branch','observable']
             observableOrigins ['spec','chaoswhisperer','codeweaver','flowrider','operator']
             verificationMethods ['test']              packageScope 'intersection'
siegemaster  flowTypes ['runtime','operational']  unitKinds ['terminal','branch','observable','off-map']
             observableOrigins [… ,'siegemaster', 'operator']
             verificationMethods ['test']              packageScope 'intersection'
```
`packages/orchestrator/src/statics/signoff-track-eligibility/signoff-track-eligibility-statics.ts:118-188`

### Numbers not measurable from the available evidence

- **What a siegemaster on this flow would actually find.** The list in §6 is an inference, drawn from what
  the siegemasters on the other two flows actually found and from what report 15 already established about
  what this flow's own suites do and do not catch. It is not a measurement, and this report does not claim
  it as one.
- **Whether the three deferred defects still reproduce on the branch's current head.** Nothing in
  `quest.json`, in the reports, or in the commits records anyone re-driving these defects after the
  composer flow's own siegemaster fixes landed.
- **The wall-clock cost of finding the three deferred defects, at the moment each was found.** All three
  were side observations inside probes that were running for other reasons, and no report separates out
  their share of those probes' minutes.
