/**
 * PURPOSE: Records a person's verdict on one `verifyByHuman` observable by POSTing to the per-quest
 * human-verdict endpoint. `unitId` is the RAW observable id (`QuestSummaryObservable.observableId`),
 * not the derived checklist unit id — `questHumanVerdictRecordBroker` (orchestrator) matches it
 * against `String(observable.id)` off the flow graph.
 *
 * USAGE:
 * const result = await questHumanVerdictBroker({ questId, unitId, outcome: 'met', reason });
 * // Returns { ok: true } on success, throws with the server's reason on refusal or failure
 */

import type { ObservableId, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostWithStatusAdapter } from '../../../adapters/fetch/post-with-status/fetch-post-with-status-adapter';
import { humanVerdictResponseContract } from '../../../contracts/human-verdict-response/human-verdict-response-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questHumanVerdictBroker = async ({
  questId,
  unitId,
  outcome,
  reason,
}: {
  questId: QuestId;
  unitId: ObservableId;
  outcome: 'met' | 'not-met';
  reason: string;
}): Promise<{ ok: true }> => {
  const url = webConfigStatics.api.routes.questHumanVerdict.replace(':questId', questId);
  const result = await fetchPostWithStatusAdapter({ url, body: { unitId, outcome, reason } });
  const parsed = humanVerdictResponseContract.safeParse(result.body);

  if (result.ok && parsed.success && parsed.data.ok === true) {
    return { ok: true };
  }

  throw new Error(
    parsed.success && parsed.data.error !== undefined
      ? parsed.data.error
      : `POST ${url} failed with status ${String(result.status)}`,
  );
};
