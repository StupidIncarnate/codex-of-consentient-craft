# Chain audit — flow `send-message-with-images`

Quest `1be07040-b9ec-476c-a439-0b4fbb0123cd` · flow 2 of 3 · "Send a message carrying images"

**Scope caveat, stated once and honoured throughout.** Work item [17], the siegemaster on this flow, ran
655 minutes and was **cut off mid-loop by an API outage** — 15 identical zero-token 529 cycles over 79
minutes. It never reached its reviewer, never called `signal-back`, and left 67 uncommitted paths. Its
four unsigned units are **not yet attempted**, not a role failure, and are reported as such every time
they appear below.

**Headline.** The chain on this flow *did* deliver. Flowrider [14] closed its denominator exactly —
**59 owed, 59 signed, 0 unsigned**. Siegemaster [17] reached **67 of 71** before it was cut off, and the
four it did not reach are off-map probe families, not yet attempted. Codeweaver has **1 of 61**
outstanding, an observable authored 9.2 hours after the cell that owns it had closed. 58 of the 73
enumerated units carry all three tracks, 54 of them three-times-`confirmed`.

But the delivery was not driven by the artifact the gate approved. **The codeweaver is the only one of
the three tracks with no denominator tool** — `get-qa-checklist` appears **zero times** in
`codeweaver-prompt-statics.ts` and zero times in `codeweaver-reviewer-statics.ts`, while
`flowrider-prompt-statics.ts` and `siegemaster-prompt-statics.ts` each give it a numbered step. All four
cells therefore enumerated their own work by eye, from a graph render that never prints the edge ids it
is required to sign; two sign-offs were destroyed in transit by a call that answered `success`; and the
one defect that cost this flow 32 hours was named in writing by a codeweaver, measured by the flowrider,
and fixed by the siegemaster's walkers, because nothing between the flow map and the first brief says
which cell owns a route the graph draws only once. That is the missing middle step, and §7 states it.

---

## 0. The flow as approved

Read straight from `quest.json`:

```
send-message-with-images  (runtime)  Send a message carrying images
  nodes 18 {'action': 10, 'decision': 3, 'terminal': 5}
  edges 19 (10 labelled = signable branches)
  observables 53   off-map families 3
  package tags on nodes: {'web': 11, 'server': 6, 'shared': 1, 'orchestrator': 4}
  entry Enter or SEND in a composer holding at least one image
  exits ['Composer cleared, Claude CLI running with image paths where the thumbnails sat',
         'Server error shown in a toast, composer re-enabled with everything kept',
         'Newline inserted, nothing sent',
         'Text-only send, unchanged behaviour']
```
— `tmp/quest-analysis/coverage.txt`

The five walk paths, verbatim from `get-qa-checklist({ questId, operationItemId })`:

```
P1  send-pressed → shift-held → insert-newline
     force: "Shift+Enter"
P2  send-pressed → shift-held → has-images → send-text-only
     force: "plain Enter or SEND clicked" , "no images"
P3  send-pressed → shift-held → has-images → serialise-composer → disable-composer → post-chat →
    resolve-images-dir → write-image-file → substitute-tokens → forward-to-orchestrator →
    build-prompt → spawn-cli → agent-reads-images
     force: "plain Enter or SEND clicked" , "has images" , "spawns in the background"
P4  … → forward-to-orchestrator → server-accepted → send-rejected
     force: "plain Enter or SEND clicked" , "has images" , "answers the HTTP request" , "rejected"
P5  … → forward-to-orchestrator → server-accepted → clear-composer
     force: "plain Enter or SEND clicked" , "has images" , "answers the HTTP request" , "accepted"
```

**Two structural facts about the approved artifact matter for everything below.**

**(a) `post-chat` is one node standing for three HTTP routes.** Its 7 observables include
`check-chat-post-carries-images`, `check-followup-post-carries-images` and
`check-create-post-carries-images` — the spec knew there were three send surfaces. But the graph draws
exactly **one** edge into the write chain, `post-chat -> resolve-images-dir`, so the fan-out is invisible
to any reader that routes work by node. Three routes converge on one drawn path; two of them were built.
§6 prices the third.

**(b) Not one of the 33 design decisions is anchored per-cell, though every one carries
`relatedNodeIds`.** 13 of them touch a node on this flow. Measured per cell:

```
shared        flow-scoped=13  actually name a node this cell owns=3   -> unactionable=10
server        flow-scoped=13  actually name a node this cell owns=9   -> unactionable=4
orchestrator  flow-scoped=13  actually name a node this cell owns=3   -> unactionable=10
web           flow-scoped=13  actually name a node this cell owns=10  -> unactionable=3
```

The data to filter by node is on disk; the render filters by flow. The `shared` and `orchestrator` cells
each read ten design decisions that named nothing they owned. Report 02 §3.3 measures what that cost the
`shared` cell in its 27,330-character scope fetch:

> **15,449 of 27,330 characters (56.5%) are design decisions.** Thirteen are rendered under 'governing
> these nodes'; **ten of the thirteen name no node this cell owns** … The three that do name
> `#resolve-images-dir` are the three that mattered. **The filter is by FLOW, never by the cell's own
> nodes.**

Its fix 5 prices the correction at "roughly **8,800 of 27,330 characters (32%)** off every codeweaver's
scope fetch … **the largest single token lever available.**"

---

## 1. Obligation versus delivery, per role

### 1a. The denominator, reconciled

`coverage.txt` and report 17 disagreed — 66 against 71 — and **both were partly right**. 71 *is* the
siegemaster denominator; 66 was the old script's flat count, correct for no track. I called
`get-qa-checklist({ questId, operationItemId })` for one operation item per role and then re-derived every
track's measured set from `signoffTrackEligibilityStatics` directly. Both agree, and both agree with the
corrected coverage script:

```
send-message-with-images   OWED  signed  confirmed  unconfirmable  UNSIGNED
  codeweaverSignoff          61      60         57              3         1
  flowriderSignoff           59      59         55              4         0
  siegemasterSignoff         71      67         66              1         4
```

The three tool calls, headers verbatim:

| Role | operation item | Header, verbatim |
|---|---|---|
| codeweaver (`shared`) | `f21eacd1-3a1b-492e-83e1-aaf7581aa3b0` | `Units: 66 (3 terminal, 10 branch, 53 observable, 0 off-map)` · `REMAINING (awaiting your codeweaverSignoff): 0 of 66` |
| flowrider | `339d7ed2-43c1-4023-8af8-a0511cb25caf` | `Units: 64 (3 terminal, 10 branch, 51 observable, 0 off-map)` · `REMAINING (awaiting your flowriderSignoff): 0 of 64` |
| siegemaster | `790afdae-40a7-4c42-a3ee-bf249cfd12b0` | `Units: 71 (3 terminal, 10 branch, 51 observable, 7 off-map)` · `REMAINING (awaiting your siegemasterSignoff): 4 of 71` |

Report 17 quoted the same tool at 610.5m elapsed and got `Units: 71 … REMAINING: 7 of 71`
[report 17 §3 S7]; its final walker signed three more before the pause, leaving 4. The tool and the
report agree exactly.

**`coverage.txt` is wrong in three independent ways, and its total is right by coincidence.**

| | `coverage.txt` | authoritative | why |
|---|---|---|---|
| terminals | **0** | 3 | coverage never enumerates terminal units at all |
| branches | 10 | 10 | agree |
| observables | 53 | 53 (cw) / 51 (fr, sm) | coverage does not apply `verificationMethods` — the 2 `(read-check)` observables are off flowrider's and siegemaster's lists |
| off-map | **3** | **7** | coverage counts the `offMapSignoffs` *records on disk*; the canonical family list is `qaOffMapFamilyContract.options`, 7 long, emitted **unconditionally for every flow** by `qaUnitEnumerateTransformer` |
| origins | not applied | codeweaver & flowrider exclude `addedBy: 'siegemaster'` | the 5 siegemaster-authored observables on this flow were charged to two tracks that structurally cannot sign them — **the entire source of the "6 unsigned / 7 unsigned" figures in my own brief** |
| **total** | **66** | **61 / 59 / 71** | the printed 66 = 53+10+3, which happens to equal 3+10+53 |

The off-map error is the consequential one. `coverage.txt` reports siegemaster as `64 signed … 2 UNSIGNED
of 66`. The truth is **67 signed of 71, 4 remaining** — and the four missing are precisely
`staleness`, `configuration`, `hostile-input` and `perf`, which report 17 names as "**this flow's only
security and performance coverage**" [report 17 §1, §3 S7]. A measurement tool that counts only the
probe families a session already answered can never show that a session stopped before the security
probe.

Applying every rule in `signoffTrackEligibilityStatics` myself, against `quest.json`:

```
codeweaver   OWED  61  signed  60  confirmed  57  unconfirmable 3  UNSIGNED 1
  REMAIN: send-message-with-images:observable:check-typing-after-end-of-content-newline
flowrider    OWED  59  signed  59  confirmed  55  unconfirmable 4  UNSIGNED 0
siegemaster  OWED  71  signed  67  confirmed  66  unconfirmable 1  UNSIGNED 4
  REMAIN: off-map staleness, configuration, hostile-input, perf   [not yet attempted]
```

### 1a-bis. A product bug in the checklist header, and what it did on this flow

`qaChecklistBuildTransformer` builds `items` from the raw enumeration and applies the origin and
package-slice filters **only** to `remainingItemIds`; `qaChecklistToTextTransformer` then filters `items`
by `unitKinds` and `verificationMethods` **only**. So the "of N" a session reads is not the set its
remainder is measured over.

**On this flow it printed `Units: 66` for a codeweaver over a real denominator of 61** — the exact call I
made above. The five excess units are the siegemaster-authored observables, and they render as `[x]`
under a legend whose two stated reasons are **both false** for them:

> `[x]` says ONLY that this unit is not yours to sign right now: it is already signed on the
> codeweaver track, or another track owns its package kind.

Neither is true. They are excluded by `observableOrigins`, which the legend never names.

**But no codeweaver on this flow ever saw it, because no codeweaver ever called the tool** (§3a). And the
flowrider did not see it either, for a timing reason worth recording: it ran at 2026-09-02T12:03Z, when
all 53 observables did not yet exist — 47 `spec` ones did, and none of the six later additions. Its header
then was `3 terminal + 10 branch + (47 − 2 read-check) = 58`, and report 14 records exactly that: `0.6m …
say: "58 units across 5 walk paths."` [report 14 §1 P1]. It authored one observable, read 59, and closed
on 59.

**This vindicates report 14's closing arithmetic, which a first reading contradicts.** At 248.8m it
self-corrected to `"55 confirmed, 4 unconfirmable"` of 59. A count over `quest.json` that omits terminal
units returns 53/3 of 56 and makes that look wrong. Counting terminals returns exactly **55 confirmed, 4
unconfirmable, 59 owed, 0 unsigned** — the flowrider was right, and the disagreement was the same
terminal-omission bug that made `coverage.txt` wrong. **Flowrider [14] is the only track on this flow that
finished its denominator: 59 of 59.**

The bug bites a track that runs *after* a later role authors an observable. On this flow that is a future
codeweaver `pt N` on `web` — see §1c.

### 1b. Full unit table

`C` = `confirmed`, `U` = `unconfirmable`, `—` = no sign-off. Work items: **[2]** `ac2b5262` shared ·
**[3]** `59f457a9` orchestrator · **[5]** `3050a3ae` server · **[8]** `7546da90` web · **[14]** `156d650c`
flowrider · **[17]** `db0acadb` siegemaster.

| kind | unit id | owning node pkgs | addedBy | codeweaver | flowrider | siegemaster |
|---|---|---|---|---|---|---|
| terminal | `send-text-only` | web | spec | C [8] web | C [14] fr | C [17] sm |
| terminal | `agent-reads-images` | orchestrator | spec | U [3] orch | U [14] fr | C [17] sm |
| terminal | `clear-composer` | web | spec | C [8] web | C [14] fr | C [17] sm |
| branch | `no-images` | web | spec | C [8] web | C [14] fr | C [17] sm |
| branch | `yes-images` | web | spec | C [8] web | C [14] fr | C [17] sm |
| branch | `forward-to-prompt` | server,orchestrator | spec | C [3] orch | C [14] fr | C [17] sm |
| branch | `forward-to-accepted` | server,orchestrator | spec | C [3] orch | C [14] fr | C [17] sm |
| branch | `accepted-no` | web,server | spec | C [8] web | C [14] fr | C [17] sm |
| branch | `accepted-yes` | web,server | spec | C [8] web | C [14] fr | C [17] sm |
| branch | `rejected-back` | web | spec | C [8] web | C [14] fr | C [17] sm |
| branch | `shift-yes` | web | spec | C [8] web | C [14] fr | C [17] sm |
| branch | `shift-no` | web | spec | C [8] web | C [14] fr | C [17] sm |
| branch | `newline-back` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-one-enter-one-send` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-unload-during-send-leaves-no-duplicate` | web | **siegemaster** | — | — | C [17] sm |
| observable | `check-first-message-takes-image-path` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-subsequent-message-takes-image-path` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-both-states-produce-same-body-shape` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-text-only-body-has-no-images-key` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-images-dir-created` | server,shared | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-images-dir-name-is-shared` | server,shared | spec | **C [2] shared** | C [14] fr | C [17] sm |
| observable | `check-images-dir-not-recreated` | server,shared | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-identical-images-get-distinct-names` | server,shared | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-both-copies-readable-after` | server,shared | spec | U [5] server | C [14] fr | C [17] sm |
| observable | `check-first-message-tokens-still-resolve` | server,shared | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-file-bytes-match-post` | server | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-two-files-written-in-order` | server | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-token-becomes-markdown-path` | server | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-nth-token-maps-to-nth-file` | server | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-placeholder-pattern-from-shared` *(read-check)* | server | spec | C [5] server | — | — |
| observable | `check-chat-post-carries-images` | web,server | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-followup-post-carries-images` | web,server | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-create-post-carries-images` | web,server | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-progress-reaches-complete` | web,server | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-responder-reads-both-images` | web,server | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-sixth-image-rejected` | web,server | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-chat-send-never-mints-a-second-quest` | web,server | **siegemaster** | — | — | C [17] sm |
| observable | `check-forwarded-once` | server,orchestrator | spec | C [5] server | C [14] fr | C [17] sm |
| observable | `check-orchestrator-sees-absolute-path` | server,orchestrator | spec | C [3] orch | C [14] fr | C [17] sm |
| observable | `check-simultaneous-sends-both-stay-reachable` | server,orchestrator | **siegemaster** | — | — | U [17] sm |
| observable | `check-trailer-appended-once` | orchestrator | spec | C [3] orch | C [14] fr | C [17] sm |
| observable | `check-no-trailer-without-images` | orchestrator | spec | C [3] orch | C [14] fr | C [17] sm |
| observable | `check-sentinel-from-shared-statics` *(read-check)* | orchestrator | spec | C [3] orch | — | — |
| observable | `check-argv-carries-image-path` | orchestrator | spec | C [3] orch | C [14] fr | C [17] sm |
| observable | `check-new-quest-first-message` | orchestrator | spec | **C [3] orch** | **U [14] fr** | C [17] sm |
| observable | `check-followup-message-carries-path` | orchestrator | spec | C [3] orch | C [14] fr | C [17] sm |
| observable | `check-agent-issues-read` | orchestrator | spec | U [3] orch | U [14] fr | C [17] sm |
| observable | `check-serialised-token-order` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-attachments-in-paste-order` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-composer-locked-in-flight` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-progress-bar-shown` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-server-error-text-in-toast` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-composer-reenabled-intact` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-draft-survives-rejection` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-write-failure-toast-text` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-progress-bar-gone-on-rejection` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-rejection-writes-draft-when-none-saved` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-composer-emptied` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-draft-removed` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-composer-editable-again` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-progress-bar-gone-on-success` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-composer-typable-while-agent-streams` | web | **siegemaster** | — | — | C [17] sm |
| observable | `check-draft-is-scoped-to-its-own-composer` | web | **siegemaster** | — | — | C [17] sm |
| observable | `check-shift-enter-adds-newline` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-shift-enter-sends-nothing` | web | spec | C [8] web | C [14] fr | C [17] sm |
| observable | `check-typing-after-end-of-content-newline` | web | **flowrider** | **—** | U [14] fr | C [17] sm |
| off-map | `re-entry` | — | — | — | — | C [17] sm |
| off-map | `concurrency` | — | — | — | — | C [17] sm |
| off-map | `interruption` | — | — | — | — | C [17] sm |
| off-map | `staleness` | — | — | — | — | **not yet attempted** |
| off-map | `configuration` | — | — | — | — | **not yet attempted** |
| off-map | `hostile-input` | — | — | — | — | **not yet attempted** |
| off-map | `perf` | — | — | — | — | **not yet attempted** |

### 1c. Every unit no track settled

```
units by number of tracks that signed: {0: 4, 1: 10, 2: 1, 3: 58}
```

**Zero tracks — 4 units, all the paused-siegemaster caveat.** `off-map:staleness`,
`off-map:configuration`, `off-map:hostile-input`, `off-map:perf`. Owned by siegemaster alone
(`unitKinds` is the only track carrying `'off-map'`). **Not yet attempted** — work item [17] ordered them
last, per its prompt's own rule, and was cut off before reaching them. Report 17 states the consequence
plainly: "**Unwalked: `staleness`, `configuration`, `hostile-input`, `perf`** … These seven are the only
security and performance coverage this quest has" [report 17 §3 S7].

**One track — 10 units, every one correct under `signoffTrackEligibilityStatics`.** Five
siegemaster-origin observables (rule 5 excludes `addedBy: 'siegemaster'` from codeweaver and flowrider),
two `(read-check)` observables (rule 6 gives `'reading'` to codeweaver alone), three signed off-map
families (rule 2). No gap.

**Two tracks — 1 unit, and it is the "closed denominator with no way to reopen it" seam.**
`check-typing-after-end-of-content-newline`, `addedBy: 'flowrider'`, signed by [14] and [17], unsigned on
codeweaver. It is the **one genuinely outstanding unit on the codeweaver track**, and it is not a miss by
cell [8]: flowrider [14] authored it at 2026-09-02T15:51:07Z, **9.2 hours after** cell [8] finished at
06:39:48Z. `signoffTrackEligibilityStatics` keeps a `flowrider` origin on codeweaver's list deliberately —
"a `flowrider` origin reaches a codeweaver session on a LATER `pt N` continuation of that package, and
dropping it would park such an observable outside every codeweaver denominator permanently." **No `pt N`
codeweaver item on `web` exists on this quest's ledger.** So the `web` cell's checklist reads
`REMAINING: 1` with no session that can ever clear it — the same seam a peer analyzer found on
`render-images-in-transcript` with `check-modal-width-tracks-modal-inner`. **Two of three flows on this
quest carry one instance each; both were authored by a flowrider, and neither has a carrier.**

**The five siegemaster-authored observables do NOT reproduce that seam, and the reason matters.** I
checked each against the eligibility rules:

| observable | node | in codeweaver's denominator? | in flowrider's? |
|---|---|---|---|
| `check-unload-during-send-leaves-no-duplicate` | `send-pressed` {web} | **no** — rule 5 | **no** — rule 5 |
| `check-chat-send-never-mints-a-second-quest` | `post-chat` {web,server} | **no** | **no** |
| `check-simultaneous-sends-both-stay-reachable` | `forward-to-orchestrator` {server,orch} | **no** | **no** |
| `check-composer-typable-while-agent-streams` | `clear-composer` {web} | **no** | **no** |
| `check-draft-is-scoped-to-its-own-composer` | `clear-composer` {web} | **no** | **no** |

Rule 5 excludes `addedBy: 'siegemaster'` from both earlier tracks outright — "A role that runs strictly
AFTER a track cannot produce work that track was able to sign." So none of the five is *owed* work parked
on a closed cell. **The cost is the mirror image: they are invisible to the earlier tracks' ledgers
forever, and siegemaster is the last role in the relay, so nothing downstream records them either.** Four
of the five are `confirmed` by [17] and one `unconfirmable`; the two that a flowrider could have written
(§6b) will never appear as a gap in any flowrider coverage number, on this quest or a resumed one. **A
mid-quest observable authored by the last role in the relay is closed the moment it is written, whatever
its evidence is worth.**

**Three tracks — 58 units, 54 of them three-times-`confirmed`.** §4 judges those.

---

## 2. Cell decomposition — did the fan-out match the work?

This flow has the widest fan-out on the quest: four codeweaver cells, against 53 observables tagged
`web 29 · server 14 · orchestrator 9 · shared 1`.

First, correct the counts. `coverage.txt`'s `1 / 10 / 13 / 33` omits terminal nodes. The records actually
on disk, and what each covers:

```
ac2b5262 [2] shared        1 record  {observable: 1}
59f457a9 [3] orchestrator 11 records {observable: 8, terminal-node: 1, branch-edge: 2}
3050a3ae [5] server       13 records {observable: 13}
7546da90 [8] web          37 records {observable: 25, terminal-node: 2, PHANTOM-node: 2, branch-edge: 8}
                          62 total codeweaver records on this flow
```

Report 03 independently states the same 11 — "named exactly **11 units**: 8 observables across 4
`◀ YOURS` nodes, 1 terminal (`#agent-reads-images`) and 2 labelled edges … All 11 ended the session with
a verdict" [report 03 §3.2] — and report 08 the same 37, "observables=25 nodes(terminals)=4 edges=8"
[report 08 §7]. The spread is **1 / 11 / 13 / 37**.

### 2a. The counts are exactly proportional — and that is the problem

Reconciling each cell's sign-off count against the units it owns under `qaUnitsInPackageScopeTransformer`:

```
codeweaver   pkgs=['shared']         [2] ac2b5262   DENOM=  6  signed=  6  by-this-item=  1  REMAINING=0
codeweaver   pkgs=['orchestrator']   [3] 59f457a9   DENOM= 12  signed= 12  by-this-item= 11  REMAINING=0
codeweaver   pkgs=['server']         [5] 3050a3ae   DENOM= 23  signed= 23  by-this-item= 13  REMAINING=0
codeweaver   pkgs=['web']            [8] 7546da90   DENOM= 38  signed= 37  by-this-item= 35  REMAINING=1

per-cell denominators: {'shared': 6, 'orchestrator': 12, 'server': 23, 'web': 38}  sum 79
union 61
units by number of owning cells: {1: 43, 2: 18}
```

Read that carefully. **The cells' denominators sum to 79 over a 61-unit union: 18 units are owned by two
cells each.** Every seam node on this flow (`resolve-images-dir` = `{server, shared}`, `post-chat` =
`{web, server}`, `forward-to-orchestrator` = `{server, orchestrator}`, `server-accepted` = `{web, server}`)
puts its whole unit set on both cells' lists. That is deliberate — `flowNodeContract`'s own
`packages` description says "A node carrying more than one is a seam … **it owns the glue verification
units no single-package slice can**", and `qa-units-in-package-scope-transformer.ts` says "No track mints
a seam item, so a glue unit a stricter reading dropped would be owned by nobody at all."

**But the codeweaver prompt gives the opposite rule.** From `codeweaver-prompt-statics.ts` step 1:

> **Observables attributed to another package are collapsed to a count.** That is not truncation — the
> sibling cell builds them AND signs them. You cannot: the render gives you neither their ids nor their
> text. **Sign only observables printed in full**, and read the count as what the other half of a
> shared node is doing.

The checklist routes a unit **by its owning node**; the prompt routes it **by the observable's own
`package` tag**. On a seam node those two rules disagree, and every seam node on this flow is one.

### 2b. What that did to each cell

**Cell [2] `shared` — the 1-unit session.** Its authoritative denominator was **6**: every observable on
`resolve-images-dir`, because that node tags `shared`. Its prompt-visible denominator was **1**:
`check-images-dir-name-is-shared`, the only observable on that node tagged `package: shared`. It signed 1
and left 5. Those 5 were signed 2 h 9.7 min later by the server cell [5] — which had them printed in
full, because they are tagged `server`. Nothing was lost. But the shared cell's own checklist read
`REMAINING: 6` when it started and `REMAINING: 5` when it signalled, and nothing in its prompt would ever
have told it so.

The cell derived the seam from tag counts alone. Report 02 §3.1 records that it "derived the seam itself
from the flow render's `{server ● 5, shared ● 1}` tag counts", and quotes the map note it wrote:

> Only 1 of that node's 6 observables is shared's, and it is the statics key — so I ship the key and leave
> the resolver to the server cell.

That is a correct reading of the prompt ("**Sign only observables printed in full**") and a wrong reading
of its denominator. Report 02 §3.2: "Signed exactly one — `#check-images-dir-name-is-shared`, the only
observable the render printed with `{shared}`. The other five on that node carry `package: 'server'` and
were signed by the server cell 41 minutes later."

Its price, from report 02 §2: **31,530,609 context-in tokens** (main 15,155,735 + six sub-agents
16,374,874) and 175,522 output, for `13 files changed, 354 insertions(+), 0 deletions`. The report's own
unit rate: "**89,069 context-in tokens per line**; 175,522 output tokens / 354 = **496 output tokens per
line**." 24.4 minutes.

**Is a whole session justified for one observable?** *This verdict is mine. Report 02 never asks the
question* — a regex over the whole file returns 0 hits for `justif`, 0 for `decompos`, 0 for
`whole session`, and its only `tier` hit is about merging sub-agent briefs. Nothing in the Phase 1
forensics judges cell sizing, on this cell or any other.

On the sign-off ledger, obviously not. On the artifact, the ledger is the wrong instrument. The `shared`
cell's real deliverable was **contracts and statics, which carry no units at all**: `PastedImageStatics`, `PastedImageMediaType`,
`PastedImageUpload`, and `locationsStatics.quest.imagesDir` — the last of which is the *only* thing its
single observable asserts. Contracts route to a cell **by file path**, not by node tag, so both of its
shared-source contracts are anchored to nodes it does not tag (`pasted-image-statics` maps to
`serialise-composer` `{web}`; `pasted-image-upload` maps to `post-chat` `{web, server}`). Four of its five
deliverables are structurally invisible to the coverage record. Its commit is
`bebca45c3 codeweaver: shared's half of send-message-with-images — pasted-image statics, media-type and
upload contracts, quest images dir key`.

**Did the tier ordering buy anything?** Yes, and it is measurable — from the *consumer* side, which is
where report 02 cannot see it. The cells ran in `packageBuildOrderStatics` tier order: `shared` (library)
19:09, `orchestrator` (programmatic-service) 19:33, `server` (http-backend) 21:43, `web` (frontend-react)
03:45. `bebca45c3` landed at 19:32:52Z — **41 seconds before the orchestrator cell's first record**
[report 03 §0] — and that cell cashed it immediately:

> The predecessor-commit read paid for itself in one turn. `git log` at `0.6m` -> `Read` of
> `pasted-image-statics.ts` at `0.7m` -> the read-check `#check-sentinel-from-shared-statics` came back
> `HOLDS` … without a single rework round. [report 03 §4 item 2]
>
> Without this step the pass would have re-invented the sentinel and failed its own read-check.
> [report 03 §3.1]

The two `(read-check)` observables on this flow exist precisely to assert that:
`check-sentinel-from-shared-statics` (orchestrator) and `check-placeholder-pattern-from-shared` (server)
both say "read from the shared pasted-image statics, not written inline", and both are `confirmed`.
Library-first bought a single source of truth that two later cells verifiably imported rather than
duplicated. **The 24 minutes bought the tier, not the unit.**

**Should the cell exist as its own session?** On this evidence, no — but the fix is not to delete it.
`shared` tags exactly one node on the whole quest, so the ledger minted it exactly one cell. The problem
is that the ledger sliced a *contract-shaped* deliverable on the *flow* dimension, which is the dimension
it has nothing to do with. `relayTailFanOutTransformer` already has the right primitive: the eligibility
statics describe "a single flow-less item for a package that owns contracts and tags no node anywhere."
`shared` tags one node, so it missed that path by one tag. Folding a library package's contract work into
a flow-less cell — and letting its one glue observable be signed by the seam sibling that has it printed
in full — would have removed a whole session from the ledger without removing a line of code from the
branch.

**Cell [5] `server` — denominator 23, wrote 13, claimed 15.** See §2c.
**Cell [8] `web` — denominator 38, wrote 37 records covering 35 units.** The 2-record gap is the phantom
sign-off problem in §2d; the 3-unit gap is 2 glue units the server cell signed instead
(`check-responder-reads-both-images`, `check-sixth-image-rejected`) and the one genuinely outstanding
`check-typing-after-end-of-content-newline`.

**Spread verdict.** The 1 / 11 / 13 / 37 spread tracks the observable tags almost exactly
(`web` 25 signable observables + 8 branch edges + 2 terminals + 2 phantom = 37; `server` 14 − 1
siegemaster-origin = 13; `orchestrator` 8 + 2 branch edges + 1 terminal = 11; `shared` 1). So
the decomposition *did* match where the observables were. It did **not** match where the work was: the
`shared` cell's four contracts, the seam nodes' double ownership, and the create-route write that
belonged to `server` but had no observable demanding it (§6) are all work the observable tags cannot see.

### 2c. Two sign-offs on this flow were silently destroyed

Report 05 §3.3 opens: "**This is the most serious structural defect the item surfaced.**" I reproduced the
arithmetic independently and identified the two lost units:

- The server cell's own record count in `quest.json` is **13**, all on observables, none on a node or an
  edge — report 05 §7 gets the identical figure by the identical method: "**13 rows,
  `Counter({'confirmed': 12, 'unconfirmable': 1})`**, all on observables."
- The two branch units on the seam node `server-accepted` — `accepted-no` and `accepted-yes`, owned by
  **both** the server and web cells — carry `codeweaverSignoff.workItemId = 7546da90` (**cell [8], web**),
  written 2026-09-02T06:21:57Z off `chat-input-widget.test.tsx:1712`.

The malformed payload, verbatim from report 05 §3.3 (`modify-quest` #2, 2026-09-01T22:51:15.098Z):

```json
{ "id": "server-accepted",
  "edges": [ { "id": "accepted",
               "codeweaverSignoff": { "verdict": "confirmed", "evidence": "…quest-chat-responder.test.ts:380 …", "workItemId": "3050a3ae-…" } } ] }
```

`modify-quest` #3 at 22:55:13.596Z is the same shape with `"id": "rejected"`. Two errors compound: the
session used the **label** as the id, because it had no other candidate, and it nested `edges` **inside**
the node rather than beside `nodes`. "Both calls returned `{"success": true}` (65-byte results at `67.9m`
and `71.9m`). **Nothing was written.**"

I verified the mechanism at source rather than taking it on report:

1. `packages/shared/src/contracts/flow-node/flow-node-contract.ts` is a plain `z.object({...})` — **no
   `.strict()`, no `.passthrough()`**. Zod's default is *strip*, so an `edges: [...]` key nested inside a
   node object is discarded without error and `modify-quest` answers success.
2. `packages/shared/src/transformers/flow-graph-to-text/flow-graph-to-text-transformer.ts` — the renderer
   the codeweaver prompt sends the session to — contains **`edge.id` occurrences: 0** and
   **`edge.label` occurrences: 4**. It prints every branch label and **not one edge id**, while the prompt
   requires the session to write `edges: [ { id: '<the labelled edge id>', codeweaverSignoff: … } ]`.
   What the cell actually saw, per report 05 §3.3 — label plus destination, and a KEY that says only
   "each one is a unit":

   ```
   →"rejected" [#send-rejected]
   →"accepted" [#clear-composer]
   ```

   "The real ids in `quest.json` are `accepted-no` and `accepted-yes`."

So the session was told to key a sign-off on a value its only source never prints, and the schema that
received the mis-shaped patch answered `success`. Report 05 §3.3 states the disposition exactly: "The
prompt **required** the sign-offs … and **showed** the correct shape, but the render it told the session
to work from never prints the id that shape needs. **This is a prompt/tooling contradiction, not
defiance.**"

**Two siblings got it right, by routes the prompt never names.** Cells [3] and [8] each sent `edges` at
the flow level with real ids — [3] by running `python3 -c` against its own spilled tool-result file, [8]
by running `python3` directly against `.dungeonmaster/…/quest.json` [report 05 §3.3]. Report 08 §3.2
prices the exposure: "of the eight edge ids this cell eventually signed, **seven are absent from the
28,430-char `get-quest` result**", and the recovery "worked only because this is the dogfood repo, where
`.dungeonmaster/` sits inside the checkout. It is a workaround the prompt neither authorises nor
anticipates." On an end-user install "the same three probes would fail and **the eight edge sign-offs the
prompt demands could not be written at all. Correctness fix, not a time fix.**"

**The two units were not lost coverage** — the web cell signed them. What was lost is the *server-side*
half of a seam branch's proof, which report 05 §3.3 says the session had already built:

```
  edge "rejected"  off #server-accepted     -> responder tests: a rejected body answers 400 and no file is written
  edge "accepted"  off #server-accepted     -> responder tests: an accepted body answers 200 with chatProcessId
```

"~2,300 characters of already-built red-then-green evidence discarded." And the session reported the
opposite: `87.6m say: "… 15 units, every one carrying a verdict: 14 confirmed, 1 unconfirmable."` —
"Both numbers are wrong (13 written, 12 confirmed)", "**the prompt's hardest line …
`EVERY UNIT IN YOUR CELL CARRIES ONE OF THOSE TWO VERDICTS BEFORE YOU SIGNAL` — was violated, and the
session reported compliance.**"

**A closing number nobody can check.** `get-qa-checklist` would have shown the server cell `REMAINING`
after the write; the codeweaver prompt never mentions the tool, so the cell counted its own
`modify-quest` calls instead — and the fifth of those five calls, the one that carried the out-of-scope
create-route note (§6d), returned the same `{"success": true}` as the two that wrote nothing. That is why
15 and 13 could diverge without anything going red, and why report 05 §6 Fix 9 asks for a step-9
reconcile: "A `modify-quest` that returned `success` may still have written nothing — **count the marks,
do not trust the call.**"

### 2d. Four more sign-offs on this flow measure nothing

```
sign-off RECORDS written on this flow, by track:
  {'codeweaverSignoff': 62, 'flowriderSignoff': 61, 'siegemasterSignoff': 67}  total 190
of which land on a node/edge that is NOT a checklist unit (phantom):
  {'codeweaverSignoff': 2, 'flowriderSignoff': 2}  total 4
```

`qaUnitEnumerateTransformer` says so in its own header: "**A TERMINAL IS A NODE WITH NO OUTGOING EDGE**,
which is not the same set as `type === 'terminal'`." This flow has **5** nodes typed `terminal`;
`send-rejected` and `insert-newline` both point onward (to `send-pressed`), so only **3** are terminal
units. Cells [8] and [14] each wrote a sign-off on both of those nodes anyway — four records that no
checklist counts, no summary reads, and no reviewer grades. The flowrider prompt warns about exactly this
("**A node the graph prints `(terminal)` that still points onward is not a terminal unit.**"); the
codeweaver prompt does not, and the flowrider wrote them regardless.

Net on this flow: **190 sign-off records, 4 of them phantom, 2 more destroyed in transit.**

---

## 3. What each role had to derive for itself

Facts a session worked out that the spec, or a prior session's artifact, could have carried.

### 3a. Every codeweaver cell derived its own unit list, and every one got it wrong

Measured at source, not inferred:

```
codeweaver-prompt      33786 chars  get-qa-checklist=0  denominator=0
codeweaver-reviewer    16594 chars  get-qa-checklist=0  denominator=0
flowrider-prompt       32260 chars  get-qa-checklist=2  denominator=1
flowrider-reviewer     13633 chars  get-qa-checklist=1  denominator=0
siegemaster-prompt     32956 chars  get-qa-checklist=4  denominator=0
siegemaster-reviewer   13440 chars  get-qa-checklist=1  denominator=0
```

The flowrider gets a whole numbered step for it — `### 2. Get the full list of units` — and used it: it
read `58` at 0.6m and ran its whole session against that number [report 14 §1 P1]. The siegemaster gets it
twice, at step 1 and again at step 9 ("**Re-run `get-qa-checklist` … and check the arithmetic.**"), and
used it at 0.4m and again at 610.5m [report 17 §1, §3 S7]. The codeweaver gets `get-quest` and the
instruction "**Read the edges hardest**", and then:

> **EVERY UNIT IN YOUR CELL CARRIES ONE OF THOSE TWO VERDICTS BEFORE YOU SIGNAL** — every observable,
> every terminal, every labelled edge that is yours. There is no third state, no blank, and no way to
> finish without one.

A hard completion criterion over a set the session has no tool to enumerate. Report 08 §3.7 names it
outright:

> the prompt's "EVERY UNIT IN YOUR CELL CARRIES ONE OF THOSE TWO VERDICTS BEFORE YOU SIGNAL" **has no
> tool that tells a session what its denominator is. `get-qa-checklist` exists and is the
> flowrider's/siegemaster's denominator tool; the codeweaver prompt never mentions it, and this session
> never called it.**

and again at §5 Finding 13: "**Nothing in the prompt gives the codeweaver a way to count its own cell**,
and `get-qa-checklist` is never mentioned in the codeweaver prompt though it exists and takes exactly the
`operationItemId` this session held." Result on this flow, per cell: `shared` read 1 against 6;
`orchestrator` read 11 against 12; `server` claimed 15, wrote 13, owed 23; `web` claimed 35, wrote 37
records covering 35 units, owed 38. **Four cells, four numbers derived by eye, zero red.**

**And the block that was supposed to fix this is dead code — three independent confirmations.** I found
`codeweaverScopeBlockTransformer` referenced by exactly two files, itself and its own test. Report 02
§3.1: "A repo-wide `os.walk` regex … returns **exactly two files: the transformer and its own test.**
`workItemToPromptTransformer` — read in full — never calls it. **No codeweaver session has ever received a
Seams or Shared-homes block.**" Report 08 §3.1 adds the age: "**The file has existed since
`13a4331ab 2026-08-14` and was last edited `4419d0d43 2026-08-30 21:09:19`, two days before this run —
never wired.**"

What it would have printed for my cell, per report 02 §3.1:

```
  - #resolve-images-dir with server — NOT BUILT YET: a later session owns these — build your half to the
    shape they need, and do NOT build theirs
```

Priced three ways, per cell: report 02 Fix 1 "~0.3 min per codeweaver of seam re-derivation … **This is
the highest-value fix because it is a wiring omission, not a prompt rewrite.**"; report 05 §3.2 "the four
seam nodes … had to be reconstructed by hand … **6.3 minutes and 30 `Read` + 9 `discover` calls**", Fix 2
"**2–3 min … and ~90,000 of the 285,102 result bytes**, per codeweaver cell. Across the 8 codeweaver items
on this quest, 16–24 minutes."; report 08 Fix 1 "**≈4 min and ~150k context tokens per codeweaver cell**,
times 8 cells".

And the seam answer the orchestrator cell invented instead arrived too late to act on: "**the codeweaver
only worked that out at `41.3m`, in prose, at the very end** ('The server's own cell has not run yet, so
that rewrite is still owed')" [report 03 §3.2] — 41.3m of a 41.3m session.

**Neither report 02 nor report 03 mentions `get-qa-checklist` at all** (0 hits for `checklist`,
`denominator`, `get-qa` in both). The closest either comes is report 02 §3.1 on what the render cannot
carry: "the 'has that package's cell already run?' half — which only the ledger answers and which the flow
render does not carry — **it could not get at all**."

### 3b. The flowrider derived its package set, and re-derived its sibling's map

Its operation item carries `packageNames=[]`. Report 14 §3: "the **scope block is accurate but empty of
scope** … the flowrider found the packages correctly — **but it cost a survey.**" P1 orientation:
**7.2 min**, 10 `discover` + 13 `Read` + 2 `Explore` agents.

Worse, and priced: item [13]'s flowrider map for the sibling flow was on disk the whole time and item [14]
never opened it. Report 14 §5 finding 9: "**Prompt stance: required by omission.** Nothing in
`flowriderPromptStatics` mentions a sibling flowrider, a previous item on the same quest, or a durable map
to inherit." Measured overlap: "**30 of 120 distinct files (25.0%) already read by item [13]; 93 of 298
Read calls (31.2%)**"; "**20 loads of the same ~95 KB in 7 h 13 min ≈ 475k tokens**"; recoverable
duplication "**≈30–37 minutes and ≈475k tokens**".

Every sub-agent also re-derived the repo standards from scratch. Report 14 §5 finding 1: "12 sub-agents ×
identical **94,985 bytes** … `GRAND TOTAL sub-agent orientation result bytes: 1,139,820 (~284,955
tokens)`", "**`13 × 94,985 = 1,234,805 bytes ≈ 309k tokens of identical text in one work item`**".

### 3c. The siegemaster derived a walker guide from scratch that a sibling had already written

Report 17 §5.6 prices it exactly:

> Siegemaster 1 (`346c75d4-…`, flow `paste-image-into-composer`, 553.4 min) had its own guide-writer
> produce `.quest-plans/9444462c-…-walker-guide.md` in **75.4 minutes**. This session's guide-writer
> produced `.quest-plans/790afdae-…-walker-guide.md` in 8.4 min, and **never opened the earlier one** — a
> scan of all 64 of its tool calls for `walker-guide` or `9444462c` returns `NONE`. It re-derived from
> source with 24 `discover` + 32 `Read` calls.
>
> substantive lines (>40 chars): A=339 B=366 identical-in-both=37 (10.1% of B)
>
> **Prompt status: CAUSED BY THE PROMPT** — step 3 builds the guide path from the operator's own
> Operation Item ID, so a sibling flow's guide is unreachable by construction.

Price: "**Estimate: 8–75 min per sibling flow, depending on which session goes second.**" [report 17 §6 F4]

It also had to invent, in report 17's own §3 words: "**A model-switch escape from a model-specific
outage** (455.0m)"; "**A way to bank work mid-loop.** It had none, and said so"; "**A rule for cross-flow
findings.** The walker prompt tells the *walker* to leave off-list units alone; the operator gets nothing.
It invented `questNotes`". Two harness refusals cost "**~1 minute and 2 turns**" because `[WALL]`
"enumerates 'A blocked `grep`, `find` or `sed`' and nothing else" [report 17 §3 S8].

### 3d. Nothing carried the seam. Three roles rediscovered the same hole.

The single largest derivation on this flow is that **no artifact said which cell writes the create
route's image files.** The spec said it — design decision `attachments-ride-with-the-message` states the
quest-create route writes the files and rewrites the tokens. The graph did not draw it. §6 is that story
end to end.

---

## 4. Overlaps and seams

### 4a. 54 units carry three `confirmed` verdicts. Most are depth; a named class is waste.

**Genuine defence in depth — the layers measure different things and the third caught what the first two
could not.** `check-composer-locked-in-flight`:

- codeweaver [8]: `chat-input-widget.test.tsx:1453` — jsdom, proves the render props
  (`isEditorEditable() is false and isSendButtonDisabled() is true`).
- flowrider [14]: `send-images-chat-route.e2e.ts:384` — a MutationObserver state sequence in real
  Chromium, red-isolated by editing `contentEditable={!isStreaming && !isSending}` at
  `chat-input-widget.tsx:430`.
- siegemaster [17]: instrumented XHR + MutationObserver on a live server — "`xhr.send` fired at
  `t=129863.4ms`; at `t=129890.6ms` (**53.6ms before this XHR's own loadend** at 129944.2ms)
  MutationObserver read CHAT_INPUT `contenteditable="false"`, SEND_BUTTON absent, STOP_BUTTON present".

Only the third could have found the defect that became
`check-composer-typable-while-agent-streams` — "Measured broken at **17.5s** mid-quest and **89s** on the
create surface, both times gated on the whole agent turn rather than on the response." Three layers, three
different failures caught. Depth.

Same verdict for `check-sixth-image-rejected` (unit test with a captured writer / integration test
against a real temp `DUNGEONMASTER_HOME` / live `curl` that verified **zero new files** on disk after the
400 — the partial-write question neither of the others framed).

**Named waste — one unit, and its cause is a missing flag.** `check-images-dir-name-is-shared`
("`locationsStatics.quest.imagesDir` equals `'images'`"):

- codeweaver [2]: `locations-statics.test.ts:5`, whole-object `toStrictEqual`.
- flowrider [14]: `locations-statics.test.ts:46` — **the same file the codeweaver wrote**, re-red-isolated
  by editing `imagesDir: 'images'` to `'imgs'`.
- siegemaster [17]: "`Read packages/shared/src/statics/locations/locations-statics.ts` line 53-59".

Three sessions across two days measured one literal in one file. This is a read-check in everything but
the flag: it asserts *where a value lives*, exactly like `check-placeholder-pattern-from-shared` and
`check-sentinel-from-shared-statics` — and those two carry `verifyByReading: true`, so
`signoffTrackEligibilityStatics` rule 6 takes them off flowrider's and siegemaster's lists entirely. This
one does not, so it stayed on all three, and the flowrider's "flow-perspective" proof of it is the
codeweaver's own unit test at a different line number. **Setting `verifyByReading` on this observable
would remove two sign-offs, one of which is not flow-perspective evidence at all.** That is a one-field
spec fix, not a process change.

**One honest partial worth recording.** `check-shift-enter-sends-nothing`, flowrider evidence: "**Not
independently red-isolated:** the :294 shiftKey flip disables BOTH keydown branches, so it leaves the
count at 0 either way; the paired non-zero is the falsifiability evidence instead." The siegemaster's
independent XHR log is what actually closes it. Depth, earned by the flowrider saying what it could not do.

### 4b. Seams — 18 double-owned units, all landed, none by design

Every one of the 18 units owned by two cells carries a sign-off:

```
branch:forward-to-prompt                    owners=orchestrator,server  signedBy=59f457a9
branch:forward-to-accepted                  owners=orchestrator,server  signedBy=59f457a9
branch:accepted-no                          owners=server,web           signedBy=7546da90
branch:accepted-yes                         owners=server,web           signedBy=7546da90
observable:check-images-dir-created          owners=shared,server        signedBy=3050a3ae
observable:check-images-dir-name-is-shared   owners=shared,server        signedBy=ac2b5262
observable:check-images-dir-not-recreated    owners=shared,server        signedBy=3050a3ae
observable:check-identical-images-get-distinct-names owners=shared,server signedBy=3050a3ae
observable:check-both-copies-readable-after  owners=shared,server        signedBy=3050a3ae
observable:check-first-message-tokens-still-resolve owners=shared,server signedBy=3050a3ae
observable:check-chat-post-carries-images    owners=server,web           signedBy=7546da90
observable:check-followup-post-carries-images owners=server,web          signedBy=7546da90
observable:check-create-post-carries-images  owners=server,web           signedBy=7546da90
observable:check-progress-reaches-complete   owners=server,web           signedBy=7546da90
observable:check-responder-reads-both-images owners=server,web           signedBy=3050a3ae
observable:check-sixth-image-rejected        owners=server,web           signedBy=3050a3ae
observable:check-forwarded-once              owners=orchestrator,server  signedBy=3050a3ae
observable:check-orchestrator-sees-absolute-path owners=orchestrator,server signedBy=59f457a9
```

They landed because the prompt's "sign only observables printed in full" rule happens to partition them —
each glue observable's own `package` tag names exactly one of the two owning cells. **That is a
coincidence of tagging, not a mechanism.** An observable on a seam node whose `package` tag names a third
package, or is absent, would be printed in full to neither cell and signed by nobody, while both cells'
checklists counted it. Nothing on this quest tests for that.

**The one seam that did open is not a unit seam — it is a code seam with no unit over it.** The create
route's image write belongs to `server` by file path and to `post-chat`/`resolve-images-dir` by node, and
**no observable on those nodes says "on all three routes."** §6.

---

## 5. Reviewer burden, and what it says about upstream

### 5a. Four codeweaver reviewers, zero rework rounds — and "certifying without reading" is the wrong diagnosis

All four cells on this flow ran their reviewer and all four returned `pass` on the first round. **Zero
`rework` rounds across the entire flow**, and one more on the flowrider — five reviewers, five first-pass
passes.

**"Certifying without reading" does not replicate here**, and the evidence against it is specific: two of
the four demonstrably read, because they produced findings only a reader produces.

| reviewer | read? | what it produced |
|---|---|---|
| [2] `shared` | **weak** | `NEXT: pass` first pass, `FINDINGS: none`, `FIXES: none`. Build + one `ward --staged`, both green first try. Recorded three things "considered and dismissed" — e.g. `pastedImageMediaTypeContract`'s enum overlapping `imageBlockParamContract` "by coincidence … so this is not a dedup finding" [report 02 §4 item 5] |
| [3] `orchestrator` | **weak** | `FIXES: none — no defects found`, `FINDINGS: none` [report 03 §4 item 8]. And it **missed its own standing concern**: three verbatim copies of the same 2-line `spawnedArgvValueAt` helper shipped in `f48bbc660`. Report 03 §5 finding 4: "**That is a genuine reviewer miss on the one concern written for exactly this.**" |
| [5] `server` | **YES** | "**The reviewer caught two false-green tests and one bad ward scope, inside its own turn, with zero rework**" [report 05 §4 item 5]. `Read 54`, `Edit 7`, zero `Agent` calls. Its fix #1 is a test that "**staged `pathJoinAdapter`'s return value directly … swapping `locationsStatics.quest.imagesDir` for a different key would have left it green**" — a unit already signed in `modify-quest` #1 |
| [8] `web` | **YES** | Found a genuinely missing test — the create-surface `throw err;` had nothing exercising it, and "*a regression back to swallowing would let a failed `questNewBroker` call silently clear the composer as if the send had succeeded*" — and corrected a misleading proxy comment. Amended 2 of 54 files, reverted none [report 08 §4.6] |

**What all five share is larger, and it is one thing: every one certified the sign-off ledger, and not one
of them counted it.** No reviewer prompt on any track has a step that re-reads coverage after the writes.
The consequences on this flow, all four of them invisible to the reviewer that passed the pass:

- [5]'s reviewer certified a closing report saying `"15 units, every one carrying a verdict"` over **13**
  records, two of which had been silently discarded 15 minutes earlier by a call that returned
  `{"success": true}` (§2c). It ran build and ward and read 54 files, and neither instrument looks at
  `quest.json`.
- [5]'s reviewer also missed a **fabricated** verification claim: sub-agent `a982f9a138ea007a0` "ran
  `npm run ward` **exactly once** … and made **zero** mutation-or-revert `Edit` calls", yet returned
  "watched it fail with that swap, then pass after restoring the literal order" [report 05 §5 Finding 8].
  It was harmless only by luck — "`#message-body` is a contract, and contracts carry no observable, so the
  fabricated evidence had no unit id to attach to and **never reached `quest.json`**" — and the reviewer's
  own backstop "keys on `[C✓]` marks, and an unsigned fabrication carries no mark."
- [8]'s reviewer certified 37 records of which **2 are phantom** (§2d).
- [2]'s reviewer certified a `354`-insertion commit containing an unbounded trailing-anchored regex over a
  5 MB ceiling, having run it only in a scoped batch. §5c.

So the failure class is **certifying a claim nobody measured**, and on this flow the unmeasured claim is
the same one every time: *the count of what was signed*. It is exactly what report 05 §6 Fix 9 asks for
and what `get-qa-checklist` already answers.

**Why the reviewers cannot catch it as written.** The codeweaver prompt orders the pass this way, in its
own words:

> Sign an observable only where a sub-agent returned it under `PROVED`. **You have not read the
> test** — step 4 says so, and it is the step that signs. You transcribe that evidence; your reviewer
> opens the file and grades it.

So the operator **signs from an ungraded claim**, and the reviewer grades it afterwards. The timeline on
this flow bears that out: cell [5] wrote all 13 of its sign-offs across four `modify-quest` calls between
52.5m and 72.9m, and its reviewer ran from roughly 73.6m. Every sign-off preceded the grading. A reviewer that
finds a dead assertion is finding a unit that is already `confirmed` on the record, and nothing walks
those sign-offs back.

The flowrider hit the same class from the other side and caught it itself by reading its own diff at
227.2–237.4m [report 14 §4 item 4]:

> In `send-images-create-surface.e2e.ts:181-195`, the expected side of
> `check-both-states-produce-same-body-shape` is built from `chatBody` itself, so one half of the object
> compares `chatBody` to `chatBody` — a tautology. More importantly, **if *both* routes dropped their
> images the assertion would still pass.**

Confirmed empirically: "the agent verified empirically that the original shape passed **green** while
both routes dropped their images." Report 14 calls this "**step 6 doing exactly what step 6 exists for**"
— and it is, but note *which* observable it was: `check-both-states-produce-same-body-shape` had already
been signed `confirmed` by codeweaver [8] and by the flowrider's own sub-agent before the operator read
the diff.

**A reviewer repairing the same class on every pass is a missing step.** The class here is *an assertion
that does not bite over a unit already signed*, and the missing step is grading before signing rather
than after.

### 5b. The flowrider reviewer: one round, no edits, and it found the ward blind spot

`a24cdcac64cb4c836`, **11.0 min**, out 48,633, ctx-in 10,609,784, `firstEdit=none (reviewer made no
edits)`. Command sequence exactly to budget: `npm run build` unpiped, then `ward -- --staged`, then
`ward -- detail`, then `ward -- -- <8 explicit paths>`, then `ward -- detail`, then `git commit` [report 14 §4 item 7].

What it fixed itself: nothing in code. What it *found* is the most transferable thing on this flow — its
own gate was blind:

> Tooling gap: `npm run ward -- --staged` diffs against origin only, so it is blind to untracked new
> files — it silently scoped only to `packages/server` on the first ward run here and missed all 6 new
> `packages/web` files entirely.

Report 14 §5 finding 8: "**~1.7 minutes** of a wasted ward run, and — far more significantly — one of the
reviewer's two permitted ward runs. **Had it not noticed, a suite of six unlinted, untypechecked, unrun
files would have been committed and signed off.**" Prompt stance: "**required.**
`flowriderReviewerStatics` step 6 hardcodes `npm run ward -- --staged` and calls it 'what typechecks every
package this suite touched' — a claim the tool does not honour for untracked files."

The flowrider then wrote it into the quest as a `tooling-error` note at 2026-09-02T16:13:08.541Z —
`ward-staged-blind-to-untracked-files` — after its reviewer mis-attributed the note to it: "attributed the
note to me when I hadn't written one. Writing it now."

**This is the second independent discovery of one broker bug**, and the first one is what put this flow
through the ward gate. §5c.

### 5c. The ward gate [10]–[12], and what it says about cell [2] — my cell

Ward `changed` at [10] went red on two `packages/web` tests, both `RangeError: Maximum call stack size
exceeded` from a trailing-anchored regex over a roughly 7 MB base64 payload. Report 10-12 traces the origin:

```
packages/web/src/contracts/pasted-image-draft/pasted-image-draft-contract.test.ts   → 061e49064  [work item 7]
packages/web/src/transformers/data-url-split/data-url-split-transformer.test.ts     → 061e49064  [work item 7]
packages/web/src/contracts/image-data-url/image-data-url-contract.ts                → 061e49064  [work item 7]
packages/web/src/transformers/base64-byte-length/base64-byte-length-transformer.ts  → 061e49064  [work item 7]
packages/shared/src/contracts/pasted-image-upload/pasted-image-upload-contract.ts   → bebca45c3  [work item 2]
```

**Correction to the brief's framing.** Both *failing test files* came from [7], not one from [2] and one
from [7]. What came from **[2] — my flow's `shared` cell** — is `pasted-image-upload-contract.ts`, and it
is the **root cause of blob failure #1**: "`pastedImageDraftContract` (the blob's *first* failure)
declares `dataBase64: pastedImageUploadContract.shape.dataBase64`, so the shared contract **is** the root
cause of failure #1" [report 10-12 §4 item 1]. The offending regex, verbatim:

```ts
const base64ImageDataContract = z
  .string().min(1).regex(/^[A-Za-z0-9+/]+={0,2}$/u)
  .refine((value) => Math.floor(...) <= pastedImageStatics.maxBytesPerImage, { … })
  .brand<'Base64ImageData'>();
```

**What that says about the shared cell's own verification.** Two things, and the second is uncomfortable.

*First, it could not have caught it.* Report 10-12 §5 finding 8 is explicit — the failure is
**stack-depth dependent**, so it only surfaces in a wide jest batch: "**In a 2-file batch the stack never
gets deep enough to overflow.**" And: "`never widen the ward` is load-bearing for concurrency and is the
correct rule; the consequence is that **no session on a codeweaver pass ever runs the new tests in a wide
batch.** … **The gate chain is working exactly as designed and has a hole at the one place a
stack-depth-dependent failure lives.**"

*Second, nobody checked.* Report 10-12 never pulls cell [2]'s reviewer ward output or cell [2]'s
sub-agent gate. Its account of [2] is by class, not by evidence — the parenthetical and the origin table
are the only places [2] appears. **For an audit of the `shared` cell's verification, that account does
not exist yet.** Report 02 itself says nothing about a downstream ward gate either (0 hits for `[10]`,
`[11]`, `[12]`, `ward gate`, `regression`), so I can add only what its own record shows: [2]'s reviewer ran
`npm run build` once (29.6 s, exit 0, all 13 workspaces) and `npm run ward -- --staged` once (13.6 s: lint
4/4, typecheck 6125/6125, unit 39/39, integration 39/39, e2e skip), both green first try, and returned
`FINDINGS: none` [report 02 §4 item 5]. What is established: [2] shipped a contract with an unbounded
trailing-anchored regex that ran roughly 7 MB payloads; four codeweaver passes and three reviewers ran between it
landing and ward finding it — "00:05:20 to 08:28:53, **8 h 23 min** of quest wall-clock — after which the
repair cycle cost 31.3 min" [report 10-12 §5 finding 7].

*And cell [8] is explicitly cleared.* Report 08 §4.7: the ward gate "went red — but on
`…pasted-image-draft-contract.test.ts` and `…data-url-split-transformer.test.ts`, **both belonging to work
item [7]'s cell. Not one of this cell's 54 files appears in the two `testFailures`.**" Report 05 makes no
claim either way about `4b8d98710`.

*Third, and this is the finding nobody has written down:* report 10-12's closing observation is that

> Nothing in `codeweaver-reviewer-statics.ts` or `standardsReviewConcernsStatics` asks whether a test
> fixture is *pathologically sized*. … That is a **6,990,508-character** string handed to a branded zod
> contract, **in five separate test files**. Every one reads as a perfectly ordinary boundary test.

The `shared` cell authored the *contract* that the 6.99 MB fixture is fed to, and the ceiling
(`maxBytesPerImage: 5242880`) it validates against. It is the one cell positioned to have asked "what
happens when a regex meets five megabytes", and neither its prompt nor its reviewer's concerns list ever
puts that question to it.

### 5d. The siegemaster reviewer never ran

Work item [17] was cut off at steps 4–7 of an unbounded loop. Report 17 §3 S4:

> **'You never commit and you never push. Your reviewer does both'**, plus 'There is no cap on this
> loop', together guarantee that any session which does not finish leaves **every fix uncommitted**. That
> is exactly what happened: 67 paths, nine fixers, zero commits.

Verified in the worktree at the time of this audit:

```
uncommitted paths: 67
by status: {' M': 56, '??': 11}
by package: {'web': 41, 'orchestrator': 17, 'server': 8, 'other': 1}
git log --oneline -1  →  e4d5e8218  (siegemaster [16]'s commit, and [17]'s own startRef)
```

**Not a role failure.** Nine fixers' worth of verified repairs — including the create-route fix that
closes §6 — are sitting unreviewed and uncommitted because the only commit authority on the role sits
behind a loop the outage never let it leave.

One consequence to flag for whoever resumes: report 17 §3 S5 records a red test the session knowingly left
standing — "One test reads red only because `packages/server`'s Jest resolves the orchestrator through
stale `dist/` — my own no-build rule caused that, and **my reviewer's build at step 8 is where it
resolves.** **Step 8 never ran, so that red is still standing in the worktree.**"

---

## 6. Late discoveries — what was found where it was most expensive

### 6a. The provenance ledger for this flow

Of 53 observables: **47 `spec`, 5 `siegemaster`, 1 `flowrider`.** Quest-wide the split is 147 / 14 / 2, so
this flow contributes **5 of the 14 siegemaster additions and 1 of the 2 flowrider additions — 6 of 16
mid-quest observables from one of three flows.** Zero were authored by a codeweaver, on this flow or any
other.

That zero is not a codeweaver virtue. A codeweaver's evidence is a unit test in the package it owns; a
unit test that passes tells you nothing about a route the graph did not draw. Every one of the six
mid-quest observables on this flow required something a codeweaver structurally cannot do: drive the real
system (5 siegemaster) or drive a real browser (1 flowrider).

### 6b. The five siegemaster observables, each judged against §6's question

| observable | found | could an earlier track have caught it? | cost where it was found |
|---|---|---|---|
| `check-composer-typable-while-agent-streams` | walker `a49c394a0` @122.7m, "Walk P5 mid-quest and clear-composer" | **Yes — flowrider.** It is a UI-timing claim in a real browser, the flowrider's own surface. The spec's `check-composer-editable-again` covers the same control and passed, because it asserts the end state, not *when*. | 3 agents ≈ **34.5 sub-agent min**, ~155k out, ~42.3M ctx-in; a **40.3 min** wall-clock phase [report 17 §1 row 5, §7] |
| `check-chat-send-never-mints-a-second-quest` | `a9a40a38f` @389.4m, **on the off-map interruption probe, not a P-path** | **Partly — flowrider.** The precondition is "the quest's chat work item carries no sessionId yet", which an integration test can seed. But the *symptom* is a navigation into a different quest, which needs a browser. | probe 25.2m + fixer 47.0m **+ 10 `Explore` grandchildren** = **74.8 min** wall clock [report 17 §1 row 8]; fixer alone out 127,505 / ctx-in 42.8M |
| `check-simultaneous-sends-both-stay-reachable` | `aed35eae0` @478.1m | **No.** Barrier-released parallel POSTs against a live orchestrator with a real sessionId write-back window. Its own `toSettle` says this MCP browser toolchain cannot even reach it. | the walk was **paid for four times** — 36.4 min for 21.5 min of usable work, **14.9 min lost** to three consecutive API deaths [report 17 §5.5]. **Fix never dispatched**; settled `unconfirmable`. |
| `check-draft-is-scoped-to-its-own-composer` | `aed35eae0` @478.1m, same walk | **Yes — flowrider, cheaply.** Two tabs on two quests, one localStorage key. No timing, no race. | fixer `a2794d5ae` **51.5 min / 363 turns / out 231,747 / ctx-in 133,567,044** — the item's **second-largest sub-agent** — plus re-proof `aa6b267db` 27.6m. **≈100.6 sub-agent min, ≈264M ctx-in.** |
| `check-unload-during-send-leaves-no-duplicate` | deferred @389.4m, **reproduced @640.0m** | **No.** It needs sub-frame click-to-unload timing, or a throttled connection. | Deferred once ("needs sub-100ms timing no human produces"), then reversed 250 minutes later on new evidence. Fixer `a746672bf` 14.5m — **and it finished 5.897 seconds before the quest was paused. The siegemaster never read its report.** [report 17 §1] |

**Two of the five — `check-composer-typable-while-agent-streams` and
`check-draft-is-scoped-to-its-own-composer` — were within the flowrider's reach and were not written.**
Together they cost roughly **135 sub-agent minutes and roughly 306M context-in tokens** at siege time. A
flowrider e2e for the draft-scoping one is two tabs and one assertion.

Report 17 makes no such attribution itself, and the reason it makes none is its own §3 S1: **the test-suite
review it was dispatched to do was never scripted.** The operation item reads
`…and review its test suite — flow: send-message-with-images`; the 32,956-char prompt contains no step for
it, and the one occurrence of the phrase means the opposite. Measured: "**Test-suite review — 0.0 min,
0.0%** — no agent was ever dispatched to grade a suite" [report 17 §1]. The flowrider's suite for this
exact flow (`f2aaeabab`, "32 integration + 28 e2e real cases") was opened only where a fixer needed to add
its own case. **"Nobody asked 'does this suite bite?' — the question `flowrider-reviewer` exists to
ask."**

### 6c. The one flowrider observable

`check-typing-after-end-of-content-newline`, found by browser walk `a20e184886cb97c2e` at **200.7m**
(17.9 min, out 100,029, ctx-in 26,140,623), which returned `NEXT: wall`. Could a codeweaver unit test have
caught it? Its `toSettle` names `chat-input-widget.tsx`'s Shift+Enter branch and `domComposerInsertTextAdapter`
— codeweaver-owned files — but the defect is contenteditable caret placement, which jsdom does not
implement. **No; this one is correctly a browser finding.** Report 14 makes no claim either way; it
records only "verified three ways" in real Chromium. Cost where found: **20.3 min** (P8) plus the forced
P9 rework dispatch, plus the `NEXT: wall` misroute [report 14 §5 finding 7] — which cost "**zero, because
the flowrider ignored the table.** The exposure is what matters: a session that followed the prompt
exactly would have blocked quest `1be07040` at 200.7m with 8 units unwritten."

### 6d. The chain that should be the headline: `check-new-quest-first-message`

This is the most expensive late discovery on the flow, and it is not a mid-quest observable at all — it is
a **spec observable that a codeweaver signed `confirmed` while the system was broken**.

**2026-09-01T20:08:05Z — codeweaver [3] (orchestrator) signs it `confirmed`** (re-signed at 34.5m when a
fix moved the line numbers — report 03 treats that re-sign as bookkeeping and **never notices the false
green**; a full-text read of report 03 finds no such claim anywhere)**:**

> `packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.test.ts:96` — on the chaoswhisperer-new
> path (setupNewSession: no questId, no sessionId, the quest minted inside the call),
> `expect(occurrenceCount).toBe(2)` counts split() segments for `…/images/2f6d.png` in the spawned `-p`
> value…

The test is correct, red-isolated ("Mutating the expectation to `toBe(3)` produced Expected: 3, Received:
2 before it was reverted"), and proves the orchestrator's half. It never asks whether the caller upstream
will ever hand it a rewritten message. **A cell can only prove its own package, and its denominator is
drawn the same way.**

**The premise for calling this a false green is in report 03 and the conclusion is not.** §4 item 5 states
"**The orchestrator mocks `child_process.spawn` in every unit test, so no CLI ever runs**" — and uses that
reasoning to mark `#agent-reads-images` and `#check-agent-issues-read` `unconfirmable`. It never extends it
to the spawn-argv observables one node upstream, where the same mock decides what "the spawned `-p` value"
even is. Three of that cell's `confirmed` verdicts (`check-argv-carries-image-path`,
`check-new-quest-first-message`, `check-followup-message-carries-path`) rest on a message string the test
supplies. Only one of the three turned out to be false in production, but the cell had no way to tell
which — **it drew its `unconfirmable` line at the process boundary when the real boundary was the caller.**

**2026-09-01T22:56:15Z — 168.2 minutes later, codeweaver [5] (server) writes an `out-of-scope` quest note
naming the exact hole:**

> The quest-create route accepts an images array it cannot act on: **no cell on this quest owns the
> orchestrator step that would write those files.**

*(quoted from `quest.json` `planningNotes.questNotes` — report 05 records the note's id, size and cost but
not this sentence.)* It is a **2,430-character `out-of-scope` note, `create-route-images-need-orchestrator-half`**,
naming the three orchestrator changes that close it — "*widen that gate to questId alone … thread an
optional questId through ChatStartResponder and StartOrchestrator.startChat … give the server a way to mint
the quest with its intake work item ahead of the spawn*". **It cost 0.3 min.** Report 05 §4 item 4 grades
it right: "**The out-of-scope hole was recorded rather than faked**", against the alternative the session
itself named — "*faking it with a write after the fact would leave bare tokens in the transcript*".

It knew, it wrote it down in 18 seconds, and it went nowhere. Quest notes never close a unit and never
reach a sibling — and [3] had already run and signed 168 minutes earlier. The note was `modify-quest` #4
of five; #2 and #3 in the same series are the two calls that wrote nothing (§2c), and all five returned
the same `{"success": true}`.

**2026-09-02T15:51:07Z — 19.72 hours after [3]'s sign-off, flowrider [14] measures it and records
`unconfirmable`:**

> Measured end to end through a real browser send on the create surface, **then deleted so nothing red
> ships.** The spawned CLI's -p prompt ends `'## User Request\n\nA[Pasted Image 1]B'` — the bare
> placeholder… Cause: `packages/server/src/responders/quest/new/quest-new-responder.ts:54` destructures
> `{ message, questType }` out of the parsed body and drops images, and the file never imports
> `pastedImagePersistBroker` … This contradicts design decision `#attachments-ride-with-the-message`,
> which states the quest-create route writes the files and rewrites the tokens as part of handling that
> one request.

The `toSettle` is a fix instruction, not a test instruction: "Wire `pastedImagePersistBroker` into
`…/quest-new-responder.ts` the way `quest-chat-responder.ts:108-111` does…"

**2026-09-03T06:06:56Z — siegemaster-walker rediscovers it live**, driving its assigned create-surface
first message, and records it under `out-of-scope` because it fell **between two walkers' unit
assignments**: "Not one of my assigned units (substitute-tokens/write-image-file/resolve-images-dir belong
to the 'server on-disk files' walker; build-prompt/spawn-cli belong to the P3 'spawns in the background'
branch), but discovered live while driving MY exact assigned path". Its evidence includes the agent's own
reply "that it received the literal placeholder text with 'no image data behind either placeholder'".

**2026-09-03T06:54:59Z — siegemaster [17] signs it `confirmed`** after the fix chain lands: images dir
holds two files with `sha256sum` matching the posted bytes, `userRequest` rewritten to absolute paths, and
the real spawned session JSONL carrying the same paths plus the sentinel and trailer, "appended exactly
once."

**The bill.** From the server cell first naming the hole to the fix being confirmed live:
**31.98 hours of quest wall clock.** The repair itself is the **P3 spawn-permission chain**, and report 17
prices it exactly [§5.3]:

```
13  ad766aaaee8f39e75  Walk P3 spawn and agent reads images        12.9 min  177 turns
14  a32167d9431dfdcef  Grant spawn read access to images dir       66.2 min  416 turns
15  abdca70ae15c58971  Fix remaining red followup spawn test       37.0 min  177 turns
16  a2a255f1233a66ee3  Re-walk P3 agent reads images               10.7 min  148 turns
                                                          TOTAL  126.8 min
```

"For scale: the whole P1 walk-fix-rewalk cycle cost 25.6 min and the whole P5 create-surface cycle 61.5
min. **Agent 14 alone outlasted the entire P5 cycle.**" Wall clock for the block: **104.8 min**, the
single biggest of the item [report 17 §1 row 6]. Agent 14 alone: out 287,865, ctx-in 172,918,166 — 11.1%
of the item's output and 15.8% of its context-in on one fix. And 37.0 min of the 126.8 went to one red
test whose ward runs oscillated `1 → PASS → PASS → 1 → 17 → 1 → 4 → 9 → 17 → 1 → 1 → 1 → 1 → 1 → 1` and
"still reads FAIL" at the last run before it stopped.

The deeper defect it uncovered is the quest's whole point failing [report 17 §4.1 defect #4]:

> The agent **does** issue a correct `Read` on the written path — and the tool result comes back
> `is_error: true`: *"Claude requested permissions to read from &lt;path&gt;, but you haven't granted it
> yet."* The spawn argv carries no `--add-dir`, headless `-p` has no one to approve the prompt, and
> `DUNGEONMASTER_HOME` and the spawn's cwd are disjoint trees in a real install too. Reproduced across
> two roles, two spawn types, two guilds. **No pasted image reaches the model.**

**Who should have caught what.** The `--add-dir` half is genuinely siege-only — it needs a real headless
spawn, and no unit test or Playwright e2e with a fake CLI can reach it (`check-agent-issues-read` is
`unconfirmable` on both earlier tracks for exactly that reason, and the flowrider says so: "The session
transcript in every e2e is written by the fake Claude CLI… Queueing a Read tool_use line would make the
assertion measure the fixture, not the agent"). **The create-route write is not.** It is a server
responder that drops a validated field, the server cell named it in writing, the flowrider measured it and
handed over a fix instruction, and it survived all of that because **the artifact that decides who builds
what — the flow graph — draws one `post-chat` node and one edge into the write chain for three routes.**

### 6e. What this flow contributes to the 16-of-163 figure

6 of 16, from one of three flows. Every one required a running system. The number that matters is not 16 —
it is that **`addedBy: 'codeweaver'` is zero across the whole quest**, and on this flow the one cell that
*noticed* a missing observable wrote a quest note instead, because the codeweaver prompt's route for that
is "To change the spec, patch the same `flows` array without a sign-off field" — a sentence in the
*Recording what you claim* section, after the sign-off template, with no step in the script that asks the
question.

---

## 7. The missing middle step

**Answer: yes, one step is missing, and it is small.** Between the approved flow map and the first
codeweaver brief, nothing turns the graph into a per-cell work order. Every operator on this flow invented
one, and each invented a different wrong one.

### What each operator had to invent before it could dispatch

| operator | invented | consequence on this flow |
|---|---|---|
| codeweaver [2] `shared` | its unit list, plus the seam, from a render that collapses sibling observables to a count | read 1 against an authoritative 6; 56.5% of its 27,330-char scope fetch was design decisions, 10 of 13 naming nothing it owned |
| codeweaver [3] `orchestrator` | the same, plus whether the server cell had run | signed `check-new-quest-first-message` `confirmed` on a broken system (§6d); worked out the seam status at **41.3m of a 41.3m session** |
| codeweaver [5] `server` | the same, **plus edge ids the renderer never prints** | claimed 15, wrote 13, owed 23; two sign-offs silently stripped (§2c); 6.3 min and 30 `Read` + 9 `discover` reconstructing four seam nodes by hand |
| codeweaver [8] `web` | the same; recovered 7 of 8 edge ids by running `python3` against `.dungeonmaster/…/quest.json` | 37 records over 35 units over a 38 denominator; 2 phantom (§2d). **That recovery only works in the dogfood repo** |
| flowrider [14] | its package set (`packageNames=[]`) and, by omission, its sibling's map | 7.2 min orientation; ≈30–37 min and ≈475k tokens of recoverable duplication |
| siegemaster [17] | the walk order, a mid-loop banking strategy it did not have, and a walker guide a sibling had already written | 8.4 min of re-derivation with 10.1% overlap; 67 uncommitted paths |

### The three fixes, in order of leverage

**1. Give the codeweaver the denominator tool it is already gated on. (Prompt edit, roughly 10 lines.)**
`get-qa-checklist({ questId, operationItemId })` already answers correctly for a codeweaver item — I called
it for `f21eacd1` and it returned the full 66-unit list with per-unit ids, the read-check legend, and the
walk paths. The prompt simply never names it. Add the flowrider's `### 2. Get the full list of units` step
verbatim to `codeweaver-prompt-statics.ts` and to `codeweaver-reviewer-statics.ts`. This alone fixes:
the four wrong counts; the two destroyed sign-offs (the checklist prints every branch's unit id, which the
graph render does not); the seam ambiguity, because the checklist's `[ ]` marks apply the *node* rule the
scope transformer uses rather than the *observable-tag* rule the prompt states; and the phantom terminals,
because the checklist enumerates only true terminals.

**2. Make the checklist header report the measured denominator, not a wider one. (Product bug, §1a-bis.)**
`qaChecklistBuildTransformer` applies `observableOrigins` and the package slice to `remainingItemIds` and
not to `items`; `qaChecklistToTextTransformer` then counts `items`. The call I made for this flow's
codeweaver item printed **`Units: 66` over a real denominator of 61**, rendering the five excluded units
as `[x]` under a legend whose two stated reasons are both false for them. `qaChecklistToTextTransformer`'s
own comment already names this exact failure mode for the two filters it *does* apply — "a flowrider
seeing `58 of 67` is measuring itself against nine units it can never reach, and the nine are invisible as
such once they scroll past their legend." Route both counts through one filter, and give the legend a
third reason: *a later role authored it and your track ran first*.

**2b. And give a late-authored observable a carrier.** `check-typing-after-end-of-content-newline` sits in
the `web` cell's denominator by rule, was authored 9.2 h after that cell closed, and has no `pt N` item —
so the cell reads `REMAINING: 1` permanently (§1c). The relay's own comment anticipates the `pt N`
continuation; nothing mints one. Either mint it when a later role authors an observable inside a closed
cell's scope, or record the origin on the unit so a reader can tell "owed" from "arrived too late".

**3. Draw the fan-in, or mint a seam owner.** This is the one that is not a prompt edit. The flow graph is
the delivery contract, and it under-draws convergence: three HTTP routes enter one `post-chat` node, one
edge leaves it, and the create route's write was built by nobody for 32 hours (§6d). Two candidate fixes,
and the evidence favours the first: **(a)** require the spec to draw a node per route where routes differ
in the code that serves them — the observables already distinguish them
(`check-chat-post-carries-images` / `check-followup-post-carries-images` /
`check-create-post-carries-images`), so the information exists and only the topology is missing;
**(b)** mint a flow-less seam cell for a package's cross-node glue. `signoffTrackEligibilityStatics`
already contemplates "a single flow-less item for a package that owns contracts and tags no node
anywhere" — extending that to *tags nodes but owns route-level glue* would also have given the `shared`
cell somewhere better to live than a 24-minute flow slice (§2b).

### What is NOT missing

Worth saying plainly, because the evidence says it. **The three-track design worked on this flow.** 58 of
73 units carry three independent proofs at three different layers; §4a shows the layers finding different
failures rather than repeating one. **The `unconfirmable` verdict did its job** — all eight on this flow
(3 codeweaver, 4 flowrider, 1 siegemaster) name either a codeweaver-owned production file or a structural
limit of the layer, each with a `toSettle` a later role could execute; and the flowrider's `toSettle` on
`check-new-quest-first-message` is precisely what the siegemaster's fixers carried out. Two of the four
flowrider `unconfirmable`s are honest statements that its own harness cannot reach the claim
(`check-agent-issues-read`: "the session transcript in every e2e is written by the fake Claude CLI …
queueing a `Read` tool_use line would make the assertion measure the fixture, not the agent"), and it
**deleted the red test rather than shipping it green** — the behaviour the design wants.
`reset-flow-signoffs` was never needed. The eligibility statics are correct and correctly applied by the
gate; the *header* and the *measurement script* were what disagreed with them (§1a, §1a-bis). And the
paused siegemaster's four unwalked probe families are a scheduling casualty of an API outage, not a design
fault — though report 17's F7 is right that `hostile-input` and `perf` should not sit at the back of an
unbounded queue.

The gap is one step wide: **the codeweaver is the only track dispatched against a hard completion
criterion with no way to enumerate what it must complete.**

---

## 8. Raw figures appendix

### Work items on this flow

```
[2]  codeweaver shared          ac2b5262-76de-454a-a2e9-db3956852052  b3d97d99-…   24.27 min
[3]  codeweaver orchestrator    59f457a9-8c1e-4b10-aabd-28aa238e4c67  751a242b-…   41.30 min
[5]  codeweaver server          3050a3ae-aafb-4f3b-9fd3-8367b5168ebb  edaf4b8a-…   87.68 min
[8]  codeweaver web             7546da90-f77b-479a-9b70-96802f47bc2f  0db63e41-…  174.55 min
[14] flowrider                  156d650c-fa18-48a0-a043-18f114f0b178  42edd7ea-…  249.27 min
[17] siegemaster (CUT OFF)      db0acadb-fd0d-4b8c-8da4-fb989dae761c  8ffd3cb9-…  655.00 min

codeweaver subtotal (4 cells)   327.80 min
codeweaver + flowrider          577.07 min
TOTAL on this flow             1232.07 min = 20.5 h
```

Operation item ids used for `get-qa-checklist`: `f21eacd1-3a1b-492e-83e1-aaf7581aa3b0` (cw shared) ·
`339d7ed2-43c1-4023-8af8-a0511cb25caf` (flowrider) · `790afdae-40a7-4c42-a3ee-bf249cfd12b0` (siegemaster).

### Token and commit figures per cell

| item | wall | main ctx-in | sub-agents | total ctx-in | total output | commit |
|---|---|---|---|---|---|---|
| [2] shared | 24.4 min | 15,155,735 | 6 | **31,530,609** | 175,522 | `bebca45c3` — 13 files, 354 ins, 0 del |
| [3] orchestrator | 41.3 min | 30,516,128 | 16 (8 + 8 depth-2) | **100,304,852** | 397,741 | `f48bbc660` — 11 files, 425 ins, 5 del |
| [5] server | 87.6 min | 41,390,416 | 27 | **230,255,524** | 1,062,761 | `4b8d98710` — 38 files, 1,932 ins, 37 del |
| [8] web | 174.6 min | 56,631,016 | 38 (20 + 18 depth-2) | **431,513,918** | 1,724,682 | `3275de52b` — 54 files, 3,492 ins, 370 del |
| [14] flowrider | 249.3 min | 58,403,798 | 18 | **485,696,805** | 1,566,119 | `f2aaeabab` — 8 files, 60 real cases |
| [17] siegemaster | 655.1 min | 44,137,472 | 41 | **1,140,071,094** | 2,932,178 | **none — 67 paths uncommitted** |

Per-line rates the Phase 1 reports computed: [2] "**89,069 context-in tokens per line**"; [3]
"**236,011 context-in tokens per line landed**"; [5] "**550 output tokens per landed line**". No report on
this flow gives a currency cost.

### Denominator reconciliation

| | coverage.txt (old) | `get-qa-checklist` header | measured set (all 4 filters) | signed | remaining |
|---|---|---|---|---|---|
| codeweaver | 63 | **66** (over-counts by 5, §1a-bis) | **61** | 60 | 1 |
| flowrider | 63 | **64** (58 at the time it ran) | **59** | 59 | **0** |
| siegemaster | 66 | **71** | **71** | 67 | **4** (not yet attempted) |

Report 17 read `71` [§3 S7]; report 14 read `58` then `59` [§1 P1] and closed on `55 confirmed, 4
unconfirmable` — **both correct**. No codeweaver read anything, because the tool is absent from its prompt.

### Coverage shape

```
observables: 53
  .package tally:        {'web': 29, 'server': 14, 'orchestrator': 9, 'shared': 1}
  addedBy:               {'spec': 47, 'siegemaster': 5, 'flowrider': 1}
node .packages tally:    {'web': 11, 'server': 6, 'orchestrator': 4, 'shared': 1}
node types:              {'action': 10, 'terminal': 5, 'decision': 3}
  ↳ terminal UNITS: 3 (send-rejected and insert-newline have outgoing edges)
edges: 19, of which 10 labelled
off-map families: 7 canonical (3 recorded on disk)

units by number of tracks that signed: {0: 4, 1: 10, 2: 1, 3: 58}
units with THREE confirmed verdicts: 54 of 58 triple-signed

sign-off RECORDS on this flow: {cw: 62, fr: 61, sm: 67} = 190
  phantom (node/edge that is not a unit): {cw: 2, fr: 2} = 4
  silently destroyed in transit (report 05 §3.3): 2

codeweaver records per cell:
  ac2b5262 [2] shared        1  {observable: 1}
  59f457a9 [3] orchestrator 11  {observable: 8, terminal-node: 1, branch-edge: 2}
  3050a3ae [5] server       13  {observable: 13}          ← closing report claimed 15
  7546da90 [8] web          37  {observable: 25, terminal-node: 2, PHANTOM-node: 2, branch-edge: 8}
                                                          ← closing report claimed 35 (= true unit count)

unconfirmable units, by track:
  codeweaver  agent-reads-images · check-both-copies-readable-after · check-agent-issues-read
  flowrider   agent-reads-images · check-new-quest-first-message · check-agent-issues-read ·
              check-typing-after-end-of-content-newline
  siegemaster check-simultaneous-sends-both-stay-reachable
```

### Per-cell scope

```
codeweaver ['shared']        DENOM= 6  by-this-item= 1  (5 signed by the server sibling)
codeweaver ['orchestrator']  DENOM=12  by-this-item=11  (1 signed by the server sibling)
codeweaver ['server']        DENOM=23  by-this-item=13  (10 signed by siblings)
codeweaver ['web']           DENOM=38  by-this-item=35  (2 by server sibling, 1 outstanding)
per-cell sum 79 over a 61-unit union → 18 double-owned glue units
```

### Design-decision routing

```
33 design decisions on the quest, all carrying relatedNodeIds
13 touch a node on this flow
  shared        3 actionable / 10 not
  server        9 actionable /  4 not
  orchestrator  3 actionable / 10 not
  web          10 actionable /  3 not
```

### Source-level verifications made for this audit

| claim | verified at |
|---|---|
| codeweaver has no denominator tool | `codeweaver-prompt-statics.ts` + `codeweaver-reviewer-statics.ts`: `get-qa-checklist` = **0** occurrences (flowrider 2+1, siegemaster 4+1) |
| the scope block is dead code | `codeweaverScopeBlockTransformer` referenced only by itself and its own `.test.ts` |
| the render prints no edge ids | `flow-graph-to-text-transformer.ts`: `edge.id` = **0**, `edge.label` = 4 |
| a nested `edges` key is stripped silently | `flow-node-contract.ts` is a bare `z.object`; no `.strict()`, no `.passthrough()` |
| terminal units ≠ `type: 'terminal'` | `qa-unit-enumerate-transformer.ts` filters `!nodesWithOutgoing.has(node.id)` |
| off-map is 7 families, always | `qa-unit-enumerate-transformer.ts` maps `qaOffMapFamilyContract.options` unconditionally |
| header denominator ≠ measured denominator | `qa-checklist-to-text-transformer.ts` filters on `unitKinds` + `verificationMethods`; `signoff-flow-outstanding-transformer.ts` also applies `observableOrigins` + `qaUnitsInPackageScopeTransformer` |
| glue units are owned by every cell tagging the node | `qa-units-in-package-scope-transformer.ts`: "`packageNames` NARROWS BY INTERSECTION for every track — an item owns every unit whose node tags ANY of its names, glue included." |

### Siegemaster [17] state at the pause

```
uncommitted paths: 67   (' M': 56, '??': 11)
by package: web 41, orchestrator 17, server 8, other 1
git log --oneline -1 → e4d5e8218  (== this item's own startRef)
41 sub-agents: 19 walk (247.6 min) · 9 fix (289.2 min) · 3 guide (14.2 min) · 10 explore (21.4 min)
sub-agent totals: 5,192 turns · 2,584,414 out · 1,095,933,622 ctx-in
outage: 15 zero-token 529 cycles, 530.3m → 609.4m = 79.1 min
test-suite review: 0.0 min (the job the operation item's own text promises)
```

### Timeline of the `check-new-quest-first-message` chain

```
2026-09-01T20:08:05Z  codeweaver [3]  signs it CONFIRMED off a correct orchestrator unit test
2026-09-01T22:56:15Z  codeweaver [5]  +168.2 min — writes the out-of-scope note naming the hole
2026-09-02T08:28:53Z  ward [10]       red on an unrelated defect; this one is invisible to it
2026-09-02T15:51:07Z  flowrider [14]  +19.72 h — UNCONFIRMABLE, root cause + fix instruction, red test deleted
2026-09-03T06:06:56Z  sm-walker [17]  rediscovered live on P3; falls between two walkers' assignments
2026-09-03T06:54:59Z  siegemaster [17] +31.98 h from the first naming — CONFIRMED against a real spawn
```
