/**
 * PURPOSE: Branded non-empty string for the free text a user types onto a queued quest comment
 *
 * USAGE:
 * commentTextContract.parse('This assertion looks wrong');
 * // Returns: CommentText branded string
 *
 * WHEN-TO-USE: For the trimmed body text of a QuestComment
 * WHEN-NOT-TO-USE: For untrimmed or whitespace-only input — trim before parsing, since whitespace-only input queues nothing
 */

import { z } from 'zod';

export const commentTextContract = z.string().min(1).brand<'CommentText'>();

export type CommentText = z.infer<typeof commentTextContract>;
