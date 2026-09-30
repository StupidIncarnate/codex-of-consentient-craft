/**
 * PURPOSE: Defines the data `OrchestrationResumeResponder` returns
 *
 * USAGE:
 * orchestrationResumeResultContract.parse(value);
 * // Returns validated OrchestrationResumeResult
 */
import { z } from '#gateway/npm/zod';
import { questStatusContract } from '@dungeonmaster/shared/contracts';

export const orchestrationResumeResultContract = z
  .object({ resumed: z.boolean(), restoredStatus: questStatusContract })
  .brand<'OrchestrationResumeResult'>();

export type OrchestrationResumeResult = z.infer<typeof orchestrationResumeResultContract>;
