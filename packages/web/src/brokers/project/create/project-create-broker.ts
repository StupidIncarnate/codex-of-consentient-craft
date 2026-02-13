/**
 * PURPOSE: Creates a new project by posting name and path to the API
 *
 * USAGE:
 * const result = await projectCreateBroker({name: 'My Project', path: '/home/user/my-project'});
 * // Returns {id: ProjectId}
 */
import { projectIdContract } from '@dungeonmaster/shared/contracts';
import type { ProjectId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const projectCreateBroker = async ({
  name,
  path,
}: {
  name: string;
  path: string;
}): Promise<{ id: ProjectId }> => {
  const response = await fetchPostAdapter<{ id: unknown }>({
    url: webConfigStatics.api.routes.projects,
    body: { name, path },
  });

  return { id: projectIdContract.parse(response.id) };
};
