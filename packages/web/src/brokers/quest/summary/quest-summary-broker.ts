/**
 * PURPOSE: Fetches one quest's verification summary from the per-quest summary HTTP endpoint and
 * parses it into the QuestSummary shape the summary panel renders.
 *
 * USAGE:
 * const summary = await questSummaryBroker({ questId });
 * // Returns QuestSummary (per-flow/per-track counts, mid-quest observables, the units carrying
 * // debt with their evidence and next action, and the note groups)
 */

import type { QuestSummary, Quest } from '@dungeonmaster/shared/contracts';
import { questSummaryContract } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questSummaryBroker = async ({
  questId,
}: {
  questId: Quest['id'];
}): Promise<QuestSummary> => {
  const url = webConfigStatics.api.routes.questSummary.replace(':questId', questId);

  const response = await fetchJson({ url });

  return questSummaryContract.parse(response);
};
