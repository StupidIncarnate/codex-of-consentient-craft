# Chain audit — flow `render-images-in-transcript`

Quest `1be07040-b9ec-476c-a439-0b4fbb0123cd`, flow 3 of 3. The chain on this flow is three codeweaver
cells → one flowrider → **no siegemaster**.

> **SCOPE CAVEAT, stated once here and repeated at every figure it touches.** No siegemaster work item
> was ever dispatched for this flow. The operation item exists — `c435c149-60d4-40e0-a380-ec896759a22a`,
> `status: pending`, `Siegemaster: manual-QA this flow and review its test suite — flow:
> render-images-in-transcript` — but the quest paused during the PREVIOUS flow's siegemaster (item [17],
> `send-message-with-images`, cut off mid-loop by an API outage). Every siegemaster figure on this flow
> is **not yet attempted**, never a role failure, and is never scored as one below.

That absence is what makes this flow the audit's second control case. `paste-image-into-composer` shows
what the chain delivers with all three roles run to completion. This one shows what it delivers with the
hand-driven role missing — with the other two tracks at 68/69 and 68/68.

---

## 0. The flow as approved

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
*(`tmp/quest-analysis/coverage.txt`, lines 21–26. The `off-map families 0` line is a signed-count, not an
owed-count — see §1.)*

Sixty observables, by their own `package` field and by type:

```
--- package tally of observables ---
Counter({'web': 30, 'server': 18, 'orchestrator': 12})
--- obs type tally ---
Counter({'ui-state': 24, 'api-call': 20, 'custom': 15, 'log-output': 1})
--- addedBy tally ---
Counter({'spec': 59, 'flowrider': 1})
```

**59 of 60 observables survived Gate #2.** One was authored during execution, by the flowrider. Zero were
authored by a codeweaver. Zero by a siegemaster — no siegemaster ran.

Six of the nineteen nodes are glue, tagged with more than one package:

```
  node request-bytes              packages=['server', 'web'] observables=10
  node serve-bytes                packages=['server', 'web'] observables=4
  node request-replay             packages=['server', 'web'] observables=2
  node replay-user-line           packages=['orchestrator', 'server'] observables=2
  node deliver-entry              packages=['orchestrator', 'server', 'web'] observables=3
  node image-not-served           packages=['server', 'web'] observables=6
  total double/triple-owned observables: 27
```

That 27 is the number that governs §2.

### Reconciling the denominator

The brief requires calling `get-qa-checklist({ questId, operationItemId })` per role and reconciling it
against `coverage`. I called it for three of the four (the fourth, `check-modal-width-tracks-modal-inner`,
is covered by the codeweaver call). **The three answers differ from each other and all three differ from
`coverage`:**

| Track | operation item | MCP `Units:` | breakdown | `REMAINING` **now** | `coverage` says |
|---|---|---|---|---|---|
| codeweaver (web cell) | `332e0da3-…` | **69** | 2 terminal, 7 branch, 60 observable, 0 off-map | **1 of 69** | 67 |
| flowrider | `c0f5d521-…` | **68** | 2 terminal, 7 branch, 59 observable, 0 off-map | **0 of 68** | 67 |
| siegemaster *(never dispatched)* | `c435c149-…` | **75** | 2 terminal, 7 branch, 59 observable, **7 off-map** | **75 of 75** | 67 |

Four separate disagreements, and every one of them is a fact about the artifact:

1. **`coverage` counts no terminals.** Both terminal nodes on this flow carry `codeweaverSignoff` and
   `flowriderSignoff` fields in `quest.json` — `image-not-served` signed by [6], `images-visible` by [9],
   both by [15]. `coverage` omits them, so it under-reports every track by exactly 2 on this flow.
2. **`coverage` counts the read-check against the flowrider and the siegemaster.**
   `check-patterns-come-from-shared` carries `verifyByReading: true`, and
   `signoffTrackEligibilityStatics.byTrack.flowrider.verificationMethods` is `['test']` while
   codeweaver's is `['test', 'reading']`. The flowrider prompt is explicit about it:
   > **An observable your `get-quest` render marks `(read-check)` is settled by reading source, which is
   > another track's method** — it is off this list and out of your count, so never chase one.
   > — `flowrider-prompt-statics.ts:187-189`
   So `coverage`'s "flowriderSignoff 1 unsigned" on this flow is **not a gap**. It is a unit the tool
   removed from the flowrider's list and the prompt told it never to chase.
3. **`coverage`'s "off-map families 0" is a signed count, not an owed count.** `flow.offMapSignoffs` is
   `[]` on this flow only because nothing has signed one. The seven standard families are *derived*, not
   authored — the siegemaster checklist enumerates `re-entry`, `concurrency`, `interruption`, `staleness`,
   `configuration`, `hostile-input`, `perf` for this flow, exactly as for the other two. See §4.
4. **`coverage`'s 67 for the codeweaver misses the mid-quest observable.** The codeweaver denominator is
   60 observables, not 59, because `observableOrigins` for codeweaver includes `flowrider`.

The rule the brief gives — *where they disagree the MCP tool is right* — holds. **`coverage` is a
convenient index, not a denominator, and no session should be graded against it.** Report 17 counted 71
where `coverage` counted 66 on `send-message-with-images` for the same reasons.

---

## 1. Obligation versus delivery, per role

**Totals, computed directly from `quest.json`:**

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

`CW`/`FR` columns give the verdict (`conf` = confirmed, `unco` = unconfirmable) and the work item that
signed it. `SM` is `siegemaster`, unsigned throughout **because that role was never dispatched.**

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

**Exactly one, and it is a chain seam, not a role failure.**

`check-modal-width-tracks-modal-inner` — `addedBy: 'flowrider'`, written into the flow at
`2026-09-02T17:49:58.211Z`, in wave 3 of item [15]. The last codeweaver cell on this flow signed its final
unit at `2026-09-02T08:28:32.549Z` — **9 h 21 m earlier**. The observable is nonetheless inside the
codeweaver denominator, because `signoffTrackEligibilityStatics.byTrack.codeweaver.observableOrigins` is
`['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator']`, and the statics say why:

> Codeweaver's list is Flowrider's rather than a shorter one: a `flowrider` origin reaches a codeweaver
> session on a LATER `pt N` continuation of that package, and dropping it would park such an observable
> outside every codeweaver denominator permanently.
> — `signoff-track-eligibility-statics.ts:87-90`

No `pt N` codeweaver item exists on this quest for `web · render-images-in-transcript`. So the design's
own escape hatch was never opened, and the web cell's checklist will read **`REMAINING: 1 of 69`
forever**. That is the seam: the flowrider's authority to author an observable is real, and nothing routes
the resulting obligation back to the track that now owes it.

The other 75 unsettled entries are the siegemaster's whole list, **not yet attempted.**

---

## 2. Cell decomposition — did the fan-out match the work?

**Yes — perfectly, and by a mechanism the tooling does not provide.**

The delivered split, against the observables' own `package` field:

| Cell | wall clock | sub-agents | observables signed | terminals | branches | **total** | flow's observables with that `package` |
|---|---|---|---|---|---|---|---|
| [4] orchestrator `0bd22bc6` | 88.4 min | 18 | 12 | 0 | 0 | **12** | 12 |
| [6] server `6ab40559` | 54.6 min | 22 | 18 | 1 | 2 | **21** | 18 |
| [9] web `71c1fd22` | 109.0 min | 27 | 29 | 1 | 5 | **35** | 30 (29 + the 1 the flowrider added later) |

Twelve, eighteen, twenty-nine. Fifty-nine of sixty observables, **zero overlap, zero gap**, and each cell's
count is exactly the count of observables carrying its package name. The spread the brief asked about —
sign-off counts from 1 to 55 per cell quest-wide — resolves on this flow to 12/21/35, and it tracks the
work: the web cell carries every `ui-state` unit and every layout claim, the server cell carries the
`/api/images` refusal matrix, the orchestrator cell carries the ten path-encoding invariants plus the
rewrite.

**But that is not the denominator the tool handed them.** `qaUnitsInPackageScopeTransformer` narrows on the
owning NODE's `packages` tags —

```
105 |     return owningPackages.some((name) => declaredNames.has(name));
```

— and never reads the observable's own `package` field at all. Under that rule the three cells' formal
denominators are:

```
FORMAL DENOMINATOR per cell (node-tag intersection, as qaUnitsInPackageScopeTransformer computes it):
  orchestrator  observables  15  terminals 0  branches 0  = 15 units
  server        observables  27  terminals 1  branches 2  = 30 units
  web           observables  48  terminals 2  branches 5  = 55 units
  SUM of the three = 100 ownerships over 69 units
```

**One hundred ownerships over sixty-nine units.** Twenty-seven of the sixty observables are claimed by two
cells, three of them by all three. The eligibility statics call this deliberate:

> every track reads `intersection`: an item is measured over every unit whose owning node tags any of its
> names, GLUE NODES INCLUDED. No track mints a separate seam item, so a glue unit dropped here would be
> owned by nobody. — `signoff-track-eligibility-statics.ts:66-69`

Two things then saved the split, and neither is a rule:

**(a) Build order drained the overlap.** Cells run library → programmatic-service → http-backend →
frontend-react (`packageBuildOrderStatics.tiers`), so orchestrator ran first, server second, web last. Each
cell's `REMAINING` had already been emptied of the glue units its predecessors signed. First come, first
served.

**(b) The server operator wrote the judgement down.** Report 06 §3.4 records it verbatim:

> `40.5m say: "I'll sign the 18 that are mine and leave those seven for web's cell rather than marking
> them unconfirmable, which would hide them from the session that can actually confirm them."`

Those seven — `check-image-get-issued`, `check-img-actually-loads`, `check-replay-frame-sent`,
`check-entry-lands-in-transcript`, `check-broken-thumbnail-in-place`, `check-broken-thumbnail-fixed-size`,
`check-other-images-unaffected` — all now carry `codeweaverSignoff.workItemId = 71c1fd22…`, the web cell.
The server operator got the partition exactly right, from a `package` field the scope transformer ignores,
and its checklist was telling it those seven were its own. Note also that the same session **invented the
`get-qa-checklist` call**: it is not named anywhere in the codeweaver prompt (report 06 §3.3, "the single
clearest 'missing from the prompt, had to be invented' finding in this item"), and it called it without
`operationItemId`, so the answer came back wider still —

> `40.5m say: "The checklist is authoritative and wider than the flow render: 25 units await my sign-off"`

**Verdict:** the fan-out matched the work. It matched because three opus operators each independently
resolved a 27-unit ambiguity the same way, using a field the scope derivation never consults. One of them
did it while reading a tool it was never told existed. That is a correct outcome resting on judgement, not
on the mechanism — see §7.

---

## 3. What each role had to derive for itself

Six distinct facts, all four sessions, all four of the same kind: *the shape of my cell against the shape
of the flow.*

### 3.1 The seam disposition — `codeweaverScopeBlockTransformer` has no production caller

Written, documented, unit-tested, zero call sites. `workItemToPromptTransformer` builds four id lines plus
three role-specific extras and nothing else [report 09 §3a]. All three codeweaver cells re-derived what it
would have printed for free:

| Cell | Derivation | Cost the Phase 1 report attributes |
|---|---|---|
| [4] orchestrator | `0.6m git log --oneline -n 20`, `0.6m git log --name-only -n 3`, `1.5m` read `pasted-image-statics.ts`, `3.6m` read `api-routes-statics.ts`, then wrote the conclusion into its own map: *"`/api/images` lands in `pastedImageStatics` (shared) rather than in the orchestrator, because the server's own route … has to read the same value and the server's cell has NOT committed yet"* | *"the seam-and-shared-home block, re-derived by an opus session at ~4 minutes of exploration"* — **4–6 min of opus exploration** [report 04 §3.2, fix 4] |
| [6] server | six of its seven owned nodes are glue; the unwired block *"would have told it that the orchestrator's half was already complete and web's was not built yet — which is the exact judgement it spent the 40.5m turn reasoning out for itself"* | **~1–2 min of seam reasoning** [report 06 §3.4, fix 3] |
| [9] web | `0.9m` two `git show --stat --name-only` calls to reconstruct what the two prior web cells landed — *"a reconstruction of a fact the ledger already held"* | not separately priced; covered by the `git log` step [report 09 §3a] |

### 3.2 Which packages the flow crosses — the flowrider was never told

`get-agent-prompt` was called with both `questId` and `workItemId`, and the rendered prompt contains
neither `Work item context` nor `packagesAffected` [report 15 §3]. The work item's own `packageNames` is
`[]`.

> **the flowrider was told which flow it owned and nothing about which packages that flow crosses.** It
> spent P1 and half of P2 (**≈8 min, 4 sub-agents, 98,288 output tokens and 31.8 M context-in**)
> discovering that the flow crosses `orchestrator`, `shared`, `server` and `web`. Those four package names
> exist on the codeweaver items [4], [6] and [9] that built this exact flow. — report 15 §3

### 3.3 The edge ids — the flow render prints a sign-off marker beside an id it withholds

```
              →"no transcript entry yet" [#render-from-memory]
              →"transcript entry present" [#drop-optimistic]
                      →"missing, unreadable or not an image" [#image-not-served] [C✓]
```

The line carries `[C✓]` while withholding the id needed to write one.

- **[6] server**: `39.2m say: "I need the edge ids to sign the two branch units — the flow render prints
  labels but not ids."` → `39.6m say: "The quest file sits outside my sandbox, and guessing an edge id
  would append a phantom unit."` Cost: **1.4 minutes plus one extra MCP round-trip** [report 06 §3.2b].
- **[9] web**: `79.0m say: "Edge ids are author-chosen, and the quest file sits outside my worktree.
  Fetching the quest as JSON to read them."` A blocked `ls`, a speculative `discover`, a `ToolSearch`,
  then a bare `get-quest({questId})` — the exact call its own prompt forbids — which blew the ceiling
  (`Error: result (263,665 characters across 4,359 lines) exceeds maximum allowed tokens`) and spilled to
  a file it parsed with three `python3 -c` calls. Cost: **1.1 minutes and ≈2,750 output tokens**
  [report 09 §3c(i), §4]. Report 09's verdict: *"forbidden, but the forbidden route was the only route."*

### 3.4 `get-qa-checklist` itself, for the codeweaver

Not named anywhere in `codeweaver-prompt-statics.ts`. [6] invented it; [4] never called it at all (its full
69-call tool histogram contains none) and worked from the `get-quest` flow render, self-correcting a
miscount along the way: `0.7m say: "Seven nodes are mine, with 15 observables…"` → `47.9m say: "All 18 of
my units have their evidence."` Report 06's note on it: *"No time was lost, but nothing in the tooling
would have caught it if it had not."*

### 3.5 `packagesAffected` — no tool returns the current array

[4] needed it to add `eslint-plugin` after repairing a repo lint rule, and there is no read path. Phase 13
(`45.1m–45.8m`) hunting `quest.json` on disk, eating two refusals:
`45.3m Error: … The following parts require approval: ls …/.dungeonmaster/` and
`45.3m Error: PreToolUse:Bash hook error: [dungeonmaster-pre-bash]: BLOCKED: Native search tools are
disabled.` Cost: **~30 seconds and 4 tool calls** [report 04 §3.5].

### 3.6 The shared e2e substrate, a third time

The flowrider is the third of three on this quest. **14 of its 65 explorer-read files (22 %) had already
been read by an earlier flowrider's explorer** — `playwright.config.ts`, `e2e-fixtures.ts`, the
`claude-mock` harness, `quest.harness.ts`, `environment.harness.ts`, `server-app.harness.ts`,
`api-routes-statics.ts`, `pasted-image-statics.ts`, `web-config-statics.ts`, `image-overlay-widget.tsx`,
`images-flow.ts`, `images-flow.integration.test.ts`, `start-server.ts`. Cost pro-rated by file share:
**≈4.2 explorer agent-minutes and ≈7.0 M context-in tokens** [report 15 §5.9]. A second, larger duplicate:
the standards triple (94,985 bytes) was fetched **11 times** in that one session tree — **1,044,835 bytes
of identical text** — which the prompt requires.

**Total priced derivation cost on this flow: ≈15–20 opus-minutes and ≈39 M context-in tokens**, all of it
spent re-establishing facts that already existed in `quest.json`, on sibling work items, or in a
transformer with no caller.

---

## 4. Overlaps and seams

### Where two tracks on one unit is defence in depth

**The five codeweaver `unconfirmable` verdicts are the cleanest evidence in this audit that the two-track
design earns its cost.** All five are `ui-state` claims on `web` nodes, and all five were refused with the
same honest reason — jsdom has no layout engine, decodes no images and fetches no `src`:

> `check-img-actually-loads` — *"jsdom decodes no images, so an img's load event never fires and
> naturalWidth is 0 for every element in every unit test here. Asserting a src attribute would not stand
> in for a decode. Nothing below a real browser can settle this."*

> `check-modal-is-three-quarters-wide` — *"jsdom performs no layout … What is provable is the declared
> value: `image-overlay-widget.test.tsx:118` asserts the Modal's size prop is exactly
> `${webConfigStatics.pastedImage.overlayWidthPercent}%` … That proves the rule was written; it cannot
> prove a browser painted it, because Mantine's own Modal sizing sits between the prop and the pixels."*

**Four of the five were then settled by the flowrider in a real browser** — `check-image-get-issued`,
`check-img-actually-loads`, `check-image-fits-modal-width`, `check-tall-image-scrolls`, all `confirmed` by
[15]. **The fifth escalated into a genuine spec defect:**

> `check-modal-is-three-quarters-wide` / flowriderSignoff / **unconfirmable**
> *"MEASURED FALSE in a real browser. Mantine resolves a percentage Modal size against
> `.mantine-Modal-inner`'s padding-excluded content box, not the viewport: that element carries a fixed
> 36px 64px padding, so at a 1280px viewport the available width is 1152px and the modal renders 864px.
> This observable requires 960px (1280 * 0.75). … Design decision #one-overlay-widget-two-callers states
> 75 percent of the viewport, so the implementation does not currently satisfy it."*

That is the handoff working exactly as designed: the codeweaver declined to sign what its layer cannot see,
named the layer, and left an instruction; the flowrider took all five to a real browser and returned four
confirmations and one defect against the design decision. **Defence in depth, not waste.** It is also the
reason the web cell's 5 unconfirmables are a credit rather than a debit.

### Where two tracks on one unit is close to waste

The twenty `api-call` observables on the server nodes. [6] proved the refusal matrix in
`image-serve-responder.test.ts` (integration, real HTTP against the app); [15] re-proved ten of the same
rows in `image-route-answers.e2e.ts` (real browser-driven server). The flowrider itself filed the note that
tells you why the second pass adds less than it looks:

> **Making `isServableImagePathGuard` return true unconditionally leaves all ten `/api/images` refusal rows
> green, because each is independently defended downstream.** … *This is defence in depth working as
> intended, not a defect — and the guard's own contribution is isolated by
> `is-servable-image-path-guard.test.ts`. Recorded because it means an end-to-end refusal test cannot be
> used to prove the guard specifically does anything*
> — quest note, flowrider, item [15], `2026-09-02T18:37:13.983Z`

So the e2e rows cannot isolate what the unit test can, and the unit test cannot see the wire shape the e2e
rows can. Both earned their keep — but for a different reason than "two independent proofs of the same
claim". The flowrider recovered falsifiability for those rows by a different break entirely: neutering
`imageContentTypeTransformer`, which flipped the `/etc/passwd` row to **200 with 3,546 real bytes** — a
demonstrated arbitrary-file-read, found only because a real HTTP exchange was driven [report 15 §3].

### Where there is a seam

**No unit on this flow is owned by nobody.** Every observable, terminal and branch is inside at least two
tracks' denominators under `signoffTrackEligibilityStatics`, and the one read-check is inside codeweaver's
alone by design.

The seams that exist are two, and both are structural:

1. **`check-modal-width-tracks-modal-inner`** — owed by codeweaver, authored after every codeweaver cell
   finished, with no `pt N` item to carry it. §1.
2. **The seven off-map probe families** — siegemaster's alone
   (`unitKinds: ['terminal', 'branch', 'observable', 'off-map']`; the other two tracks omit `off-map`),
   **not yet attempted.**

On the off-map question the brief asked directly: *was their absence correct for this flow, or did nobody
author them?* **Neither.** They are not authored at all — they are derived, identically, for every flow.
`get-qa-checklist` for this flow's siegemaster item enumerates all seven with their standard descriptions.
`flow.offMapSignoffs` is `[]` here purely because nothing has signed one:

```
=== paste-image-into-composer offMapSignoffs= 7   (hostile-input, re-entry, concurrency, interruption, staleness, configuration, perf — all confirmed by wi 3a00404a)
=== send-message-with-images  offMapSignoffs= 3   (re-entry, interruption, concurrency — all confirmed by wi db0acadb)
=== render-images-in-transcript offMapSignoffs= 0
```

`paste-image-into-composer`'s 7 is a completed siegemaster; `send-message-with-images`' 3 is a siegemaster
cut off by an API outage after three families; this flow's 0 is a siegemaster that never started. **The
`coverage` line "off-map families 0" reports a signed count and reads as an owed count — it should be read
as `0 of 7`.**

Do the other flows' probes apply here? Every one of them. This flow has a `re-entry` surface (reload a
transcript, deep-link into `/:guildSlug/session/:sessionId`, navigate away and back), a `concurrency`
surface (two tabs on one transcript, parallel `/api/images` GETs), an `interruption` surface (drop the
WebSocket mid-replay), a `staleness` surface (an `/api/images` URL whose file has been deleted since the
entry was delivered), a `configuration` surface (a wrong `serverBaseUrl` in the rewritten token), a
`hostile-input` surface — **this is the flow with the traversal / null-byte / `/etc/passwd` matrix on it,
and `hostile-input` is where the composer siegemaster found its sharpest results** — and a `perf` surface
(N images in one transcript = N GETs). Nothing about this flow makes any family N/A. All seven are owed
and none has been attempted.

---

## 5. Reviewer burden, and what it says about upstream

Four reviewers ran on this flow. **All four returned `pass` on the first try. Zero rework rounds across the
entire chain.**

| Reviewer | Wall | What it fixed itself | What it returned as `rework` | Build / ward |
|---|---|---|---|---|
| [4] `codeweaver-reviewer` | 7.1 min, 92 turns, out 24,937 | one `Edit`: an `as` cast replaced with a type-predicate `.find(...)` in a sub-agent's test file — **folded into the commit without reporting it as a rework** [report 04 §5 finding 12] | none | build green, ward green, commit `022d408cb` |
| [6] `codeweaver-reviewer` | 5.3 min | `FIXES: none — the sub-agent output was correct as delivered.` `FINDINGS: none.` | none | one `npm run build` (27 s, green), one `ward -- --staged` (green first time), commit `cffccb204` |
| [9] `codeweaver-reviewer` | 8.6 min, 113 turns | settled the read-check with a real `file:line`; `FINDINGS: none outstanding` | none | one build (24 s), one `--staged` (59.7 s), commit `9f8ab692a` |
| [15] `flowrider-reviewer` | 6.8 min, 87 turns | nothing in the suite; **found and filed a defect in the repo's own pre-push gate** | none | build green, `--staged` green, plus a compensating scoped run, commit `99587913a` |

**Nothing was repaired on any pass.** So the brief's diagnostic — *a reviewer repairing the same class of
thing on every pass is a missing step* — does not fire here in its stated form. What fires instead is its
mirror: **a reviewer certifying the same class of thing on every pass, without having read enough to
certify it.**

**[9]'s reviewer graded 7 of 25 files from a diff, six of them test and proxy files** — the exact files
step 4's question 3 exists to interrogate, and the exact shortcut its own prompt names:
*"**Every one, in full.** Not the diff — the file. Reading whole files is what finds the false green a
diff hides"* [report 09 §5 finding 5, verdict FORBIDDEN].

**[15]'s reviewer read all eleven test files in full and still got the central question wrong.** Its return
says *"Found no weak assertions, no existence-only claims, no vacuous negatives."* Report 15 §5.10 shows
that claim is false on the flow-evidence contract's own terms. The contract, verbatim:

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

Plus a `toBeVisible()` standing in for a content claim at `transcript-image-overlay.e2e.ts:485-486`, where
the test's own claim is that the transcript image is *still rendered* after the overlay closes and
`toBeVisible()` never re-checks `src`.

### What that means for the 68 flowrider sign-offs, with no siegemaster coming

Three facts stack:

1. The flowrider operator **ran `git diff` zero times in 219 minutes** and opened **2 of the 12 files it
   produced**. At `211.5m` it wrote *"Verifying that against the checklist, and reading what actually
   changed"* and ran `git status --short` [report 15 §5 finding 2]. Both sibling flowriders read their
   output back; FR1 dispatched 3 rework sub-agents after doing so, FR2 dispatched 4. **FR3 dispatched 0.**
2. The reviewer that did read the files certified there were no vacuous negatives, and was wrong.
3. **The third track has never run and there is no queued item that will run it.**

So on this flow, `transcript-renders-images.e2e.ts:160` and `transcript-broken-image.e2e.ts:257` are not
"a weak assertion a later pass will catch". They are the terminal state. There is no walker who will open
that page, no fresh browser drive, and no `siegemasterSignoff` that would have to be earned against them.

**This does not indict the other 65.** Report 15 §5.10 is careful, and its positive case is strong: 121
runtime cases across 10 files, six of the ten containing no weak assertion at all,
`transcript-image-path-encoding.e2e.ts` polling `naturalWidth` to **nine distinct expected widths
(29/28/31/33/35/37/39/41/43)** so a fixed-placeholder pass is impossible, and
`image-serve-responder.test.ts` pairing its negative with a genuine positive control in the same file. The
honest reading is: **three assertions across two files carry no proof that they can fail, and on this flow
nothing downstream exists to notice.** On `paste-image-into-composer` a siegemaster would have driven those
surfaces by hand regardless of what the suite asserted. Here the suite is the whole verdict.

### Reviewer burden as an upstream signal

Two of the four reviewers spent turns on the environment rather than the work — [6]'s tripped the
native-search PreToolUse block twice (a `find` at `49.3m`, a `grep` at `52.4m`), [9]'s three times
[report 09 §5 finding 6]. Across [9]'s 27 sub-agents there were **18 hook-blocked native-search attempts**.
Every code brief the operator wrote carried the warning; the `codeweaver-reviewer` prompt, which the
operator does not write, carries none. That is a per-pass tax handed down from a prompt, not from the spec.

---

## 6. Late discoveries — what was found where it was most expensive

### What this flow contributes to the quest-wide 16-of-163

**Exactly one observable, authored by the flowrider:**

```
render-images-in-transcript  flowrider  check-modal-width-tracks-modal-inner
  the modal's rendered width equals 75 percent of .mantine-Modal-inner's padding-excluded content
  width — which at a 1280px viewport is 864px, not the 960px that 75 percent of the viewport would
  be, because Mantine's modal-inner carries a fixed 64px horizontal padding on each side
```

Found in wave 3 of item [15], by a 29.5-minute sonnet sub-agent, and recorded at `95.6m say: "Wave 3 came
back 10/10 green — but it found something that changes a verdict rather than confirming one."` The operator
recorded `unconfirmable` with a `toSettle` on the original observable and added this one beside it rather
than signing a green.

**Could a codeweaver unit test have caught it? No, and the codeweaver said so first.** [9] had already
marked `check-modal-is-three-quarters-wide` `unconfirmable` with exactly the right reason — *"Mantine's own
Modal sizing sits between the prop and the pixels"*. The chain worked. The 96 px gap was found at the first
layer that could see it, one role after the layer that could not, and the earlier role named the boundary
in advance. **This is the cheapest possible place for that discovery, and it cost ≈0 additional wall clock**
— the wave was running anyway and returned 10/10 green.

**Zero siegemaster-authored observables on this flow — not yet attempted.**

### The three defects that were found, tagged to this flow, and never became units

This is the sharpest evidence in the audit and it sits on this flow. Report 15 §5.11 names three
siegemaster-reported defects attributed to `render-images-in-transcript` and shows that **no assertion in
commit `99587913a` would have caught any of them.** I verified all three against `quest.json`.

| Defect | Where found | How recorded | Does a unit exist for it today? |
|---|---|---|---|
| **`transcript-image-unbounded-render`** — *"The transcript's CHAT_MESSAGE_IMAGE renders with no size bound, the same defect just fixed on the composer side."* A 2000×1333 image grows its container to ~610 px of an 813 px viewport. | item **[16]**, siegemaster on `paste-image-into-composer`, `2026-09-02T21:28:53.578Z` | **quest note**, `kind: out-of-scope`, `flowId: render-images-in-transcript`, `unitId: None` | **No.** No observable on this flow makes any painted-bound claim about the loaded inline thumbnail. `check-broken-thumbnail-fixed-size` pins the BROKEN placeholder at 32×32 — a different element. |
| **`failed-send-leaves-duplicate-optimistic-bubble`** — a failed send's optimistic YOU bubble is never removed, so a successful retry shows one message twice (two bubbles, **2 files on disk rather than 4**). | item **[16]**, `2026-09-03T01:42:58.708Z` | **quest note**, `kind: out-of-scope`, `flowId: render-images-in-transcript` | **No.** `check-exactly-one-bubble` covers the successful-replay dedupe only. Nothing on the flow drives a failed POST followed by a retry, and the `drop-optimistic` node carries 2 observables, neither about failure. |
| **`siege-transcript-bubble-renders-plain-text`** — the YOU bubble rendered as plain text: *"no thumbnail, no broken-image placeholder, and no visible token either. Screenshots ss_02677n6tn and ss_1979tvl20 both show the same plain-text bubble."* | item **[17]**, `siegemaster-walker` on `send-message-with-images`, `2026-09-03T07:49:45.840Z` | **quest note**, `kind: out-of-scope`, `flowId: **None**` | **No.** `transcript-broken-image.e2e.ts` covers a missing file, which always renders `CHAT_MESSAGE_IMAGE_BROKEN` — never "nothing at all." |

**Every one of the three was deliberately deferred to this flow's session, in writing, by the session that
found it:**

> *"It was NOT fixed here: it belongs to flow render-images-in-transcript, which another session is
> actively QA-ing, and editing it would have collided with that session's files."* — note 1

> *"NOT FIXED HERE to avoid colliding with the session that owns that flow's optimistic/transcript
> dedupe."* — note 2

> *"Recorded here so the session that owns render-images-in-transcript can drive it deliberately rather
> than assume the surface is clean."* — note 3

**The session all three were deferred to was never dispatched.** Note 1's premise — "which another session
is actively QA-ing" — was already false when written: item [15] had signalled `done` at 19:52:11 and item
[16] began at 19:52:11; the siegemaster for this flow was two slots away and never got one.

### The mechanism that should have carried them, and the one that did

The siegemaster prompt is unambiguous about the right channel:

> **"No observable claims it" is not a reason to leave something broken.** This product is judged in a
> browser by a person, and a flow that technically completes while looking wrong has failed for them. You
> are the only session that ever sees it running — nothing downstream of you will catch what you wave past.
> — `siegemaster-prompt-statics.ts:329-332`

> **Write into the quest any defect a walker measured that no observable claims.** It is a new observable,
> not a verdict. — `siegemaster-prompt-statics.ts:414-415`

That authority was exercised **14 times quest-wide** and **zero times on this flow's behalf**, because the
authority is per-flow: a siegemaster on `paste-image-into-composer` writing an observable onto
`render-images-in-transcript` would be authoring units against a flow it will never walk and cannot sign.
So all three defects went into `planningNotes.questNotes` instead — a channel whose own contract is that
it settles nothing:

> `quest.planningNotes.questNotes[]` is the durable side channel … **A note NEVER closes a unit; only a
> sign-off does.** — `packages/orchestrator/CLAUDE.md`

**Cost where they were found: near zero.** All three were side observations from probes on their own flows
— note 1 fell out of the composer's own size-bound fix, note 2 out of its interruption probe, note 3 out of
a walker reading a transcript after an accepted send. None cost measurable incremental wall clock on the
session that found it. **The cost is entirely downstream, and it is the whole cost**: three known,
reproduced, screenshot-backed defects on a flow whose delivered state is 68/69 codeweaver and 68/68
flowrider, invisible to every number in the ledger, sitting in a channel no denominator reads, waiting on a
role that was never dispatched.

### What a siegemaster walking this flow today would most likely find

Grounded in what the siegemasters on the other two flows actually found and what report 15 says this
flow's suites do and do not bite on:

1. **The three defects above, immediately, on paths P1/P2/P4/P5.** All three are on the flow's main walks;
   two were reproduced with repro steps and one with screenshots. Report 15 confirms *"no assertion in
   commit `99587913a` would have caught any of them."*
2. **`hostile-input` and `perf` — the two families with the most yield on the sibling flow, both untouched
   here.** This is the flow carrying the traversal / null-byte / `/etc/passwd` matrix. The flowrider
   already demonstrated an arbitrary-file-read (`/etc/passwd` → **200, 3,546 bytes, `Content-Type:
   image/png`**) when `imageContentTypeTransformer` was broken, and filed the note that the ten refusal
   rows cannot isolate the guard. A hand probe with a live server against a real filesystem is the layer
   that closes that.
3. **The three unproven assertions from §5.** A siegemaster driving the broken-image and renders-images
   paths by hand would either observe the console/page-error surfaces reaching non-zero (turning them into
   real controls) or find them inert.
4. **`check-modal-is-three-quarters-wide` still red as a product question.** Both tracks left it
   `unconfirmable` with a live `toSettle` naming a decision — *"Decide whether 75 percent means the
   viewport or the modal-inner content box"* — and the design decision `#one-overlay-widget-two-callers`
   still says viewport. Nothing in this flow's delivered state resolves it.
5. **The `__no_session__` dedupe hole the flowrider itself flagged and could not cover.** Its own note on
   `check-exactly-one-bubble` reads: *"whether a plain chat turn actually streams a role:'user' entry back
   at all, because if it does the optimistic copy and it would BOTH render, which is the duplicate-bubble
   defect this quest exists to remove, on a path this flow's tests do not cover."*

Every one of those five is a claim the ledger currently reads as delivered.

### The ward gate at [10]–[12], and what it says about gate placement

The gate is not a discovery on this flow — **it did not fail on this flow's work** — but its placement is a
chain fact and this flow's last cell is where it lands.

Ward result `229c5454-3b1c-4f04-aa67-97350a357b20`, runId `1788337745350-9780` = `2026-09-02T08:29:05.350Z`,
mode `changed`, exit 1. `lint` pass, `typecheck` pass, `unit` **pass** (web 120 files, 1,187 passing, 0
failures), `integration` **fail** (web 128 files, 1,204 passing, **2 failures**), `e2e` skip. The two
failures are in `pasted-image-draft-contract.test.ts` and `data-url-split-transformer.test.ts` — **neither
is in [9]'s commit `9f8ab692a`**; they were landed by items [7] and [8], and the root cause the spiritmender
found sits in contracts from items [2] and [7]. Reports 04 and 06 do not mention the gate at all.

The structural point [report 09 §5 finding 8]:

> **No reviewer on this quest could ever have seen it.** `ward(changed)` sits in `relayTail`, after all
> eight codeweaver cells. Eight cells ran, each verified against a `--staged` window that shrank to its own
> commit, and the first whole-branch run of any kind was the gate at 08:29 — the ninth verification event
> on a branch with eight commits on it.

Work item [7] landed the defective contract at `03:45:15.738Z`; the gate ran at `08:29:05.350Z` —
**4 h 44 m and four codeweaver sessions later.** [9]'s reviewer's own `--staged` run went green at
`08:25:21.833Z`, **223.5 seconds before the gate**, on the same tree, grading **16 unit files where the gate
graded 120** and **25 integration files where the gate graded 128**. The two crashing files were outside its
scope by construction.

And the second half is sharper: **even a whole-branch run would have been a coin flip.** In the same gate
run, minutes apart, web `unit` passed 1,187 tests while web `integration` failed the same two — the defect
is jest-batch-order-dependent, exactly as the spiritmender diagnosed (*"a bare `u`-flag drop 'fixed' it in
isolation but still crashed once other files in the batch ran first"*).

Cost charged to the tail of this flow's chain: 5.0 min failed gate + 23.6 min spiritmender + 2.7 min pt-2
gate ≈ **31 min**, none of it caused by any of this flow's three cells.

---

## 7. The missing middle step

**Is a middle step missing between the approved flow map and the first codeweaver brief?**

**No. What every operator on this flow had to invent was not a planning artifact — it was information that
already existed and was not wired to reach them. Three of those are wiring bugs. The one thing genuinely
missing sits at the OTHER end of the chain, not between the map and the first brief.**

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

`qaUnitsInPackageScopeTransformer` narrows on the **owning node's** `packages` tags
(`owningPackages.some((name) => declaredNames.has(name))`) and never reads the observable's own `package`
field. On this flow that hands the three cells 15 / 30 / **55** units — **100 ownerships over 69 units**,
with 27 observables claimed twice or three times. `qaChecklistBuildTransformer` then compounds it by
printing a package-scoped numerator over an un-narrowed denominator (`REMAINING: 1 of 69`), which its own
header comment warns about: *"PASS THE PACKAGE SCOPE TOO, or the count over-reports."*

Two accidents rescued the split: build order drained the overlap for whoever ran later, and the server
operator reasoned the partition out by hand and wrote it down. Both worked. Neither is a mechanism.
**Every observable already carries the field that resolves it** — `package` — and the scope derivation does
not consult it. That is a one-line middle step, and it lives inside `qaUnitsInPackageScopeTransformer`, not
between the flow map and the first brief.

### The thing that IS missing, and it is at the wrong end of the chain

Report 15's conclusion on the three defects — *"the corresponding units did not exist on the checklist, so
that is a spec-completeness gap upstream of the flowrider"* — is **correct on the facts and incomplete on
the diagnosis.** I verified every part of it: the flowrider's checklist was 68 units, it closed 68, and no
unit for a bounded inline thumbnail, a removed failed-send bubble, or a plain-text bubble exists on the flow
today or existed then. The flowrider's denominator derivation is not the problem. Its coverage of its own
denominator is total.

But calling it "a spec-completeness gap upstream of the flowrider" implies the fix goes into the spec phase,
and the evidence says otherwise. **There is exactly one coverage check in the whole system, and it runs the
wrong direction.**

> - **Uncovered spec (Critical).** Walk every flow and every observable and ask which item would produce
>   it. An observable no item covers ships as unbuilt work that Siegemaster later fails on. Name the
>   specific observable/node IDs that fall through.
> — `chaoswhisperer-gap-minion-statics.ts:266`

That is `observable → which item builds it`. **Nothing anywhere runs `node/surface → which observable
claims it`.** I searched every prompt statics file in `packages/orchestrator/src/statics/` for it. The
flowrider's `UNCOVERED:` means *a checklist unit no test carries* — inside the denominator, never outside
it. The codeweaver's is the same. The one role charged with looking at surfaces the checklist does not name
is the siegemaster, by hand, **last**:

> **"No observable claims it" is not a reason to leave something broken.** … You are the only session that
> ever sees it running — nothing downstream of you will catch what you wave past.

That sentence is literally true, and this flow is the proof. Three defects were found by siegemasters, on
other flows, and routed to a channel that closes nothing, because the only role that could have turned them
into units was a session on THIS flow that never ran.

### The answer

**Nothing is missing between the approved flow map and the first codeweaver brief. Two things are missing
elsewhere, and one of them is not a step at all:**

1. **Not a step — three wiring fixes.** `codeweaverScopeBlockTransformer` and
   `workItemContextBlockTransformer` wired into `workItemToPromptTransformer`; the edge id printed in
   `flowGraphToTextTransformer`; the observable's own `package` field consulted in
   `qaUnitsInPackageScopeTransformer`. Together these close every derivation §3 priced — ≈15–20 opus-minutes
   and ≈39 M context-in on this flow alone — and they replace the judgement call that saved the cell
   partition with a mechanism. None of them is a new phase, a new role, or a new artifact.

2. **A step, and it belongs between the flow map and the CHECKLIST, not between the map and the brief.**
   A derivation — or a `## UNCOVERED SURFACES` block in `get-qa-checklist`'s render, which report 15
   already proposed — that walks each node's own claim and names what no observable on it asserts. On
   `render-inline` ("*Thumbnail sits where the token was, text on both sides*") that check asks whether any
   observable bounds how large the thumbnail may paint, and finds none. On `drop-optimistic` ("*Drop the
   optimistic copy and render the transcript entry in its place*") it asks what happens when there is
   nothing to replace it with, and finds none. **Both would have surfaced before item [4] was ever
   dispatched** — a cheap, static comparison of a node's label against its observable set, run once at Gate
   #2 and again in every checklist render, so a flow that grows a node later grows the question with it.

The siegemaster's hand-driven find-what-nobody-specified authority is still worth having; it caught 14
observables quest-wide and it is the only thing that will ever catch the ones a static check cannot phrase.
But **it must not be the first and only pass over un-specified surfaces**, because it sits last, one session
per flow, and on this flow it never came.

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

`coverage`'s per-track lines for this flow:

```
render-images-in-transcript
  track                   signed  confirmed  unconfirmable  UNSIGNED  of 67
  codeweaverSignoff           66         61              5         1  of 67
  flowriderSignoff            66         65              1         1  of 67
  siegemasterSignoff           0          0              0        67  of 67
```

Both `1 UNSIGNED` figures are artifacts of the `coverage` reading: the codeweaver's real remainder is 1 of
69 (the same unit, `check-modal-width-tracks-modal-inner`, correctly counted); the flowrider's is **0 of
68** (`check-patterns-come-from-shared` is `verifyByReading` and off its list by rule). The siegemaster line
is **0 of 75, not yet attempted.**

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

Waiting share of each session's clock: [4] **75.2 %** waiting on code-writing sub-agents (report 04 §1,
which also records *"There is no dead time in this session"*); [6] **67.8 %** idle-waiting (2,220 s across
11 notification gaps); [9] **74.5 %** waiting plus 8.1 % on its reviewer (90.0 min total idle, 19.0 min
parent-active); [15] **83.2 %** waiting, of which only **2.8 min (1.3 %)** had no sub-agent live.

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

One of the quest's 16 mid-quest observables (14 siegemaster, 2 flowrider, 0 codeweaver). Zero
siegemaster-authored observables on this flow — **not yet attempted**.

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

The last three carry no `unitId` and no corresponding observable exists on the flow. Under the quest's own
rule — *"A note NEVER closes a unit; only a sign-off does"* — they are outside every denominator.

### Ward gate `229c5454-3b1c-4f04-aa67-97350a357b20`

```
reviewer --staged ward  2026-09-02T08:25:21.833Z  1788337521833   (green,  59.7s)  <- [9]'s reviewer
ward GATE (changed)     2026-09-02T08:29:05.350Z  1788337745350   (FAIL, exit 1)   <- work item [10]
ward pt2 (changed)      2026-09-02T08:57:32.894Z  1788339452894   (green)          <- work item [12]
gap reviewer->gate = 223.517 s

== unit pass        @dungeonmaster/web pass files= 120 disc= 401 fails= 0 errs= 0 pass= 1187
== integration fail @dungeonmaster/web fail files= 128 disc=   8 fails= 2 errs= 0 pass= 1204
```

Failing files: `pasted-image-draft-contract.test.ts` and `data-url-split-transformer.test.ts` — landed by
items [7] and [8], root cause in contracts from items [2] and [7]. **Not in [9]'s commit `9f8ab692a`.**
Work item [7] completed `2026-09-02T03:45:15.738Z`; the gate ran `08:29:05.350Z` — **4 h 44 m latent
window** across four codeweaver sessions.

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

- **What a siegemaster on this flow would actually have found.** §6's list is inference from what the
  siegemasters on the other two flows found and from what report 15 established the suites do not bite on.
  It is not a measurement, and it is not stated as one.
- **Whether the three deferred defects still reproduce on the branch's current head.** Nothing in
  `quest.json`, the reports or the commits records a re-drive after the composer siegemaster's own fixes
  landed.
- **The wall-clock cost of the three deferred defects at their point of discovery.** All three were side
  observations inside probes running for other reasons; no report separates their share of those probes'
  minutes.
