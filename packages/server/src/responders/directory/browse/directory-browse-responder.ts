/**
 * PURPOSE: Handles directory browse requests by validating input and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = DirectoryBrowseResponder({ body: { path: '/some/path' } });
 * // Returns { status: 200, data: entries[] } or { status: 500, data: { error } }
 */

import { orchestratorBrowseDirectoriesAdapter } from '../../../adapters/orchestrator/browse-directories/orchestrator-browse-directories-adapter';
import { directoryBrowseBodyContract } from '../../../contracts/directory-browse-body/directory-browse-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const DirectoryBrowseResponder = ({ body }: { body: unknown }): ResponderResult => {
  try {
    const parsedBody =
      typeof body === 'object' && body !== null
        ? directoryBrowseBodyContract.safeParse(body)
        : undefined;
    const path = parsedBody?.success ? parsedBody.data.path : undefined;

    const entries = orchestratorBrowseDirectoriesAdapter(path === undefined ? {} : { path });
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: entries });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to browse directories';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
