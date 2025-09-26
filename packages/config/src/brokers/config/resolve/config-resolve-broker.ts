import { configFileFindBroker } from '../../config-file/find/config-file-find-broker';
import { configFileLoadBroker } from '../../config-file/load/config-file-load-broker';
import { mergeConfigsTransformer } from '../../../transformers/merge-configs/merge-configs-transformer';
import { pathDirname } from '../../../adapters/path/path-dirname';
import type { QuestmaestroConfig } from '../../../contracts/questmaestro-config/questmaestro-config-contract';

export const configResolveBroker = async ({
  filePath,
}: {
  filePath: string;
}): Promise<QuestmaestroConfig> => {
  const configs: QuestmaestroConfig[] = [];

  // Find the nearest .questmaestro file
  const configPath = await configFileFindBroker({ startPath: filePath });
  const packageConfig = await configFileLoadBroker({ configPath });
  configs.push(packageConfig);

  // If this isn't a monorepo root, look for parent configs
  if (packageConfig.framework !== 'monorepo') {
    let currentPath = pathDirname({ path: configPath });

    // Look for monorepo root configs up the tree
    while (true) {
      try {
        const parentConfigPath = await configFileFindBroker({ startPath: currentPath });

        // Stop if we found the same config (no parent)
        if (parentConfigPath === configPath) {
          break;
        }

        const parentConfig = await configFileLoadBroker({ configPath: parentConfigPath });

        // Add parent config to the front of the array (for proper merging order)
        configs.unshift(parentConfig);

        // If parent is monorepo root, stop looking
        if (parentConfig.framework === 'monorepo') {
          break;
        }

        currentPath = pathDirname({ path: parentConfigPath });
      } catch {
        // No more parent configs found
        break;
      }
    }
  }

  // Merge all configs (root configs first, package-specific last)
  return mergeConfigsTransformer({ configs });
};
