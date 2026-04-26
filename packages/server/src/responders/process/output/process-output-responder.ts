/**
 * PURPOSE: Handles process output requests — returns empty since pipeline output is now streamed via WebSocket chat-output events
 *
 * USAGE:
 * const result = ProcessOutputResponder({ params: { processId: 'proc-123' } });
 * // Returns { status: 200, data: { slots: {} } } or { status: 400, data: { error } }
 */

import { processIdParamsContract } from '../../../contracts/process-id-params/process-id-params-contract';
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
    const parsedParams = processIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'processId is required' },
      });
    }

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
