/**
 * PURPOSE: Defines the data `readFirstExistingCandidateLayerBroker` returns
 *
 * USAGE:
 * readFirstExistingCandidateLayerResultContract.parse(value);
 * // Returns validated ReadFirstExistingCandidateLayerResult
 */
import { z } from '#gateway/npm/zod';

export const readFirstExistingCandidateLayerResultContract = z
  .object({
    filePath: z.string().brand<'ReadFirstExistingCandidateLayerResultFilePath'>(),
    content: z.string().brand<'ReadFirstExistingCandidateLayerResultContent'>(),
  })
  .brand<'ReadFirstExistingCandidateLayerResult'>();

export type ReadFirstExistingCandidateLayerResult = z.infer<
  typeof readFirstExistingCandidateLayerResultContract
>;
