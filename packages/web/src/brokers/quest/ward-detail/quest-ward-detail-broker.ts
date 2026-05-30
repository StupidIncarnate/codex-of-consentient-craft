/**
 * PURPOSE: Fetches the detail blob for one ward result from the per-quest ward-detail HTTP endpoint
 * and parses it into the WardDetail shape the breakdown renderer consumes.
 *
 * USAGE:
 * const detail = await questWardDetailBroker({ questId, wardResultId });
 * // Returns WardDetail (checks[] with per-file errors / per-suite test failures)
 */

import type { QuestId, WardResult } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { wardDetailContract } from '../../../contracts/ward-detail/ward-detail-contract';
import type { WardDetail } from '../../../contracts/ward-detail/ward-detail-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questWardDetailBroker = async ({
  questId,
  wardResultId,
}: {
  questId: QuestId;
  wardResultId: WardResult['id'];
}): Promise<WardDetail> => {
  const url = webConfigStatics.api.routes.questWardDetail
    .replace(':questId', questId)
    .replace(':wardResultId', wardResultId);

  const response = await fetchGetAdapter<unknown>({ url });

  return wardDetailContract.parse(response);
};
