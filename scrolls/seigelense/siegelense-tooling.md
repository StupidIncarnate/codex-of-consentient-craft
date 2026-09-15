# Siegelense — the tool, its surface, and what it must guarantee

> One of three documents split out of `../siege-verification-tooling.md`, carrying the siegelense tool
> itself: the service, every capability, the determinism it depends on, and the whole consolidated surface.
> Its companions are `siegelense-recipes.md` and `siege-verification-remainder.md`.

---

## Part 1 — The architecture

### Decision: an INSTANCE service, reached over MCP

**This IS a set of MCP tools.** Every call — `start`, `run`, `results`, `kill`, `capacity`,
`profile`, `status`, `cleanup`, `prune`, `compare`, `snapshots`, `recipes`, `docs` — is one. What was rejected is not
MCP; it is making each STEP its own tool. **Three of the thirteen need a running instance** — `start`, `run`, `kill` —
and the other ten read disk, the registry or the machine.

Three shapes were considered.

| Shape                                                                    | Verdict                                                                                                                                                                                                                                                                                                                                             |
|--------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **File drop** (what exists)                                              | the agent writes a command file, polls for a result file, reads it, splits on a blank line, parses. **~3 tool calls per command** — arm A spent 82 calls on roughly 20 commands. The result files are `.txt` because the payload is only sometimes JSON, which makes every read pay a split                                                         |
| **One MCP tool per STEP** — a `goto` tool, a `click` tool, a `look` tool | fixes the call count and breaks two other ways. The tool surface grows with every verb added, and each call returns its own payload, so a `network` reading with real response bodies walks into `mcpToolResultStatics.maxVerbatimChars` (50,000), spills to a file and hands back an error stub — the exact failure the prompts already warn about |
| **An instance service over MCP** ✅                                      | a SMALL FIXED set of tools; the steps are DATA inside `run`. Submit returns a status, results are queried separately and narrowly                                                                                                                                                                                                                   |

**The principle is that the TOOL surface is bounded and the STEP surface is open.** Thirteen tools, and they stop
growing. Twenty-three steps today and more coming — every one of those arrives as a value in a batch rather than as
another entry in a tool list nobody can hold in their head.

That is also what dissolves the size cap: a step's reading lands in the instance's own buffers, and
`results` fetches only what the index points at. Nothing is forced through a tool result just because it was produced.

The file-drop design justified itself like this:

> takes work over the filesystem, which is the only channel open to an agent that has Write and Read
> but cannot hold a socket between turns

That argues the **driver must be a persistent process** — true, a browser has to outlive a turn. It does **not** argue
the transport must be files. Those two got welded together and only the first is load-bearing. An MCP server is itself a
long-lived process that sub-agents already call.

### The shape

```
start    → instance id
  └─ the instance owns: an API server, a Vite server, a browser,
     a throwaway home, and both server log files

run      → submit a BATCH of steps; blocks; returns a STATUS, never a payload
           { run: run_N, status: done | timeout | failed, stepsRun, stoppedAt, reason, index }

results  → query by RUN id, NARROWLY: one step, one kind, filtered.
           Reads off DISK, so it needs no live instance and no `start`.
           Every run stays reachable for the instance's retention window — `kill` included.

kill     → tear down this instance. The state goes; the evidence stays
```

**The completion status is an index, not the payload.** Same relationship as a page listing to a screenshot. It must say
where it stopped, why, and what is worth querying — "3 console errors, 1 server error, 2 screenshots, 14 network
exchanges" — or the session queries everything to find out whether anything happened, and you have reinvented the blob.

### An instance is a TIMELINE of runs, and every run is addressable

**`run` → `results` → `run` → `results` is the normal shape, not an edge case.** A session submits a batch, reads the
index, queries what it points at, decides, and submits the next batch. So results must be addressed by RUN, not by
instance — `results { step: 4 }` means nothing once a second run exists.

```
run     → { instance: 'inst_7f3a', run: 'run_2', status, stepsRun, index }
results → { instance: 'inst_7f3a', run: 'run_2', step: 4 }
```

| Rule                                                                      | Why                                                                                                                                           |
|---------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| every `run` mints a run id and returns it                                 | it is the handle for everything that run produced                                                                                             |
| step numbering restarts at 1 PER RUN                                      | `stoppedAt: { step: 4 }` then reads naturally inside its own run, and cannot be confused with another's                                       |
| screenshots are namespaced by run                                         | `run_2/step4.png`, or the second run silently overwrites the first's evidence                                                                 |
| **earlier runs stay queryable for the retention window, `kill` INCLUDED** | analysis two runs later still reaches run 1's exchanges — and so does a FIXER whose walker killed the instance before handing over the record |

**The buffers are CONTINUOUS; each run records its WINDOW into them.** The lane's console, network and websocket
listeners are armed once at boot and never stop — that is already true and is why they catch what a listener attached
later would have missed. So a run does not reset them; it records where it started and stopped:

```
results { instance, run: 'run_2', kind: 'console' }        → only what arrived during run 2
results { instance, kind: 'console', since: 'boot' }       → the whole timeline
```

**A run's index counts its OWN window, never the running total.** Otherwise run 5 reports 47 console errors that are
mostly run 1's, and a session chases ghosts through four batches that were already clean.

**A run boundary does NOT invalidate refs — page changes do.** This looks like it should be otherwise, and getting it
wrong would break the main loop: a `look` at the end of run 1 exists precisely so run 2 can act on what it found. The
invalidators stay what they were — navigation, `reset`, restart — and a ref whose element went away between runs answers
`stale`, which is the element binding doing its job rather than a run-boundary rule doing it badly.

**`pixelChange` compares against the previous capture, wherever it was taken.** Continuous, like the buffers, so a first
step in run 2 is measured against the last capture in run 1 rather than against nothing.

**A timeout must name the step.** "Timed out" alone is useless. "step 9 `waitFor` on
`[data-testid=X]` never resolved after 10s" is a defect report. A hang is a finding, not a tool failure.

**Blocking is fine and there is precedent.** `run-ward` and `run-riftcarver` already block through MCP for minutes.

**The tools are MCP; the DRIVER behind them is a separate process.** That split is about lifetime, not transport. Build
discipline says editing the MCP package means rebuild plus reconnect — so if the MCP process owned the browsers, any MCP
change mid-pass would kill every live instance. The MCP tools are thin clients over a local socket to a driver that
outlives them. The instance also already closes itself on an idle timeout, which is the right ownership and should not
move.

**The instance id replaces lane-name allocation.** Siegemaster's prompt currently spends a whole section on allocating
two names per round, distinct from each other and from every earlier round, never reused. Every rule there exists
because a human-chosen name can collide. A minted id deletes the section and its whole failure class.

### Many sessions, one machine: a disk REGISTRY, not a master

**Three unrelated sessions can be driving this at once**, and none of them orchestrated by the same siegemaster. Nothing
about that is exotic — a developer runs one by hand while a quest's phase runs two. So the coordination question has to
be answered, not left to whoever builds it.

**It is not a master/slave setup and there is no daemon.** A daemon owning every instance is a single point of failure
for N unrelated sessions, and a lifecycle problem nobody wants: who starts it, who restarts it, and what happens to
every live browser when it dies. The existing design already refuses this shape once, for the same reason, by keeping
the driver out of the MCP process.

**Coordination is a SHARED REGISTRY ON DISK, and this repo already does exactly that.** Dispatch exclusivity between the
MCP server and the Node loop is file-backed at
`<dungeonmasterHome>/dispatch-state.json` **because the MCP server is a separate OS process** — the same fact, the same
answer.

```
<home>/.dungeonmaster/siegelense/
  registry.json        one entry per instance: id · owner · quest · pid · pgids · specHash · ports · state · lastBeat
  boot.lock            held for the duration of one boot; staleness releases it
  profiles/<hash>/     append-only samples per spec
  guilds/<guildId>/instances/<id>/    that instance's logs, captures, video, transcript, snapshots
  unowned/instances/<id>/             the same, for an instance no quest owns
```

**Per-instance drivers, one shared registry.** Every process can read it, it survives any single process dying, and
there is no election, no master and no split-brain.

**Assets are partitioned by the GUILD that owns the quest the instance was started for.** The key is the guild owning
that QUEST — **never a guild a recipe seeded**, which is minted fresh inside the throwaway home on every run and would
file every instance under a partition of its own.

**Deleting a guild then takes that guild's siege evidence and reaches no other guild's.** That is the containment
everything else under `<home>/.dungeonmaster/` already has. It also loses nothing anyone still needs, because the
guild's quests went with it.

**`unowned/` is a real partition, not a fallback.** A session nobody orchestrated drives this tool too — the `docs` call
exists partly so it can — and it has no quest and therefore no guild. Its evidence lands in `unowned/`, where no guild
wipe can take it and no quest reference protects it. An instance filed under a guild id that no guild has would be the
worse answer: it reads as corruption where `unowned` reads as what it is.

**Every path the tool hands back is inside the repo, through a symlink `dungeonmaster init` creates:**

```
<repoRoot>/.siegelense  →  <home>/.dungeonmaster/siegelense/
```

**This is what makes a shot openable at all.** A shot is a PNG and the only way a model sees one is a `Read` of its
path, so a path the reader's `Read` cannot reach is a path that hands back nothing. This repo already answered the same
question the same way: `npm run prod` puts its home at `<repo>/.dungeonmaster/` rather than `~/.dungeonmaster`
specifically "so Claude Code Read/Grep can reach quest files". The symlink buys that for every repo without moving
anyone's home, and it means ONE path shape everywhere — `<repoRoot>/.siegelense/guilds/<guildId>/instances/<id>/…` reads
the same in this checkout and in a consumer's.

**Where the link is absent — a repo where `init` has not run — the tool hands back the real path under the home and says
the link is missing.** A path that silently stops resolving is the one failure worse than an inconvenient one.

**The link is gitignored by the same install step that writes it**, exactly as `@dungeonmaster/orchestrator` does for
`../../worktrees`. **And the ignore has to cover more than git**: a symlinked directory inside the repo is something
lint, typecheck and test globs can walk into, and the evidence tree holds thousands of PNGs. Whoever builds this adds
`.siegelense` wherever `../../worktrees` is already excluded, and an instance's assets are not a file tree anything
grades.

### What the registry has to make safe

| Race                         | Without the registry                                                                          | With it                                                                                            |
|------------------------------|-----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| **port allocation**          | two sessions ask the OS for a free pair in the same moment and can overlap                    | claim the pair in the registry BEFORE binding; re-roll on conflict                                 |
| **the boot queue**           | "one boot at a time" cannot be enforced across processes that cannot see each other           | `boot.lock`, released by completion or by heartbeat staleness                                      |
| **capacity thundering herd** | three sessions each divide free memory by peak, each concludes it can start two, and six boot | RESERVE in the registry before booting. `capacity` counts reservations, not just running instances |
| **profile writes**           | read-modify-write from three processes loses samples                                          | samples are APPEND-ONLY; steady and peak are computed on read. No lock needed                      |
| **asset collision**          | two instances writing to one path                                                             | assets live under the minted instance id, which is unique by construction                          |

**Reaping is by STALENESS, never by ownership.** Any session may reap an instance whose heartbeat has gone cold, because
a cold heartbeat is a fact anyone can check. **No session may kill a live instance it does not own**, however
inconvenient — the operator's cleanup duty covers its own pass, not another developer's browser. That distinction is the
whole difference between a shared registry and a land grab.

**`capacity` already counts what this session did not start**, and the registry is how. A ward e2e run, another agent's
lanes and a developer's own instance are all entries.

### Retention: assets outlive their instance, and something must prune them

**`kill` keeps the logs, captures, video and transcript** — that is the state-versus-evidence line, and it is what lets
a fixer read a run whose instance is long gone.

**Which means disk grows, and a full disk is a failure mode this doc already documents.** So:

- **age out by default.** An instance's assets survive a configurable window, not forever.
- **`prune` is explicit** for reclaiming sooner, and refuses anything referenced by a `VERIFIED`
  prelude, an open issue record or an open quest's `WALKED` line — those are the ones a fixer or an antagonist still
  needs.
- **video is the big one.** A screencast dwarfs every shot and transcript combined, so it ages out first and separately.

**What "referenced" means MECHANICALLY, because both refusals above are worthless as prose.** `start` records the quest
id in the registry entry. `prune` and `cleanup` then resolve a reference by reading that quest's `.quest-plans/` and
refuse anything cited there, naming the citing file in the refusal. An instance with no quest id has nothing citing it
and ages out on the ordinary window, which is the right answer for a session nobody orchestrated and the reason
`unowned/` needs no special case.

**What counts as a citation:**

| Citation                                     | Held for                                               |
|----------------------------------------------|--------------------------------------------------------|
| a `VERIFIED` line naming a run               | a fixer re-running that prelude                        |
| an open issue naming an instance and run     | the fixer working that defect                          |
| **a `WALKED` line, while the quest is open** | **the antagonist that has not attacked that path yet** |
| a `verifyByHuman` item naming a video        | the person handed that list at quest end               |

**The `WALKED` row is the one that gets left out, and leaving it out unprotects a CLEAN happy walk's shots** — precisely
the evidence the adversarial phase is about to read. A clean walk raises no issue, so an issue-only rule leaves its
baselines citable by nothing, and the operator's own `cleanup` at the start of the next phase ages them out. The
attacker then arrives with no baseline for a path that passed, on the phase that exists to compare against one.

**The video row is the exception to ageing out first, and it is the case video was kept for.** A `verifyByHuman` unit
hands a person a `.webm` and a question, and that list reaches them at quest END — so a screencast deleted on the
two-day video window is a link that rots before the only reader it has.

**Never prune on `start` to make room.** A start that quietly deletes another session's evidence to free space is the
worst version of this: the deletion is invisible, and the session that lost its record finds out when it goes to read
it. Report the shortage and refuse — the hard floor already written down.

### Reading evidence starts nothing, and that is a SEPARATE PATH through the tool

**Three of the thirteen tools need a driver. `start`, `run` and `kill` — nothing else.** Every other call reads the
registry, the asset tree or the machine, and a session that only wants to read costs no boot, no port pair, no memory
and no pool slot.

**This has to be stated or it does not get built, because the architecture above argues the opposite.** The tools are
thin clients over a local socket to a per-instance driver. A killed instance has no driver, so a `results` call routed
down that socket answers with a bare connection error — which this doc already names as the least useful thing a session
can be handed, because it cannot tell a crash from a kill from an instance that never existed.

**So the rule is one rule, not a branch: every evidence read resolves off disk, whether the instance lives or not.** Not
"off the driver while it is up, off disk afterwards" — that shape works in every test written the same afternoon as the
walk and fails for every fixer, which is the one reader that matters here.

| Call                                                    | Needs               | Because                                                             |
|---------------------------------------------------------|---------------------|---------------------------------------------------------------------|
| `start` · `run` · `kill`                                | a live driver       | they spawn, drive and tear down a browser                           |
| `results` · `compare`                                   | the asset tree      | every reading was flushed to disk as it was taken                   |
| `status` · `capacity` · `cleanup` · `prune` · `profile` | the registry and OS | fleet and machine state, which no one driver holds                  |
| `snapshots`                                             | the asset tree, but | it lists STATE, and state does not outlive its instance — see below |
| `recipes` · `docs`                                      | nothing at all      | static data, already the case                                       |

**`snapshots` is the one that looks like an evidence read and is not.** A snapshot is a point `reset` can return to,
which is state, and `kill` takes the state with it. So `snapshots` against a finished instance answers "gone with the
instance" rather than listing names that no longer restore anything — the state-versus-evidence line, showing up in the
one call that straddles it.

**`compare` works within ONE instance, and there is no cross-instance form.** Two runs of one instance share a timeline,
which is what an index delta means; two instances share nothing but a spec. The artifact that DOES compare across
instances is the shot, measured byte-identical across three lanes, and promoting a baseline is how it travels.

**`prune` refuses a LIVE instance's assets**, whoever started it. Deleting captures out from under a running walk is the
same failure as pruning on `start` to make room, with the walk still going.

**The entry to evidence is an ID CARRIED IN A RECORD. Nothing browses.** No call lists another instance's runs, and no
call walks the tree looking for what a pass left behind. That is a context decision before it is a safety one: a session
handed a list of runs reads the list instead of the finding, and the finding is what its record already holds.

**So the id has to survive in writing, and that is a requirement on the RECORD rather than on the tool.** A walk records
the instance id and the run id against every issue it raises — the walker's table below says so — and the quest record's
required fields are where that becomes enforceable rather than habitual. **A session nobody orchestrated writes nothing
down by default**, so `start` hands back its evidence directory and the honest instruction is: keep that path somewhere
you will still have it, because the tool will not find it for you afterwards.

**A crashed minion is answered by a fresh instance, never by mining the corpse.** The operator re-dispatches the walk;
it does not go reading a half-written run to salvage what the walk had reached. A partial run's evidence is for saying
WHY the instance died — `status` and `likelyCause` — and for a defect the walk had already recorded in words. It is not
a way to finish a walk, and a verdict assembled out of two runs is not a walk either.

**What is GONE answers as gone, never as empty.** A reaped instance keeps its registry entry as a tombstone, and pruned
or aged-out assets leave one too, so a query lands on `pruned at 03:14, olderThan 7d` rather than on an empty list. An
empty list reads as "that step produced nothing", which is the `count: 0` ambiguity this design keeps meeting, arriving
where it does the most damage: a fixer concluding the walk saw nothing when the truth is that nobody kept it.

### What a batch buys beyond call count

**It is the only way a race is reachable.** `siege-lane.ts` exists because "six of nine defects on the paste flow were
races and replaying a race is not being in one." A model round trip between commands is seconds of dead air, so a
sub-second race cannot be hit one command at a time. Batched steps run back to back at millisecond gaps.

**What it costs is mid-walk branching.** If step 4 surprises you, steps 5–10 still run. Stop-on-first- failure covers
the bad case; small batches cover the rest. Say this out loud rather than discovering it.

---

## Part 2 — The capabilities, and the problem each one solves

### Addressing: a listing, not a selector

**Problem.** A selector is a guess and a wrong guess is invisible: `count: 0` reads exactly like "the element is
missing", which is itself a defect. So a wrong selector either manufactures a false finding or gets shrugged past. This
repo already solved the identical problem for code search —
`<dungeonmaster-searchStrategy>` says not to `discover` first because "a wrong glob returns nothing, which reads exactly
like a package with nothing in it." The cure was a listing before the query.

**Solution.** A step that returns the page as a tree, nested by testId ancestry, the way a devtools Elements panel nests
it.

**The key is the PRIMARY navigation surface, not a companion to the picture.** The one trial arm that had both rendered
three maps and opened none, reporting that testIds were legible straight from the key. So the key carries the load, and
it has to carry enough — a row is one line, and most of what follows is absent on most rows:

```
 ref  element                            text / value              attrs                 flags
 ---  --------------------------------   -----------------------   -------------------   ------------
  22  SUBAGENT_CHAIN <div>
  23    SUBAGENT_CHAIN_HEADER <div>
  24      (p)                             "▾ SUB-AGENT"
  25      (p)                             "Finished sub-agent (1 entries)"
  26      subagent-chain-duration <span>  "4m"                                            clipped-x
  27    CHAT_MESSAGE <div> [1/2]
  ---
  31  GUILD_ITEM_f52c…c546 <button>       "guild-alpha"             data-state=open       selected
  32  PIXEL_BTN <button>                  "CREATE"                                        disabled
  35  HOME_QUEUE_LINK <a>                 "⚔ EXECUTION QUEUE"       → /queue
  38  DOCS_LINK <a>                       "docs"                    → /docs ↗
  41  GUILD_NAME_INPUT <input>            "" ph:"my-guild"          maxlength=40          focused
  52  QUEST_ROW_9a1b <div>                "older quest"             data-status=failed    offscreen
  58  MODAL_BACKDROP <div>                                                                covers 22-31
```

**What each column carries, and why it is not optional:**

| Column       | Holds                                                                                                                                                      |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ref`        | the ephemeral handle, valid in this instance and page state only                                                                                           |
| indentation  | scope. The selector reads off the nesting                                                                                                                  |
| element      | the `data-testid`, **plus the TAG even when a testId exists**, plus the `role`, plus a DOM `id` where one is set, plus `[n/m]` where siblings share a name |
| text / value | the naming ladder's answer. For an input, the CURRENT value and the placeholder separately — they are different questions                                  |
| **attrs**    | **the DECLARED values it carries** — `href` as `→ /path`, `data-*`, and the input constraints. Empty on most rows                                          |
| flags        | the CONDITIONS it is in. Also empty on most rows                                                                                                           |

**The tag matters even when the testId is present.** `PIXEL_BTN` does not say whether it is a
`<button>` a keyboard can reach or a `<div>` with a click handler that a keyboard cannot — and that difference is a
defect class of its own.

**Attrs and flags split on DECLARED versus CONDITION, and the split is what keeps either column readable.** An attr is a
value the markup states and you would quote — a path, a status string, a number. A flag is a condition, boolean or
computed, where the presence of the word IS the message.

| This                    | Goes  | Because                                               |
|-------------------------|-------|-------------------------------------------------------|
| `href`, `data-status=…` | attrs | the VALUE is the answer                               |
| `disabled`, `focused`   | flags | the presence of the word is the whole message         |
| `low-contrast 1.4`      | flags | computed, not declared — the number is a measurement  |
| `maxlength=40`          | attrs | declared, and the number is exactly what a walk wants |

**Put `href` in the flags column and the rule collapses**, because a link's target is present on every link and a flag
that fires on every row of its kind is a column wearing the wrong hat. The arrow keeps the compact form the element
column had — `→ /queue`, not `href="/queue"` — and `↗` marks `target="_blank"`, which is worth a glyph because a click
that opens a tab breaks a walk.

**The flags are what turn a reading into a finding without anyone asking.**

| Flag                            | Answers                                                                          | How                                                 |
|---------------------------------|----------------------------------------------------------------------------------|-----------------------------------------------------|
| `disabled`                      | a click here does nothing — and that looks exactly like a broken control         | the attribute                                       |
| **`aria-disabled`**             | **the same, on a control that still takes the click and does nothing with it**   | the attribute, reported SEPARATELY                  |
| `focused`                       | where the keyboard is                                                            | `document.activeElement`                            |
| `selected` `checked` `expanded` | control state                                                                    | the aria attributes                                 |
| **`busy`**                      | **this subtree says it is loading — the stuck-spinner class, stated by the app** | `aria-busy`                                         |
| **`invalid`**                   | **a field the app has marked wrong. The sad path's own signal**                  | `aria-invalid`, and `:invalid`                      |
| **`live` `alert` `status`**     | **an announcement region — where a TOAST lands.** Absence here is a finding      | `aria-live`, `role`                                 |
| **`aria-hidden`**               | **painted, and invisible to assistive tech. Often a duplicate nobody meant**     | the attribute, on a box that has size               |
| **`invisible opacity:0`**       | **present, sized, painted, and not there.** Slips past every visibility check    | computed `opacity`                                  |
| `offscreen`                     | painted, but outside the viewport — `isVisible()` says `true` and means little   | rect against `innerWidth`/`innerHeight`             |
| **`scrollable, 340px below`**   | **the reading is PARTIAL — rows exist past the fold of this container**          | `scrollHeight`/`clientHeight` and `scrollTop`       |
| `covered by N`                  | something paints on top. Also `isVisible(): true`                                | `elementFromPoint` at the rect centre               |
| `clipped-x` `clipped-y`         | the label is cut. **`text` shows the full string and the screen does not**       | `scrollWidth`/`scrollHeight` against client         |
| **`cut, no ellipsis`**          | **cut with no visual sign it was cut — worse than an ellipsis, and silent**      | overflow hidden, no `text-overflow`                 |
| `low-contrast 1.4`              | technically painted, perceptually absent                                         | computed colour against computed background         |
| `collapsed-ancestor`            | present in the tree, zero-size somewhere above                                   | walking up for a zero width or height               |
| **`empty`**                     | **a container with a box and no content in it — the partial-blank case**         | no content-bearing descendant                       |
| **`not-tabbable`**              | **looks clickable, keyboard cannot reach it.** A PROXY — see below               | `cursor: pointer`, non-focusable tag, no `tabindex` |
| **`broken-image`**              | **an `<img>` that loaded nothing.** A sprite-heavy UI hides this well            | `naturalWidth === 0`                                |

**These ARE the computed checks, and their home is the key row.** As a separate command they are
something a session has to think to ask for, and it will not. On the row they are seen whether or not anyone was looking
for them — which is the whole difference between a check that exists and a check that fires.

**Four of the new ones pay for themselves immediately, and each closes a hole something else in this design opened:**

| Flag                  | The hole it closes                                                                                                                                                                     |
|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-disabled`       | `disabled` is the sharp flag and this is its blind spot. An `aria-disabled` control is not disabled to a click — it takes it and does nothing, which is the failure wearing a disguise |
| `live` / `alert`      | the sad-path baseline turns on "was the toast there". A toast lands in a live region, so the key can answer it instead of a pixel diff against a frame the toast has since left        |
| `scrollable`          | `offscreen` is viewport-relative and says nothing about a row below the fold of a scrolling panel. "The list showed 2 rows" with a third one scrolled out is the same defect report    |
| `invisible opacity:0` | the exclusion list drops `display: none` and `visibility: hidden`, and `opacity: 0` walks straight through it. Excluding it too would hide a defect; flagging it reports one           |

### The `attrs` column — what the element DECLARES, in the app's own words

**A unit's claim is usually phrased in the app's vocabulary, and that vocabulary is in the attributes.**
`data-status="failed"` answers "which one is the failed row" in the same words the observable was written in, and
`→ /queue` answers "where does this go". That is the naming ladder's problem solved from the other end: not what do I
CALL this, but which one IS it, and what does it carry.

**What goes in the column, and the question each one closes:**

| Attr                                     | Closes                                                                                                        |
|------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| `→ /path`, and `↗` for `target="_blank"` | where a link goes, and whether clicking it will open a tab and break the walk                                 |
| `data-*`                                 | which row is the failed one, which panel is open — the app's own state, in the app's own words                |
| `maxlength` `pattern` `required`         | **what the antagonist is attacking.** A `maxlength` that silently truncates an oversized paste IS the finding |
| `type=` on an input                      | whether this is a password, a file picker, a number — which decides what can drive it at all                  |
| `title`                                  | whether a `clipped-x` label has a tooltip behind it, which is the difference between a defect and a design    |

**It needs a budget or it eats the key.** The key is ~243 tokens because every column is short, and attributes are the
one column an app controls. So: `data-testid` is the element column and is never repeated; values truncate; a row past
its cap says how many it dropped, the same way the key reports truncation everywhere else. An `<img src>` holding a data
URI is the shape that would blow this, and the `broken-image` flag already answers the question anyone was asking.

**And it needs a determinism guard**, which is the part that would bite silently. A framework writes runtime ids into
data attributes — an id minted per mount — and a key carrying one differs between two readings of the same state. That
makes the element delta report churn on a page nothing touched, which is the exact failure the identity rules in Part 5
exist to prevent. **A value that looks like a runtime id is dropped**, and the same rule that keeps recipes off
`randomUUID()` is the one being enforced here, one layer out.

**`className` is NOT in this column, and that is a decision rather than an omission.** Two reasons, and the second is
the one that matters:

- **Most of it is generated.** `m-4081bf90`, `css-1x2y3z` — build-time hashes that change when nothing about the page
  changed, which is the runtime-id hazard above wearing its most common costume.
- **A class is the MECHANISM behind something a person sees, never the thing itself.** Putting it on every row invites a
  walk to settle a unit on it — class present, stylesheet rule deleted, row not red, unit `confirmed`. That is the
  cheapest false pass available, and `siege-verification-remainder.md` Part 4 holds the rule for what a walk does
  instead.

It stays readable where it is genuinely the question: `dom { target, fields: ['className'] }`, narrow, through the
hatch — which is the right cost for an implementation question and the wrong cost for every row.

### "Does this element have a click handler?" — four routes, and none of them answers it here

**Write this one down, because `not-tabbable` looks like it should be built on a listener check and it must not be.**
The obvious implementation is the one that fails silently on this app.

| Route                                  | Sees                                                                  | Misses                                                                           |
|----------------------------------------|-----------------------------------------------------------------------|----------------------------------------------------------------------------------|
| `el.onclick`, the `onclick` attribute  | inline handlers                                                       | everything `addEventListener` registered, which is nearly everything here        |
| patch `addEventListener` in a `before` | every listener registered after the patch, with its target            | **that React does not register one per element** — see below                     |
| CDP `DOMDebugger.getEventListeners`    | the real list for one object: type, capture, and the handler's source | nothing, and it is Chromium-only and costs a round trip PER ELEMENT              |
| React's fiber props — `__reactProps$…` | the `onClick` a JSX author wrote                                      | nothing, and it is a private API keyed by a random suffix that changes per build |

**React DELEGATES, and that is what defeats the first two routes and blunts the third.** It attaches one click listener
at the root container, not one per button. So a page-script patch reports the root has a listener and every button has
none, which is worse than no answer: it reads as "nothing on this page is wired up". The CDP route is accurate and hits
the same wall from the other side — it truthfully says the button has no listener, because the button has no listener.

**And the design already has a BETTER answer to the question behind the question.** "Is this control dead" is settled by
clicking it: `pixelChange: 0%` beside `+0 -0 moved 0` and zero network exchanges is a control that did nothing,
measured. A listener check is a proxy for that, and a worse one — **a handler that exists and does nothing passes it**,
which is the same defect waved through.

**So:**

- **`not-tabbable` stays a PROXY and says so** — `cursor: pointer` on a non-focusable tag with no `tabindex`. It answers
  an a11y question, not a wiring one, and a proxy honestly labelled beats an inference nobody can audit.
- **Listener inspection is available on `dom`, never on a key row.** `fields: ['listeners']` takes the CDP route for one
  named selector, which is the right cost for a rare question and the wrong cost for every row of every key.
- **Nothing infers "dead control" from a listener count.** The click is the test.

### Two key-level readings, which are not row flags at all

**A testId appearing under two DIFFERENT parents — reported as a line under the key.** The `[n/m]` marker handles
siblings; this handles the case that is not siblings, and it is worth building because the trial already found it:

```
… subagent-chain-duration appears 2× — under SUBAGENT_CHAIN_HEADER and under CHAT_PANEL
```

**That line is the bug all three trial arms found, printed without anyone looking for it.** The inner sub-agent's body
rendered twice — once correctly nested, once orphaned at the chat panel's root — and no console warning fired. Arm B
caught it by measuring two rects by hand. A duplicate-name line catches it on every key of every page, for free.

**`role` sits beside the tag in the element column, not in attrs**, because it is part of what the element IS rather
than something it carries. `<div role="button">` is a control to assistive tech and not to a keyboard, and the tag alone
does not say which of those the author meant.

### What is deliberately NOT computed, and why

| Not doing                                  | Because                                                                                                                                                                     |
|--------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| rect-intersection overlap between siblings | it is n² over the page, and it is the one thing the MODEL'S EYE is reliably good at — the 37.9px find came from a picture, confirmed by a number                            |
| **event listeners, on a key row**          | React delegates to the root, so a per-element answer is "none" for every button in this app. It lives on `dom` as an opt-in field and nothing infers a dead control from it |
| z-index and stacking-context analysis      | `covered by N` already answers the question a user would have, and the rest is a rabbit hole with no defect class behind it                                                 |
| anything about motion                      | cut everywhere else in this design, for reasons Part 2 gives                                                                                                                |

**The rule that keeps this set from growing forever: a flag earns its place by being ABSENT on most rows.** A flag that
fires everywhere is a column, a column that reads the same on every row is noise, and noise is what a 243-token key
cannot afford. Anything that would fire on most rows belongs in the element column, in a `dom` read, or nowhere.

**Every one of these is cheap at the scale measured** — 19 to 36 rows, one `getComputedStyle` and one
`elementFromPoint` each, on a page that already had its layout computed. On a page of several hundred they may not be,
which is what `within` scoping is for. Do not pre-optimise a cost nobody has measured; do not assume it stays free
either.

**Truncation is reported, never silent.** A `within` scope or a depth limit that omits rows says so —
`… 12 more under CHAT_MESSAGES_AREA` — because a key that quietly stops is the `count: 0` problem wearing a different
hat.

**Indentation IS scope**, so the selector reads off the tree: ref 26 is
`[data-testid="SUBAGENT_CHAIN_HEADER"] [data-testid="subagent-chain-duration"]`. That nesting alone settles a unit —
"renders inside SUBAGENT_CHAIN_HEADER, after the description text, not inside the entry list."

Decisions taken, each with a reason that cost something:

- **Document order, not position order.** Sorting by y-coordinate scattered a three-item list across rows 18, 22 and 24,
  because the page has two side-by-side panels whose rows interleave vertically.
- **Own text nodes, never `textContent`.** Recursive text is what pulled a whole stylesheet into a reading.
- **An untagged element prints as its tag** — `(p)`, `(span)` — and a row's parent is its nearest *testId* ancestor, so
  intermediate wrapper divs collapse out on their own.
- **Excluded outright:** `style`, `script`, `meta`, `link`, `title`, `head`, `noscript`; any zero-size box; anything
  `display: none` or `visibility: hidden`.
- **`opacity: 0` is FLAGGED, not excluded.** It is the one invisibility that carries a box, a rect and a hit area, so
  excluding it alongside the other two would delete a defect from the reading instead of reporting one.

**Naming ladder** — four rungs, each catching what the one above missed, all four observed firing on one real screen:

| Rung                                                                      | Fires when                        | Seen on                               |
|---------------------------------------------------------------------------|-----------------------------------|---------------------------------------|
| own text                                                                  | the element paints its own words  | most rows                             |
| attributes — `aria-label`, `title`, `alt`, `placeholder`, `value`, `name` | no own text                       | form inputs, named from `placeholder` |
| **scope**                                                                 | text exists but repeats           | two `+` buttons                       |
| nth                                                                       | same testId, same parent, no text | two `PIXEL_SPRITE`s in one group      |

**Scope is the rung that matters and it is not a new idea.** `PixelBtnWidget` hardcodes
`data-testid="PIXEL_BTN"` and renders its `label` as text, so the add-a-guild and add-a-session buttons are
indistinguishable by testId AND by text. `home-content-widget.proxy.tsx:162-163` already reaches for the fix by hand:

```ts
const sessionListEl = screen.getByTestId('GUILD_SESSION_LIST');
const addButton = within(sessionListEl).getByTestId('PIXEL_BTN');
```

The listing derives that instead of a human noticing they need it. And it generalises to the case no amount of naming
fixes: **a list of N rows each carrying a delete control.** Every row has a unique id in its own testId, so every
control inside it is addressable by scope without touching the app.

**A ref binds to an ELEMENT, not a row number.** A ref to something a DOM change did not touch keeps working; a detached
one answers `stale`, which is a real answer. Recomputing must not renumber what is still there — a ref that silently
shifts is worse than no ref.

**Scoping.** The listing takes an optional `within` naming a testId, so a crowded region is read on its own. This is
also the untested mitigation for a page holding a long transcript: read it a region at a time rather than whole.

### `dom` is the ESCAPE HATCH, and the ladder above it has four rungs

**The hatch has to exist.** A key is a shaped reading, and a shaped reading always leaves something out — an attribute
nobody anticipated, a value the key truncated, the exact text of a message a unit quotes word for word. Without a way
down to the raw nodes, a session meeting one of those either guesses or invents a workaround, and the workarounds are
worse than the call.

**It also has to be LAST, and this is the one measured cost in this whole design.** `dom` with `body *` returned 58
nodes whose first entry carried the entire Mantine stylesheet in its `text` field. That single reading is why the old
verb was called unusable, and why the key reads own text nodes rather than `textContent`.

**The ladder, cheapest first:**

| Reach for         | When                                                                    | Costs                        |
|-------------------|-------------------------------------------------------------------------|------------------------------|
| `look`            | **the default.** What is here, what is it called, what is wrong with it | ~243 tokens for a whole page |
| `look { within }` | the region is crowded, or the page holds a long transcript              | less                         |
| `box { ref }`     | one element's geometry, exactly                                         | a few lines                  |
| `dom { target }`  | **the hatch.** A named selector, and a question the key does not carry  | unbounded without care       |
| `eval`            | a question no step shapes at all                                        | whatever you asked for       |

**Every column and flag the key gained removes a reason to open the hatch.** `href`, `role`, the input's current value,
the `data-*` attributes, `maxlength`, the geometry flags — each of those was a `dom` call before it was part of a row.
The hatch is for what is left after that, which is a much smaller set than it was.

**When it IS the right call:**

- an attribute the row does not carry — `maxlength`, `pattern`, `title`
- the exact text where the key truncated it, or where a unit quotes a message word for word
- a COUNT of matches across the page, where the number is the whole answer
- the raw shape of something surprising, when the key's reading and the picture disagree

**Three guards on the call, because prose will not hold this one either:**

| Guard                                                                | Because                                                                                                                       |
|----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| **own text by default**; `text: 'full'` opts into `textContent`      | the measured blowup was recursive text. Making the expensive one the opt-in reverses which mistake is easy to make            |
| **`fields:` projects**, the same way a `network` query does          | "count and rect for these" is a fraction of a full node reading, and the common case is one field                             |
| **a match cap that SAYS it capped**, with the true `count` beside it | a reading that quietly stops is the `count: 0` problem again. `count: 58, showing 10` is an answer; ten silent rows is a trap |

```jsonc
{ step: 'dom', target: '[data-testid="QUEST_ROW"]', fields: ['count'] }
{ step: 'dom', target: '[data-testid="TOAST"]', fields: ['text', 'rect'] }
{ step: 'dom', target: 'body *' }        // → count: 412, showing 10, capped. Narrow this.
```

**Where each audience learns this:**

| Who               | Learns                                                                             | From                                                |
|-------------------|------------------------------------------------------------------------------------|-----------------------------------------------------|
| a walking session | "the key first. `dom` is the hatch, it is expensive, and it needs a narrow target" | one line in its prompt — interpretation, not action |
| the same session  | the whole ladder, the guards and the field names                                   | `docs { for: 'walking' }`                           |
| whoever builds it | own text by default, projection, a cap that reports itself                         | this doc                                            |

**`eval` is a DIFFERENT hatch and carries a different risk.** `dom` is expensive; `eval` is cheap and can quietly break
the founding rule. A session can compute a verdict inside the page and hand it back as a value, and what arrives looks
exactly like a reading. That is why the package's `../../CLAUDE.md` already bans `querySelector` in eval source —
singular silently returns match one — and why `eval` is for a question no step shapes, never for a judgement a session
would rather not show its working for.

### Perception: three artifacts, and they are not interchangeable

**Problem.** The verdict is what a person sees, and no reading describes paint.

**Solution.** Every stop can produce three things. **Naming them apart matters** — "map" was used for all three during
design and collided with this repo's `get-project-map` as well:

| Word         | What it is                                 | Answers                                                   |
|--------------|--------------------------------------------|-----------------------------------------------------------|
| **the shot** | a clean PNG                                | does this LOOK right? **The only one that is evidence**   |
| **the map**  | the same frame with numbered boxes over it | WHICH thing on screen is which ref                        |
| **the key**  | the text tree above, ~243 tokens           | what is here, what do I call it, what selector reaches it |

The map's outlines change what the page looks like, so a verdict read off it would be a verdict on the overlay.

**The key and the map need DIFFERENT filters**, and giving them one filter is what produced empty boxes in the
prototype — outlines around wrappers that paint nothing, five on one screen.

- the **key** needs containers: indentation only means scope because the container is in the tree
- the **map** exists to point at what is on screen; a container that paints nothing is nothing to point at

So the map badges only elements with visible content of their OWN — own text, an interactive control, or an image.
Containers stay in the key, unbadged.

**Badges collide exactly where the page is dense, which is where the map is needed.** Measured on the nested-chain
screen: four badges wanted the same ten pixels at a header's right edge and, reading the rendered image back, **the
numbers were legible but could not be matched to their boxes** — including the two marking the `subagent-chain-duration`
elements, the whole subject of that flow. Colour by nesting depth does not fix this: the problem is four marks competing
for one spot, not telling levels apart. The fixes that work are the content filter above, an occupied-slot nudge, and
`within` scoping.

**An image is not free, and this was never costed.** Capturing is cheap — a file. OPENING one spends real context, and a
forty-step walk that opens forty may spend more than the `dom` blowup this whole design exists to stop. None of the five
lanes measured it. So:

- **always capture** — the evidence trail is complete whether or not anyone looked
- **report how much the picture CHANGED**, as one number against the previous capture
- **the RUN lists every shot it took and flags which to open** — start, end, and anything the change number makes worth
  a look. The policy lives in the tool, so no prompt has to carry it and no session has to remember it

That last point is the difference between a rule and a mechanism. "Open the start and end, open an intermediate on
signal" as prompt text is three sentences in three prompts that drift; as an `open:
true` flag on a listed shot it is one implementation, and a session that ignores it is visibly ignoring something rather
than quietly not knowing.

### `pixelChange` — an attention router, not a measurement

**Write this one down properly, because it is the mechanism the whole capture policy rests on.** When the tool is built,
this belongs in the command's own header.

**What it is.** One number per acting step: the fraction of pixels differing between this capture and the previous one,
wherever that was taken.

**What it is FOR.** Deciding whether to OPEN the image. Nothing else. Capturing is cheap and opening costs real context,
so a forty-step walk cannot open forty — and "capture always, open on signal" has no signal without this. It routes
attention; it measures nothing.

**The same number means opposite things depending on the step.** This is the part that will be got wrong:

| Reading     | After a `click`                             | After a `box` or `dom` read                 |
|-------------|---------------------------------------------|---------------------------------------------|
| `0%`        | **a finding** — the control did nothing     | correct. A read changes nothing             |
| small, 1-5% | a local change, probably what was asked for | suspicious — a passive read moved something |
| large, 30%+ | a navigation, a modal, a collapse           | almost certainly wrong                      |

So it is never interpretable alone. It is interpretable against **what the step was trying to do**.

**`null` is not `0%`.** The first capture in an instance has no predecessor. Reporting `0` there would manufacture a
no-change finding on the opening step of every walk.

**A BLANK screen is checked FIRST, before `pixelChange` is interpreted at all — and this is the trap it exists to
stop.** Two consecutive blank frames produce `pixelChange: 0%`, which this design reads as a finding: *the control did
nothing.* That is the wrong finding. The page is dead, not unresponsive, and a session handed "the button did nothing"
will go looking at the button.

So every capture carries `blank`, computed from the frame itself: one colour, or near enough, across the whole viewport.
It is the cheapest check here and the most severe state it can report.

**The COLOUR is part of the answer, not decoration:**

| Blank in                                  | Usually means                                                                                                                      |
|-------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| the app's own background — `#0d0907` here | the shell rendered and the content did not. React threw, an error boundary caught it and rendered nothing, a route matched nothing |
| white, or an unstyled default             | the document died or never styled — a bundle that failed to load, a hard navigation to nothing                                     |

**`health` covers this too, and the overlap is deliberate.** `health` is a reading a session ASKS for;
`blank` rides on every capture whether anyone asked. Same relationship as the geometry flags on the key: a check that
must be requested is a check that does not fire.

**Full-blank only.** A page showing its chrome and an empty content area is the same class of failure and a harder
measurement — a threshold, a region, an argument about what counts. The key already answers that one: no content rows
under the container that should have them.

**It pairs with the element delta, and the pair says what neither says alone:**

| pixels | elements | Means                                                          |
|--------|----------|----------------------------------------------------------------|
| 40%    | `+0 -0`  | same structure, different content — a data change, a re-render |
| 5%     | `+7 -0`  | a small widget appeared                                        |
| 0%     | `+0 -0`  | nothing happened at all                                        |
| 0%     | `+3 -3`  | something swapped for something the same size — worth a look   |

**What it cannot tell you, ever:**

- **whether the change was RIGHT.** A page that rendered the wrong thing changes exactly as much as one that rendered
  the right thing.
- **WHERE it changed.** One number for the whole viewport. A 2% change is a spinner appearing or a critical row
  vanishing, and this cannot separate them — which is why a scoped capture matters on a busy page, and why the number
  routes to the image rather than replacing it.
- **anything about motion.** See the Time section.

**It is noise on an animated page unless the capture is frozen.** That is not a caveat, it is a precondition:
`animations: 'disabled'` and `caret: 'hide'` on every comparison capture, or every step reports a difference and the
signal is dead. Part 5 has the detail.

### Settling: a step ends when the page is DONE, not when a clock says so

**Problem.** A fixed timeout is wrong in both directions. Too short and a step reports a timeout that is really a slow
render — a false defect, and the most expensive kind. Too long and every step pays the worst case. Neither number is
knowable in advance, and asking a session to guess one per step is asking it to encode a machine's speed into a walk.

**Solution — an acting step returns when the page SETTLES**, on three signals together:

| Signal  | Quiet means                                   |
|---------|-----------------------------------------------|
| network | no in-flight request for a quiet window       |
| paint   | no pending animation frame, no pending layout |
| DOM     | no mutation for the same window               |

**A poller never goes quiet, and that is the case that matters here.** This app polls: the rate-limit watcher reads on
an interval, a dispatch heartbeat fires, a watcher reconciles every few seconds. A naive network-idle wait would hang on
every page that has one — which is most of them.

So the detector **discounts a REPEATING pattern**: a request to the same path recurring at a regular interval stops
counting toward busy after it has repeated. What was hanging the wait becomes background.

**And the settle state is REPORTED, because it is sometimes the finding:**

```
settled in 340ms
never settled — GET /api/rate-limits every 1000ms (discounted), DOM still mutating at 10s
```

The second line is a defect report. A page whose DOM never stops mutating is the stuck-loader class arriving from a
different direction, and it currently reads to a session as "the tool timed out".

**Ceiling, not timeout.** The step still has an upper bound, because something must end. The difference is what the
bound MEANS: a settle-based step that hits its ceiling reports *what was still busy*, and that is actionable. A
clock-based step that hits its timeout reports only that time passed.

### Instrumentation: run a script before the page's

**Problem.** Anything counting what the app does at mount must be installed before the app mounts. All three arms needed
this; none had it.

**Solution.** A `before` step — Playwright's `addInitScript`. It is the substrate the geometry checks, the interval
counter and the health probe all stand on, not a one-off.

### Computed findings: on the key's rows, not in a command of their own

**Problem.** The listing hands over rects and the session does the subtraction. It will not think to.

**Solution — they are FLAGS on the key, and the section above lists the whole set.** `clipped-x`, `offscreen`,
`scrollable`, `covered by N`, `low-contrast`, `collapsed-ancestor`, `invisible opacity:0`: each is a cheap computation
the key already has the element and the computed style for.

**The placement is the decision, not the computations.** As a separate command every one of these is something a session
must think to ask for, and the whole premise of this doc is that it will not — that is the same failure as "looking is
optional". On the row they fire whether or not anyone was looking.

They remain READINGS under the founding rule: a computed difference between two measured values, reported beside the
element, never a verdict on a unit.

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

### Survival: what a stress tester needs and the verifier does not

**Problem.** The two minions claim different things:

|               | Claims                                    | Needs a pair around            |
|---------------|-------------------------------------------|--------------------------------|
| verifier      | the screen shows the value the unit names | the whole path — start and end |
| stress tester | I attacked this and it did NOT fall over  | **each attack**                |

**An absence with no baseline proves nothing.** A screenshot of a working page after an attack is evidence only if the
page was known-working before it.

**Solution — `health`, one reading with one verdict line:** root element present, page not blank, no new console errors,
no new 5xx, no new server-log error, plus a shot. Every part is already readable; what is missing is taking them
together so two readings compare. It is the stress tester's counterpart to the key — read state once in a fixed shape so
two readings can be held against each other.

**Server logs are the piece nothing surfaces today.** The lane already opens `api-server.log` and
`web-server.log` in its own directory and never tells anyone. `console` is browser-only, so a 500 caused by a server
exception is invisible unless a session thinks to open a log file nobody mentioned. An instance that owns the servers
can answer "what did the server say during steps 4–9."

**The failure-injection gap is narrower than it looks, and still real.** Much of hostile-input is drivable through the
page today: garbage through `type`, key spam through `key`, an oversized payload through `paste`, rapid repeated
`click`. What is NOT drivable is server-side failure — a 500, a hang, a dropped socket — which is what `interruption`,
`staleness` and `configuration` mostly need. The lane already injects a fake Claude CLI and a fake ward binary, so the
mechanism exists; it stops at those two.

**Three key columns serve the ATTACKER rather than the walker, and they are why the key is not a browser-walk-only
tool:**

| On the row                         | What it is to an antagonist                                                                                                                                       |
|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `maxlength` · `pattern` in `attrs` | **the cap it is measuring against.** A field that silently truncates an oversized paste is the finding, and the declared limit is what makes "silently" checkable |
| `live` · `alert` · `status`        | where the refusal LANDS. "The system rejected this properly" is a toast in a live region, and its absence is the app swallowing the error                         |
| `invalid`                          | the app stating its own verdict on the input — which the attacker reads, and never assumes                                                                        |

**And the attack surface changes shape entirely with no browser.** The off-map families are properties of the BUILT
SYSTEM rather than of any drawn flow, so `hostile-input` and `perf` coverage exists on an operational flow too — where
there is no `paste`, no `key` and no `click`. There the attack is `request`, `file` and the process itself, against the
browserless spec. `siege-verification-remainder.md` Part 4 holds the full verifier-versus-antagonist table, which is the
ROLE half of this section.

### Resetting: three layers, and a reset must say which one it touched

**Problem.** A stress tester runs many attacks against one instance. Attack 1 corrupts something; attack 2 then starts
from corrupted state and measures nothing. So every attack needs a known starting point — and "reset" is currently one
word covering three different things.

Today the lever is prose. The guide's `RESET` heading asks a sub-agent to write down "the command that returns a lane to
its starting state — **and what it does NOT reset, which is the part that surprises people**", and the verifier prompt
admits it has no other route to that value. Nobody verifies it.

**State lives in three places and no single action clears all three:**

| Layer             | What holds it                                                                    | What clears it                                     |
|-------------------|----------------------------------------------------------------------------------|----------------------------------------------------|
| **disk**          | the instance's throwaway home — guilds, quests, JSONL transcripts, logs          | restore a snapshot                                 |
| **server memory** | the API server PROCESS — in-memory buses, caches, watchers, uptime, open handles | only a restart                                     |
| **browser**       | `localStorage`, `sessionStorage`, IndexedDB, live websockets, the loaded page    | a fresh context, or clearing storage and reloading |

**The middle row is the one that bites, and this repo has a concrete instance of it.** Quest mutations go through a file
outbox, but transient events — `chat-output`, `chat-complete`,
`clarification-request` — live on the in-memory `orchestrationEventsState` bus, and
`server-init-responder` holds a `workItemQuestIdCache` beside it. Restore the disk and both are still carrying whatever
the last attack put there. A session that restores files and believes it is clean is wrong in exactly the way that
produces a confident, false result.

**Solution — three named levels, each declaring what it keeps:**

| Level      | Clears                                     | Keeps               | Rough cost                 |
|------------|--------------------------------------------|---------------------|----------------------------|
| `page`     | browser storage, the loaded document       | disk, server memory | ~1s                        |
| `state`    | disk, plus everything `page` clears        | **server memory**   | ~2s                        |
| `instance` | everything — a fresh process, then re-seed | nothing             | ~20s boot, plus the recipe |

**A reset must NOT erase the evidence, and a naive home snapshot does exactly that.** The instance's home holds the
state a walk manipulates — guilds, quests, transcripts — but the same directory also holds `api-server.log`,
`web-server.log`, the screenshots and the step transcript. Snapshot the whole thing and restore it, and you have just
deleted the server log that recorded the crash you are investigating, plus every shot taken since.

So the boundary is explicit: **a snapshot covers the STATE subtree only. Logs, captures and the run transcript sit
outside it and survive every reset at every level.** Evidence accumulates forward; only state rewinds.

**A reset REPORTS the diff it undid.** That turns "what does this not reset" from a guess a guide-writer writes down
into a measurement: anything still present after a restore is, by definition, what that level does not reach. It also
doubles as the damage check the verifier prompt already demands — *"After any error branch, check for damage. No
orphaned row, no half-written file, no silently consumed message"* — because a diff against a known point IS that check.

**Each attack declares the level it needs.** Most want `state`. An attack that poisons server memory — exhausting a
pool, killing a connection, wedging a watcher — needs `instance`, and saying so is part of the attack rather than
something the next attack discovers.

**Two constraints on `instance`, and both are already written down elsewhere:**

- **It destroys process-lifetime measurements.** The verifier prompt: a restart kills "any unit measuring a difference
  from a value only that process's lifetime provides — an uptime, a monotonic counter, an append-only log". So an attack
  needing `instance` must not sit in the same batch as a unit measuring one of those.
- **It only returns to a comparable state if the recipe is deterministic.** `instance` means re-seed, and a baseline
  taken before it is only comparable afterwards if the recipe produces the same bytes. That is the same determinism the
  byte-identical PNGs depend on, arriving from a different direction.

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

**How an antagonist actually GETS them.** "Inherits a verified-clean baseline" is a property, not a mechanism. The
mechanism is the one every other reader of a finished walk uses: **the operator's dispatch carries the happy walk's
instance id and run id for the path being attacked, and the antagonist reads its shots with `results`.** That starts
nothing and answers for an instance killed hours earlier.

```
results { instance: 'inst_9b2c', run: 'run_2', kind: 'screenshots' }
→ step 4  …/run_2/step4.png   node: guild-selected
  step 7  …/run_2/step7.png   node: chain-rendered
```

**Every shot carries the NODE it was taken at**, which is what makes a baseline fetchable per node rather than per walk.
The promotion rule is already per node; without the node on the shot, the reader has only a step number and has to
reconstruct which screen it was.

**On a SAD path, "known good" is an error rendered CORRECTLY — usually a toast.** The baseline for a failure branch HAS
the error message in it, and that message is the correct screen. An antagonist comparing against a happy-screen baseline
instead reports the toast as damage; the inverse is worse, where the app swallows the error, `pixelChange` reads `0%`
and "nothing changed" is written down as *it held*. `siege-verification-remainder.md` Part 4 holds the role-side rule.

**A toast is TRANSIENT and a baseline of one is a baseline of a moment.** It auto-dismisses, so a pixel comparison
against it can report a difference that is only timing. A transient baseline is read as a PRESENCE question — was the
toast there, with that text — which is a `look` against the key, not a diff against the frame.

### Teardown: the failure that is silent, costs three processes, and is never noticed by the session that caused it

**Every instance is three processes, a port pair, two open file descriptors, a throwaway home and a growing pile of
snapshots.** Nothing about a leak is visible to the session that leaked it — the walk completes, the record is written,
the return reads clean, and three processes stay up. Under a pool of three parallel instances that compounds fast.

**The existing lane already teaches most of this, and its lessons must survive the rewrite:**

| Lesson, already in `siege-lane.ts`                                      | Why                                                                                                                                           |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| servers spawn `detached: true` so the whole process GROUP can be killed | `npm run` is a wrapper and the real listener is a grandchild via `sh -c`. Killing the child leaves the listener holding the port              |
| SIGTERM, a 3-second grace, then SIGKILL                                 | a server given no grace leaves a half-written log                                                                                             |
| **skip the signal for a child that already exited**                     | otherwise every clean teardown logs `kill ESRCH`, "which reads as a failure in the one log a later session opens to find out what went wrong" |
| the throwaway home is removed; the instance's EVIDENCE directory is NOT | logs, captures and the transcript are evidence and outlive the instance. See the state-versus-evidence boundary above                         |

**The vulnerability the current design names and does not solve** is in the driver's own comment:
servers are spawned detached "which also means **nothing reaps them if this process is interrupted**."
The idle timeout is the only backstop, and it is 900 seconds of three live processes.

**Six ways it goes wrong, all of them quiet:**

| Failure                                            | What is left                                                                    |
|----------------------------------------------------|---------------------------------------------------------------------------------|
| the session dies mid-batch                         | the instance is not its child; nothing kills it                                 |
| `kill` never called — forgotten, or the turn ended | same, and this is the common one                                                |
| partial teardown — browser closes, servers survive | ports bound, an instance half-gone and not listed as either                     |
| a port not released before the next allocation     | two instances on one port, which reads as a walk measuring another walk's state |
| the home not removed                               | `/tmp` accumulates `dm-siege-*` across every run of every pass                  |
| snapshots not removed                              | two per run automatically, times every run, times every instance                |

**And one the new design introduces:** `kill` must not take the evidence with it. A session that kills before writing
its record would otherwise lose the logs, captures and transcript that were the whole point. Evidence outlives the
instance; only the throwaway state goes.

### When it dies without warning: OOM, SIGKILL, a full disk

**Teardown assumes the tool gets to run code. This is the case where it does not**, and the design has to say plainly
what it handles and what it cannot.

**SIGKILL cannot be caught.** If the OOM killer takes the driver, no handler fires, nothing is cleaned, nothing is
reported. What is left is three orphaned processes holding a port pair, a throwaway home, a pile of snapshots, and a
socket the next MCP call will fail against with a bare connection error — which tells a session nothing about whether
the instance crashed, was killed, or never started.

**Four failures, and only one of them is un-handleable:**

| Failure                                                 | Handled?                    | How                                                                                                                                  |
|---------------------------------------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| a CHILD dies — the API server OOMs, the browser crashes | **yes**                     | the driver notices and reports WHICH child, with its last log lines. This is the recoverable case and the common one                 |
| the disk fills DURING a run                             | **partly**                  | writes start failing. Check free space before the big ones — a snapshot, a video — and refuse with a reason rather than half-writing |
| the driver dies, session alive                          | **yes, as a legible error** | the next call says the instance is gone and why, from what survived                                                                  |
| the DRIVER is SIGKILLed                                 | **no**                      | nothing of ours runs. Recovery is entirely what was already on disk                                                                  |

**So the only defence against SIGKILL is written down BEFORE it happens:**

- **A heartbeat file per instance** — pid, instance id, **the process-group ids of every child**, and a timestamp
  updated every few seconds. The pgids are the load-bearing part: after a SIGKILL there is nothing in memory holding
  them, so without a file the orphans cannot be found, only guessed at.
- **Reaping on next contact.** Any instance whose heartbeat is older than a few beats is presumed dead: `start` and
  `capacity` sweep opportunistically, and `cleanup` does it explicitly. They kill its groups, remove its home, and SAY
  SO. That is the only recovery path there is.
- **The transcript is flushed per step, never buffered.** A buffered transcript loses the whole run on a crash —
  including the steps that led to it, which is the part anyone would want most.

**`status` is the post-mortem, and it is the call a session reaches for when something died.**
`capacity` looks forward — can I start another. `status` looks at what IS, including what went wrong:

```
status {}
→ monitored: ['rss per process group', 'free memory', 'free disk', 'load average', 'kernel OOM events']
  machine:   { freeMemMB: 980, totalMemMB: 16000, freeDiskMB: 2100, cores: 8,
               loadAvg: [7.9, 6.2, 4.1], oomKillsSinceBoot: 2, lastOomAt: '20:11:04' }
  instances: [
    { id: 'inst_7f3a', state: 'alive', uptime: '14m', lastBeat: '2s ago', rssMB: 1840, runs: 3 },
    { id: 'inst_9b2c', state: 'DEAD — no heartbeat for 4m',
      lastBeat:  '20:11:02',
      lastStep:  { run: 'run_2', step: 7, verb: 'click' },
      rssAtLastBeat: 2980,
      orphans:   [ { pgid: 33812, cmd: 'npm run dev:no-watch', alive: true } ],
      evidence:  { dir:        '<repoRoot>/.siegelense/guilds/<guildId>/instances/inst_9b2c/',
                   transcript: 'run_2.jsonl', logs: ['api-server.log', 'web-server.log'],
                   lastShot:   'run_2/step7.png' },
      likelyCause: 'OOM — rss 2980MB at last beat against a 2600MB profile peak; kernel OOM kill at 20:11:04' } ]
```

What that shape is carrying:

- **`evidence` is the raw-file route, and it survives the instance.** `results` gives the filtered view — errors in
  steps 4 to 9 — and this gives the files themselves, under a `dir` a `Read` can open. A session that wants the whole
  server log rather than a window has it without another call.
- **`monitored` answers "what can I even ask about".** Without it a session guesses at metric names, and a guess that
  returns nothing reads exactly like a metric that is zero — the `count: 0` problem again, one layer up.
- **`likelyCause` is a READING, not a verdict.** "rss 2980MB against a 2600MB profile peak, kernel OOM kill at 20:11:04"
  is evidence a session can weigh. "It ran out of memory" is a claim it cannot.
- **`orphans` carries pgids and whether each is still alive**, because that is what a session needs to decide whether to
  reap — and `kill` accepts a dead instance's id for exactly that.
- **`lastStep` is usually the whole answer.** What it was doing when it died. Reliable precisely because the transcript
  flushes per step rather than buffering.
- **It is worth calling when nothing is wrong.** That is how a session learns what normal looks like here, which is what
  makes the dead case legible by contrast.

**The OOM evidence is platform-specific and may simply be unavailable.** Kernel OOM kills are readable from the system
journal on Linux and may need privileges this process does not have. Report it when it is there, say `unavailable` when
it is not, and **never infer a cause from its absence** — a missing kernel line is not evidence of a clean death.

**A death at step 7 of run 2 does not lose runs 1 and 2.** Everything up to that step is on disk and still queryable
through `results`, so a session usually salvages most of a walk rather than starting it again. Knowing that is the
difference between re-running an hour of work and re-running four steps.

**Evidence written before the death survives; evidence in flight does not.** Logs and captures are already files, so
they are intact. That is the reason for the state-versus-evidence split arriving a second time: a crash takes the
instance and leaves the record.

**Disk is checked before `start` AND before every large write.** A pre-flight check is necessary and not sufficient —
the disk can fill from something this tool never started, mid-run, between two steps. A capture that half-writes is
worse than one that does not write, because a truncated PNG reads as a corrupt screen rather than a missing file.

**Never auto-restart after an OOM death.** An instance killed for memory will be killed again, and a walk whose
measurements span two different processes is not a walk. The death is reported, the caller decides, and the right
decision is usually fewer instances — which is `capacity`'s job. **A death from memory pressure should also correct the
PROFILE**: it is evidence that this spec peaks higher than the profile recorded, and the next `suggested` should reflect
that rather than repeating the mistake.

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

### Handing a defect to a fixer: what a walker must write down

**A fixer needs to reach the state the walk was in, and the instance is gone by then.** The walker kills it as its last
action, by its own rules. So the handoff cannot be "here is my instance" — it has to be everything a fixer needs to get
back there on its own.

**What the walker records against every issue:**

| Field                      | For                                                                                                                                      |
|----------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| the INSTANCE id and RUN id | provenance, and **the only handle anything has on the evidence** — nothing browses for it                                                |
| the failing STEP           | `{ run: 'run_2', step: 7, verb: 'click' }`. Usually the whole answer                                                                     |
| **the PRELUDE**            | the runnable batch that reaches this path's entry. This is what makes the state reproducible                                             |
| the evidence paths         | the shot and the video, as paths. The server log, the key and the wire are QUERIES, and the run id plus the step range is what they take |

**An id that never gets written down is evidence nobody can reach.** The tool keeps the run for its retention window and
offers no way to find it without the id, so the record is the index — which is why these fields belong in what the quest
record REQUIRES rather than in what a careful walker remembers.

**That recording is a requirement in its own right, and it is not limited to issues.** Every path walked carries the
instance and run that walked it, a CLEAN walk included, because that id is the proof the path was driven at all — the
same thing a prelude's `VERIFIED` line does one level down. `siege-verification-remainder.md` Part 4 states it.

**The fixer does not resurrect the dead instance — it RE-RUNS THE PRELUDE on a fresh one.** That is what preludes were
for, and why `VERIFIED` matters: the fixer is handed a batch already proven to land where it claims. "Restart to check
state" is a fresh instance plus a known-good prelude, not a corpse brought back.

**`results` keeps answering for a killed instance, and answering costs no instance.** The evidence lives in the
instance's own directory under the asset tree, which survives `kill` by the state-versus-evidence rule, so every reading
is read from disk and the answer carries a flag saying the instance itself is gone. Without that, a fixer holding a run
id would find it resolves to nothing — and the handoff would depend on the walker having copied every reading into its
record by hand.

**Against a finished instance the RUN ID is required, and `results` refuses to guess.** A live session driving its own
instance may omit it and get the latest, because it knows what the latest is. A fixer does not: the instance it was
handed may carry the prelude's proving run, the walk, and a re-walk, and "latest" silently reads whichever went last.
That is `.first()` again, one layer out — a defensible-looking default landing on the wrong thing and returning a
clean-looking answer.

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

### Testing teardown — ONCE, as the tool's own suite. Never per quest.

**This is a test suite for the TOOL, written when the tool is written, run by ward like any other.**
No quest runs it, no siegemaster runs it, no walk runs it. A pass that had to verify its own teardown would be a pass
that cannot trust the thing it is driving.

What a QUEST gets instead is the guarantee this suite buys: `kill` works, and a leaked instance is a bug in the tool
rather than something each walk defends against.

**Teardown tests are the ones most likely to pass while proving nothing.** This repo has already measured that trap:
`../../packages/orchestrator/CLAUDE.md` records a leak-guard attempt where "a `process.getActiveResourcesInfo()` Timeout
count
taken either side of the import comes back unchanged whether the spies are installed or not — measured both ways — so it
passed for every tree and proved nothing about the mock it was written to protect."

**So every teardown assertion has to be shown failing against broken teardown before it is trusted.**
Red first, applied to cleanup:

| Assertion                                                                  | The break it must catch                                                                                                                                                    |
|----------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| the port pair is free after `kill`                                         | skip the SIGKILL pass                                                                                                                                                      |
| no process matching the instance remains                                   | kill the child rather than the process group                                                                                                                               |
| the home directory is gone                                                 | skip the `rm`                                                                                                                                                              |
| **the evidence directory REMAINS**                                         | remove the lane dir along with the home                                                                                                                                    |
| snapshots are gone                                                         | skip snapshot cleanup                                                                                                                                                      |
| a SIGKILLed driver's orphans are reaped by ANOTHER process's `cleanup`     | kill the driver with SIGKILL — its own idle timeout dies with it, so nothing self-reaps. If this passes without a second process running, the test is not testing anything |
| **killing one of three parallel instances leaves the other two untouched** | widen the group kill by one pid                                                                                                                                            |

That last row is the one that gets skipped and the one that bites, because it only fails under parallelism — which is
exactly the shape the two-phase pass introduces.

---

## Part 3 — Restructuring the pass

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
  boot       20s      ← the one real number here; see siege-verification-remainder.md Part 2
  from       14 instances, last 2026-09-14
```

**Only `boot 20s` is measured.** `siege-verification-remainder.md` Part 2 holds every figure this project actually took,
and it has no memory numbers in
it — nobody has profiled an instance yet. The memory values above exist to show the SHAPE and the arithmetic; treat them
as a worked example, not as this repo's real cost.

**Every sample carries the pool size it was taken at**, which is the invariant Part 5 states and which a schema without
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

## Part 4 — Decisions already taken

Two halves. **4A is what the TOOL implements** — it binds whoever builds it, and stays grouped by subject. **The other
half, what each ROLE is bound by**, binds a session at run time, is grouped by who, and lives in
`siege-verification-remainder.md` and `siegelense-recipes.md`. A builder reads 4A; a prompt author reads that half.

**The vocabulary these rows use is defined in Part 2**, under "Perception: three artifacts" — **the shot** (a clean PNG,
the only one that is evidence), **the map** (the same frame with numbered boxes on it), **the key** (the text tree).
Elsewhere: an **instance** is one running stack, a **run** is one submitted batch, a **recipe** creates state, a
**prelude** is the batch that reaches a path's entry, and the `video` STEP records a screencast — distinct from a
**round record**, which is the file a walk writes.

---

### 4A — What the tool implements

#### Readings, and what a step may never do

| Decision                                                                                                     | Because                                                                                                                                                                                                                                                           |
|--------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A step returns a READING, never a verdict on a unit                                                          | `siege-command.ts`'s founding rule. Comparing two measured values is still a reading; deciding a unit passes is not                                                                                                                                               |
| **No step ever picks among matches. Ambiguity THROWS, and the error carries the candidates with their refs** | `.first()` is live today in `click`, `type`, `waitFor`, `paste` and `screenshot`. It clicks BROWSE while you meant CREATE and hands back a clean-looking result. Zero matches throws too, naming near-miss testIds, because a misremembered id is the common case |
| The no-pick rule is held by a LINT RULE over the command implementations, not by prose                       | `page.locator(t).first().click()` is the obvious line to write and the wrong one. `.first()`/`.last()` are banned outright there; `.nth()` only with a caller-supplied argument                                                                                   |
| `querySelector` in eval source is banned by the package's `../../CLAUDE.md`, not by lint                     | singular silently returns match one — the same defect — but it sits inside a template literal, and a rule inspecting string contents is its own liability                                                                                                         |
| The package carries a `../../CLAUDE.md` of invariants, each with its measurement                             | same pattern as `../../packages/orchestrator/CLAUDE.md` and `../../packages/web/CLAUDE.md`. Part 8 lists the minimum entries                                                                                                                                      |

#### Addressing: the key, refs, the map

| Decision                                                                                                                    | Because                                                                                                                                                                                                                                                                                |
|-----------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| The key and the map get different filters                                                                                   | one filter produced outlines around invisible wrappers                                                                                                                                                                                                                                 |
| The KEY is the primary navigation surface; the map is secondary                                                             | the one trial arm holding both rendered three maps and opened none, reporting testIds were legible straight from the key                                                                                                                                                               |
| A key row carries the TAG even when a testId exists, plus the `role` and a DOM id                                           | `PIXEL_BTN` does not say whether it is a `<button>` a keyboard reaches or a `<div>` with a click handler that it cannot — which is a defect class of its own                                                                                                                           |
| **A key row has FOUR columns: element, text/value, `attrs`, flags — split on DECLARED versus CONDITION**                    | an attr is a value the markup states and you would quote; a flag is a condition, boolean or computed, where the word's presence is the message. `href` in the flags column collapses the rule, because it fires on every link and a flag that always fires is a column                 |
| An input shows its CURRENT value and its placeholder separately                                                             | they are different questions and the naming ladder collapsing them loses the one the walk is usually asking                                                                                                                                                                            |
| State flags ride on the row: `disabled` `focused` `selected` `expanded` `offscreen` `covered`                               | `disabled` is the sharp one — a click there does nothing, and that looks exactly like a broken control                                                                                                                                                                                 |
| **`aria-disabled` is reported SEPARATELY from `disabled`**                                                                  | it is the same failure wearing a disguise: the control still takes the click and does nothing with it, so a reading that folded the two together would report the click as landing                                                                                                     |
| **A live region — `aria-live`, `role="alert"`, `role="status"` — is flagged**                                               | it is where a TOAST lands, and the sad-path baseline turns entirely on "was the toast there, with that text". On the key that is a presence question; against a frame it is a pixel diff against a moment that has passed                                                              |
| **`scrollable` carries how much is past the fold of that container**                                                        | `offscreen` is viewport-relative and says nothing about a row below the fold of a scrolling panel. "The list showed 2 rows" with a third one scrolled out of a panel is the same defect report, from a cause nothing else here would name                                              |
| **`opacity: 0` is FLAGGED, never excluded**                                                                                 | it is the one invisibility that keeps its box, its rect and its hit area, so excluding it beside `display: none` would delete a defect rather than report one                                                                                                                          |
| **`attrs` carries `href` as `→ /path` (`↗` for a new tab), `data-*`, the input constraints, `type` and `title`**            | each closes a question that was a `dom` call: where a link goes, which row is the failed one, what cap an oversized paste is being measured against, whether a clipped label has a tooltip behind it                                                                                   |
| **The `attrs` column is BUDGETED, and runtime-looking values are DROPPED**                                                  | it is the one column an app controls, so an unbudgeted one eats a 243-token key. The guard is not optional either: a framework's per-mount id in a data attribute makes two keys of one state differ, and the element delta then reports churn on a still page                         |
| **`className` is NOT a key column — it is a `dom` field**                                                                   | most of it is build-time hashes, which is the runtime-id hazard in its commonest costume. And a class is the MECHANISM behind what a person sees: on every row it invites a walk to settle a unit on a class that is present while the paint is wrong                                  |
| **A testId appearing under two DIFFERENT parents is a line under the key**                                                  | `[n/m]` covers siblings and this covers what is not siblings. The trial's real bug was a body rendered twice, once nested and once orphaned, with no console warning — a duplicate-name line prints it on every key without anyone looking                                             |
| **`role` sits beside the tag in the element column**                                                                        | same reason the tag is there: `<div role="button">` is a control to assistive tech and not to a keyboard, and neither half alone says which the author meant                                                                                                                           |
| **A flag earns its place by being ABSENT on most rows**                                                                     | this is the rule that stops the set growing forever. A flag that fires everywhere is a column, a column that reads the same on every row is noise, and a 243-token key cannot afford noise                                                                                             |
| **`dom` stays as the ESCAPE HATCH and is last on a four-rung ladder** — `look`, `look { within }`, `box`, then `dom`        | a shaped reading always leaves something out, and a session with no way down to the raw nodes invents a workaround worse than the call. It is last because of the one measured cost here: `body *` returned 58 nodes carrying a whole stylesheet                                       |
| **`dom` gains three guards: own text unless `text: 'full'`, a `fields:` projection, and a cap that reports the true count** | the measured blowup was recursive text, so the expensive read is the opt-in. A cap that stops quietly is the `count: 0` problem; `count: 58, showing 10` is an answer                                                                                                                  |
| **`eval` is a DIFFERENT hatch — cheap, and the one that can launder a verdict into a reading**                              | a session can compute a judgement inside the page and hand back a value that looks exactly like a measurement. It is for a question no step shapes, and `querySelector` in its source is already banned for the neighbouring reason                                                    |
| **Event listeners are a `dom` field over CDP, never a key row — and "dead control" is never inferred from one**             | React delegates to the root container, so a per-element listener check answers "none" for every button in this app. The click is the test: `pixelChange: 0%` beside `+0 -0 moved 0` and no exchanges is measured, where a handler that exists and does nothing passes a listener check |
| The computed geometry checks are FLAGS ON THE KEY, not a command of their own                                               | as a separate call they are something a session must think to ask for, and it will not. That is the same failure as "looking is optional"                                                                                                                                              |
| Truncation of the key is reported, never silent                                                                             | a key that quietly stops is the `count: 0` problem wearing a different hat                                                                                                                                                                                                             |
| A ref is EPHEMERAL — for driving, never for storing. Durable handles are testId plus `within`                               | a saved batch carrying `ref: 14` does not throw; ref 14 may exist and point at something else, so it drives the wrong element and returns a clean-looking result. That is `.first()` wearing a number. Navigation, `reset` and restart all invalidate every ref                        |
| A ref is scoped to ONE INSTANCE, and inside it to one page state. The instance is the only thing that can resolve one       | four boundaries it cannot cross and all look passable: minion→parent (the parent owns no instance), parent→fixer (a fixer never starts one), walk→re-walk (a fresh instance), happy→adversarial phase (different instances by design)                                                  |
| The map's BADGES get no colour-coding by nesting depth, for now                                                             | four badges competing for ten pixels is not a colour problem                                                                                                                                                                                                                           |
| The numbered MAP is built LAST and is OPTIONAL — `look` omits the field until it ships, then returns it only on `map: true` | the one trial arm that had it rendered three and opened none, reporting the key was enough. An absent field is honest where an empty one invites a session to wonder what went wrong                                                                                                   |

#### Perception: shots, pixelChange, animation

| Decision                                                                                                                   | Because                                                                                                                                                                                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Only the shot is evidence                                                                                                  | the map's own boxes change what the page looks like                                                                                                                                                                                                          |
| SCREENSHOTS are captured always, and the RUN lists every one with an `open: true` flag                                     | capturing is cheap and opening costs real context. Putting the policy in the response rather than in prompt text means no prompt carries it, no session remembers it, and "did I get a screenshot here?" is answered before it is asked                      |
| **A step may carry an optional `node:` label, recorded on its shot and its reading**                                       | promotion is already defined per node, and an antagonist fetching the baseline for the node it is attacking otherwise holds a step number from a run it did not submit. Only the session knows which step reached which node                                 |
| **A baseline is fetched per NODE, by `results` against the happy walk's instance — which starts nothing**                  | "inherits a verified-clean baseline" had no mechanism behind it. And on a SAD path the baseline is the error rendered correctly, so a happy-screen baseline there reports the toast as damage and its absence as "it held"                                   |
| `pixelChange` routes ATTENTION and measures nothing; it is only interpretable against what the step was trying to do       | `0%` after a click is a defect, after a read it is correct. It cannot say whether a change was right, or where on screen it happened                                                                                                                         |
| `pixelChange` is `null` on a first capture, never `0`                                                                      | `0` would manufacture a no-change finding on the opening step of every walk                                                                                                                                                                                  |
| Every capture carries `blank`, and it is checked BEFORE `pixelChange` is interpreted                                       | two blank frames give `pixelChange: 0%`, which this design reads as "the control did nothing" — the wrong finding. The page is dead, not unresponsive, and a session handed that will go looking at the button                                               |
| A blank capture reports its COLOUR                                                                                         | blank in the app's own background means the shell rendered and the content did not; blank white means the document died or never styled. Different bugs, different places to look                                                                            |
| `blank` rides on every capture even though `health` also reports it                                                        | `health` is a reading a session asks for; `blank` fires whether or not anyone asked. Same reasoning as the geometry flags on the key                                                                                                                         |
| `pixelChange: 0%` is a strong signal; non-zero is a prompt to LOOK, never a verdict                                        | font races, rasterisation and scrollbars are outside this tool's control. Same rule as every other reading here                                                                                                                                              |
| Capture for COMPARISON runs with `animations: 'disabled'` and `caret: 'hide'`                                              | this UI animates on purpose, so two captures of one logical state are otherwise never identical and `pixelChange` is noise on every step. The byte-identity measured in `siege-verification-remainder.md` Part 2 was a STATIC screen and does not generalise |
| `hold` stays LIVE while every comparison capture is frozen                                                                 | freezing animation would make every `hold` frame identical and answer "did it settle" falsely                                                                                                                                                                |
| **Nothing in this system grades animation quality.** `hold` detects NON-SETTLEMENT, a binary                               | four frames 1.5s apart cannot distinguish a clean 300ms transition from a janky one; frame drops are invisible at that rate; a two-frame flicker falls between samples; and `video` produces a screencast no model watches                                   |
| The `video` STEP records a screencast, and that screencast is for a human and for the evidence trail — never for a verdict | when a walk reports something odd at step 9, a person can watch step 9. No step reads the video back and no model grades it. Not to be confused with a ROUND RECORD, which is the written file a walk produces                                               |

#### The service: instances, runs, batches

| Decision                                                                                                                                   | Because                                                                                                                                                                                                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| The service IS a set of MCP tools — THIRTEEN of them. What was rejected is one tool per STEP, not MCP                                      | a file drop costs ~3 calls per command; a tool per step grows the tool surface with every verb AND forces each reading through a 50,000-char result ceiling. Steps are DATA inside `run` instead: the tool surface is bounded, the step surface is open                  |
| The tool's instructions are served by a `docs` CALL, never stored in a role prompt                                                         | any session can then be told "drive it with this instead of the browser extension" and go read how; one source instead of a contract on three prompts; and a full manual inside a prompt spends the 50,000-char ceiling a call serves for free                           |
| `docs { for: … }` has ONE SCOPE PER TOOL-USING ROLE — `operating`, `planning`, `walking`, `attacking`, `fixing`, `driving`, `operational`  | a stress tester reading the naming ladder in full is context spent on something it barely touches — the same reasoning as filtering `verifyByHuman` units                                                                                                                |
| **A BROWSERLESS lane spec is a first-class spec, and the browser steps error against it BY NAME**                                          | an operational flow has no screen, and a spec is keyed by content hash, so the cheaper spec profiles itself and `capacity` allows more of them. A `look` answering an empty key instead of an error is `count: 0` where a walk cannot recover from it                    |
| **`driving` serves a session NO QUEST DISPATCHED**, and covers the machine it shares, its own `kill`, and where its evidence went          | the case for a `docs` call at all was that any session can be told to drive this instead of the browser extension. Every other scope is written for a quest role and reads as a brief the session does not have, with a record it is not writing                         |
| The `operating` scope contains NO STEP VERBS                                                                                               | the operator never submits a batch. Its whole surface is fleet management — `cleanup`, `capacity`, `status` — plus reading what a minion brings back. Handing it the driving verbs hands it the one thing its own rules forbid                                           |
| The MCP tools are thin clients over a local socket; the DRIVER holding the browsers is a separate process                                  | about lifetime, not transport: an MCP rebuild-and-reconnect would otherwise kill every live instance mid-pass                                                                                                                                                            |
| Many sessions share ONE MACHINE through a disk REGISTRY — no daemon, no master, one driver per instance                                    | a daemon owning every instance is a single point of failure for N unrelated sessions and a lifecycle problem nobody wants. This repo already answers the same question the same way: dispatch exclusivity is file-backed BECAUSE the MCP server is a separate OS process |
| Ports are CLAIMED in the registry before they are bound                                                                                    | two sessions asking the OS for a free pair in the same moment can overlap, and two instances on one port reads as a walk measuring another walk's state                                                                                                                  |
| An instance is RESERVED in the registry before it boots, and `capacity` counts reservations                                                | otherwise three sessions each divide free memory by peak, each concludes it can start two, and six boot                                                                                                                                                                  |
| `boot.lock` enforces one boot at a time ACROSS processes, released by completion or by heartbeat staleness                                 | "the tool staggers" is unenforceable between processes that cannot see each other                                                                                                                                                                                        |
| Profile samples are APPEND-ONLY; steady and peak are computed on read                                                                      | read-modify-write from three processes loses samples, and a lock for something written this often is not worth it                                                                                                                                                        |
| Reaping is by STALENESS, never by ownership — no session kills a live instance it does not own                                             | a cold heartbeat is a fact anyone can check. The operator's cleanup duty covers its own pass, not another developer's browser                                                                                                                                            |
| Assets live under the MINTED instance id                                                                                                   | unique by construction, so two instances cannot collide on a path                                                                                                                                                                                                        |
| Assets AGE OUT by default; `prune` refuses anything a `VERIFIED` prelude, an open issue or an open quest's `WALKED` line still references  | evidence outliving its instance is the point, and a disk that only grows is a failure mode already documented here                                                                                                                                                       |
| Video ages out FIRST and separately                                                                                                        | a screencast dwarfs every shot and transcript combined                                                                                                                                                                                                                   |
| **`start` NEVER prunes to make room**                                                                                                      | a start that quietly deletes another session's evidence is the worst version of this: invisible, and discovered only when someone goes to read what is gone. Report the shortage and refuse                                                                              |
| The completion status is an index, not a payload                                                                                           | otherwise every run returns everything and the cap problem returns                                                                                                                                                                                                       |
| Instance ids are minted, not chosen                                                                                                        | deletes the lane-name allocation section and its failure class                                                                                                                                                                                                           |
| An instance is a TIMELINE of runs; every `run` mints an id and every earlier run stays queryable for the RETENTION WINDOW, `kill` included | run → analyze → run is the normal loop, not an edge case. `results { step: 4 }` means nothing once a second run exists                                                                                                                                                   |
| Step numbers restart at 1 per run; screenshots are namespaced by run                                                                       | otherwise run 2 silently overwrites run 1's evidence and `stoppedAt: { step: 4 }` is ambiguous                                                                                                                                                                           |
| **Every evidence read resolves off DISK, live instance or dead. Only `start`, `run` and `kill` need a driver**                             | the tools are thin clients over a per-instance socket, and a killed instance has no driver — so a read routed there answers a bare connection error that cannot be told from a crash. One path, no branch: the alternative works all afternoon and fails for every fixer |
| **The entry to evidence is an ID CARRIED IN A RECORD. No call lists another instance's runs and nothing walks the tree**                   | a context decision before a safety one: a session handed a list of runs reads the list instead of the finding its record already holds. It makes the walker's recorded instance id load-bearing, which is a quest-record requirement rather than a habit                 |
| **Against a FINISHED instance the run id is required; `run` defaults to latest only for the session driving it**                           | a fixer's instance may hold the prelude's proving run, the walk and a re-walk, and "latest" silently reads whichever went last. A defensible default landing on the wrong thing and returning a clean-looking answer is `.first()` one layer out                         |
| **`results { instance, run }` with no `step` and no `kind` returns that run's stored return** — index, shot list, `stoppedAt`              | the index and the `open: true` flags are produced by `run`, and a fixer never made the run. Without this it has to guess which kinds to query, which is the everything-query the index exists to prevent                                                                 |
| Buffers are continuous; a run records its WINDOW, and its index counts only that window                                                    | the listeners are armed once at boot and never stop. An index counting the running total makes run 5 report 47 errors that are mostly run 1's                                                                                                                            |
| A run boundary does NOT invalidate refs — only navigation, `reset` and restart do                                                          | a `look` at the end of run 1 exists so run 2 can act on it. Invalidating per run would break the main loop                                                                                                                                                               |
| `compare { runA, runB }` is a first-class call                                                                                             | the point of a cycle is the difference between iterations. Diffing two result sets inside a session's own context is the blob problem returning by a side route. It is a READING — a computed difference between measured values                                         |
| A batch stops on first failure BY DEFAULT, overridable per step with `expect: 'error'` and per batch with `stopOn: 'never'`                | batching is the only way a sub-second race is reachable, and stopping avoids seven wasted steps after a broken one — but an adversarial step wants its failure, so the exception is per step rather than a looser batch                                                  |
| A step declares `expect: 'error'` rather than the batch loosening                                                                          | an attack wants a 400; halting there makes every attack a one-step batch. And a step expecting failure that SUCCEEDS is itself a finding                                                                                                                                 |
| Every network, console, ws and log entry carries the STEP it fell inside                                                                   | the common api-call claim is "clicking this button called this endpoint", which is a question about one step. A click reporting zero exchanges is a finding                                                                                                              |
| An acting step ends on SETTLE — network, paint and DOM quiet together — with a ceiling, not a timeout                                      | a fixed timeout is wrong both ways, and a step that hits a ceiling reports WHAT was still busy, which is actionable, where a timeout reports only that time passed                                                                                                       |
| The settle detector discounts a REPEATING request pattern                                                                                  | this app polls. A naive network-idle wait hangs on every page that has a poller, which is most of them                                                                                                                                                                   |

#### Snapshots, reset, and the state/evidence line

| Decision                                                                                                | Because                                                                                                                                                                                                           |
|---------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Snapshots are NAMED and `reset level: 'state'` takes an explicit `to`                                   | a cycle makes several; with one the target is obvious and with three it is a guess. A reset to the wrong point is the tainted-baseline failure with a different cause                                             |
| Every run auto-snapshots at start and end, namespaced `run_N:start` / `run_N:end`                       | a manual snapshot marks a point you KNEW would matter; the automatic pair covers the one you did not. Three runs later, "put it back to where run 4 began" needs no foresight — and without it that state is gone |
| **A snapshot covers the STATE subtree only. Logs, captures and the run transcript survive every reset** | the home holds both. Snapshot and restore the whole thing and you have deleted the server log that recorded the crash you are investigating. Evidence accumulates forward; only state rewinds                     |
| Reset is THREE named levels — `page`, `state`, `instance` — not one word                                | disk, server memory and browser state are cleared by different actions. A session that restores files and believes it is clean is wrong in the way that produces a confident false result                         |
| A reset reports the diff it undid                                                                       | turns "what does this not reset" from a guide-writer's guess into a measurement, and doubles as the damage check after an error branch                                                                            |

#### Teardown and crash recovery

| Decision                                                                                                              | Because                                                                                                                                                                                                            |
|-----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `kill` is mandatory and explicit                                                                                      | a session's final response does not reap an instance it did not parent. The idle timeout is a backstop, not the mechanism                                                                                          |
| Teardown is a first-class concern with its own tests, not a `finally` block                                           | every leak is invisible to the session that caused it — the walk completes, the return reads clean, three processes stay up. Under a pool of three parallel instances that compounds fast                          |
| A SIGKILLed driver cannot be handled — only recovered from, using what was written to disk BEFORE it died             | nothing of ours runs. The heartbeat file and its recorded process-group ids are the entire recovery path                                                                                                           |
| `status` is the POST-MORTEM call — `capacity` looks forward, `status` reports what is and what went wrong             | after a death a session needs the machine state, the orphans, the last step and the evidence paths in one place, not four calls and its own arithmetic                                                             |
| `status` returns `monitored` — the metric names it can answer about                                                   | without it a session guesses at names, and a guess returning nothing reads exactly like a metric that is zero. The `count: 0` problem, one layer up                                                                |
| `likelyCause` is stated as EVIDENCE, never as a verdict                                                               | "rss 2980MB against a 2600MB profile peak, kernel OOM kill at 20:11:04" is weighable; "it ran out of memory" is a claim                                                                                            |
| Kernel OOM evidence is reported when readable and `unavailable` when not — never inferred from absence                | it is platform-specific and may need privileges this process lacks. A missing kernel line is not evidence of a clean death                                                                                         |
| A death mid-run does not lose the runs before it — `results` still reaches them                                       | everything up to the failing step is on disk. That is for explaining the DEATH and for a finding the walk had already recorded in words — never for finishing the walk, which is re-dispatched on a fresh instance |
| **A reaped or pruned instance leaves a TOMBSTONE; what is gone answers as gone, never as empty**                      | `pruned at 03:14, olderThan 7d` is an answer. An empty list reads as "that step produced nothing", which is the `count: 0` ambiguity landing where it does most damage: a fixer concluding the walk saw nothing    |
| **Assets are partitioned by the GUILD owning the instance's quest; `unowned/` holds the rest**                        | deleting a guild takes its siege evidence and reaches no other guild's. The key is the quest's guild, never a guild a recipe seeded — that one is minted per run and would file every instance separately          |
| **`start` records the quest id, and that is how `prune` and `cleanup` resolve "still referenced"**                    | both refusals are asserted all through this design with no mechanism. The quest id resolves to its `.quest-plans/`, the refusal names the citing file, and an instance with no quest ages out ordinarily           |
| **Video cited by a `verifyByHuman` item is HELD until the quest closes**                                              | video otherwise ages out first and fastest, and the human-check list reaches its reader at quest end — so the general rule would rot the only link the only reader of that list ever gets                          |
| **`dungeonmaster init` creates `<repoRoot>/.siegelense` and ignores it — in git AND in the check globs**              | a shot is only evidence if the reader's `Read` reaches it, and one path shape in every repo beats a home that moves. A symlinked tree of thousands of PNGs is also something lint and test globs walk into         |
| `kill` is NOT the retention boundary — every run stays queryable for the instance's retention window, `kill` included | a fixer reads a run whose walker killed the instance before handing over the record. Tying results to `kill` would break the handoff the fixer depends on                                                          |
| Each instance keeps a HEARTBEAT FILE carrying its pid, instance id and every child's PROCESS-GROUP ID                 | after a SIGKILL nothing in memory holds those pgids, so without the file the orphans cannot be found, only guessed at                                                                                              |
| `start` and `capacity` REAP instances whose heartbeat has gone stale, and say so                                      | there is no other recovery path, and a silent reap is indistinguishable from a bug                                                                                                                                 |
| `cleanup` is an explicit call, because opportunistic reaping misses the QUIET case                                    | a pass crashes at 2am and nothing calls the tool for nine hours: nine hours of orphans holding ports with nobody to notice                                                                                         |
| `cleanup` reports `leftAlone` as well as what it reaped                                                               | a cleanup reporting only removals cannot be told from one that removed the wrong thing, and the question a session has afterwards is whether it touched anything of theirs                                         |
| The step transcript is flushed PER STEP, never buffered                                                               | a buffered transcript loses the whole run on a crash, including the steps that led to it — the part anyone would want most                                                                                         |
| Free disk is checked before `start` AND before every large write                                                      | a pre-flight check is necessary and not sufficient: the disk can fill from something this tool never started, between two steps. A half-written capture reads as a corrupt screen rather than a missing file       |
| An OOM death is NEVER auto-restarted; it is reported, and it CORRECTS THE PROFILE                                     | an instance killed for memory will be killed again, and a walk spanning two processes is not a walk. The death is evidence the spec peaks higher than the profile recorded                                         |
| A child dying is reported with WHICH child and its last log lines                                                     | that is the recoverable case and the common one — an API server that OOMs is not the same failure as a browser that crashed, and the session can act on the difference                                             |
| `kill` removes the throwaway STATE and never the evidence                                                             | a session that kills before writing its ROUND RECORD would otherwise lose the logs, captures and transcript that were the point                                                                                    |
| Teardown's test suite is the TOOL's, run once by ward — never per quest                                               | a pass that had to verify its own teardown could not trust the thing it is driving                                                                                                                                 |
| Every teardown assertion is shown FAILING against broken teardown before it is trusted                                | this repo already measured a leak-guard that passed whether or not the thing it protected was present, and proved nothing. Red first, applied to cleanup                                                           |
| The parallel case is tested explicitly: killing one of three instances leaves the other two untouched                 | it only fails under parallelism, which is the shape the two-phase pass introduces, and it is the row everyone skips                                                                                                |

#### Capacity and profiling

| Decision                                                                                                           | Because                                                                                                                                                                                                                                                            |
|--------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| "All happy walks in parallel" means a POOL, and the pool size is MEASURED, not assumed                             | "three processes per instance" is a fact about THIS repo's lane spec, not about instances. A repo with one server is cheaper, one with two is not — and adding a second server here changes the right cap the moment it lands                                      |
| An instance is PROFILED as it runs: sum the RSS of its process group, keeping STEADY and PEAK                      | peak is boot — Vite prebundling, Chromium launch — and N instances started together all hit peak at once                                                                                                                                                           |
| The profile is keyed by the lane spec's content HASH                                                               | add a process to the spec and the hash changes, the profile is stale, measurement restarts. The "I added a second server" case is handled by construction rather than by remembering                                                                               |
| With no profile, `suggested` is TWO, and that pair profiles itself                                                 | a knob, and a pragmatic default rather than a derived one: two samples instead of one, a first pass that is not needlessly serial, and almost every spec holds two on almost any machine. Getting it wrong costs slowness, which the next `capacity` call corrects |
| Phase zero IS the profiling run — one planner, alone, before any pool exists                                       | so a profile almost always exists by the time a walk asks for capacity, and the no-profile default is a safety net rather than a common path                                                                                                                       |
| A phase zero that fixes nothing still produced something: a fresh profile for today's machine                      | "no recipe needed repair" is not "nothing happened"                                                                                                                                                                                                                |
| Solo profiling is OPTIMISTIC for a contended pool, and an OOM death is what corrects it                            | page-cache pressure, fragmentation and CPU contention raise a real peak in ways a solo run never shows. The profile should record how many instances were running when each sample was taken rather than averaging the conditions                                  |
| A profile's MEMORY figures travel between machines; its TIMING figures do not                                      | peak RSS is mostly a property of the spec; boot milliseconds are a property of the disk and CPU that ran it                                                                                                                                                        |
| Starts are STAGGERED, so a pool's high-water mark is `steady × (N−1) + peak`, not `peak × N`                       | only the instance currently booting is at its peak; the rest have settled. On this repo's measured shape that is 6.2 GB for three walks instead of 7.8 GB, for free                                                                                                |
| The TOOL staggers — `start` queues, admitting one boot at a time and refusing past the pool                        | the operator never calls `start`; each minion opens its own instance. Staggering DISPATCHES instead would be guessing at when each minion gets around to booting                                                                                                   |
| A queued `start` BLOCKS and reports `queuedMs` and `aheadOfMe`                                                     | without them a 55-second start is indistinguishable from a hang, and a minion that decides the tool is broken reports a `wall` — halting a quest over a queue working as designed                                                                                  |
| Three is a POLICY ceiling — a knob, not a fact about anything                                                      | contention does not crash, it makes a page paint in eight seconds where it would take two, and the walk reports "the panel never mounted". Resource pressure manufactures false defects, the same shape a stale recipe does                                        |
| `capacity` counts load this session did not create                                                                 | a parallel agent's lanes, a ward e2e run holding a port pair, the dogfood dev server                                                                                                                                                                               |
| `capacity` returns a `why` sentence, not just numbers                                                              | a pool of two with no stated reason reads to the caller as a bug                                                                                                                                                                                                   |
| `capacity` is ADVISORY, with one hard floor: `start` refuses when the machine plainly cannot hold another instance | there the failure is the OS killing something at random, which is worse than a refusal                                                                                                                                                                             |

#### Recipes: what one is and what holds it

| Decision                                                                                                                                          | Because                                                                                                                                                                                                                                                       |
|---------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A recipe touches STATE, never a screen — held by a local lint rule, not by prose                                                                  | a recipe carrying a DOM handle is a design error, not a stale value: it means the recipe is doing a walk's job. `@dungeonmaster/local-eslint`'s `no-hardcoded-package-names` is the template — and its own blind spot is the caution to copy with it          |
| The tool is `siegelense`: `packages/siegelense/`, `dungeonmaster siegelense`, MCP tools `siegelense-*`, recipes at `packages/siegelense-recipes/` | the recipe path must be a CONVENTION because the tool enumerates them before anything is seeded. A config key is one more thing to set, get wrong and diverge on; a bare `recipes` could collide with a repo's own package, and the tool's own name cannot    |
| `packages/siegelense-recipes/` exists in EVERY repo siegelense is installed in, scaffolded by `dungeonmaster init`                                | a convention nothing creates is a convention half the repos will not have. Each package's `StartInstall` already writes what its own package needs; this is the same move                                                                                     |
| An EMPTY recipes package is a real answer where a MISSING one is not                                                                              | an empty folder says "no recipes yet"; an absent folder can only say "something is wrong", and the tool cannot tell "you have written none" from "you have not installed this". The `count: 0` ambiguity, one layer up again                                  |
| Recipes are a PACKAGE, not `.dungeonmaster-assets/`, because they are code that must be graded                                                    | being a workspace package is what gets them a ward run, and the ward run is the entire reason a recipe's test fires on the commit that breaks it. A dot-folder gets no ward, no tsconfig, no lint                                                             |
| Non-code artifacts DO go in `.dungeonmaster-assets/` — the oddities file and `captured` fixtures                                                  | the split is "does this need to compile and be graded". Prose an agent appends to does not                                                                                                                                                                    |
| `../../packages` assumes a MONOREPO — a known limit, not a settled answer                                                                         | a consumer with a flat `src/` has nowhere to put it. The package NAME is the convention; its LOCATION follows the repo's workspace layout, which dungeonmaster already detects. Staying in `../../packages` for now because the flat case has no consumer yet |
| A recipe is LISTABLE without being RUN — `produces:`, `fidelity` and `mirrors:` are static data                                                   | the listing is called before anything is seeded. One that had to execute every recipe to describe them would seed a machine just to answer a question                                                                                                         |
| It is a real workspace package, made with `dungeonmaster create-package`                                                                          | that is what gives it a ward run, which is what makes the colocated recipe tests fire on the commit that breaks them                                                                                                                                          |
| Every recipe carries a colocated integration test asserting its `produces:`                                                                       | it moves staleness from "discovered months later by whichever planner needed it" to "fails on the commit that caused it, next to the diff". The companion plan argued the same thing from the other side                                                      |
| The test owns CORRECTNESS; the planner's prelude owns FITNESS for a path                                                                          | a recipe can be perfectly correct and be the wrong recipe for path 3. And three recipes that each pass alone still fail composed. No test can know either                                                                                                     |
| A `direct` recipe's test asserts against its `mirrors:` output, not a hardcoded snapshot                                                          | a snapshot pins it to a shape somebody typed; a mirror test pins it to what production emits and fails when they diverge — which is the entire risk `direct` exists to declare                                                                                |
| Production-fidelity recipes share ONE instance for the whole suite                                                                                | one 20-second boot per recipe is a suite nobody runs. `direct` recipes need no instance at all                                                                                                                                                                |
| A recipe whose claim is about what a URL RENDERS needs a browser to assert it — the most expensive of three test costs                            | files assert with a temp dir, a route asserts with a shared server, a rendering asserts with a full instance. Narrow a claim to the cheapest tier that is still honest                                                                                        |
| A browser-asserted recipe test is DELIBERATE, because the prelude's `VERIFIED` run already covers rendering                                       | the prelude is proven by running; a recipe test that re-proves the same rendering pays twice for one fact                                                                                                                                                     |
| Recipes take their dependencies EXPLICITLY — `quest-mid-execution guild:{g.guildId}`                                                              | a recipe that silently requires a prior one is the ordering-folklore that kills a step catalogue. A parameter is the fix, and this is the guard against becoming Cucumber-with-extra-steps                                                                    |
| `fidelity` bounds the diagnosis, and a `direct` recipe must declare `mirrors:`                                                                    | the counterpart it copied is where the answer is. Without the pointer every diagnosis opens with a hunt for it                                                                                                                                                |
| A recipe never calls `Date.now()`, `Math.random()` or `randomUUID()` for anything that reaches a screen                                           | three of the four content-determinism rows reduce to this one rule, and a `fidelity: direct` recipe writing a live clock is the exact drift the marker exists to warn about                                                                                   |
| `seed` is a STEP, placed anywhere in a batch, not a prologue                                                                                      | seeding with a page already open is the only way to exercise a live-update path. A walk that always seeds up front then navigates only ever measures a fresh render                                                                                           |
| A durable, committed ODDITIES file holds driving knowledge; a round that finds a new one appends                                                  | proxies already do this for unit tests. The guide's `TRAPS` heading is the per-quest version and `.quest-plans/` is wiped, so every oddity is rediscovered at "a wrong command costs a whole round"                                                           |
| An oddity that is really an app defect gets an OBSERVABLE, not an entry                                                                           | "click the wrapper, not the label" usually means the hit area is wrong, which is a real defect for a real user. A file that only grows is a list of accepted defects                                                                                          |

---

## Part 5 — The determinism this system depends on

Most of this design works by **comparing two readings and calling the difference a finding**: the element delta on a
second `look`, `pixelChange` against the previous capture, a `health` reading against a baseline, a `reset` diff, `hold`
's frame comparison. Every one of those is only as good as the reproducibility underneath it.

**Where a value varies for a reason nothing in the walk caused, the difference reads as a defect** — and that is the
most expensive false result there is, because it arrives looking like evidence. A fixer gets briefed, goes hunting in
working code, and nothing in the record says the tool was the problem.

### What the TOOLING must guarantee

| Must be deterministic                                                                                                                                          | Why it is load-bearing                                                                                                                                                                  | What it breaks as                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| a `ref` maps to one element, for a whole page state                                                                                                            | a ref must mean one thing for the length of a walk                                                                                                                                      | ref 14 addresses two different elements in one session, silently                       |
| the key's ROW ORDER for an unchanged page                                                                                                                      | the element delta is computed against it                                                                                                                                                | `moved 2` reported on a page nothing touched                                           |
| element IDENTITY across two keys — testId + scope + nth                                                                                                        | it is what tells "moved" from "removed, then a new one added"                                                                                                                           | every diff reports churn and the signal becomes unreadable                             |
| port allocation across every session on the machine — CLAIMED in the registry before binding                                                                   | two sessions can ask the OS for a free pair in the same moment and overlap. Two instances on one port is two walks sharing a browser                                                    | a walk measuring another walk's state, which looks like a real defect                  |
| every run's results stay queryable for the instance's RETENTION WINDOW — including after `kill`                                                                | `results` is read after `run` returns, often two runs later, and often by a FIXER whose walker killed the instance before handing the record over                                       | a run id that resolves to nothing, indistinguishable from a step that produced nothing |
| evidence is APPEND-ONLY and OUTLIVES its instance — no reset at any level removes a log line, a capture or a transcript entry, and `kill` removes none of them | a walk investigating a failure resets constantly; if a reset took evidence with it the investigation would destroy its own subject. And a fixer reads a run whose instance is long gone | a record that thins out exactly when someone goes to read it                           |
| step numbering, PER RUN, restarting at 1                                                                                                                       | `stoppedAt: { step: 4 }` and `results { run, step: 4 }` must name the same thing, and an instance carries many runs                                                                     | a session reading another run's step 4 and drawing a conclusion from it                |
| an acting step ends on SETTLE, not on a clock                                                                                                                  | two runs of one batch must produce the same readings on a loaded machine and an idle one. A clock-based step reads a half-painted page under contention and a finished one otherwise    | the same batch producing different findings on different days, with nothing saying why |
| ONE BOOT AT A TIME across every session, held by `boot.lock`                                                                                                   | a profile's PEAK is sampled during boot. Two instances booting together pollute each other's sample                                                                                     | a profile that reports a peak neither instance actually has                            |
| a profile records HOW MANY instances were running when each sample was taken                                                                                   | solo samples and contended samples describe different worlds, and their average describes neither                                                                                       | `suggested` derived from a number true of no real condition                            |

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

The byte-identity measured in `siege-verification-remainder.md` Part 2 — three lanes, 46,786 bytes each — was on a
STATIC screen. It does not generalise
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
produces a file nothing grades. See Part 2. So there is no trade here, only a clarification: **every comparison capture
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

## Part 6 — The recipe book

### The tool is `siegelense`, and its recipes live beside it

**Three fixed names, and they are conventions rather than configuration:**

| Thing              | Name                                                                                                                                                         |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| the tool's package | `packages/siegelense/`                                                                                                                                       |
| the command        | `dungeonmaster siegelense`                                                                                                                                   |
| its MCP tools      | `siegelense-start`, `siegelense-run`, `siegelense-results`, `siegelense-cleanup`, … — **thirteen of them, and `look` is NOT one**: it is a step inside `run` |
| **its recipes**    | **`packages/siegelense-recipes/`** — this exact path, in every repo it runs in                                                                               |

```
packages/siegelense-recipes/
  src/
    guild-with-three-quests/
    quest-mid-execution/
    session-with-nested-subagent/
```

**`packages/siegelense-recipes/` EXISTS IN EVERY REPO siegelense is installed in.** Not "wherever a repo chooses to put
one" — that exact path, always, including a repo that has never written a recipe.

**`dungeonmaster init` scaffolds it**, which is what makes that a fact rather than an aspiration. Each package's
`StartInstall` already writes the config its own package needs; siegelense's creates the recipes package the same way. A
convention nothing creates is a convention half the repos will not have.

**And an EMPTY recipes package is a real answer where a missing one is not.** `siegelense-recipes {}`
against an empty folder returns an empty list, which says *no recipes yet*. Against a folder that does not exist it can
only say *something is wrong*, and the tool cannot tell "you have not written any"
from "you have not installed this" — the `count: 0` ambiguity this whole design keeps running into, one layer up again.

**The recipe path has to be a convention, because the tool ENUMERATES them.** `siegelense-recipes {}`
returns every name with its `produces:` and `fidelity`, before anything has been seeded. That only works if the location
is fixed — a config key is one more thing to set, get wrong, and diverge on between repos.

**Why not just `recipes`:** a repo may plausibly have a package by that name for its own reasons, and a convention that
collides is one that breaks on somebody's real code. The tool's own name makes that essentially impossible and says who
owns the folder.

**The existing prototype files keep their names.** `../../packages/web/test/siege-driver/siege-lane.ts` and its siblings
are what exists today; they are superseded rather than renamed, and Part 9 lists them as scratch. `siegemaster` is
unchanged too — that is the ROLE, and the tool is not named after one role any more, because the planner, the antagonist
and the fixer all drive it.

**Each recipe must be LISTABLE without being RUN.** `produces:`, `fidelity` and `mirrors:` are static data the tool
reads — never something it learns by executing. A listing that had to run every recipe to describe them would seed a
machine just to answer a question.

**Both are real workspace packages**, made the way every other one here is — `dungeonmaster
create-package` — so each gets its own tsconfig pair, its own jest config and its own ward run. That last part is what
makes the colocated recipe tests fire: they get graded by the command that grades everything else, on the commit that
breaks them.

**Each barrel must be SUBPATH-IMPORTABLE and must not pull msw behind it**, and this is measured rather than cautious.
`server-app.harness.ts:250` records that `@dungeonmaster/testing`'s root barrel is unreachable from server integration
tests, because importing it drags msw's ESM into a jest run that does not transform it. A recipe carries a colocated
integration test by design, so a barrel with that problem makes the recipe package's own tests unable to import it — the
one consumer it cannot afford to lose.

**In a consumer repo the folder is there and the contents are theirs.** The convention travels; the recipes do not.
Nobody else has guilds and quests, and nobody else should inherit ours.

**Why a package and not `.dungeonmaster-assets/`, which is where tooling artifacts otherwise go.**
Recipes are CODE — TypeScript importing the repo's own packages, with types and colocated integration tests. Being a
workspace package is what gets them a WARD RUN, and the ward run is the entire reason those tests fire on the commit
that breaks a recipe. A dot-folder gets no ward run, no tsconfig ownership and no lint; most tooling skips dot-folders
by default, so you would end up rebuilding package infrastructure by hand inside a directory designed to be ignored.
There is also a line worth keeping clean: `../../.dungeonmaster` and `../../.dungeonmaster-dev` hold RUNTIME DATA, and
source
sitting beside runtime state blurs it.

**Non-code artifacts do go there**, and the split is "does this need to compile and be graded":

| Artifact                                | Home                                                                                                   |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------|
| recipes                                 | the workspace package — they compile and are graded                                                    |
| the ODDITIES file                       | `.dungeonmaster-assets/` — prose an agent appends to, nothing compiles it                              |
| `fidelity: captured` fixtures           | `.dungeonmaster-assets/` — recorded data                                                               |
| profiles, the registry, instance assets | `<home>/.dungeonmaster/siegelense/` — runtime, reached from the repo through the `.siegelense` symlink |

**`../../packages` assumes a monorepo, and that is a known limit rather than a settled answer.** A consumer with a flat
`src/` has no `../../packages` to put this in, so "the same path in every repo" is already false for that class. The
resolution is that the package NAME is the convention and its LOCATION follows whatever workspace layout the repo has —
which dungeonmaster already detects through
`workspaceDiscoverBroker` and `get-project-map`. Staying in `../../packages` is the call for now because this repo is a
monorepo and the flat case has no consumer yet.

---

## Part 7 — Where to go, in order

| #   | Item                                                                                                                                                                                                                                                                                                                                                         | Why here                                                                                                                                                                                                                                                                                                                                                                       |
|-----|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1   | Gate `POST /api/tooling/smoketest/run` at registration, with an absence test                                                                                                                                                                                                                                                                                 | Independent live finding: it registers unconditionally and spawns real Claude subprocesses. `E2E_SIGNAL_BACK_HTTP`'s registration-time gate in `quest-flow.ts` is the pattern, and the lane already depends on it working                                                                                                                                                      |
| 2   | The instance service — start / run / results / kill / **capacity** / **profile** / **status** / **cleanup** / **docs**, with a status-as-index that LISTS its shots and flags which to open, **refs invalidated on navigation, reset and restart**, and RSS sampling per process group                                                                       | Everything else is a step inside it. Getting this shape wrong means rewriting every capability twice                                                                                                                                                                                                                                                                           |
| 2a  | **The evidence read path** — `results` and `status` resolving off the asset tree rather than the driver socket, assets partitioned by the quest's guild, the `.siegelense` symlink that `init` creates and ignores, and every returned path absolute and repo-local                                                                                          | it is the whole fixer handoff, and it is the half a socket-shaped service silently omits: a read routed at a dead instance's driver answers a bare connection error. Cheap while item 2 is being written, a rewrite afterwards                                                                                                                                                 |
| 2b  | **Teardown and crash recovery, with tests written red-first** — process groups, port release, home removal, evidence retention, idle-timeout reaping, the three-instance parallel case, plus the heartbeat file and stale-instance reaping that are the ONLY defence against a SIGKILLed driver                                                              | shipped with item 2, never after it. A leak is invisible to whoever caused it, and every later item adds another instance to leak                                                                                                                                                                                                                                              |
| 2c  | **Retention and its tombstones** — the quest id recorded at `start`, `prune` and `cleanup` resolving references through `.quest-plans/` and naming the citing file, a reaped entry surviving as a tombstone, and a pruned query answering `pruned` rather than `[]`                                                                                          | evidence a fixer cannot find is evidence nobody kept. Both refusal rules are asserted all through this design with no mechanism behind them, and an empty answer where evidence was reclaimed is read as "the walk saw nothing"                                                                                                                                                |
| 3   | The recipe book — free the HTTP-only harnesses, expose the already-free ones by name, add `produces:` and `fidelity`, make them listable                                                                                                                                                                                                                     |
| 3a  | Recipe integration tests — each asserts its own `produces:`; `direct` ones assert against their `mirrors:`; production ones share one instance                                                                                                                                                                                                               | staleness caught on the commit that caused it rather than by whichever planner next needed the recipe                                                                                                                                                                                                                                                                          |
| 3b  | The PLANNER role — maps paths to recipes and proves every prelude by running it; **dispatches for both research and diagnosis so it reads almost no implementation**                                                                                                                                                                                         | the operator cannot do it at all (it drives nothing), and a planner that read code for every recipe would spend the context its remaining paths need                                                                                                                                                                                                                           | Nothing downstream can be exercised against a state nobody can create, and roughly half the harness tree is already a seeder or one transport swap from being one |
| 4   | A transcript of every step and reading, written by the instance                                                                                                                                                                                                                                                                                              | ~20 lines, no design decisions, and it makes a fixer's quoted symptom block machine-written instead of retyped from memory                                                                                                                                                                                                                                                     |
| 4b  | **The record's `WALKED` field** — the instance id and run id against every path walked and every attack run, clean ones included                                                                                                                                                                                                                             | it is the proof the path was driven rather than claimed, and the only handle on that walk's evidence. Spec-side work: a quest-contract change, not tooling. See `siege-verification-remainder.md` Part 4                                                                                                                                                                       |
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

## Part 8 — The surface, consolidated

Parts 1 and 2 say WHY each of these exists. This is the lookup table. Status is against what sits in
`../../packages/web/test/siege-driver` today.

### The rule that governs every targeting step

**Nothing ever silently picks a match. Ambiguity is an ERROR.**

`siege-command.ts` currently calls `.first()` in `click`, `type`, `waitFor`, `paste` and
`screenshot`. The reading carries `count`, so the information is technically present — but the action lands on match one
and nothing flags it. That is how a session clicks BROWSE while meaning CREATE and gets a clean-looking result back.

Every targeting step has exactly three outcomes:

```
click { target: '[data-testid="subagent-chain-duration"]' }
→ one match. Proceeds.
```

```
click { target: '[data-testid="PIXEL_BTN"]' }
→ ERROR  AMBIGUOUS: 2 elements match.
     ref 16   PIXEL_BTN  under GUILD_LIST           "+"   (444,348) 27x25
     ref 23   PIXEL_BTN  under GUILD_SESSION_LIST   "+"   (965,348) 27x25
   Pick one by ref, or narrow with `within`.
```

```
click { target: '[data-testid="GUILD_ADD"]' }
→ ERROR  NO MATCH: 0 elements.
   Nearest names on this page: GUILD_LIST, GUILD_ITEM_f52cd…, PIXEL_BTN.
   Run `look` for the current key.
```

**The error carries the disambiguation.** It is not "ambiguous, go and work it out" — it hands back the candidates with
their refs, so recovery is one step rather than a hunt. A zero-match error names the near misses for the same reason,
because a misremembered testId is the common case.

A `ref` can never be ambiguous: it binds to one element. It answers `stale` when that element has detached, which is a
real answer and not a silent miss.

### Holding the no-pick rule mechanically

Prose does not hold this one. The `.first()` calls live in `siege-command.ts` today and read as perfectly reasonable
code — `page.locator(target).first().click()` is the obvious line to write, and it is what a session will write again.

**Two layers, and each covers what the other cannot:**

**A local lint rule over the command implementations.** `.first()` and `.last()` on a locator are never legitimate
there: both mean "resolve an ambiguity the caller did not resolve", which is the whole defect. `.nth()` is allowed only
where its argument comes from caller input, because `nth` is a naming-ladder rung a caller may legitimately ask for —
`.nth(0)` written as a literal is `.first()`
with extra steps.

**State the rule's scope in its own message**, per the caution recorded in `siegelense-recipes.md`: this repo already
has a rule that
looks broader than it is, and a rule people over-trust is worse than none.

**What lint cannot reach, and must therefore go in the package's `../../CLAUDE.md`:** `querySelector`
inside a page-eval source string. It silently returns the first match — the identical failure — but it lives inside a
template literal, and a rule inspecting string contents is fragile enough to be its own liability. The key builder
already uses `querySelectorAll` for exactly this reason.

### Refs are for DRIVING. Selectors are for RECORDING.

**A ref is ephemeral and must never be stored.** It is produced by one `look` against one page state. The moment the
page changes it may point at nothing — or, worse, at something else.

| Handle                        | Durable?        | Comes from                                 | Use it for                                                |
|-------------------------------|-----------------|--------------------------------------------|-----------------------------------------------------------|
| testId, plus a `within` scope | **yes**         | the spec, or a `look` you transcribe       | anything saved, re-run, briefed, or written into a record |
| `ref`                         | **no**          | a `look` on this instance, this page state | driving, right now, in this session                       |
| position or `nth`             | no, and fragile | a `look`                                   | last resort, never saved                                  |

**A ref is scoped to ONE INSTANCE, and inside it to one page state.** The instance holds the element handles, so the
instance is the only thing in the system that can resolve a ref at all. Nothing outside it has anything to look one up
in.

That is the real rule, and it is stronger than "do not write refs down". A ref in a guide is not wrong because the guide
is durable — `.quest-plans/` is wiped when the quest ends anyway. It is wrong because **nobody who reads that guide is
holding the instance that minted it.**

**Four boundaries a ref cannot cross, and every one of them looks like it should work:**

| Boundary                        | Why the ref dies                                                              |
|---------------------------------|-------------------------------------------------------------------------------|
| minion → its parent             | siegemaster owns no instance. It drives nothing, by its own tool block        |
| parent → a fixer                | a fixer edits code and never starts an instance at all                        |
| a walk → its re-walk            | step 7 sends a FRESH session to a FRESH instance. Same path, new handles      |
| happy phase → adversarial phase | different instances by design, because the attacker corrupts what it is given |

**So a promoted baseline carries SHOTS and SELECTORS, never the key's refs.** Pixels compare across instances —
measured, byte-identical — and a testId plus a `within` scope means the same thing in any of them. A ref means nothing
in the instance that inherits it, and the inheriting session has no way to tell that apart from a ref that resolves.

**Never put a ref in:** a saved batch, a re-walk, a guide, a brief to another session, a round record, a fixer's
`SYMPTOM` block, a sign-off's evidence, a promoted baseline, or a recipe. A recipe writes files and calls APIs and has
no business holding a DOM handle at all.

**The failure this prevents is the one just banned, coming back through a side door.** A stored batch carrying `ref: 14`
does not throw — ref 14 may legitimately exist and point at a different element — so it drives the wrong thing and
returns a clean-looking result. That is `.first()` again, wearing a number.

Two rules keep it loud:

- **A ref binds to an ELEMENT, not to a row number.** Recomputing a listing must not renumber what is still there.
- **Navigation, `reset` and an instance restart all invalidate every ref.** A ref used after one of those answers
  `stale` — never a different element.

**The spec convention is what makes this affordable.** Observables here are authored with their testIds —
`#dd-placement` on the trial's quest literally reads "Its own element on the right, test id subagent-chain-duration" —
so a durable walk already has stable handles. The ref is a shortcut for the live session, not a replacement for them.

### The package needs a `../../CLAUDE.md`, and these are the entries

`../../packages/orchestrator/CLAUDE.md` and `../../packages/web/CLAUDE.md` are the pattern — package invariants with the
measurement
behind each one. This package needs the same. **The entries below are the rules above this line, compressed into the
form a session editing the package will actually read**, plus the two that live nowhere else:

| Entry                                                                                                                         | Why it earns a line                                                                                                                                                                                    |
|-------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Never `.first()` / `.last()` in a command. Ambiguity THROWS, and the error carries the candidates**                         | the obvious line to write is the wrong one, and the lint rule's message should point here                                                                                                              |
| **Never `querySelector` in eval source — `querySelectorAll` and count**                                                       | singular silently returns match one; lint cannot see inside the template literal                                                                                                                       |
| **A command returns a READING, never a verdict on a unit**                                                                    | the founding rule from `siege-command.ts`'s own header. Comparing two measured values is a reading; deciding a unit passes is not                                                                      |
| **The key reads OWN text nodes, never `textContent`**                                                                         | recursive text pulled an entire Mantine stylesheet into one reading. This is the single measured reason the old `dom` verb was unusable                                                                |
| **A ref resolves only in its minting instance and page state**                                                                | four boundaries look passable and none are; see the ref rule below                                                                                                                                     |
| **A recipe touches state, never a screen**                                                                                    | a recipe holding a DOM handle is doing a walk's job                                                                                                                                                    |
| **`run` returns a status; `results` returns payloads**                                                                        | collapsing them walks back into the 50,000-char ceiling the service exists to route around                                                                                                             |
| **Kill the process GROUP, not the child — and skip the signal for one that already exited**                                   | `npm run` is a wrapper; the listener is a grandchild via `sh -c`. And signalling a dead child logs `kill ESRCH` on every clean teardown, which reads as a failure in the one log a later session opens |
| **`kill` removes the throwaway home and never the evidence directory**                                                        | logs, captures and the transcript are evidence and outlive the instance                                                                                                                                |
| **Evidence reads go to DISK, never down the driver socket — `start`, `run` and `kill` are the only calls that need a driver** | a killed instance has no driver, and a fixer reading one is the normal case rather than the edge. Routing a read at the socket answers a bare connection error, which cannot be told from a crash      |
| **Every path handed back is repo-local, through `<repoRoot>/.siegelense`**                                                    | a shot is only evidence if the reader's `Read` reaches it. Same reason `npm run prod` keeps its home inside this repo                                                                                  |
| **`dev:no-watch`, never `dev`, for the lane's API server**                                                                    | `--conditions=source` puts every `packages/*/src` file in the watcher's graph; one save anywhere restarts the server and Vite's `/api` proxy answers with a bare 500 for ~1.5s                         |

---

### The thirteen calls

**Every tool below is registered as `siegelense-<name>`** — `siegelense-start`, `siegelense-run`, and so on. The
examples drop the prefix for readability; there is no bare `start` tool. **Steps are not tools**: `look`, `click`,
`health` and the rest are values inside `run`'s `steps` array, which is the whole point of the bounded-tool-surface
decision in Part 1.

**Only `start`, `run` and `kill` need a live instance.** The other ten read the asset tree, the registry or the machine,
so a session that only wants to read a finished walk starts nothing and holds no pool slot. Part 1 has the table.

**`start`** — stands up an instance and hands back its id.

```
start { spec: 'dungeonmaster-web', seed: 'guild-with-three-quests',
        quest: '1dac5395-c828-4472-868c-d4a3425e43a0' }
→ { instance: 'inst_7f3a', baseUrl: 'http://…:34173', home: '/tmp/dm-siege-…',
    evidence: '<repoRoot>/.siegelense/guilds/<guildId>/instances/inst_7f3a/',
    logs: { api: '…/api-server.log', web: '…/web-server.log' },
    seeded: { guildSlug: 'siege-1', guildId: '7306b468-…' } }
```

**`quest` is optional and decides two things.** It files the instance's evidence under that quest's guild, and it is how
`prune` and `cleanup` later discover the evidence is still referenced. Omit it — a session nobody orchestrated, a
developer driving by hand — and the instance files under `unowned/` and ages out on the ordinary window.

**A BROWSERLESS spec is just another spec, and the profile prices it on its own.** An operational flow has no screen to
drive, so its instance wants the servers and no Chromium — and because a profile is keyed by the spec's content hash,
that spec measures its own steady and peak, and `capacity` allows more of them in a pool. Nothing special is needed for
this: it is the "I added a second server" case running in the other direction.

```
start { spec: 'dungeonmaster-headless', quest: '1dac5395…' }
```

**Only the browser steps go missing with it, and they go missing LOUDLY.** A `look`, a `click` or a `hold` submitted
against a browserless instance is an error naming the spec, never an empty key — a reading that quietly returns nothing
is the `count: 0` problem arriving at the one place a walk cannot recover from it.

**The `guildId` in `seeded` is NOT the one in the path.** The seeded guild lives in the throwaway home and is minted per
run; the partition guild is the one that owns `quest`. Keying assets by the seeded id would file every instance under a
partition of its own and defeat the point.

**`evidence` is what a session with no record works from.** Everything `results` returns lives under it, and after the
instance is gone that directory is still there and still readable. There is no LOOKUP call to recover it later, so a
path a person will want tomorrow belongs in what the session writes down today.

**`recipes`** — what states can be created. No instance needed.

```
recipes {}
→ session-with-nested-subagent   produces: one session transcript holding an outer sub-agent
                                 chain with one chain nested inside it, both finished
                                 fidelity: direct
  guild-with-three-quests        produces: one guild holding three quests, one in_progress
                                 fidelity: production
```

**`run`** — submit a batch. Blocks. Returns a status, never a payload. See the worked example below.

**`results`** — query narrowly, after a run. **Starts nothing, and answers for an instance that is long dead.**

```
results { instance: 'inst_7f3a', run: 'run_2' }                     // the run's own return: index, shots, stoppedAt
results { instance: 'inst_7f3a', run: 'run_2', step: 4 }
results { instance: 'inst_7f3a', run: 'run_2', kind: 'network', where: { path: '/api/quests', method: 'POST' } }
results { instance: 'inst_7f3a', run: 'run_1', kind: 'server', where: { level: 'error', steps: '4-9' } }
results { instance: 'inst_7f3a', kind: 'console', since: 'boot' }   // the whole timeline, not one run
```

**With no `step` and no `kind` it returns the RUN's stored return** — the same index, shot list and `stoppedAt` that
`run` handed the session that submitted it. A fixer never made the run, so without this its first move is guessing which
kinds to query, which is the query-everything the index exists to prevent.

**`run` defaults to the latest ONLY while you are the session driving that instance.** There it is the common case, and
naming an earlier run explicitly is how you go back for the exchange that explains what you are now seeing. **Against a
finished instance the run id is required and `results` refuses to guess**, because that instance may hold the prelude's
proving run, the walk and a re-walk, and "latest" would silently read whichever went last. The one other way to omit it
is `since: 'boot'`, which asks for the whole timeline deliberately rather than landing on one run by default.

**Every answer carries `instanceState`**, so a reading is never mistaken for a live one:

| `instanceState` | Means                                                                                                     |
|-----------------|-----------------------------------------------------------------------------------------------------------|
| `alive`         | the driver is up and the buffers are still filling                                                        |
| `killed`        | torn down cleanly. The evidence is complete                                                               |
| `dead`          | the heartbeat stopped. The transcript ends at the last flushed step; after that is ABSENT, not uneventful |
| `pruned`        | the assets were reclaimed. The answer says when and by which rule, and returns no rows                    |
| `unknown`       | no instance by that id, ever. A mistyped or misremembered id, not a walk that found nothing               |

**`pruned` and `unknown` are real answers, not empty results.** A query that lands on reclaimed evidence and returns
`[]` reads as "that step produced nothing", which is the one conclusion a fixer must never draw from a missing file —
and a bad id answering the same way sends it looking at the app instead of at its own record.

**`docs`** — the tool's own instructions. **This is how a session learns to use it, not the prompt.**

```
docs {}                      → the whole surface
docs { for: 'operating' }    → cleanup, capacity, status, reaping rules, reading a minion's return
docs { for: 'planning' }     → recipes, preludes, profiles, capacity, proving a prelude
docs { for: 'walking' }      → goto/click/look/until, the reading rules, and the LADDER:
                               key first, `dom` last and narrow
docs { for: 'attacking' }    → health, reset levels, expect:'error', baselines
docs { for: 'fixing' }       → reading a finished run without starting anything, re-running a prelude,
                               and calling a recipe from an e2e
docs { for: 'driving' }      → the same surface for a session no quest dispatched: capacity, start, run,
                               the reading steps, kill, and where its own evidence went
docs { for: 'operational' }  → a flow with no screen: request, file, until{file}, storage,
                               results{kind:'server'}, and the browserless lane spec
```

**One scope per tool-using role**, and `operating` is the odd one out in a way worth stating: **it contains no step
verbs at all.** The operator never submits a batch. Its whole surface is fleet management — `cleanup` at both ends of
the pass, `capacity` before opening a pool, `status`
after something dies — plus how to read what a minion brings back. Handing it the driving verbs would be handing it the
one thing its own rules forbid.

**`siegemaster-reader` gets no scope, and that absence is the point.** It opens source files so no walker has to, calls
no tool here, starts no instance and holds no pool slot. A role that never touches the tool needs no page of its
instructions — and handing it one would be handing a code-reading session the vocabulary for driving a browser.

**`driving` is the scope for a session nobody orchestrated, and it exists because this design already promised it.** The
argument for serving the instructions from a call rather than a prompt was that "go drive the app with the siege tool
instead of the browser extension" becomes a usable instruction to a session outside any quest. That promise is empty if
every scope is written for a quest role — `walking` reads as a verifier's brief, with sign-offs, units and a round
record attached, none of which such a session has.

**What `driving` says that no other scope does:**

| It must say                                                              | Or else                                                                                                                                                           |
|--------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| you are sharing this machine — read `capacity` first, and `start` queues | it opens three instances beside a running pass and the pass measures its pressure                                                                                 |
| `kill` is yours to call and nothing else will                            | no dispatcher is watching, so its instance leaks until the idle timeout or someone's `cleanup`                                                                    |
| where its evidence went — `start` returns the id and the directory       | it holds both for its whole life. What it does not get is a LOOKUP, so anything a person wants tomorrow goes into what the session writes, not left in scrollback |
| your instance is `unowned/` — no quest protects it from ageing out       | it comes back next week for a shot that was reclaimed on the ordinary window                                                                                      |
| `cleanup` is safe for you to run and will not touch anyone's live work   | either it never reaps and orphans accumulate, or it reaches for something blunter                                                                                 |

**Why a call and not prompt text**, for three reasons that each cost something:

- **Any session can fetch it.** "Go drive the app with the siege tool instead of the browser extension" becomes a usable
  instruction to a session nobody orchestrated, because it can go and read how. Today that knowledge only exists inside
  a role prompt.
- **One source.** A prompt copy is a contract on every prompt that holds it — the orchestrator's own rule — so a new
  verb means editing the verifier's prompt, the stress tester's, the planner's, and agreeing them. A call means editing
  the tool.
- **The prompt has a hard ceiling.** `mcpToolResultStatics.maxVerbatimChars` is 50,000 and a served prompt over it is
  spilled to a file with an error stub handed back. A full tool manual inside siegemaster's prompt spends that budget on
  something a call serves for free.

**`for:` scopes it, because the whole surface is not every reader's business.** A stress tester reading the naming
ladder in full is context spent on something it barely touches — the same
"do not hand an agent what it cannot act on" reasoning behind filtering `verifyByHuman` units.

**`prune`** — reclaim asset space deliberately, rather than waiting for the age-out window.

```
prune { olderThan: '7d' }                    → everything past the window
prune { instance: 'inst_9b2c' }              → one instance's assets
prune { kind: 'video', olderThan: '2d' }     → video first, it dwarfs everything else
→ { freedMB: 4100, removed: [ … ],
    refused: [ { id: 'inst_1d09',
                 why: 'run_7 cited by a VERIFIED prelude in .quest-plans/1dac5395…/path-3.md' } ] }
```

**It refuses rather than warns.** Anything a `VERIFIED` prelude, an open issue record or an open quest's `WALKED` line
still points at stays, and the
refusal is named — a prune that quietly took the evidence a fixer was about to read is the failure this whole retention
section exists to prevent.

**The refusal NAMES THE CITING FILE, which is also how the rule is checkable.** "Referenced by a prelude" is a claim; a
path and a run id is something the caller can open. The reference itself is resolved through the quest id `start`
recorded, so an instance with no quest has nothing citing it and no protection — the `unowned` case, working as intended
rather than falling through.

Distinct from `cleanup`, which acts on STALE INSTANCES and ages assets as a side effect. `prune` acts on ASSETS and
touches no instance.

**`cleanup`** — reap stale instances and age out assets. **The operator calls this at the START and END of its pass.**

```
cleanup {}
→ { reaped: [ … ], portsReleased: [ … ], lockReleased: true,
    assetsAged: { instances: 3, freedMB: 1840 },
    leftAlone: [ { id: 'inst_7f3a', why: 'live — last beat 2s ago' } ] }
```

Acts on STALENESS only — never kills a live instance, never prunes evidence a `VERIFIED` prelude, an open issue or an
open quest's `WALKED` line references. Safe to run at any moment, including mid-pass. `leftAlone` is part of the answer:
a cleanup reporting only
what it removed cannot be told from one that removed the wrong thing.

**`compare`** — the index delta between two runs. A READING: a computed difference between measured values, never a
verdict.

```
compare { instance: 'inst_7f3a', runA: 'run_4', runB: 'run_5' }
→ { console: { errors: '+2', new: ['Cannot read properties of null'] },
    network: { non2xx: '+1', new: ['POST /api/guilds 500'] },
    elements: '+0 -3 under GUILD_LIST',
    pixels:  'last capture differs 12%' }
```

**`snapshots`** — what points `reset level: 'state'` can return to.

```
snapshots { instance: 'inst_7f3a' }
→ [ { name: 'clean',        at: '20:03:11', manual: true },
    { name: 'run_4:start',  at: '20:07:02', manual: false },
    { name: 'run_4:end',    at: '20:09:40', manual: false } ]
```

Manual names and the automatic `run_N:start` / `run_N:end` pair. A `reset` naming one that does not exist is an error,
never a fall-back to the nearest.

**`status`** — what IS, including what went wrong. The post-mortem counterpart to `capacity`.

```
status {}                      → the machine, every instance alive or dead, and what is monitored
status { instance: 'inst_9b2c' } → one instance: last beat, last step, orphans, evidence, likely cause
```

**`status {}` lists instances and their state. It never lists their RUNS and never lists their evidence** — those appear
only when you name an instance you already hold the id for. That is the no-browsing rule: fleet state is what an
operator needs to decide whether to reap or to dispatch, and a list of runs is what a session reads instead of reading
its own record.

**A reaped entry survives as a tombstone for as long as its evidence does.** Otherwise `cleanup` — which any session may
run, at any moment — would make a fixer's first call answer "unknown instance" for a walk whose shots are sitting on
disk.

Returns `monitored` (the metric names, so a session does not guess at them), `machine` (memory, disk, load, kernel OOM
events where readable), and an entry per instance. A dead one carries its last heartbeat, the last STEP it ran, its RSS
at that moment, its surviving orphan pgids, the paths to what it left behind, and a `likelyCause` stated as evidence
rather than as a verdict.

**`capacity`** — what this machine can take right now. Ask before opening a pool.

```
capacity {}
→ { suggested: 2, ceiling: 3,
    why: 'profile 2.6GB peak; free RAM 5.2GB less headroom; 1 siege instance already up',
    measured: { freeMemMB: 5320, cores: 8, loadAvg1: 4.2, siegeInstances: 1, diskFreeMB: 41000 },
    profile:  { spec: 'dungeonmaster-web', steadyMB: 1800, peakMB: 2600, fromRuns: 14 } }
```

`suggested` comes from a MEASURED profile of what one instance of this spec costs, not from a number anyone typed — so a
spec that grows a second server re-measures instead of being wrong. With no profile yet it answers `2`, and that pair
profiles itself. Counts instances this session did not start. Advisory, except that `start` refuses outright when the
machine plainly cannot hold another.

**`profile`** — what one instance of a spec costs. Read it, or let `capacity` read it for you.

```
profile { spec: 'dungeonmaster-web' }
→ { processes: 3, hash: '7f3a…', measuredAt: '2026-09-14', fromRuns: 14, bootMs: 20000,
    samples: [ { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
               { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 } ] }
```

**Samples are grouped by POOL SIZE, never averaged across them.** A solo sample and a contended one describe different
worlds; `capacity` reads the group matching the pool it is about to open. Memory figures here are illustrative — see
Part 3.

**`kill`** — tear it down. Replaces `end`.

```
kill { instance: 'inst_7f3a' }
→ { stopped: true, ports: 'released' }
```

---

### Steps that exist today and are kept

All keep their behaviour except that ambiguity now throws.

```jsonc
{ step: 'goto',       path: '/siege-1/session/sess-nested' }
{ step: 'waitFor',    target: '[data-testid="SUBAGENT_CHAIN"]', state: 'visible' }
{ step: 'look' }                       // ← every ref below came from HERE, and dies on the next navigation
{ step: 'click',      ref: 23 }
{ step: 'type',       ref: 14, value: 'guild-alpha' }
{ step: 'key',        press: 'ControlOrMeta+V' }
{ step: 'paste',      ref: 14, filePath: '/tmp/fixture.png' }
{ step: 'box',        ref: 26 }
{ step: 'screenshot', name: 'after-create.png' }
{ step: 'dom',        target: '[data-testid="subagent-chain-duration"]', fields: ['text', 'rect'] }
{ step: 'storage',    prefix: 'dm-' }
{ step: 'eval',       source: 'document.title' }
{ step: 'file',       path: 'guilds/<id>/quests/<id>/quest.json' }
```

**A ref is only meaningful after the `look` that minted it, in the same page state.** A step that must survive being
saved or re-run takes a `target` and a `within`, never a ref — see the rule above.

**`dom` is the escape hatch and is LAST on the ladder.** It keeps its behaviour and gains three guards: own text unless
`text: 'full'` is asked for, a `fields:` projection, and a match cap that reports the true `count` beside what it
showed. Part 2 has the ladder and the case for each rung; `docs { for: 'walking' }` serves it to a session.

`console`, `network` and `ws` remain available as steps for the case where a batch must gate on one, but are primarily
results queries now. `end` becomes the instance-level `kill`.

---

### Steps that are new

**`look`** — addressing. Returns the KEY inline and writes the SHOT, returning its path. **The MAP is optional and ships
later** — `look { map: true }` requests it once it exists, and until then the field is simply absent rather than empty.
Part 7 defers it deliberately: the one trial arm that had a map rendered three and opened none.

```
{ step: 'look' }
{ step: 'look', within: 'SUBAGENT_CHAIN_HEADER' }
→ key:  24   SUBAGENT_CHAIN_HEADER
        25     (p)  "▾ SUB-AGENT"
        26     (p)  "Finished sub-agent (1 entries)"
        27     subagent-chain-duration  "4m"
  shot: shots/step4.png      ← Read this to SEE the page
  map:  shots/step4-map.png  ← only when `map: true` was asked for AND the map has shipped
```

**`before`** — runs a script ahead of the page's own. The substrate for every other injection.

```
{ step: 'before', source: 'window.__intervals=[];const o=setInterval;setInterval=(...a)=>{window.__intervals.push(a[1]);return o(...a)}' }
```

**`health`** — one reading, one verdict line. The stress tester's counterpart to the key.

```
{ step: 'health' }
→ HEALTHY   root present · not blank · console clean · no 5xx · server log clean
→ DEGRADED  root present · console: 1 error "Cannot read properties of null"
→ DOWN      root absent · page blank (#0d0907) · server log: 3 errors since step 4
```

Blankness appears here AND on every capture's `blank` field, deliberately: this is the asked-for reading, that one fires
unasked.

**`reset`** — takes a level, reports the diff it undid.

```
{ step: 'reset', level: 'page' }
{ step: 'reset', level: 'state', to: 'clean' }
→ { restored: 'clean', undid: { files: 4, added: 2, modified: 1, removed: 1 },
    NOT_cleared: ['server memory', 'open websockets'] }
{ step: 'reset', level: 'instance', reseed: 'guild-with-three-quests' }
```

**`level: 'state'` takes an explicit `to`.** With one snapshot the target is obvious and with three it is a guess — and
a reset to the wrong point is the tainted-baseline failure with a different cause:
every measurement after it is against a state nobody intended.

**`snapshot`** — marks a point `reset` can return to. NAMED, because a cycle makes several, and placeable anywhere in a
batch.

```
{ step: 'snapshot', as: 'clean' }
{ step: 'snapshot', as: 'after-cycle-1' }
```

**Every run also snapshots automatically, at start and at end**, namespaced so an explicit name can never collide:

```
run_4:start    run_4:end    run_5:start    run_5:end
```

**The manual and automatic ones answer different questions.** A manual snapshot marks a point you KNEW would matter. The
automatic pair covers the point you did not — three runs later, "put it back to where run 4 began" needs no foresight,
and without it that state is gone. It costs a copy at each run boundary and buys the ability to go back to any of them.

`snapshots { instance }` lists what exists. A `reset` naming one that does not exist is an error, not a silent fall-back
to the nearest.

**This mirrors the capture policy deliberately:** every run opens and closes with a shot AND with a state snapshot. One
says what the screen looked like at each boundary, the other lets you return to it.

**Retention is a knob, not a given.** Twenty runs means forty automatic snapshots. For a throwaway home that is usually
fine; where it is not, keep the most recent N plus every manually named one — a manual name is a statement that the
point matters.

**`seed`** — runs a recipe against this instance and returns the ids it made.

```
{ step: 'seed', recipe: 'session-with-nested-subagent', as: 'seeded' }
→ { guildSlug: 'siege-1', sessions: { nested: '/siege-1/session/sess-nested' } }
```

**`until`** — wait on something other than a locator state.

```
{ step: 'until', response: { method: 'POST', path: '/api/quests' }, timeoutMs: 15000 }
{ step: 'until', file: 'guilds/<id>/quests/<id>/quest.json', timeoutMs: 10000 }
{ step: 'until', predicate: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length === 3' }
{ step: 'until', console: /hydrated/ }
```

**`hold`** — N frames at an interval, reporting which differ. Detects NON-SETTLEMENT, never motion quality. Runs LIVE,
unlike every comparison capture.

```
{ step: 'hold', frames: 4, everyMs: 1500 }
→ { frames: 4, differing: 0, verdict: 'NOTHING CHANGED across 4.5s', shots: [...] }
→ { frames: 4, differing: 3, verdict: 'still changing at 4.5s',      shots: [...] }
```

Both verdicts are findings and neither is an opinion: nothing changed after a click is the no-feedback case, and still
changing after seconds is the stuck-loader case.

**`video`** — a screencast across a batch, for a HUMAN to watch and for the evidence trail. No step reads it back and no
verdict is taken from it.

```
{ step: 'video', action: 'start' }   …steps…   { step: 'video', action: 'stop' }
```

**`request`** — the curl surface, inside the evidence trail.

```
{ step: 'request', method: 'POST', path: '/api/guilds', body: { name: 'x', path: '/tmp/x' } }
```

**`resize`** — one viewport is the only one anything has ever been walked at.

```
{ step: 'resize', width: 1280, height: 1024 }
```

---

### Results queries

`console` · `network` · `ws` · `server` (the server logs — the thing nothing surfaces today) ·
`screenshots` · `steps`

**`steps` is the transcript** — every step with its verb, its arguments and its reading, flushed as it ran. **A step's
own reading is reached by `step: N` with no `kind`**, and for a `look` that reading IS the key as it stood at that
moment. So "the key at step 4" is not a file anyone has to keep a path to; it is a query, and the run id plus the step
number is what it takes. The same goes for the server log window and the wire: a walker records the run and the step,
never a log excerpt it copied by hand.

These accumulate during a batch and are READ afterwards. `network` is both LISTABLE and QUERYABLE, because it currently
returns every exchange since boot behind a substring filter:

```
results { instance, run: 'run_2', kind: 'network' }                        // list the window
results { instance, run: 'run_2', kind: 'network',
          where: { path: '/api/quests', method: 'POST', nth: 1 },
          fields: ['status', 'requestBody', 'responseBody'] }              // one exchange, projected
```

**Per-STEP attribution is what most api-call observables actually need.** The common claim is not
"this request happened during the run" — it is *"clicking this button called this endpoint and got this back"*. That is
a question about ONE step:

```
results { instance, run: 'run_2', step: 4, kind: 'network' }
→ step 4 was: click ref 23
  POST /api/guilds   201   req {"name":"x","path":"/tmp/x"}   res {"id":"7306b468…"}
  GET  /api/guilds   200   res [ … ]
```

So every exchange carries the step it fell inside, and a step's reading can report its own exchange count without anyone
querying. **A click reporting zero exchanges is a finding** in exactly the way
`+0 -0 moved 0` is — the control did nothing, measured rather than inferred.

The same attribution applies to `console`, `ws` and `server`: which step was running when the error fired is usually the
whole question.

---

### What every acting step returns, on top of its own reading

| Field         | Why                                                                                    |
|---------------|----------------------------------------------------------------------------------------|
| `shot`        | capturing is cheap, opening is not. The trail is complete whether or not anyone looked |
| `pixelChange` | one number against the previous capture                                                |
| `elements`    | `+7 under GUILD_ADD_MODAL, -0, moved 2` — a delta, not a fresh key                     |

`+0 -0 moved 0` beside `pixelChange: 0%` is a control that did nothing — a defect reported rather than one a session had
to notice unaided.

---

### A worked batch

This is the call a session actually makes. One `run`, five steps, one turn.

```jsonc
run {
  instance: 'inst_7f3a',
  stopOn: 'error',              // 'error' | 'never' — stop at the first failure, or push through
  steps: [
    { step: 'seed',  recipe: 'session-with-nested-subagent', as: 'seeded' },
    { step: 'goto',  path: '{seeded.sessions.nested}' },
    { step: 'until', visible: '[data-testid="SUBAGENT_CHAIN"]', timeoutMs: 20000 },
    { step: 'look',  within: 'SUBAGENT_CHAIN' },
    { step: 'dom',   target: '[data-testid="subagent-chain-duration"]' },
  ],
}
```

**`as` names a step's output; `{name.field}` reads it back.** A seed mints runtime ids that no file contains, so later
steps must be able to reference them without a round trip to the model.

**`stopOn` and the step that is SUPPOSED to fail.** `stopOn: 'error'` is the default and the right one for a walk: seven
steps after a broken step three are wasted work. But an adversarial step wants failure — sending a hostile payload and
getting a 400 IS the pass — and halting the batch there would make every attack a one-step batch.

So a step declares its own expectation, rather than the batch loosening for all of them:

```jsonc
{ step: 'request', method: 'POST', path: '/api/guilds', body: { name: null }, expect: 'error' }
```

`expect: 'error'` means a failure here is the outcome under test: the batch records it and carries on. **A step carrying
`expect: 'error'` that SUCCEEDS is itself a finding** — the attack landed and nothing refused it — and it stops the
batch exactly as an unexpected failure would.

`stopOn: 'never'` stays available for a sweep that wants every step attempted whatever happens, and is the wrong default
for anything measuring a path.

### A FIXER reading a finished instance

**A fixer arrives after the walk is over and the instance is gone.** Its record carries an instance id, a run id, a
failing step, the prelude and the evidence paths — and **steps 1 to 4 below start nothing**. They read the asset tree
and the registry, cost no boot and no pool slot, and answer exactly as well for an instance killed an hour ago as for
one still running. The first thing that needs a live instance is step 5, which is the reproduction.

Handed this:

```
ISSUE   the guild list showed 2 rows; the unit claims 3
  instance  inst_9b2c   (killed)
  run       run_2 · step 7 · click
  prelude   <the batch that reaches this path's entry, VERIFIED run_7>
```

**Step 1 — was this a clean end or a crash?** It changes what the evidence is worth.

```
status { instance: 'inst_9b2c' }
→ { state: 'killed cleanly', runs: 2, evidenceComplete: true }
```

A `DEAD — no heartbeat` answer instead means the transcript stops where the driver died, so anything after the last
flushed step is simply absent rather than uneventful. **`status` answers here because a reaped entry becomes a
tombstone**, not a deletion: an instance whose orphans a `cleanup` collected still says what it was and how it ended,
for as long as its evidence is retained.

**Step 2 — what did the failing step actually read?** The run id is named, not defaulted: this instance holds two runs
and `latest` is not a thing a fixer knows.

```
results { instance: 'inst_9b2c', run: 'run_2', step: 7 }
→ { verb: 'click', instanceState: 'killed',
    reading: { before: { count: 1, text: 'EXECUTION_ROW_0' }, urlAfter: '/g/quest/abc' },
    shot: '<repoRoot>/.siegelense/guilds/<guildId>/instances/inst_9b2c/run_2/step7.png',
    pixelChange: '4%', blank: false }
```

**That `shot` path is absolute and inside the repo**, so the next move is a plain `Read` of it. A path under someone's
home directory would hand back a filename the reader cannot open, which is the same as handing back nothing.

**Step 3 — what did the SERVER say while it happened?** This is the reading nothing else surfaces, and on this example
it is the whole answer:

```
results { instance: 'inst_9b2c', run: 'run_2', kind: 'server',
          where: { steps: '6-8', level: 'error' } }
→ [ '20:11:03 ERROR questListBroker: skipped unreadable quest.json at guilds/…/q3/' ]
```

**Step 4 — confirm it on the wire**, scoped to that one step:

```
results { instance: 'inst_9b2c', run: 'run_2', step: 7, kind: 'network',
          fields: ['status', 'responseBody'] }
→ GET /api/quests  200  [ {…}, {…} ]        ← two came back, not three
```

**Step 5 — reproduce on a FRESH instance**, never by resurrecting the dead one:

```
start { spec: 'dungeonmaster-web' }                        → inst_c41e
run   { instance: 'inst_c41e', steps: <the prelude, verbatim> }
```

The prelude carries `VERIFIED`, so it is a batch already proven to land where it claims. That is the difference between
reproducing a state and re-deriving one.

**Step 6 — write the e2e with the SAME recipes the prelude named**, called in-process from the spec, so the regression
test and the walk exercise one seeding vocabulary rather than two.

**Step 7 — `kill { instance: 'inst_c41e' }`.** The fixer started it, so the fixer closes it.

**What a fixer must not do:** resurrect `inst_9b2c`, start an instance to "look around", or go looking for the evidence
of an instance it was not handed. Every instance is three processes against a measured pool, and an unaccounted fourth
is how a phase runs out of room.

**None of that forbids the reading, and the distinction matters because a fixer will get it wrong in the cautious
direction.** "Touch no instance you did not start" is about PROCESSES. Steps 1 to 4 start none, so a fixer that believes
it must boot something before it may look at its own record's evidence has both spent a pool slot and read a fresh
instance's state instead of the one where the defect happened.

### Interleaving recipes and steps

**`seed` is a STEP, not a prologue.** It goes wherever the order needs it, as many times as the walk needs:

```jsonc
run {
  instance: 'inst_7f3a',
  stopOn: 'error',
  steps: [
    { step: 'seed',  recipe: 'guild-with-three-quests', as: 'g' },

    { step: 'goto',  path: '/{g.guildSlug}' },
    { step: 'look' },                       // mints the refs the next line uses
    { step: 'click', ref: 18 },             // live-session shortcut; would be a selector if this batch were saved

    { step: 'seed',  recipe: 'session-with-nested-subagent', guild: '{g.guildId}', as: 's' },
    { step: 'goto',  path: '{s.sessions.nested}' },
  ],
}
```

The second recipe takes `guild: '{g.guildId}'`. That is the composition rule from `siegelense-recipes.md` Part 5 doing
its job: a recipe stacks
onto what an earlier one made rather than building a whole world of its own, which is what keeps the catalogue deep
instead of wide.

**Seeding while a page is OPEN is not a convenience — it is the only way to test a whole class of behaviour.** This app
pushes `quest-modified` over a websocket, so a walk that always seeds up front and then navigates never exercises the
live-update path at all; it only ever measures a fresh render. Seeding mid-batch with the page already loaded is how you
ask whether the screen reacts:

```jsonc
steps: [
  { step: 'goto',  path: '/{g.guildSlug}/quest/{g.questId}' },
  { step: 'look' },                                            // what is on screen now
  { step: 'seed',  recipe: 'quest-advances-one-step', quest: '{g.questId}' },
  { step: 'until', predicate: 'document.querySelectorAll("[data-testid=EXECUTION_ROW]").length === 4' },
  { step: 'look' },                                            // and what changed
]
```

Two `look` calls either side of a seed, with an `until` between them, is the shape for any
"the screen updates when the data does" unit. The element delta on that second `look` IS the answer — and `+0 -0` is the
defect, reported rather than inferred.

**A seed that changes state under a page NOT driven by a socket needs a reload**, or the walk measures a stale render
and reports a defect that only exists in the browser's memory. Which of the two a surface is belongs in the guide, not
in a session's guess.

### Cycles — run, snapshot, collect, repeat

**The loop a stress tester actually runs is a cycle, and it is two calls per turn:**

```jsonc
// cycle 1
run { instance, steps: [
  { step: 'snapshot', as: 'clean' },
  { step: 'health' },                                            // the baseline
  { step: 'type',   target: '…', value: '<script>…', expect: 'error' },
  { step: 'health' },                                            // did it hold?
]}
→ { run: 'run_4', status: 'done', index: { console: { errors: 1 }, server: { errors: 0 } } }

results { instance, run: 'run_4', kind: 'console', where: { level: 'error' } }

// cycle 2 — back to the same start, a different attack
run { instance, steps: [
  { step: 'reset',  level: 'state', to: 'clean' },
  { step: 'paste',  target: '…', filePath: '/tmp/40mb.png', expect: 'error' },
  { step: 'health' },
]}
→ { run: 'run_5', … }
```

**Two cycle shapes exist and they want different things.** A verifier walking a long path is PROGRESSIVE — it snapshots
as checkpoints and rarely goes back. A stress tester is REPEATED-TRIAL — every cycle starts from the same named
snapshot, because otherwise attack 2 runs against whatever attack 1 left behind. Both need named snapshots; only the
second resets every cycle.

**What is missing today is comparing two runs without doing it by hand.** The point of a cycle is usually the difference
between iterations, and a session currently queries both runs and diffs them in its own context — which is the blob
problem returning by a side route.

```
compare { instance, runA: 'run_4', runB: 'run_5' }
→ { console: { errors: '+2', new: ['Cannot read properties of null'] },
    server:  { errors: '0' },
    network: { non2xx: '+1', new: ['POST /api/guilds 500'] },
    elements: '+0 -3 under GUILD_LIST',
    pixels:  'last capture differs 12%' }
```

That is a READING by the founding rule — a computed difference between two measured values, not a verdict on a unit —
and it is the shape a cycle's whole output should collapse to. Without it, "did this attack do something the last one
did not" costs a session two full result queries and its own arithmetic, every cycle.

**A clean return — a status, never a payload:**

```jsonc
{
  instance: 'inst_7f3a',
  run: 'run_2',                 // the handle for everything below; queryable until kill
  status: 'done',
  stepsRun: 5,
  index: {
    console: { errors: 0, warnings: 2 },
    server:  { errors: 0 },
    network: { exchanges: 14, non2xx: 0 },
    changed: 'step2 +31 elements 96%; steps 3-5 unchanged',
  },
  shots: [
    { step: 1, path: 'run_2/step1.png', pixelChange: null,  blank: false, open: true,  why: 'start state' },
    { step: 2, path: 'run_2/step2.png', pixelChange: '38%', blank: false, open: true,  why: 'large change',
      node: 'guild-selected' },
    { step: 3, path: 'run_2/step3.png', pixelChange: '0%',  blank: false, open: false },
    { step: 4, path: 'run_2/step4.png', pixelChange: '0%',  blank: false, open: false,
      node: 'chain-rendered' },
    { step: 5, path: 'run_2/step5.png', pixelChange: '0%',  blank: true,  open: true,
      why: 'BLANK — single colour #0d0907 across the whole frame' },
  ],
}
```

**`node` is an optional label a STEP carries, echoed onto its shot and its reading.** Most steps have none; a step that
lands on a named node of the path says so, and the tool records it.

```jsonc
{ step: 'until', visible: '[data-testid="SUBAGENT_CHAIN"]', node: 'chain-rendered' }
```

**Without it, promotion and baseline fetching are a mapping exercise somebody redoes every time.** The promotion rule is
already written per node — "every unit on that node came back `confirmed`" — and an antagonist asking for the baseline
of the node it is about to attack has only a step number otherwise, in a run it did not submit. The session is the only
thing that knows which step reached which node, so it is the one that says, once, in the batch.

**Every run lists the shots it took, and flags which to OPEN.** That removes a whole paragraph of prompt instruction —
"capture always, open the start and end, open an intermediate on signal" stops being something a session has to remember
and becomes something the response already decided. A session reads `open: true` and opens those.

It also removes the question a session would otherwise ask itself every run: *did I get a screenshot here?* The list
answers it before it is asked, and an empty list is then a real signal rather than an ambiguity.

That is what makes the whole service work. **Read the index, then query only what it points at.**
Without it a session queries everything to find out whether anything happened, and the result-size problem the service
exists to solve comes straight back.

**A failing return carries the key where it stopped**, so recovery costs no extra turn:

```jsonc
{
  instance: 'inst_7f3a',
  run: 'run_3',
  status: 'failed',
  stepsRun: 3,
  stoppedAt: {
    step: 4, verb: 'click',
    error: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]',
    candidates: [
      { ref: 16, under: 'GUILD_LIST',         text: '+' },
      { ref: 23, under: 'GUILD_SESSION_LIST', text: '+' },
    ],
  },
  key: '…the tree as it stood at step 4…',
  index: { console: { errors: 0 }, server: { errors: 0 }, shots: { end: 'step3.png' } },
}
```

**A timeout names the step and is a FINDING, not a tool failure:**

```jsonc
{
  status: 'timeout',
  stepsRun: 2,
  stoppedAt: {
    step: 3, verb: 'until',
    error: 'visible [data-testid="SUBAGENT_CHAIN"] never resolved in 20000ms',
  },
  key: '…', index: { console: { errors: 1 }, server: { errors: 1 } },
}
```

That last shape is the one to design for. A hang with a console error and a server error beside it is a defect report
already written — the session reads the index, queries the two errors, and has its
`SAW:` line without another walk.

---

## Part 9 — What exists as scratch

Nothing in Parts 1 to 3 is built. The prototypes below were driven through the existing `eval`
command and are throwaway:

| Path                                                | What it is                                                                            |
|-----------------------------------------------------|---------------------------------------------------------------------------------------|
| `../../tmp/siege-seed.ts`                           | creates a guild and seeds three session transcripts into a running lane               |
| `../../tmp/siege-look.ts`                           | emits the key, the shot and the map for whatever a lane is showing                    |
| `tmp/siege/exp{A,B,C}/`                             | the trial's lanes — each holds its own `RECORD.md`, screenshots and every result file |
| `tmp/siege/demo{1..5}/`, `../../tmp/siege/seedtest` | the exploratory lanes behind `siege-verification-remainder.md` Part 2's figures       |

`siege-command.ts` gained no verbs and the driver holds no refs.
