/**
 * PURPOSE: Orchestrates quest start and status retrieval by delegating to orchestration responders
 *
 * USAGE:
 * const processId = await OrchestrationFlow.start({ questId });
 * const status = OrchestrationFlow.getStatus({ processId });
 */

import { OrchestrationGetStatusResponder } from '../../responders/orchestration/get-status/orchestration-get-status-responder';
import { OrchestrationStartResponder } from '../../responders/orchestration/start/orchestration-start-responder';

type StartParams = Parameters<typeof OrchestrationStartResponder>[0];
type StartResult = Awaited<ReturnType<typeof OrchestrationStartResponder>>;

type GetStatusParams = Parameters<typeof OrchestrationGetStatusResponder>[0];
type GetStatusResult = ReturnType<typeof OrchestrationGetStatusResponder>;

export const OrchestrationFlow = {
  start: async ({ questId }: StartParams): Promise<StartResult> =>
    OrchestrationStartResponder({ questId }),

  getStatus: ({ processId }: GetStatusParams): GetStatusResult =>
    OrchestrationGetStatusResponder({ processId }),
};
