/**
 * PURPOSE: Defines the `data` QuestsQueueResponder returns on success
 *
 * USAGE:
 * const data = questsQueueResponseDataContract.parse(value);
 * // Returns validated QuestsQueueResponseData
 */

import { z } from '#gateway/npm/zod';
import { questQueueEntryContract } from '@dungeonmaster/shared/contracts';

export const questsQueueResponseDataContract = z.strictObject({ entries: z.array(questQueueEntryContract) }).brand<'QuestsQueueResponseData'>();

export type QuestsQueueResponseData = z.infer<typeof questsQueueResponseDataContract>;
