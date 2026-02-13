/**
 * PURPOSE: Writes the dungeonmaster project config to ~/.dungeonmaster/config.json
 *
 * USAGE:
 * await projectConfigWriteBroker({ config: ProjectConfigStub({ projects: [project] }) });
 * // Writes pretty-printed JSON to ~/.dungeonmaster/config.json
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { ProjectConfig } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questStatics } from '../../../statics/quest/quest-statics';

export const projectConfigWriteBroker = async ({
  config,
}: {
  config: ProjectConfig;
}): Promise<void> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const configFilePath = pathJoinAdapter({
    paths: [homePath, dungeonmasterHomeStatics.paths.configFile],
  });

  const contents = fileContentsContract.parse(
    JSON.stringify(config, null, questStatics.json.indentSpaces),
  );

  await fsWriteFileAdapter({ filePath: configFilePath, contents });
};
