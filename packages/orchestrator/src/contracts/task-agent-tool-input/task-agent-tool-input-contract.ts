/**
 * PURPOSE: Validates the input object shape of a parent assistant Task/Agent tool_use content item — at minimum the `prompt` string Claude CLI writes verbatim as the first user-text line of the spawned subagent's JSONL file.
 *
 * USAGE:
 * const parsed = taskAgentToolInputContract.safeParse(item.input);
 * if (parsed.success) console.log(parsed.data.prompt);
 */

import { z } from 'zod';

import { taskAgentToolPromptContract } from '../task-agent-tool-prompt/task-agent-tool-prompt-contract';

export const taskAgentToolInputContract = z
  .object({
    prompt: taskAgentToolPromptContract,
  })
  .passthrough();

export type TaskAgentToolInput = z.infer<typeof taskAgentToolInputContract>;
