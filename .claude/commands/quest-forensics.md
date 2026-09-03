---
description: Forensic post-mortem of a completed or paused quest run — time, tokens, prompt fit, waste
allowed-tools: mcp__dungeonmaster__*, Bash, Read, Write, Edit, Task, Agent, SendMessage
---

# Quest forensics

You are the orchestrator of a forensic post-mortem on one quest run. You dispatch one analyzer per
work item, keep a convergence spine as their reports land, then dispatch a compiler that merges
everything into a single ranked document.

**Quest id: $ARGUMENTS**

You read no transcripts yourself. Transcripts run to hundreds of megabytes; reading one directly
burns your context and buys nothing an analyzer cannot give you. Your jobs are: index the quest,
brief the analyzers, keep the spine, and hand off to the compiler.

## Step 1 — index the quest

```bash
python3 scripts/quest-forensics.py quest $ARGUMENTS > tmp/quest-forensics/$ARGUMENTS/index.txt
```

`mkdir -p tmp/quest-forensics/$ARGUMENTS` first. Read the index. It gives you, per work item: role,
status, session id, wall clock, operation text, flow ids, package names, transcript size and
sub-agent count — plus ward and riftcarver results and the original user request.

If the user named a range ("from the first codeweaver to the second siegemaster"), honour it.
Otherwise analyze every work item that has a `sessionId`. Work items with `spawner=command`
(`ward`, `riftcarver`) have no transcript — fold each into the analyzer for the agent item next to
it rather than giving it an analyzer of its own, and say so in that analyzer's brief.

## Step 2 — write the analyzer brief

Write `tmp/quest-forensics/$ARGUMENTS/ANALYZER-BRIEF.md`. Every analyzer reads it, so it carries
everything common and nothing item-specific. It must contain:

**The quest.** Id, title, the user's original request quoted in full, the worktree path, and the
path to the index from step 1.

**Where transcripts live.** `~/.claude/projects/<encoded-worktree-path>/` — the `quest` subcommand
prints the resolved directory. Main session at `<sessionId>.jsonl`; its sub-agents at
`<sessionId>/subagents/agent-<id>.jsonl` beside `agent-<id>.meta.json` (which carries `agentType`,
`model`, `description`, `spawnDepth`); oversized tool results spilled to `<sessionId>/tool-results/`.
Sub-agent transcripts have the same shape as main sessions, so every subcommand works on both.

**The tool.** `python3 scripts/quest-forensics.py <cmd> <sessionId|agent-id>`, run from the repo
root. Give them this table:

| Command | What it gives |
|---|---|
| `summary` | wall clock, message counts, model, token totals (input / cache_read / cache_creation / output / thinking), tool-call histogram, tool-result bytes, sub-agent count |
| `buckets --minutes N` | chronological buckets: API calls, tool calls, output tokens, context-in tokens, tool-result bytes, top tools |
| `timeline [--max N]` | every assistant turn: elapsed, gap seconds, tokens, and the text said or `CALL tool(args)`. Marks injected prompts and oversized results |
| `subagents` | roster in start order: start, duration, type, model, depth, turns, output, context-in, tool histogram, description |
| `gaps [--floor-seconds N]` | **every gap between assistant turns, labelled with which sub-agents were live during it** — then totals splitting wall clock into blocked-on-sub-agent versus true idle |
| `text` / `prompts` | assistant prose and thinking / every user and injected message |
| `errors` | turns and results matching an error, failure, retry or denial pattern |
| `result <toolRegex>` | full tool-result payloads by tool name |
| `grep <regex>` | first match per record with surrounding characters |

**Use `gaps`, not arithmetic, for the idle question.** A session parked while a sub-agent works is
not idle — it is serialized. Those are different defects with different fixes, and only `gaps`
separates them. An analyzer that reports "N% idle" without running `gaps` has not measured it.

**Note on `timeline` token columns.** One API response spans several records — text, thinking, each
`tool_use` — and every record repeats that response's usage. Adjacent identical OUT/CTX-IN values are
one response, not several. `summary` and `buckets` count correctly; quote those as authoritative and
use `timeline` for ordering and content.

**The prompt family for each role.** Role prompts are TypeScript statics under
`packages/orchestrator/src/statics/`. Tell each analyzer to read its role's family IN FULL:

| Role | Files |
|---|---|
| codeweaver | `codeweaver-prompt/`, `codeweaver-reviewer/`, `transformers/codeweaver-scope-block/`, `work-item-context-block/` |
| flowrider | `flowrider-prompt/`, `flowrider-reviewer/`, `flow-evidence-contract/`, `work-item-context-block/` |
| siegemaster | `siegemaster-prompt/`, `siegemaster-reviewer/`, `siegemaster-walker/`, `smoketest-*/`, `work-item-context-block/` |
| spiritmender | `spiritmender-prompt/`, `run-ward-refusal/`, `work-item-context-block/` |

Then recover the RENDERED prompt with
`python3 scripts/quest-forensics.py result <sessionId> get-agent-prompt --max-chars 40000` and diff
it against the static. A placeholder that rendered empty, a context block that came out huge, an
instruction that arrived with no data behind it — those are the findings this post-mortem wants.

**Environment.** This repo's PreToolUse hooks block the native Grep, Glob and Search tools, and Bash
`grep`/`find`/`rg`/`sed` and shell redirects. Search with a `python3` one-liner (`os.walk` + regex)
or the `discover` MCP tool. Read with `Read`, write with `Write`. Never run `npm run ward`,
`npm run build` or `npm run dev` — this is read-only analysis.

**The report format.** Every analyzer writes to `scrolls/reports/$ARGUMENTS/<NN>-<role>-<slug>.md`
under these headings, verbatim and in order. Identical headings across reports are what let the
compiler match claims and drop duplicates:

```
# <Work item NN> — <role> — <package/flow>
## 0. Identity
## 1. Chronological breakdown — where the time went
## 2. Chronological token buckets
## 3. Was the prompt fit for the work?
## 4. What went well
## 5. What agents did that they should not have
## 6. Suggested fixes
## 7. Raw figures appendix
```

Spell out what each section holds:

- **§1** — a phase table (clock window, elapsed range, minutes, what happened, evidence) whose
  minutes sum to the total wall clock, then a time-by-category table: orientation, planning,
  blocked-on-sub-agent, true idle, review cycles, verification, other. The blocked/idle split comes
  from `gaps`.
- **§2** — the `buckets` output pasted verbatim (pick a width yielding 8–25 rows), then sub-agent
  spend attributed to the bucket each started in, then totals. **cache_read and cache_creation stay
  separate throughout.** Never collapse them.
- **§3** — quoted prompt passages that drove behaviour, each paired with what the agent did and a
  timeline citation. Did the step script match the work; was the scope block accurate; what was
  ignored and why; what was missing that the agent had to invent.
- **§5** — one numbered finding each, carrying: what happened, the citation (elapsed + quoted text),
  the cost in minutes and tokens, and whether the prompt permitted, required or forbade it.
- **§6** — one numbered fix per finding, naming the FILE and the concrete edit, ranked by
  minutes-or-tokens saved with the estimate shown.
- **§7** — `summary` and `subagents` output pasted verbatim. Every number quoted above must trace
  to a command here.

**Rules for analyzers.** Copy figures, never paraphrase them. Cite every claim with an elapsed
timestamp, a sub-agent id, or a quoted line. Never guess — write "not measurable from the
transcript". At most 2 sub-agents in parallel, each given a narrow named job and required to return
raw counts and quoted lines. Finish by printing the report's absolute path.

## Step 3 — dispatch the analyzers

One per work item. Model `opus` — this is judgement work, not mechanical work. Each prompt: read the
brief first, then the item's identity (index, work-item id, role, session id, operation text, window,
sub-agent count), the report filename, and any item-specific questions the index suggests. Add the
environment note about blocked search tools to every prompt; analyzers hit it otherwise.

Give the largest items — a siegemaster, a long flowrider — a staged instruction: write partial
reports (`tmp/quest-forensics/$ARGUMENTS/<NN>-part-{a,b,c}.md`) for timeline-and-tokens, the
sub-agent roster, and prompt fit, then MERGE them, copying content across rather than re-summarizing.

**Three operational facts, learned the hard way:**

1. **The concurrent sub-agent cap is 20 across the whole tree.** Analyzers spawn their own children,
   so a first wave of eleven can saturate it. Keep a queue file
   (`tmp/quest-forensics/$ARGUMENTS/LAUNCH-QUEUE.md`) listing launched and pending items, and launch
   the rest as completion notifications free slots. Analyzers refused a child will do the work inline
   — that is fine, and they should say so in their report.
2. **An analyzer can stall believing a child is still running when the harness says it has none.**
   The completion notification will say so. `SendMessage` it: tell it there are no live children, not
   to wait, and to finish with what it has. Put that instruction in every analyzer prompt up front.
3. **Never read a task's `output_file`.** It is the full sub-agent transcript and will overflow you.

## Step 4 — keep the convergence spine

As each report lands, append what it found to a "Convergences" section in
`tmp/quest-forensics/$ARGUMENTS/LAUNCH-QUEUE.md`. One numbered entry per finding, naming every report
that states it and quoting each one's figures. Merge a new report's finding into an existing entry
when it names the same file, mechanism or prompt passage; open a new entry when the mechanism
differs even if the symptom matches.

**Record only what a report states, with its figures.** Never add a claim you heard secondhand from a
status message, and never round or average. When two reports frame the same measurement differently,
say so in the entry and mark it for the compiler rather than picking a winner.

This spine is the single most valuable thing you produce. It survives your context being compacted,
and it is what lets the compiler verify rather than re-derive.

## Step 5 — compile

When every report exists, write `tmp/quest-forensics/$ARGUMENTS/COMPILER-BRIEF.md` and dispatch ONE
compiler agent on `opus`. The brief tells it to:

1. Read the spine first as a checklist of leads — the reports themselves are the source of truth, and
   a report beats the spine wherever they disagree.
2. Dispatch its two allowed sub-agents to extract verbatim across the report set, split in half:
   every §1 time-by-category table, every §2 totals block, every §5 finding with its citation and
   costs, every §6 fix with its file and estimate, every §4 item with its mechanism. Copy, do not
   compress; a 20-row table comes back as 20 rows.
3. Read §0 and §3 itself, plus anything the spine flags as contested.
4. Write `scrolls/reports/$ARGUMENTS/00-POST-MORTEM.md` with these sections:

```
## A. What this covers          — quest, items, method, and any cap that constrained the ANALYSIS
                                  (so no reader mistakes it for a finding about the quest)
## B. The quest end to end      — one row per item: role, package/flow, wall clock, sub-agents,
                                  output tokens, context-in tokens, outcome; plus a totals row
## C. Where the time went       — every §1 table merged; blocked-on-sub-agent and true idle kept apart
## D. Where the tokens went     — every §2 totals block merged; cache_read and cache_creation separate;
                                  cost-per-landed-line where reports computed it
## E. Findings, ranked by cost  — one entry per DISTINCT finding, most expensive first, each tagged
                                  `structural` (a file is wrong), `behavioural` (an agent disobeyed),
                                  or `design` (the prompt asks for the wrong thing)
## F. What went well, and why   — so the fixes in G do not break what is working
## G. Fixes, ranked by saving   — grouped into one-line changes, prompt edits, and design changes
                                  needing a decision; each names the file and the arithmetic
## H. Open questions            — every disagreement between reports, both sides cited, with which is
                                  better evidenced and why. Never resolve one by dropping a side
## I. Source index              — each report, its path, line count, and the §E entries it fed
```

**Deduplication rule for the compiler.** Same file, mechanism or prompt passage means ONE entry
keeping every report's number, attributed:

> **`npm run build` is banned in sub-agent briefs and run anyway.** Counts by item: [3] 9 · [7] 9 ·
> [9] 16 · [14] 24 · [16] 17 (10 of 10 fixers). Mechanism, stated most precisely by report 03: …

Same symptom with a different mechanism stays separate, and the entry says how they differ.

**Citations** are `[report NN §S]`. A merged finding carries one per contributing report.

---

# PHASE 2 — the delivery-chain audit

Phase 1 asks *how each session ran*. Phase 2 asks a different question, and the two do not substitute
for each other: **did the approved spec turn into the delivery it promised, and if not, where did the
chain break?**

The design under test is a three-role chain over one approved flow map:

| Role | Owes, per the design |
|---|---|
| codeweaver | one package's half of one flow — product code plus the unit tests that prove it |
| flowrider | the integration and e2e suites that prove that flow **as a whole** |
| siegemaster | hand-drives the flow as a user would and finds the glaring gaps |

Upstream of all three sits the spec phase: flows, observables, contracts, `packagesAffected`,
approved at Gate #2. Phase 2 audits whether that artifact was enough to drive the chain, and whether
each role delivered its own obligation against it.

Run Phase 2 after Phase 1 (its reports give you the per-session behaviour to cross-reference), or
standalone when the question is only about spec-to-delivery fit.

## Step 7 — the coverage baseline

```bash
python3 scripts/quest-forensics.py coverage $ARGUMENTS > tmp/quest-forensics/$ARGUMENTS/coverage.txt
```

That prints, computed from `quest.json` rather than from any agent's claim:

- **Flow shape** per flow — node counts by type, edges and how many are labelled (a labelled edge is
  a signable branch; an unlabelled one is not a choice anyone made), observable count, off-map
  families, and the package tags on the nodes.
- **Coverage by track** — per flow, per track: signed, confirmed, unconfirmable, UNSIGNED.
- **Unsigned units** — the work the quest still owes, per track, named.
- **Observables by provenance** — `addedBy: spec` survived Gate #2; anything else was found DURING
  execution. **This is the planning-adequacy measurement, taken directly.** The listing names each
  mid-quest observable, its flow and its author.
- **Unconfirmable verdicts** with their `toSettle` instruction.
- **Who signed what** — sign-offs per work item, so a track's output maps back to a session.
- **Quest notes** by kind and role, with detail — the side channel that never closes a unit.
- **Contracts and packages the spec declared.**

**One caveat the analyzers must respect.** This command derives units by a plain reading of the
graph — observables, labelled edges, off-map families. The authoritative denominator is
`get-qa-checklist({ questId, operationItemId })`, which derives scope through
`operationSignoffScopeTransformer`. Where the two disagree, **the MCP tool is right and the
discrepancy is itself a finding** — it means a session and its measurer were counting differently.
Call `get-qa-checklist` for at least one operation item per role and reconcile.

## Step 8 — dispatch the chain analyzers

**One analyzer per FLOW**, plus one for the spec phase. Model `opus`. Each writes to
`scrolls/reports/$ARGUMENTS/chain-<slug>.md`.

### The spec-phase analyzer

Its subject is the intake work item — the `chaoswhisperer` (or `bughunt`) session at index [0], which
has a `sessionId` and its own sub-agents. Phase 1 skips it; Phase 2 must not. Give it the Phase 1
tool table plus:

- Read `packages/orchestrator/src/statics/dumpster-create-prompt/dumpster-create-prompt-statics.ts`
  and `chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics.ts` in full.
- Where did each mid-quest observable come from? For every observable whose `addedBy` is not `spec`,
  find whether the spec session had the information to author it and did not, or genuinely could not
  have known. Quote the spec session's own reasoning where it exists.
- Did the gap-minion run, what did it check, and did it clear a spec that later proved incomplete?
- Were the `contracts` entries' `source` paths accurate? A wrong `source` mints the wrong codeweaver
  cell at Start.
- Were `packagesAffected` and the nodes' `packages` tags complete? A package that tags no node gets
  no cell.

### The per-flow chain analyzers

Each takes one flow and walks it forward through every session that touched it. Give each the flow
id, the coverage baseline, the Phase 1 reports for its own work items, and these questions:

1. **What was each role owed on this flow, and what did it deliver?** Build a table: unit, kind,
   owning package, then one column per track with verdict and the work item that signed it. Name
   every unit no track settled.
2. **Did the cell decomposition match where the work actually was?** The codeweaver ledger fans out
   per (package, flow). Compare each cell's sign-off count against the observables tagged to its
   package. A cell that signed one unit and a cell that signed fifty are both worth explaining.
3. **Did each role have what it needed at the moment it started?** List the facts each session had to
   derive for itself that the spec, or a prior session's map, could have carried. Quote the
   derivation from the transcript and price it.
4. **Did the roles overlap or leave a seam?** A unit proven by all three tracks is either defence in
   depth or waste — decide which, and say why. A unit proven by none is a gap; name who should have
   owned it.
5. **What did the reviewers have to fix at the end?** For each role's reviewer, separate what it
   fixed itself from what it returned as `rework`, and judge whether each fix was inside the role's
   own scope or a gap handed down from upstream. **A reviewer repairing the same class of thing on
   every pass is a missing step, not a diligent reviewer.**
6. **What did the LAST role find that an earlier one should have?** Every mid-quest observable and
   every quest note carries a role. Work backwards: could the flowrider's suites have caught what the
   siegemaster found by hand? Could a codeweaver unit test have caught what the flowrider found? Cost
   each late discovery at the wall-clock it consumed where it was actually found.
7. **Is a middle step missing between the approved flow map and the first codeweaver brief?** State
   plainly what every operator on this flow had to invent before it could dispatch anything, and
   whether that invention belongs in the spec, in a new step, or in the prompt.

Report headings, verbatim:

```
# Chain audit — flow <id>
## 0. The flow as approved
## 1. Obligation versus delivery, per role
## 2. Cell decomposition — did the fan-out match the work?
## 3. What each role had to derive for itself
## 4. Overlaps and seams
## 5. Reviewer burden, and what it says about upstream
## 6. Late discoveries — what was found where it was most expensive
## 7. The missing middle step
## 8. Raw figures appendix
```

## Step 9 — compile Phase 2

One compiler agent on `opus`, reading every `chain-*.md` plus the spec-phase report plus the Phase 1
post-mortem. It writes `scrolls/reports/$ARGUMENTS/00-DELIVERY-CHAIN-AUDIT.md`:

```
## A. The chain as designed, and the chain as run
## B. Coverage — every flow, every track, signed and unsigned    (a matrix, from step 7's baseline)
## C. Did the spec give the workers what they needed?            (provenance, cost of each late find)
## D. Obligation versus delivery, per role                       (what each role owes, and met)
## E. Where the chain leaks                                      (seams, overlaps, unowned units)
## F. Reviewer burden as a signal of upstream gaps
## G. The missing middle step — stated, or explicitly ruled out
## H. Fixes, ranked, naming the file and the edit
## I. Open questions
```

**Section G is the deliverable.** The whole phase exists to answer one question: is the path from an
approved flow map to a delivered flow complete, or does every operator quietly invent the same
missing artifact? Answer it plainly — including "no middle step is missing, and here is why" if that
is what the evidence says.

## Step 10 — report back

For Phase 1, tell the user where the post-mortem is, its top three findings with figures, and the
highest-value fix with its saving. For Phase 2, lead with section G's answer, then the coverage
matrix, then the ranked fixes. Keep every per-item and per-flow report — they are the evidence.
