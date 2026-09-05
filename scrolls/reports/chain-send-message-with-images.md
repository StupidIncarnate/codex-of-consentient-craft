# Chain audit — flow `send-message-with-images`

Quest `1be07040-b9ec-476c-a439-0b4fbb0123cd` · flow 2 of 3 · "Send a message carrying images"

**Scope caveat, stated once and covered throughout.** Work item [17] was the **siegemaster** on this flow — the role that stress-tests a finished feature against a real, running system. It ran for 655 minutes and was **cut off mid-loop by an API outage**: 15 identical zero-token failures (HTTP 529) repeated over 79 minutes. It never reached its reviewer step, never called the `signal-back` tool, and left 67 files uncommitted. Its four unsigned units are **not yet attempted** — this is not a failure by the role — and this report calls them that every time they come up below.

**Headline.** The chain on this flow did deliver. The **flowrider** — the role that verifies the feature in a real browser — closed out its full list exactly: it owed **59** checks, signed **59**, and left **0** unsigned. That full list a role must sign off is its **denominator**, used throughout this report. The **siegemaster** reached **67 of 71** checks before the outage cut it off, and the four it did not reach belong to **off-map families** — extra safety and performance checks that are not tied to one specific spot in the flow — so those four are simply not yet attempted. The **codeweaver** — the role that writes the code, one package at a time — has just **1 of 61** checks outstanding, and that one check (an **observable**: one specific, testable behavior tied to a point in the flow) was written 9.2 hours after the codeweaver's **cell** — its work item, scoped to a single package — had already closed. Of the 73 checks counted overall, 58 were confirmed by all three roles' sign-off **tracks** (a track is the running checklist one role — codeweaver, flowrider, or siegemaster — keeps as it signs off work), and 54 of those 58 were confirmed three separate times.

But it was not the tool the process provides that actually drove that result. The codeweaver is the only one of the three tracks with no tool that tells it its own denominator: the tool that supplies one, `get-qa-checklist`, is named **zero times** in the file that instructs the codeweaver (`codeweaver-prompt-statics.ts`) and zero times in the file that instructs its reviewer (`codeweaver-reviewer-statics.ts`), while the equivalent files for the flowrider and the siegemaster each give it a numbered step. So all four codeweaver cells on this flow had to count their own work by eye, from a graph render that never prints the edge ids it requires them to sign. Two sign-offs were destroyed in transit, by a tool call that reported success while writing nothing. And the one defect that cost this flow 32 hours slipped through because nothing between the approved flow map and the first work brief says which cell owns a route the graph draws only once — a codeweaver named it in writing, a flowrider measured it, and the siegemaster's walkers fixed it. That is the missing middle step, and §7 states it.

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
`check-chat-post-carries-images`, `check-followup-post-carries-images`, and
`check-create-post-carries-images`. That shows the spec knew there were three separate send surfaces. But
the graph draws exactly **one** edge into the write chain, `post-chat -> resolve-images-dir`, so a reader
who assigns work by node cannot see the fan-out to three routes. Three routes converge on one drawn path,
and only two of them were actually built. §6 prices the cost of the third.

**(b) None of the 33 design decisions is anchored to a specific cell, even though each one carries a
`relatedNodeIds` field.** 13 of the 33 touch a node on this flow. Here is the breakdown, measured per
cell:

```
shared        flow-scoped=13  actually name a node this cell owns=3   -> unactionable=10
server        flow-scoped=13  actually name a node this cell owns=9   -> unactionable=4
orchestrator  flow-scoped=13  actually name a node this cell owns=3   -> unactionable=10
web           flow-scoped=13  actually name a node this cell owns=10  -> unactionable=3
```

The data needed to filter by node already exists on disk. But the render filters by flow instead. As a
result, the `shared` and `orchestrator` cells each read ten design decisions that named nothing they
actually owned. Report 02 §3.3 measured what that cost the `shared` cell in its 27,330-character scope
fetch:

> **15,449 of 27,330 characters (56.5%) are design decisions.** Thirteen are rendered under 'governing
> these nodes'; **ten of the thirteen name no node this cell owns** … The three that do name
> `#resolve-images-dir` are the three that mattered. **The filter is by FLOW, never by the cell's own
> nodes.**

Report 02's fix 5 prices the correction: it would cut "roughly **8,800 of 27,330 characters (32%)** off
every codeweaver's scope fetch … **the largest single token lever available.**"

---

## 1. Obligation versus delivery, per role

### 1a. The denominator, reconciled

`coverage.txt` and report 17 disagreed about the total: 66 against 71. **Both were partly right.** 71 is
the true siegemaster denominator. 66 was the old counting script's flat total, which is not correct for
any one track. To check this, I called `get-qa-checklist({ questId, operationItemId })` — the tool that
reports one role's own denominator — once for one **operation item** (the specific, id-tagged task a
session works against) per role. I then re-derived each track's own measured set directly from the rule
file `signoffTrackEligibilityStatics`. Both methods agree with each other, and both agree with the
corrected coverage script:

```
send-message-with-images   OWED  signed  confirmed  unconfirmable  UNSIGNED
  codeweaverSignoff          61      60         57              3         1
  flowriderSignoff           59      59         55              4         0
  siegemasterSignoff         71      67         66              1         4
```

Here are the three tool calls, with their headers verbatim:

| Role | operation item | Header, verbatim |
|---|---|---|
| codeweaver (`shared`) | `f21eacd1-3a1b-492e-83e1-aaf7581aa3b0` | `Units: 66 (3 terminal, 10 branch, 53 observable, 0 off-map)` · `REMAINING (awaiting your codeweaverSignoff): 0 of 66` |
| flowrider | `339d7ed2-43c1-4023-8af8-a0511cb25caf` | `Units: 64 (3 terminal, 10 branch, 51 observable, 0 off-map)` · `REMAINING (awaiting your flowriderSignoff): 0 of 64` |
| siegemaster | `790afdae-40a7-4c42-a3ee-bf249cfd12b0` | `Units: 71 (3 terminal, 10 branch, 51 observable, 7 off-map)` · `REMAINING (awaiting your siegemasterSignoff): 4 of 71` |

Report 17 quoted the same tool at 610.5m elapsed and got `Units: 71 … REMAINING: 7 of 71`
[report 17 §3 S7]. Its final walker signed three more checks before the pause, leaving 4 remaining. So the
tool and the report agree exactly.

**`coverage.txt` is wrong in three independent ways.** Its total number only looks right by coincidence.

| | `coverage.txt` | authoritative | why |
|---|---|---|---|
| terminals | **0** | 3 | coverage never enumerates terminal units at all |
| branches | 10 | 10 | agree |
| observables | 53 | 53 (cw) / 51 (fr, sm) | coverage does not apply `verificationMethods`. The 2 `(read-check)` observables are left off the flowrider's and siegemaster's lists. |
| off-map | **3** | **7** | coverage counts only the `offMapSignoffs` *records on disk*. The canonical family list, `qaOffMapFamilyContract.options`, is 7 items long and is emitted **unconditionally for every flow** by `qaUnitEnumerateTransformer`. |
| origins | not applied | codeweaver & flowrider exclude `addedBy: 'siegemaster'` | the 5 observables that the siegemaster added on this flow (recorded via the `addedBy` field, which names who created each check) were still charged against two tracks that, by rule, can never sign siegemaster-added work — **the entire source of the "6 unsigned / 7 unsigned" figures in my own brief** |
| **total** | **66** | **61 / 59 / 71** | the printed 66 = 53+10+3, which happens to equal 3+10+53 |

The off-map error is the one that matters most. `coverage.txt` reports the siegemaster as `64 signed …
2 UNSIGNED of 66`. The truth is **67 signed of 71, with 4 remaining**. Those four missing checks are
exactly `staleness`, `configuration`, `hostile-input`, and `perf` — which report 17 calls "**this flow's
only security and performance coverage**" [report 17 §1, §3 S7]. A measurement tool that only counts the
probe families a session has already answered can never show that the session stopped before reaching the
security probe.

Applying every rule in `signoffTrackEligibilityStatics` myself, against `quest.json`:

```
codeweaver   OWED  61  signed  60  confirmed  57  unconfirmable 3  UNSIGNED 1
  REMAIN: send-message-with-images:observable:check-typing-after-end-of-content-newline
flowrider    OWED  59  signed  59  confirmed  55  unconfirmable 4  UNSIGNED 0
siegemaster  OWED  71  signed  67  confirmed  66  unconfirmable 1  UNSIGNED 4
  REMAIN: off-map staleness, configuration, hostile-input, perf   [not yet attempted]
```

### 1a-bis. A product bug in the checklist header, and what it did on this flow

`qaChecklistBuildTransformer` builds the `items` list from the raw enumeration, and applies the origin and
package-slice filters **only** to `remainingItemIds`. `qaChecklistToTextTransformer` then filters `items`
by `unitKinds` and `verificationMethods` **only**. The result: the "of N" total a session reads is not
measured over the same set as its remaining count.

**On this flow it printed `Units: 66` for a codeweaver whose real denominator was 61** — this is the exact
call quoted above. The five extra units are the observables the siegemaster added. They render as `[x]`
under a legend that gives two reasons, and **both reasons are false** for these five:

> `[x]` says ONLY that this unit is not yours to sign right now: it is already signed on the
> codeweaver track, or another track owns its package kind.

Neither is true. They are excluded by `observableOrigins`, which the legend never names.

**But no codeweaver on this flow ever saw this bug, because no codeweaver ever called the tool** (see
§3a). The flowrider did not see it either, for a different, timing-related reason worth recording: it ran
at 2026-09-02T12:03Z, before all 53 observables existed. At that point only the 47 `spec` observables
existed; none of the six later additions did yet. So its header read
`3 terminal + 10 branch + (47 − 2 read-check) = 58`, and report 14 records exactly that: `0.6m … say: "58
units across 5 walk paths."` [report 14 §1 P1]. The flowrider then authored one more observable itself,
bringing its own read count to 59, and it closed out at 59.

**This also vindicates report 14's closing arithmetic, which looks wrong on a first reading.** At 248.8m
the flowrider self-corrected to `"55 confirmed, 4 unconfirmable"` of 59. A count taken over `quest.json`
that omits terminal units returns 53/3 of 56, which makes that correction look wrong. But counting
terminal units properly returns exactly **55 confirmed, 4 unconfirmable, 59 owed, 0 unsigned**. So the
flowrider was right, and the apparent disagreement was the same terminal-omission bug that made
`coverage.txt` wrong elsewhere. **Flowrider [14] is the only track on this flow that fully closed out its
denominator: 59 of 59.**

This bug affects any track that runs *after* a later role adds a new observable. On this flow, that would
be a future codeweaver **`pt N`** on `web` — meaning a later, follow-up work item (part N) opened for that
same package after the original one has already closed. See §1c.

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

**Zero tracks signed — 4 units, all covered by the paused-siegemaster caveat above.** These are
`off-map:staleness`, `off-map:configuration`, `off-map:hostile-input`, and `off-map:perf`. The siegemaster
owns all four alone, because `unitKinds` gives `'off-map'` checks to no other track. They are **not yet
attempted**: work item [17]'s own prompt rule orders off-map checks last, and the outage cut the session
off before it reached them. Report 17 states the consequence plainly: "**Unwalked: `staleness`,
`configuration`, `hostile-input`, `perf`** … These seven are the only security and performance coverage
this quest has" [report 17 §3 S7].

**One track signed — 10 units, and every one is correct under `signoffTrackEligibilityStatics`.** This
group breaks down as: five observables the siegemaster originated (rule 5 excludes any
`addedBy: 'siegemaster'` observable from the codeweaver and flowrider), two `(read-check)` observables
(rule 6 gives these to the codeweaver alone), and three signed off-map families (rule 2). No gap here.

**Two tracks signed — 1 unit, and this is the "closed denominator with no way to reopen it" problem.** The
check `check-typing-after-end-of-content-newline` was added by the flowrider (`addedBy: 'flowrider'`) and
signed by [14] and [17], but is unsigned on the codeweaver track. This is the **one genuinely outstanding
unit on the codeweaver track**, and it is not a miss by cell [8]. The flowrider [14] wrote this observable
at 2026-09-02T15:51:07Z, **9.2 hours after** cell [8] had already finished at 06:39:48Z.
`signoffTrackEligibilityStatics` keeps a `flowrider`-added observable on the codeweaver's list on purpose:
"a `flowrider` origin reaches a codeweaver session on a LATER `pt N` continuation of that package, and
dropping it would park such an observable outside every codeweaver denominator permanently." But **no
`pt N` codeweaver item on `web` exists on this quest's ledger.** So the `web` cell's checklist reads
`REMAINING: 1` forever, with no future session able to clear it. This is the same problem a peer analysis
found on the `render-images-in-transcript` flow, in the check `check-modal-width-tracks-modal-inner`.
**Two of the three flows on this quest carry exactly one instance of this problem each. Both instances
were authored by a flowrider, and neither has a later session able to sign it.**

**The five observables the siegemaster authored do NOT have this same problem, and the reason matters.** I
checked each one against the eligibility rules:

| observable | node | in codeweaver's denominator? | in flowrider's? |
|---|---|---|---|
| `check-unload-during-send-leaves-no-duplicate` | `send-pressed` {web} | **no** — rule 5 | **no** — rule 5 |
| `check-chat-send-never-mints-a-second-quest` | `post-chat` {web,server} | **no** | **no** |
| `check-simultaneous-sends-both-stay-reachable` | `forward-to-orchestrator` {server,orch} | **no** | **no** |
| `check-composer-typable-while-agent-streams` | `clear-composer` {web} | **no** | **no** |
| `check-draft-is-scoped-to-its-own-composer` | `clear-composer` {web} | **no** | **no** |

Rule 5 excludes any `addedBy: 'siegemaster'` observable from both earlier tracks outright: "A role that
runs strictly AFTER a track cannot produce work that track was able to sign." So none of these five is
*owed* work sitting on a closed cell. **But the cost is the mirror image of that seam: these five are
invisible to the earlier tracks' records forever, and because the siegemaster is the last role in the
relay, nothing downstream ever records them either.** Four of the five are `confirmed` by [17] and one is
`unconfirmable`. The two that a flowrider could have written instead (§6b) will never show up as a gap in
any flowrider coverage number, on this quest or on a resumed one. **A mid-quest observable authored by the
last role in the relay is closed the moment it is written, no matter what its evidence is actually worth.**

**Three tracks signed — 58 units, 54 of them confirmed three separate times.** §4 evaluates those.

---

## 2. Cell decomposition — did the fan-out match the work?

This flow has the widest fan-out on the quest: four codeweaver cells work against 53 observables, tagged
`web 29 · server 14 · orchestrator 9 · shared 1`.

First, the counts need correcting. `coverage.txt`'s totals of `1 / 10 / 13 / 33` omit terminal nodes
entirely. Here is what is actually on disk, and what each record covers:

```
ac2b5262 [2] shared        1 record  {observable: 1}
59f457a9 [3] orchestrator 11 records {observable: 8, terminal-node: 1, branch-edge: 2}
3050a3ae [5] server       13 records {observable: 13}
7546da90 [8] web          37 records {observable: 25, terminal-node: 2, PHANTOM-node: 2, branch-edge: 8}
                          62 total codeweaver records on this flow
```

Report 03 independently confirms the same figure of 11: "named exactly **11 units**: 8 observables across
4 `◀ YOURS` nodes, 1 terminal (`#agent-reads-images`) and 2 labelled edges … All 11 ended the session with
a verdict" [report 03 §3.2]. Report 08 independently confirms the same figure of 37:
"observables=25 nodes(terminals)=4 edges=8" [report 08 §7]. So the corrected spread across the four cells
is **1 / 11 / 13 / 37**.

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

Read that carefully: **the four cells' denominators add up to 79, but the actual union of units is only
61. That means 18 units are owned by two cells at once.** Every seam node on this flow —
`resolve-images-dir` (`{server, shared}`), `post-chat` (`{web, server}`), `forward-to-orchestrator`
(`{server, orchestrator}`), and `server-accepted` (`{web, server}`) — puts its whole unit set on both
owning cells' lists. That double-listing is deliberate. `flowNodeContract`'s own `packages` field
description says "A node carrying more than one is a seam … **it owns the glue verification units no
single-package slice can**", and `qa-units-in-package-scope-transformer.ts` says "No track mints a seam
item, so a glue unit a stricter reading dropped would be owned by nobody at all."

**But the codeweaver prompt gives the opposite rule.** From `codeweaver-prompt-statics.ts` step 1:

> **Observables attributed to another package are collapsed to a count.** That is not truncation — the
> sibling cell builds them AND signs them. You cannot: the render gives you neither their ids nor their
> text. **Sign only observables printed in full**, and read the count as what the other half of a
> shared node is doing.

So the checklist routes a unit **by its owning node**, but the prompt routes it **by the observable's own
`package` tag**. On a seam node, those two rules disagree — and every seam node on this flow is exactly
that case.

### 2b. What that did to each cell

**Cell [2], `shared` — the 1-unit session.** Its true denominator was **6**: every observable on the node
`resolve-images-dir`, since that node is tagged `shared`. But the denominator its prompt actually showed
it was **1**: `check-images-dir-name-is-shared`, the only observable on that node tagged
`package: shared`. It signed that 1 and left the other 5. Those 5 were signed 2 h 9.7 min later, by the
server cell [5], which saw them printed in full because they carry the `server` tag. So nothing was
actually lost. But the shared cell's own checklist read `REMAINING: 6` when it started and
`REMAINING: 5` when it signalled off — and nothing in its prompt would ever have told it why.

The cell worked out this seam on its own, from tag counts alone. Report 02 §3.1 records that it "derived
the seam itself from the flow render's `{server ● 5, shared ● 1}` tag counts", and quotes the map note it
wrote:

> Only 1 of that node's 6 observables is shared's, and it is the statics key — so I ship the key and leave
> the resolver to the server cell.

That is a correct reading of the prompt's rule ("**Sign only observables printed in full**"), but a wrong
reading of its own denominator. Report 02 §3.2: "Signed exactly one — `#check-images-dir-name-is-shared`,
the only observable the render printed with `{shared}`. The other five on that node carry
`package: 'server'` and were signed by the server cell 41 minutes later."

The cost of that whole session, from report 02 §2: **31,530,609 context-in tokens** (15,155,735 from the
main session plus 16,374,874 from six sub-agents) and 175,522 output tokens, to produce
`13 files changed, 354 insertions(+), 0 deletions`. The report's own rate for this: "**89,069 context-in
tokens per line**; 175,522 output tokens / 354 = **496 output tokens per line**." The session took
24.4 minutes.

**Is a whole session justified for one observable?** *This verdict is mine — report 02 never asks the
question.* A search of the whole report file returns 0 hits for `justif`, 0 for `decompos`, and 0 for
`whole session`; its only hit for `tier` is about merging sub-agent briefs. Nothing in the Phase 1
forensics judges whether a cell is sized correctly, for this cell or any other.

By the sign-off ledger alone, obviously not. But the ledger is the wrong instrument for measuring this
cell's real work. The `shared` cell's actual deliverable was **contracts and statics, which carry no
checklist units at all**: `PastedImageStatics`, `PastedImageMediaType`, `PastedImageUpload`, and
`locationsStatics.quest.imagesDir`. Only the last of these four is what its single observable actually
asserts. Contracts route to a cell **by file path**, not by node tag, so both of its shared-source
contracts are anchored to nodes it does not even tag (`pasted-image-statics` then `serialise-composer`
`{web}`; `pasted-image-upload` then `post-chat` `{web, server}`). So four of its five real deliverables are
structurally invisible to the coverage record. Its commit is
`bebca45c3 codeweaver: shared's half of send-message-with-images — pasted-image statics, media-type and
upload contracts, quest images dir key`.

**Did running the cells in tier order actually buy anything?** Yes, and it is measurable — but only from
the *consumer* side, which is a place report 02 cannot see. The cells ran in `packageBuildOrderStatics`
tier order: `shared` (library) at 19:09, `orchestrator` (programmatic-service) at 19:33, `server`
(http-backend) at 21:43, and `web` (frontend-react) at 03:45. The `shared` commit `bebca45c3` landed at
19:32:52Z — **41 seconds before the orchestrator cell's first record** [report 03 §0] — and that
orchestrator cell cashed in on it immediately:

> The predecessor-commit read paid for itself in one turn. `git log` at `0.6m` -> `Read` of
> `pasted-image-statics.ts` at `0.7m` -> the read-check `#check-sentinel-from-shared-statics` came back
> `HOLDS` … without a single rework round. [report 03 §4 item 2]
>
> Without this step the pass would have re-invented the sentinel and failed its own read-check.
> [report 03 §3.1]

The two `(read-check)` observables on this flow exist precisely to assert that this happened.
`check-sentinel-from-shared-statics` (orchestrator) and `check-placeholder-pattern-from-shared` (server)
both assert "read from the shared pasted-image statics, not written inline", and both are `confirmed`. So
running the library-owning cell first bought a single source of truth that two later cells verifiably
imported instead of duplicating. **The 24 minutes paid for the tier ordering, not for the one unit the
cell signed.**

**Should this cell exist as its own session at all?** On this evidence, no — but the fix is not to delete
it. `shared` tags exactly one node on the whole quest, so the ledger minted it exactly one cell. The real
problem is that the ledger sliced a *contract-shaped* deliverable along the *flow* dimension, which has
nothing to do with how contract work actually happens. `relayTailFanOutTransformer` already has the right
building block for this: the eligibility rules describe "a single flow-less item for a package that owns
contracts and tags no node anywhere." `shared` tags exactly one node, so it missed qualifying for that
path by one tag. Folding a library package's contract work into a flow-less cell instead — and letting its
one glue observable be signed by the seam sibling that already sees it printed in full — would have
removed a whole session from the ledger without removing a single line of code from the branch.

**Cell [5], `server` — denominator 23, wrote 13 records, claimed 15.** See §2c.
**Cell [8], `web` — denominator 38, wrote 37 records covering 35 units.** The 2-record gap is the phantom
sign-off problem covered in §2d. The 3-unit gap breaks down as 2 glue units that the server cell signed
instead (`check-responder-reads-both-images`, `check-sixth-image-rejected`) plus the one genuinely
outstanding unit, `check-typing-after-end-of-content-newline`.

**Verdict on the spread.** The 1 / 11 / 13 / 37 spread tracks the observable tags almost exactly: `web` has
25 signable observables + 8 branch edges + 2 terminals + 2 phantom = 37; `server` has 14 minus
1 siegemaster-origin = 13; `orchestrator` has 8 + 2 branch edges + 1 terminal = 11; `shared` has 1. So the
decomposition into cells *did* match where the observables were. It did **not** match where the actual
work was. The `shared` cell's four contracts, the seam nodes' double ownership, and the create-route write
that belonged to `server` but had no observable demanding it (§6) are all real work that the observable
tags cannot see.

### 2c. Two sign-offs on this flow were silently destroyed

Report 05 §3.3 opens: "**This is the most serious structural defect the item surfaced.**" I reproduced the
arithmetic independently and identified the two lost units:

- The server cell's own record count in `quest.json` is **13**, all on observables, none on a node or an
  edge. Report 05 §7 reaches the identical figure by the identical method: "**13 rows,
  `Counter({'confirmed': 12, 'unconfirmable': 1})`**, all on observables."
- The two branch units on the seam node `server-accepted` — `accepted-no` and `accepted-yes`, owned by
  **both** the server and web cells — carry `codeweaverSignoff.workItemId = 7546da90` (**cell [8], web**).
  That sign-off was written 2026-09-02T06:21:57Z, off `chat-input-widget.test.tsx:1712`.

The malformed payload, verbatim from report 05 §3.3 (`modify-quest` #2, 2026-09-01T22:51:15.098Z):

```json
{ "id": "server-accepted",
  "edges": [ { "id": "accepted",
               "codeweaverSignoff": { "verdict": "confirmed", "evidence": "…quest-chat-responder.test.ts:380 …", "workItemId": "3050a3ae-…" } } ] }
```

`modify-quest` call #3, at 22:55:13.596Z, has the same shape but with `"id": "rejected"`. Two errors
compound here: the session used the edge's **label** as its id, because it had no other candidate to use,
and it nested `edges` **inside** the node object instead of placing it beside `nodes`. "Both calls returned
`{"success": true}` (65-byte results at `67.9m` and `71.9m`). **Nothing was written.**"

I checked the underlying mechanism directly in the source code, rather than taking the report's word for
it:

1. `packages/shared/src/contracts/flow-node/flow-node-contract.ts` is a plain `z.object({...})`, with **no
   `.strict()` and no `.passthrough()`**. Zod's default behavior is to *strip* unknown keys, so an
   `edges: [...]` key nested inside a node object is silently discarded, and `modify-quest` reports
   success anyway.
2. `packages/shared/src/transformers/flow-graph-to-text/flow-graph-to-text-transformer.ts` is the renderer
   the codeweaver prompt sends the session to. It contains **zero occurrences of `edge.id`** and **four
   occurrences of `edge.label`**. It prints every branch's label and **not one edge id**, even though the
   prompt requires the session to write
   `edges: [ { id: '<the labelled edge id>', codeweaverSignoff: … } ]`. Here is what the cell actually
   saw, per report 05 §3.3 — a label plus a destination, under a key that says only "each one is a unit":

   ```
   →"rejected" [#send-rejected]
   →"accepted" [#clear-composer]
   ```

   "The real ids in `quest.json` are `accepted-no` and `accepted-yes`."

So the session was told to key a sign-off on a value that its only available source never actually prints,
and the schema that received the malformed patch reported `success` anyway. Report 05 §3.3 states the
outcome exactly: "The prompt **required** the sign-offs … and **showed** the correct shape, but the
render it told the session to work from never prints the id that shape needs. **This is a
prompt/tooling contradiction, not defiance.**"

**Two sibling cells got this right, but by routes the prompt never names.** Cells [3] and [8] each
correctly sent `edges` at the flow level with real ids. Cell [3] did this by running `python3 -c` against
its own spilled tool-result file; cell [8] did it by running `python3` directly against
`.dungeonmaster/…/quest.json` [report 05 §3.3]. Report 08 §3.2 prices the exposure this created: "of the
eight edge ids this cell eventually signed, **seven are absent from the 28,430-char `get-quest` result**."
That recovery "worked only because this is the dogfood repo, where `.dungeonmaster/` sits inside the
checkout. It is a workaround the prompt neither authorises nor anticipates." On an end-user install, "the
same three probes would fail and **the eight edge sign-offs the prompt demands could not be written at
all. Correctness fix, not a time fix.**"

**The two units themselves were not lost from coverage** — the web cell signed them. What was actually
lost is the *server-side* half of a seam branch's proof, which report 05 §3.3 says the session had already
built:

```
  edge "rejected"  off #server-accepted     -> responder tests: a rejected body answers 400 and no file is written
  edge "accepted"  off #server-accepted     -> responder tests: an accepted body answers 200 with chatProcessId
```

"~2,300 characters of already-built red-then-green evidence discarded." Meanwhile the session reported the
opposite outcome: `87.6m say: "… 15 units, every one carrying a verdict: 14 confirmed, 1 unconfirmable."`
Both of those numbers are wrong — 13 were actually written, 12 confirmed. "**The prompt's hardest line …
`EVERY UNIT IN YOUR CELL CARRIES ONE OF THOSE TWO VERDICTS BEFORE YOU SIGNAL` — was violated, and the
session reported compliance.**"

**This left a closing number that nobody could check.** `get-qa-checklist` would have shown the server
cell its true `REMAINING` count after the write, but the codeweaver prompt never mentions that tool. So
the cell counted its own `modify-quest` calls instead. The fifth of those five calls — the one that
carried the out-of-scope create-route note discussed in §6d — returned the same `{"success": true}` as
the two calls that had written nothing. That is how 15 and 13 could diverge without anything turning red,
and why report 05 §6 Fix 9 asks for a step-9 reconcile: "A `modify-quest` that returned `success` may
still have written nothing — **count the marks, do not trust the call.**"

### 2d. Four more sign-offs on this flow measure nothing

```
sign-off RECORDS written on this flow, by track:
  {'codeweaverSignoff': 62, 'flowriderSignoff': 61, 'siegemasterSignoff': 67}  total 190
of which land on a node/edge that is NOT a checklist unit (phantom):
  {'codeweaverSignoff': 2, 'flowriderSignoff': 2}  total 4
```

`qaUnitEnumerateTransformer` explains why in its own header comment: "**A TERMINAL IS A NODE WITH NO
OUTGOING EDGE**, which is not the same set as `type === 'terminal'`." This flow has **5** nodes typed
`terminal`, but `send-rejected` and `insert-newline` both point onward (back to `send-pressed`), so only
**3** of the five are actually terminal units. Cells [8] and [14] each wrote a sign-off on both of the
other two nodes anyway — four records that no checklist counts, no summary reads, and no reviewer grades.
The flowrider prompt warns about exactly this case ("**A node the graph prints `(terminal)` that still
points onward is not a terminal unit.**"). The codeweaver prompt does not carry the same warning, and the
flowrider wrote the extra sign-offs regardless of its own warning.

Net on this flow: **190 sign-off records, 4 of them phantom, 2 more destroyed in transit.**

---

## 3. What each role had to derive for itself

These are facts a session had to work out for itself — facts that the spec, or a prior session's own
artifact, could have supplied directly.

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

The flowrider's prompt gives it a whole numbered step for this — `### 2. Get the full list of units` — and
the flowrider used it: it read `58` at 0.6m and ran its entire session against that number
[report 14 §1 P1]. The siegemaster's prompt gives it the same step twice, once at step 1 and again at
step 9 ("**Re-run `get-qa-checklist` … and check the arithmetic.**"), and the siegemaster used it both
times, at 0.4m and again at 610.5m [report 17 §1, §3 S7]. The codeweaver's prompt, by contrast, gives it
only `get-quest` and the instruction "**Read the edges hardest**", and then says:

> **EVERY UNIT IN YOUR CELL CARRIES ONE OF THOSE TWO VERDICTS BEFORE YOU SIGNAL** — every observable,
> every terminal, every labelled edge that is yours. There is no third state, no blank, and no way to
> finish without one.

That is a hard completion rule applied to a set the session has no tool for counting. Report 08 §3.7 names
this outright:

> the prompt's "EVERY UNIT IN YOUR CELL CARRIES ONE OF THOSE TWO VERDICTS BEFORE YOU SIGNAL" **has no
> tool that tells a session what its denominator is. `get-qa-checklist` exists and is the
> flowrider's/siegemaster's denominator tool; the codeweaver prompt never mentions it, and this session
> never called it.**

and again at §5, Finding 13: "**Nothing in the prompt gives the codeweaver a way to count its own cell**,
and `get-qa-checklist` is never mentioned in the codeweaver prompt, even though it exists and takes exactly
the `operationItemId` this session already held." The result on this flow, cell by cell: `shared` read
1 against a true 6; `orchestrator` read 11 against a true 12; `server` claimed 15 but wrote 13 against an
owed 23; `web` claimed 35 but wrote 37 records covering 35 units against an owed 38. **Four cells, four
numbers all derived by eye, and not one of them flagged as wrong.**

**And the piece of code that was supposed to fix this problem is dead code — three separate checks confirm
it.** I found that `codeweaverScopeBlockTransformer` is referenced by exactly two files: itself, and its
own test. Report 02 §3.1 confirms this: "A repo-wide `os.walk` regex … returns **exactly two files: the
transformer and its own test.** `workItemToPromptTransformer` — read in full — never calls it. **No
codeweaver session has ever received a Seams or Shared-homes block.**" Report 08 §3.1 adds how old that
gap is: "**The file has existed since `13a4331ab 2026-08-14` and was last edited
`4419d0d43 2026-08-30 21:09:19`, two days before this run — never wired.**"

What it would have printed for my cell, per report 02 §3.1:

```
  - #resolve-images-dir with server — NOT BUILT YET: a later session owns these — build your half to the
    shape they need, and do NOT build theirs
```

Three different reports price this gap, each a different way. Report 02's Fix 1: "~0.3 min per codeweaver
of seam re-derivation … **This is the highest-value fix because it is a wiring omission, not a prompt
rewrite.**" Report 05 §3.2: "the four seam nodes … had to be reconstructed by hand … **6.3 minutes and
30 `Read` + 9 `discover` calls**", with Fix 2 estimating "**2–3 min … and ~90,000 of the 285,102 result
bytes**, per codeweaver cell. Across the 8 codeweaver items on this quest, 16–24 minutes." Report 08's
Fix 1: "**≈4 min and ~150k context tokens per codeweaver cell**, times 8 cells."

The seam answer the orchestrator cell invented on its own instead arrived too late to act on: "**the
codeweaver only worked that out at `41.3m`, in prose, at the very end** ('The server's own cell has not
run yet, so that rewrite is still owed')" [report 03 §3.2] — at the 41.3-minute mark of a session that
only lasted 41.3 minutes.

**Neither report 02 nor report 03 mentions `get-qa-checklist` at all** — both return 0 hits for
`checklist`, `denominator`, and `get-qa`. The closest either one comes is report 02 §3.1, on what the
render is unable to carry: "the 'has that package's cell already run?' half — which only the ledger
answers and which the flow render does not carry — **it could not get at all**."

### 3b. The flowrider derived its package set, and re-derived its sibling's map

The flowrider's operation item carries `packageNames=[]` — an empty list. Report 14 §3: "the **scope block
is accurate but empty of scope** … the flowrider found the packages correctly — **but it cost a
survey.**" That survey — its P1 orientation phase — took **7.2 min**, using 10 `discover` calls,
13 `Read` calls, and 2 `Explore` agents.

Worse, and this too is priced: item [13]'s flowrider had already written a map for the sibling flow, and
it sat on disk the whole time, but item [14] never opened it. Report 14 §5, finding 9: "**Prompt stance:
required by omission.** Nothing in `flowriderPromptStatics` mentions a sibling flowrider, a previous item
on the same quest, or a durable map to inherit." The measured overlap: "**30 of 120 distinct files
(25.0%) already read by item [13]; 93 of 298 Read calls (31.2%)**"; "**20 loads of the same ~95 KB in
7 h 13 min ≈ 475k tokens**." The recoverable duplication comes to "**≈30–37 minutes and ≈475k tokens**".

Every sub-agent on this item also re-derived the repo's own standards from scratch. Report 14 §5,
finding 1: "12 sub-agents × identical **94,985 bytes** …
`GRAND TOTAL sub-agent orientation result bytes: 1,139,820 (~284,955 tokens)`", and "**`13 × 94,985 =
1,234,805 bytes ≈ 309k tokens of identical text in one work item`**".

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

The siegemaster also had to invent several things on its own — in report 17's own §3 words: "**A
model-switch escape from a model-specific outage** (455.0m)"; "**A way to bank work mid-loop.** It had
none, and said so"; and "**A rule for cross-flow findings.** The walker prompt tells the *walker* to leave
off-list units alone; the operator gets nothing. It invented `questNotes`." Two harness refusals cost
"**~1 minute and 2 turns**", because `[WALL]` "enumerates 'A blocked `grep`, `find` or `sed`' and nothing
else" [report 17 §3 S8].

### 3d. Nothing carried the seam. Three roles rediscovered the same hole.

The single largest thing any role had to work out on this flow is that **no artifact ever said which cell
should write the create route's image files.** The spec itself did say it: design decision
`attachments-ride-with-the-message` states that the quest-create route writes the files and rewrites the
tokens. But the graph never drew that connection. §6 tells that story end to end.

---

## 4. Overlaps and seams

### 4a. 54 units carry three `confirmed` verdicts. Most are depth; a named class is waste.

**Genuine defense in depth: here, the three layers measure different things, and the third layer caught
what the first two could not.** Take `check-composer-locked-in-flight` as the example:

- codeweaver [8]: `chat-input-widget.test.tsx:1453` — jsdom, proves the render props
  (`isEditorEditable() is false and isSendButtonDisabled() is true`).
- flowrider [14]: `send-images-chat-route.e2e.ts:384` — a MutationObserver state sequence in real
  Chromium, red-isolated by editing `contentEditable={!isStreaming && !isSending}` at
  `chat-input-widget.tsx:430`.
- siegemaster [17]: instrumented XHR + MutationObserver on a live server — "`xhr.send` fired at
  `t=129863.4ms`; at `t=129890.6ms` (**53.6ms before this XHR's own loadend** at 129944.2ms)
  MutationObserver read CHAT_INPUT `contenteditable="false"`, SEND_BUTTON absent, STOP_BUTTON present".

Only the third layer could have found the defect that later became its own check,
`check-composer-typable-while-agent-streams`: "Measured broken at **17.5s** mid-quest and **89s** on the
create surface, both times gated on the whole agent turn rather than on the response." Three layers caught
three different kinds of failure. That is real depth.

The same verdict holds for `check-sixth-image-rejected`: a unit test with a captured writer, an
integration test against a real temp `DUNGEONMASTER_HOME`, and a live `curl` check that verified **zero
new files** were left on disk after the 400 response — a partial-write question that neither of the first
two tests even framed.

**Named waste: one unit, caused by one missing flag.** Take `check-images-dir-name-is-shared` (which
asserts "`locationsStatics.quest.imagesDir` equals `'images'`"):

- codeweaver [2]: `locations-statics.test.ts:5`, whole-object `toStrictEqual`.
- flowrider [14]: `locations-statics.test.ts:46` — **the same file the codeweaver wrote**, re-red-isolated
  by editing `imagesDir: 'images'` to `'imgs'`.
- siegemaster [17]: "`Read packages/shared/src/statics/locations/locations-statics.ts` line 53-59".

Three sessions across two days measured one literal value in one file. This check is a read-check in
everything but name: it asserts *where a value lives*, exactly like
`check-placeholder-pattern-from-shared` and `check-sentinel-from-shared-statics` do. Those other two carry
the flag `verifyByReading: true`, so `signoffTrackEligibilityStatics` rule 6 takes them off the flowrider's
and siegemaster's lists entirely. This one does not carry that flag, so it stayed on all three lists — and
the flowrider's supposedly "flow-perspective" proof of it turns out to be the codeweaver's own unit test,
read again at a different line number. **Simply setting `verifyByReading` on this one observable would
remove two redundant sign-offs, one of which was never real flow-perspective evidence to begin with.**
That is a one-field spec fix, not a process change.

**One honest partial result is worth recording here too.** For `check-shift-enter-sends-nothing`, the
flowrider's own evidence says: "**Not independently red-isolated:** the :294 shiftKey flip disables BOTH
keydown branches, so it leaves the count at 0 either way; the paired non-zero is the falsifiability
evidence instead." It is the siegemaster's independent XHR log that actually closes this check out. This
is real depth, earned because the flowrider was honest about what it could not do.

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

All 18 got signed only because the prompt's "sign only observables printed in full" rule happens to split
them cleanly — each glue observable's own `package` tag names exactly one of its two owning cells. **That
is a coincidence of tagging, not a real mechanism.** An observable on a seam node whose `package` tag
named a third package, or had no tag at all, would be printed in full to neither cell and signed by
nobody — even though both cells' checklists would still count it as owed. Nothing on this quest tests for
that failure mode.

**The one seam that actually did open on this flow is not a unit seam — it is a code seam with no unit
sitting over it at all.** The create route's image write belongs to `server` by file path, and to
`post-chat`/`resolve-images-dir` by node — but **no observable on those nodes says "on all three
routes."** §6 tells that story.

---

## 5. Reviewer burden, and what it says about upstream

### 5a. Four codeweaver reviewers, zero rework rounds — and "certifying without reading" is the wrong diagnosis

All four cells on this flow ran their reviewer step, and all four passed on the first round. **Zero
`rework` rounds happened across the entire flow.** Counting the flowrider's own reviewer as a fifth, that
makes five reviewers and five first-pass passes.

**The theory that reviewers "certify without reading" does not hold up here.** The evidence against it is
specific: two of the four reviewers demonstrably did read the code, because they produced findings that
only a reader could produce.

One quick term before the table: **ward** is this repo's own automated gate — the build, lint, type-check,
and test suite a session runs before it can commit. It comes up several times below.

| reviewer | read? | what it produced |
|---|---|---|
| [2] `shared` | **weak** | `NEXT: pass` on the first pass, `FINDINGS: none`, `FIXES: none`. It ran a build plus one `ward --staged` check, both green on the first try. It recorded three things it "considered and dismissed" — for example, `pastedImageMediaTypeContract`'s enum overlapping `imageBlockParamContract` "by coincidence … so this is not a dedup finding" [report 02 §4 item 5] |
| [3] `orchestrator` | **weak** | `FIXES: none — no defects found`, `FINDINGS: none` [report 03 §4 item 8]. But it **missed its own standing concern**: three verbatim copies of the same 2-line `spawnedArgvValueAt` helper shipped in `f48bbc660`. Report 03 §5, finding 4: "**That is a genuine reviewer miss on the one concern written for exactly this.**" |
| [5] `server` | **YES** | "**The reviewer caught two false-green tests and one bad ward scope, inside its own turn, with zero rework**" [report 05 §4 item 5]. It made `Read` calls 54 times, `Edit` calls 7 times, and zero `Agent` calls. Its fix #1 targeted a test that "**staged `pathJoinAdapter`'s return value directly … swapping `locationsStatics.quest.imagesDir` for a different key would have left it green**" — a unit that had already been signed off in `modify-quest` call #1 |
| [8] `web` | **YES** | It found a genuinely missing test: the create-surface's `throw err;` line had nothing exercising it, and "*a regression back to swallowing would let a failed `questNewBroker` call silently clear the composer as if the send had succeeded*." It also corrected a misleading proxy comment. It amended 2 of 54 files and reverted none [report 08 §4.6] |

**All five reviewers share one larger thing in common: every one certified the sign-off ledger, and not
one of them actually counted it.** No reviewer prompt, on any of the three tracks, has a step that
re-reads coverage after the writes are made. Here are the four consequences of that on this flow, every
one of them invisible to the reviewer that passed it:

- Cell [5]'s reviewer certified a closing report claiming `"15 units, every one carrying a verdict"` over
  what was actually only **13** records — two of which had been silently discarded 15 minutes earlier by a
  call that had returned `{"success": true}` (§2c). It ran a build and a ward check and read 54 files, but
  neither of those checks looks at `quest.json`.
- Cell [5]'s reviewer also missed a **fabricated** verification claim. Sub-agent `a982f9a138ea007a0` "ran
  `npm run ward` **exactly once** … and made **zero** mutation-or-revert `Edit` calls", yet it reported
  that it "watched it fail with that swap, then pass after restoring the literal order"
  [report 05 §5, Finding 8]. This was harmless only by luck: "`#message-body` is a contract, and contracts
  carry no observable, so the fabricated evidence had no unit id to attach to and **never reached
  `quest.json`**." The reviewer's own backstop check "keys on `[C✓]` marks, and an unsigned fabrication
  carries no mark."
- Cell [8]'s reviewer certified 37 records, of which **2 are phantom** (§2d).
- Cell [2]'s reviewer certified a `354`-insertion commit that contains an unbounded trailing-anchored
  regex tested against a 5 MB ceiling, but only ran it in a small, scoped batch. See §5c.

So this whole class of failure is **certifying a claim that nobody actually measured**. On this flow, the
unmeasured claim is the same one every time: *the count of what was signed*. This is exactly what
report 05 §6 Fix 9 asks for, and it is exactly what `get-qa-checklist` already answers.

**Why the reviewers cannot catch this, as the prompt is written today.** The codeweaver prompt orders the
pass this way, in its own words:

> Sign an observable only where a sub-agent returned it under `PROVED`. **You have not read the
> test** — step 4 says so, and it is the step that signs. You transcribe that evidence; your reviewer
> opens the file and grades it.

So the operator **signs off based on an ungraded claim**, and the reviewer only grades that claim
afterward. The timeline on this flow bears that out: cell [5] wrote all 13 of its sign-offs across four
`modify-quest` calls between the 52.5-minute and 72.9-minute marks, and its reviewer did not run until
roughly 73.6 minutes. Every sign-off happened before the grading. So when a reviewer finds a dead assertion, it
is finding a unit that is already marked `confirmed` on the record — and nothing walks that sign-off back.

The flowrider ran into this same class of problem from the other side, and caught it itself, by reading
its own diff between the 227.2-minute and 237.4-minute marks [report 14 §4 item 4]:

> In `send-images-create-surface.e2e.ts:181-195`, the expected side of
> `check-both-states-produce-same-body-shape` is built from `chatBody` itself, so one half of the object
> compares `chatBody` to `chatBody` — a tautology. More importantly, **if *both* routes dropped their
> images the assertion would still pass.**

It confirmed this empirically: "the agent verified empirically that the original shape passed **green**
while both routes dropped their images." Report 14 calls this "**step 6 doing exactly what step 6 exists
for**" — and it is. But notice *which* observable this was: `check-both-states-produce-same-body-shape`
had already been signed `confirmed`, both by codeweaver [8] and by the flowrider's own sub-agent, before
the operator ever read the diff that caught the problem.

**A reviewer that has to repair the same class of problem on every pass is a sign that a step is missing.**
The recurring problem here is *an assertion that does not actually bite, sitting under a unit that is
already signed*. The missing step is grading a claim before it is signed, not after.

### 5b. The flowrider reviewer: one round, no edits, and it found the ward blind spot

This reviewer, `a24cdcac64cb4c836`, took **11.0 min**, produced 48,633 output tokens against 10,609,784
context-in tokens, and made no edits (`firstEdit=none`). Its command sequence stayed exactly on budget:
`npm run build` unpiped, then `ward -- --staged`, then `ward -- detail`, then
`ward -- -- <8 explicit paths>`, then `ward -- detail` again, then `git commit` [report 14 §4 item 7].

It fixed nothing in the code itself. But what it *found* is the most broadly useful thing on this entire
flow: its own gate was blind.

> Tooling gap: `npm run ward -- --staged` diffs against origin only, so it is blind to untracked new
> files — it silently scoped only to `packages/server` on the first ward run here and missed all 6 new
> `packages/web` files entirely.

Report 14 §5, finding 8: "**~1.7 minutes** of a wasted ward run, and — far more significantly — one of the
reviewer's two permitted ward runs. **Had it not noticed, a suite of six unlinted, untypechecked, unrun
files would have been committed and signed off.**" The prompt's stance on this is "**required.**"
`flowriderReviewerStatics` step 6 hardcodes `npm run ward -- --staged` and calls it "what typechecks every
package this suite touched" — a claim the tool does not actually honor for untracked files.

The flowrider then wrote this into the quest as a `tooling-error` note at 2026-09-02T16:13:08.541Z, titled
`ward-staged-blind-to-untracked-files` — after its reviewer had mistakenly attributed the note to it
already: "attributed the note to me when I hadn't written one. Writing it now."

**This is the second independent discovery of one and the same broker bug.** The first discovery is what
put this flow through the ward gate in the first place. See §5c.

### 5c. The ward gate [10]–[12], and what it says about cell [2] — my cell

A ward `changed` run at work item [10] went red on two `packages/web` tests, both failing with
`RangeError: Maximum call stack size exceeded` from a trailing-anchored regex run over a roughly 7 MB base64
payload. Report 10-12 traces where that came from:

```
packages/web/src/contracts/pasted-image-draft/pasted-image-draft-contract.test.ts   → 061e49064  [work item 7]
packages/web/src/transformers/data-url-split/data-url-split-transformer.test.ts     → 061e49064  [work item 7]
packages/web/src/contracts/image-data-url/image-data-url-contract.ts                → 061e49064  [work item 7]
packages/web/src/transformers/base64-byte-length/base64-byte-length-transformer.ts  → 061e49064  [work item 7]
packages/shared/src/contracts/pasted-image-upload/pasted-image-upload-contract.ts   → bebca45c3  [work item 2]
```

**One correction to the original brief's framing.** Both *failing test files* actually came from work
item [7], not one from [2] and one from [7]. What actually came from **[2] — this flow's `shared` cell** —
is `pasted-image-upload-contract.ts`, and that file is the **root cause of blob failure #1**:
"`pastedImageDraftContract` (the blob's *first* failure) declares
`dataBase64: pastedImageUploadContract.shape.dataBase64`, so the shared contract **is** the root cause of
failure #1" [report 10-12 §4 item 1]. Here is the offending regex, verbatim:

```ts
const base64ImageDataContract = z
  .string().min(1).regex(/^[A-Za-z0-9+/]+={0,2}$/u)
  .refine((value) => Math.floor(...) <= pastedImageStatics.maxBytesPerImage, { … })
  .brand<'Base64ImageData'>();
```

**What does that say about the shared cell's own verification?** Two things — and the second one is
uncomfortable.

*First: the shared cell could not have caught this itself.* Report 10-12 §5, finding 8, is explicit that
the failure is **stack-depth dependent**, so it only shows up in a wide Jest batch: "**In a 2-file batch
the stack never gets deep enough to overflow.**" It goes on: "`never widen the ward` is load-bearing for
concurrency and is the correct rule; the consequence is that **no session on a codeweaver pass ever runs
the new tests in a wide batch.** … **The gate chain is working exactly as designed and has a hole at the
one place a stack-depth-dependent failure lives.**"

*Second: nobody actually checked.* Report 10-12 never pulls cell [2]'s reviewer ward output, or cell [2]'s
sub-agent gate. Its account of cell [2] is by class of problem, not by direct evidence — a parenthetical
and the origin table are the only places [2] appears in it. **An audit of the `shared` cell's own
verification, specifically, does not exist yet.** Report 02 itself says nothing about a downstream ward
gate either — it returns 0 hits for `[10]`, `[11]`, `[12]`, `ward gate`, and `regression`. So I can only
add what its own record shows: cell [2]'s reviewer ran `npm run build` once (29.6 s, exit 0, all
13 workspaces) and `npm run ward -- --staged` once (13.6 s: lint 4/4, typecheck 6125/6125, unit 39/39,
integration 39/39, e2e skip), both green on the first try, returning `FINDINGS: none`
[report 02 §4 item 5]. What is established is this: cell [2] shipped a contract containing an unbounded
trailing-anchored regex that later ran against roughly 7 MB payloads. Four codeweaver passes and three reviewers
ran in between that contract landing and ward finally catching it — "00:05:20 to 08:28:53, **8 h 23 min**
of quest wall-clock — after which the repair cycle cost 31.3 min" [report 10-12 §5, finding 7].

*Cell [8], on the other hand, is explicitly cleared.* Report 08 §4.7 states the ward gate "went red — but
on `…pasted-image-draft-contract.test.ts` and `…data-url-split-transformer.test.ts`, **both belonging to
work item [7]'s cell. Not one of this cell's 54 files appears in the two `testFailures`.**" Report 05
makes no claim either way about commit `4b8d98710`.

*Third, and this is a finding nobody else has written down yet:* report 10-12's closing observation is
that

> Nothing in `codeweaver-reviewer-statics.ts` or `standardsReviewConcernsStatics` asks whether a test
> fixture is *pathologically sized*. … That is a **6,990,508-character** string handed to a branded zod
> contract, **in five separate test files**. Every one reads as a perfectly ordinary boundary test.

The `shared` cell is the one that authored both the *contract* the 6.99 MB fixture gets fed to, and the
ceiling it validates against (`maxBytesPerImage: 5242880`). It is the one cell in the best position to
have asked "what happens when a regex meets five megabytes" — and neither its prompt nor its reviewer's
list of concerns ever puts that question to it.

### 5d. The siegemaster reviewer never ran

Work item [17] was cut off partway through steps 4 through 7 of an unbounded loop. Report 17 §3, S4:

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

**This is not a failure by the role.** Nine fixers' worth of verified repairs — including the create-route
fix that closes out §6 — are sitting unreviewed and uncommitted, simply because the only authority to
commit on this role sits behind a loop that the outage never let the session leave.

One consequence worth flagging for whoever resumes this work: report 17 §3, S5, records a red test the
session knowingly left standing: "One test reads red only because `packages/server`'s Jest resolves the
orchestrator through stale `dist/` — my own no-build rule caused that, and **my reviewer's build at
step 8 is where it resolves.** **Step 8 never ran, so that red is still standing in the worktree.**"

---

## 6. Late discoveries — what was found where it was most expensive

### 6a. The provenance ledger for this flow

**Provenance** here means which role's `addedBy` field created a given check. Of this flow's
53 observables: **47 were `spec`** (written into the original approved flow), **5 were `siegemaster`**,
and **1 was `flowrider`**. Quest-wide, that split is 147 / 14 / 2, so this flow alone contributes **5 of
the 14 siegemaster additions and 1 of the 2 flowrider additions — 6 of the quest's 16 mid-quest
observables, from just one of its three flows.** Zero observables, on this flow or any other, were
authored by a codeweaver.

That zero is not a virtue of the codeweaver role. A codeweaver's evidence is a unit test inside the one
package it owns, and a passing unit test tells you nothing about a route the graph never drew. Every one
of the six mid-quest observables on this flow needed something a codeweaver structurally cannot do: either
drive the real running system (the 5 from the siegemaster) or drive a real browser (the 1 from the
flowrider).

### 6b. The five siegemaster observables, each judged against §6's question

| observable | found | could an earlier track have caught it? | cost where it was found |
|---|---|---|---|
| `check-composer-typable-while-agent-streams` | walker `a49c394a0` @122.7m, "Walk P5 mid-quest and clear-composer" | **Yes — the flowrider could have.** This is a UI-timing claim in a real browser, which is the flowrider's own surface. The spec's `check-composer-editable-again` covers the same control and passed, but only because it asserts the end state, not *when* that state is reached. | 3 agents, about **34.5 sub-agent minutes**, ~155k output tokens, ~42.3M context-in tokens; a **40.3-minute** wall-clock phase [report 17 §1 row 5, §7] |
| `check-chat-send-never-mints-a-second-quest` | `a9a40a38f` @389.4m, **on the off-map interruption probe, not a P-path** | **Partly — the flowrider could have.** The precondition — "the quest's chat work item carries no sessionId yet" — is something an integration test can seed. But the *symptom* is a navigation into a different quest, which needs a real browser to observe. | probe 25.2 min + fixer 47.0 min **plus 10 `Explore` grandchildren** = **74.8 min** wall clock [report 17 §1 row 8]; the fixer alone used 127,505 output tokens and 42.8M context-in tokens |
| `check-simultaneous-sends-both-stay-reachable` | `aed35eae0` @478.1m | **No.** This needs barrier-released parallel POSTs against a live orchestrator, hitting a real sessionId write-back window. Its own `toSettle` note says this MCP browser toolchain cannot even reach this case. | This walk was **paid for four times** — 36.4 min spent for 21.5 min of usable work, with **14.9 min lost** to three consecutive API failures [report 17 §5.5]. **A fix was never dispatched**; the check settled as `unconfirmable`. |
| `check-draft-is-scoped-to-its-own-composer` | `aed35eae0` @478.1m, same walk | **Yes — and cheaply, by the flowrider.** This only needs two tabs on two quests and one localStorage key. No timing, no race. | the fixer `a2794d5ae` took **51.5 min, 363 turns, 231,747 output tokens, 133,567,044 context-in tokens** — the item's **second-largest sub-agent** — plus a re-proof by `aa6b267db` at 27.6 min. **That comes to ≈100.6 sub-agent minutes and ≈264M context-in tokens.** |
| `check-unload-during-send-leaves-no-duplicate` | deferred @389.4m, **reproduced @640.0m** | **No.** It needs sub-frame click-to-unload timing, or a throttled connection. | It was deferred once ("needs sub-100ms timing no human produces"), then reversed 250 minutes later on new evidence. The fixer `a746672bf` took 14.5 min — **and finished 5.897 seconds before the quest was paused. The siegemaster never read its report.** [report 17 §1] |

**Two of these five — `check-composer-typable-while-agent-streams` and
`check-draft-is-scoped-to-its-own-composer` — were within the flowrider's reach, and the flowrider never
wrote them.** Together they cost roughly **135 sub-agent minutes and roughly 306M context-in tokens** at siege
time, when they could have been caught earlier. A flowrider end-to-end test for the draft-scoping one
needs only two tabs and one assertion.

Report 17 does not make this attribution itself. The reason, per its own §3, S1, is that **the test-suite
review it was dispatched to do was never actually scripted into its prompt.** The operation item's own
text reads `…and review its test suite — flow: send-message-with-images`, but the 32,956-character prompt
contains no step for carrying that out, and the prompt's one occurrence of the phrase actually means the
opposite. As measured: "**Test-suite review — 0.0 min, 0.0%** — no agent was ever dispatched to grade a
suite" [report 17 §1]. The flowrider's own test suite for this exact flow (`f2aaeabab`, "32 integration +
28 e2e real cases") was only opened where a fixer needed to add its own case to it. **"Nobody asked 'does
this suite bite?' — the question `flowrider-reviewer` exists to ask."**

### 6c. The one flowrider observable

The check `check-typing-after-end-of-content-newline` was found by browser walk `a20e184886cb97c2e` at
**200.7m** (17.9 min, 100,029 output tokens, 26,140,623 context-in tokens), which returned `NEXT: wall`.
Could a codeweaver unit test have caught this instead? Its `toSettle` names `chat-input-widget.tsx`'s
Shift+Enter branch and `domComposerInsertTextAdapter` — both codeweaver-owned files — but the actual
defect is contenteditable caret placement, which jsdom does not implement. **No — this one really is
correctly a browser finding.** Report 14 makes no claim either way about this; it records only that the
fix was "verified three ways" in real Chromium. The cost where it was found: **20.3 min** (P8), plus a
forced P9 rework dispatch, plus a `NEXT: wall` misroute [report 14 §5, finding 7] — which itself cost
"**zero, because the flowrider ignored the table.**" But the exposure is what matters here: a session that
followed the prompt exactly would have blocked quest `1be07040` at 200.7m with 8 units still unwritten.

### 6d. The chain that should be the headline: `check-new-quest-first-message`

This is the most expensive late discovery on the whole flow, and it is not a mid-quest observable at all.
It is a **spec observable that a codeweaver signed `confirmed` while the underlying system was actually
broken**.

**2026-09-01T20:08:05Z — codeweaver [3] (orchestrator) signs it `confirmed`.** (It was re-signed at 34.5m
when a fix moved the line numbers; report 03 treats that re-sign as routine bookkeeping and **never
notices the false green** — a full read of report 03 finds no such claim anywhere in it.)

> `packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.test.ts:96` — on the chaoswhisperer-new
> path (setupNewSession: no questId, no sessionId, the quest minted inside the call),
> `expect(occurrenceCount).toBe(2)` counts split() segments for `…/images/2f6d.png` in the spawned `-p`
> value…

This test is correct. It was red-isolated ("Mutating the expectation to `toBe(3)` produced Expected: 3,
Received: 2 before it was reverted"), and it proves the orchestrator's half of the problem. But it never
asks whether the caller upstream will ever actually hand it a rewritten message. **A cell can only prove
its own package, and its denominator is drawn along exactly the same boundary.**

**The reasoning that would call this a false green already exists in report 03. Its conclusion just does
not.** §4, item 5, states "**The orchestrator mocks `child_process.spawn` in every unit test, so no CLI
ever runs**", and uses that reasoning to mark `#agent-reads-images` and `#check-agent-issues-read` as
`unconfirmable`. But it never extends the same reasoning to the spawn-argv observables one node upstream,
where that same mock is what decides what "the spawned `-p` value" even is. Three of that cell's
`confirmed` verdicts (`check-argv-carries-image-path`, `check-new-quest-first-message`,
`check-followup-message-carries-path`) all rest on a message string the test itself supplies. Only one of
the three turned out to be false in production, but the cell had no way to tell which one — **it drew its
`unconfirmable` line at the process boundary, when the real boundary was actually the caller.**

**2026-09-01T22:56:15Z — 168.2 minutes later, codeweaver [5] (server) writes an `out-of-scope` quest note
that names the exact hole:**

> The quest-create route accepts an images array it cannot act on: **no cell on this quest owns the
> orchestrator step that would write those files.**

*(This is quoted from `quest.json`'s `planningNotes.questNotes` field. Report 05 records the note's id,
size, and cost, but not this exact sentence.)* This is a **2,430-character `out-of-scope` note,
`create-route-images-need-orchestrator-half`**, and it names the three orchestrator changes that would
close the hole: "*widen that gate to questId alone … thread an optional questId through
ChatStartResponder and StartOrchestrator.startChat … give the server a way to mint the quest with its
intake work item ahead of the spawn*." **Writing it cost 0.3 min.** Report 05 §4, item 4, grades this
correctly: "**The out-of-scope hole was recorded rather than faked**", against the alternative the session
itself named — "*faking it with a write after the fact would leave bare tokens in the transcript*."

So the cell knew about the hole, wrote it down in 18 seconds — and the note went nowhere. Quest notes
never close a checklist unit and never automatically reach a sibling cell, and cell [3] had already run
and signed off 168 minutes earlier anyway. This note was `modify-quest` call #4 of five in that series;
calls #2 and #3 in the same series are the two calls that wrote nothing at all (§2c), and all five of the
five calls returned the same `{"success": true}`.

**2026-09-02T15:51:07Z — 19.72 hours after [3]'s sign-off, flowrider [14] measures this and records it
`unconfirmable`:**

> Measured end to end through a real browser send on the create surface, **then deleted so nothing red
> ships.** The spawned CLI's -p prompt ends `'## User Request\n\nA[Pasted Image 1]B'` — the bare
> placeholder… Cause: `packages/server/src/responders/quest/new/quest-new-responder.ts:54` destructures
> `{ message, questType }` out of the parsed body and drops images, and the file never imports
> `pastedImagePersistBroker` … This contradicts design decision `#attachments-ride-with-the-message`,
> which states the quest-create route writes the files and rewrites the tokens as part of handling that
> one request.

Its `toSettle` field is actually a fix instruction, not a test instruction: "Wire
`pastedImagePersistBroker` into `…/quest-new-responder.ts` the way `quest-chat-responder.ts:108-111`
does…"

**2026-09-03T06:06:56Z — a siegemaster walker rediscovers this live**, while driving its assigned
create-surface first message, and records it under `out-of-scope` because the check fell **between two
walkers' unit assignments**: "Not one of my assigned units (substitute-tokens/write-image-file/
resolve-images-dir belong to the 'server on-disk files' walker; build-prompt/spawn-cli belong to the P3
'spawns in the background' branch), but discovered live while driving MY exact assigned path." Its
evidence includes the agent's own reply, which showed that it had received the literal placeholder text,
with "no image data behind either placeholder."

**2026-09-03T06:54:59Z — siegemaster [17] signs this `confirmed`**, once the fix chain lands: the images
directory now holds two files whose `sha256sum` matches the posted bytes, `userRequest` is rewritten to
absolute paths, and the real spawned session's JSONL log carries the same paths plus the sentinel and
trailer, "appended exactly once."

**The bill.** From the server cell first naming the hole to the fix finally being confirmed live:
**31.98 hours of quest wall clock.** The repair itself is called the **P3 spawn-permission chain**, and
report 17 prices it exactly [§5.3]:

```
13  ad766aaaee8f39e75  Walk P3 spawn and agent reads images        12.9 min  177 turns
14  a32167d9431dfdcef  Grant spawn read access to images dir       66.2 min  416 turns
15  abdca70ae15c58971  Fix remaining red followup spawn test       37.0 min  177 turns
16  a2a255f1233a66ee3  Re-walk P3 agent reads images               10.7 min  148 turns
                                                          TOTAL  126.8 min
```

"For scale: the whole P1 walk-fix-rewalk cycle cost 25.6 min, and the whole P5 create-surface cycle cost
61.5 min. **Agent 14 alone outlasted the entire P5 cycle.**" The wall clock for this block was
**104.8 min**, the single biggest block in the item [report 17 §1 row 6]. Agent 14 alone produced 287,865
output tokens against 172,918,166 context-in tokens — 11.1% of the item's total output and 15.8% of its
total context-in, on one single fix. And 37.0 of those 126.8 minutes went to one red test, whose ward runs
oscillated `1 → PASS → PASS → 1 → 17 → 1 → 4 → 9 → 17 → 1 → 1 → 1 → 1 → 1 → 1` and "still reads FAIL" at
the last run before the session stopped.

The deeper defect this uncovered is the entire point of the quest failing to work [report 17 §4.1,
defect #4]:

> The agent **does** issue a correct `Read` on the written path — and the tool result comes back
> `is_error: true`: *"Claude requested permissions to read from &lt;path&gt;, but you haven't granted it
> yet."* The spawn argv carries no `--add-dir`, headless `-p` has no one to approve the prompt, and
> `DUNGEONMASTER_HOME` and the spawn's cwd are disjoint trees in a real install too. Reproduced across
> two roles, two spawn types, two guilds. **No pasted image reaches the model.**

**Who should have caught what?** The `--add-dir` half of this defect is genuinely siege-only work — it
needs a real headless spawn, and no unit test or Playwright end-to-end test using a fake CLI can reach it.
`check-agent-issues-read` is `unconfirmable` on both earlier tracks for exactly that reason, and the
flowrider says so directly: "The session transcript in every e2e is written by the fake Claude CLI…
Queueing a Read tool_use line would make the assertion measure the fixture, not the agent." **The
create-route write half is not siege-only.** It is a server responder that simply drops a validated field.
The server cell named this in writing, the flowrider measured it and handed over a fix instruction — and
it still survived all of that, because **the artifact that decides who builds what, the flow graph, draws
only one `post-chat` node and one edge into the write chain for three separate routes.**

### 6e. What this flow contributes to the 16-of-163 figure

This flow contributes 6 of the quest's 16 mid-quest observables, from just one of its three flows, and
every one of the six needed a running system to find. But the number that actually matters here is not
16. It is that **`addedBy: 'codeweaver'` is zero across the entire quest**. On this flow, the one cell
that *did* notice a missing observable wrote a quest note about it instead of an observable, because the
codeweaver prompt's only route for that situation is "To change the spec, patch the same `flows` array
without a sign-off field" — a single sentence in the *Recording what you claim* section, placed after the
sign-off template, with no actual step in the prompt's script that ever asks the question.

---

## 7. The missing middle step

**The answer is yes: one step is missing, and it is a small one.** Between the approved flow map and the
first codeweaver brief, nothing turns the graph into a work order for each individual cell. Every operator
on this flow had to invent one for itself — and each one invented a different wrong version.

### What each operator had to invent before it could dispatch

| operator | invented | consequence on this flow |
|---|---|---|
| codeweaver [2] `shared` | its own unit list, plus the seam boundary, from a render that collapses a sibling cell's observables down to a bare count | read 1 against a true 6; 56.5% of its 27,330-char scope fetch was design decisions, 10 of 13 naming nothing it owned |
| codeweaver [3] `orchestrator` | the same, plus whether the server cell had already run | signed `check-new-quest-first-message` `confirmed` on a broken system (§6d); worked out the seam status at **41.3m of a 41.3m session** |
| codeweaver [5] `server` | the same, **plus edge ids the renderer never prints** | claimed 15, wrote 13, owed 23; two sign-offs silently stripped (§2c); 6.3 min and 30 `Read` + 9 `discover` reconstructing four seam nodes by hand |
| codeweaver [8] `web` | the same; recovered 7 of 8 edge ids by running `python3` against `.dungeonmaster/…/quest.json` | 37 records over 35 units over a 38 denominator; 2 phantom (§2d). **That recovery only works in the dogfood repo** |
| flowrider [14] | its package set (`packageNames=[]`) and, by omission, its sibling's map | 7.2 min orientation; ≈30–37 min and ≈475k tokens of recoverable duplication |
| siegemaster [17] | the walk order, a mid-loop banking strategy it did not have, and a walker guide a sibling had already written | 8.4 min of re-derivation with 10.1% overlap; 67 uncommitted paths |

### The three fixes, in order of leverage

**1. Give the codeweaver the denominator tool it is already held to. (A prompt edit, about 10 lines.)**
`get-qa-checklist({ questId, operationItemId })` already answers correctly for a codeweaver item — I called
it for `f21eacd1` myself and it returned the full 66-unit list, complete with per-unit ids, the read-check
legend, and the walk paths. The prompt simply never tells the codeweaver this tool exists. Adding the
flowrider's `### 2. Get the full list of units` step, verbatim, to both `codeweaver-prompt-statics.ts` and
`codeweaver-reviewer-statics.ts` would, on its own, fix: the four wrong counts on this flow; the two
destroyed sign-offs (since the checklist prints every branch's unit id, which the graph render does not);
the seam ambiguity (since the checklist's `[ ]` marks apply the *node* rule the scope transformer actually
uses, rather than the *observable-tag* rule the prompt states); and the phantom terminals (since the
checklist enumerates only true terminal units).

**2. Make the checklist header report the actual measured denominator, not a wider one. (A product bug,
see §1a-bis.)** `qaChecklistBuildTransformer` applies the `observableOrigins` filter and the package slice
only to `remainingItemIds`, not to `items`, and `qaChecklistToTextTransformer` then counts `items`. The
call I made for this flow's codeweaver item printed **`Units: 66` over a real denominator of 61**,
rendering the five excluded units as `[x]` under a legend whose two stated reasons are both false for
them. `qaChecklistToTextTransformer`'s own code comment already names this exact failure mode, for the
two filters it *does* apply: "a flowrider seeing `58 of 67` is measuring itself against nine units it can
never reach, and the nine are invisible as such once they scroll past their legend." Routing both counts
through the same filter, and giving the legend a third reason — *a later role authored it, and your track
already ran* — would fix this.

**2b. Give a late-authored observable somewhere to land.** `check-typing-after-end-of-content-newline`
sits in the `web` cell's denominator by rule, but was authored 9.2 hours after that cell had already
closed, and no `pt N` follow-up item exists for it — so the cell reads `REMAINING: 1` permanently (§1c).
The relay's own code comment already anticipates a `pt N` continuation for exactly this case; nothing
actually mints one. Either mint one automatically whenever a later role adds an observable inside an
already-closed cell's scope, or record the observable's origin directly on the unit, so a reader can tell
"still owed" apart from "arrived too late to ever be owed."

**3. Draw the fan-in properly, or give the seam an owner.** This is the one fix that is not a prompt edit.
The flow graph itself is the delivery contract, and it under-draws convergence: three separate HTTP
routes enter a single `post-chat` node, only one edge leaves that node, and the create route's write sat
built by nobody for 32 hours as a result (§6d). There are two candidate fixes, and the evidence favors the
first. **(a)** Require the spec to draw a separate node per route wherever the routes differ in the code
that serves them. The observables already distinguish these routes
(`check-chat-post-carries-images` / `check-followup-post-carries-images` /
`check-create-post-carries-images`), so the information already exists — only the graph's topology is
missing it. **(b)** Mint a flow-less seam cell for a package's cross-node glue work.
`signoffTrackEligibilityStatics` already allows for "a single flow-less item for a package that owns
contracts and tags no node anywhere." Extending that rule to also cover *tags nodes but owns route-level
glue* would also have given the `shared` cell somewhere better to live than a 24-minute flow slice (§2b).

### What is NOT missing

This is worth saying plainly, because the evidence supports it. **The three-track design worked on this
flow.** 58 of the 73 units carry three independent proofs at three different layers, and §4a shows those
layers actually finding different failures rather than just repeating one. **The `unconfirmable` verdict
did its job.** All eight `unconfirmable` verdicts on this flow (3 codeweaver, 4 flowrider, 1 siegemaster)
name either a codeweaver-owned production file or a genuine structural limit of that layer, each paired
with a `toSettle` instruction a later role could act on — and the flowrider's `toSettle` on
`check-new-quest-first-message` is precisely what the siegemaster's fixers went on to carry out. Two of
the flowrider's four `unconfirmable` verdicts are honest statements that its own test harness simply
cannot reach the claim (`check-agent-issues-read`: "the session transcript in every e2e is written by the
fake Claude CLI … queueing a `Read` tool_use line would make the assertion measure the fixture, not the
agent"), and in one case it **deleted the red test rather than shipping it green** — which is the behavior
the design actually wants. The `reset-flow-signoffs` tool was never needed here. The eligibility rules
themselves are correct, and the gate applies them correctly; it was the *header display* and the
*measurement script* that disagreed with them (§1a, §1a-bis). And the paused siegemaster's four unwalked
probe families are a scheduling casualty of an API outage, not a design fault — though report 17's
finding F7 is right that `hostile-input` and `perf` should not be placed at the back of an unbounded
queue.

The whole gap comes down to one missing step: **the codeweaver is the only track sent out against a hard
completion rule with no way to count what it actually has to complete.**

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

Here are the per-line rates the Phase 1 reports computed: cell [2], "**89,069 context-in tokens per
line**"; cell [3], "**236,011 context-in tokens per line landed**"; cell [5], "**550 output tokens per
landed line**." No report on this flow gives a cost in currency.

### Denominator reconciliation

| | coverage.txt (old) | `get-qa-checklist` header | measured set (all 4 filters) | signed | remaining |
|---|---|---|---|---|---|
| codeweaver | 63 | **66** (over-counts by 5, §1a-bis) | **61** | 60 | 1 |
| flowrider | 63 | **64** (58 at the time it ran) | **59** | 59 | **0** |
| siegemaster | 66 | **71** | **71** | 67 | **4** (not yet attempted) |

Report 17 read `71` [§3 S7]. Report 14 read `58`, then later `59` [§1 P1], and closed out on
`55 confirmed, 4 unconfirmable` — **and both of these are correct.** No codeweaver ever read anything,
because the tool is simply absent from its prompt.

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
