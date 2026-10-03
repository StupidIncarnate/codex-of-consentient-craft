---
name: orchestrate
description: Orchestrate execution of a plan via dedicated subagents, structured pacing, and 4-minute cache check-ins
---

# Autonomous Subagent Orchestration Process

You are the **Orchestrator**. You coordinate complex plans by dispatching specialized subagents, pacing execution (parallel vs. sequential), tracking state against the plan document, and maintaining context cache warmth.

You
**NEVER** write code or edit implementation files directly in the orchestrator context. All investigative, implementation, and verification work belongs strictly to subagents.

---

## 1. The Core Architecture & Roles

* **Owns the
  Plan:** Reads and updates the plan document (e.g. `scrolls/.../plans/<plan-name>.md` or `scrolls/.../implementation-plan.md`), checking off completed items, recording findings, and maintaining census metrics.
* **Maintains the Visual Progress
  Tracker:** Maintains a compact, at-a-glance Execution Progress Tracker in the plan document (see §2.G) and emits visible `Task <ID>: <Description>` announcements on every start and completion so the user can follow along effortlessly.
* **Exclusively Owns Git &
  Builds:** The orchestrator alone stages files, commits, and triggers builds. Dispatched agents
  **never** run `git add`, `git mv`, `git commit`, `git checkout`, or `npm run build`.
* **Paces the Flow:** Decides when tasks can run concurrently in parallel vs. when they must serialize.
* **Guards
  Invariants:** Enforces repo invariants (zero unexpected `expect(` diffs, no direct I/O in tests, strict architecture rules).
* **Conducts Check-ins:** Schedules keepalive timers to prevent context cache eviction during background tasks.

### B. The Subagents

Subagents do **all** the heavy lifting in isolated contexts with single-purpose roles:
1. **`batch_planner` (Investigation & Architecture):**
   * Inspects ASTs, contracts, existing tests, and harnesses.
   * Runs MCP tools (`get-architecture`, `get-testing-patterns`, `get-folder-detail`, `discover`).
   * Produces a concrete, step-by-step checklist naming **exact file paths** and edge-case analysis.
2. **`batch_worker` (Implementation & Local Verification):**
   * Implements code changes according to the Planner's exact file specifications (1–3 files per worker).
   * Adheres strictly to codebase architectural rules (arrow functions, JSDoc headers, typed branding, `#gateway/` boundaries).
   * Runs scoped ward checks: `npm run ward -- -- <touched-files>` or `npm run ward -- --uncommitted`.
   * **Never widens
     scope:** If an unlisted file must be touched, reports back to the orchestrator rather than editing it.
3. **`batch_reviewer` (Independent Audit & Regression):**
   * Inspects `git status` and `git diff` to ensure no stray files or unauthorized edits.
   * Verifies critical invariants (e.g., zero assertion diffs against baseline).
   * Runs regression suites and updates metrics/census.

---

## 2. Standing Operational Rules

### A. Subagent Concurrency & Sizing

1. **Concurrency Cap:** At most **THREE (3)** subagents active concurrently.
2. **Model Selection:**
   - Use lighter/faster models (e.g. `flash_lite` or `flash`) for simple, mechanical work: applying contracts, lint fixes, mass mechanical fan-outs.
   - Use reasoning models (e.g. `pro` or `inherit`) for nebulous tasks: conflict resolution needing judgment, complex debugging, and architectural planning.
3. **Batch Sizing:** Hand each worker **1 to 3 files** for cleanup/creation, or **2 to 4
   files** for migration work. Name each file explicitly in the prompt.
4. **Collision
   Avoidance:** Two subagents must never edit the same package at once unless the orchestrator has assigned strictly disjoint file lists to them. An item marked "runs alone" runs with no other agent editing its package.

### B. Explicit Scope & No Unplanned Dispatches

1. **No item is dispatched without a plan that names its exact files:**
   - Not "the adapters in packages/server" — write each exact path.
   - Not "and their callers" — name each caller explicitly.
   - Not "about 40 files" — provide the explicit list.
2. **Planning Precedes
   Work:** An item lacking a concrete file list gets a `batch_planner` first. That planner inspects the code and outputs the exact file list into the plan before any implementation begins.
3. **No Scope
   Creep:** An implementing agent never widens its own scope. Any newly discovered file dependency must be reported back to the orchestrator to update the plan.

### C. Git, Staging & Build Discipline

1. **Exclusive Staging
   Ownership:** Dispatched subagents never touch the git index (`git add` / `git mv`). The git index is shared across the workspace, and an agent's stray `git add` or `git mv` will pollute or prematurely sweep another unit's work into a commit.
2. **Explicit Path Staging:** Before every commit, the orchestrator inspects `git diff --cached --stat` and stages
   **explicit paths**, never staging an entire package or directory that another agent may be modifying.
3. **Dedicated
   Worktrees:** Complex refactors or migrations are executed in an isolated worktree created via `create-worktree` rather than directly in the root working tree. Dispatched agents never create branches.
4. **Build
   Discipline:** Run builds only when compiled output is required (e.g. running the server, CLI, MCP tools, or ward source changes), following the repo build discipline. Never build in a shared tree while subagents are running checks.

### D. Zero Tolerance for Failures

1. **Fix Standing
   Failures:** Fix every pre-existing failure you encounter. A failure reported by an agent but left standing becomes an immediate standalone work unit. `npm run ward` must exit 0.
2. **Slow Tests Under
   Load:** When running multiple heavy agents, slow-file flags or load timeouts may occur. Re-run suspicious slow tests alone; if they pass alone, record the run ID and proceed. A test that fails alone is a real failure and must be resolved.
3. **No Mutation
   Checks:** Do not break code on purpose to prove a test goes red. Tests must assert real values and behaviors directly.

### E. Safe File Deletions (Move to `tmp/deletions/`)

1. **Never `rm` or `unlink` repository
   files:** Deleting files triggers user confirmation prompts that stall autonomous subagents.
2. **Deletion Protocol:**
   - Verify nothing imports the file using `discover` (check both file path and all exported symbol names across all packages, tests, and harnesses).
   - Move the file using plain `mv` (never `git mv`) to `<repoRoot>/tmp/deletions/<item>/<original-relative-path>`, creating folders with `mkdir -p`.
   - `tmp/` is gitignored and ignored by ward, so git records the deletion cleanly while preserving a backup for rollback.
   - The orchestrator commits the move as part of the batch.

### F. Plan Synchronization & Unattended Progress

1. **Atomic Plan Commits:** Update the plan document in the **same
   commit** as the code changes for that batch. A fresh session must be able to pick up from the plan document alone at any moment.
2. **Unattended
   Execution:** The user gives no input until the plan/epic is marked finished. If an item is blocked, make a thorough effort to investigate and clear it. If it remains blocked, mark it blocked in the plan status table with the concrete rationale, and pivot immediately to an independent unblocked item. Never halt the entire orchestration run because one item is stuck.

### G. Progress Tracking & User Context Announcements

1. **Compact Execution Progress Tracker in the Plan:**
   The plan document must maintain a compact, at-a-glance tracker block near the top (under the title) so the user can open the document and see progress in one view:
   ```text
   ### Execution Progress Tracker

   Phase 1 (The Core Data Layer · [IN PROGRESS])
     #1  1.1.1 [✓]  1.1.2 [✓]
     #2  1.2.1 [✓]  1.2.2 [ ]
     #3  1.3.1 [ ]  1.3.2 [ ]

   Phase 1b (Reasoning Effort Migration · [PENDING])
     #1  1b.1 [ ]  1b.2 [ ]  1b.3 [ ]
   ```
   Group tasks by subagent dispatch wave (`#1`, `#2`, etc.) and update `[✓]` as each item lands.
2. **Explicit User-Facing Task Announcements:**
   Whenever the operator starts or finishes an item, emit a clear, single-line announcement directly in the chat:
   - **On Start:** `▶️ Task <ID>: <Description>` (e.g. `▶️ Task 1.1.1: Re-export zstd in @gateway/node/zlib`)
   - **On
     Finish:** `✅ Task <ID>: <Description> [commit <SHA>]` (e.g. `✅ Task 1.1.1: Re-export zstd in @gateway/node/zlib [commit a1b2c3d]`)
     This gives the user immediate visibility into what is in flight without requiring them to parse internal subagent traffic.

---

## 3. The 4-Minute Keepalive Schedule (Context Cache Warmth)

Google's Gemini backend uses automatic implicit prefix caching with an idle eviction window of **~5
minutes**. If the parent orchestrator sits idle waiting for subagents without traffic, the server evicts the conversation prefix cache, causing massive latency and token rebuild spikes on the next turn.

### Mandatory Protocol:

1. When dispatching subagents or long-running tasks, **schedule a 4-minute keepalive check-in**:
   * Mode: One-shot `DurationSeconds=240` using the `schedule` tool.
   * Prompt: `"Check subagent status, inspect progress, and maintain context cache warmth."`
2. When the timer fires:
   * Inspect active subagents via `manage_subagents` with action `list`.
   * If subagents are still working, renew the timer and yield.
   * Once subagents finish, immediately proceed to the next orchestration step.

---

## 4. Execution Workflow per Batch

For each batch in the plan:

```text
[Orchestrator]
      │
      ▼
1. Dispatch `batch_planner` (Validate explicit file paths, contracts, and boundaries)
      │
      ▼
2. Review Planner Report & Update Plan Document
      │
      ▼
3. Dispatch `batch_worker` (Implement changes on 1–3 files & run scoped ward)
      │
      ▼
4. Dispatch `batch_reviewer` (Audit git diff, check invariants, run regression)
      │
      ▼
5. Orchestrator Runs `npm run ward -- --uncommitted`, Stages Explicit Files,
   Updates Plan Document, and Commits Cleanly
```
