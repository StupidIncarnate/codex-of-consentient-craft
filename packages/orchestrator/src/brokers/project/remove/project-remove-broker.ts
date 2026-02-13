/**
 * PURPOSE: Removes a project from the dungeonmaster config without deleting quest files
 *
 * USAGE:
 * await projectRemoveBroker({ projectId: ProjectIdStub({ value: 'f47ac10b-...' }) });
 * // Removes project from config; quest files on disk are preserved
 * // Throws if project not found
 */

import type { ProjectId } from '@dungeonmaster/shared/contracts';

import { projectConfigReadBroker } from '../../project-config/read/project-config-read-broker';
import { projectConfigWriteBroker } from '../../project-config/write/project-config-write-broker';

export const projectRemoveBroker = async ({
  projectId,
}: {
  projectId: ProjectId;
}): Promise<void> => {
  const config = await projectConfigReadBroker();

  const exists = config.projects.some((p) => p.id === projectId);

  if (!exists) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const updatedProjects = config.projects.filter((p) => p.id !== projectId);

  await projectConfigWriteBroker({ config: { projects: updatedProjects } });
};
