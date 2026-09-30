/**
 * PURPOSE: Defines the data `ClarifyAnswerFlow` returns
 *
 * USAGE:
 * clarifyAnswerResultContract.parse(value);
 * // Returns validated ClarifyAnswerResult
 */
import { z } from '#gateway/npm/zod';

export const clarifyAnswerResultContract = z
  .object({ chatProcessId: z.string().brand<'ClarifyAnswerResultChatProcessId'>() })
  .brand<'ClarifyAnswerResult'>();

export type ClarifyAnswerResult = z.infer<typeof clarifyAnswerResultContract>;
