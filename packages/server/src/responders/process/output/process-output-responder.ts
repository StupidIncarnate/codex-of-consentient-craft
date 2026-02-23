/**
 * PURPOSE: Handles process output requests by reading agent output buffer state for a given process
 *
 * USAGE:
 * const result = ProcessOutputResponder({ params: { processId: 'proc-123' } });
 * // Returns { status: 200, data: { slots: { 0: [...lines] } } } or { status: 400/500, data: { error } }
 */

import { processIdContract } from '../../../contracts/process-id/process-id-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { agentOutputBufferState } from '../../../state/agent-output-buffer/agent-output-buffer-state';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import type { AgentOutputLine } from '../../../contracts/agent-output-line/agent-output-line-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';

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
    const processId = processIdContract.parse(processIdRaw);
    const processBuffers = agentOutputBufferState.getProcessOutput({ processId });

    if (!processBuffers) {
      return responderResultContract.parse({
        status: httpStatusStatics.success.ok,
        data: { slots: {} },
      });
    }

    const slots: Record<SlotIndex, AgentOutputLine[]> = {};
    for (const [slotIndex, lines] of processBuffers) {
      slots[slotIndex] = lines;
    }
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: { slots } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get process output';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
