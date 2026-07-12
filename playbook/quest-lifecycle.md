# Quest Lifecycle — Fundamentals (LLM reference)

How a quest comes into being and moves from a user request to built, verified code. Read this to understand the model
before driving or testing orchestration. Companion: `docs/quest-role-paths.md` (deeper state-machine reference) and
`packages/orchestrator/CLAUDE.md` (wiring).

---

## The mental model (the one thing to internalize)

**The orchestrator does NOT spawn execution agents. The MCP server is the state machine; the user's own Claude session
(`/dumpster-launch`) is the execution engine.** Three actors:

1. **`/dumpster-launch`** — a brainless dispatch loop in the user's Claude session: `get-next-step()` → `Task()` (
   agents)
   / `run-ward` (ward) → await → repeat. Decides nothing.
2. **MCP stdio child** — exposes the tools (`create-quest`, `get-next-step`, `get-agent-prompt`, `signal-back`,
   `run-ward`, `modify-quest`, …). Quest tools route to the orchestrator.
3. **Orchestrator service** — owns `quest.workItems[]`, the dependency graph, and all "what runs next" math. Reads
   `quest.json` fresh from disk every scan; never spawns Claude itself.

Everything below is state stored in one `quest.json` file per quest, on disk under
`<DUNGEONMASTER_HOME>/guilds/<guildId>/quests/<questId>/quest.json`.

---

## 0. Guilds (the container)

A **guild** = one repo registered with dungeonmaster. Stored in `<home>/config.json` as
`{ guilds: [{ id: <UUID>, name, path, urlSlug, createdAt }] }`. `create-quest` matches the guild whose `path` equals the
MCP child's cwd; if none matches it **throws** (`"No guild registered for current directory… Run dungeonmaster init"`).
(Auto-create-on-first-quest is an in-progress feature, not yet merged.) Quests live under `guilds/<guildId>/quests/`.

---

## 1. Creation

`mcp__dungeonmaster__create-quest({ userRequest, questType? })` →
`<home>/guilds/<guildId>/quests/<questId>/quest.json` at `status: "created"`, with:

- the verbatim `userRequest`, a placeholder `title`, `questType` (`feature` default, or `bug-hunt`);
- one seeded `chaoswhisperer` work item (feature) — bug-hunt seeds none;
- all arrays empty, `planningNotes` empty.

Returns `{ questId, guildSlug }`.

---

## 2. Spec phase (ChaosWhisperer) — created → approved

ChaosWhisperer (the `/dumpster-create` slash-command session, NOT a Task agent) interviews the user and writes the spec
via `modify-quest`, walking the status gates:

```
created → explore_flows → review_flows → [user APPROVE] → flows_approved
        → explore_observables → review_observables → [user APPROVE] → approved
        → (optional design) explore_design → review_design → [APPROVE] → design_approved
```

It writes: **flows** (mermaid-style node/edge graphs; `flowType: runtime | operational`), **observables** (BDD
given/when/then embedded in `flows[].nodes[].observables[]`), **contracts** (branded data/endpoint/event shapes),
**designDecisions**, **toolingRequirements**, and **packagesAffected[]**. The two APPROVE buttons are the only manual
gates. `approved` (or `design_approved`) is the launch-ready state.

> Smoke tests usually start *here* — at `approved` — because the spec phase is interactive and expensive.

---

## 3. Start Quest — approved → in_progress (seeds the work-item graph)

The Web UI "Start Quest" button → `orchestration-start-responder`. It flips status to `in_progress` and **seeds the
work-item graph by quest type** (it spawns nothing — `/dumpster-launch` picks the quest up on its next scan):

- **feature** → `questBuildPathseekerGraphBroker` seeds the four-tier PathSeeker graph:
  ```
  pathseeker-surface ×N (one per packagesAffected, dependsOn: [])
        → pathseeker-dedup + pathseeker-assertion-correctness (parallel, dependsOn: [all surface ids])
        → pathseeker-walk (dependsOn: [dedup, assertion])
  ```
- **bug-hunt** → `questBuildBugHuntGraphBroker` hand-seeds the WHOLE chain (no pathseeker, no post-walk hook):
  `pesteater → ward(changed) → lawbringer(whole-diff) → blightwarden → ward(full)`.

---

## 4. The dispatch engine — `get-next-step`

`/dumpster-launch` polls `get-next-step()`. Each call:

1. **Load active quests** across all guilds; filter to `in_progress` with incomplete work; pick the **oldest by
   `createdAt`** (FIFO, single active quest).
2. **Compute ready items** = `status: pending` AND every `dependsOn` id is in a *satisfying* status (**`complete` or
   `failed`** — `skipped` does NOT satisfy).
3. **Return a NextStep:**
    - any ready `ward` item → `{ type: 'run-ward', questId, workItemId, mode }` — **ward always dispatches alone**;
    - else a batch: all ready `pathseeker-surface` together; OR all ready `spiritmender` together; OR
      `pathseeker-dedup` + `pathseeker-assertion-correctness` when both ready; OR the **single oldest** ready item →
      `{ type: 'spawn-agents', agents: [{questId, role, workItemId, taskPrompt}] }`;
    - nothing ready → long-poll ~25s → `{ type: 'idle' }`.

The `taskPrompt` is a stub telling the agent to call `get-agent-prompt` then `signal-back`.

---

## 5. Agent dispatch — `get-agent-prompt`

For each `spawn-agents` agent, `/dumpster-launch` `Task()`s a sub-agent that first calls
`get-agent-prompt({ agent, workItemId, questId })`. This does two things:

1. **Stamps identity (best-effort):** flips the work item `pending → in_progress`, sets `sessionId` + `agentId` +
   `startedAt`. If identity can't be resolved it's skipped (no stamp) — but the prompt still returns.
2. **Builds the role prompt** by resolving the work item's `relatedDataItems` into quest data:
    - `codeweaver` / stepped `lawbringer` → `steps/<id>` refs resolved against `quest.steps[]`;
    - `siegemaster` → a `flows/<id>` ref resolved against `quest.flows[]` (runtime flow → also resolves
      `.dungeonmaster.json` dev-server config; operational flow → no server);
    - `spiritmender` → a `spiritmender-batches/<id>.json` sidecar (recovery) or a `steps/<id>` ref;
    - `blightwarden` / `pathseeker-*` / `pesteater` → no refs (read quest context directly).

> **THE load-bearing constraint:** if a `codeweaver`/`siegemaster`/stepped-`lawbringer` work item's `relatedDataItems`
> point at a `steps/<id>`/`flows/<id>` that isn't in the quest, `get-agent-prompt` **throws**. The work item and its
> referenced step/flow must be kept consistent. (Empty `relatedDataItems`: `lawbringer` → whole-diff mode OK;
> `codeweaver`/`siegemaster` → throws.)

---

## 6. Result handoff — `signal-back`

When the agent finishes it calls `signal-back({ questId, workItemId, signal, summary? })`, `signal ∈ complete | failed |
failed-replan`. The orchestrator is RECOVERY-FIRST — **no role blocks the quest on failure**; every failure routes to a
fixer and only PathSeeker (loop exhausted) blocks. The handler stamps `completedAt` and **routes by role + signal**:

| signal          | role                | effect                                                                                                                                                                                                                     |
|-----------------|---------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `complete`      | `pathseeker`        | item `complete`; **fires the post-walk hook** (§7)                                                                                                                                                                        |
| `complete`      | any other           | item `complete`                                                                                                                                                                                                           |
| `failed`        | code-recovery role  | **RECOVER** (code failure): mark `failed`, then splice 1 `spiritmender` (fed the `summary`) + `ward(changed)` + a fresh re-run of the SAME role; rewire downstream; stays `in_progress`. Budget `slotManagerStatics.<role>.maxAttempts`, then escalate to a PathSeeker replan |
| `failed-replan` | code-recovery role  | **REPLAN** (plan hole): mark `failed` + superseded, drain pending → `skipped`, splice a `pathseeker` replan fed the `summary`; on completion the post-walk hook regenerates the chain. Bounded by `slotManagerStatics.pathseeker.replanMaxCycles`, then BLOCK |
| any failure     | `blightwarden-*-minion` | **NON-BLOCKING**: minion terminates `complete`, failure lives in its report                                                                                                                                             |
| `failed`        | `spiritmender`      | **SOFT**: mark terminal; the retry spliced after it carries on                                                                                                                                                            |
| `failed`        | `pathseeker`        | **RETRY** while budget remains (reset to `pending`, `attempt + 1`), else **BLOCK** — the sole block path                                                                                                                  |

"Code-recovery role" = codeweaver / flowrider / siegemaster / lawbringer / blightwarden synthesizer / pesteater
(every non-interactive, non-command, non-planner, non-spiritmender, non-minion role — derived by
`codeRecoveryRolesTransformer`, so a new role recovers by default). Ward exhaustion escalates to a PathSeeker replan
the same way.

> `signal-back`'s `summary` threads through to the handler: it is stamped onto the failed work item and written into
> the spiritmender's recovery sidecar (code failure) or the replan pathseeker's brief (plan hole) so the fixer acts on
> the actual finding.

---

## 7. The post-walk hook — where the execution chain is born (feature only)

When `pathseeker-walk` signals `complete`, `questPostWalkHookBroker`:

1. Runs `questValidateSpecTransformer({ scope: 'completeness' })` over the authored spec. **If it fails, it throws —
   no chain is generated.** This is the strict gate (step contract refs resolve, new contracts have a creating step,
   observables satisfied, step focus targets + dep graph valid).
2. On pass, runs `stepsToWorkItemsTransformer({ steps, flows, … })` and appends the downstream chain to `workItems[]`:
   ```
   codeweaver(×chunks) → ward(changed) → siegemaster(×flow, chained) → lawbringer(×chunks) → blightwarden → ward(full)
   ```
    - codeweaver and lawbringer steps are chunked per package (capped at 20/chunk); each chunk carries
      `relatedDataItems: ['steps/<id>', …]`. Lawbringer chunks only reviewable source pairs (operational /
      barrel / package.json + flowrider-owned steps are excluded) and fans out `lawbringer-minion`
      sub-agents per pair-group inside its own turn;
    - one siege per flow, chained via `dependsOn` (so at most one runs at a time), each
      `relatedDataItems: ['flows/<id>']`;
    - ward items are `spawnerType: 'command'`.

> **Why hand-seeding can't easily use this hook:** a hand-authored minimal spec rarely passes the `completeness` gate,
> so the hook generates nothing. To test the *execution roles*, pre-seed the chain + matching steps/flows directly
> (bypasses the hook). To test the *hook itself*, you need a real completeness-passing spec.

---

## 8. Ward — `run-ward` (the one non-agent role)

Ward items are `spawnerType: 'command'`. `/dumpster-launch` calls `run-ward({ questId, workItemId, mode })` instead of a
Task. `quest-run-ward-broker` runs `dungeonmaster-ward run [--changed]`, appends a `wardResults[]` ref
(`{id, createdAt, exitCode, runId?, wardMode}`), and updates the ward work item: `relatedDataItems += wardResults/<id>`,
status `complete` (exit 0) / `failed` (non-zero). On failure with retry budget (`attempt < maxAttempts-1`, ward
`maxAttempts`=3) it splices spiritmenders + a ward retry; exhausted → BLOCK. **Routing is keyed on the real exit code
inside the broker — not a `signal-back`** (so it can't be staged by editing `quest.json`).

---

## 9. The work-item state machine

```
pending → in_progress → complete | failed
pending → skipped            (only via BLOCK; terminal but does NOT satisfy dependents)
```

| status               | terminal? | satisfies a `dependsOn`? | counts as failure? |
|----------------------|-----------|--------------------------|--------------------|
| pending              | no        | no                       | no                 |
| queued / in_progress | no        | no                       | no                 |
| complete             | yes       | **yes**                  | no                 |
| failed               | yes       | **yes**                  | yes                |
| skipped              | yes       | **no**                   | no                 |

The single most important rule: **`failed` satisfies a dependency, `skipped` does not.** A `skipped` dep blocks its
dependents forever — which is how a blocked quest halts.

---

## 10. Quest status is *derived* (not set by roles)

`workItemsToQuestStatusTransformer` runs whenever work items change (precedence order):

1. status is `seek_*` (pathseeker-running) or pre-execution → **unchanged**;
2. every item terminal AND none `failed` (all complete/skipped) → **`complete`**;
3. any item active (`in_progress`/`queued`) → **`in_progress`**;
4. ≥1 pending AND every pending item depends on a `failed` id → **`blocked`**;
5. else → **unchanged**.

`blocked` is set explicitly by `questBlockOnFailureBroker` on a routed failure; it is NOT terminal (resumable →
`in_progress`). Terminal statuses are `complete` and `abandoned`.

---

## 11. The validation gates (what blocks a write, and when)

`modify-quest` (= every agent write, and every internal `get-agent-prompt`/`signal-back`/`run-ward` mutation) runs, in
order:

1. **Input allowlist** (`questStatusInputAllowlistStatics`) — per current status, which input fields are writable.
   `workItems`/`wardResults`/`designPort`/`pausedAtStatus` are **server-only** and bypass this gate (set only by
   internal brokers; stripped from the MCP tool surface). Rejects on any disallowed field.
2. **Status-transition guard** — the from→to hop must be legal (only when `status` is in the input).
3. **Gate-content guard** — required content present for the target status (e.g. `flows` before `approved`).
4. **Save-invariants** (EVERY write, post-mutation) — structural integrity, lenient: **no duplicate ids; no step
   dependency cycles; no orphan steps (step `dependsOn` resolve); valid flow refs (step `observablesSatisfied` resolve
   to a flow observable)**. A malformed seed fails here → the write fails → a status flip silently doesn't happen.
5. **Completeness** (only on specific transitions, e.g. the post-walk hook) — the strict spec check.

**Direct disk edits to `quest.json` bypass ALL of these** — that's why hand-seeding is the way to stage arbitrary
states. But the moment an MCP tool touches the quest, save-invariants (4) run on the whole thing, so a seed must at
least satisfy the four invariants.

---

## 12. Keep-consistent rules when hand-editing `quest.json`

- A work item's `relatedDataItems` `steps/<id>` / `flows/<id>` MUST have a matching object in `quest.steps[]` /
  `quest.flows[]` (or `get-agent-prompt` throws). `wardResults/<id>` is stamped by `run-ward`, not by you.
- Step `dependsOn` ids and `observablesSatisfied` ids must resolve (or save-invariants fail). Easiest: keep both `[]`.
- `dependsOn` between work items is the ONLY ordering mechanism — no hardcoded role sequence.
- A ready ward item always dispatches via `run-ward`, alone.
- Use an `operational` flow for siege seeds to avoid needing a dev server.
