/**
 * PURPOSE: Defines the data `taskPromptsFromContentTransformer` returns
 *
 * USAGE:
 * taskPromptsFromContentContract.parse(value);
 * // Returns validated TaskPromptsFromContent
 */
import { z } from '#gateway/npm/zod';
import { taskAgentToolInputContract } from '../task-agent-tool-input/task-agent-tool-input-contract';

export const taskPromptsFromContentContract = z.array(
  z
    .object({
      toolUseId: z.string().min(1).brand<'TaskPromptsFromContentToolUseId'>(),
      prompt: taskAgentToolInputContract.shape.prompt,
    })
    .brand<'TaskPromptsFromContent'>(),
);

export type TaskPromptsFromContent = z.infer<typeof taskPromptsFromContentContract>;
