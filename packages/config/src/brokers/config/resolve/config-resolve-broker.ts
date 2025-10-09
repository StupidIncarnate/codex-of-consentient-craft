import { configFileFindBroker } from '../../config-file/find/config-file-find-broker';
import { configFileLoadBroker } from '../../config-file/load/config-file-load-broker';
import { mergeConfigsTransformer } from '../../../transformers/merge-configs/merge-configs-transformer';
import { pathDirname } from '../../../adapters/path/path-dirname';
import { filePathContract } from '@questmaestro/shared/contracts';
import type { FilePath } from '@questmaestro/shared/contracts';
import type { QuestmaestroConfig } from '../../../contracts/questmaestro-config/questmaestro-config-contract';

const findParentConfigs = async ({
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
      configPath: filePathContract.parse(parentConfigPath),
    });

    // Add parent config to the front of the array (for proper merging order)
    configs.unshift(parentConfig);

    // If parent is monorepo root, stop looking
    if (parentConfig.framework === 'monorepo') {
      return;
    }

    // Continue searching up the tree
    const nextPath = pathDirname({ path: parentConfigPath });
    await findParentConfigs({ currentPath: nextPath, originalConfigPath, configs });
  } catch {
    // No more parent configs found
  }
};

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
    const startPath = pathDirname({ path: configPath });
    await findParentConfigs({ currentPath: startPath, originalConfigPath: configPath, configs });
  }

  // Merge all configs (root configs first, package-specific last)
  return mergeConfigsTransformer({ configs });
};
