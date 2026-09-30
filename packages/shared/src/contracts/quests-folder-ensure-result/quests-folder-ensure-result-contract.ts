/**
 * PURPOSE: Defines the data `questsFolderEnsureBroker` returns
 *
 * USAGE:
 * questsFolderEnsureResultContract.parse(value);
 * // Returns validated QuestsFolderEnsureResult
 */
import { z } from '#gateway/npm/zod';

export const questsFolderEnsureResultContract = z
  .object({ questsBasePath: z.string().brand<'QuestsFolderEnsureResultQuestsBasePath'>() })
  .brand<'QuestsFolderEnsureResult'>();

export type QuestsFolderEnsureResult = z.infer<typeof questsFolderEnsureResultContract>;
