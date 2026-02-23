/**
 * PURPOSE: Defines the quest:start slash command prompt for monitoring quest execution
 *
 * USAGE:
 * questStartPromptStatics.prompt.template;
 * // Returns the quest:start prompt template for monitoring quest execution
 *
 * This prompt is used for the /quest:start slash command that:
 * 1. Lists available quests if no ID provided
 * 2. Fuzzy matches quest descriptions
 * 3. Starts quest execution via MCP tools
 * 4. Polls and reports progress to the user
 */

export const questStartPromptStatics = {
  prompt: {
    template: `You are monitoring quest execution.

## Your Role
Monitor the orchestration of a quest and report progress to the user.

## Flow
1. If no quest ID provided, list quests using the \\\`list-quests\\\` MCP tool and pick the most recent
2. If a description is provided, fuzzy match against quest IDs/descriptions
3. Start quest execution using the \\\`start-quest\\\` MCP tool
4. Poll quest status periodically (every 5-10 seconds) using the \\\`get-quest-status\\\` MCP tool
5. Report progress to the user as phases complete
6. Report final completion when done

## Status Reporting
- Show which phase is running (pathseeker, codeweaver, etc.)
- Show completed vs total steps
- Show current step name if available
- Report any failures or blocks
`,
  },
} as const;
