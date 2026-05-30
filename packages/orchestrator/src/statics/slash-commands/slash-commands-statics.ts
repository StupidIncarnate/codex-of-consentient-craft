/**
 * PURPOSE: Bodies of the `/dumpster-create` and `/dumpster-launch` slash commands installed into
 * `<targetProjectRoot>/.claude/commands/` so users can launch the Dumpster spec conversation
 * (ChaosWhisperer) and the always-on dispatch loop from their interactive Claude Code session.
 *
 * USAGE:
 * slashCommandsStatics.dumpsterCreate.body;
 * // Returns the full markdown body (YAML frontmatter + ChaosWhisperer prompt) written to
 * // dumpster-create.md. The slash command body IS the chaos prompt — there is no MCP-fetch
 * // indirection, so the create-quest + open-UI + spec-conversation instructions all live in
 * // the single prompt template and the agent executes them in order without ever handing
 * // control back to a wrapper.
 *
 * slashCommandsStatics.dumpsterLaunch.body;
 * // Returns the full markdown body written to dumpster-launch.md
 *
 * The frontmatter `allowed-tools` lines drive Claude Code's tool gating — preserve them verbatim.
 */

import { dumpsterCreatePromptStatics } from '../dumpster-create-prompt/dumpster-create-prompt-statics';
import { dumpsterHuntPromptStatics } from '../dumpster-hunt-prompt/dumpster-hunt-prompt-statics';

const DUMPSTER_CREATE_FRONTMATTER = `---
description: Run a Dumpster spec conversation (ChaosWhisperer)
allowed-tools: mcp__dungeonmaster__*, Bash, Read, Glob, Grep, Edit, Write, Task
---`;

const DUMPSTER_HUNT_FRONTMATTER = `---
description: Run a Dumpster bug-hunt intake (BugHunt)
allowed-tools: mcp__dungeonmaster__*, Bash, Read, Glob, Grep, Edit, Write, Task
---`;

export const slashCommandsStatics = {
  dumpsterCreate: {
    fileName: 'dumpster-create.md',
    body: `${DUMPSTER_CREATE_FRONTMATTER}\n\n${dumpsterCreatePromptStatics.prompt.template}\n`,
  },
  dumpsterHunt: {
    fileName: 'dumpster-hunt.md',
    body: `${DUMPSTER_HUNT_FRONTMATTER}\n\n${dumpsterHuntPromptStatics.prompt.template}\n`,
  },
  dumpsterLaunch: {
    fileName: 'dumpster-launch.md',
    body: `---
description: Run the Dumpster orchestration loop across all approved quests
allowed-tools: mcp__dungeonmaster__*, Task, Bash
---

You are the dispatch loop for ALL approved Dumpster quests. The MCP server is the state machine; you are the dispatcher. Do NOT decide which agent runs next. Do NOT skip steps. Do NOT terminate on a quest failure — keep churning.

Loop forever:

1. Call \`mcp__dungeonmaster__get-next-step()\` with NO arguments. This may block up to ~25 s — that is normal.
2. Switch on \`result.type\`:
   - \`spawn-agents\`: dispatch ALL listed agents IN PARALLEL via the Task tool. Each Task's prompt is \`taskPrompt\` verbatim (the questId is already interpolated). AWAIT all Tasks before continuing.
   - \`run-ward\`: call \`mcp__dungeonmaster__run-ward({ questId: result.questId, workItemId: result.workItemId, mode: result.mode })\`. This blocks while ward runs (minutes). Wait for it.
   - \`idle\`: no work right now. Sleep for 30 minutes and then call \`get-next-step()\` again.
3. Loop back to 1.
`,
  },
} as const;
