/**
 * PURPOSE: Handles process status requests by validating params and delegating to StartOrchestrator.getQuestStatus
 *
 * USAGE:
 * const result = ProcessStatusResponder({ params: { processId: 'proc-123' } });
 * // Returns { status: 200, data: status } or { status: 400/500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { processIdParamsContract } from '../../../contracts/process-id-params/process-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { orchestrationStatusContract } from '@dungeonmaster/shared/contracts';

export const ProcessStatusResponder = ({ params }: { params: unknown }): ResponderResult => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Invalid params' }),
      });
    }
    const parsedParams = processIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'processId is required' }),
      });
    }
    const { processId } = parsedParams.data;
    const status = StartOrchestrator.getQuestStatus({ processId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: orchestrationStatusContract.parse(status),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get process status';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
