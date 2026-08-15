/**
 * PURPOSE: Fetches the carve log for one riftcarver result from the per-quest riftcarver-detail HTTP
 * endpoint and parses it into the RiftcarverDetail shape the log renderer consumes.
 *
 * USAGE:
 * const detail = await questRiftcarverDetailBroker({ questId, riftcarverResultId });
 * // Returns RiftcarverDetail ({ log } — the full persisted carve log as one string)
 */

import type { QuestId, RiftcarverResult } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { riftcarverDetailContract } from '../../../contracts/riftcarver-detail/riftcarver-detail-contract';
import type { RiftcarverDetail } from '../../../contracts/riftcarver-detail/riftcarver-detail-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questRiftcarverDetailBroker = async ({
  questId,
  riftcarverResultId,
}: {
  questId: QuestId;
  riftcarverResultId: RiftcarverResult['id'];
}): Promise<RiftcarverDetail> => {
  const url = webConfigStatics.api.routes.questRiftcarverDetail
    .replace(':questId', questId)
    .replace(':riftcarverResultId', riftcarverResultId);

  const response = await fetchGetAdapter<unknown>({ url });

  return riftcarverDetailContract.parse(response);
};
