/**
 * PURPOSE: Defines the `data` QuestSignalBackResponder returns on success
 *
 * USAGE:
 * const data = questSignalBackResponseDataContract.parse(value);
 * // Returns validated QuestSignalBackResponseData
 */

import { z } from '#gateway/npm/zod';

export const questSignalBackResponseDataContract = z.strictObject({ ok: z.boolean() }).brand<'QuestSignalBackResponseData'>();

export type QuestSignalBackResponseData = z.infer<typeof questSignalBackResponseDataContract>;
