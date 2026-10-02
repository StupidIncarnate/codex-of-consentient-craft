/**
 * PURPOSE: Writes the dungeonmaster home's config file, into a caller-supplied home when one arrives and
 * into the process-wide resolution otherwise. A caller supplies one when the registration belongs
 * to a home it was HANDED rather than the one the process happens to point at — a hydration seed
 * populating a target directory. The `??` is what keeps that promise: with a home supplied,
 * `dungeonmasterHomeFindBroker` is never called, so `DUNGEONMASTER_HOME` is never read.
 *
 * USAGE:
 * await homeConfigWriteBroker({ config: HomeConfigStub({ guilds: [guild] }) });
 * // Writes pretty-printed JSON to ~/.dungeonmaster/config.json
 *
 * await homeConfigWriteBroker({ config, home: '/tmp/dm-home' });
 * // Writes /tmp/dm-home/config.json, whatever DUNGEONMASTER_HOME says
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import type { HomeConfig } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import { questStatics } from '../../../statics/quest/quest-statics';

export const homeConfigWriteBroker = async ({
  config,
  home,
}: {
  config: HomeConfig;
  home?: string;
}): Promise<void> => {
  const homePath = home ?? dungeonmasterHomeFindBroker().homePath;

  const configFilePath = join(homePath, dungeonmasterHomeStatics.paths.configFile);

  await writeFile(configFilePath, JSON.stringify(config, null, questStatics.json.indentSpaces));
};
