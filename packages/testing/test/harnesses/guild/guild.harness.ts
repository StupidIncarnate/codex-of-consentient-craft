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

import type { GuildId, UrlSlug } from '@dungeonmaster/shared/contracts';

type GuildRecord = Record<PropertyKey, unknown>;

export const guildHarness = ({
  request,
}: {
  request: APIRequestContext;
}): {
  beforeEach: () => Promise<void>;
  cleanGuilds: () => Promise<void>;
  createGuild: (params: { name: string; path: string }) => Promise<GuildRecord>;
  extractGuildId: (params: { guild: GuildRecord }) => GuildId;
  extractUrlSlug: (params: { guild: GuildRecord }) => UrlSlug;
} => {
  const cleanGuilds = async (): Promise<void> => {
    const response = await request.get('/api/guilds');
    const data: unknown = await response.json();
    const guilds = Array.isArray(data) ? (data as GuildRecord[]) : [];
    await Promise.all(
      guilds.map(async (guild) => request.delete(`/api/guilds/${String(guild.id)}`)),
    );
  };

  const createGuild = async ({
    name,
    path,
  }: {
    name: string;
    path: string;
  }): Promise<GuildRecord> => {
    const response = await request.post('/api/guilds', {
      data: { name, path },
    });
    return response.json() as Promise<GuildRecord>;
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
