/**
 * PURPOSE: Registers a new guild in the dungeonmaster config and creates its quests directory
 *
 * USAGE:
 * const guild = await guildAddBroker({ name: GuildNameStub({ value: 'My App' }), path: GuildPathStub({ value: '/home/user/my-app' }) });
 * // Returns: Guild with generated UUID, name, path, and createdAt
 */

import { dungeonmasterHomeEnsureBroker } from '@dungeonmaster/shared/brokers';
import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { guildContract } from '@dungeonmaster/shared/contracts';
import type { Guild, GuildName, GuildPath } from '@dungeonmaster/shared/contracts';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

import { guildConfigReadBroker } from '../../guild-config/read/guild-config-read-broker';
import { guildConfigWriteBroker } from '../../guild-config/write/guild-config-write-broker';

export const guildAddBroker = async ({
  name,
  path,
}: {
  name: GuildName;
  path: GuildPath;
}): Promise<Guild> => {
  const config = await guildConfigReadBroker();

  const duplicate = config.guilds.find((guild) => guild.path === path);
  if (duplicate) {
    throw new Error(`A guild with path ${path} already exists`);
  }

  const { guildsPath } = await dungeonmasterHomeEnsureBroker();

  const id = crypto.randomUUID();

  const guildDir = pathJoinAdapter({ paths: [guildsPath, id] });
  const questsDir = pathJoinAdapter({
    paths: [guildDir, dungeonmasterHomeStatics.paths.questsDir],
  });
  await fsMkdirAdapter({ filepath: questsDir });

  const urlSlug = nameToUrlSlugTransformer({ name });

  const guild = guildContract.parse({
    id,
    name,
    path,
    urlSlug,
    createdAt: new Date().toISOString(),
  });

  await guildConfigWriteBroker({
    config: { guilds: [...config.guilds, guild] },
  });

  return guild;
};
