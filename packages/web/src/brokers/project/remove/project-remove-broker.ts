/**
 * PURPOSE: Removes a project by sending a DELETE request to the API
 *
 * USAGE:
 * await projectRemoveBroker({projectId});
 * // Returns void after successful deletion
 */
import type { ProjectId } from '@dungeonmaster/shared/contracts';

import { fetchDeleteAdapter } from '../../../adapters/fetch/delete/fetch-delete-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const projectRemoveBroker = async ({
  projectId,
}: {
  projectId: ProjectId;
}): Promise<void> => {
  await fetchDeleteAdapter<unknown>({
    url: webConfigStatics.api.routes.projectById.replace(':projectId', projectId),
  });
};
