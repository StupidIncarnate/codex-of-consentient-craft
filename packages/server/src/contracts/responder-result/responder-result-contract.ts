/**
 * PURPOSE: Defines the standard response shape for all server responders
 *
 * USAGE:
 * const result: ResponderResult = { status: httpStatusStatics.success.ok, data: guilds };
 * // Returns typed responder result with status and data
 */

import { z } from '#gateway/npm/zod';
import { responderErrorDataContract } from '../responder-error-data/responder-error-data-contract';
import { directoryBrowseResponseDataContract } from '../directory-browse-response-data/directory-browse-response-data-contract';
import {
  addQuestResultContract,
  getQuestResultContract,
  guildContract,
  modifyQuestResultContract,
  orchestrationStatusContract,
  questProjectionContract,
  questSummaryContract,
} from '@dungeonmaster/shared/contracts';
import { guildListResponseDataContract } from '../guild-list-response-data/guild-list-response-data-contract';
import { guildRemoveResponseDataContract } from '../guild-remove-response-data/guild-remove-response-data-contract';
import { orchestrationDispatchGetResponseDataContract } from '../orchestration-dispatch-get-response-data/orchestration-dispatch-get-response-data-contract';
import { orchestrationDispatchPauseResponseDataContract } from '../orchestration-dispatch-pause-response-data/orchestration-dispatch-pause-response-data-contract';
import { orchestrationDispatchPlayResponseDataContract } from '../orchestration-dispatch-play-response-data/orchestration-dispatch-play-response-data-contract';
import { orchestrationModeGetResponseDataContract } from '../orchestration-mode-get-response-data/orchestration-mode-get-response-data-contract';
import { questAbandonResponseDataContract } from '../quest-abandon-response-data/quest-abandon-response-data-contract';
import { questChatResponseDataContract } from '../quest-chat-response-data/quest-chat-response-data-contract';
import { questClarifyResponseDataContract } from '../quest-clarify-response-data/quest-clarify-response-data-contract';
import { questCommentBatchResponseDataContract } from '../quest-comment-batch-response-data/quest-comment-batch-response-data-contract';
import { questDeleteResponseDataContract } from '../quest-delete-response-data/quest-delete-response-data-contract';
import { questFindBySessionResponseDataContract } from '../quest-find-by-session-response-data/quest-find-by-session-response-data-contract';
import { questFollowupResponseDataContract } from '../quest-followup-response-data/quest-followup-response-data-contract';
import { questFollowupStopResponseDataContract } from '../quest-followup-stop-response-data/quest-followup-stop-response-data-contract';
import { questHumanVerdictResponseDataContract } from '../quest-human-verdict-response-data/quest-human-verdict-response-data-contract';
import { questListResponseDataContract } from '../quest-list-response-data/quest-list-response-data-contract';
import { questMergeResponseDataContract } from '../quest-merge-response-data/quest-merge-response-data-contract';
import { questNewResponseDataContract } from '../quest-new-response-data/quest-new-response-data-contract';
import { questPauseResponseDataContract } from '../quest-pause-response-data/quest-pause-response-data-contract';
import { questResumeResponseDataContract } from '../quest-resume-response-data/quest-resume-response-data-contract';
import { questRiftcarverDetailResponseDataContract } from '../quest-riftcarver-detail-response-data/quest-riftcarver-detail-response-data-contract';
import { questSignalBackResponseDataContract } from '../quest-signal-back-response-data/quest-signal-back-response-data-contract';
import { questStartResponseDataContract } from '../quest-start-response-data/quest-start-response-data-contract';
import { questWardDetailResponseDataContract } from '../quest-ward-detail-response-data/quest-ward-detail-response-data-contract';
import { questsQueueResponseDataContract } from '../quests-queue-response-data/quests-queue-response-data-contract';
import { rateLimitsGetResponseDataContract } from '../rate-limits-get-response-data/rate-limits-get-response-data-contract';
import { processOutputResponseDataContract } from '../process-output-response-data/process-output-response-data-contract';
import { sessionListResponseDataContract } from '../session-list-response-data/session-list-response-data-contract';
import { toolingSmoketestRunResponseDataContract } from '../tooling-smoketest-run-response-data/tooling-smoketest-run-response-data-contract';
import { toolingSmoketestStateResponseDataContract } from '../tooling-smoketest-state-response-data/tooling-smoketest-state-response-data-contract';

// Zod's union returns the FIRST member that parses, and a non-strict object strips the keys it does
// not list. `getQuestResult`, `modifyQuestResult` and `addQuestResult` share `success` with every
// other field optional, so each shared object member is `.strict()` here: a looser member earlier in
// the union would otherwise swallow another responder's data and drop its keys.
export const responderResultContract = z
  .object({
    status: z.number().int().brand<'ResponderResultStatus'>(),
    data: z.union([
      responderErrorDataContract,
      directoryBrowseResponseDataContract,
      guildContract.strict().brand<'ResponderResultData'>(),
      guildListResponseDataContract,
      guildRemoveResponseDataContract,
      orchestrationDispatchGetResponseDataContract,
      orchestrationDispatchPauseResponseDataContract,
      orchestrationDispatchPlayResponseDataContract,
      orchestrationModeGetResponseDataContract,
      orchestrationStatusContract.strict().brand<'ResponderResultData'>(),
      questAbandonResponseDataContract,
      questChatResponseDataContract,
      questClarifyResponseDataContract,
      questCommentBatchResponseDataContract,
      questDeleteResponseDataContract,
      questFindBySessionResponseDataContract,
      questFollowupResponseDataContract,
      questFollowupStopResponseDataContract,
      getQuestResultContract.strict().brand<'ResponderResultData'>(),
      questHumanVerdictResponseDataContract,
      questListResponseDataContract,
      questMergeResponseDataContract,
      modifyQuestResultContract.strict().brand<'ResponderResultData'>(),
      questNewResponseDataContract,
      questPauseResponseDataContract,
      questProjectionContract,
      questResumeResponseDataContract,
      questRiftcarverDetailResponseDataContract,
      questSignalBackResponseDataContract,
      questStartResponseDataContract,
      questSummaryContract,
      questWardDetailResponseDataContract,
      addQuestResultContract.strict().brand<'ResponderResultData'>(),
      questsQueueResponseDataContract,
      rateLimitsGetResponseDataContract,
      processOutputResponseDataContract,
      sessionListResponseDataContract,
      toolingSmoketestRunResponseDataContract,
      toolingSmoketestStateResponseDataContract,
    ]),
  })
  .brand<'ResponderResult'>();

export type ResponderResult = z.infer<typeof responderResultContract>;
