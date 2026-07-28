/**
 * PURPOSE: Branded UUID for quest comment identity
 *
 * USAGE:
 * questCommentIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: QuestCommentId branded string
 *
 * WHEN-TO-USE: For comment IDs on quest.comments[], minted at runtime when a user queues a comment
 * WHEN-NOT-TO-USE: For authored/slug-style IDs (comments have no authored name, unlike e.g. ObservableId)
 */

import { z } from 'zod';

export const questCommentIdContract = z.string().uuid().brand<'QuestCommentId'>();

export type QuestCommentId = z.infer<typeof questCommentIdContract>;
