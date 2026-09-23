/**
 * PURPOSE: Registers a new guild in the dungeonmaster config and creates its quests directory.
 * Accepts an OPTIONAL caller-supplied id — every existing caller passes none and gets a fresh
 * `crypto.randomUUID()` mint, same as before. A caller supplies one when a downstream comparison
 * (e.g. a hydration recipe seeding the same guild down two independent routes) needs both writes
 * to land on the identical id rather than two random ones that can never match.
 *
 * USAGE:
 * const guild = await guildAddBroker({ name: GuildNameStub({ value: 'My App' }), path: GuildPathStub({ value: '/home/user/my-app' }) });
 * // Returns: Guild with generated UUID, name, path, and createdAt
 *
 * const guild = await guildAddBroker({ name, path, id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
 * // Returns: Guild carrying exactly that id — thrown instead if it fails guildIdContract
 *
 * const guild = await guildAddBroker({ name, path, home: '/tmp/dm-home' });
 * // Reads, registers and creates under /tmp/dm-home alone — DUNGEONMASTER_HOME is never read
 *
 * THE HOME IS OPTIONAL AND ALL THREE WRITES FOLLOW IT. A caller supplying none gets the
 * process-wide resolution, which is what every real registration wants. A caller that was HANDED a
 * home — a hydration seed populating one target directory — supplies it, and the config read, the
 * `<home>/guilds/<id>/quests` directory and the config write then all resolve against it.
 * Threading it through the directory alone would leave the guild REGISTERED in the operator's own
 * data directory while its quests directory sat in the target: a seed reporting success against a
 * target whose config.json names no guild at all.
 *
 * `absoluteFilePathContract.parse`, because a relative home resolves against `process.cwd()` —
 * the caller's own checkout — and the first thing to land there is a `config.json` no `cleanup()`
 * reaches.
 */

import { dungeonmasterHomeEnsureBroker } from '@dungeonmaster/shared/brokers';
import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import {
  absoluteFilePathContract,
  guildContract,
  guildIdContract,
} from '@dungeonmaster/shared/contracts';
import type { Guild, GuildName, GuildPath } from '@dungeonmaster/shared/contracts';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

import { guildConfigReadBroker } from '../../guild-config/read/guild-config-read-broker';
import { guildConfigWriteBroker } from '../../guild-config/write/guild-config-write-broker';

export const guildAddBroker = async ({
  name,
  path,
  id,
  home,
}: {
  name: GuildName;
  path: GuildPath;
  id?: string;
  home?: string;
}): Promise<Guild> => {
  const homePath = home === undefined ? undefined : absoluteFilePathContract.parse(home);
  const homeOverride = homePath === undefined ? {} : { home: homePath };

  const config = await guildConfigReadBroker(homeOverride);

  const duplicate = config.guilds.find((guild) => guild.path === path);
  if (duplicate) {
    throw new Error(`A guild with path ${path} already exists`);
  }

  // `fsMkdirAdapter` is recursive, so the quests directory below stands a supplied home and its
  // `guilds/` child up unaided. The ensure broker is reached for only when the process-wide home
  // is in play, and it is the one call here that reads DUNGEONMASTER_HOME.
  const guildsPath =
    homePath === undefined
      ? (await dungeonmasterHomeEnsureBroker()).guildsPath
      : pathJoinAdapter({ paths: [homePath, dungeonmasterHomeStatics.paths.guildsDir] });

  const guildId = guildIdContract.parse(id ?? crypto.randomUUID());

  const guildDir = pathJoinAdapter({ paths: [guildsPath, guildId] });
  const questsDir = pathJoinAdapter({
    paths: [guildDir, dungeonmasterHomeStatics.paths.questsDir],
  });
  await fsMkdirAdapter({ filepath: questsDir });

  const urlSlug = nameToUrlSlugTransformer({ name });

  const guild = guildContract.parse({
    id: guildId,
    name,
    path,
    urlSlug,
    createdAt: new Date().toISOString(),
  });

  await guildConfigWriteBroker({
    config: { guilds: [...config.guilds, guild] },
    ...homeOverride,
  });

  return guild;
};
