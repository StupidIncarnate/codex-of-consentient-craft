/**
 * PURPOSE: Handles directory browse requests by validating input and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = DirectoryBrowseResponder({ body: { path: '/some/path' } });
 * // Returns { status: 200, data: entries[] } or { status: 500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { directoryBrowseBodyContract } from '../../../contracts/directory-browse-body/directory-browse-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { directoryBrowseResponseDataContract } from '../../../contracts/directory-browse-response-data/directory-browse-response-data-contract';

export const DirectoryBrowseResponder = ({ body }: { body: unknown }): ResponderResult => {
  try {
    const parsedBody =
      typeof body === 'object' && body !== null
        ? directoryBrowseBodyContract.safeParse(body)
        : undefined;
    const path = parsedBody?.success ? parsedBody.data.path : undefined;

    const entries = StartOrchestrator.browseDirectories(path === undefined ? {} : { path });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: directoryBrowseResponseDataContract.parse(entries),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to browse directories';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
