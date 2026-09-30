/**
 * PURPOSE: Defines the data `taskPromptIdsExtractorTransformer` returns
 *
 * USAGE:
 * taskPromptIdsExtractorContract.parse(value);
 * // Returns validated TaskPromptIdsExtractor
 */
import { z } from '#gateway/npm/zod';
import { questContract, workItemContract } from '@dungeonmaster/shared/contracts';

export const taskPromptIdsExtractorContract = z
  .object({ questId: questContract.shape.id, workItemId: workItemContract.shape.id })
  .brand<'TaskPromptIdsExtractor'>();

export type TaskPromptIdsExtractor = z.infer<typeof taskPromptIdsExtractorContract>;
