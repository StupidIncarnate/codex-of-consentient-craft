/**
 * PURPOSE: Fetches the list of quests for a given project from the API
 *
 * USAGE:
 * const quests = await questListBroker({projectId});
 * // Returns QuestListItem[]
 */
import { questListItemContract } from '@dungeonmaster/shared/contracts';
import type { ProjectId, QuestListItem } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questListBroker = async ({
  projectId,
}: {
  projectId: ProjectId;
}): Promise<QuestListItem[]> => {
  const url = `${webConfigStatics.api.routes.quests}?projectId=${encodeURIComponent(projectId)}`;
  const response = await fetchGetAdapter<unknown[]>({ url });

  return questListItemContract.array().parse(response);
};
