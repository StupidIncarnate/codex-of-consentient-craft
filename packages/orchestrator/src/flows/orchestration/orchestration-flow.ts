/**
 * PURPOSE: Orchestrates quest start, status retrieval, and startup recovery by delegating to orchestration responders
 *
 * USAGE:
 * const processId = await OrchestrationFlow.start({ questId });
 * const status = OrchestrationFlow.getStatus({ processId });
 * const recovered = await OrchestrationFlow.recoverActiveQuests({ guildItems });
 */

import { ChatStopAllResponder } from '../../responders/chat/stop-all/chat-stop-all-responder';
import { OrchestrationAbandonResponder } from '../../responders/orchestration/abandon/orchestration-abandon-responder';
import { OrchestrationGetStatusResponder } from '../../responders/orchestration/get-status/orchestration-get-status-responder';
import { OrchestrationPauseResponder } from '../../responders/orchestration/pause/orchestration-pause-responder';
import { OrchestrationResumeResponder } from '../../responders/orchestration/resume/orchestration-resume-responder';
import { OrchestrationStartResponder } from '../../responders/orchestration/start/orchestration-start-responder';
import { OrchestrationStartupRecoveryResponder } from '../../responders/orchestration/startup-recovery/orchestration-startup-recovery-responder';

type StartParams = Parameters<typeof OrchestrationStartResponder>[0];
type StartResult = Awaited<ReturnType<typeof OrchestrationStartResponder>>;

type PauseParams = Parameters<typeof OrchestrationPauseResponder>[0];
type PauseResult = Awaited<ReturnType<typeof OrchestrationPauseResponder>>;

type ResumeParams = Parameters<typeof OrchestrationResumeResponder>[0];
type ResumeResult = Awaited<ReturnType<typeof OrchestrationResumeResponder>>;

type AbandonParams = Parameters<typeof OrchestrationAbandonResponder>[0];
type AbandonResult = Awaited<ReturnType<typeof OrchestrationAbandonResponder>>;

type GetStatusParams = Parameters<typeof OrchestrationGetStatusResponder>[0];
type GetStatusResult = ReturnType<typeof OrchestrationGetStatusResponder>;

type RecoverParams = Parameters<typeof OrchestrationStartupRecoveryResponder>[0];
type RecoverResult = ReturnType<typeof OrchestrationStartupRecoveryResponder>;

export const OrchestrationFlow = {
  start: async ({ questId }: StartParams): Promise<StartResult> =>
    OrchestrationStartResponder({ questId }),

  pause: async ({ questId }: PauseParams): Promise<PauseResult> =>
    OrchestrationPauseResponder({ questId }),

  resume: async ({ questId }: ResumeParams): Promise<ResumeResult> =>
    OrchestrationResumeResponder({ questId }),

  abandon: async ({ questId }: AbandonParams): Promise<AbandonResult> =>
    OrchestrationAbandonResponder({ questId }),

  getStatus: ({ processId }: GetStatusParams): GetStatusResult =>
    OrchestrationGetStatusResponder({ processId }),

  recoverActiveQuests: async ({ guildItems }: RecoverParams): Promise<Awaited<RecoverResult>> =>
    OrchestrationStartupRecoveryResponder({ guildItems }),

  stopAll: (): void => {
    ChatStopAllResponder();
  },
};
