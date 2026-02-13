/**
 * PURPOSE: Reads the dungeonmaster project config from ~/.dungeonmaster/config.json
 *
 * USAGE:
 * const config = await projectConfigReadBroker();
 * // Returns ProjectConfig with projects array, or default { projects: [] } if file missing
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { projectConfigContract } from '@dungeonmaster/shared/contracts';
import type { ProjectConfig } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

const DEFAULT_CONFIG: ProjectConfig = projectConfigContract.parse({ projects: [] });

export const projectConfigReadBroker = async (): Promise<ProjectConfig> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const configFilePath = pathJoinAdapter({
    paths: [homePath, dungeonmasterHomeStatics.paths.configFile],
  });

  try {
    const contents = await fsReadFileAdapter({ filePath: configFilePath });
    const parsed: unknown = JSON.parse(contents);
    return projectConfigContract.parse(parsed);
  } catch (error) {
    if (error instanceof Error && 'cause' in error) {
      const { cause } = error;
      if (cause instanceof Error && 'code' in cause && cause.code === 'ENOENT') {
        return DEFAULT_CONFIG;
      }
    }

    throw error;
  }
};
