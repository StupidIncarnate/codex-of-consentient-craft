import { fsReadFile } from '../../../adapters/fs/fs-read-file';
import { InvalidConfigError } from '../../../errors/invalid-config/invalid-config-error';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import {
  questmaestroConfigContract,
  type QuestmaestroConfig,
} from '../../../contracts/questmaestro-config/questmaestro-config-contract';
import type { FilePath } from '@questmaestro/shared/contracts';

export const configFileLoadBroker = async ({
  configPath,
}: {
  configPath: FilePath;
}): Promise<QuestmaestroConfig> => {
  try {
    // Read the config file
    const filePath = filePathContract.parse(configPath);
    const fileContents = await fsReadFile({ filePath });

    // Parse JSON contents
    const configData: unknown = JSON.parse(fileContents);

    // Validate and return
    return questmaestroConfigContract.parse(configData);
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
