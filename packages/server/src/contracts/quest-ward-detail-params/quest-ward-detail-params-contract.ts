/**
 * PURPOSE: Defines the validated shape for HTTP route params of the ward-detail endpoint — a questId
 * plus the UUID of the ward result whose detail blob is being fetched. The wardResultId is validated
 * as a UUID so it can be safely interpolated into the on-disk `<wardResultId>.json` path.
 *
 * USAGE:
 * const { questId, wardResultId } = questWardDetailParamsContract.parse(params);
 * // Returns: QuestWardDetailParams with branded QuestId + WardResultId
 */

import { z } from 'zod';
import { questIdContract } from '@dungeonmaster/shared/contracts';

export const questWardDetailParamsContract = z.object({
  questId: questIdContract,
  wardResultId: z.string().uuid().brand<'WardResultId'>(),
});

export type QuestWardDetailParams = z.infer<typeof questWardDetailParamsContract>;
