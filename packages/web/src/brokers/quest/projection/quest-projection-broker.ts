/**
 * PURPOSE: Fetches one quest's projected execution remainder from the per-quest projection HTTP
 * endpoint and parses it into the QuestProjection shape the execution panel walks forward.
 *
 * USAGE:
 * const projection = await questProjectionBroker({ questId });
 * // Returns QuestProjection (each minted scope's real work items plus the planned tail,
 * // walked forward through agentFlowStatics's routes.done edge)
 */

import type { QuestId, QuestProjection } from '@dungeonmaster/shared/contracts';
import { questProjectionContract } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questProjectionBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestProjection> => {
  const url = webConfigStatics.api.routes.questProjection.replace(':questId', questId);

  const response = await fetchJson({ url });

  return questProjectionContract.parse(response);
};
