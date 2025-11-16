/**
 * PURPOSE: Recursively finds and collects parent .questmaestro config files up the directory tree
 *
 * USAGE:
 * await findParentConfigsLayerBroker({
 *   currentPath: FilePathStub({value: '/project/src'}),
 *   originalConfigPath: FilePathStub({value: '/project/src/.questmaestro'}),
 *   configs: []
 * });
 * // Populates configs array with parent configurations
 */

import { configFileFindBroker } from '../../config-file/find/config-file-find-broker';
import { configFileLoadBroker } from '../../config-file/load/config-file-load-broker';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import type { FilePath } from '@questmaestro/shared/contracts';
import type { QuestmaestroConfig } from '../../../contracts/questmaestro-config/questmaestro-config-contract';

export const findParentConfigsLayerBroker = async ({
  currentPath,
  originalConfigPath,
  configs,
}: {
  currentPath: FilePath;
  originalConfigPath: FilePath;
  configs: QuestmaestroConfig[];
}): Promise<void> => {
  try {
    const parentConfigPath = await configFileFindBroker({ startPath: currentPath });

    // Stop if we found the same config (no parent)
    if (parentConfigPath === originalConfigPath) {
      return;
    }

    const parentConfig = await configFileLoadBroker({
      configPath: parentConfigPath,
    });

    // Add parent config to the front of the array (for proper merging order)
    configs.unshift(parentConfig);

    // If parent is monorepo root, stop looking
    if (parentConfig.framework === 'monorepo') {
      return;
    }

    // Continue searching up the tree
    const nextPath = pathDirnameAdapter({ path: parentConfigPath });
    await findParentConfigsLayerBroker({ currentPath: nextPath, originalConfigPath, configs });
  } catch {
    // No more parent configs found
  }
};
