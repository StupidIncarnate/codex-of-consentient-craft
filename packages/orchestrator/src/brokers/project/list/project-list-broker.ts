/**
 * PURPOSE: Lists all registered projects with runtime validity and quest count information
 *
 * USAGE:
 * const items = await projectListBroker();
 * // Returns: ProjectListItem[] with valid flag and questCount for each project
 */

import { fsReaddirWithTypesAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract, projectListItemContract } from '@dungeonmaster/shared/contracts';
import type { ProjectListItem } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { pathIsAccessibleBroker } from '../../path/is-accessible/path-is-accessible-broker';
import { projectConfigReadBroker } from '../../project-config/read/project-config-read-broker';

export const projectListBroker = async (): Promise<ProjectListItem[]> => {
  const config = await projectConfigReadBroker();
  const { homePath } = dungeonmasterHomeFindBroker();

  const items = await Promise.all(
    config.projects.map(async (project) => {
      const valid = await pathIsAccessibleBroker({ path: project.path });

      const questsDirPath = pathJoinAdapter({
        paths: [
          homePath,
          dungeonmasterHomeStatics.paths.projectsDir,
          project.id,
          dungeonmasterHomeStatics.paths.questsDir,
        ],
      });

      const questsDir = absoluteFilePathContract.parse(questsDirPath);

      let questCount = 0;
      try {
        const entries = fsReaddirWithTypesAdapter({ dirPath: questsDir });
        questCount = entries.filter((entry) => entry.isDirectory()).length;
      } catch {
        // Directory doesn't exist yet - default to 0
      }

      return projectListItemContract.parse({
        ...project,
        valid,
        questCount,
      });
    }),
  );

  return items;
};
