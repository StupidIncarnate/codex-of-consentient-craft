---
name: operator
description: Enter operator mode to autonomously orchestrate an implementation plan via the orchestrate skill
---

You are now in **Operator Mode**.

Your goal is to autonomously orchestrate the execution of the plan document provided at:
`$ARGUMENTS` (or the path passed by the user).

### Immediate Actions:

1. **Load the
   Skill:** Read and strictly follow the orchestration process defined in [`.agents/skills/orchestrate/SKILL.md`](file://./.agents/skills/orchestrate/SKILL.md).
2. **Read the Plan
   Document:** Open and inspect the file passed as `$ARGUMENTS` (e.g. `scrolls/chronicle-llm/implementation-plan.md`). Check the progress table, completed batches, and current phase.
3. **Open
   Worktree:** Unless the plan document explicitly states otherwise, open a dedicated worktree before starting any work using `create-worktree` (`create-worktree` via Dungeonmaster MCP in Antigravity or `mcp__dungeonmaster__create-worktree({ name })` in Claude Code) with a name derived from the plan. Perform all subsequent work, subagent dispatches, verification, and commits inside `worktrees/<name>/`.
4. **Execute via Subagents:**
    - You **NEVER** write or edit code directly in the parent context.
   - All subagent operations and commands run within the worktree directory (`worktrees/<name>/`).
    - At most **THREE (3)** concurrent subagents.
   - **Parallel Worker
     Waves:** Each row in the Execution Progress Tracker (`#1`, `#2`, etc.) represents a parallel dispatch wave. All items listed side-by-side in a row MUST be executed concurrently in parallel by worker subagents (up to the 3-subagent concurrency cap). Never serialize tasks that sit side-by-side in the same row.
    - You exclusively own staging (`git add`), builds, and commits. Subagents never run git commands or builds.
   - Maintain the **4-minute keepalive check-in
     schedule** (`DurationSeconds=240`) during subagent runs to preserve Gemini context prefix cache warmth.
    - Maintain the **compact Execution Progress Tracker** in the plan document, checking off `[✓]` as items finish.
    - Emit **visible announcements** on every item start and finish:
        * Start: `▶️ Task <ID>: <Description>`
        * Finish: `✅ Task <ID>: <Description> [commit <SHA>]`
    - Follow the 3-level execution lifecycle:
        * **Level 1 (Phase Planning - ONCE per Phase/Major Wave):**
            - Dispatch ONE `batch_planner` inside worktree to blueprint the entire Phase up front.
            - Review planner blueprint and confirm progress tracker rows.
            - **NEVER spawn planners per sub-batch or per row.**
        * **Level 2 (Parallel Row Execution - Loops per Tracker Row):**
            - Announce start: `▶️ Task <ID>: <Description>` for all items in the row.
            - Dispatch parallel `batch_worker` subagents (up to 3 concurrent) for all items in the current row in a SINGLE `invoke_subagent` call.
            - Dispatch ONE `batch_reviewer` inside worktree to audit git diff, check invariants, and run scoped ward (`npm run ward -- --uncommitted`).
            - Run `npm run ward -- --uncommitted` in worktree, stage explicit files, update the Execution Progress Tracker row checkboxes `[✓]`, commit row atomically, and announce finish: `✅ Task <ID>: <Description> [commit <SHA>]`.
            - Move directly to the next row. **NEVER call a planner between rows.**
        * **Level 3 (Feature Completion & Master Merge):**
            - After all phases in the plan are complete, merge latest `master` into the feature branch in the worktree.
            - Run `npm run build` in the worktree.
            - Run bare `npm run ward` (unscoped, full monorepo sweep).
            - Only merge into `master` when full ward passes 100% green (exit code 0).
5. **Autonomous Pacing:** The user gives no input until the entire plan is finished. If an item is blocked, investigate; if it cannot be cleared, record the blocker reason in the plan and pivot to unblocked items. Never halt the run because one item is stuck.
