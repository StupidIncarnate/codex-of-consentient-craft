/**
 * PURPOSE: Handles directory browse requests by validating input and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = DirectoryBrowseResponder({ body: { path: '/some/path' } });
 * // Returns { status: 200, data: entries[] } or { status: 500, data: { error } }
 */

import { guildPathContract } from '@dungeonmaster/shared/contracts';
import { orchestratorBrowseDirectoriesAdapter } from '../../../adapters/orchestrator/browse-directories/orchestrator-browse-directories-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const DirectoryBrowseResponder = ({ body }: { body: unknown }): ResponderResult => {
  try {
    const rawPath: unknown =
      typeof body === 'object' && body !== null ? Reflect.get(body, 'path') : undefined;

    const entries = orchestratorBrowseDirectoriesAdapter(
      typeof rawPath === 'string' ? { path: guildPathContract.parse(rawPath) } : {},
    );
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: entries });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to browse directories';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
