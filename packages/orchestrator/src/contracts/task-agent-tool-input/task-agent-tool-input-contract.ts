/**
 * PURPOSE: Validates the input object shape of a parent assistant Task/Agent tool_use content item — at minimum the `prompt` string Claude CLI writes verbatim as the first user-text line of the spawned subagent's JSONL file.
 *
 * USAGE:
 * const parsed = taskAgentToolInputContract.safeParse(item.input);
 * if (parsed.success) console.log(parsed.data.prompt);
 */

import { z } from 'zod';

export const taskAgentToolInputContract = z
  .object({
    prompt: z.string().min(1).brand<'TaskAgentToolPrompt'>(),
  })
  .passthrough();

export type TaskAgentToolInput = z.infer<typeof taskAgentToolInputContract>;
