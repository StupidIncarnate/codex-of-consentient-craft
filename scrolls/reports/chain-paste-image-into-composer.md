# Chain audit — flow `paste-image-into-composer`

**Quest** `1be07040-b9ec-476c-a439-0b4fbb0123cd` · **flow** `paste-image-into-composer` (runtime) ·
**the control case for the audit.**

This is the only flow on the quest where all three verification tracks ran to completion: codeweaver
[7], flowrider [13] and siegemaster [16] each reached `signal-back complete / done`. Nothing in this
report is qualified by the paused-quest caveat, and where I compare against
`send-message-with-images` I compare only against its **codeweaver** cells, which also completed.
Its siegemaster [17] was cut off mid-loop by an API outage and `render-images-in-transcript`'s
siegemaster was never dispatched — both are **not yet attempted**, and neither enters any judgement
here.

The short answer to the phase question, stated up front and defended in §7: **nothing is missing
between the approved flow map and the first codeweaver brief. The missing step is at the other end
of the chain, and the evidence for it is that the last role on the relay authored nine observables
the first two were never measured against — and then wrote the automated tests for them into the
first two roles' own files.**

---

## 0. The flow as approved

Verbatim from `python3 scripts/quest-forensics.py coverage 1be07040-b9ec-476c-a439-0b4fbb0123cd`:

```
paste-image-into-composer  (runtime)  Paste an image into the chat composer
  nodes 20 {'state': 2, 'action': 6, 'decision': 5, 'terminal': 7}
  edges 25 (14 labelled = signable branches)
  observables 50   off-map families 7
  package tags on nodes: {'web': 20}
  entry Ctrl+V while the chat composer (CHAT_INPUT) has focus  exits ['Composer holds text plus inline thumbnails, ready to send', 'Plain text pasted, composer unchanged otherwise', 'Paste refused by a toast, nothing inserted', 'Thumbnail deleted like text, surrounding text intact', 'Text and thumbnails both restored after a reload', 'Full-size overlay open from the composer']
```

Every one of the 20 nodes tags exactly one package, `web`. That single fact determines the shape of
the whole chain: it produces **one** codeweaver cell where `send-message-with-images` produces four,
and it means every unit on this flow lives inside one package's blast radius.

Three of the seven `terminal` nodes carry sign-offs of their own (`paste-plain-text`,
`composer-ready`, `thumbnail-removed`); the other four are refusal terminals reached by a labelled
branch and carry none.

### Reconciling the denominator — `coverage` versus `get-qa-checklist`

**`coverage`'s denominators are wrong and must not be used.** The figures this analyzer was briefed
with — "64 / 64 / 71" and "9 unsigned on codeweaver, 9 unsigned on flowrider" — are artifacts of the
measuring script, not facts about the flow. Everything below derives from
`get-qa-checklist({ questId, operationItemId })`, called once per role, which is the authority
because it runs `operationSignoffScopeTransformer` — the same derivation the sessions themselves
read.

| Source | codeweaver | flowrider | siegemaster |
|---|---|---|---|
| `coverage.txt` (graph reading: observables + labelled edges [+ off-map for SM]) | 64 | 64 | 71 |
| `get-qa-checklist` header **today** | 67 | 67 | 74 |
| `get-qa-checklist` **eligible** denominator (what `REMAINING` measures) | **58** | **58** | **74** |
| What the session actually saw at run time | 58 | 58 | 65 → 74 |
| Sign-offs actually written | 58 | 58 | 74 |

Verbatim, `get-qa-checklist({ questId, operationItemId: '581f205a-…' })` — the codeweaver item:

```
Units: 67 (3 terminal, 14 branch, 50 observable, 0 off-map)
REMAINING (awaiting your `codeweaverSignoff`): 0 of 67
```

and `get-qa-checklist({ questId, operationItemId: '9444462c-…' })` — the siegemaster item:

```
Units: 74 (3 terminal, 14 branch, 50 observable, 7 off-map)
REMAINING (awaiting your `siegemasterSignoff`): 0 of 74
```

### The four ways `coverage` is wrong, and which fire on this flow

`signoffTrackEligibilityStatics` gives every track its own `unitKinds`, `verificationMethods` and
`observableOrigins`, so the three denominators are **different by construction**. `coverage` applies
exactly one of those three exclusions (off-map, and only for non-siegemaster tracks) and therefore
prints numbers no track owes. Four distinct defects, enumerated against my flow:

| # | `coverage` defect | Fires on this flow? | Effect here |
|---|---|---|---|
| 1 | **Omits terminal units.** `units_of()` walks `node.get("observables")` and never the node's own sign-off, against its own docstring's claim that "Node terminals are counted too" | **yes** | −3 on all three tracks |
| 2 | **Ignores `observableOrigins`.** It charges all 50 observables to every track, including the 9 with `addedBy: 'siegemaster'` that `codeweaver`/`flowrider` structurally cannot sign | **yes** | +9 on codeweaver and flowrider |
| 3 | **Ignores `verificationMethods`.** A `verifyByReading` observable is owed by codeweaver (`['test','reading']`) and *not* by flowrider (`['test']`) | **no** | this flow has **0** read-check observables |
| 4 | **Derives the off-map denominator from entries PRESENT** rather than from the seven canonical families, so an unwritten family is invisible to numerator and denominator alike | **no** | all 7 entries exist and are signed |

Defects 1 and 2 net out on my flow as **64 − 9 + 3 = 58** for codeweaver and flowrider, and
**71 + 3 = 74** for siegemaster. The "9 unsigned" figure on each earlier track is defect 2 in its
purest form: those nine units are not owed by either track and never were.

Defects 3 and 4 do not fire here, and I can corroborate both from the artifact — which is why the
peer analyzer's flow shows *different* per-track denominators where mine shows codeweaver and
flowrider equal:

```
=== verifyByReading census, ALL FLOWS ===
paste-image-into-composer          observables=50  verifyByReading=0
send-message-with-images           observables=53  verifyByReading=2
render-images-in-transcript        observables=60  verifyByReading=1

=== offMapSignoffs entries present (coverage derives its denominator from THIS) ===
paste-image-into-composer          entries=7  signed=7   (canonical families owed = 7)
send-message-with-images           entries=3  signed=3   (canonical families owed = 7)
render-images-in-transcript        entries=0  signed=0   (canonical families owed = 7)
```

**My flow is the only one of the three with zero read-check observables and all seven off-map
families written.** That is precisely why codeweaver and flowrider come out equal at 58 here and
must not elsewhere: one read-check observable separates the two tracks by exactly one unit, and a
missing off-map entry under-counts the siegemaster denominator by one per absent family. Neither is
a judgement about the other two flows — it is a fact about the artifact, and it says the peer's
per-track spread is the correct shape and a uniform figure is the wrong one.

Both prompts carry the rule, in mirrored form. `flowriderPromptStatics` step 2:

> **An observable your `get-quest` render marks `(read-check)` is settled by reading source, which is
> another track's method** — it is off this list and out of your count, so never chase one. **A node
> the graph prints `(terminal)` that still points onward is not a terminal unit.**

`codeweaverPromptStatics` owns the other side and gives it a whole mechanism — step 8: *"What is left
to write here is one sign-off per `(read-check)` observable in your cell, taken from your reviewer's
`READ-CHECKS:` block"*, plus a `READ-CHECKS:` line in the reviewer brief. **On this flow that entire
mechanism was dormant**, because the cell contained no read-check observable. Nothing was missed;
there was nothing to miss.

That same prompt sentence also derives the terminal count exactly, and is worth showing because it is
what `coverage` defect 1 destroys. Seven of this flow's twenty nodes are typed `terminal`, but four
of them carry an outgoing edge — `reject-format`, `reject-limit` and `reject-too-large` loop back to
`composer-focused` via `reject-*-back`, and `draft-restored-text-only` leaves the flow via
`restored-draft-to-send`. **7 − 4 = 3 signable terminal units**, which is exactly what all three
checklists print. `paste-plain-text`, `composer-ready` and `thumbnail-removed` are the only three
nodes on this flow with no way onward.

### A fifth defect, in the MCP tool rather than the script

**The checklist's own headline over-counts the earlier tracks.** The `Units: 67`
line for codeweaver includes all 50 observables, but nine of them carry
`addedBy: 'siegemaster'`, and `signoffTrackEligibilityStatics.byTrack.codeweaver.observableOrigins`
is `['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator']` — **`siegemaster` is
absent**. `qaChecklistBuildTransformer` applies that exclusion to `remainingItemIds` but not to
`items`, so the tool prints a total of 67 over a track whose real denominator is 58, then correctly
reports `0 of 67` remaining because the nine are not its to sign. The nine render as `[x]` under a
legend that reads:

```
[x] says ONLY that this unit is not yours to sign right now: it is already signed on the
codeweaver track, or another track owns its package kind.
```

Neither disjunct is true for those nine. They are excluded by **provenance**, a third reason the
legend does not name. A codeweaver reading its own checklist today would conclude that nine units it
never touched were "already signed on the codeweaver track."

**The authoritative denominators for this flow are therefore 58 / 58 / 74**, and all three sessions
saw them correctly at run time: the flowrider's own transcript reads
`0.5m say: "58 units, all mine."` [report 13 §3], and the siegemaster's first checklist read is
`Units: 65 (3 terminal, 14 branch, 41 observable, 7 off-map)` / `REMAINING … 65 of 65`
[report 16 §3]. 41 + 9 = 50: the nine did not exist when either earlier session ran.

---

## 1. Obligation versus delivery, per role

**Every one of the 74 units on this flow carries at least one sign-off. There is no gap.** That is
the control-case headline, and it is what the other two flows will be measured against.

Per-track delivery against the authoritative denominator:

| Track | Owed | Signed | `confirmed` | `unconfirmable` | Unsettled |
|---|---|---|---|---|---|
| `codeweaverSignoff` (work item [7], `5c7f99ca-…`) | 58 | **58** | 55 | 3 | **0** |
| `flowriderSignoff` (work item [13], `f1bd754f-…`) | 58 | **58** | 58 | 0 | **0** |
| `siegemasterSignoff` (work item [16], `3a00404a-…`) | 74 | **74** | 74 | 0 | **0** |

Three tracks, 190 sign-offs, zero units left owing. `coverage.txt`'s
`codeweaverSignoff 55 signed / 9 UNSIGNED of 64` and `flowriderSignoff 55 / 9 of 64` are **defect 2
of §0** and describe no work the quest owes: the nine are the siegemaster-authored observables, which
`observableOrigins` places outside both denominators by design. Verified directly against
`quest.json` — the two sets are identical, member for member.

**Checked against the peer result that an unsigned flowrider unit may not be a gap:** on this flow
the question does not arise, because the flowrider's remainder is genuinely **0 of 58**, confirmed by
its own closing `get-qa-checklist` re-read (`183.5m say: "0 of 58 remaining, tree clean, reviewer
passed and pushed."` [report 13 §1]) and by the tool today. The prompt sentence that makes an
unsigned flowrider unit legitimate — *"it is off this list and out of your count, so never chase
one"* — applies only to `(read-check)` observables, and this flow has none. There is no unit on
either earlier track here that is unsigned-and-not-a-gap, because there is no unit on either track
that is unsigned at all.

### The full unit table

`CW`/`FR`/`SM` = the sign-off field; `C` = `confirmed`, `U` = `unconfirmable`, `—` = not in that
track's denominator. Work item in brackets.

| Unit | Kind | `addedBy` | CW [7] | FR [13] | SM [16] |
|---|---|---|---|---|---|
| `check-composer-is-contenteditable` | observable | spec | C | C | C |
| `check-composer-page-no-stuck-loading` | observable | **siegemaster** | — | — | C |
| `check-image-paste-default-prevented` | observable | spec | C | C | C |
| `check-oddly-typed-image-gives-feedback` | observable | **siegemaster** | — | — | C |
| `check-text-paste-into-empty-composer` | observable | spec | C | C | C |
| `check-text-paste-appends-after-text` | observable | spec | C | C | C |
| `check-text-paste-splits-existing-text` | observable | spec | C | C | C |
| `check-text-paste-between-two-thumbnails` | observable | spec | C | C | C |
| `check-format-toast-text` | observable | spec | C | C | C |
| `check-format-inserts-nothing` | observable | spec | C | C | C |
| `check-limit-holds-under-fast-pastes` | observable | **siegemaster** | — | — | C |
| `check-limit-toast-text` | observable | spec | C | C | C |
| `check-limit-count-unchanged` | observable | spec | C | C | C |
| `check-limit-does-not-replace` | observable | spec | C | C | C |
| `check-downscale-caps-longest-edge` | observable | spec | C | C | C |
| `check-downscale-lands-under-cap` | observable | spec | C | C | C |
| `check-too-large-toast-text` | observable | spec | C | C | C |
| `check-corrupt-image-same-toast` | observable | spec | C | C | C |
| `check-thumbnail-lands-at-caret` | observable | spec | C | C | C |
| `check-thumbnail-has-no-remove-control` | observable | spec | C | C | C |
| `check-caret-sits-after-thumbnail` | observable | spec | C | C | C |
| `check-typing-after-thumbnail-needs-no-space` | observable | spec | C | C | C |
| `check-space-before-thumbnail-survives` | observable | spec | C | C | C |
| `check-space-after-thumbnail-survives` | observable | spec | C | C | C |
| `check-paste-mid-word-splits-cleanly` | observable | spec | C | C | C |
| `check-two-adjacent-thumbnails-no-text` | observable | spec | C | C | C |
| `check-thumbnail-renders-bounded` | observable | **siegemaster** | — | — | C |
| `check-paste-during-send-not-discarded` | observable | **siegemaster** | — | — | C |
| `check-composer-editable-after-send-ends` | observable | **siegemaster** | — | — | C |
| `check-two-images-keep-their-places` | observable | spec | C | C | C |
| `check-same-clipboard-twice-gives-two-thumbnails` | observable | spec | C | C | C |
| `check-same-clipboard-twice-distinct-ids` | observable | spec | C | C | C |
| `check-same-clipboard-twice-same-bytes` | observable | spec | C | C | C |
| `check-same-clipboard-twice-numbered-in-order` | observable | spec | C | C | C |
| `check-one-backspace-removes-thumbnail` | observable | spec | C | C | C |
| `check-surrounding-text-survives` | observable | spec | C | C | C |
| `check-deleted-attachment-leaves-draft` | observable | spec | C | C | C |
| `check-remaining-attachment-kept` | observable | spec | C | C | C |
| `check-draft-text-holds-tokens` | observable | spec | C | C | C |
| `check-draft-bytes-in-indexeddb` | observable | spec | C | C | C |
| `check-draft-record-count-matches-tokens` | observable | spec | C | C | C |
| `check-draft-store-recovers-when-missing` | observable | **siegemaster** | — | — | C |
| `check-reload-rebuilds-thumbnail` | observable | spec | C | C | C |
| `check-restored-thumbnail-renders` | observable | spec | **U** | C | C |
| `check-restored-draft-serialises-identically` | observable | spec | C | C | C |
| `check-restored-draft-sends-its-bytes` | observable | spec | **U** | C | C |
| `check-restored-draft-writes-files` | observable | spec | **U** | C | C |
| `check-restore-never-shows-literal-token` | observable | **siegemaster** | — | — | C |
| `check-restore-never-misattributes-image` | observable | **siegemaster** | — | — | C |
| `check-composer-click-opens-overlay` | observable | spec | C | C | C |
| `no-image-item` … `restored-draft-to-send` (14) | branch | spec | C ×14 | C ×14 | C ×14 |
| `paste-plain-text`, `composer-ready`, `thumbnail-removed` | terminal | spec | C ×3 | C ×3 | C ×3 |
| `hostile-input`, `re-entry`, `concurrency`, `interruption`, `staleness`, `configuration`, `perf` | off-map | spec | — | — | C ×7 |

**Units no track settled: none.** **Units marked `unconfirmable` and left there: none** — all three
of the codeweaver's `U` verdicts were settled downstream, in the exact way its own `toSettle`
prescribed. Its `toSettle` on `check-restored-thumbnail-renders`, verbatim:

> Open the chat composer in a real browser, paste a PNG, reload the page, and read the restored
> thumbnail img's naturalWidth off the live DOM. It must be non-zero.

The flowrider did exactly that in Playwright and the siegemaster did it by hand. That is the
escalation ladder working, and it is the cleanest thing on the flow — see §4.

---

## 2. Cell decomposition — did the fan-out match the work?

The quest ran eight codeweaver cells. Signed against wall clock, computed from `quest.json`'s
`createdAt`/`completedAt` and every sign-off's `workItemId` (sign-off counts here **include**
terminals, so they exceed `coverage.txt`'s by 3 per flow the cell covers):

```
idx  role          operation text                                                    minutes signoffs
2    codeweaver    Codeweaver: build this slice — package: shared · flow: send-mess     24.3        1
3    codeweaver    Codeweaver: build this slice — package: orchestrator · flow: sen     41.3       11
4    codeweaver    Codeweaver: build this slice — package: orchestrator · flow: ren     88.4       12
5    codeweaver    Codeweaver: build this slice — package: server · flow: send-mess     87.7       13
6    codeweaver    Codeweaver: build this slice — package: server · flow: render-im     54.6       21
7    codeweaver    Codeweaver: build this slice — package: web · flow: paste-image-    219.9       58
8    codeweaver    Codeweaver: build this slice — package: web · flow: send-message    174.6       37
9    codeweaver    Codeweaver: build this slice — package: web · flow: render-image    109.1       35
```

My flow is item [7]: **one cell, 219.9 minutes, 58 sign-offs — the longest codeweaver on the quest
and the largest sign-off count of any cell by 21.**

### The comparison the brief asked for

`send-message-with-images` fans out to four cells, because its 18 nodes tag four packages
(`{'web': 11, 'server': 6, 'shared': 1, 'orchestrator': 4}`). Those four are items [2], [3], [5] and
[8]:

| | one cell (mine) | four cells (`send-message-with-images`) |
|---|---|---|
| Wall clock | 219.9 min | 24.3 + 41.3 + 87.7 + 174.6 = **327.9 min** |
| Sign-offs | 58 | 1 + 11 + 13 + 37 = **62** |
| **Minutes per unit** | **3.79** | **5.29** |
| Sessions to schedule serially | 1 | 4 |
| Cross-cell seams to negotiate | 0 | 3 |

**The single cell served this flow, and it should not have split.** The evidence is not just the
ratio. Three things follow from the one-package shape and none of them has a four-cell equivalent:

1. **Two jsdom capability probes, costing about two minutes, decided the whole architecture** for all
   58 units at once. `8.3m say: "Both explorers are back. jsdom here has InputEvent with inputType,
   real Range/Selection, but no canvas, no indexedDB, no createImageBitmap. That decides the design."`
   [report 07 §4.1]. That put canvas and IndexedDB behind adapters and "made 35 of 38 observables
   provable below a browser — 3 `unconfirmable`, not 15." A four-cell split would have paid that
   probe once per cell or, worse, produced four different answers to it.
2. **A deliberate `rework` protocol prevented two divergent copies of one algorithm.**
   `59.5m say: "I told each to report rework if the sibling file isn't on disk yet rather than write
   its own copy — that's the failure mode where two agents each invent a half and neither matches."`
   [report 07 §4.3]. Cost: 9.7 minutes. Inside one cell the operator can enforce that; across cells
   there is no operator who can see both halves.
3. **The `shared` cell on the other flow signed 1 unit in 24.3 minutes.** That is the low end of the
   quest's 1-to-58 spread and it is what an over-split fan-out costs: a whole opus session, a full
   orientation pass, and a reviewer, for one sign-off.

### What the single cell did cost, and it is not the cell boundary

219.9 minutes for 58 units is good throughput, but 164.7 of those minutes — **74.9% of the item** —
were gaps of two minutes or more with no tool in flight [report 07 §1]:

```
  idle  104.4m ->  144.4m =  40.1 min   (composer rewrite)
  idle  182.9m ->  207.7m =  24.8 min   (onInput fix)
  idle  145.8m ->  168.2m =  22.4 min   (draft + overlay tests)
  idle  208.5m ->  219.3m =  10.8 min   (reviewer)
  idle  172.5m ->  181.9m =   9.5 min   (BLOCKED — nothing dispatchable)
```

The two largest are **one sub-agent each**: a 40.1-minute composer rewrite and the 24.8-minute fix
for the regression that rewrite shipped. That is a brief-sizing problem inside the cell, not an
argument for splitting the cell — a four-way split of `web` by folder type would have put the
contenteditable rewrite in one of them anyway, and would additionally have created three new seams
to negotiate around a widget every one of them touches.

**Conclusion for question 2: the decomposition matched the work. The cell is the right unit, and the
spread from 1 to 58 sign-offs per cell is a property of how unevenly the flows tag packages, not a
scheduling failure.** The corrective is at the other end of the range: a cell that would sign one
unit should be folded into its dependent rather than dispatched as its own opus session.

---

## 3. What each role had to derive for itself

Facts each session reconstructed that an artifact upstream could have carried.

### codeweaver [7]

**`codeweaverScopeBlockTransformer` is dead code, and the prompt claims its service.** [report 07
§3.1] searched the 33,706-character rendered prompt for every string that transformer emits:

```
Seams -> -1
Shared homes -> -1
shared homes -> -1
Work item context -> -1
packageNames -> -1
wardMode -> -1
```

The whole Operation Context was four ids. The transformer is fully written and tested with **zero
production call sites**, so this session was never told that `#composer-focused` and its siblings are
`web`-only, nor that `shared` is the `library`-kind home a move could go to. It rebuilt both by hand
in phase A (`0.7m CALL Bash(command=git log --name-only -n 5 …)`). **Priced at 3–5 min per cell,
21–35 min across the quest's seven flow-bearing cells** [report 07 Fix 5].

**Step 5 tells it to read `git diff` on a pass that is mostly untracked files.** The reviewer's own
`git status --porcelain=v1` measured **6 modified tracked files against 25 untracked entries**
[report 07 §3.2]. The session obeyed step 5 formally and then violated its "read the diff, not the
files" instruction, which is the only reason it found the one real defect of the pass:
`172.5m say: "Reading the diff caught a real regression. The composer has no onInput handler, so
typing plain text never reaches the save step"`. **Cost of the omission: 39.3 minutes, 17.9% of the
item** (3.4 detect + 10.4 blocked + 25.5 fix) [report 07 Finding 2]. The sibling reviewer prompt
already carries the correct sentence — "New files are most of what gets built here, and a diff never
mentions them" — and the operator prompt does not.

### flowrider [13]

**The same `git diff` hole, one role later, and this time the diff is empty by construction.** Every
artifact the flowrider produced was a new untracked file. `163.4m CALL Bash(command=git status
--porcelain)` was the improvisation. **Roughly 2 minutes**, and it worked only because it improvised
[report 13 §3.A].

**Nothing in the prompt family guaranteed the suite was ever typechecked, and 51 type errors shipped
past four rounds of sign-off.** Three rules compose into a hole: the brief's `--only lint,test`
excludes typecheck; the prompt says "Your reviewer's `--staged` run is the typecheck"; and `--staged`
diffs against ORIGIN, so it cannot see an untracked file. The reviewer's compliant `--staged` run
reported `lint: PASS 2 packages (3 files …)` and `e2e … skip (0.0s)` with six new files on disk; its
non-compliant scoped run reported `typecheck @dungeonmaster/web FAIL 1239 files, 51 errors`
[report 13 §3.B]. **Cost: 5.3 minutes of reviewer cleanup and two extra ward runs** [report 13 §5.1]
— cheap here only because the reviewer broke its own "twice at most" cap.

**The one genuinely irreducible derivation, and it paid.** The flowrider could not write a `fails if:`
for `check-too-large-toast-text` and, instead of guessing, wrote a measurement instruction into the
brief. Its sub-agent returned `NOT PROVED: downscale-failed — no such input exists` with the Huffman
arithmetic; the operator refused the sign-off and round 2 proved it properly with a 5,300,033-byte
undecodable payload [report 13 §3.4]. It then wrote the finding into a quest note so nobody repeats
it:

> No decodable image can bottom out the downscale ladder while still over 5 MB, so the cannot-reduce
> toast is reachable only through a failed conversion

That note is the correct artifact for this class of fact. Nothing carries it forward to a later
quest, but within this one it did its job.

### siegemaster [16]

**It had the best-carried scope of the three and still derived the largest single rule in the item.**
Its Operation Context is four ids plus the two dev-server lines, and it parsed its own flow id out of
the operation text at `0.4m` with no cost [report 16 §3]. What it derived was the scheduling rule
that shaped the entire 553 minutes:

> "A fixer is on the stuck placeholder and the guide is taking two more corrections. No walker goes
> out while a fixer is saving source files — each save restarts the API for about 1.5s and would
> break a walk mid-drive."

[report 16 §1] names this exactly: *"The second half — no walker while a fixer is saving — is **not**
in the prompt; the operator derived it from this repo's `CLAUDE.md` watcher hazard. It is the single
largest cost driver in the item: it forces 292.4 min of QA and 205.9 min of repair to run end-to-end
rather than overlapped."*

**`SendMessage` is the mechanism the prompt requires and never names.** Step 3 says "you send this
sub-agent back to correct that one heading" with no tool named, and the YOURS/NOT YOURS block lists
neither `SendMessage` nor Agent-resume. The operator inferred it and used it five times
[report 16 §3, finding 6].

**Step 2 instructs a command the environment refuses.** `0.8m tool-result: "Error: This command uses
the '&' background operator, which defers execution past approval-time safety checks."` Recovered in
five seconds; every siegemaster session pays the same discovery [report 16 §3, finding 1].

### The one derivation that repeated across all three

`[GIT FORMS]` / `[GIT]` asserts that chaining git with `&&` or piping it into `head`/`tail` is
refused whole. **Measured false in two of the three sessions.** The codeweaver's reviewer ran
`git diff HEAD -- … | head -400` (`is_error=False`, 19,353 bytes) and
`git add -A && git status --porcelain=v1 | head -5` (`is_error=False`) while `find`, `grep`, `sed`
and `>` — none of which either prompt warns about — all failed [report 07 §3.4]. The siegemaster
broke the same block twice and *"nothing refused either call"* [report 16 §3, finding 2]. Each
session paid round trips discovering what is actually blocked, and the block costs a paragraph in
every one of the 29 + 5 + 10 sub-agent briefs the three sessions cut.

---

## 4. Overlaps and seams

### The overlap is real defence in depth, and it is measurable

**55 of the 74 units on this flow carry three `confirmed` verdicts.** Three more carry
`U / C / C`. That is not waste, and the reason is legible in the evidence fields, which describe
three genuinely different measurements of the same claim. Take `check-restored-thumbnail-renders`:

- **codeweaver** — `unconfirmable`, with an instruction: *"read the restored thumbnail img's
  naturalWidth off the live DOM. It must be non-zero. A zero there with the src correct means the
  stored base64 is corrupt rather than missing, which is a different bug from the thumbnail not
  rendering."*
- **flowrider** — confirmed in Playwright against a real browser.
- **siegemaster** — confirmed by hand at `+212.0m`, the last of the 58 shared units it settled.

The codeweaver did not fake a verdict it could not reach, wrote the exact experiment that would
settle it, and two later tracks ran that experiment. `signoffTrackEligibilityStatics`' comment —
*"a different KIND of proof over the same unit is exactly what a separate column is for"* — is
borne out here.

The clearest single instance of the ladder catching something is on the flowrider track, and it is a
**false green a green suite would have hidden**:

> "The `size-ok` branch asserted that a small pasted PNG comes back at 40×30 with unchanged bytes.
> The author probed it by forcing the image down the downscale path — and the test stayed green,
> because Chromium's PNG round-trip at identical dimensions is deterministic and lossless. The
> assertion could not tell branch-taken from branch-skipped."

[report 13 §4.2]. Marginal cost of that refusal: near zero — it rode inside the next round's agent.

### Where the overlap IS waste

The 55 triple-confirmed units include the whole plain-text-paste family, the two toast-text
observables, and all 14 branches. On those, the third measurement adds nothing a Playwright walk did
not already prove — and the third measurement is by far the most expensive: **the siegemaster spent
212 minutes settling the 58 units the other two tracks had both already settled.** For a role whose
own prompt says *"Flowrider has already written tests over it, so your walk is the second,
independent look"*, spending 38% of the longest session on the second look at units two tracks
already confirmed is the flow's largest identifiable inefficiency. It is also, unavoidably, how it
got to the off-map probes — see §6.

### The seams

There are two, and both are between flows rather than between tracks.

1. **`restored-draft-to-send`** — a labelled branch leaving this flow for
   `send-message-with-images:send-pressed`. Three units on this flow
   (`check-restored-draft-sends-its-bytes`, `check-restored-draft-writes-files`, and the branch
   itself) are only observable past the hand-off. `packageScope: 'intersection'` puts the branch on
   this flow's items, and all three tracks signed it. **Not a seam failure** — but note that the
   codeweaver marked two of those three `unconfirmable`, which is the honest answer for a cell that
   cannot reach the other side.
2. **`check-composer-editable-after-send-ends`** — a siegemaster-authored observable tagged to node
   `thumbnail-in-composer` on *this* flow whose fix landed in
   `packages/web/src/adapters/xhr/post-with-progress/xhr-post-with-progress-adapter.ts`, a
   `send-message-with-images` file (+9 lines, an `abort` listener). The unit is scoped here and the
   code is over there. Nothing broke, because both are `web`. On a flow whose nodes tagged two
   packages this would have had no owner.

**No unit on this flow is owned by nobody.** That is the strongest single statement the control case
supports.

---

## 5. Reviewer burden, and what it says about upstream

Three reviewers, three roles, one pass each. All three returned `pass`; **none returned `rework`.**

| Reviewer | Duration | Verdict | Fixed itself | Handed up |
|---|---|---|---|---|
| `codeweaver-reviewer` (`agent-ac365463e43217efe`) | 10.9 min | `pass` | nothing | two non-blocking findings in the commit body |
| `flowrider-reviewer` (`agent-a113b7f4b9119081e`) | 17.9 min | `pass` | **51 typecheck errors**, 20 `Edit` calls | nothing |
| `siegemaster-reviewer` (`agent-a7d644bcc3994f403`) | 9.7 min | `pass` | nothing | one duplication finding in the commit body |

### The one reviewer that had to repair, repaired a class

The flowrider's reviewer spent 12.1m to 17.4m (**5.3 min, 20 `Edit` calls, two extra 64-second ward
runs**) fixing 51 `TS2322: Type 'unknown' is not assignable to type 'string'` errors across six new
spec files [report 13 §5.1]. Its own verdict names the cause:

> `FIXES: npm run ward -- --staged silently scoped only to the prior spiritmender commit's 3 files
> (it diffs against origin, not the working tree), and npm run build's web step is vite build, which
> strips types rather than checking them — so this test suite had **never actually been typechecked**.`

**That is inside the role's own scope, and it is nonetheless a missing step rather than a diligent
reviewer** — precisely the shape the brief flags. Three separate prompt statements compose into a
guarantee that no flowrider suite is ever typechecked before its reviewer, and the reviewer only
found it by **breaking its own "twice at most" cap** [report 13 §5.6]. A compliant reviewer would
have stopped at run 2, reported `pass`, and shipped 51 type errors.

The upstream signal is sharper than that. A sub-agent had already seen the problem:
`agent-a5559883eeba4d70a` ran an unsanctioned `--only typecheck` at its 7.7m, got
`FAIL 1236 files, 18 errors`, said nothing about it again, and wrote two more specs in the same
shape. Two later agents added more. **The count reached 51 in the 21 minutes between that sighting
and the reviewer's** [report 13 §5.1]. The brief FORBADE the run that found the bug and gave the
sub-agent nowhere to put a red it was not asked to look at.

### Two reviewers repaired nothing, and one of them should have

The codeweaver's reviewer passed first time on a 30-new-file pass, and its verdict is specific and
traceable. But its parent had explicitly handed it a claim to test:

> `208.5m say: "…web is e2e-eligible with eighteen specs driving the element I just replaced. The
> design is meant to leave all eighteen untouched, but I ran no e2e, so that's a claim it should test
> rather than take from me."`

Its `--staged` run reported **`e2e skip (none in scope)`** and its 20 Bash calls contain no
Playwright invocation [report 07 Finding 4]. The claim entered the commit body unverified. The
reviewer prompt has no slot for a parent-supplied claim, and prescribes `--staged` with "never widen
the ward" — so the reviewer was **compliant and the design was wrong**.

The flowrider's reviewer also dropped three of the ten labelled lines its prompt requires —
`BITES:`, `UNCOVERED:` and `FINDINGS:` — and replaced 58 per-unit citations with one blanket
sentence [report 13 §5.7]. `BITES:` is the line that discharges "for each `[x]` this pass produced,
name the wrong value that turns it red." The parent signed all 58 by transcribing sub-agent claims;
the reviewer is the only session that opens the files. **That is a coverage cost with no wall-clock
cost, and it is invisible in the ledger** — all 58 flowrider sign-offs read `confirmed`.

### Testing the peer's failure class: "certifying without reading"

A peer analyzer found zero rework rounds across four reviewers and named the recurring failure class
as *certifying without reading* rather than repairing. **Zero rework replicates exactly on this flow.
The failure class does not — it is real but is the wrong name for what happened here, and the
correction sharpens it.**

Two of the three reviewers demonstrably read, and the proof is that each produced a finding only a
reader could produce:

- **`codeweaver-reviewer`** — 103 `Read` calls across roughly 30 new files, and it reported that
  *"`#check-thumbnail-has-no-remove-control` landed in `dom-composer-insert-image-adapter.test.ts`
  rather than `chat-input-widget.test.tsx` as the map predicted — the observable still holds, just at
  a different (arguably better) layer."* That contradicts its own parent's map. You cannot generate
  it without opening both files.
- **`siegemaster-reviewer`** — 30 Bash, 17 Read, 11 discover in 9.7 min, and it reported that
  *"`indexed-db-draft-images-read-adapter.ts` and `indexed-db-draft-images-replace-adapter.ts`
  duplicate ~50 lines of identical open/heal logic verbatim"* [report 16 §7.7 B2 #36]. Same test: it
  read both.
- **`flowrider-reviewer`** — read the code (it found and fixed 51 type errors, which required opening
  the files) but **did not read against the units**. It dropped `BITES:`, `UNCOVERED:` and
  `FINDINGS:` and replaced 58 per-unit citations with one blanket adjective sentence
  [report 13 §5.7]. This one *is* the peer's class, precisely.

So one of three fits "certifying without reading." What all **three** share is a strictly larger
class:

> **Each reviewer certified at least one claim nobody measured.**

- codeweaver's reviewer certified its parent's assertion that eighteen e2e specs driving the replaced
  element were untouched. Its `--staged` run reported `e2e skip (none in scope)` and its 20 Bash
  calls contain no Playwright invocation. The parent had asked *in prose* for exactly that claim to be
  tested; the reviewer prompt has no slot for a parent-supplied claim [report 07 Finding 4].
- flowrider's reviewer certified that all 58 units *"trace to a real Playwright assertion with a
  concrete failing value"* while omitting the `BITES:` line that is the only evidence such tracing
  happened.
- siegemaster's reviewer certified *"every fix addresses the cause the walker measured, backed by a
  red-first test"* — true and well-evidenced — while the other half of its operation item, *"review
  its test suite"*, produced no work product at all and no reviewer was asked about it.

**"Certifying without reading" is the symptom; "certifying a claim the role has no step for
measuring" is the cause,** and it is the same shape as §6's and §7's finding. In all three cases the
prompt is what did not ask. That matters for the fix: telling reviewers to read harder addresses one
of my three cases; giving them a `CLAIMS:` slot and a per-unit citation gate addresses all three.

### What the reviewer burden says

**Nothing was handed down from upstream that a reviewer had to absorb.** No reviewer on this flow
repaired a defect caused by a prior role, and none returned `rework`. The one class-repair
(typechecking) is a hole in the role's own toolchain instructions, not an inheritance. **For the
control case, the reviewer layer is not carrying upstream debt.** That is a meaningful negative
result: on this flow the chain did not leak forward through the reviewers. Where it leaked is §6.

---

## 6. Late discoveries — what was found where it was most expensive

This is the section the control case exists to produce.

### The shape of the siegemaster session, in one number

Sign-off timestamps from `quest.json`, elapsed from the item's `createdAt`
(`2026-09-02T19:52:11.326Z`):

```
  +   15.4m  n= 7  branch observable terminal
  +   21.6m  n= 5  branch observable
  +   29.6m  n= 5  branch observable
  +   45.6m  n= 6  branch observable   LATE-ADDED: check-composer-page-no-stuck-loading
  +   54.3m  n= 6  branch observable
  +   61.2m  n= 3  branch observable
  +   72.0m  n= 4  branch observable
  +  117.2m  n= 1  observable   LATE-ADDED: check-thumbnail-renders-bounded
  +  177.6m  n= 1  observable
  +  190.2m  n=12  branch observable terminal
  +  198.3m  n= 4  branch observable terminal
  +  212.0m  n= 6  branch observable
  +  226.0m  n= 1  off-map
  +  262.4m  n= 2  observable off-map   LATE-ADDED: check-oddly-typed-image-gives-feedback
  +  330.3m  n= 3  observable off-map   LATE-ADDED: check-limit-holds-under-fast-pastes, check-paste-during-send-not-discarded
  +  405.7m  n= 3  observable off-map   LATE-ADDED: check-composer-editable-after-send-ends, check-restore-never-shows-literal-token
  +  500.0m  n= 1  observable   LATE-ADDED: check-draft-store-recovers-when-missing
  +  523.3m  n= 3  observable off-map   LATE-ADDED: check-restore-never-misattributes-image
  +  541.0m  n= 1  off-map
```

```
total SM units: 74  shared-with-CW/FR: 58  SM-exclusive: 16
LAST shared unit signed at +212.0m : observable check-restored-thumbnail-renders
units signed AFTER +226.0m: 14  (7 off-map, 7 late-added observables, 0 other)
LAST unit overall: +541.0m perf
```

**The siegemaster settled the entire denominator it shares with the codeweaver and the flowrider by
+212.0 minutes — 38% of its session. The remaining 341 minutes, 62%, produced the sixteen units no
other track measures: seven off-map probe families and seven of the nine late observables.** The
other two late observables were minted during the path walks, at +45.6m and +117.2m.

Seven of nine mid-quest observables on this flow came out of off-map probing. The off-map evidence
fields say so directly — `concurrency` cross-references `check-limit-holds-under-fast-pastes` and
`check-paste-during-send-not-discarded` by name; `interruption` cross-references
`check-composer-editable-after-send-ends`.

**This flow contributes 9 of the quest's 16 mid-quest observables and 9 of its 14 siegemaster-authored
ones — the largest such block on the quest, and it comes from the one flow where the last role ran to
completion.** The other two flows do not have fewer latent defects; they have less siegemaster.

### The nine, one by one

For each: what defect it names, whether the codeweaver or the flowrider could have caught it, and
what finding it where it was found actually cost. "Cost" is the phase span from [report 16 §1] plus
the specific findings that phase produced. The **`RED FIRST` test the siegemaster's own fixer wrote**
is the decisive evidence for "could an earlier role have caught it" — it says what environment the
proof actually needs, measured rather than argued.

The codeweaver's jsdom capability probe is the reference for what its environment could reach:
*"jsdom here has InputEvent with inputType, real Range/Selection, but no canvas, no indexedDB, no
createImageBitmap"* [report 07 §4.1].

---

**1. `check-composer-page-no-stuck-loading`** — signed +45.6m.
Defect: `"Loading dumpster dungeon visuals..."` never resolves on the no-quest composer route
[report 16 §B6 bug 1].
*Codeweaver:* **yes, structurally.** The fix is `isNodeMode && questId !== null` in
`quest-chat-content-layer-widget.tsx`, and the regression test landed in
`quest-chat-content-layer-widget.test.tsx` (+34 lines) — a jsdom unit test in the codeweaver's own
package. It was outside its map's file list, not outside its ability.
*Flowrider:* **yes, trivially.** Its 89 test cases loaded that exact route repeatedly and never
looked at the right-hand panel.
*Cost where found:* phase 4, **7.2 min** — plus a partial re-walk, because walker 3 saw it and wrote
it off as *"looked intentional (empty-quest idle state) rather than broken"* and walker 4 had to
re-find it [report 16 §5 Finding 7]. Note the walker prompt FORBADE that dismissal: step 8 lists
*"a spinner never resolves"* among the things to note.

**2. `check-thumbnail-renders-bounded`** — signed +117.2m.
Defect: an `<img>` with no `max-height`/`max-width`/`object-fit` paints at full intrinsic size,
growing the composer to roughly 610px of an 813px viewport and pushing SEND off-screen. Two build paths —
paste and draft-restore [report 16 §B6 bugs 2, 3].
*Codeweaver:* **no.** jsdom has no layout engine; `getBoundingClientRect` returns zeros. This is the
one of the nine the earliest track structurally could not have reached.
*Flowrider:* **yes.** Painted geometry in a real Chromium is one `boundingBox()` call, and the
regression tests it eventually got are Playwright cases in the flowrider's own spec files.
*Cost where found:* phase 6, **29.0 min**, two fixers — the second only because the operator's own
`DO NOT TOUCH` was scoped too wide and produced a half-fix: *"Fixer landed the bound but deliberately
left the draft-restore path unbounded — my brief's DO-NOT-TOUCH was too wide"*. That second fixer
cost **5.6 min, 17,973 output, 7,300,685 context-in** [report 16 §5 Finding 10].

**3. `check-oddly-typed-image-gives-feedback`** — signed +262.4m.
Defect: a clipboard item whose `type` is empty, whitespace-only or wrong-case never reaches the
rejection toast at all — paste an image and *nothing happens*, no toast, no thumbnail
[report 16 §B6 bug 5].
*Codeweaver:* **yes.** `isAllowedPasteMediaTypeGuard` is an exact `===` against a four-element
allow-list — a pure guard the codeweaver built. The regression test the fixer eventually wrote is a
**jsdom unit test in `chat-input-widget.test.tsx`**:
`it('EDGE: {paste a clipboard item declared "IMAGE/PNG"} => …accepts it as PNG and never shows the unsupported-format toast')`.
That test would have gone red on day one in the codeweaver's own file.
*Flowrider:* **yes.** Its `format-bad` branch test drove exactly one hostile value, `image/bmp`.
*Cost where found:* phases 9 + 10, **81.1 min**, four agents — and the first fix **introduced a new
user-visible bug**: normalising the type made `'image/png '` pass both checks, after which
`FileReader.readAsDataURL` embedded the un-normalised type into the data URL and the contract regex
rejected it, surfacing to a user as *"That image could not be converted or reduced below 5 MB"* for a
valid 142-byte image [report 16 §5 Finding 8].

**4. `check-limit-holds-under-fast-pastes`** — signed +330.3m.
Defect: three un-awaited pastes past four thumbnails yields **seven**; each paste reads the same
stale count. *"Lost 3 runs out of 3"* [report 16 §B6 bug 7a].
*Codeweaver:* marginal — the attach chain is async and the ladder is browser-bound.
*Flowrider:* **yes.** The regression test is
`test('EDGE: {4 thumbnails present, 3 more pastes fired with no await between the dispatchEvent calls} => …')`
in `composer-paste-refusals.e2e.ts` — the flowrider's own spec file, in its own harness.
*Cost where found:* phases 10–11, **67.2 min** shared with two siblings.

**5. `check-paste-during-send-not-discarded`** — signed +330.3m.
Defect: an unconditional `editor.replaceChildren()` on send completion silently destroys an image
pasted mid-flight — *"no trace anywhere"* [report 16 §B6 bug 7c].
*Codeweaver:* **arguably yes** — `replaceChildren` is plain DOM and jsdom supports it; the test is
"fire paste, resolve a mocked send, assert children."
*Flowrider:* **yes.** Regression test in `send-images-chat-route.e2e.ts`.
*Cost where found:* same phase.

**6. `check-composer-editable-after-send-ends`** — signed +405.7m.
Defect: the XHR adapter never listened for `abort`, so the promise never settled and `contentEditable`
stayed `'false'` — *"for 6+ seconds, with no error message shown"*, recoverable only by a full page
reload [report 16 §B6 bug 8b].
*Codeweaver:* **yes in principle** — "does this promise settle on abort" is a pure adapter unit test.
But `xhrPostWithProgressAdapter` is a `send-message-with-images` file; this is the seam noted in §4.
*Flowrider:* **yes.** Regression test is
`test('ERROR: {chat POST aborted mid-flight, in the same tick send() returns} => the composer becomes editable again and SEND_BUTTON re-enables…')`.
*Cost where found:* phase 12, **75.3 min**, three agents including the item's longest fixer (34.5 min).

**7. `check-restore-never-shows-literal-token`** — signed +405.7m.
Defect: a 1-in-3 reload race leaves the literal string `[Pasted Image 1]` in the composer as ordinary
text a user can send to the model [report 16 §B6 bug 8a].
*Codeweaver:* **yes, and it built the function.** `composerParseDraftTransformer` is a pure
transformer written by `agent-a58363da054cf523b` in 5.7 minutes. The two regression tests are jsdom
unit tests in `chat-input-widget.test.tsx` (`#check-orphaned-token-drops-alone`,
`#check-orphaned-token-dropped-among-real-content`) plus 46 changed lines in
`composer-parse-draft-transformer.test.ts`. **This is a missing test case on a pure function the
codeweaver wrote, in a file the codeweaver owns.**
*Flowrider:* yes.
*Cost where found:* same phase as #6, same fixer.

**8. `check-draft-store-recovers-when-missing`** — signed +500.0m.
Defect: an IndexedDB object store that goes missing while the DB version is unchanged **can never
self-heal** — every later save fails silently forever while the thumbnail appears to land
[report 16 §B6 bug 9].
*Codeweaver:* **no.** jsdom has no `indexedDB`; the codeweaver measured that itself and put the store
behind an adapter for exactly this reason.
*Flowrider:* **yes.** The regression test is a Playwright case in the flowrider's own
`composer-paste-draft-reload.e2e.ts`:
`test('VALID: {database exists at version 1 holding only a decoy store} => paste still writes a real draft record…')`.
*Cost where found:* phase 13, inside the 46.7-minute fixer that also produced #9.

**9. `check-restore-never-misattributes-image`** — signed +523.3m. **The most expensive discovery on
the quest.**
Defect: `indexedDbDraftImagesReadAdapter` drops and *compacts* any record failing
`pastedImageDraftContract.safeParse`, while tokens are matched positionally — so one malformed record
shifts every later record up one slot and a restored draft **shows and SENDS the wrong picture**
[report 16 §B6 bug 10].
*Codeweaver:* **yes.** This is a pure index-mapping bug in `draftImagesLoadBroker` and the read
adapter — both built by the codeweaver's own cell (`agent-a17828214d4314129`, "Build draft-images load
broker", 16.2 min). The repair's tests landed in `draft-images-load-broker.test.ts` (+73 lines) and
`indexed-db-draft-images-read-adapter.test.ts` (+44) — **jsdom unit test files the codeweaver already
had open.** A two-record fixture `[malformed, valid]` against two tokens goes red immediately.
*Flowrider:* yes.
*Cost where found*, verbatim [report 16 §5 Finding 5]:

> `agent-a80a3e95f97858bfb` (discover, 22.1m, 113,272) → `agent-a67844e999b9a4053` (fix, 46.7m,
> 199,443) → `agent-acc2562b875e9dca3` (disprove, 22.3m, 82,089) → `agent-a13e65636c9a6c8da`
> (complete the fix, 7.1m, 28,973) → `agent-aa42ad54c4ee76112` (confirm, 14.1m, 77,997).
> 113,272 + 199,443 + 82,089 + 28,973 + 77,997 = **501,974 output tokens**;
> 22.1 + 46.7 + 22.3 + 7.1 + 14.1 = **112.3 minutes** — 20.3% of the item's wall clock on one bug.

The extra two agents exist because fix pass 1 covered only one of two failure modes. The operator
diagnosed it at `501.4m`: *"its tests covered decode failures and passed, so the contract-invalid path
shipped broken."*

---

### The tally

| | Codeweaver could have caught | Flowrider could have caught |
|---|---|---|
| Yes, with a test in its own existing files | **5** (1, 3, 5, 7, 9) | **9** (all) |
| Structurally could not | 2 (2 — no layout engine; 8 — no indexedDB) | 0 |
| Possible but out of its brief's scope | 2 (1's widget, 6's adapter) | — |

**Five of the nine defects are provable by a jsdom unit test, and for four of those the fixer's own
regression test now lives in a `.test.ts`/`.test.tsx` file the codeweaver cell created.** Two more
need a browser and no more. **Every one of the nine is reachable from a Playwright walk on the
composer route — the exact thing the flowrider did 89 times.**

Aggregate wall clock spent finding and repairing them at siegemaster time: phases 4, 6, 9, 10, 11,
12 and 13 sum to 7.2 + 29.0 + 50.8 + 30.3 + 36.9 + 75.3 + 102.7 = **332.2 of 553.4 minutes, 60.0% of
the longest item on the quest.** Not all of that
is attributable — the off-map walks that surfaced them were owed work either way — but the *repair*
half is: 205.9 minutes of fixer time, 37.2% of the session [report 16 §1].

### The finding this section exists to produce

**The tests that prove these nine now exist, in the earlier roles' own files, written by the last
role — and no earlier track's sign-off will ever record them.**

`git show --stat e4d5e8218` (the siegemaster's single commit) lands 14 new named test cases:

```
packages/web/src/flows/quest-chat/composer-paste-draft-reload.e2e.ts        | 187 +++++++
packages/web/src/flows/quest-chat/composer-paste-inserts-thumbnail.e2e.ts   |  79 +++
packages/web/src/flows/quest-chat/composer-paste-refusals.e2e.ts            | 100 ++++
packages/web/src/flows/quest-chat/send-images-chat-route.e2e.ts             | 292 +++++++++++
packages/web/src/widgets/chat-input/chat-input-widget.test.tsx              | 240 +++++++++
packages/web/test/harnesses/composer-paste/composer-paste.harness.ts        | 228 ++++++++-
```

`composer-paste-{refusals,inserts-thumbnail,draft-reload}.e2e.ts` and `composer-paste.harness.ts`
are **the flowrider's own files**, created by work item [13] and committed as `800153ab4`.
`chat-input-widget.test.tsx` is **the codeweaver's own file**, from work item [7]. Ten new Playwright
cases and four new jsdom cases.

So the automated regression coverage for these nine units *is real and it is in the tree.* What is
missing is any record of it on the tracks that own those files, because
`observableOrigins` excludes `siegemaster` from both, permanently and by design — and the design's
own justification for the exclusion is honest about why: *"A role that runs strictly AFTER a track
cannot produce work that track was able to sign."* True. But the corollary is that the sign-off
ledger, read as a coverage report, **understates coverage on exactly the nine units where the quest
did its hardest work.** A human reading `coverage.txt` sees "9 unsigned on codeweaver, 9 unsigned on
flowrider" and would reasonably conclude those nine have one hand-driven confirmation and nothing
else. They have a Playwright case each.

The statics anticipated the analogous case in one direction and not the other:

> Codeweaver's list is Flowrider's rather than a shorter one: a `flowrider` origin reaches a
> codeweaver session on a LATER `pt N` continuation of that package, and dropping it would park such
> an observable outside every codeweaver denominator permanently.

There is no `pt N` after the siegemaster. **A siegemaster-origin observable is structurally
single-tracked forever, on every quest, by construction.** On this flow that costs nothing in real
coverage and everything in reported coverage. The fix is not to widen `observableOrigins` — that
would report a hole no session could close, exactly what the statics warns against. The fix is that
a sign-off written by a fixer's `RED FIRST` test needs somewhere to land other than nowhere.

---

## 7. The missing middle step

### What every operator had to invent before it could dispatch

| Role | Invented | Belongs in |
|---|---|---|
| codeweaver | the seam/shared-homes map (`codeweaverScopeBlockTransformer` renders to nobody) | a **prompt-render fix** — the transformer is written and tested |
| codeweaver | that `git diff` is blind to ~30 new files | a **prompt edit** — the sibling reviewer prompt already says it |
| codeweaver | that `--only lint,test` spins Playwright, so narrow to `lint,unit` — and thereby dropped `integration`, costing a 31.3-min ward→spiritmender→ward chain | a **prompt edit** (`lint,unit,integration`) |
| flowrider | that `git diff` is *empty* on its pass | a **prompt edit** |
| flowrider | that `--staged` never typechecks an untracked file | a **prompt edit** |
| flowrider | that no decodable image can bottom out the downscale ladder | a **quest note**, which is where it went |
| siegemaster | "no walker while a fixer is saving" — the item's single largest cost driver | a **prompt edit** (this repo's watcher hazard) |
| siegemaster | that `SendMessage` is the guide-correction tool | a **prompt edit** |
| siegemaster | the entire walker guide — 542 lines, 16.2 min of non-overlapping wall clock | see below |

**Not one of these is a missing artifact between the approved flow map and the first codeweaver
brief.** They are eight prompt edits and one dead transformer. The codeweaver arrived with four ids,
fetched its own flow slice in 0.2 minutes, ran two capability probes, and had a 165-line map on disk
at 9.1 minutes — **4.1% of its session on orientation**, and the map was right enough that it needed
only four mid-run edits. That path is complete.

### Where the step is actually missing

Look at what the three prompts differ on, rather than what they share.

`siegemasterPromptStatics` step 5 carries this sentence, and no other operator prompt carries
anything like it:

> "'No observable claims it' is not a reason to leave something broken."

[report 16 §3] measures what that one sentence bought: *"This passage bought the item its yield: nine
observables were added mid-session and four of the ten fixed defects had no observable behind them
when found."*

The codeweaver and flowrider prompts have the opposite posture by construction. The flowrider's
step 2 is *"Get the full list of units… `get-qa-checklist`"* and everything after it is about proving
that list well — `flowEvidenceContractStatics` governs how hard each assertion bites, never whether
more units should exist. The codeweaver signs "the observables its unit tests prove." **The licence
to invent an observable exists in exactly one of the three prompts, and it is the last one on the
relay.** That is the whole finding, and this flow is the only place on the quest where it can be
measured, because it is the only flow where that last role finished.

The second half of the same point: **the seven off-map probe families were in the spec at Gate #2.**
They are emitted for every flow unconditionally by `qaChecklistBuildTransformer`, and this flow's
seven — `hostile-input`, `re-entry`, `concurrency`, `interruption`, `staleness`, `configuration`,
`perf` — sat on the checklist from the first read. Seven of the nine late observables came out of
probing them. **The categories of defect the quest eventually found were named in the approved
artifact, at approval time, and nothing scheduled work against them for 553 minutes.** The
codeweaver's checklist did not print them; the flowrider's did not either
(`Units: 58 (3 terminal, 14 branch, 41 observable, 0 off-map)`). `signoffTrackEligibilityStatics`
rule 2 is explicit that this is deliberate:

> The off-map probe families are Siegemaster's charter: they are the breakage classes a flow graph
> structurally cannot draw, probed by hand against a running system, which is not what a Codeweaver
> or Flowrider test suite is for.

That reasoning holds for the **probe** — hand-driving a live system is not a suite's job. It does not
hold for the **observables the probe mints**, and this flow proves it does not: eight of the nine
now have automated tests, ten of the fourteen are Playwright cases, and the flowrider's own harness
had to be extended by 228 lines to support them.

### The answer

**Nothing is missing between the approved flow map and the first codeweaver brief.** What is missing
is a step that puts adversarial thinking in front of the two tracks that write tests, instead of only
behind them. Three candidate shapes, cheapest first:

1. **Print the off-map families on the codeweaver's and flowrider's checklists as context, not as
   units.** They stay out of both denominators — `unitKinds` is unchanged, no hole is reported that
   no session could close — but a flowrider writing `composer-paste-refusals.e2e.ts` would see
   `concurrency`, `interruption` and `staleness` named beside the flow it is proving. Four of the
   nine late observables are pure concurrency/interruption cases on a composer, and the flowrider had
   the browser, the harness and the page open. **Cost: a rendering change in
   `qaChecklistBuildTransformer`. Estimated saving on this flow: the phases that produced items 4, 5,
   6 and 7 above.**

2. **Give the flowrider the sentence the siegemaster has.** *"'No observable claims it' is not a
   reason to leave something broken"* — plus the corollary that a defect it measures is a new
   observable it may author. The mechanism already exists: `addedBy: 'flowrider'` is a valid
   provenance, `observableOrigins` includes `flowrider` on **both** the codeweaver and flowrider
   tracks, and the quest already carries two flowrider-authored observables (on the other two flows).
   The flowrider on *this* flow authored none — it refused four sign-offs and amended one
   description, which is the same instinct pointed at the existing list rather than past it.

3. **Adopt [report 16]'s own Fix 6(b) — a step 7b for the siegemaster.** The ledger promises
   *"manual-QA this flow **and review its test suite**"*; the prompt has no step for it and its
   colocated test pins that it must not have one
   (`siegemaster-prompt-statics.test.ts`: `{ judging: false, authoring: false, standards: false }`).
   Measured result: **zero minutes of test-suite review in 553** [report 16 §1, central question 2].
   See below — on this flow that omission mattered exactly once, and it mattered.

### Dig #4, answered directly: did the missing test-suite review matter here?

**The flowrider's suite was left ungraded, and one specific finding was thrown away.** The only
test-suite critique in the whole 553 minutes is a single sentence at `117.9m`, folded into a fix
brief rather than pursued:

> "The existing overlay e2e passes while this is broken, so it asserts something weaker than the real
> behaviour."

Nothing downstream depended on the grading — the siegemaster's reviewer graded *repairs*, its ward
run was green, and the quest advanced. So no work was blocked. But the sentence above is the *exact*
output §6 shows this flow needed: for each of nine defects, the flowrider had a spec file open on the
right page and did not catch it. **A step 7b would have produced nine of those lines as a
deliverable.** Instead the siegemaster reached the same place by writing the missing tests itself,
into the flowrider's files, where the flowrider's track cannot sign them.

The ledger and the prompt disagree at the source — the seed text is
`packages/shared/src/statics/quest-type-registry/quest-type-registry-statics.ts:93` and the prompt
never mentions a test suite except to say *"Flowrider has already written tests over it, so your walk
is the second, independent look."* **Fix 6(b) is the right half of that fork**, and the reason is the
one [report 16 §6] gives: *"a defect that a walk found and a suite missed is the highest-value output
this role can produce and it is currently thrown away."*

### One further observation the control case supports

`siegemasterPromptStatics` step 3 requires the operator to build a **walker guide** before the first
walk — 542 lines on this flow, written by a dedicated sub-agent, read by every one of the 23 walkers.
Its stated rationale is exactly the problem this whole phase is about:

> "Without it each walker re-derives the same things out of the codebase — how to reach the entry
> point, how to seed two of something, where a value lives that the page never shows — and pays for
> that reading again on every re-walk."

**That is the middle-step artifact, and it exists — for one role, inside one session, and it is
thrown away at the end of it.** The codeweaver's map (165 lines) and the flowrider's map (40,302
chars) are the same shape and are equally session-local. Three sessions on one flow each built a
private orientation document, none read another's, and the guide's own five mid-flight corrections
were three-fifths content walkers had *already independently rediscovered* [report 16 §5 Finding 6].
If a middle step is to be added anywhere, the cheapest version is not a new role: it is making the
`.quest-plans/<operationItemId>-*.md` artifacts **flow-scoped rather than item-scoped**, so the
flowrider opens the codeweaver's map and the siegemaster opens both. That is a path-naming change.

---

## 8. Raw figures appendix

### Work items on this flow

| | codeweaver [7] | flowrider [13] | siegemaster [16] |
|---|---|---|---|
| work item id | `5c7f99ca-7259-438b-b672-84fb87c262b7` | `f1bd754f-d1d3-4e57-b015-99aa906fbc47` | `3a00404a-3b31-48c5-b6a2-3c69d1c26547` |
| operation item id | `581f205a-20dd-448f-b4d9-02226351e965` | `90f5c4af-4992-4f62-97cf-55425b80129d` | `9444462c-e4cb-4299-be6d-38fceca48af3` |
| session id | `d1b89f89-6f71-40c8-aaf3-094dedb15b8d` | `5c841160-080c-4eea-adf6-e7736b92121e` | `346c75d4-9969-4f5f-8f77-52dd1c9b6c73` |
| window | `09-02T00:05:20.552Z → 03:45:15.738Z` | `09-02T09:00:10.667Z → 12:03:57.695Z` | `09-02T19:52:11.326Z → 09-03T05:05:36.747Z` |
| wall | 219.9 min | 183.8 min | 553.4 min |
| sub-agents | 35 | 8 | 36 |
| sign-offs | 58 (55 C / 3 U) | 58 (58 C) | 74 (74 C) |
| reviewer passes | 1, `pass` | 1, `pass` | 1, `pass` |
| commit | `061e49064` | `800153ab4` | `e4d5e8218` |

**Chain total: 957.1 minutes of wall clock, 79 sub-agents, 190 sign-offs, 3 commits.**

### Token totals, `cache_read` and `cache_creation` stated separately

codeweaver [7] [report 07 §2]:

| Stream | input (uncached) | cache_read | cache_creation | output | context-in total |
|---|---|---|---|---|---|
| Main session (opus) | 424 | 68,296,392 | 1,136,158 | 714,282 | 69,432,974 |
| 35 sub-agents (sonnet) | 5,462 | 393,220,404 | 22,385,837 | 1,868,157 | 415,611,703 |
| **Total** | **5,886** | **461,516,796** | **23,521,995** | **2,582,439** | **485,044,677** |

flowrider [13] [report 13 §2]:

| | Output | cache_read | cache_creation | uncached input | Total context-in |
|---|---|---|---|---|---|
| Main session | 347,646 | 29,016,058 | 800,655 | 224 | 29,816,937 |
| Sub-agents (8) | 758,467 | 218,784,817 | 8,686,636 | 1,984 | 227,473,437 |
| **Total** | **1,106,113** | **247,800,875** | **9,487,291** | **2,208** | **257,290,374** |

siegemaster [16] [report 16 §2]:

| | Main session | Sub-agents (36) | Grand total |
|---|---|---|---|
| output tokens | 414,041 | 2,487,274 | **2,901,315** |
| input (uncached) | 470 | 11,346 | 11,816 |
| **cache_read** | **61,359,308** | **980,986,595** | **1,042,345,903** |
| **cache_creation** | **819,767** | **26,867,746** | **27,687,513** |
| context-in | 62,179,545 | 1,007,865,687 | **1,070,045,232** |

**Chain totals: output 2,582,439 + 1,106,113 + 2,901,315 = 6,589,867. context-in 485,044,677 +
257,290,374 + 1,070,045,232 = 1,812,380,283.** `cache_read` and `cache_creation` are stated
separately above and collapsed nowhere.

### Time by category, per role

| | codeweaver [7] | flowrider [13] | siegemaster [16] |
|---|---|---|---|
| Orientation / reading | 9.1 (4.1%) | 1.5 (0.8%) | 1.7 (0.3%) |
| Planning (map / walker guide) | 0.5 (0.2%) | 2.5 (1.4%) | 16.2 (2.9%) |
| Sub-agent dispatch — waiting | 195.4 (88.9%) | 149.3 writers (81.1%) + 5.5 explorers (3.0%) | 292.4 walkers (52.8%) + 205.9 fixers (37.2%) |
| Review cycles | 10.9 (5.0%) | 18.0 (9.8%) | ~6.6 + 9.7 (2.9%) |
| Verification / ward (operator's own) | 3.4 (1.5%) | 0.0 (0.0%) | 0.0 (0.0%) |
| Idle-or-stall (true dead air) | 10.4 (4.7%) | 0.0 (0.0%) | 6.4 (1.2%) |

Sources: [report 07 §1], [report 13 §1], [report 16 §1]. The siegemaster's non-overlapping
attribution, verbatim:

```
NON-OVERLAPPING WALL-CLOCK ATTRIBUTION (latest-started live sub-agent wins)
    292.4 min   52.8%  browser walk / probe (QA)
    205.9 min   37.2%  fixer (repair what QA found)
     28.9 min    5.2%  main operator alone (dispatch, diff review, ledger, orientation)
     16.2 min    2.9%  walker-guide authoring
      9.7 min    1.8%  reviewer + commit
      0.3 min    0.1%  other sub-agent
    553.5 min  TOTAL (wall 553.4 min)
```

### Quest notes on this flow (8 of the quest's 24)

| Kind | Role | Unit | Summary |
|---|---|---|---|
| `tooling-error` | flowrider | — | `composerPasteHarness.beforeEach` clears draft storage via `page.addInitScript`, which re-fires on every later navigation including `page.reload()` |
| `open-question` | flowrider | — | No decodable image can bottom out the downscale ladder while still over 5 MB |
| `open-question` | siegemaster | — | The chat draft `localStorage` key is global, so a draft composed on one quest restores into a different quest's composer |
| `open-question` | siegemaster | `check-oddly-typed-image-gives-feedback` | Loose thread (a) first half: `'image/png '` is refused, but with the WRONG toast |
| `open-question` | siegemaster | `check-oddly-typed-image-gives-feedback` | Loose thread (a) second half: `'image/png; charset=utf-8'` correctly refused — no bug |
| `open-question` | siegemaster | — | Loose thread (b): could NOT reproduce the reported `removeChild`/`insertBefore` React errors |
| `open-question` | siegemaster | — | Two tabs sharing the one global draft store leave a tab showing another tab's image bytes |
| `open-question` | siegemaster | — | When draft persistence fails the paste still looks like it worked, and the image is lost on the next reload |

**Zero codeweaver notes on this flow.** Six of the eight are siegemaster, and five of those six are
`open-question` — decisions a person has to make, correctly not made by an agent. The global
draft-key question is the largest: the siegemaster measured it, refused to fix it because *"the spec
names that exact key in observable `check-draft-text-holds-tokens`, and design decision
`#draft-keeps-images-in-indexeddb` says 'the text keeps its existing localStorage key'"*, and wrote
the migration plan into the note. That is the side channel working exactly as designed.

### Sign-off latency, per track

Elapsed minutes from each item's `createdAt` to each `modify-quest` batch. Full timelines in §6 for
the siegemaster; the other two:

```
==== codeweaver [7]  (58 signoffs) ====
  +   33.8m  n= 1     +   50.2m  n= 9     +   52.4m  n= 2     +   73.0m  n= 4
  +   83.3m  n= 2     +  145.3m  n= 9     +  169.2m  n=11     +  171.1m  n=16
  +  171.5m  n= 2     +  182.5m  n= 2

==== flowrider [13]  (58 signoffs) ====
  +   50.8m  n=19     +   90.1m  n= 4     +  121.6m  n=15     +  137.9m  n=10
  +  163.3m  n=10
```

Both obeyed "sign this group's PROVED lines NOW, before you send the next group." Neither piled
sign-offs at the end. Zero refused `modify-quest` calls across all three sessions — 10 + 5 + 13 = 28
calls, all `{"success": true}` first time.

### The siegemaster's commit, by file

```
 ...62c-e4cb-4299-be6d-38fceca48af3-walker-guide.md | 542 +++++++++++++++++++++
 .../dom-composer-insert-image-adapter.test.ts      |  22 +
 .../dom-composer-insert-image-adapter.ts           |  13 +-
 .../dom-composer-write-adapter.test.ts             |  25 +
 .../composer-write/dom-composer-write-adapter.ts   |   7 +
 .../indexed-db-draft-images-read-adapter.test.ts   |  44 +-
 .../indexed-db-draft-images-read-adapter.ts        |  97 +++-
 .../indexed-db-draft-images-replace-adapter.ts     |  65 ++-
 .../xhr-post-with-progress-adapter.ts              |   9 +
 .../load/draft-images-load-broker.proxy.ts         |   8 +
 .../load/draft-images-load-broker.test.ts          |  73 ++-
 .../draft-images/load/draft-images-load-broker.ts  |  54 +-
 .../normalized-paste-media-type-contract.test.ts   |  52 ++
 .../normalized-paste-media-type-contract.ts        |  17 +
 .../normalized-paste-media-type.stub.ts            |   8 +
 .../composer-paste-delete-and-overlay.e2e.ts       |  14 +-
 .../quest-chat/composer-paste-draft-reload.e2e.ts  | 187 +++++++
 .../composer-paste-inserts-thumbnail.e2e.ts        |  79 +++
 .../quest-chat/composer-paste-refusals.e2e.ts      | 100 ++++
 .../flows/quest-chat/send-images-chat-route.e2e.ts | 292 +++++++++++
 .../chat-composer/chat-composer-statics.test.ts    |  11 +
 .../statics/chat-composer/chat-composer-statics.ts |   9 +
 .../composer-parse-draft-transformer.test.ts       |  46 +-
 .../composer-parse-draft-transformer.ts            |  29 +-
 .../paste-media-type-normalize-transformer.test.ts |  63 +++
 .../paste-media-type-normalize-transformer.ts      |  21 +
 .../widgets/chat-input/chat-input-widget.proxy.tsx |  13 +-
 .../widgets/chat-input/chat-input-widget.test.tsx  | 240 +++++++++
 .../src/widgets/chat-input/chat-input-widget.tsx   | 226 ++++++---
 .../image-overlay/image-overlay-widget.test.tsx    |  15 +
 .../widgets/image-overlay/image-overlay-widget.tsx |  20 +-
 .../quest-chat-content-layer-widget.test.tsx       |  34 +-
 .../quest-chat/quest-chat-content-layer-widget.tsx |   6 +-
 .../composer-paste/composer-paste.harness.ts       | 228 ++++++++-
 .../composer-send/composer-send.harness.ts         | 110 +++++
 35 files changed, 2637 insertions(+), 142 deletions(-)
```

Fourteen named regression cases added by the siegemaster's fixers, ten of them Playwright:

```
composer-paste-draft-reload.e2e.ts      | EDGE: {paste a 6000x4000 PNG downscaled to 2000x1333, reload} => the RESTORED thumbnail paints at a bounded thumbnail size and SEND_BUTTON …
composer-paste-draft-reload.e2e.ts      | VALID: {database exists at version 1 holding only a decoy store} => paste still writes a real draft record, the decoy store survives, and a…
composer-paste-inserts-thumbnail.e2e.ts | EDGE: {type "A", paste a 6000x4000 PNG downscaled to 2000x1333, type "B"} => the thumbnail paints at a bounded thumbnail size and SEND_BUTT…
composer-paste-inserts-thumbnail.e2e.ts | VALID: {paste a valid PNG whose clipboard-declared type carries a trailing space, "image/png "} => the trailing space is normalised away: a…
composer-paste-refusals.e2e.ts          | INVALID: {paste a clipboard file item whose declared type is the empty string, after typing "abc"} => the unsupported-format toast shows, c…
composer-paste-refusals.e2e.ts          | INVALID: {paste a clipboard file item whose declared type is whitespace-only, after typing "abc"} => the unsupported-format toast shows, co…
composer-paste-refusals.e2e.ts          | EDGE: {4 thumbnails present, 3 more pastes fired with no await between the dispatchEvent calls} => the composer ends with exactly 5 thumbna…
send-images-chat-route.e2e.ts           | VALID: {1 thumbnail, SEND_BUTTON clicked twice with no await between the clicks} => exactly 1 POST fires and the quest images dir gains exa…
send-images-chat-route.e2e.ts           | VALID: {type "first message ", paste image 1, SEND, then paste image 2 before the delayed request resolves} => the in-flight request carrie…
send-images-chat-route.e2e.ts           | ERROR: {chat POST aborted mid-flight, in the same tick send() returns} => the composer becomes editable again and SEND_BUTTON re-enables on…
chat-input-widget.test.tsx              | EDGE: {paste a clipboard item declared "IMAGE/PNG"} => #check-wrong-case-accepted-as-png accepts it as PNG and never shows the unsupported-fo…
chat-input-widget.test.tsx              | EDGE: {two real pasted images, the second one's IndexedDB record evicted before reload} => #check-orphaned-token-dropped-among-real-content t…
chat-input-widget.test.tsx              | EDGE: {localStorage holds "A[Pasted Image 1]B", IndexedDB draft store is empty} => #check-orphaned-token-drops-alone the surrounding text res…
chat-input-widget.test.tsx              | ERROR: {paste an image while the IndexedDB draft store is unavailable} => #check-bytes-before-token localStorage never gains the placeholder …
```

### Downstream cost this flow's codeweaver imposed on the quest

Two integration suites this cell shipped went red at the quest's `ward (changed)` gate
[report 07 Finding 3]:

```
SUITE: web/src/contracts/pasted-image-draft/pasted-image-draft-contract.test.ts
MSG  : Expected substring: "Decoded image exceeds 5242880 bytes"
       Received message:   "Maximum call stack size exceeded"
SUITE: web/src/transformers/data-url-split/data-url-split-transformer.test.ts
MSG  : RangeError: Maximum call stack size exceeded
```

```
[10] ward         status=failed    08:28:53.076Z -> 08:33:53.628Z   (5.0 min)
[11] spiritmender status=complete  08:33:53.690Z -> 08:57:28.368Z   (23.6 min)
[12] ward         status=complete  08:57:28.391Z -> 09:00:10.620Z   (2.7 min)
```

**31.3 minutes of quest wall clock plus one whole extra agent session**, caused by the operator
narrowing its sub-agents' ward to `--only lint,unit` (correctly avoiding `test`, which spins
Playwright) and thereby dropping `integration`. `lint,unit,integration` is the intersection that
would have caught both.

### Denominator reconciliation, reproducible

All three `get-qa-checklist` calls were made directly against this quest, one per role — not inferred
from each other. Headers verbatim:

```
python3 scripts/quest-forensics.py coverage 1be07040-b9ec-476c-a439-0b4fbb0123cd   [UNRELIABLE]
  → paste-image-into-composer: codeweaver 55/64, flowrider 55/64, siegemaster 71/71

get-qa-checklist({ questId, operationItemId: '581f205a-…' })   codeweaver
  Units: 67 (3 terminal, 14 branch, 50 observable, 0 off-map)
  REMAINING (awaiting your `codeweaverSignoff`): 0 of 67

get-qa-checklist({ questId, operationItemId: '90f5c4af-…' })   flowrider
  Units: 67 (3 terminal, 14 branch, 50 observable, 0 off-map)
  REMAINING (awaiting your `flowriderSignoff`): 0 of 67

get-qa-checklist({ questId, operationItemId: '9444462c-…' })   siegemaster
  Units: 74 (3 terminal, 14 branch, 50 observable, 7 off-map)
  REMAINING (awaiting your `siegemasterSignoff`): 0 of 74
```

Deriving the authoritative denominators from `signoffTrackEligibilityStatics`:

```
                                        codeweaver   flowrider   siegemaster
  coverage printed                            64          64          71
    + terminals it omits          (defect 1)  +3          +3          +3
    − siegemaster-origin observables (def. 2) −9          −9           0
    ± verifyByReading              (defect 3)   0           0           0    (this flow has none)
    ± unwritten off-map families   (defect 4)   0           0           0    (all 7 written)
  ------------------------------------------------------------------------
  AUTHORITATIVE                               58          58          74
  checklist header prints                     67          67          74    (defect 5: header
                                                                             skips observableOrigins)
  sign-offs actually written                  58          58          74
  REMAINING                                    0           0           0
```

Codeweaver and flowrider are equal here **only** because this flow carries zero `verifyByReading`
observables. On a flow that carries one, codeweaver owes it (`verificationMethods: ['test','reading']`)
and flowrider does not (`['test']`), and the two denominators must differ by exactly that count. A
uniform figure across all three tracks is always wrong; equality between the first two is a property
of this flow, not of the design.
