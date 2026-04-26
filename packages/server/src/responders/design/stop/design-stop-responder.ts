/**
 * PURPOSE: Handles design sandbox stop requests by killing the Vite process and cleaning up state
 *
 * USAGE:
 * const result = await DesignStopResponder({ params: { questId: 'abc' } });
 * // Returns { status: 200, data: { stopped: true } } or { status: 400/500, data: { error } }
 */

import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { designProcessState } from '../../../state/design-process/design-process-state';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const DesignStopResponder = ({ params }: { params: unknown }): ResponderResult => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid params' },
      });
    }

    const parsedParams = questIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }
    const { questId } = parsedParams.data;
    const process = designProcessState.get({ questId });

    if (!process) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.notFound,
        data: { error: 'No running design sandbox for this quest' },
      });
    }

    process.kill();
    designProcessState.remove({ questId });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { stopped: true },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to stop design sandbox';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
