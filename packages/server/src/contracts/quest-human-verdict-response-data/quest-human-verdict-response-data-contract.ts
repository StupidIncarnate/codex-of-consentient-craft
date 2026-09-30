/**
 * PURPOSE: Defines the `data` QuestHumanVerdictResponder returns on success
 *
 * USAGE:
 * const data = questHumanVerdictResponseDataContract.parse(value);
 * // Returns validated QuestHumanVerdictResponseData
 */

import { z } from '#gateway/npm/zod';

export const questHumanVerdictResponseDataContract = z.strictObject({ ok: z.boolean() }).brand<'QuestHumanVerdictResponseData'>();

export type QuestHumanVerdictResponseData = z.infer<typeof questHumanVerdictResponseDataContract>;
