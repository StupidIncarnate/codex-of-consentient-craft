/**
 * PURPOSE: Updates an existing project by sending a PATCH request with modifications to the API
 *
 * USAGE:
 * const updated = await projectUpdateBroker({projectId, modifications: {name: 'New Name'}});
 * // Returns updated Project object
 */
import { projectContract } from '@dungeonmaster/shared/contracts';
import type { Project, ProjectId } from '@dungeonmaster/shared/contracts';

import { fetchPatchAdapter } from '../../../adapters/fetch/patch/fetch-patch-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const projectUpdateBroker = async ({
  projectId,
  modifications,
}: {
  projectId: ProjectId;
  modifications: Record<string, unknown>;
}): Promise<Project> => {
  const response = await fetchPatchAdapter<unknown>({
    url: webConfigStatics.api.routes.projectById.replace(':projectId', projectId),
    body: modifications,
  });

  return projectContract.parse(response);
};
