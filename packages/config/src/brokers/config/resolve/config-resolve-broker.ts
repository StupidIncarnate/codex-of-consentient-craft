/**
 * PURPOSE: Resolves complete configuration by finding and merging .questmaestro files up the directory tree
 *
 * USAGE:
 * await configResolveBroker({filePath: FilePathStub({value: '/project/src/file.ts'})});
 * // Returns merged QuestmaestroConfig from package and parent configs
 */

import { configFileFindBroker } from '../../config-file/find/config-file-find-broker';
import { configFileLoadBroker } from '../../config-file/load/config-file-load-broker';
import { findParentConfigsLayerBroker } from './find-parent-configs-layer-broker';
import { mergeConfigsTransformer } from '../../../transformers/merge-configs/merge-configs-transformer';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import type { FilePath } from '@questmaestro/shared/contracts';
import type { QuestmaestroConfig } from '../../../contracts/questmaestro-config/questmaestro-config-contract';

export const configResolveBroker = async ({
  filePath,
}: {
  filePath: FilePath;
}): Promise<QuestmaestroConfig> => {
  const configs: QuestmaestroConfig[] = [];

  // Find the nearest .questmaestro file
  const configPath = await configFileFindBroker({ startPath: filePath });
  const packageConfig = await configFileLoadBroker({
    configPath,
  });
  configs.push(packageConfig);

  // If this isn't a monorepo root, look for parent configs
  if (packageConfig.framework !== 'monorepo') {
    const startPath = pathDirnameAdapter({ path: configPath });
    await findParentConfigsLayerBroker({
      currentPath: startPath,
      originalConfigPath: configPath,
      configs,
    });
  }

  // Merge all configs (root configs first, package-specific last)
  return mergeConfigsTransformer({ configs });
};
