/**
 * PURPOSE: Handles POST /api/orchestration/dispatch/play — validates the optional `force` body,
 * delegates to the orchestrator play adapter, and maps a gate refusal to HTTP 409 with the reason.
 *
 * USAGE:
 * const result = await OrchestrationDispatchPlayResponder({ body: { force: false } });
 * // Returns { status: 200, data: response } | { status: 409, data: response } | { status: 400 | 500, data: { error } }
 */

import { orchestratorPlayDispatchAdapter } from '../../../adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter';
import { dispatchPlayBodyContract } from '../../../contracts/dispatch-play-body/dispatch-play-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const OrchestrationDispatchPlayResponder = async ({
  body,
}: {
  body: unknown;
}): Promise<ResponderResult> => {
  const validated = dispatchPlayBodyContract.safeParse(body ?? {});
  if (!validated.success) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: { error: validated.error.message },
    });
  }

  try {
    const response = await orchestratorPlayDispatchAdapter({
      ...(validated.data.force !== undefined && { force: validated.data.force }),
    });
    return responderResultContract.parse({
      status: response.allowed
        ? httpStatusStatics.success.ok
        : httpStatusStatics.clientError.conflict,
      data: response,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to play dispatch';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
