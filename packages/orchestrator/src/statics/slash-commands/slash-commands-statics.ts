/**
 * PURPOSE: Bodies of the `/dumpster-create` and `/dumpster-hunt` slash commands installed into
 * `<targetProjectRoot>/.claude/commands/` so users can run the Dumpster spec conversation
 * (ChaosWhisperer) and the bug-hunt intake (BugHunt) from their interactive Claude Code session.
 *
 * USAGE:
 * slashCommandsStatics.dumpsterCreate.body;
 * // Returns the full markdown body (YAML frontmatter + ChaosWhisperer prompt) written to
 * // dumpster-create.md. The slash command body IS the chaos prompt — there is no MCP-fetch
 * // indirection, so the create-quest + open-UI + spec-conversation instructions all live in
 * // the single prompt template and the agent executes them in order without ever handing
 * // control back to a wrapper.
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
    // The slash command runs in the user's interactive terminal with no pre-created quest, so
    // ChaosWhisperer mints its own quest (the `mint` bootstrap) and uses the native AskUserQuestion
    // tool (the `native` clarify instruction). Both are substituted into the template placeholders.
    body: `${DUMPSTER_CREATE_FRONTMATTER}\n\n${dumpsterCreatePromptStatics.prompt.template
      .replace(
        dumpsterCreatePromptStatics.prompt.placeholders.questBootstrap,
        dumpsterCreatePromptStatics.questBootstrap.mint,
      )
      .replace(
        dumpsterCreatePromptStatics.prompt.placeholders.clarifyInstruction,
        dumpsterCreatePromptStatics.clarifyInstructions.native,
      )}\n`,
  },
  dumpsterHunt: {
    fileName: 'dumpster-hunt.md',
    // Same substitution as dumpsterCreate: the slash command runs in the user's interactive terminal
    // with no pre-created quest, so BugHunt mints its own (the `mint` bootstrap) and uses the native
    // AskUserQuestion tool (the `native` clarify instruction).
    body: `${DUMPSTER_HUNT_FRONTMATTER}\n\n${dumpsterHuntPromptStatics.prompt.template
      .replace(
        dumpsterHuntPromptStatics.prompt.placeholders.questBootstrap,
        dumpsterHuntPromptStatics.questBootstrap.mint,
      )
      .replace(
        dumpsterHuntPromptStatics.prompt.placeholders.clarifyInstruction,
        dumpsterHuntPromptStatics.clarifyInstructions.native,
      )}\n`,
  },
} as const;
