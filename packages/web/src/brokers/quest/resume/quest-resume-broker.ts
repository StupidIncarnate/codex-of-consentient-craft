/**
 * PURPOSE: Resumes a paused quest by sending a POST request to the quest resume API endpoint
 *
 * USAGE:
 * await questResumeBroker({questId});
 * // Returns {resumed: true, restoredStatus: QuestStatus, dispatch: {started: true}} on success,
 * //   throws on failure
 *
 * The endpoint starts the Node dispatcher as part of the resume, so `dispatch.started` says
 * whether the queue is actually moving. It is `false` with a `reason` when the play call itself
 * threw, or when the quest has no dispatchable work.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { questResumeOutcomeContract } from '../../../contracts/quest-resume-outcome/quest-resume-outcome-contract';
import type { QuestResumeOutcome } from '../../../contracts/quest-resume-outcome/quest-resume-outcome-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questResumeBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestResumeOutcome> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.questResume.replace(':questId', questId),
    method: 'POST',
    body: undefined,
  });

  return questResumeOutcomeContract.parse(response);
};
