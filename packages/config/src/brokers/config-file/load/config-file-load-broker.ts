import { fsReadFile } from '../../../adapters/fs/fs-read-file';
import { nodeRequire } from '../../../adapters/node/node-require-single';
import { nodeRequireClearCache } from '../../../adapters/node/node-require-clear-cache';
import { InvalidConfigError } from '../../../errors/invalid-config/invalid-config-error';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import {
  questmaestroConfigContract,
  type QuestmaestroConfig,
} from '../../../contracts/questmaestro-config/questmaestro-config-contract';

const loadConfigModule = ({ configPath }: { configPath: string }): unknown => {
  // Clear require cache to ensure fresh load
  nodeRequireClearCache({ modulePath: configPath });

  // Load the config file (assumes it's a .js module)
  const configModule = nodeRequire({ modulePath: configPath });

  if (
    configModule !== null &&
    configModule !== undefined &&
    typeof configModule === 'object' &&
    'default' in configModule
  ) {
    return (configModule as Record<string, unknown>).default;
  }

  return configModule;
};

export const configFileLoadBroker = async ({
  configPath,
}: {
  configPath: string;
}): Promise<QuestmaestroConfig> => {
  try {
    // Read file to ensure it exists and is accessible
    const filePath = filePathContract.parse(configPath);
    await fsReadFile({ filePath });

    // Load and parse the config
    const config = loadConfigModule({ configPath });
    return questmaestroConfigContract.parse(config);
  } catch (error) {
    if (error instanceof InvalidConfigError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new InvalidConfigError({
      message: `Failed to load config file: ${errorMessage}`,
      configPath,
    });
  }
};
