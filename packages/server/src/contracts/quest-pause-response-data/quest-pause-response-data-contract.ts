/**
 * PURPOSE: Defines the `data` QuestPauseResponder returns on success
 *
 * USAGE:
 * const data = questPauseResponseDataContract.parse(value);
 * // Returns validated QuestPauseResponseData
 */

import { z } from '#gateway/npm/zod';

export const questPauseResponseDataContract = z.strictObject({ paused: z.boolean() }).brand<'QuestPauseResponseData'>();

export type QuestPauseResponseData = z.infer<typeof questPauseResponseDataContract>;
