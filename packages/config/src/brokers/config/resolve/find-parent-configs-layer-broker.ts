/**
 * PURPOSE: Recursively finds and collects parent .dungeonmaster config files up the directory tree
 *
 * USAGE:
 * await findParentConfigsLayerBroker({
 *   currentPath: FilePathStub({value: '/project/src'}),
 *   originalConfigPath: FilePathStub({value: '/project/src/.dungeonmaster'}),
 *   configs: []
 * });
 * // Populates configs array with parent configurations
 */

import { configFileFindBroker } from '../../config-file/find/config-file-find-broker';
import { configFileLoadBroker } from '../../config-file/load/config-file-load-broker';
import { dirname } from '#gateway/node/path';
import type { DungeonmasterConfig } from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';

export const findParentConfigsLayerBroker = async ({
  currentPath,
  originalConfigPath,
  configs,
}: {
  currentPath: string;
  originalConfigPath: string;
  configs: DungeonmasterConfig[];
}): Promise<void> => {
  try {
    const parentConfigPath = await configFileFindBroker({ startPath: currentPath });

    if (parentConfigPath === originalConfigPath) {
      return;
    }

    const parentConfig = await configFileLoadBroker({
      configPath: parentConfigPath,
    });

    configs.unshift(parentConfig);

    if (parentConfig.framework === 'monorepo') {
      return;
    }

    const nextPath = dirname(parentConfigPath);
    await findParentConfigsLayerBroker({ currentPath: nextPath, originalConfigPath, configs });
  } catch {
    // No more parent configs found
  }
};
