/**
 * PURPOSE: Handles session chat stop requests by killing an active chat process
 *
 * USAGE:
 * const result = SessionChatStopResponder({ params: { chatProcessId: 'proc-123' } });
 * // Returns { status: 200, data: { stopped: true } } or { status: 404, data: { error } }
 */

import { processIdContract } from '../../../contracts/process-id/process-id-contract';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';
import { chatProcessState } from '../../../state/chat-process/chat-process-state';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const SessionChatStopResponder = ({ params }: { params: unknown }): ResponderResult => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid params' },
      });
    }

    const chatProcessIdRaw: unknown = Reflect.get(params, 'chatProcessId');

    if (typeof chatProcessIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'chatProcessId is required' },
      });
    }

    const processId = processIdContract.parse(chatProcessIdRaw);

    processDevLogAdapter({
      message: `Session chat stop requested: processId=${processId}`,
    });

    const killed = chatProcessState.kill({ processId });

    processDevLogAdapter({
      message: `Session chat stop result: processId=${processId}, killed=${String(killed)}`,
    });

    if (!killed) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.notFound,
        data: { error: 'Process not found or already exited' },
      });
    }

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { stopped: true },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to stop session chat';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
