/**
 * PURPOSE: Ensures a dedicated smoketest guild exists in the dungeonmaster config and returns its actual GuildId
 *
 * USAGE:
 * const { guildId } = await smoketestEnsureGuildBroker();
 * // Returns: { guildId } — the GuildId of the smoketest guild. Creates the guild on first call
 * // and reuses the existing entry on subsequent calls.
 *
 * WHEN-TO-USE: SmoketestRunResponder calls this before dispatching orchestration cases so
 * questHydrateBroker / chat-spawn / orchestration-loop code that reads guild config by id finds a real entry.
 * WHEN-NOT-TO-USE: Outside the smoketest flow. Guilds for real projects go through guildAddBroker directly.
 *
 * WHY not guildAddBroker-with-forced-id: guildAddBroker generates its id internally via crypto.randomUUID()
 * and does not accept an id override. Callers must use the returned GuildId rather than smoketestStatics.guildId.
 */

import { dungeonmasterHomeEnsureBroker } from '@dungeonmaster/shared/brokers';
import {
  guildIdContract,
  guildNameContract,
  guildPathContract,
} from '@dungeonmaster/shared/contracts';
import type { GuildId } from '@dungeonmaster/shared/contracts';

import { smoketestStatics } from '../../../statics/smoketest/smoketest-statics';
import { guildAddBroker } from '../../guild/add/guild-add-broker';
import { guildListBroker } from '../../guild/list/guild-list-broker';

export const smoketestEnsureGuildBroker = async (): Promise<{ guildId: GuildId }> => {
  const smoketestGuildName = guildNameContract.parse(smoketestStatics.guildName);

  const existingGuilds = await guildListBroker();
  const existing = existingGuilds.find((guild) => guild.name === smoketestGuildName);
  if (existing !== undefined) {
    return { guildId: guildIdContract.parse(existing.id) };
  }

  // Path must be a real accessible directory; use the dungeonmaster home (always created by ensure).
  const { homePath } = await dungeonmasterHomeEnsureBroker();

  const createdGuild = await guildAddBroker({
    name: smoketestGuildName,
    path: guildPathContract.parse(homePath),
  });

  return { guildId: guildIdContract.parse(createdGuild.id) };
};
