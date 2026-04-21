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
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import type { AdapterResult, FilePath } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { DungeonmasterConfig } from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';

export const findParentConfigsLayerBroker = async ({
  currentPath,
  originalConfigPath,
  configs,
}: {
  currentPath: FilePath;
  originalConfigPath: FilePath;
  configs: DungeonmasterConfig[];
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  try {
    const parentConfigPath = await configFileFindBroker({ startPath: currentPath });

    if (parentConfigPath === originalConfigPath) {
      return result;
    }

    const parentConfig = await configFileLoadBroker({
      configPath: parentConfigPath,
    });

    configs.unshift(parentConfig);

    if (parentConfig.framework === 'monorepo') {
      return result;
    }

    const nextPath = pathDirnameAdapter({ path: parentConfigPath });
    await findParentConfigsLayerBroker({ currentPath: nextPath, originalConfigPath, configs });
  } catch {
    // No more parent configs found
  }
  return result;
};
