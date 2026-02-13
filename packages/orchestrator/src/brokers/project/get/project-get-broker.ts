/**
 * PURPOSE: Retrieves a single project by ID from the dungeonmaster config
 *
 * USAGE:
 * const project = await projectGetBroker({ projectId: ProjectIdStub({ value: 'f47ac10b-...' }) });
 * // Returns: Project object
 * // Throws if project not found
 */

import type { Project, ProjectId } from '@dungeonmaster/shared/contracts';

import { projectConfigReadBroker } from '../../project-config/read/project-config-read-broker';

export const projectGetBroker = async ({
  projectId,
}: {
  projectId: ProjectId;
}): Promise<Project> => {
  const config = await projectConfigReadBroker();

  const project = config.projects.find((p) => p.id === projectId);

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  return project;
};
