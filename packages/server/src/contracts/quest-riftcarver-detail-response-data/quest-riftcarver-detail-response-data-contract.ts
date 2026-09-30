/**
 * PURPOSE: Defines the `data` QuestRiftcarverDetailResponder returns on success
 *
 * USAGE:
 * const data = questRiftcarverDetailResponseDataContract.parse(value);
 * // Returns validated QuestRiftcarverDetailResponseData
 */

import { z } from '#gateway/npm/zod';

export const questRiftcarverDetailResponseDataContract = z.strictObject({ log: z.string() }).brand<'QuestRiftcarverDetailResponseData'>();

export type QuestRiftcarverDetailResponseData = z.infer<typeof questRiftcarverDetailResponseDataContract>;
