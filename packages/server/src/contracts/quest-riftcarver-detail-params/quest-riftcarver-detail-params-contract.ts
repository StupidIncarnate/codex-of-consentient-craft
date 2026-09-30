/**
 * PURPOSE: Defines the validated shape for HTTP route params of the riftcarver-detail endpoint — a
 * questId plus the UUID of the riftcarver result whose plain-text carve log is being fetched. The
 * riftcarverResultId is validated as a UUID so it can be safely interpolated into the on-disk
 * `<riftcarverResultId>.log` path — this is the path-traversal guard, not a formality.
 *
 * USAGE:
 * const { questId, riftcarverResultId } = questRiftcarverDetailParamsContract.parse(params);
 * // Returns: QuestRiftcarverDetailParams with branded QuestId + RiftcarverResultId
 */

import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const questRiftcarverDetailParamsContract = z.object({
  questId: questContract.shape.id,
  riftcarverResultId: z.uuid().brand<'RiftcarverResultId'>(),
});

export type QuestRiftcarverDetailParams = z.infer<typeof questRiftcarverDetailParamsContract>;
