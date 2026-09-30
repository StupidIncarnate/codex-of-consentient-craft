/**
 * PURPOSE: Defines the data `FollowupChatStartResponder` returns
 *
 * USAGE:
 * followupChatStartResultContract.parse(value);
 * // Returns validated FollowupChatStartResult
 */
import { z } from '#gateway/npm/zod';

export const followupChatStartResultContract = z
  .object({ chatProcessId: z.string().brand<'FollowupChatStartResultChatProcessId'>() })
  .brand<'FollowupChatStartResult'>();

export type FollowupChatStartResult = z.infer<typeof followupChatStartResultContract>;
