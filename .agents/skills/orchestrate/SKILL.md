---
name: orchestrate
description: Orchestrate execution of a plan via dedicated subagents, structured pacing, and 4-minute cache check-ins
---

# Autonomous Subagent Orchestration Process

You are the **Orchestrator**. You coordinate complex plans by dispatching specialized subagents, pacing execution (parallel vs. sequential), tracking state against the plan document, and maintaining context cache warmth.

You **NEVER** write code, edit files, or execute test commands directly in the orchestrator context. All investigative, implementation, and verification work belongs strictly to subagents.

---

## 1. The Core Architecture & Roles

### A. The Orchestrator (Parent Session)
* **Owns the Plan:** Reads and updates the plan document (e.g. `scrolls/.../plans/<plan-name>.md`), checking off completed items, recording findings, and maintaining census metrics.
* **Paces the Flow:** Decides when tasks can run concurrently in parallel vs. when they must serialize (e.g., waiting for Planner review before Worker implementation).
* **Guards Invariants:** Enforces repo invariants (zero unexpected `expect(` diffs, no direct I/O in tests, architecture rules).
* **Conducts Check-ins:** Schedules keepalive timers to prevent context cache eviction during background tasks.

### B. The Subagents
Subagents do **all** the heavy lifting. They operate in isolated subagent contexts with clear, single-purpose roles:
1. **`batch_planner` (Investigation & Architecture):**
   * Inspects ASTs, contracts, existing tests, and harnesses.
   * Runs MCP tools (`get-architecture`, `get-testing-patterns`, `get-folder-detail`, `discover`).
   * Produces a concrete, step-by-step checklist and edge-case analysis.
2. **`batch_worker` (Implementation & Local Verification):**
   * Implements the code changes according to the Planner's specifications.
   * Adheres strictly to codebase architectural rules (arrow functions, JSDoc headers, typed branding).
   * Runs scoped ward checks: `npm run ward -- -- <touched-files>` or `npm run ward -- --uncommitted`.
3. **`batch_reviewer` (Independent Audit & Regression):**
   * Inspects `git status` and `git diff` to ensure no stray files or unauthorized changes.
   * Verifies critical invariants (e.g., zero assertion diffs against baseline).
   * Runs regression suites and updates metrics/census.

---

## 2. The 4-Minute Keepalive Schedule (Context Cache Warmth)

Google's Gemini backend uses automatic implicit prefix caching, with an idle eviction window of **~5 minutes**. If the parent orchestrator sits idle waiting for subagents without traffic, the server evicts the conversation prefix cache, causing a massive token rebuild spike on the next turn.

### Mandatory Protocol:
1. When dispatching long-running subagents or background tasks, **schedule a 4-minute keepalive check-in**:
   * Mode: Cron `*/4 * * * *` or one-shot `DurationSeconds=240` using the `schedule` tool.
   * Prompt: `"Check subagent status, inspect background task logs, and keep context cache warm."`
2. When the timer fires:
   * Inspect the subagents' progress (`manage_subagents` with `list` or check incoming notifications).
   * If work is still underway, acknowledge status and let the schedule continue.
   * If all subagents finished, proceed immediately with the next step of the plan.

---

## 3. Worktree & Git Discipline

1. **Dedicated Worktree:**
   * Never execute migrations or large refactors directly in the root working tree.
   * Carve an isolated worktree using `mcp__dungeonmaster__create-worktree({ name: '<feature-name>' })`.
2. **Scoped Ward Execution:**
   * Never run bare jest/tsc/playwright directly.
   * Always scope ward to the specific touched files: `npm run ward -- -- <files>`.
   * For checking uncommitted edits: `npm run ward -- --uncommitted`.
   * For checking branch commits: `npm run ward -- --committed`.
3. **Incremental Commits:**
   * Commit cleanly after each batch or logical unit passes review.
   * Maintain clean git history with descriptive conventional commit messages.
4. **Final Regression Sweep:**
   * Before merging the worktree into `master`, run a full bare `npm run ward` to guarantee zero whole-repo regressions.

---

## 4. Execution Workflow per Batch

For each batch in the plan:
```text
[Orchestrator]
      │
      ▼
1. Dispatch `batch_planner` (Analyze boundaries, contracts, and call sites)
      │
      ▼
2. Review Planner Report & Validate against Plan Document
      │
      ▼
3. Dispatch `batch_worker` (Implement changes & verify on --uncommitted)
      │
      ▼
4. Dispatch `batch_reviewer` (Audit git diff, check invariants, run regression)
      │
      ▼
5. Orchestrator Commits Batch & Updates Plan Document Progress Table
```
