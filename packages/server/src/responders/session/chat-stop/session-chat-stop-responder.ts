/**
 * PURPOSE: Handles session chat stop requests by delegating to orchestrator
 *
 * USAGE:
 * const result = SessionChatStopResponder({ params: { chatProcessId: 'proc-123' } });
 * // Returns { status: 200, data: { stopped: true } } or { status: 404, data: { error } }
 */

import { processIdContract } from '../../../contracts/process-id/process-id-contract';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';
import { orchestratorStopChatAdapter } from '../../../adapters/orchestrator/stop-chat/orchestrator-stop-chat-adapter';
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

    const chatProcessId = processIdContract.parse(chatProcessIdRaw);

    processDevLogAdapter({
      message: `Session chat stop requested: processId=${chatProcessId}`,
    });

    const killed = orchestratorStopChatAdapter({ chatProcessId });

    processDevLogAdapter({
      message: `Session chat stop result: processId=${chatProcessId}, killed=${String(killed)}`,
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
