/**
 * PURPOSE: Fetches one quest's verification summary from the per-quest summary HTTP endpoint and
 * parses it into the QuestSummary shape the summary panel renders.
 *
 * USAGE:
 * const summary = await questSummaryBroker({ questId });
 * // Returns QuestSummary (per-flow/per-track counts, mid-quest observables, unconfirmable
 * // verdicts with their reason and question, and the note groups)
 */

import type { QuestId, QuestSummary } from '@dungeonmaster/shared/contracts';
import { questSummaryContract } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questSummaryBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestSummary> => {
  const url = webConfigStatics.api.routes.questSummary.replace(':questId', questId);

  const response = await fetchGetAdapter<unknown>({ url });

  return questSummaryContract.parse(response);
};
