/**
 * PURPOSE: Orchestrates quest start, status retrieval, and startup recovery by delegating to orchestration responders
 *
 * USAGE:
 * const processId = await OrchestrationFlow.start({ questId });
 * const status = OrchestrationFlow.getStatus({ processId });
 * const recovered = await OrchestrationFlow.recoverActiveQuests({ guildItems });
 */

import { ChatStopAllResponder } from '../../responders/chat/stop-all/chat-stop-all-responder';
import { OrchestrationGetStatusResponder } from '../../responders/orchestration/get-status/orchestration-get-status-responder';
import { OrchestrationStartResponder } from '../../responders/orchestration/start/orchestration-start-responder';
import { OrchestrationStartupRecoveryResponder } from '../../responders/orchestration/startup-recovery/orchestration-startup-recovery-responder';

type StartParams = Parameters<typeof OrchestrationStartResponder>[0];
type StartResult = Awaited<ReturnType<typeof OrchestrationStartResponder>>;

type GetStatusParams = Parameters<typeof OrchestrationGetStatusResponder>[0];
type GetStatusResult = ReturnType<typeof OrchestrationGetStatusResponder>;

type RecoverParams = Parameters<typeof OrchestrationStartupRecoveryResponder>[0];
type RecoverResult = ReturnType<typeof OrchestrationStartupRecoveryResponder>;

export const OrchestrationFlow = {
  start: async ({ questId }: StartParams): Promise<StartResult> =>
    OrchestrationStartResponder({ questId }),

  getStatus: ({ processId }: GetStatusParams): GetStatusResult =>
    OrchestrationGetStatusResponder({ processId }),

  recoverActiveQuests: async ({ guildItems }: RecoverParams): Promise<Awaited<RecoverResult>> =>
    OrchestrationStartupRecoveryResponder({ guildItems }),

  stopAll: (): void => {
    ChatStopAllResponder();
  },
};
