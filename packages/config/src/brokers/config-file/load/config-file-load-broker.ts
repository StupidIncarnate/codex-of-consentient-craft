/**
 * PURPOSE: Loads and validates .dungeonmaster config file from filesystem
 *
 * USAGE:
 * await configFileLoadBroker({configPath: FilePathStub({value: '/project/.dungeonmaster'})});
 * // Returns validated DungeonmasterConfig object
 */

import { readFile } from '#gateway/node/fs__promises';
import { InvalidConfigError } from '../../../errors/invalid-config/invalid-config-error';
import {
  dungeonmasterConfigContract,
  type DungeonmasterConfig,
} from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';

export const configFileLoadBroker = async ({
  configPath,
}: {
  configPath: string;
}): Promise<DungeonmasterConfig> => {
  try {
    // Read the config file
    const filePath = configPath;
    const fileContents = await readFile(filePath);

    // Validate and return
    return dungeonmasterConfigContract.parse(JSON.parse(fileContents));
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
