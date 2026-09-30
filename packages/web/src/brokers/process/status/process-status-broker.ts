/**
 * PURPOSE: Fetches the current orchestration status for a running process
 *
 * USAGE:
 * const status = await processStatusBroker({processId});
 * // Returns OrchestrationStatus object
 */
import { orchestrationStatusContract } from '@dungeonmaster/shared/contracts';
import type { OrchestrationStatus } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const processStatusBroker = async ({
  processId,
}: {
  processId: string;
}): Promise<OrchestrationStatus> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.processStatus.replace(':processId', processId),
  });

  return orchestrationStatusContract.parse(response);
};
