/**
 * PURPOSE: Defines the `data` QuestDeleteResponder returns on success
 *
 * USAGE:
 * const data = questDeleteResponseDataContract.parse(value);
 * // Returns validated QuestDeleteResponseData
 */

import { z } from '#gateway/npm/zod';

export const questDeleteResponseDataContract = z.strictObject({ deleted: z.boolean() }).brand<'QuestDeleteResponseData'>();

export type QuestDeleteResponseData = z.infer<typeof questDeleteResponseDataContract>;
