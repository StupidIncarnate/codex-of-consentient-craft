/**
 * PURPOSE: Registers a new project in the dungeonmaster config and creates its quests directory
 *
 * USAGE:
 * const project = await projectAddBroker({ name: ProjectNameStub({ value: 'My App' }), path: ProjectPathStub({ value: '/home/user/my-app' }) });
 * // Returns: Project with generated UUID, name, path, and createdAt
 */

import { dungeonmasterHomeEnsureBroker } from '@dungeonmaster/shared/brokers';
import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { projectContract } from '@dungeonmaster/shared/contracts';
import type { Project, ProjectName, ProjectPath } from '@dungeonmaster/shared/contracts';

import { projectConfigReadBroker } from '../../project-config/read/project-config-read-broker';
import { projectConfigWriteBroker } from '../../project-config/write/project-config-write-broker';

export const projectAddBroker = async ({
  name,
  path,
}: {
  name: ProjectName;
  path: ProjectPath;
}): Promise<Project> => {
  const config = await projectConfigReadBroker();

  const duplicate = config.projects.find((project) => project.path === path);
  if (duplicate) {
    throw new Error(`A project with path ${path} already exists`);
  }

  const { projectsPath } = await dungeonmasterHomeEnsureBroker();

  const id = crypto.randomUUID();

  const projectDir = pathJoinAdapter({ paths: [projectsPath, id] });
  const questsDir = pathJoinAdapter({
    paths: [projectDir, dungeonmasterHomeStatics.paths.questsDir],
  });
  await fsMkdirAdapter({ filepath: questsDir });

  const project = projectContract.parse({
    id,
    name,
    path,
    createdAt: new Date().toISOString(),
  });

  await projectConfigWriteBroker({
    config: { projects: [...config.projects, project] },
  });

  return project;
};
