/**
 * PURPOSE: Writes the dungeonmaster guild config, into a caller-supplied home when one arrives and
 * into the process-wide resolution otherwise. A caller supplies one when the registration belongs
 * to a home it was HANDED rather than the one the process happens to point at — a hydration seed
 * populating a target directory. The `??` is what keeps that promise: with a home supplied,
 * `dungeonmasterHomeFindBroker` is never called, so `DUNGEONMASTER_HOME` is never read.
 *
 * USAGE:
 * await guildConfigWriteBroker({ config: GuildConfigStub({ guilds: [guild] }) });
 * // Writes pretty-printed JSON to ~/.dungeonmaster/config.json
 *
 * await guildConfigWriteBroker({ config, home: absoluteFilePathContract.parse('/tmp/dm-home') });
 * // Writes /tmp/dm-home/config.json, whatever DUNGEONMASTER_HOME says
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { adapterResultContract, fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, AdapterResult, GuildConfig } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { questStatics } from '../../../statics/quest/quest-statics';

export const guildConfigWriteBroker = async ({
  config,
  home,
}: {
  config: GuildConfig;
  home?: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const homePath = home ?? dungeonmasterHomeFindBroker().homePath;

  const configFilePath = pathJoinAdapter({
    paths: [homePath, dungeonmasterHomeStatics.paths.configFile],
  });

  const contents = fileContentsContract.parse(
    JSON.stringify(config, null, questStatics.json.indentSpaces),
  );

  await fsWriteFileAdapter({ filePath: configFilePath, contents });
  return adapterResultContract.parse({ success: true });
};
