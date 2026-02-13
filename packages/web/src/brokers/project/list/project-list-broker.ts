/**
 * PURPOSE: Fetches the list of all projects from the API
 *
 * USAGE:
 * const projects = await projectListBroker();
 * // Returns ProjectListItem[]
 */
import { projectListItemContract } from '@dungeonmaster/shared/contracts';
import type { ProjectListItem } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const projectListBroker = async (): Promise<ProjectListItem[]> => {
  const response = await fetchGetAdapter<unknown[]>({ url: webConfigStatics.api.routes.projects });

  return projectListItemContract.array().parse(response);
};
