/**
 * PURPOSE: Updates an existing project's name and/or path in the dungeonmaster config
 *
 * USAGE:
 * const updated = await projectUpdateBroker({ projectId: ProjectIdStub(), name: ProjectNameStub({ value: 'New Name' }) });
 * // Returns: Updated Project object
 * // Throws if project not found or path already in use by another project
 */

import { projectContract } from '@dungeonmaster/shared/contracts';
import type { Project, ProjectId, ProjectName, ProjectPath } from '@dungeonmaster/shared/contracts';

import { projectConfigReadBroker } from '../../project-config/read/project-config-read-broker';
import { projectConfigWriteBroker } from '../../project-config/write/project-config-write-broker';

export const projectUpdateBroker = async ({
  projectId,
  name,
  path,
}: {
  projectId: ProjectId;
  name?: ProjectName;
  path?: ProjectPath;
}): Promise<Project> => {
  const config = await projectConfigReadBroker();

  const existing = config.projects.find((p) => p.id === projectId);

  if (!existing) {
    throw new Error(`Project not found: ${projectId}`);
  }

  if (path !== undefined) {
    const duplicate = config.projects.find((p) => p.path === path && p.id !== projectId);
    if (duplicate) {
      throw new Error(`A project with path ${path} already exists`);
    }
  }

  const updated = projectContract.parse({
    ...existing,
    ...(name !== undefined && { name }),
    ...(path !== undefined && { path }),
  });

  const updatedProjects = config.projects.map((p) => (p.id === projectId ? updated : p));

  await projectConfigWriteBroker({ config: { projects: updatedProjects } });

  return updated;
};
