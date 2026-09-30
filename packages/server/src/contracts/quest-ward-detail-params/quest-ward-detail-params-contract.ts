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
import { questContract, wardResultContract } from '@dungeonmaster/shared/contracts';

export const questWardDetailParamsContract = z
  .object({
    questId: questContract.shape.id,
    wardResultId: wardResultContract.shape.id,
  })
  .brand<'QuestWardDetailParams'>();

export type QuestWardDetailParams = z.infer<typeof questWardDetailParamsContract>;
