/**
 * PURPOSE: Defines the data `workItemToPromptTransformer` returns
 *
 * USAGE:
 * workItemToPromptContract.parse(value);
 * // Returns validated WorkItemToPrompt
 */
import { z } from '#gateway/npm/zod';
import { agentPromptResultContract } from '@dungeonmaster/shared/contracts';

export const workItemToPromptContract = z
  .object({
    prompt: z.string().brand<'WorkItemToPromptPrompt'>(),
    model: agentPromptResultContract.shape.model,
  })
  .brand<'WorkItemToPrompt'>();

export type WorkItemToPrompt = z.infer<typeof workItemToPromptContract>;
