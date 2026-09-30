/**
 * PURPOSE: Resolves the absolute path to a guild folder under the dungeonmaster home guilds directory
 *
 * USAGE:
 * locationsGuildPathFindBroker({ guildId: GuildIdStub() });
 * // Returns AbsoluteFilePath '<dmHome>/guilds/<guildId>'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { Guild } from '../../../contracts/guild/guild-contract';

export const locationsGuildPathFindBroker = ({
  guildId,
}: {
  guildId: Guild['id'];
}): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = join(homePath, locationsStatics.dungeonmasterHome.guildsDir, guildId);

  return absoluteFilePathContract.parse(joined);
};
