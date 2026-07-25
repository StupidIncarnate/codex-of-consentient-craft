/**
 * PURPOSE: Resumes a paused quest by sending a POST request to the quest resume API endpoint
 *
 * USAGE:
 * await questResumeBroker({questId});
 * // Returns {resumed: true, restoredStatus: QuestStatus, dispatch: {started: true}} on success,
 * //   throws on failure
 *
 * The endpoint starts the Node dispatcher as part of the resume, so `dispatch.started` says
 * whether the queue is actually moving. It is `false` with a `reason` when the exclusivity gate
 * refused — a live `/dumpster-launch` loop still owns the queue.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import type { QuestResumeOutcome } from '../../../contracts/quest-resume-outcome/quest-resume-outcome-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questResumeBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestResumeOutcome> =>
  fetchPostAdapter<QuestResumeOutcome>({
    url: webConfigStatics.api.routes.questResume.replace(':questId', questId),
    body: {},
  });
