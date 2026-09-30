/**
 * PURPOSE: Proves that the api route and write route produce equivalent domain state for the guild
 * ingredient under the same framework runner — including `guildAddBroker`'s slug rule: whichever
 * route registers a name second in one home gets the first free `-<n>` suffix, in either order.
 */
import { z } from '#gateway/npm/zod';

import { guildContract } from '@dungeonmaster/shared/contracts';

import { test, expect } from '../../../test/harnesses/e2e-fixtures';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';

const SHARED_NAME = 'Dual Route Guild';
const WRITE_GUILD_NAME = SHARED_NAME;
const API_GUILD_PATH = '/tmp/dm-e2e-two-route-api';
const WRITE_GUILD_PATH = '/tmp/dm-e2e-two-route-write';

test.describe('Guild Two-Route Comparison', () => {
  let guilds: ReturnType<typeof guildHarness>;

  test.beforeEach(async ({ baseURL, request }) => {
    guilds = guildHarness({ ...(baseURL === undefined ? {} : { baseURL }), request });
    await guilds.cleanGuilds();
  });

  test('VALID: {same guild fields via api and write routes} => produces equivalent domain state', async ({
    page,
    request,
  }) => {
    const apiGuildRecord = await guilds.createGuild({ name: SHARED_NAME, path: API_GUILD_PATH });
    const writeGuildRecord = await guilds.createGuildViaWriteRoute({
      name: SHARED_NAME,
      path: WRITE_GUILD_PATH,
    });

    const apiGuild = guildContract.parse(apiGuildRecord);
    const writeGuild = guildContract.parse(writeGuildRecord);

    const apiGuildName = apiGuild.name;
    const writeGuildName = writeGuild.name;
    const apiGuildUrlSlug = apiGuild.urlSlug;
    const writeGuildUrlSlug = writeGuild.urlSlug;
    const apiGuildId = apiGuild.id;
    const writeGuildId = writeGuild.id;

    expect(apiGuildName).toBe(SHARED_NAME);
    expect(writeGuildName).toBe(WRITE_GUILD_NAME);
    expect(apiGuildUrlSlug).toBe('dual-route-guild');
    expect(writeGuildUrlSlug).toBe('dual-route-guild-2');
    expect(apiGuildId !== writeGuildId).toBe(true);

    const response = await request.get('/api/guilds');
    expect(response.status()).toBe(200);
    const rawGuilds: unknown = await response.json();
    const allGuilds = z.array(guildContract).parse(rawGuilds);
    const ids = allGuilds.map((guild) => guild.id);
    const hasApiGuild = ids.some((id) => id === apiGuildId);
    const hasWriteGuild = ids.some((id) => id === writeGuildId);
    expect(hasApiGuild).toBe(true);
    expect(hasWriteGuild).toBe(true);

    await page.goto('/');
    await expect(page.getByText(SHARED_NAME)).toHaveCount(2);
  });

  test('VALID: {same guild fields via write then api route} => the api route takes the suffixed slug', async () => {
    const writeGuildRecord = await guilds.createGuildViaWriteRoute({
      name: SHARED_NAME,
      path: WRITE_GUILD_PATH,
    });
    const apiGuildRecord = await guilds.createGuild({ name: SHARED_NAME, path: API_GUILD_PATH });

    const writeGuildUrlSlug = guildContract.parse(writeGuildRecord).urlSlug;
    const apiGuildUrlSlug = guildContract.parse(apiGuildRecord).urlSlug;

    expect(writeGuildUrlSlug).toBe('dual-route-guild');
    expect(apiGuildUrlSlug).toBe('dual-route-guild-2');
  });
});
