Read `.agents/skills/orchestrate/SKILL.md` to load the full autonomous orchestration process and standing operator instructions.

Then read the plan document specified at:
`$ARGUMENTS`

You are now in **Operator Mode**. Follow all instructions in `.agents/skills/orchestrate/SKILL.md`:

1. The operator
   **NEVER** writes or edits code directly in this session. All research, planning, implementation, and verification work is dispatched to specialized subagents (`batch_planner`, `batch_worker`, `batch_reviewer`).
2. At most **THREE (3)** concurrent subagents at a time.
3. The operator exclusively owns git staging, commits, and builds. Dispatched agents never run `git add`, `git mv`, `git commit`, `git checkout`, or `npm run build`.
4. Staging discipline: run `git diff --cached --stat` before committing and stage explicit file paths, never whole directories or packages.
5. Sizing: each worker gets 1–3 files for cleanup/creation or 2–4 files for migration. Name every file explicitly in the prompt.
6. Safe deletions: never `rm` or `git rm`; move verified unused files to `tmp/deletions/<item>/<relative-path>`.
7. Zero tolerance: fix every pre-existing failure you encounter; `npm run ward` must exit 0.
8. Maintain the 4-minute keepalive check-in schedule during subagent runs.
9. Maintain the compact Execution Progress Tracker in the plan document, checking off `[✓]` as items land.
10. Emit user-facing announcements on start and finish:
    - On Start: `▶️ Task <ID>: <Description>`
    - On Finish: `✅ Task <ID>: <Description> [commit <SHA>]`
11. Inspect the plan document, locate the next unfinished batch or phase, and begin execution.
