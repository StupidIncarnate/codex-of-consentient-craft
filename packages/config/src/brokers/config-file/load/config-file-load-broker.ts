/**
 * PURPOSE: Loads and validates .dungeonmaster config file from filesystem
 *
 * USAGE:
 * await configFileLoadBroker({configPath: FilePathStub({value: '/project/.dungeonmaster'})});
 * // Returns validated DungeonmasterConfig object
 */

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { InvalidConfigError } from '../../../errors/invalid-config/invalid-config-error';
import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';
import {
  dungeonmasterConfigContract,
  type DungeonmasterConfig,
} from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';

export const configFileLoadBroker = async ({
  configPath,
}: {
  configPath: FilePath;
}): Promise<DungeonmasterConfig> => {
  try {
    // Read the config file
    const filePath = filePathContract.parse(configPath);
    const fileContents = await fsReadFileAdapter({ filePath });

    // Parse JSON contents
    const configData: unknown = JSON.parse(fileContents);

    // Validate and return
    return dungeonmasterConfigContract.parse(configData);
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
