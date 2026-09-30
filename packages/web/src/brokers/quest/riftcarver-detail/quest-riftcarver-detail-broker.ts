/**
 * PURPOSE: Fetches the carve log for one riftcarver result from the per-quest riftcarver-detail HTTP
 * endpoint and parses it into the RiftcarverDetail shape the log renderer consumes.
 *
 * USAGE:
 * const detail = await questRiftcarverDetailBroker({ questId, riftcarverResultId });
 * // Returns RiftcarverDetail ({ log } — the full persisted carve log as one string)
 */

import type { RiftcarverResult, Quest } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { riftcarverDetailContract } from '../../../contracts/riftcarver-detail/riftcarver-detail-contract';
import type { RiftcarverDetail } from '../../../contracts/riftcarver-detail/riftcarver-detail-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questRiftcarverDetailBroker = async ({
  questId,
  riftcarverResultId,
}: {
  questId: Quest['id'];
  riftcarverResultId: RiftcarverResult['id'];
}): Promise<RiftcarverDetail> => {
  const url = webConfigStatics.api.routes.questRiftcarverDetail
    .replace(':questId', questId)
    .replace(':riftcarverResultId', riftcarverResultId);

  const response = await fetchJson({ url });

  return riftcarverDetailContract.parse(response);
};
