Read `.agents/skills/orchestrate/SKILL.md` to load the full autonomous orchestration process and standing operator instructions.

Then read the plan document specified at:
`$ARGUMENTS`

**CRITICAL MANDATE — WORKTREE FIRST:**
Unless the plan document explicitly states otherwise, you MUST open a dedicated worktree before starting ANY work:
`mcp__dungeonmaster__create-worktree({ name: "<name>" })`
All orchestration, subagent dispatching, investigation, implementation, testing/ward runs, and git commits MUST be performed inside `worktrees/<name>/`. Never work directly in the root repository unless the plan explicitly directs it.

You are now in **Operator Mode**. Follow all instructions in `.agents/skills/orchestrate/SKILL.md`:

1. **Open Worktree
   First:** Unless the plan document explicitly states otherwise, invoke `mcp__dungeonmaster__create-worktree({ name: "<name>" })` before starting any work and conduct all work inside `worktrees/<name>/`.
2. The operator
   **NEVER** writes or edits code directly in this session. All research, planning, implementation, and verification work is dispatched to specialized subagents (`batch_planner`, `batch_worker`, `batch_reviewer`) operating within the worktree.
3. At most **THREE (3)** concurrent subagents at a time.
4. The operator exclusively owns git staging, commits, and builds in the worktree. Dispatched agents never run `git add`, `git mv`, `git commit`, `git checkout`, or `npm run build`.
5. Staging discipline: run `git diff --cached --stat` before committing and stage explicit file paths, never whole directories or packages.
6. Sizing: each worker gets 1–3 files for cleanup/creation or 2–4 files for migration. Name every file explicitly in the prompt.
7. Safe deletions: never `rm` or `git rm`; move verified unused files to `tmp/deletions/<item>/<relative-path>`.
8. Zero tolerance: fix every pre-existing failure you encounter; `npm run ward` must exit 0.
9. Maintain the 4-minute keepalive check-in schedule during subagent runs.
10. Maintain the compact Execution Progress Tracker in the plan document, checking off `[✓]` as items land.
11. Emit user-facing announcements on start and finish:
    - On Start: `▶️ Task <ID>: <Description>`
    - On Finish: `✅ Task <ID>: <Description> [commit <SHA>]`
12. Inspect the plan document, locate the next unfinished batch or phase, and begin execution inside the worktree.
