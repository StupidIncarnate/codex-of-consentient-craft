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

import { dmRegistryBroker, recipesHydrationCreateBroker } from '@dungeonmaster/hydration-recipes';
import { guildFieldsContract } from '@dungeonmaster/hydration-recipes/contracts';
import { guildIdContract } from '@dungeonmaster/shared/contracts';
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
  // Same plan shape as createGuild, run against the `write` target instead of the `api` one — for a
  // spec proving the two routes produce equivalent domain state for the same ingredient.
  createGuildViaWriteRoute: (params: { name: string; path: string }) => Promise<GuildRecord>;
  // Removes one guild through dmRegistryBroker's `remove` route (guildRemoveRouteBroker), which
  // sends `DELETE /api/guilds/:guildId` over HTTP whenever the target carries a `baseUrl` — see
  // that route's own header for the full resolution.
  deleteGuild: (params: { guildId: string }) => Promise<void>;
  extractGuildId: (params: { guild: GuildRecord }) => GuildId;
  extractUrlSlug: (params: { guild: GuildRecord }) => UrlSlug;
} => {
  const resolvedBaseUrl =
    baseURL ??
    process.env.DUNGEONMASTER_BASE_URL ??
    `http://${environmentStatics.hostname}:${process.env.DUNGEONMASTER_WEB_PORT ?? String(Number(process.env.DUNGEONMASTER_PORT ?? '5737') + 1)}`;

  const dmTarget = dmTargetHarness({ baseURL: resolvedBaseUrl, request });

  const cleanGuilds = async (): Promise<void> => {
    await dmTarget.beforeEach();
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

  const createGuildViaWriteRoute = async ({
    name,
    path,
  }: {
    name: string;
    path: string;
  }): Promise<GuildRecord> => {
    const parsedFields = guildFieldsContract.parse({ name, path });
    const plan = recipe(
      { name: 'seed-guild-write', description: 'seed one guild via write route' },
      () => [
        dmRegistryBroker.guilds.add(1, (g) => [
          g[0].set(parsedFields),
          g[0].saveRecordAs({ name: GUILD_SAVE_NAME }),
        ]),
      ],
    )();
    const result = await dmRegistryBroker.run(plan, dmTarget.writeTarget());
    return (result as Record<PropertyKey, unknown>)[GUILD_SAVE_NAME] as GuildRecord;
  };

  // Filters on `id` alone: the intersection widens the ingredient's own `where` type (which has no
  // index signature) to admit `id`, a value `guildAddBroker` mints rather than a settable
  // GuildFields key — the same shape questHarness.patchQuestStatus uses for a quest's `id`.
  const deleteGuild = async ({ guildId }: { guildId: string }): Promise<void> => {
    type GuildFilterWhere = Parameters<typeof dmRegistryBroker.guilds.filter>[0]['where'] & {
      id?: GuildId;
    };
    const filterWhere: GuildFilterWhere = { id: guildIdContract.parse(guildId) };

    const plan = recipe(
      { name: 'delete-guild', description: 'removes one guild via dmRegistryBroker' },
      () => [dmRegistryBroker.guilds.filter({ where: filterWhere, expect: 'one' }).remove()],
    )();

    await dmRegistryBroker.run(plan, dmTarget.apiTarget());
  };

  const extractGuildId = ({ guild }: { guild: GuildRecord }): GuildId =>
    String(guild.id) as GuildId;

  const extractUrlSlug = ({ guild }: { guild: GuildRecord }): UrlSlug =>
    String(guild.urlSlug) as UrlSlug;

  return {
    beforeEach: cleanGuilds,
    cleanGuilds,
    createGuild,
    createGuildViaWriteRoute,
    deleteGuild,
    extractGuildId,
    extractUrlSlug,
  };
};
