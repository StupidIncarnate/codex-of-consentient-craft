/**
 * PURPOSE: Fetches the current orchestration status for a running process
 *
 * USAGE:
 * const status = await processStatusBroker({processId});
 * // Returns OrchestrationStatus object
 */
import type { OrchestrationStatus, ProcessId } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const processStatusBroker = async ({
  processId,
}: {
  processId: ProcessId;
}): Promise<OrchestrationStatus> =>
  fetchGetAdapter<OrchestrationStatus>({
    url: webConfigStatics.api.routes.processStatus.replace(':processId', processId),
  });
