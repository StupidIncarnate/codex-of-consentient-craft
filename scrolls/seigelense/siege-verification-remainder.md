# Giving siegemaster something to look at

*One of three documents split out of `../siege-verification-tooling.md`. This one holds the role, the evidence and how a
pass is run; the `siegelense` tool itself is in `siegelense-tooling.md`, and the recipe book is in
`siegelense-recipes.md`.*

> An architecture doc, written so a session that was not in the design conversation can build this.
> It is deliberately NOT a file-by-file plan. It states the problems, what solves each one, the
> decisions already taken and why.
>
> **Read all three documents once. Then live in `siegelense-tooling.md` — Part 4 (every decision), Part 5 (what
> must be deterministic) and Part 8 (the whole call surface).**
>
> Every figure under "What we measured" came from live lanes driven on 2026-09-14 and is anchored to
> those runs. Nothing else here is built.
>
> **Its companion is `~/.claude/plans/how-does-this-then-curious-fern.md`, which covers SEEDING.**
> That plan's full ownership architecture is out of scope here. A RECIPE BOOK is not — a walk cannot
> verify a state it cannot create, and half the raw material already exists. See `siegelense-recipes.md`.

---

## Part 1 — What a siegemaster is for, and what it cannot do today

A siegemaster drives a running system by hand and signs whether each verification unit holds. It is the third of three
tracks over the same flow: codeweaver proves units with unit tests, flowrider proves them with test suites, siegemaster
is the independent second look at the real thing.

Its own prompt tells it to treat all of this as a defect:

> an ugly transition, a misaligned control, a truncated label, a spinner that never resolves, a state
> with no feedback

And the repo's verification standard is blunt about who decides:

> **The browser UI is the verdict, not the backend.** A run FAILS if a UI surface broke during it —
> blank panel, frozen spinner, missing rows, wrong route, console errors — **even when
> `quest.status` is `complete`**.

So the whole role rests on a question nobody had tested: **can a language model actually perceive those failures, and
how does it name the control it wants to drive?**

### What exists

`../../packages/web/test/siege-driver` holds three files that work and are the right idea:

| File               | What it does                                                                                                                                                                               |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `siege-lane.ts`    | stands up one isolated stack — API server, Vite server, headless Chromium, its own OS-assigned port pair and throwaway `DUNGEONMASTER_HOME`, with a fake Claude CLI and fake ward wired in |
| `siege-command.ts` | turns a named command into a READING — 16 verbs, never a verdict                                                                                                                           |
| `siege-driver.ts`  | a process that holds one lane open and takes commands as files, so an agent can drive it across many turns                                                                                 |

`siege-command.ts`'s header states the rule that governs the whole design and must survive any rewrite:

> Turns one named command into a READING off a lane — and **never into a verdict**, so whoever signs
> a unit is signing against evidence rather than against this file's opinion of it.

A command reports what it measured. Whether a UNIT is satisfied is the session's judgement. Computing a difference
between two measured values is still a reading; deciding a unit passes is not.

---

## Part 2 — What we measured

Five lanes booted and torn down against this repo's own web package, plus a three-agent trial.

| Finding                                     | Evidence                                                                                                                                                   |
|---------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A lane boots in **20 seconds**              | the verifier prompt's "a cold boot can take three minutes" is a ceiling, not the norm. This number changes what parallelism is affordable                  |
| A command round-trips in **~3 seconds**     | write to `commands/`, read from `results/`                                                                                                                 |
| Teardown is clean                           | `end` sent, ports free, no orphaned process, no `dm-siege-*` left in the OS tmpdir                                                                         |
| **A model genuinely sees a screenshot**     | opened a PNG of the create-guild screen and spotted that two form rows did not share a left edge                                                           |
| That defect is real                         | `GUILD_NAME_INPUT` x=510, `GUILD_PATH_INPUT` x=472 — same width, 37.9px apart. The `Name` and `Path` labels carry the same offset, so the whole row shifts |
| **No JSON reading raised it**               | `goto` returned status 200; both inputs read `visible: true` at the correct width. Every value true, none of it about the defect                           |
| `dom` on a broad selector is unusable       | `dom` with `body *` returned 58 nodes whose first entry carried the entire Mantine stylesheet in its `text` field                                          |
| A page listing is small                     | 21 rows on the create-guild screen, 19 on `/queue`, 28 on a guild screen holding three guilds, 36 on a session transcript                                  |
| **Rendering is deterministic across lanes** | three agents, three lanes, three port pairs produced byte-identical PNGs of the same screen — 46,786 bytes each                                            |
| Playwright here is 1.58.2                   | `locator.ariaSnapshot()` exists                                                                                                                            |

### The perception result, stated plainly

**JSON readings catch wiring. They are structurally blind to painting.**

Good: wrong status, wrong body, wrong payload, uncaught exception, missing rows, wrong route after a click, a file never
written, a websocket frame that never arrives. Better than a human eye.

Blind, and each for a concrete reason:

| Defect                       | Why the reading misses it                                                                                                                     |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| truncated label              | `text` comes from `textContent`, which is the FULL string. A CSS ellipsis clips the paint and leaves it untouched                             |
| misaligned control           | one rect at a time. Seeing misalignment needs two rects and a comparison nobody asked for                                                     |
| overlapping elements         | both report `visible: true`, both have rects, nothing says which paints on top                                                                |
| unreadable contrast          | `color` and `background-color` are not in the reading at all                                                                                  |
| jumpy transition             | readings are point samples. There is no timeline                                                                                              |
| off-screen or behind a modal | Playwright's `isVisible()` means "has a box and is not `visibility: hidden`". Scrolled out of view is `true`. Covered by an overlay is `true` |

**The model is good at gross wrongness and poor at fine geometry.** A blank panel, a collapsed layout, text over text, a
control off the edge — it sees those. A 3-pixel misalignment or a contrast ratio it will not reliably catch and must not
be asked to. Those belong in computed checks.

The 37.9px find is the pattern to design for: **the eye flagged it from the picture, the number confirmed it.** Neither
half works alone.

---

## Part 3 — The three-arm trial, and what it actually proved

Three `general-purpose` sub-agents on **sonnet** — the model production minions run — each verified the same six units
on quest `1dac5395-c828-4472-868c-d4a3425e43a0`, flow
`subagent-duration-session-view`. Same seed, same units, same driver, own lane each. The briefs differed in ONE section:
how to find a selector.

| Arm             | Told to find selectors by            | Correct | Selector misses | Tool calls | Tokens      | Shots opened | Wall |
|-----------------|--------------------------------------|---------|-----------------|------------|-------------|--------------|------|
| A control       | nothing — "work it out"              | 6/6     | 0               | 82         | 184,107     | 3            | 500s |
| B source-first  | reading widget source before driving | 6/6     | 0               | **41**     | 185,238     | 3            | 552s |
| C listing-first | reading a generated page listing     | 6/6     | 0               | 49         | **140,419** | 4            | 474s |

All six verdicts in every arm matched ground truth driven by hand beforehand.

### Result 1 — source-first destroys the independence the role exists for

Arm B volunteered this:

> all six units reached on first attempt with **exact expected values known in advance from the
> harness/e2e specs** and seed script

Reading source to find selectors means reading the e2e specs, and the e2e specs carry the answers. B did not measure the
system; it confirmed what flowrider's tests had already told it. The verifier prompt forbids exactly this:

> Where the code and the unit disagree, the UNIT wins… Taking your expectation from it means you
> would confirm whatever it happens to do, **including the defect you were sent to find**.

Siegemaster runs AFTER flowrider precisely to be an independent look. Source-first is not merely the expensive route —
it is the route that removes the reason for the pass. **That cost appears in no metric**: B looks competitive on calls,
tokens and wall clock.

**Decision: a walk gets its selectors from the running page, not from test files.** Source is still the right tool for
what a page cannot show — a configured cap, a default, where an off-screen value is written, which is the guide's
`OFF-SCREEN` heading and never its `CONTROLS` heading — **but the WALK is not the session that opens it.** That reading
goes to a `siegemaster-reader`, dispatched before any walk, and the walk is handed the values. The contamination arm B
measured is not a property of WHICH file gets opened; one file opened mid-walk is a session holding it for every
judgement after.

### Result 2 — the listing is cheaper even when selectors are free

Measured against the same guild screen:

| Route to a selector                      | Cost            | Yields                                     |
|------------------------------------------|-----------------|--------------------------------------------|
| the five widget files behind that screen | ~5,978 tokens   | static testIds only                        |
| one e2e spec plus two harnesses          | ~7,000 tokens   | THREE testIds, one of them ambiguous       |
| **a generated page listing**             | **~243 tokens** | every addressable element, scoped, current |

Roughly 24x. And arm C spent 24% fewer tokens than either other arm **with the selectors already given away in the unit
text** — so that saving never came from finding selectors. It came from not reading source and not issuing broad `dom`
reads.

### Result 3 — all three found the same real bug

On the nested-chain session, the inner sub-agent's body renders **twice** — once correctly nested, once orphaned at the
chat panel's root indent with no header and no duration. Arm B measured both rects: `x=74,y=323` nested, `x=50,y=618`
orphaned. No console warning fires.

**The fixture is not the cause.** `subagent-duration.harness.ts`'s `seedNestedChain` writes
`"Inner agent body"` exactly once, through `writeSubagentStub`. One line on disk, two renders. It matches the
orphan-trailing-singleton failure `../../packages/orchestrator/CLAUDE.md` describes by hand.

Evidence, still on disk: `../../tmp/siege/expC/screenshots/shot-210.png`, plus arm A's and B's own byte-identical
copies. **This bug is unfiled.** It sits on an abandoned quest, so nothing will pick it up on its own.

### Result 4 — all three needed a command none of them had

`check-session-registers-no-interval` asks how many intervals the app registers. Counting a registration means watching
BEFORE it happens — and `eval` only runs once `goto` has completed, by which point React has mounted and any mount-time
`setInterval` has already fired.

This repo's own e2e solves it: `elapsed-duration.harness.ts` exposes `installIntervalCounter()`
carrying the comment `// BEFORE page.goto` — Playwright's `addInitScript`. The driver has no equivalent.

Two arms independently invented the same dodge: `goto` a neutral page, patch `setInterval` there via
`eval`, then `history.pushState` plus a `popstate` event into the target route so React Router navigates without a fresh
document and the patch survives the mount. The third sat in the browser for 65 real seconds to span a tick period.

**This is foundational, not incidental.** Every instrumentation this doc proposes — an interval counter, computed
geometry checks, a health probe — is an injection that must be installed ahead of the app.

### What the trial did NOT establish

**The selector question barely arose, and that is a property of the SPEC.** Four of the six units name their own testId
in the claim, and the quest's `#dd-placement` decision reads "Its own element on the right, test id
subagent-chain-duration". Observables here are AUTHORED with their testIds, deliberately, because that is what connects
spec to implementation to test. So zero selector misses is representative, not an artefact — a siegemaster on this
codebase really is handed most of its selectors.

What that leaves the listing doing is narrower and still real: a runtime id like
`GUILD_ITEM_<uuid>` that exists in no file, WHICH of several identical controls was meant, which branch is currently
mounted, and every element the walk passes THROUGH that no unit names — the surface the `[LOOK AT EVERYTHING]` rule is
about.

**Whether the agent looks at the screen went untested.** The question was whether a tool handing over a screenshot
unasked beats a prompt line telling the session to look. Every brief carried the prompt line — including the control —
and all three then opened screenshots. There was nothing for forced capture to beat. At this sample, telling them was
enough.

**The numbered overlay went unused.** Arm C rendered three and opened none, reporting that testIds were legible straight
from the listing and that the `dom` verb's exact count/text/rect reading was stronger evidence. One run is not a
verdict, but nothing here argues for building it early.

---

## Part 4 — The capabilities, and the problem each one solves

### Time: what is decidable, and what is not

**Problem.** A screenshot is a point sample, so anything about a SEQUENCE is currently unanswerable. The verifier prompt
records a real instance: *"One walk waved a stuck loader through as intentional; the next proved it never resolves."*

**But the sequence questions split in two, and only one half is answerable by anything here.**

| Question                                      | Decidable?                                  |
|-----------------------------------------------|---------------------------------------------|
| is the spinner still there after 5 seconds?   | **yes** — two frames, compare               |
| did anything change at all between t0 and t5? | **yes**                                     |
| is the page still blank after 10 seconds?     | **yes**                                     |
| did the action give any feedback?             | **yes** — something changed, or nothing did |
| was the transition smooth?                    | **no**                                      |
| did it jump, stutter, or drop frames?         | **no**                                      |
| is the easing right? does it feel good?       | **no**                                      |

**A model cannot grade animation and this design must not pretend it can.** Four frames 1.5 seconds apart cannot
distinguish a clean 300ms transition from a janky one. Frame drops are invisible at that sampling rate. A two-frame
flicker falls between samples. And `video` produces a file no model watches — it can only extract frames from it, which
is `hold` again with extra steps.

**Solution — `hold` detects NON-SETTLEMENT, which is a binary, not a judgement.** Take N frames at an interval; report
which differ. Two frames three seconds apart showing an identical spinner settles the stuck-loader case outright, and
`nothing changed` after a click is the no-feedback case. Neither is an opinion about motion.

**`video` is for a HUMAN and for the trail, never for grading.** When a walk reports something odd at step 9, a person
can watch step 9. That is worth keeping and is not a verification mechanism.

**The prompt currently asks for something no session can deliver**, and that is a prompt defect rather than a tooling
gap: *"a transition jumps or flickers"* sits in the same list as truncation and overlap, which ARE measurable. A rule
nobody can follow does not get ignored — it gets answered with an invented adjective, which is exactly what the prompt's
own *"search your own draft for
'confirmed', 'held', 'as expected'"* discipline exists to catch. **Cut motion quality from what siegemaster claims to
check.**

### What no track can settle goes to a PERSON, with its evidence attached

**There is a third settlement route, and the repo has two of the three already.** `verifyByReading:
true` covers a DECLARED value — a transition's duration in source is a read-check. A PAINTED outcome — clipping,
overlap, contrast — "carries no flag and stays a test". Perceived motion quality is neither: no file states it, and no
test measures it.

**The answer is not to drop the observable.** "The transition should not stutter" is a real product expectation, and an
expectation nobody writes down is an expectation nobody ever checks. The answer is a third route: **a person settles it,
and the system collects those into a list the user is handed.**

It parallels `verifyByReading` exactly, and needs the same two mechanics:

| Mechanic                                          | Why                                                                                                                                                                          |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| a flag on the OBSERVABLE, not a per-track verdict | `unconfirmable` means "this track tried and could not", which another track might still settle. This is a property of the criterion itself: no automated route exists at all |
| it DROPS OUT of every automated denominator       | exactly as `verifyByReading` drops out of flowrider's and siegemaster's. Otherwise siegemaster carries a unit it can never close, forever                                    |

**The walk still does the work — it just does not render the verdict.** This is the part that makes the route worth
having rather than a euphemism for skipping. A walk that reaches the moment in question still runs `video` over it,
still captures the frames either side, still notes which step. The human is handed the file and the question, not an
instruction to go reproduce it:

```
NEEDS A PERSON
  #check-row-expand-is-smooth   "expanding an execution row animates without stuttering"
    watch:  .siegelense/guilds/<guildId>/instances/inst_7f3a/video/step9.webm   ← from the `video` step
    frames: step9-a.png · step9-b.png · step9-c.png
    context: 12 rows on screen, expanded row 4
```

**Two things about that `watch:` line, and both are load-bearing.** It is repo-local, through the symlink, so the person
opens it where they already are rather than hunting through a home directory. And the video it points at is HELD:
video otherwise ages out first and fastest, which would rot the only link the only reader of this list ever gets.

**`toSettle` already carries this shape.** The contract calls it "an INSTRUCTION, never a question — the action that
would settle the unit", which is exactly what a human checklist line is. What is missing is not the verdict, it is the
COLLECTION: nothing today gathers these and puts them in front of the user at the end of a quest.

#### It renders as `(human-check)`, and it surfaces as a PANEL in the quest view

**The token is `(human-check)`, wherever `(read-check)` already appears** — the observable node on the graph and the
checklist alike. One token in both places, because a reader who learns what one means has learned the other, and a
second spelling in a second surface is a second thing to explain.

**The list surfaces in the WEB UI, as a panel on the quest.** Not a file in the worktree: a worktree is deleted when the
quest merges, and a file nobody opens is the same as not collecting them. The panel is where the user already is.

**It is the ONLY place a `verifyByHuman` unit reappears**, and that is what makes it load-bearing rather than
decorative. Once a quest reaches `in_progress` those units are filtered out of every work item's view — not in
`get-quest`, not in `get-qa-checklist`, not in a brief — so with no panel they are invisible everywhere and the
expectation goes unchecked, which is the outcome the whole route exists to prevent.

**Each row carries the unit, the instruction and the evidence:**

```
NEEDS A PERSON                                                    2 outstanding
  #check-row-expand-is-smooth   "expanding an execution row animates without stuttering"
    to settle   watch the row expand and say whether it stutters
    watch       .siegelense/guilds/<guildId>/instances/inst_7f3a/video/step9.webm
    frames      step9-a.png · step9-b.png · step9-c.png
    context     12 rows on screen, expanded row 4            [ holds ]  [ does not hold ]
```

**Two things that panel depends on, and both were settled earlier for other reasons:** the evidence paths are repo-local
and absolute, so the link opens; and video cited by a human-check item is HELD until the quest closes rather than ageing
out first, which is the only reason the link still resolves when the person reaches it.

**The panel TAKES the verdict, it does not only display the question.** A list a person can read and cannot tick is a
list nobody works — the same failure the "keep the category narrow" rule is guarding against, arriving from the other
side. The answer lands on the unit as its settlement, beside the three automated tracks, and an outstanding count is
what makes an unworked list visible rather than quietly empty.

**Keep the category narrow or nobody works the list.** The test is whether ANY automated route can produce a value:

| Criterion                                  | Route                                        |
|--------------------------------------------|----------------------------------------------|
| unreadable contrast                        | computed `color` against computed background |
| misaligned control                         | two rects and a comparison                   |
| truncated label                            | `scrollWidth > clientWidth`                  |
| covered by something else                  | `elementFromPoint` at the rect centre        |
| an error message a person cannot act on    | a model reads it and judges                  |
| **motion quality — jank, stutter, easing** | **none**                                     |
| **taste — does this look right**           | **none**                                     |

That is short enough that a person might actually work it.

### The test lives in ONE shared place, and ChaosWhisperer reads it too

**The author needs this table at SPEC time, not the walker at walk time.** If ChaosWhisperer writes
"the transition should be smooth" with no flag, three tracks each pay to discover it cannot be automated — and each
either signs `unconfirmable` or invents a verdict. The user sees neither.

So ChaosWhisperer must be able to mark an observable human-check while authoring it, exactly as it already marks one
`verifyByReading`. That is the same capability, one route over.

**Two patterns this repo already runs make it cheap:**

| Pattern                          | What it gives                                                                                                                                                                                                                                                                                  |
|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `signoffTrackEligibilityStatics` | already THE shared definition of which units each denominator covers — "the same statics every denominator reader shares, so the ledger cannot mint an item whose work list computes as zero". The human-check route belongs in it, so dropping those units happens once rather than per track |
| `standardsReviewConcernsStatics` | already a shared prompt BLOCK interpolated into three reviewer prompts rather than copied. The decision table above goes the same way — into ChaosWhisperer's prompt AND siegemaster's, from one source                                                                                        |

**One statics, three readers: the author, the denominators, and the walker.** The author flags at spec time; the
denominators drop the unit so no track carries something it can never close; the walker gathers the evidence and routes
it to the list.

**And the shared-block rule applies with force.** The orchestrator's own prompt-editing rules say a shared block "is a
contract on every prompt that interpolates it" — an edit is unfinished until every prompt reading it still agrees. A
table that drifts between the author's copy and the walker's copy produces the worst case available: a criterion
ChaosWhisperer flagged as human-only that siegemaster believes is testable, so neither settles it and neither reports it
missing.

**The flag is `verifyByHuman: true`**, sitting beside `verifyByReading: true` on
`flowObservableContract` and reading the same way — one field, one settlement route, named for who settles it.

**Who may SET it is ChaosWhisperer and BugHunt, matching `verifyByReading`.** A mid-quest role marking its own hard
units human-check is a cheaper escape than marking them unconfirmable, and the existing rule already closes that door
for the read-check. Siegemaster may still ADD an observable it discovered — it holds that authority today — but not the
flag; if it believes a unit needs a person, that is a `questNotes` open-question and a human rules on it.

**Once the quest reaches `in_progress`, a `verifyByHuman` observable is FILTERED OUT of every work item's view.**
Codeweaver, flowrider and siegemaster must not see it at all — not in `get-quest`, not in `get-qa-checklist`, not in a
brief.

That is stronger than dropping it from a denominator, and the reason is what an agent does with a unit it can see but
cannot close. It does not skip it. It reaches for the nearest thing it CAN measure — a proxy assertion, a
change-detector, a `toSettle` naming an action nobody will take — and now the quest carries a test that pins the wrong
thing plus a session that spent a pass on it. An observable nothing downstream can act on is context that can only
mislead, so it does not travel.

It reappears in exactly one place: the list handed to the person at the end.

### An observable that names an IMPLEMENTATION — "the item must have className X"

**These arrive, and siegemaster is the wrong track for every one of them.** A class name is not something a person
perceives. It is the mechanism behind something they perceive, and the mechanism can change to an inline style, a data
attribute or a generated hash without the outcome moving at all.

**Signing one on the class alone is the cheapest false pass in this system.** The class is present, the stylesheet rule
was deleted, the row is not red, the unit reads `confirmed`. Nothing in the record says the screen was never looked at.

**The route it belongs to already exists: it is a READ-CHECK.** `verifyByReading` covers a DECLARED value — the doc's
own example is a transition's duration in source — and a class name in a component file is exactly that. Flagged, it
drops out of siegemaster's denominator and flowrider's, and nobody walks it.

**Where it is NOT flagged and lands on a walk anyway, here is what a walk does, in order:**

1. **Ask what a person would SEE if it were true.** "The failed row is red", "the active tab is underlined". That
   sentence is the real observable and it is the one to settle.
2. **Measure that, RELATIONALLY.** The failed row's computed background differs from a non-failed row's. That is a pure
   reading with no source in it — and it needs the seed to produce **two of the thing the assertion must tell apart**,
   which the recipe book already requires for its own reasons.
3. **Read the class too, through `dom`** — `fields: ['className']`, narrow target. It corroborates; it does not settle.
4. **Record both.** A class present with the paint wrong is a finding, and a stronger one than either half alone.
5. **Where no painted consequence can be named at all**, the unit is a read-check that reached the wrong track. That is
   a `questNotes` open question — siegemaster may ADD an observable, and may not reflag one.

**Step 1 is the whole move, and it is the same one the trial's result demands.** Arm B read the implementation and
confirmed what the code already did. An observable phrased in the implementation's own words does that to a walk
automatically, by handing it the mechanism instead of the outcome.

#### The prompt changes this needs — the rule EXISTS, and the gap is on the third reader

**"A class name" is already in both ChaosWhisperer lists**, so nothing below is a new rule. What is missing is one
reader, and what is drifting is a copied list.

| Where it stands today                                                                                                                                                               | File                                       |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------|
| the AUTHOR is told to flag "A font size, a colour token, **a class name**, a border, a padding, an animation duration, a typeface, a \"matching `<some other component>`\""         | `dumpster-create-prompt-statics.ts:163`    |
| the gap MINION is told to warn on "a font size, a colour **or colour token**, **a class name**, a typeface, a border, a padding **or margin**, an animation duration, or a … claim" | `chaoswhisperer-gap-minion-statics.ts:191` |
| SIEGEMASTER is told only about the FLAGGED case: *"An observable the flow marks `(read-check)` is settled by opening a source file, which no round can do"*                         | `siegemaster-prompt-statics.ts:226`        |

**Three change items, in the order they matter:**

1. **Siegemaster has no rule for an UNFLAGGED one, and that is where the false pass lives.** Its prompt handles the
   flagged case correctly and says nothing about a class-name observable that reached its list. The gap minion's own
   text already states why that is fatal — *"No downstream track can refuse it … none holds a verdict meaning 'this
   should not have a test'"* — so siegemaster will settle it, and the cheapest way to settle it is to read the class.
   Give it the five-step rule above: settle on what a person would see, measure it relationally, read the class as
   corroboration only, and route a unit with no nameable consequence to `questNotes`.
2. **The two lists are COPIES and have already drifted, in the damaging direction.** The author's is NARROWER than the
   reviewer's — no raw colour, no margin — and the author is the only role that may SET the flag. So a raw hex colour is
   a warning the minion raises about a flag the author was never told to set, which costs a round trip at best. Extract
   ONE block and interpolate it into both, exactly as `standardsReviewConcernsStatics` is interpolated into three
   reviewer prompts. Siegemaster becomes its third reader, which is the same shape.
3. **Add the SIEGE consequence to that block's rationale.** Both copies argue only that the test is a change-detector —
   *"green the day it is written, red on the next restyle, blind to every defect in between."* True, and it is the
   weaker half. The other half is that on the track whose whole premise is that the browser is the verdict, a unit
   settled on a class that is present while the paint is wrong is a signed `confirmed` on a defect nobody looked at.

**Editing a shared block is a contract on every prompt reading it**, and this package's own rules say an edit is
unfinished until all of them still agree. Three prompts will read it after item 2, so the colocated test in each is what
catches a fourth copy appearing.

### A READER settles what only source can answer, so no walker ever opens a file

**A walk reads no code. None, at any point, for any reason.** That is stronger than the rule this design has carried
until now, and the thing it removes is the last exception: the walker prompt today says reading source "is still right
for what a page cannot show — a configured cap, a default, where an off-screen value is written".

**That exception is arm B in miniature.** Arm B's contamination was never about WHICH file it opened. A walker that
opens one file to find a configured cap now holds that file for the rest of its walk, and every later judgement is made
by a session that has seen what the code intends. The trial measured what that produces: *"all six units reached on
first attempt with exact expected values known in advance."* Six correct verdicts, and no independent look.

**So the reading is DISPATCHED, to a sub-agent that reads and never drives.** One `siegemaster-reader`, run before any
walk goes out, returning values with their provenance. The walkers are handed facts.

**It is the FOURTH guide heading to undergo the same transformation**, which is what makes this a pattern rather than a
special case:

| Heading          | Was                                                   | Becomes                                                     |
|------------------|-------------------------------------------------------|-------------------------------------------------------------|
| `SEEDING`        | commands a guide-writer derived                       | the planner's path→recipe mapping, cited                    |
| `CONTROLS`       | selectors a session worked out                        | the key, read off the running page                          |
| `TRAPS`          | oddities rediscovered per quest                       | the committed oddities file                                 |
| **`OFF-SCREEN`** | **instructions telling a walker what to go and read** | **the VALUES, already read, with `file:line` against each** |

```
OFF-SCREEN
  quest list cap          50      questListStatics.ts:12
  default guild slug      siege-1 guild-create-broker.ts:88
  outbox path             .dungeonmaster/event-outbox.jsonl   quest-persist-broker.ts:41
```

**What the reader may return, and the one thing it may not:**

| Returns                                                      | Because                                                                                   |
|--------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| a LOCATION — where a value is written, which file, which key | a path is not an expectation. A walk needs it to know where to look                       |
| a CONFIGURATION — a cap, a timeout, a default                | the system's own setting, which no screen shows                                           |
| the reading for an unflagged implementation-detail unit      | a className unit that reached the list is settled by opening the file, which is a reading |
| **an EXPECTED VALUE the unit should have carried**           | **it may not.** See below                                                                 |

**A reader that finds a unit whose expected value exists ONLY in source reports that, and settles nothing.** Handing the
value forward would launder arm B's failure through one extra session: the walk would still be measuring the system
against what the code intends, with the contamination now invisible because it arrived as a fact in a brief. That is a
`questNotes` open question — the same route the className case takes, and for the same reason.

**It costs no instance.** The reader starts nothing, drives nothing and holds no pool slot, so it runs beside whatever
else is going on. It is also a LEAF: it dispatches nothing and signs nothing.

### Operational flows have no screen, and the browser walker's prompt is mostly noise there

**Siegemaster takes BOTH flow types — `signoffTrackEligibilityStatics` says so, and an all-operational quest seeds one
siegemaster item per flow and no flowrider item at all.** So siege is the ONLY track on an operational flow. Everything
this design has written so far is browser-shaped: the key, refs, the shot, `pixelChange`, `blank`,
`[LOOK AT EVERYTHING]`. Hand an operational unit to that session and most of its prompt is inapplicable, which is the
same failure as handing an agent a `verifyByHuman` unit — it does not skip what it cannot do, it reaches for the nearest
thing it CAN measure.

**The routing rule is DERIVABLE, and the repo already holds the table that derives it.** `qaCheckSurfaceStatics` maps
every outcome type to the surface its value must be read from, and its own header states the thing that decides this:

> The surface a flow is DRIVEN at and the surface an observable is CHECKED at are routinely different — a browser flow
> can carry a `db-query` or `log-output` observable, and the DOM cannot show a row that was written or a line that was
> logged.

**So the split is two questions, not one:**

| Question                             | Answered by             | Decides                                    |
|--------------------------------------|-------------------------|--------------------------------------------|
| who DRIVES the path                  | the flow's `flowType`   | which walker is dispatched                 |
| what SURFACE each unit is checked at | the observable's `type` | which reading settles it, inside that walk |

**Three populations follow, and only the first needs a new session:**

| Population                                                      | Goes to                         | Because                                                                                                                     |
|-----------------------------------------------------------------|---------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| an OPERATIONAL flow — no screen anywhere on the path            | **a `siegemaster-operational`** | there is no browser to drive, and the verifier's whole vocabulary is about one                                              |
| a RUNTIME flow's non-browser units — a log line, a written file | the browser walker, unchanged   | the walk is already at that node, and `file` / `request` / `results { kind: 'server' }` are one more step in the same batch |
| the off-map families                                            | the antagonist, unchanged       | already allocated per round                                                                                                 |

**The test for the middle row is whether reaching the unit needs the PATH DRIVEN.** A `log-output` unit that only exists
after four clicks belongs to the session doing the clicking; splitting it out would make a second session re-drive the
whole path to reach it. That is one step against a whole walk.

**The name is not `siegemaster-operator`, deliberately.** This design uses "the operator" throughout for siegemaster
itself, and a minion whose name reads as its own parent is a collision in every brief that mentions both.

**What siegelense already gives it, and what it does not.** Measured against `qaCheckSurfaceStatics`' own list rather
than guessed:

| Surface                                       | Today                                                          | Verdict                                                                                         |
|-----------------------------------------------|----------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| `api-call`                                    | the `request` step, and `results { kind: 'network' }`          | covered                                                                                         |
| `file-exists`                                 | the `file` step, and `until { file }`                          | covered                                                                                         |
| `log-output`                                  | `results { kind: 'server' }` — the instance's two server logs  | **partial**: any OTHER log file is a `file` read, and nothing tails a log stream                |
| `cache-state`                                 | the `storage` step                                             | covered                                                                                         |
| `custom`                                      | drive the path, read what it left                              | covered by construction                                                                         |
| **`process-state`**                           | `status` reports the INSTANCE's own processes                  | **gap** — nothing answers "is the app's child alive, what was its argv, what did it exit with"  |
| **`environment`**                             | the instance SETS env; nothing reads what the process RESOLVED | **gap**                                                                                         |
| `performance`                                 | settle timings, `hold`, rss in `status`                        | **partial** — no step measures a named elapsed figure deliberately                              |
| `queue-message` · `db-query` · `external-api` | —                                                              | **gap**, and `queue-message` is real here: this repo has an event outbox and an execution queue |

**It needs an instance and does NOT need a browser**, which the profile design already turns into a saving. A lane spec
is keyed by its content hash, so a browserless spec profiles separately, costs less, and raises what `capacity` will
allow in a pool. Nothing has to be added for that — it falls out of keying the profile by the spec.

**The repo's "the browser UI is the verdict" rule is not weakened by any of this, and must not be read as weakened.**
That rule governs a flow that HAS a UI, and on one it outranks every backend assertion. An operational flow has no UI
for it to govern, and its verdict is the state the system actually left behind — a file's bytes, an exit code, a log
line, a message drained or not.

### The verifier and the antagonist, distinguished in full — every row here is a PROMPT change

**One principle generates almost all of it: the verifier measures against the UNIT, the antagonist measures against a
BASELINE.** A verifier asks whether the screen shows the value its unit names, so its comparison is to a sentence in the
spec. An antagonist claims an ABSENCE — I attacked this and it did not fall over — and an absence is only evidence
against a known-good reading taken before the attack. Everything below falls out of that.

**The prompts do not carry most of this yet, and `siegelense-tooling.md` Part 2 holds the tool half.**

|                                 | **`siegemaster-verifier`**                                       | **`siegemaster-stress`**                                                                                                  |
|---------------------------------|------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| claims                          | the screen shows the value the unit names                        | I attacked this and it did NOT fall over                                                                                  |
| compares against                | the UNIT's stated value                                          | a BASELINE reading                                                                                                        |
| needs a pair of readings around | the whole path — start and end                                   | **each attack**                                                                                                           |
| its fixed-shape reading         | the KEY                                                          | **`health`** — root present · not blank · console · 5xx · server log                                                      |
| baselines                       | **PRODUCES** them; its clean shots promote per node              | **is HANDED** them — the dispatch carries the happy walk's instance and run ids for the same path                         |
| a toast appearing               | a change worth reporting                                         | often the system WORKING. On a sad-path node its ABSENCE is the finding                                                   |
| a transient baseline            | rarely its problem                                               | a PRESENCE question — was the toast there, with that text — never a pixel diff against a moment that has passed           |
| reset                           | rarely. Progressive: snapshots as checkpoints, seldom going back | **every cycle**, from a named snapshot, and each attack declares the LEVEL it needs                                       |
| `expect: 'error'`               | it does not use it                                               | the normal case — and a step carrying it that SUCCEEDS is itself a finding                                                |
| what it signs                   | the observable, terminal and branch units on its path            | ONLY the off-map family it was allocated                                                                                  |
| key flags it lives on           | `clipped-x`, `offscreen`, `covered by N`, `low-contrast`         | **`invalid`**, **`live` / `alert`**, and **`maxlength` / `pattern` in `attrs`** — which is literally what it is attacking |
| an instance death               | bubble up as `rework`, never a finding about the app             | the same — **and it is the role most likely to have CAUSED one**, which is exactly why it must not judge that itself      |
| records against                 | the PATH it walked, clean or not                                 | **each ATTACK**, held or not. An absence with no run id behind it is the least checkable claim in this system             |

**What is the SAME for both, so a prompt author does not over-split:**

- Neither opens a source file. A `siegemaster-reader` supplies what only source can answer, as values with `file:line`.
- Both record the instance id and run id as PROOF the work was driven, not only when something broke.
- Both own `kill`, both wait on the same start queue, and both read a slow `start` as a QUEUE rather than a wall.
- Both take the `dom` ladder: the key first, `dom` last and narrow.
- Both bubble a dead instance up as `rework` and check `status` before writing anything down.

**One gap this exposes, and it is real: the antagonist on an OPERATIONAL flow.** The seven off-map families are
properties of the BUILT SYSTEM rather than of any drawn flow, and siegemaster keeps them even on a quest with no
eligible flow at all — so `hostile-input` and `perf` coverage exists whether or not a screen does. On an operational
flow the antagonist has no `paste`, no `key`, no `click`: its attack surface is `request`, `file` and the process
itself, against the browserless lane spec. Nothing today says so, and a prompt that assumes a browser leaves this
quest's only security coverage with no way to run.

### Baselines: promoting a walk's shots

A verifier already produces what a stress tester lacks: pictures of the system working.

**Cross-lane comparison holds, measured.** The pair run in separate lanes deliberately, so a baseline is worth nothing
unless it survives the move. Three agents on three lanes with three port pairs produced byte-identical PNGs — 46,786
bytes each. The requirement is a DETERMINISTIC seed; a seed whose runtime ids paint on screen would break byte-identity.

**A tainted baseline is worse than none, and the failure inverts the check.** Compare "after my attack" against a before
that was already broken, see no difference, report that it held. A false pass on the role carrying this quest's only
`hostile-input` and `perf` coverage.

**Promotion is per-SHOT and mechanical**, off sign-offs that already exist:

> A shot is promotable only where every unit on that node came back `confirmed` AND the round
> recorded no issue at or before that node.

The "or before" half is the easy one to drop. Once a defect lands the system may be in a bad state, so a later screen
that looks right was reached through a fault.

**How an antagonist actually GETS them, which nothing here said until now.** "Inherits a verified-clean baseline" is a
property, not a mechanism. The mechanism is the one every other reader of a finished walk uses: **the operator's
dispatch carries the happy walk's instance id and run id for the path being attacked, and the antagonist reads its shots
with `results`.** That starts nothing — no boot, no port pair, no pool slot — and it answers for an instance killed
hours earlier, because evidence outlives its instance.

```
dispatch → attack path 3
  BASELINE  inst_9b2c · run_2        ← the happy walk of this same path, signed clean
results { instance: 'inst_9b2c', run: 'run_2', kind: 'screenshots' }
→ step 4  …/run_2/step4.png   node: guild-selected
  step 7  …/run_2/step7.png   node: chain-rendered
```

**Handed is not the same as started, and the antagonist must not confuse them.** The rule it shares with a fixer — touch
no instance you did not start — is about PROCESSES. Reading a baseline starts none. What it must not do is go looking
for a baseline it was not handed, because "some earlier walk of something similar" is exactly how a tainted baseline
gets in.

**On a SAD path, "known good" is an error rendered CORRECTLY — and that is usually a toast.** This is the half that
inverts if nobody writes it down. A walk path through a failure branch ends at an error message, a disabled control, an
empty state with a reason on it. Its baseline shot HAS that toast in it, and it is the correct screen.

| Attacking a happy node                        | Attacking a sad node                                                    |
|-----------------------------------------------|-------------------------------------------------------------------------|
| baseline: the working screen                  | baseline: **the error, painted the way the unit says it should be**     |
| a toast appearing is a change worth reporting | a toast appearing is the system WORKING, and its absence is the finding |

**Both directions fail silently without this.** An antagonist holding a happy-screen baseline while attacking an error
branch reports the toast as damage, which is a false defect. The inverse is worse: the app swallows the error, shows
nothing, `pixelChange` reads `0%`, and "nothing changed" gets written down as *it held* — a false pass, on the role
carrying this quest's only `hostile-input` coverage.

**So the baseline is fetched per NODE on the path being attacked, never one shot per walk.** The promotion rule already
works per node and per shot; what this adds is that the antagonist asks for the node it is about to attack rather than
the walk's opening screen.

**A toast is TRANSIENT, and a baseline of one is a baseline of a moment.** It auto-dismisses, so a comparison against it
turns on capturing at the same point after the same action — and a pixel diff against a baseline whose toast has since
gone reports a difference that is only timing. Read a transient baseline as a PRESENCE question — was the toast there,
with that text — and leave the pixel comparison to the screens that hold still.

### When a session's instance dies under it: bubble up, never self-heal

**Every session that drives the tool needs this in its prompt, and that is more sessions than it looks.** The happy
walker and the antagonist obviously. **The PLANNER too** — it starts and stops instances to prove preludes, so it meets
every failure a walker meets.

**The rule is: report it to whoever dispatched you. Do not fix it.**

| A session must NOT                          | Because                                                                                                                    |
|---------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| start a replacement instance                | an instance that died of memory pressure will die again, and now two are dead while the session believes it is progressing |
| kill orphans it finds                       | it cannot tell whose they are. Three walks are running and it can see only its own                                         |
| retry the batch                             | the same batch against the same pressure gets the same death, twice as slowly                                              |
| **report the crash as a defect in the app** | see below — this is the one that corrupts the record                                                                       |

**A dead instance is `rework`, never `wall`.** The distinction is sharp and already lives in these prompts: `wall` means
"the environment blocks every session of every role" and it halts the quest. A tool crash is not that. Fewer instances,
or a fresh one, very likely succeeds — so it goes back to the dispatcher as `rework`, carrying the instance id and the
`status` output, and the dispatcher decides.

**Only the operator can see the pool.** A minion knows about its own instance. The operator knows three are running,
knows what `capacity` now says, and is the only session that can decide to drop to two or to stop the phase. A minion
self-healing is a session acting on a third of the picture.

### The crash a walker must NOT mistake for a defect

**A driver death is a tool event. A CHILD death may be a real finding.** `status` separates them, and the difference
decides what goes in the record:

| What died          | What it is                                                                                                                       |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------|
| the driver         | a tool event. Bubble up. **Never a finding about the app**                                                                       |
| the browser        | usually a tool event; occasionally the page did it                                                                               |
| **the API server** | **possibly an app defect** — a leak, an unbounded allocation, a crash on a payload. Bubble up AND record it, with the server log |

**The trap is a blank screen.** An instance whose driver died leaves a walk looking at nothing, and
"the page went blank" is exactly what a walker is trained to report. That blank was the tool dying, not the app — and a
fixer briefed against it goes hunting for a rendering bug that never existed. This is the false-defect pattern arriving
one more time, from the tool itself.

So the order is fixed: **a walk that sees its instance stop checks `status` BEFORE writing anything down.** The `blank`
flag and `likelyCause` together say which happened.

### A walk RECORDS the instance that walked it, and that is the proof it was driven

**Requirement: every path a walk claims to have walked is recorded with the instance id and the run id that walked it.**
Every attack an antagonist claims to have run, the same. A path claimed with no instance id behind it is a claim, and
this repo's standard for a claim is already written: *"Never claim tests were written without running them and showing
the output."* A siege walk is the same transaction at a different layer.

**The pattern already exists one level down, and this is it applied one level up.** A prelude's `VERIFIED` line is "not
a claim that it should work — the id of a run where it did". A walked path gets exactly that treatment: the path, the
instance, the run, the date.

```
PATH 3   entry → guild selected → quest open → row expanded → chain rendered
  WALKED   inst_9b2c · run_2 · 2026-09-14 · 6 units signed, 1 issue raised
```

**The clean walk is the one that needs this most, and the one most likely to skip it.** A walk that raises an issue
records an instance id anyway, because the fixer's handoff demands it. A walk that finds nothing raises no issue — so
under an issue-only rule it records nothing, and "I walked path 3 and it was clean" arrives with no evidence that
anything was ever driven. That is the exact shape of result this role exists to make trustworthy.

**It buys two things, and they fail differently:**

| What it buys                                | What its absence looks like                                                                                    |
|---------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| **proof the path was actually driven**      | a clean sign-off nobody can check, which is indistinguishable from a walk that skipped the path                |
| **the only handle on that walk's evidence** | shots, server logs and the transcript all retained, all reachable, and nobody holding the id that reaches them |

The second failure is the quiet one: nothing browses, nothing searches, and the evidence sits there until it ages out.

**It lives in `quest.json`, not in `.quest-plans/`.** The plan directory is per-quest and is wiped when the quest ends,
and the id has to outlive that: a fixer or a person can arrive after the quest closed, while the evidence is still
retained. So the durable record is the quest itself.

**The cheapest home is a `walked` kind on `questNotes`**, which already carries `{ id, kind, role, workItemId, flowId?,
unitId?, summary, detail, at }` and already holds a siegemaster-only kind in `walk-reset`. A WALKED record closes no
unit — it records that a path was driven — which is exactly what that side channel is for, and it costs one enum value
rather than a new top-level array.

**One sub-detail for whoever writes the contract: the ids want their own FIELDS if anything mechanical reads them.**
`summary` and `detail` are prose, and prose is fine for a fixer reading a record. It is not fine for the reference
rule — a `WALKED` line is one of the things `prune` and `cleanup` refuse to delete over, and a resolver cannot match an
instance id buried in a sentence. Typed `instanceId` and `runId` fields make that check real instead of best-effort.

### Handing a defect to a fixer: what a walker must write down

**A fixer needs to reach the state the walk was in, and the instance is gone by then.** The walker kills it as its last
action, by its own rules. So the handoff cannot be "here is my instance" — it has to be everything a fixer needs to get
back there on its own.

**What the walker records against every issue:**

| Field                      | For                                                                                                                      |
|----------------------------|--------------------------------------------------------------------------------------------------------------------------|
| the INSTANCE id and RUN id | provenance, and **the only handle anything has on the evidence** — nothing browses for it                                |
| the failing STEP           | `{ run: 'run_2', step: 7, verb: 'click' }`. Usually the whole answer                                                     |
| **the PRELUDE**            | the runnable batch that reaches this path's entry. This is what makes the state reproducible                             |
| the evidence paths         | the shot and the video, as paths. The server log, the key and the wire are QUERIES that take the run id and a step range |

**An id that never gets written down is evidence nobody can reach.** The tool retains the run and offers no way to find
it without the id — no listing, no search, by decision rather than by omission. So the record IS the index, which is why
these fields belong in what the quest record REQUIRES rather than in what a careful walker remembers.

**The fixer does not resurrect the dead instance — it RE-RUNS THE PRELUDE on a fresh one.** That is what preludes were
for, and why `VERIFIED` matters: the fixer is handed a batch already proven to land where it claims. "Restart to check
state" is a fresh instance plus a known-good prelude, not a corpse brought back.

**`results` keeps answering for a killed instance, and answering STARTS NOTHING.** The evidence lives in the instance's
own directory under the asset tree, which survives `kill` by the state-versus-evidence rule, so every reading is read
from disk and the answer carries a flag saying the instance itself is gone. Without that, a fixer holding a run id would
find it resolves to nothing — and the handoff would depend on the walker having copied every reading into its record by
hand.

**Reading costs no instance, no boot and no pool slot**, which a fixer will get wrong in the cautious direction if
nobody says it. "Touch no instance you did not start" is a rule about PROCESSES. A fixer that believes it must boot
something before it may look at its own record's evidence has spent a pool slot and is reading a fresh instance's state
instead of the one where the defect happened.

**Against a finished instance the RUN ID is required, and `results` refuses to guess.** That instance may hold the
prelude's proving run, the walk, and a re-walk; "latest" silently reads whichever went last.

**Every path handed back is absolute and repo-local**, through the `.siegelense` symlink `dungeonmaster init` creates,
so opening a shot is a plain `Read`. A path under someone's home directory is a filename the reader cannot open, which
is the same as handing back nothing.

### The fixer writes the e2e, and the PRELUDE is what makes that possible

**A siege fixer reads code and writes tests — e2e tests, for the defects a walk found.** That is its job and it is the
only role here that writes product code as well.

**The hard part of writing that e2e was always the setup**, and the recipe book solves it by accident:
the prelude names recipes, and **a recipe is a plain function an e2e can call directly.**
`subagentDurationHarness` is pure `fs`; the HTTP-fidelity ones are a `fetch`. So the state a walk ran against and the
state its regression test runs against come from the SAME recipe, called two different ways.

That is worth naming because the alternative is what happens today: the fixer re-derives the setup in the e2e's own
idiom, gets it subtly different, and the test passes against a state the walk never saw.

| The walk used                               | The e2e uses                                     | Result                                   |
|---------------------------------------------|--------------------------------------------------|------------------------------------------|
| `seed guild-with-three-quests` in a prelude | the same recipe, called in-process from the spec | one seeding vocabulary, no re-derivation |

**The `RED FIRST` discipline is unchanged and now cheaper to satisfy.** A fixer must watch its test fail against
unchanged source for the right reason. Handed the prelude and the walk's `SAW:` value, it has the assertion and the
setup; what it has to supply is the fix.

### What the operator owns after a crash

**Cleanup and getting the machine back to a known state, before anything else is dispatched:**

1. `status` — what died, what is orphaned, what the machine looks like now.
2. `cleanup` — reap what has gone stale. Reaping is by STALENESS, so any session may do it; what makes this the
   operator's job is that it is the one that knows the pass is over, not that it holds special standing. No cleanup
   touches a LIVE instance, its own minions' included.
3. Re-read `capacity`. A death is evidence; the profile has been corrected by it.
4. Re-dispatch the affected walk on a fresh instance, possibly into a smaller pool.

**Step 4 is the whole answer to a crashed minion. The operator does not mine the corpse.** The dead instance's evidence
is retained and readable, but what an operator would be reading is a walk that stopped partway — and a verdict assembled
out of half a run plus a second run is not a walk. `status` says WHY it died, which is what decides the pool size; the
walk itself starts again from the top.

**The one thing that does survive a crash is a defect the walk had already written down.** If the walker recorded an
issue at step 4 and died at step 9, that issue keeps its instance id, its run id and its evidence, and a fixer works it
exactly as it would from a clean walk. What is lost is everything the walk had not yet said out loud.

**And no phase advances while any instance is in an unknown state.** Stamping the happy phase and launching the
antagonists while orphans still hold ports and memory hands the attackers a machine already under pressure — and the
first thing they measure is that pressure.

### `cleanup` — the operator's bookend

**Reaping already happens opportunistically: `start` and `capacity` both sweep stale instances when they run. What that
misses is the quiet case** — a pass crashes at 2am, nothing calls the tool again for nine hours, and nine hours of
orphans hold ports and memory with nobody to notice.

**So the operator calls `cleanup` twice: once at the START of its pass, once at the END.**

| When      | Catches                                                                                                                   |
|-----------|---------------------------------------------------------------------------------------------------------------------------|
| **start** | whatever a PREVIOUS pass left behind. Also makes the first `capacity` reading honest instead of inheriting someone's mess |
| **end**   | whatever THIS pass leaked — a minion that died before its `kill`, an instance a crash orphaned                            |

```
cleanup {}
→ { reaped: [ { id: 'inst_9b2c', staleFor: '9h', killed: [33812, 33840], homeRemoved: true } ],
    portsReleased: [41345, 34173],
    lockReleased: true,
    assetsAged: { instances: 3, freedMB: 1840, videoFirst: true },
    leftAlone: [ { id: 'inst_7f3a', why: 'live — last beat 2s ago' },
                 { id: 'inst_1d09', why: 'run_7 cited by a VERIFIED prelude in .quest-plans/1dac5395…/path-3.md' } ] }
```

**`leftAlone` is not padding.** A cleanup that reports only what it removed is indistinguishable from one that removed
the wrong thing, and the question a session actually has after running it is *did you touch anything of mine.*

**It is safe to run at any moment, including mid-pass**, because it only ever acts on staleness. The operator's own
minions are live and young when it runs at the start; another developer's instance is live and protected the same way.
**No cleanup kills a live instance, ever**, and none prunes evidence a
`VERIFIED` prelude, an open issue or an open quest's `WALKED` line still references.

**This is deliberately a bookend rather than supervision.** Continuous watching is a daemon, and this design has already
refused one twice. Two calls per pass is not complete cover — an orphan created between the bookends waits for the next
pass — and it is enough for now, which is the honest claim.

## Part 5 — Restructuring the pass

### Phase zero: a PLANNER provisions the recipes — not the operator

**The operator cannot do this work, by its own rules.** Siegemaster's tool block says it drives nothing: no browser, no
`curl`, no CLI run. Proving a recipe means RUNNING it against a live instance and reading the state back. So
provisioning is dispatched, exactly as the guide already is.

**It is a distinct sub-agent from the guide-writer**, because the mandates conflict. The guide-writer is told "DO NOT
change any file but the guide · run no test · start no server" — and that constraint is load-bearing, not incidental. A
planner must write files and start an instance. Widening the guide-writer to cover both is how a bounded job stops being
bounded.

**What the planner does, WALK BY WALK:**

1. Read the checklist's `## WALK PATHS` — every route through the flow.
2. For each path, work out the state it needs to be reachable at all.
3. Match those states against existing recipes. Write a recipe for each gap.
4. **RUN the whole prelude for that path and confirm it lands where it claims.** Not each recipe alone — the SEQUENCE,
   end to end, against a throwaway instance.
5. Record the path's entry, keyed to the path.

**It validates EVERY recipe it plans to use, not only the ones it wrote.** An existing recipe is not trusted on the
grounds that it worked last quarter. Recipes are `fidelity: direct` more often than not, which means they mimic a shape
production owns and can drift from it silently — and nothing about that drift touches the feature under test, so nothing
else would have caught it. The recipe is simply out of date, and the first thing to notice is a walk that cannot start.

**Testing the SEQUENCE is what testing each recipe alone does not give you.** Three recipes that each pass in isolation
can still fail composed: one leaves state the next does not expect, an id from the first is not what the second wants,
the order matters and nobody wrote that down. The thing that has to be true is "this path is reachable", not "these
recipes run".

**And a stale recipe is nastier than a missing one, in the way this doc keeps running into.** A missing recipe fails
loudly at plan time. A stale one succeeds partially, the walk starts against a state nobody intended, and what it
reports is a defect that does not exist — a fixer briefed against a symptom, hunting in working code.

**Its cost grows with path count, and not linearly.** Ten paths means ten preludes run once each, but the planner's own
`start` calls queue behind whatever else holds the pool, so the wall-clock is longer than ten boots and shorter than ten
serial walks. Against a 20-second boot it is minutes either way — and it buys not losing a whole ROUND to a seed nobody
checked.

**Step 5 is the one that cannot be skipped, because an unproven recipe does not fail loudly — it manufactures false
defects.** A recipe that claims two rows and seeds one leaves the verifier looking at a one-row list. The verifier does
its job correctly and reports a defect. A fixer is briefed against a symptom that does not exist and goes hunting in
working code. A whole round is spent, and nothing in the record says the seed was the problem.

The quieter version is worse. A recipe seeding ONE of something an assertion must tell apart makes
"the right one" and "the first one" the same value — so an off-by-index bug passes, the walk comes back clean, and the
clean result means nothing. That is the guide's own **"TWO of anything an assertion must tell apart"** rule failing one
level below where it is written down.

**What it produces — a PRELUDE per path, runnable, and already run once:**

```
PATH 3   entry → guild selected → quest open → row expanded → chain rendered
  PRELUDE                                    ← reaching the path's entry state
    seed  guild-with-three-quests                          as: g
    seed  quest-mid-execution  guild:{g.guildId}           as: q
    goto  /{g.guildSlug}/quest/{q.questId}
    click [data-testid="EXECUTION_ROW_0"]                  ← no recipe covers this; it is a step
  MID-WALK                                   ← seeds that fire PARTWAY, not at the start
    at node  chain-rendered:
      seed  subagent-chain-arrives  quest:{q.questId}
  VERIFIED  run_7 · 2026-09-14 · prelude reached the entry, all produces: asserted
```

Three things that shape earns:

- **The prelude is a runnable batch, not prose.** It is handed to a walk and submitted, rather than described and
  re-derived. Anything the guide would have spelled out under `SEEDING` is here as steps.
- **It mixes recipes and driving steps, because reaching a state does both.** A row that must be expanded before the
  thing under test exists is not seeding and no recipe should pretend it is.
- **Mid-walk seeds are keyed to the NODE they fire at**, not appended to the end. That is the live-update shape — seed
  with the page open, watch the screen react — and a mid-walk seed recorded as part of the prelude would silently become
  a fresh-render test instead.

**`VERIFIED` names the run that proved it.** Not a claim that it should work: the id of a run where it did, on a date. A
prelude with no `VERIFIED` line is a path no walk may be sent down.

**And its outputs split along the same line as everything else here:**

| Output                  | Where it lives             | Why                                                                               |
|-------------------------|----------------------------|-----------------------------------------------------------------------------------|
| the per-path preludes   | `.quest-plans/`, per quest | they are about THIS flow's routes and are meaningless to the next quest           |
| **any recipe it wrote** | the committed recipe book  | a state worth creating once is worth creating again. This is the compounding half |

**The operator's job shrinks to what an operator does:** dispatch the planner, read what came back, and refuse to
dispatch a walk down a path whose recipe is missing or unproven. It never runs one.

**The guide-writer then runs after, and its `SEEDING` heading cites the mapping** rather than deriving commands — the
same transformation `CONTROLS` undergoes when the key arrives, and `TRAPS` when the oddities file does.

**Nothing is trusted on age.** An existing recipe gets run exactly as a new one does, because the failure this catches
is a recipe that rotted while nobody was using it. A round that STILL finds one wrong reports it, the same way it
reports a wrong guide heading — but that is the second line of defence, not the first.

### The planner reads almost no implementation — sub-agents do, for BOTH jobs

**Two jobs, one dispatch shape.** A recipe is either missing or broken, and in both cases the work is reading production
code to find out what a state really requires. The planner does neither.

| Job                                    | Input the planner supplies                                                                                 | What comes back                                                                                                     |
|----------------------------------------|------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| **research** — the state has no recipe | the state in the FLOW's own words, the package likely owning it, the recipes already nearby                | whether existing recipes already compose to it; otherwise a new recipe, its test, its `fidelity` and its `mirrors:` |
| **diagnose** — a recipe ran and failed | the recipe, its `produces:` claim, its `fidelity` and `mirrors`, **and the readings from the failing run** | what changed, the fix, and whether the break is really a finding about the app                                      |

**"Does something existing already compose to this?" is the FIRST question, not the last.** The composition rule says
the catalogue gets deeper rather than wider, and a researcher that writes a new recipe where two existing ones compose
has made the book worse while appearing productive.

**The researcher is who fills `mirrors:` correctly**, because it has just read the production writer. Left for later it
becomes a guess, and a wrong mirror pointer makes the drift test assert against the wrong thing — which is worse than
having no pointer, since it passes.

**Why the planner must not just do this itself:** it has N paths to get through. Reading the quest contract, the
work-item shape and the valid statuses to write one recipe would spend the context the remaining paths need. Same lever
every operator in this system pulls, one level down.

**There is a second reason, and it is the trial's result arriving at a different door.** Arm B read implementation and
absorbed the answers before it drove anything. A planner that reads deeply is not signing units, but it IS deciding what
state every walk starts from — and a planner steeped in what the code does will tend to set up the state the code
produces rather than the state the flow claims. Keeping it at arm's length keeps the setup answerable to the spec.

**Both jobs end the same way: the PLANNER re-runs the prelude.** A sub-agent's claim that its recipe works is not
evidence, and a research job is no different from a repair in that respect.

**Two at a time over disjoint recipes.** That mirrors a rule that already exists in siegemaster's own prompt — *"Cap two
fixers, and only over a DISJOINT file set"* — and it is stated here rather than cited loosely, because that rule lives
in the orchestrator's prompt statics and not in this document. And **depth stops** — the planner is already one level
below the operator, so neither job dispatches anything.

### What each job is bounded by

**A DIAGNOSIS is bounded, not exploratory, and `fidelity` is what bounds it:**

| The recipe declares | The diagnosis is                                                                                                                                           |
|---------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `direct`            | find the production writer whose shape it copies, and diff what that writes NOW against what the recipe writes. The recipe is a copy that stopped matching |
| `production`        | the real code path it calls changed — a route, a payload contract, a status. Read the handler                                                              |
| `captured`          | the recording is of a version that no longer exists. Re-capture, do not patch                                                                              |

**So a `direct` recipe must name what it mirrors.** Without it, every diagnosis opens with a hunt for the counterpart.
The companion plan's own example is exactly this: a web harness "hand-appends the
`event-outbox.jsonl` line that `questPersistBroker` writes in production" — so that recipe's entry reads
`mirrors: questPersistBroker`, and a diagnosing agent starts there instead of guessing.

**The brief carries what only the planner has:** the recipe as it stands, its `produces:` claim, its
`fidelity` and `mirrors`, and **the actual failure — the readings from the run that just failed**. That last part is the
difference between "this recipe is broken, go look" and a diagnosis that starts from a measured symptom.

**A RESEARCH job is bounded by the flow, not by the code.** Its input is the state in the flow's own words — "a quest
mid-execution with one running work item" — and its job is to find what that requires. Handed an implementation detail
to start from instead, it writes a recipe for whatever the code happens to do, which is the thing arm B proved is worth
avoiding.

**Sometimes the break is the correct alarm.** Three recipes failing at once because production changed what it writes is
either an intentional migration nobody told the recipe book about, or an unintentional one nobody noticed. The diagnosis
says which, and the second case is a finding about the app rather than about the recipe — it goes to the quest as an
observable, not into a recipe patch.

**This is strictly a pre-phase.** If every happy walk dispatches at once, every recipe those walks need is written,
proven and mapped before the first one goes out.

### The two phases

Siegemaster today runs one ROUND per path walk, each round dispatching a verifier and a stress tester **in parallel**,
each in its own lane. That parallelism is why round N's walk cannot hand a baseline to round N's attacker.

**Decision: split the pass into two phases.**

```
every happy walk, through a POOL (three here) — dispatch, refill as each returns
  → any bugs?  → fix  → walk again  → clean
  → no bugs
  → STAMP
  → every adversarial walk, same pool, each in its own instance
```

Three things follow, none needing a special case:

- **Every adversarial inherits a verified-clean baseline.** No round-1 exception, no `health`-only fallback, because no
  attack starts until every happy walk is clean. **"Inherits" is a dispatch carrying the happy walk's instance id and
  run id**, and the attacker reads that instance's shots without starting anything.
- **The clean walk's evidence is HELD while the quest is open**, because its `WALKED` line counts as a citation. A clean
  walk raises no issue, so an issue-only retention rule would let the operator's own `cleanup` age out the baselines the
  next phase is about to read.
- **Stale baselines cannot happen.** A fix invalidates the shots taken before it, and this shape re-walks after fixing —
  so what gets stamped is post-fix by construction.
- **The stamp means something.** A sign-off lands on a system just confirmed clean end to end rather than on a snapshot
  from partway through a fix loop.

What does NOT change: **lane separation.** Each adversarial still gets its own instance, because it corrupts and kills
what it is handed.

**"In parallel" means a POOL, and the pool size is MEASURED rather than assumed.** Three is this repo's policy ceiling
today. It is not a property of the tool, and nothing should treat it as one.

**The cost of an instance is a property of its LANE SPEC, not of siege.** This repo's spec happens to be three
processes — an API server, a Vite server, a browser. A repo with one server is cheaper; a repo with two is not; **and
adding a second server here changes the right cap the moment it lands.**
A number typed into a doc cannot track that.

### Profiling: measure what an instance costs, then divide

Simple, and it does not need to be more than this:

| Step                   | What                                                                                                                                                                                          |
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **sample**             | while an instance runs, sum the RSS of every process in its group, every few seconds                                                                                                          |
| **record two numbers** | STEADY (what it settles at) and PEAK (what it spikes to, which is boot — Vite prebundling, Chromium launch)                                                                                   |
| **key it by the SPEC** | a spec's content hash. Add a process to the spec and the hash changes, the profile is stale, and measurement starts again. That is the "I added a second server" case handled by construction |
| **divide**             | `suggested = floor((freeMem − headroom) / peak)`, then clamp to the policy ceiling                                                                                                            |

```
profile  spec 'dungeonmaster-web' (hash 7f3a…)          ← ILLUSTRATIVE FIGURES, not a measured run
  processes  3        api · vite · chromium
  steady     1.8 GB   sampled at pool size 1 · 2 · 3
  peak       2.6 GB   during boot, at pool size 1
  boot       20s      ← the one real number here; see Part 2
  from       14 instances, last 2026-09-14
```

**Only `boot 20s` is measured.** Part 2 holds every figure this project actually took, and it has no memory numbers in
it — nobody has profiled an instance yet. The memory values above exist to show the SHAPE and the arithmetic; treat them
as a worked example, not as this repo's real cost.

**Every sample carries the pool size it was taken at**, which is the invariant Part 7 states and which a schema without
the field cannot satisfy. Averaging a solo sample with a contended one produces a number true of neither condition, and
`suggested` derived from it is wrong in a direction nobody can see.

### Phase zero IS the profiling run, and that has two consequences

**The planner runs before anything else, alone, and starts instances.** One planner, no pool, no contention. So by the
time the first walk asks `capacity`, a profile already exists — measured today, on this machine, for this spec.

**That gives phase zero a second purpose nobody designed.** Even where every recipe already exists and every prelude
passes first time, the phase is not wasted: it comes out holding a fresh profile. A naive reading of "nothing needed
fixing" as "nothing happened" is wrong.

**And it means the no-profile default is a safety net, not a common path.** It fires for a brand-new spec, or a spec
that just changed, and almost never otherwise. Worth knowing before anyone over-engineers it.

**The caveat, and it is the one that would bite:** the planner profiles under the BEST conditions — one instance, quiet
machine — and the walks then run under the worst. So `peak` measured solo is optimistic for a pool of three: page-cache
pressure, memory fragmentation and CPU contention all lengthen a boot and raise a real peak in ways a solo run never
shows. `suggested` divides free memory by a number gathered when nothing else was competing.

The correction is the one already written down: **an OOM death corrects the profile.** Solo profiling gives a good first
estimate; contention teaches it the truth, and the profile should carry how many instances were running when each sample
was taken rather than averaging the two conditions together.

**One more asymmetry worth knowing: a profile's MEMORY figures travel between machines, its TIMING does not.** Peak RSS
is mostly a property of the spec — same processes, same allocations. Boot milliseconds are a property of the disk and
the CPU that ran it. Reuse the first across machines; re-measure the second.

**With no profile, `suggested` is TWO.** A fresh spec has no numbers, so the first pair runs and profiles itself — two
samples rather than one, and a first pass that is not needlessly serial. Two is a pragmatic default rather than a
derived one, and it is a knob: almost every spec on almost any machine holds two, and the failure when it does not is
slowness rather than corruption, which the very next `capacity` call corrects.

**Stagger starts, and the arithmetic improves for free.** Three instances launched together pay three boot PEAKS at
once — `peak × N`. Started one at a time, only the instance currently booting is at its peak and the rest have settled,
so the pool's high-water mark is **`steady × (N−1) + peak`**. On the numbers above that is 6.2 GB against 7.8 GB for the
same three walks.

**That formula is what `capacity` inverts**, and getting it wrong in the other direction is the expensive mistake:
`suggested` computed against `peak × N` under-provisions a staggered pool and leaves capacity unused, while computing it
against `steady × N` over-provisions and invites the OOM this whole section exists to avoid.

### The TOOL staggers, because nobody else can

**The operator cannot stagger starts: it never calls `start`.** Each minion opens its own instance — that is already how
the verifier prompt reads, and it is right, because the minion is the only session that knows when it is actually ready
to drive. The operator dispatches; it does not hold the start calls. Staggering its DISPATCHES instead would be guessing
at when each minion gets around to booting.

So `start` queues. It admits at most one boot at a time, and refuses past the pool size.

**A queued `start` BLOCKS, and says that it waited.** Blocking matches `run`, and the alternative — a handle to poll —
buys nothing for a caller that cannot proceed anyway. But it must be legible:

```
start { spec: 'dungeonmaster-web' }
→ { instance: 'inst_c41e', queuedMs: 34000, aheadOfMe: 2, bootMs: 21000, … }
```

**Without `queuedMs`, a 55-second start is indistinguishable from a hang** — and a minion that decides the tool is
broken reports a `wall`, which halts a quest over a queue working exactly as designed. That single field is the
difference.

**What each audience is told, and where:**

| Who                              | Learns                                                                                              | From                                                |
|----------------------------------|-----------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| a minion that starts an instance | "a slow start is a QUEUE, not a hang. Never report it as a wall"                                    | one line in its prompt — interpretation, not action |
| the operator                     | that a pool of three means the third walk waits out two boots, so wall-clock is not linear in walks | `capacity` and `docs`, not a special instruction    |
| whoever builds it                | one boot in flight at a time, refuse past the pool                                                  | this doc                                            |

**Nobody is told to stagger**, because nobody is in a position to. This is the same move as the shot list and the `open`
flag: put the rule in the tool, and it stops being three prompt sentences that drift.

**Why this matters more than tidiness:** contention does not crash, it makes a page paint in eight seconds where it
would take two, and the walk reports "the panel never mounted". Resource pressure manufactures false defects, the same
shape a stale recipe does.

```
capacity {}
→ { suggested: 2,
    ceiling:   3,
    why: 'profile 2.6GB peak; free RAM 5.2GB less headroom; 1 siege instance already up; a ward e2e run holds 2 ports',
    measured: { freeMemMB: 5320, cores: 8, loadAvg1: 4.2, siegeInstances: 1, diskFreeMB: 41000 },
    profile:  { spec: 'dungeonmaster-web', steadyMB: 1800, peakMB: 2600, fromRuns: 14 } }
```

| Field                  | Why it is there                                                                      |
|------------------------|--------------------------------------------------------------------------------------|
| `suggested`            | what this machine can take right now, from the profile. Never above `ceiling`        |
| `ceiling`              | the POLICY cap — a knob, three here, not a fact about anything                       |
| `why`                  | a sentence the caller can report. A pool of two with no stated reason reads as a bug |
| `measured` + `profile` | the numbers behind the judgement, so it is checkable rather than trusted             |

**It counts instances this session did not start.** A parallel agent's lanes, a ward e2e run holding a port pair, the
dogfood dev server — load this pass did not create and must not ignore.

**Advisory, with one hard floor.** It reports and the caller decides, consistent with every other reading here. The
exception is starting an instance the machine plainly cannot hold: there the failure is the OS killing something at
random, which is worse than a refusal, so `start` refuses and says why.

**Settle detection softens this but does not remove it.** A settle-based step waits as long as the page needs, so
contention costs wall-clock rather than inventing a timeout. But the ceiling still exists, and under enough load a page
will not settle inside it — degrading a false defect into "a timeout that names what was still busy", which is better
and still not a measurement.

**An instance outlives the session that started it, and something must reap it.** The driver already closes on an idle
timeout, and that stays — it is the backstop for a session that dies mid-batch. But a session's final response kills
nothing here (the instance is not its child), so **`kill` is mandatory and explicit**, and a phase that ends with
instances still up has leaked three processes per walk.

What this trades is the current one-path-at-a-time serialisation, which was priced against a walk nobody had timed. A
lane boots in 20 seconds and a command answers in about 3.

---

## Part 6 — Decisions already taken

Two halves. **The first half, what the TOOL implements**, binds whoever builds it, stays grouped by subject, and lives
in `siegelense-tooling.md` as Part 4A. **6B is what each ROLE is bound by** — it binds a session at run time, and is
grouped by who. A builder reads that first half; a prompt author reads 6B.

**The vocabulary these rows use is defined in `siegelense-tooling.md` Part 2**, under "Perception: three artifacts" —
**the shot** (a clean PNG, the only one that is evidence), **the map** (the same frame with numbered boxes on it), **the
key** (the text tree). Elsewhere: an **instance** is one running stack, a **run** is one submitted batch, a **recipe**
creates state, a **prelude** is the batch that reaches a path's entry, and the `video` STEP records a screencast —
distinct from a **round record**, which is the file a walk writes.

---

### 6B — What each role is bound by

#### The OPERATOR — siegemaster itself

*Dispatches, reads what comes back, decides. Drives nothing.*

| Decision                                                                                                                                      | Because                                                                                                                                                                                                                          |
|-----------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A dispatched PLANNER provisions recipes — the operator never does                                                                             | the operator's own tool block forbids driving anything, and proving a recipe means running one. It is a separate sub-agent from the guide-writer, whose "change no file but the guide, start no server" mandate is load-bearing  |
| The operator's job is to dispatch the planner, read what came back, and refuse to send a walk down a path whose recipe is missing or unproven | that is what an operator does. It never runs one                                                                                                                                                                                 |
| After any instance death the operator OWNS cleanup: `status`, reap the orphans, re-read `capacity`, re-dispatch                               | it is the only session that knows which instances are legitimately alive, so it is the only one with the standing to kill anything                                                                                               |
| **A crashed minion is answered by a FRESH walk on a fresh instance — never by reading the dead run to salvage it**                            | a verdict assembled out of half a run plus a second run is not a walk. `status` says why it died, which decides the pool size; an issue the walk had already written down keeps its own evidence and goes to a fixer regardless  |
| The operator calls `cleanup` at the START of its pass and again at the END                                                                    | start catches what a PREVIOUS pass left and makes the first `capacity` reading honest; end catches what THIS pass leaked. Two bookends, not supervision — continuous watching is a daemon, and this design has refused one twice |
| The operator opens by fetching `docs { for: 'operating' }` rather than carrying the tool's rules in its prompt                                | one source for `cleanup`, `capacity` and `status`, and a scope that cannot accidentally teach it to drive                                                                                                                        |
| NO phase advances while any instance is in an unknown state                                                                                   | stamping the happy phase and launching the antagonists while orphans hold ports and memory hands the attackers a machine already under pressure — and the first thing they measure is that pressure                              |
| The pass runs in TWO PHASES — every happy walk first, then a STAMP once they are all clean, then every adversarial walk. Never interleaved    | the STAMP is the boundary between the phases, not a phase of its own. This makes a clean baseline structural rather than a special case                                                                                          |
| **Every adversarial dispatch carries the BASELINE ids** — the happy walk's instance and run for that same path                                | the operator is the only session holding both halves after the stamp, and the attacker cannot go looking for a baseline without risking a tainted one. It is one line in a brief and it is what makes the two-phase shape pay    |
| **A `siegemaster-reader` runs before the first walk, and its values go into every brief**                                                     | it is what lets the walker rule be absolute. A walk told "read no source" with a unit that needs a file opened either breaks the rule or stalls, and the first is what actually happens                                          |

#### The PLANNER — dispatched, provisions the walk

*Maps every path to a prelude and proves each by running it. One level below the operator.*

| Decision                                                                                                                                       | Because                                                                                                                                                                                                                    |
|------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| The planner RUNS every recipe it plans to use — not only the ones it wrote — and asserts each `produces:` claim before any round depends on it | a `fidelity: direct` recipe mimics a shape production owns and drifts from it silently. The drift touches nothing about the feature under test, so nothing else catches it — the first symptom is a walk that cannot start |
| The planner DRIVES THE TOOL — it starts and stops instances to prove preludes — so every rule binding a walker binds it too                    | it is easy to read the planner as a paper exercise. It is not: it meets every crash, every capacity limit and every `kill` obligation a walker meets                                                                       |
| The planner's own starts QUEUE behind whatever else is running                                                                                 | proving ten preludes is ten instances over time, and if a phase is already using the pool it waits like anyone else. Its wall-clock is not linear in paths                                                                 |
| The planner tests the SEQUENCE per path, not each recipe alone                                                                                 | three recipes that each pass in isolation can fail composed: one leaves state the next does not expect, an id does not match, the order matters and nobody wrote it down. What must be true is "this path is reachable"    |
| A prelude is a RUNNABLE batch mixing recipes and driving steps, not prose                                                                      | reaching a state does both — a row that must be expanded first is not seeding, and no recipe should pretend it is                                                                                                          |
| Mid-walk seeds are recorded against the NODE they fire at                                                                                      | appended to the prelude instead, a live-update test silently becomes a fresh-render test                                                                                                                                   |
| Every prelude carries a `VERIFIED` line naming the run that proved it; a path without one is not walked                                        | not a claim that it should work — the id of a run where it did                                                                                                                                                             |
| The planner's outputs split: the path→recipe MAPPING is per-quest `.quest-plans/`, any RECIPE it wrote is committed                            | the mapping is about this flow's routes; a state worth creating once is worth creating again. The recipe is the compounding half                                                                                           |
| The planner dispatches for BOTH jobs — researching a missing recipe and diagnosing a broken one — and reads almost no implementation itself    | it has N paths to get through; reading the quest contract and work-item shape to write one recipe would spend the context the rest need                                                                                    |
| Both jobs end with the PLANNER re-running the prelude                                                                                          | a sub-agent's claim that its recipe works is not evidence, and a research job is no different from a repair in that respect                                                                                                |

#### The planner's SUB-AGENTS — researcher and diagnoser

*One reads code to write a missing recipe, the other to repair a broken one. The last level; they dispatch nothing.*

| Decision                                                                               | Because                                                                                                                                                                                            |
|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A researcher's FIRST question is whether existing recipes already compose to the state | the composition rule keeps the catalogue deep rather than wide, and a new recipe where two compose makes the book worse while looking productive                                                   |
| The researcher fills `mirrors:`, because it has just read the production writer        | left for later it is a guess, and a wrong mirror makes the drift test assert against the wrong thing — worse than no pointer, because it passes                                                    |
| A research job is briefed in the FLOW's words, never from an implementation detail     | handed the code to start from, it writes a recipe for whatever the code happens to do. That is arm B's failure arriving at a different door: the planner decides what state every walk starts from |
| The diagnosis brief carries the READINGS from the run that failed                      | otherwise it is "this is broken, go look" rather than a diagnosis starting from a measured symptom                                                                                                 |
| A break that turns out to be production changing shape is a finding about the APP      | three recipes failing at once is an intentional migration nobody told the recipe book about, or an unintentional one nobody noticed. That becomes an observable, not a recipe patch                |

#### The READER — `siegemaster-reader`

*Opens the files so no walker has to. Returns values, drives nothing, signs nothing.*

| Decision                                                                                                   | Because                                                                                                                                                                                                                          |
|------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| It is the ONLY session on a siege pass that opens a source file                                            | a walker that opens one holds it for the rest of the walk, and the trial measured what that produces: six correct verdicts reached with the expected values known in advance, and no independent look anywhere in the pass       |
| Every value it returns carries `file:line`                                                                 | a value with no provenance is indistinguishable from one a session remembered, and the walker citing it cannot check it without doing the reading this role exists to prevent                                                    |
| **It returns a LOCATION or a CONFIGURATION — never an EXPECTED VALUE the unit should have carried**        | handing that forward launders arm B's failure through one more session: the walk still measures the system against what the code intends, and the contamination is now invisible because it arrived as a fact in a brief         |
| A unit whose expected value exists only in source is a `questNotes` open question                          | that is a spec defect — the unit is under-specified — and it takes the same route as an implementation-detail observable, for the same reason                                                                                    |
| The OPERATOR dispatches it: once against everything the guide's `OFF-SCREEN` heading lists, then on demand | the guide is ONE document per flow, written before any round; a reading is a value for ONE unit and can be needed mid-pass, when a unit turns out to want a file opened. Different cadences, so not folded into the guide-writer |
| It touches no instance and holds no pool slot                                                              | it reads files. It can run beside anything, including a full pool of walks                                                                                                                                                       |
| A LEAF — it dispatches nothing and signs nothing                                                           | its output is a table of values its operator reads, and a verdict on a unit stays with the session that measured the system                                                                                                      |

#### The HAPPY WALKER — `siegemaster-verifier`

*Walks one path and signs what it measured. Its clean shots become the attacker's baseline.*

| Decision                                                                                                                    | Because                                                                                                                                                                                                                                                                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Selectors come from the running page, not from test files                                                                   | arm B read the e2e specs and learned the answers before driving. That removes the reason siegemaster runs at all                                                                                                                                                                                                                            |
| A dead instance is bubbled up as `rework` with the `status` output — never self-healed, never `wall`                        | `wall` means no session of any role could pass, and halts the quest. A crash is not that: fewer instances or a fresh one very likely succeeds. And a minion self-healing is a session acting on a third of the picture                                                                                                                      |
| A walk that sees its instance stop checks `status` BEFORE writing anything down                                             | a dead driver leaves a blank screen, and "the page went blank" is exactly what a walker is trained to report. That blank was the tool dying, and a fixer briefed against it hunts a rendering bug that never existed                                                                                                                        |
| A slow `start` is a QUEUE, not a hang — never a `wall`                                                                      | the tool admits one boot at a time, so the third walk in a pool waits out two. `queuedMs` in the result says so, and a session that reports a wall over it halts a quest for nothing                                                                                                                                                        |
| A DRIVER death is never a finding about the app; an API-SERVER death may be                                                 | `status` separates them. A leak or an unbounded allocation that kills the server is a real defect, and it is recorded WITH the server log as well as bubbled up                                                                                                                                                                             |
| Every issue a walker records carries the INSTANCE id, the RUN id, the failing STEP, **the PRELUDE**, and the evidence paths | the walker kills its instance as its last action, so the handoff cannot be "here is my instance". The prelude is what lets a fixer get back to that state on a fresh one                                                                                                                                                                    |
| **Every PATH walked is recorded with the instance id and run id that walked it — a CLEAN walk included**                    | it is the proof the path was driven at all, the same way a prelude's `VERIFIED` names the run that proved it. A walk that raises an issue records an id anyway; the clean walk is the one an issue-only rule leaves unevidenced                                                                                                             |
| **The recorded id is also the ONLY handle on the evidence — nothing browses, searches or lists**                            | an id a walker did not write down is a run nobody can ever reach, however long it is retained. That is why these fields belong in what the quest record requires rather than in what a careful walker remembers                                                                                                                             |
| **A walker opens NO source file, for any reason.** What only source can answer arrives as a VALUE in its brief              | the exception this replaces — read source for a cap, a default, an off-screen path — is arm B in miniature. One file opened is a walker that holds it for the rest of the walk, and every later judgement made by a session that has seen what the code intends. A `siegemaster-reader` supplies those values with `file:line` against each |
| **The KEY is the default reading. `dom` is the escape hatch: last, expensive, and only with a narrow target**               | it is the one measured cost in this design — `dom` on `body *` returned 58 nodes whose first entry carried an entire stylesheet. The prompt carries that one line; `docs { for: 'walking' }` carries the whole ladder and the guards                                                                                                        |
| **An observable naming a className or any other implementation detail is settled on what a PERSON would see**               | the class is the mechanism; settling on it passes a row whose rule was deleted. Measure the consequence relationally against a sibling that lacks it, read the class as corroboration, and route a unit with no nameable consequence to `questNotes`                                                                                        |
| Baselines promote per-shot, gated on `confirmed` with no issue at or before that node                                       | a tainted baseline inverts the check into a false pass                                                                                                                                                                                                                                                                                      |
| The walk still gathers the evidence for a human-settled unit — the VIDEO, the frames either side, which step                | that is what makes this a route rather than a euphemism for skipping. The person is handed the file and the question, never an instruction to go reproduce it                                                                                                                                                                               |
| A promoted baseline carries shots and selectors, never refs                                                                 | pixels compare across instances (measured byte-identical) and a testId plus `within` means the same everywhere. A ref means nothing in the instance that inherits it, and that session cannot tell it apart from one that resolves                                                                                                          |

#### The FIXER — a generic sub-agent the operator briefs

*Reads code, repairs the defect, and writes the e2e that keeps it fixed. The only role here that writes product code.*

| Decision                                                                                 | Because                                                                                                                                                                                                                     |
|------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A fixer RE-RUNS THE PRELUDE on a fresh instance; it never resurrects the dead one        | "restart to check state" is a fresh instance plus a batch already proven to land where it claims. The walker's instance is gone by the time a fixer reads its record                                                        |
| `results` still answers for a KILLED instance, flagged as gone                           | the evidence lives in the instance's own directory and survives `kill`. Without this a fixer holding a run id finds it resolves to nothing, and the handoff depends on the walker having hand-copied every reading          |
| **Reading a finished run STARTS NOTHING** — no boot, no port pair, no pool slot          | "touch no instance you did not start" is a rule about PROCESSES, and a fixer that reads it as "boot something first" spends a pool slot to look at a fresh instance's state instead of the one where the defect happened    |
| **Name the RUN. Against a finished instance `results` refuses to default to the latest** | the instance may hold the prelude's proving run, the walk and a re-walk. A default landing on whichever went last returns a clean-looking answer about the wrong run                                                        |
| Paths come back absolute and repo-local, so opening a shot is a plain `Read`             | a shot is only evidence if the reader can open it. A path under someone's home directory hands back a filename, which is the same as handing back nothing                                                                   |
| A fixer writes the e2e using **the same recipes the prelude named**                      | a recipe is a plain function a spec can call. The state the walk ran against and the state its regression test runs against then come from one source, instead of the fixer re-deriving setup that ends up subtly different |
| `RED FIRST` is unchanged: watch it fail against unchanged source, for the right reason   | handed the prelude and the walk's `SAW:` value, a fixer already has the setup and the assertion. What it must supply is the fix                                                                                             |
| A fixer touches no instance it did not start, and starts none to "look around"           | every instance is three processes against a measured pool, and a fixer exploring is a fourth nobody accounted for                                                                                                           |
| Fixers go out TWO AT A TIME, over a disjoint file set                                    | siegemaster's prompt already says "Cap two fixers, and only over a DISJOINT file set" — two processes appending to one file can silently drop an edit, with neither agent able to tell                                      |

#### The OPERATIONAL WALKER — `siegemaster-operational`

*Walks a flow that has no screen. Same measurement discipline, different surfaces, no browser.*

| Decision                                                                                             | Because                                                                                                                                                                                                                       |
|------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| It is dispatched per OPERATIONAL flow; the browser walker takes every runtime flow                   | siegemaster is the only track on an operational flow, and the routing is a lookup on `flowType` rather than a judgement                                                                                                       |
| A runtime flow's non-browser units stay with the BROWSER walker                                      | reaching a log line that only exists after four clicks needs the path driven, and that is one more step in a batch already there against a whole second walk                                                                  |
| A `ui-state` unit never reaches it, and an operational unit never reaches the browser walker         | the same rule that filters `verifyByHuman`: an agent that can see a unit it cannot settle reaches for the nearest thing it CAN measure, and the quest gains a proxy verdict                                                   |
| **Its evidence is bytes, exit codes and log lines — there is no shot, no `pixelChange`, no `blank`** | half the browser walker's discipline is about a picture. The discipline that carries over is the one that matters: record what you DID and the value you READ, never that it "worked"                                         |
| It starts an instance with a BROWSERLESS lane spec                                                   | it needs the running system and no Chromium. A spec is keyed by content hash, so the cheaper spec profiles separately and `capacity` allows more of them — that falls out of the existing design rather than needing anything |
| The repo's "the browser UI is the verdict" rule is untouched                                         | that rule governs a flow that HAS a UI, where it outranks every backend assertion. An operational flow has none, and its verdict is the state the system left behind                                                          |
| Like the verifier, it may dispatch pass-2 sub-agents to write failing tests, and DEPTH STOPS AT TWO  | its output is a red test on disk, which the operator and a later fixer both read directly — the same reason the verifier may dispatch and a reviewer may not                                                                  |

#### The ANTAGONIST — `siegemaster-stress`

*Attacks one path in its own instance. Proves an absence, so it needs a baseline and a known reset point.*

| Decision                                                                                                     | Because                                                                                                                                                                                                                                                                                    |
|--------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **It compares against a BASELINE, never against the unit — and `health` is its fixed-shape reading**         | the verifier asks whether the screen shows what a sentence in the spec says; this role claims an ABSENCE, and an absence is evidence only against a known-good reading taken beforehand. `health` is its counterpart to the key: one shape, so two readings can be held against each other |
| **Three key columns are ITS columns**: `maxlength`/`pattern` in `attrs`, `live`/`alert`, and `invalid`       | the declared cap is what it is measuring against, the live region is where a proper refusal LANDS, and `invalid` is the app stating its own verdict on the input — read, never assumed                                                                                                     |
| **Off-map applies on an OPERATIONAL flow too, where it has no `paste`, no `key` and no `click`**             | the seven families are properties of the built system rather than of a drawn flow, so this quest's only `hostile-input` and `perf` coverage exists whether or not a screen does. There the attack is `request`, `file` and the process itself, against the browserless spec                |
| Each attack declares the reset level it needs                                                                | `instance` destroys any uptime / monotonic / append-only measurement, so it cannot share a batch with a unit measuring one                                                                                                                                                                 |
| **Every attack is recorded with the instance id and run id that ran it, held or not**                        | an antagonist claims an ABSENCE — "I attacked this and it did not fall over" — and an absence with nothing behind it is the least checkable claim in this system. The run id is what makes it one anyone can open                                                                          |
| **Its dispatch CARRIES the baseline** — the happy walk's instance id and run id for the path it is attacking | "inherits a verified-clean baseline" was a property with no mechanism. The operator holds both ids after the stamp, and handing them over is one line in a brief                                                                                                                           |
| It READS that baseline with `results` and starts nothing — and looks for no baseline it was not handed       | reading a finished run needs no instance, so "touch none you did not start" does not forbid it. What it does forbid is finding "some earlier walk of something similar", which is how a tainted baseline gets in                                                                           |
| **On a SAD path the baseline is the ERROR rendered correctly, usually a toast**                              | comparing a failure branch against a happy screen reports the toast as damage. The inverse is worse: the app swallows the error, nothing paints, `pixelChange` reads `0%`, and "nothing changed" is written down as *it held*                                                              |
| A transient baseline — a toast, a flash message — is read as a PRESENCE question, never a pixel diff         | it auto-dismisses, so a frame comparison against it reports a difference that is only timing. "Was the toast there, with that text" is a `look` at the key                                                                                                                                 |
| The antagonist bubbles a dead instance up exactly as a walker does, and is the role most likely to CAUSE one | it corrupts and exhausts on purpose, so an OOM it triggered is a plausible finding rather than background noise — which is precisely why it must not judge that itself                                                                                                                     |
| The antagonist waits on the same start queue as everyone else                                                | it opens its own instance like every other tool-using session, so a slow start means the same thing and gets the same reading                                                                                                                                                              |
| Motion quality is cut from what siegemaster claims to check — a PROMPT change, not a tooling one             | a rule nobody can follow is not ignored, it is answered with an invented adjective. That is the failure the prompt's own "search your draft for 'as expected'" discipline exists to catch                                                                                                  |

#### ChaosWhisperer and BugHunt — spec authors

*The only roles that may route an observable to a person.*

| Decision                                                                                                                                                           | Because                                                                                                                                                                                                                                                                                                                       |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| There is a THIRD settlement route: a person. An observable no automated track can settle is flagged on the OBSERVABLE and drops out of every automated denominator | exactly as `verifyByReading` does today. Otherwise siegemaster carries a unit it can never close. The flag is a property of the criterion, not a per-track `unconfirmable`                                                                                                                                                    |
| `verifyByHuman` units are COLLECTED into a list handed to the user at quest end                                                                                    | `toSettle` already carries the right shape — "an INSTRUCTION, never a question". What is missing is nothing gathering them and putting them in front of anyone                                                                                                                                                                |
| The human-check category stays NARROW: motion quality and taste, nothing else                                                                                      | contrast, alignment and clipping are computable; an error message's clarity a model can judge. A long list is a list nobody works                                                                                                                                                                                             |
| **An observable naming an IMPLEMENTATION — a className, a hook, a prop — is a READ-CHECK, and is authored with `verifyByReading`**                                 | a class name is the mechanism behind something a person sees, never the thing itself, and it can move to an inline style or a generated hash without the outcome changing. Unflagged it lands on a walk, where confirming it is the cheapest false pass available: class present, rule deleted, row not red, unit `confirmed` |
| **Phrase the observable as what a PERSON would see** — "the failed row is red", not "the row has `.failed`"                                                        | an observable written in the implementation's words hands a walk the mechanism instead of the outcome, which does to it automatically what arm B did to itself: confirm whatever the code happens to do                                                                                                                       |
| The flag is `verifyByHuman: true`, beside `verifyByReading: true`                                                                                                  | one field, one settlement route, named for who settles it                                                                                                                                                                                                                                                                     |
| A `verifyByHuman` observable is FILTERED from every work item's view once the quest is `in_progress`                                                               | stronger than dropping it from a denominator, because an agent that can SEE a unit it cannot close reaches for the nearest thing it CAN measure — a proxy assertion, a change-detector — and the quest gains a test pinning the wrong thing                                                                                   |
| The "can anything automate this?" table lives in ONE statics and is interpolated into BOTH ChaosWhisperer's prompt and siegemaster's                               | the AUTHOR needs it at spec time or three tracks each pay to rediscover that a unit cannot be automated. `standardsReviewConcernsStatics` is the pattern — one source, several prompts, never a copy                                                                                                                          |
| The route itself goes in `signoffTrackEligibilityStatics` beside the other denominator rules                                                                       | it is already "the same statics every denominator reader shares". Dropping a human-check unit then happens once rather than per track                                                                                                                                                                                         |
| ChaosWhisperer and BugHunt alone may SET the flag, matching `verifyByReading`                                                                                      | a mid-quest role marking its own hard units human-check is a cheaper escape than marking them unconfirmable. Siegemaster may still ADD an observable, but a `questNotes` open-question is its route to requesting the flag                                                                                                    |

#### A SESSION NO QUEST DISPATCHED — a developer's own, or one asked to drive the app

*Not a quest role. Uses the same tool, has no operator above it, and is the most likely reader of
`docs { for: 'driving' }`.*

**This session is not an afterthought: the whole case for serving the tool's instructions from a `docs` call rather than
a role prompt was that a session outside any quest could be told to drive the app with this and go read how.** Every
other role here has a dispatcher enforcing its obligations. This one has nobody, and the rules it can break are the
shared-machine ones.

| Decision                                                                                                 | Because                                                                                                                                                                                                                                            |
|----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| It reads `docs { for: 'driving' }` — never `walking`                                                     | `walking` is a verifier's brief: sign-offs, units, a round record, a `SAW:` line. None of that exists here, and a scope written for a role the reader is not tends to be followed anyway                                                           |
| Every machine rule binds it identically: `capacity` before starting, `start` queues, `kill` is mandatory | a quest pass may be running beside it and cannot see it. Three instances opened casually next to a pool is how the pass measures its own pressure and reports panels that never mounted                                                            |
| **Nothing will `kill` for it.** No dispatcher is watching, and its own final response reaps nothing      | the instance is not its child. The idle timeout and somebody else's `cleanup` are the only backstops, and both are slow enough to hold a port pair through someone else's pass                                                                     |
| Its instance is filed under `unowned/`, and **no quest reference protects its evidence**                 | the retain rule resolves through a quest's `.quest-plans/`. With no quest there is nothing to cite it, so its assets age out on the ordinary window — correct, and worth knowing before it comes back next week for a shot                         |
| **`start` hands back the id AND the evidence directory**, and it holds both for as long as it is driving | there is no lookup by owner, by date or by repo — nothing lists and nothing searches. Losing them is not the risk while it runs; the risk is a path a person wants tomorrow that stayed in scrollback instead of going into what the session wrote |
| It may run `cleanup`, and it may kill nothing it did not start                                           | reaping is by STALENESS, which is a fact anyone can check. A live instance belongs to somebody, and this session is the one least able to tell whom                                                                                                |
| A slow `start` is the QUEUE, exactly as it is for a minion                                               | it waits behind whatever pass holds the pool, and `queuedMs` says so. The failure to avoid is deciding the tool is broken and reaching for something blunter                                                                                       |

---

## Part 7 — The determinism this system depends on

Most of this design works by **comparing two readings and calling the difference a finding**: the element delta on a
second `look`, `pixelChange` against the previous capture, a `health` reading against a baseline, a `reset` diff, `hold`
's frame comparison. Every one of those is only as good as the reproducibility underneath it.

**Where a value varies for a reason nothing in the walk caused, the difference reads as a defect** — and that is the
most expensive false result there is, because it arrives looking like evidence. A fixer gets briefed, goes hunting in
working code, and nothing in the record says the tool was the problem.

### What the CONTENT must guarantee

| Must be deterministic                                              | Why                                                                                              | What it breaks as                                                          |
|--------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| **a recipe's output bytes, for the same inputs**                   | baselines are compared ACROSS instances, which is the whole promotion mechanism                  | a baseline that never matches, so every attack reports "something changed" |
| **timestamps a recipe writes**                                     | the trial's flow is entirely durations. `4m` only reproduces because BOTH ends were fixed values | a figure that drifts per run, read as a rendering bug                      |
| **ids that PAINT**                                                 | a runtime uuid on screen breaks byte-identity                                                    | `pixelChange` never reaches 0%, so the "nothing happened" signal is dead   |
| seeding the same recipes in the same order produces the same state | otherwise a batch is not re-runnable, and step 7's re-walk proves nothing                        | a fix that "worked" against a state the re-walk never reproduced           |

**Recipes must not call `Date.now()`, `Math.random()`, or `crypto.randomUUID()` for anything that reaches a screen.**
That is the single rule behind three of those four rows, and it is checkable — a
`fidelity: direct` recipe writing a live clock is the exact drift the marker exists to warn about.

### Animation is the one that conflicts with the product

**This UI animates on purpose.** The product framing says so: quests in progress "animate like an RPG dungeon raid". A
sprite, a spinner, a transition or a blinking caret means **two captures of the same logical state are never
byte-identical**, and `pixelChange` becomes noise on every step.

The byte-identity measured in Part 2 — three lanes, 46,786 bytes each — was on a STATIC screen. It does not generalise
to an animated one, and nothing should be built assuming it does.

Playwright answers this directly, and the capture path must use it:

| Setting                                | Kills                                                                   |
|----------------------------------------|-------------------------------------------------------------------------|
| `animations: 'disabled'` on screenshot | CSS animations and transitions, finished and frozen at their end state  |
| `caret: 'hide'`                        | the text cursor, which otherwise blinks every capture into a difference |

**What that leaves unhandled is JavaScript-driven motion** — a canvas, a requestAnimationFrame loop, React Flow's own
viewport. For those the `before` step is the lever: freeze the clock, or stub the animation entry point, ahead of the
app. Which surfaces need it belongs in the guide, discovered once, rather than in each session's guess.

**Freezing animation costs nothing that was ever available.** The obvious worry is that a frozen capture cannot see a
defect IN the animation — a jump, a stutter, a flicker — which siegemaster's prompt does call a defect. But no capture
mode gives a model that: sampled frames cannot resolve motion quality at any interval a walk can afford, and `video`
produces a file nothing grades. See Part 4. So there is no trade here, only a clarification: **every comparison capture
is frozen, and nothing anywhere judges motion.**

`video` stays live, for a human to watch and for the trail. `hold` stays live too, because its question is whether a
state SETTLED — a binary — and freezing animation would answer that question falsely by making every frame identical.

### The honest limit

Determinism is a property of the whole stack, and some of it is outside this tool: font loading races, GPU rasterisation
differences, scrollbar presence, system locale in a rendered date. The byte-identity result held across three lanes on
one machine on one day. **Treat `pixelChange: 0%` as a strong signal and a non-zero value as a prompt to LOOK, never as
a verdict on its own** — which is the same rule already governing every other reading here.

**`blank` is the one exception, and it is exact.** One colour across the whole frame is not a comparison against a
previous state, so nothing about fonts, rasterisation or animation can perturb it. That is why it is checked BEFORE
`pixelChange` rather than alongside it: everything else here degrades under conditions this tool does not control, and
that one does not.

---

## Part 8 — The recipe book

**Seeding is in scope for this work.** What is out of scope is the full ownership architecture the companion plan argues
for — seeders living beside the contracts they build, a scenario layer, a
`fidelity` contract. That is a bigger change and it is not a prerequisite.

What IS a prerequisite is that **a session can put the system into a known state without deriving how every single
time.**

### Guidance for other repos

**The convention ships; the recipes do not.** Another repo's states are its own — nobody else has guilds and quests.
What travels is:

- recipes are discoverable by name, not by grepping a test tree
- each declares `produces:` and `fidelity`
- each returns the ids a walk needs to address what it made
- they compose rather than duplicate
- two of anything an assertion must distinguish

That is a convention plus a listing mechanism, not a package abstraction — which is deliberately short of the ownership
architecture the companion plan wants, and enough to stop every walk re-deriving its own setup.

---

## Part 9 — Where to go, in order

| #   | Item                                                                                                                                                                                                                                                                                                                                                         | Why here                                                                                                                                                                                                                                                                                                                                                                       |
|-----|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1   | Gate `POST /api/tooling/smoketest/run` at registration, with an absence test                                                                                                                                                                                                                                                                                 | Independent live finding: it registers unconditionally and spawns real Claude subprocesses. `E2E_SIGNAL_BACK_HTTP`'s registration-time gate in `quest-flow.ts` is the pattern, and the lane already depends on it working                                                                                                                                                      |
| 2   | The instance service — start / run / results / kill / **capacity** / **profile** / **status** / **cleanup** / **docs**, with a status-as-index that LISTS its shots and flags which to open, **refs invalidated on navigation, reset and restart**, and RSS sampling per process group                                                                       | Everything else is a step inside it. Getting this shape wrong means rewriting every capability twice                                                                                                                                                                                                                                                                           |
| 2a  | **The evidence read path** — `results` and `status` resolving off the asset tree rather than the driver socket, assets partitioned by the quest's guild, the `.siegelense` symlink that `init` creates and ignores, and every returned path absolute and repo-local                                                                                          | it is the whole fixer handoff, and it is the half a socket-shaped service silently omits: a read routed at a dead instance's driver answers a bare connection error                                                                                                                                                                                                            |
| 2b  | **Teardown and crash recovery, with tests written red-first** — process groups, port release, home removal, evidence retention, idle-timeout reaping, the three-instance parallel case, plus the heartbeat file and stale-instance reaping that are the ONLY defence against a SIGKILLed driver                                                              | shipped with item 2, never after it. A leak is invisible to whoever caused it, and every later item adds another instance to leak                                                                                                                                                                                                                                              |
| 2c  | **Retention and its tombstones** — the quest id recorded at `start`, `prune` and `cleanup` resolving references through `.quest-plans/` and naming the citing file, a reaped entry surviving as a tombstone, and a pruned query answering `pruned` rather than `[]`                                                                                          | evidence a fixer cannot find is evidence nobody kept, and an empty answer where evidence was reclaimed is read as "the walk saw nothing"                                                                                                                                                                                                                                       |
| 3   | The recipe book — free the HTTP-only harnesses, expose the already-free ones by name, add `produces:` and `fidelity`, make them listable                                                                                                                                                                                                                     |
| 3a  | Recipe integration tests — each asserts its own `produces:`; `direct` ones assert against their `mirrors:`; production ones share one instance                                                                                                                                                                                                               | staleness caught on the commit that caused it rather than by whichever planner next needed the recipe                                                                                                                                                                                                                                                                          |
| 3b  | The PLANNER role — maps paths to recipes and proves every prelude by running it; **dispatches for both research and diagnosis so it reads almost no implementation**                                                                                                                                                                                         | the operator cannot do it at all (it drives nothing), and a planner that read code for every recipe would spend the context its remaining paths need                                                                                                                                                                                                                           | Nothing downstream can be exercised against a state nobody can create, and roughly half the harness tree is already a seeder or one transport swap from being one |
| 4   | A transcript of every step and reading, written by the instance                                                                                                                                                                                                                                                                                              | ~20 lines, no design decisions, and it makes a fixer's quoted symptom block machine-written instead of retyped from memory                                                                                                                                                                                                                                                     |
| 4b  | **The record's `WALKED` field** — the instance id and run id against every path walked and every attack run, clean ones included                                                                                                                                                                                                                             | it is the proof the path was driven rather than claimed, and the only handle on that walk's evidence. Spec-side work: a quest-contract change, not tooling. Cheap, and worthless if added after the first pass has already signed paths without it                                                                                                                             |
| 5   | `before` — run a script ahead of the page's own                                                                                                                                                                                                                                                                                                              | The substrate every later instrumentation stands on                                                                                                                                                                                                                                                                                                                            |
| 6   | Capture on every acting step — **frozen (`animations: 'disabled'`, `caret: 'hide'`) for the comparison path** — with a change-amount number; open start and end                                                                                                                                                                                              | The only item that changes what gets SIGNED rather than what a walk costs. Frozen capture is not optional: this UI animates, and a live capture makes `pixelChange` noise on every step                                                                                                                                                                                        |
| 7   | The key as a tree — element-bound refs, `within` scoping, four columns (element with tag and role, text/value, **`attrs`** budgeted with its runtime-id guard, flags), and the duplicate-testId line under it. **Ship without the map**: `look` returns the key and the shot, and omits the `map` field entirely until the later item adds it                | The primary navigation surface. Cheapest route to a selector, and the one arm that used it spent 24% fewer tokens. The geometry checks ride here because a separate command is one nobody calls                                                                                                                                                                                |
| 8   | `health`, one reading with one verdict line, including the server logs                                                                                                                                                                                                                                                                                       | The stress tester's counterpart to the key; composes readings that already exist                                                                                                                                                                                                                                                                                               |
| 9   | `until` — wait on a response, a file or a predicate, not just a locator state                                                                                                                                                                                                                                                                                | Today the only condition is visible/hidden/attached/detached; everything else is polled a turn at a time                                                                                                                                                                                                                                                                       |
| 10  | Selectable readings — `network` by method and path, projecting fields; and the same projection plus a self-reporting cap on `dom`, with own text as its default                                                                                                                                                                                              | Costs context AND attention: a model given forty exchanges finds the one that matters, given four hundred it skims. `dom` is the same problem with a measured number on it — `body *` returned 58 nodes carrying a whole stylesheet                                                                                                                                            |
| 11  | `hold` (non-settlement, live), plus `video` (for a human, never graded)                                                                                                                                                                                                                                                                                      | The stuck-loader and no-feedback classes, which nothing else catches. Neither one judges motion                                                                                                                                                                                                                                                                                |
| 11b | The human-check route — a flag on the observable, dropped from automated denominators, collected into a list handed to the user with its evidence attached                                                                                                                                                                                                   | otherwise the only options are an unsignable unit nobody can close, or a real expectation nobody ever checks. Spec-side work, not tooling                                                                                                                                                                                                                                      |
| 11c | **The declared-value block, and its third reader.** Extract the enumeration copied in `dumpster-create-prompt-statics.ts:163` and `chaoswhisperer-gap-minion-statics.ts:191` into one interpolated statics; add the siege consequence to its rationale; and give `siegemaster-prompt-statics.ts` a rule for an UNFLAGGED one, which it has nothing for today | the rule exists and the gap is on the walker. The two copies have already drifted with the AUTHOR's list narrower than the reviewer's — no raw colour, no margin — and the author is the only role that may set the flag. Spec-side work, not tooling                                                                                                                          |
| 11d | **`siegemaster-reader`** — a minion that opens the files a walk must not, returning values with `file:line` against each; the guide's `OFF-SCREEN` heading becomes its answers rather than its instructions                                                                                                                                                  | it removes the LAST reason a walker opens a source file, which is the one thing the three-arm trial proved destroys the pass. Code changes it needs: the name added to `agentPromptNameContract`, to `agentPromptClassificationStatics.minionNames`, and a row in `agentNameToPromptTransformer` (sonnet, like every minion)                                                   |
| 11e | **`siegemaster-operational`**, dispatched per OPERATIONAL flow, plus the surfaces it needs — `process-state`, `environment`, a log tail beyond the instance's own two, and a named elapsed figure                                                                                                                                                            | siege is the ONLY track on an operational flow, and the browser walker's whole vocabulary is inapplicable there. The gaps are measured against `qaCheckSurfaceStatics`' own list, not guessed. Its lane spec carries no Chromium, which the content-hash profile already prices on its own                                                                                     |
| 11f | **The `(human-check)` PANEL on the quest**, in the web UI — every `verifyByHuman` unit with its `toSettle` instruction, its repo-local evidence links, an outstanding count, and a control that TAKES the person's verdict                                                                                                                                   | it is the only place such a unit reappears: once the quest is `in_progress` they are filtered from every work item's view, so with no panel the expectation is invisible everywhere. A list a person can read and cannot tick is a list nobody works                                                                                                                           |
| 11g | **A `walked` kind on `questNotes`**, with typed `instanceId` and `runId` beside the prose                                                                                                                                                                                                                                                                    | the id must outlive `.quest-plans/`, which is wiped at quest end while the evidence is still retained. Typed fields rather than a sentence, because a `WALKED` line is one of the citations `prune` and `cleanup` refuse to delete over, and a resolver cannot match an id buried in prose                                                                                     |
| 11h | **Print the owning NODE id in `get-qa-checklist`**                                                                                                                                                                                                                                                                                                           | the verifier prompt states the gap: *"Nothing tells you which node an observable hangs on except the flow you read… your brief does not carry it and the checklist does not print it."* Every sign-off pays that lookup. It is now the value TWO mechanisms read: a step carries an optional `node:` label, and an antagonist fetches the baseline of the node it is attacking |
| 12  | Server-side failure injection                                                                                                                                                                                                                                                                                                                                | What `interruption`, `staleness` and `configuration` need and cannot drive through the page                                                                                                                                                                                                                                                                                    |
| 13b | `compare { runA, runB }` — the index delta between two runs                                                                                                                                                                                                                                                                                                  | a cycle's output is the difference between iterations; without this every cycle costs two result queries and hand arithmetic                                                                                                                                                                                                                                                   |
| 14  | The three reset levels — `page` / `state` / `instance`, with NAMED snapshots and an explicit `to` — each reporting the diff it undid                                                                                                                                                                                                                         | Replaces the one unverified lever a guide currently derives by reading code, answers "what did this error branch leave behind", and is what lets one instance carry many attacks                                                                                                                                                                                               |
| 15  | `resize`, and a direct `request` step for the curl surface                                                                                                                                                                                                                                                                                                   | Coverage no walk can reach today                                                                                                                                                                                                                                                                                                                                               |
| 16  | The two local lint rules — no `.first()`/`.last()` in a command, and no DOM handle in a recipe — plus the package `../../CLAUDE.md`                                                                                                                                                                                                                          | prose does not hold either one. `@dungeonmaster/local-eslint`'s `no-hardcoded-package-names` is the template, and its own blind spot is the caution to copy with it                                                                                                                                                                                                            |
| 17  | The lane spec and N ports; move it where consumers get it                                                                                                                                                                                                                                                                                                    | The real generalisation, and the largest. What has to go: `siege-lane.ts`'s `SERVER_WORKSPACE` / `WEB_WORKSPACE` literals, exactly two processes against one port pair, this repo's fake-CLI env block, and `REPO_ROOT` resolved four directories up from the file. `../workflow-paralellizer.md` G22 already logs the port half                                               |

**Items 2 and 3 are the foundation and neither is optional.** The service decides the shape every capability is written
against; the recipe book decides whether there is anything to point them at.

**Item 6 is the only one that changes what gets SIGNED.** Everything else changes what a walk costs. If one capability
ships alone, ship that one.

Items 4 to 16 are additive to files item 17 moves. Doing 17 first means doing them twice.

**Item 17 gets no help from lint, and that is measured.** `siege-lane.ts` passes
`no-hardcoded-package-names` today while hardcoding two package names, because
`packageNameLiteralStatics` matches a role-bearing name only AFTER a workspace directory segment — so the `@scope/name`
form is waved through by design. Whoever does this work is finding those literals by reading, not by running a check.

---

## Part 10 — What exists as scratch

Nothing designed across these three documents is built. The prototypes below were driven through the existing `eval`
command and are throwaway:

| Path                                                | What it is                                                                            |
|-----------------------------------------------------|---------------------------------------------------------------------------------------|
| `../../tmp/siege-seed.ts`                           | creates a guild and seeds three session transcripts into a running lane               |
| `../../tmp/siege-look.ts`                           | emits the key, the shot and the map for whatever a lane is showing                    |
| `tmp/siege/exp{A,B,C}/`                             | the trial's lanes — each holds its own `RECORD.md`, screenshots and every result file |
| `tmp/siege/demo{1..5}/`, `../../tmp/siege/seedtest` | the exploratory lanes behind Part 2's figures                                         |

`siege-command.ts` gained no verbs and the driver holds no refs.
