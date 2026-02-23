/**
 * PURPOSE: Handles process status requests by validating params and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = ProcessStatusResponder({ params: { processId: 'proc-123' } });
 * // Returns { status: 200, data: status } or { status: 400/500, data: { error } }
 */

import { orchestratorGetQuestStatusAdapter } from '../../../adapters/orchestrator/get-quest-status/orchestrator-get-quest-status-adapter';
import { processIdContract } from '../../../contracts/process-id/process-id-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const ProcessStatusResponder = ({ params }: { params: unknown }): ResponderResult => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid params' },
      });
    }
    const processIdRaw: unknown = Reflect.get(params, 'processId');
    if (typeof processIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'processId is required' },
      });
    }
    const processId = processIdContract.parse(processIdRaw);
    const status = orchestratorGetQuestStatusAdapter({ processId });
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get process status';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
