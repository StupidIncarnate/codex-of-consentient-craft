/**
 * PURPOSE: Manages guild lifecycle (create, clean, extract ID) for E2E tests
 *
 * USAGE:
 * const guilds = guildHarness({ request });
 * // beforeEach: cleans all guilds
 * const guild = await guilds.createGuild({ name: 'Test', path: '/tmp/test' });
 * const guildId = guilds.extractGuildId({ guild });
 */
import type { APIRequestContext } from '@playwright/test';

import {
  dmRegistryBroker,
  recipesHydrationCreateBroker,
} from '@dungeonmaster/siegelense-recipes/brokers';
import { guildFieldsContract } from '@dungeonmaster/siegelense-recipes/contracts';
import type { GuildId, UrlSlug } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';

import { dmTargetHarness } from '../dm-target/dm-target.harness';

type GuildRecord = Record<PropertyKey, unknown>;

const { recipe } = recipesHydrationCreateBroker();
const GUILD_SAVE_NAME = 'guild';

export const guildHarness = ({
  baseURL,
  request,
}: {
  baseURL?: string;
  request: APIRequestContext;
}): {
  beforeEach: () => Promise<void>;
  cleanGuilds: () => Promise<void>;
  createGuild: (params: { name: string; path: string }) => Promise<GuildRecord>;
  extractGuildId: (params: { guild: GuildRecord }) => GuildId;
  extractUrlSlug: (params: { guild: GuildRecord }) => UrlSlug;
} => {
  const resolvedBaseUrl =
    baseURL ??
    process.env.DUNGEONMASTER_BASE_URL ??
    `http://${environmentStatics.hostname}:${process.env.DUNGEONMASTER_WEB_PORT ?? String(Number(process.env.DUNGEONMASTER_PORT ?? '5737') + 1)}`;

  const dmTarget = dmTargetHarness({ baseURL: resolvedBaseUrl, request });

  const deleteGuild = async ({ guild }: { guild: GuildRecord }): Promise<void> => {
    await request.delete(`/api/guilds/${String(guild.id)}`);
  };

  const cleanGuilds = async (): Promise<void> => {
    const response = await request.get('/api/guilds');
    const data: unknown = await response.json();
    const guilds = Array.isArray(data) ? (data as GuildRecord[]) : [];
    // Sequential deletes: concurrent DELETEs corrupt config.json (race on read-modify-write)
    await guilds.reduce(async (prev, guild) => {
      await prev;
      await deleteGuild({ guild });
    }, Promise.resolve());
  };

  const createGuild = async ({
    name,
    path,
  }: {
    name: string;
    path: string;
  }): Promise<GuildRecord> => {
    const parsedFields = guildFieldsContract.parse({ name, path });
    const plan = recipe({ name: 'seed-guild', description: 'seed one guild via api route' }, () => [
      dmRegistryBroker.guilds.add(1, (g) => [
        g[0].set(parsedFields),
        g[0].saveRecordAs({ name: GUILD_SAVE_NAME }),
      ]),
    ])();
    const result = await dmRegistryBroker.run(plan, dmTarget.apiTarget());
    return (result as Record<PropertyKey, unknown>)[GUILD_SAVE_NAME] as GuildRecord;
  };

  const extractGuildId = ({ guild }: { guild: GuildRecord }): GuildId =>
    String(guild.id) as GuildId;

  const extractUrlSlug = ({ guild }: { guild: GuildRecord }): UrlSlug =>
    String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-') as UrlSlug;

  return {
    beforeEach: cleanGuilds,
    cleanGuilds,
    createGuild,
    extractGuildId,
    extractUrlSlug,
  };
};
