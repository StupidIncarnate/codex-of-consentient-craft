/**
 * PURPOSE: Defines the validated shape for HTTP route params of the ward-detail endpoint — a questId
 * plus the UUID of the ward result whose detail blob is being fetched. The wardResultId is validated
 * as a UUID so it can be safely interpolated into the on-disk `<wardResultId>.json` path.
 *
 * USAGE:
 * const { questId, wardResultId } = questWardDetailParamsContract.parse(params);
 * // Returns: QuestWardDetailParams with branded QuestId + WardResultId
 */

import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questWardDetailParamsContract = z.object({
  questId: questContract.shape.id,
  wardResultId: z.uuid().brand<'WardResultId'>(),
}).brand<'QuestWardDetailParams'>();

export type QuestWardDetailParams = z.infer<typeof questWardDetailParamsContract>;
