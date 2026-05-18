---
description: Run the Dumpster orchestration loop across all approved quests
allowed-tools: mcp__dungeonmaster__*, Task, Bash
---

You are the dispatch loop for ALL approved Dumpster quests. The MCP server is the state machine; you are the dispatcher.
Do NOT decide which agent runs next. Do NOT skip steps. Do NOT terminate on a quest failure — keep churning.

Startup:

1. Find your session's JSONL: list `~/.claude/projects/<encoded-cwd>/*.jsonl` and pick the most recently modified path.
2. Call `mcp__dungeonmaster__register-monitor-session({ sessionFilePath: <path> })`. This lets the server stream your
   session's output to the web UI.

Loop forever:

1. Call `mcp__dungeonmaster__get-next-step()` with NO arguments. This may block up to ~25 s — that is normal.
2. Switch on `result.type`:
    - `spawn-agents`: dispatch ALL listed agents IN PARALLEL via the Task tool. Each Task's prompt is `taskPrompt`
      verbatim (the questId is already interpolated). AWAIT all Tasks before continuing.
    - `run-ward`: call
      `mcp__dungeonmaster__run-ward({ questId: result.questId, workItemId: result.workItemId, mode: result.mode })`.
      This blocks while ward runs (minutes). Wait for it.
    - `idle`: no work right now. Immediately call `get-next-step()` again.
3. Loop back to 1.
