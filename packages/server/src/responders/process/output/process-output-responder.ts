/**
 * PURPOSE: Handles process output requests — returns empty since pipeline output is now streamed via WebSocket chat-output events
 *
 * USAGE:
 * const result = ProcessOutputResponder({ params: { processId: 'proc-123' } });
 * // Returns { status: 200, data: { slots: {} } } or { status: 400, data: { error } }
 */

import { processIdContract } from '../../../contracts/process-id/process-id-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const ProcessOutputResponder = ({ params }: { params: unknown }): ResponderResult => {
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
    processIdContract.parse(processIdRaw);

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { slots: {} },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get process output';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
