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
    - Follow the batch pipeline:
        1. Dispatch `batch_planner` inside worktree to verify explicit file paths and contracts.
        2. Review planner output and update the plan document.
      3. Dispatch `batch_worker` subagents in parallel for all items in the current row (1–3 files per worker) inside worktree to implement and run scoped ward concurrently.
        4. Dispatch `batch_reviewer` inside worktree to audit git diff and run regression.
        5. Run `npm run ward -- --uncommitted` in worktree, stage explicit files, update the Execution Progress Tracker, and commit in worktree.
5. **Autonomous
   Pacing:** The user gives no input until the plan is finished. If an item is blocked, investigate; if it cannot be cleared, record the blocker reason in the plan and pivot to unblocked items. Never halt the run because one item is stuck.
