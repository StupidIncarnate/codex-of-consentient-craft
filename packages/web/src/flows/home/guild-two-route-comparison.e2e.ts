/**
 * PURPOSE: Proves that the api route and write route produce equivalent domain state for the guild
 * ingredient under the same framework runner.
 */
import { z } from 'zod';

import { guildContract } from '@dungeonmaster/shared/contracts';
import {
  dmRegistryBroker,
  recipesHydrationCreateBroker,
} from '@dungeonmaster/hydration-recipes/brokers';
import { guildFieldsContract } from '@dungeonmaster/hydration-recipes/contracts';

import { test, expect } from '../../../test/harnesses/e2e-fixtures';
import { dmTargetHarness } from '../../../test/harnesses/dm-target/dm-target.harness';

const { recipe } = recipesHydrationCreateBroker();
const GUILD_SAVE_NAME = 'guild';
const SHARED_NAME = 'Dual Route Guild';
const WRITE_GUILD_NAME = SHARED_NAME;
const API_GUILD_PATH = '/tmp/dm-e2e-two-route-api';
const WRITE_GUILD_PATH = '/tmp/dm-e2e-two-route-write';

test.describe('Guild Two-Route Comparison', () => {
  let target: ReturnType<typeof dmTargetHarness>;

  test.beforeEach(async ({ baseURL, request }) => {
    target = dmTargetHarness({ baseURL, request });
    await target.beforeEach();
  });

  test('VALID: {same guild fields via api and write routes} => produces equivalent domain state', async ({
    page,
    request,
  }) => {
    const apiPlan = recipe(
      { name: 'seed-guild-api', description: 'seed one guild via api route' },
      () => [
        dmRegistryBroker.guilds.add(1, (g) => [
          g[0].set(guildFieldsContract.parse({ name: SHARED_NAME, path: API_GUILD_PATH })),
          g[0].saveRecordAs({ name: GUILD_SAVE_NAME }),
        ]),
      ],
    )();

    const writePlan = recipe(
      { name: 'seed-guild-write', description: 'seed one guild via write route' },
      () => [
        dmRegistryBroker.guilds.add(1, (g) => [
          g[0].set(guildFieldsContract.parse({ name: SHARED_NAME, path: WRITE_GUILD_PATH })),
          g[0].saveRecordAs({ name: GUILD_SAVE_NAME }),
        ]),
      ],
    )();

    const apiResult = await dmRegistryBroker.run(apiPlan, target.apiTarget());
    const writeResult = await dmRegistryBroker.run(writePlan, target.writeTarget());

    const apiGuild = guildContract.parse(
      (apiResult as Record<PropertyKey, unknown>)[GUILD_SAVE_NAME],
    );
    const writeGuild = guildContract.parse(
      (writeResult as Record<PropertyKey, unknown>)[GUILD_SAVE_NAME],
    );

    const apiGuildName = apiGuild.name;
    const writeGuildName = writeGuild.name;
    const apiGuildUrlSlug = apiGuild.urlSlug;
    const writeGuildUrlSlug = writeGuild.urlSlug;
    const apiGuildId = apiGuild.id;
    const writeGuildId = writeGuild.id;

    expect(apiGuildName).toBe(SHARED_NAME);
    expect(writeGuildName).toBe(WRITE_GUILD_NAME);
    expect(apiGuildUrlSlug).toBe('dual-route-guild');
    expect(writeGuildUrlSlug).toBe('dual-route-guild');
    expect(apiGuildId !== writeGuildId).toBe(true);

    const response = await request.get('/api/guilds');
    expect(response.status()).toBe(200);
    const rawGuilds: unknown = await response.json();
    const guilds = z.array(guildContract).parse(rawGuilds);
    const ids = guilds.map((guild) => guild.id);
    const hasApiGuild = ids.some((id) => id === apiGuildId);
    const hasWriteGuild = ids.some((id) => id === writeGuildId);
    expect(hasApiGuild).toBe(true);
    expect(hasWriteGuild).toBe(true);

    await page.goto('/');
    await expect(page.getByText(SHARED_NAME)).toHaveCount(2);
  });
});
