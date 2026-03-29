import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';

const GUILD_PATH_A = '/tmp/dm-e2e-guild-del-a';
const GUILD_PATH_B = '/tmp/dm-e2e-guild-del-b';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH_A }), testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH_B }), testObj: test });

test.describe('Guild Deletion', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: delete guild via API removes from list', async ({ page, request }) => {
    const guildA = await guildHarness({ request }).createGuild({
      name: 'Guild Alpha',
      path: GUILD_PATH_A,
    });
    await guildHarness({ request }).createGuild({ name: 'Guild Beta', path: GUILD_PATH_B });

    // Delete guild A via API
    await request.delete(`/api/guilds/${String(guildA.id)}`);

    // Refresh and verify only Guild Beta remains
    await page.goto('/');

    await expect(page.getByText('Guild Beta')).toBeVisible();
    await expect(page.getByText('Guild Alpha')).not.toBeVisible();
  });

  test('VALID: delete selected guild clears quest panel', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Selected Guild',
      path: GUILD_PATH_A,
    });

    await page.goto('/');
    await page.getByText('Selected Guild').click();

    // Delete the selected guild via API
    await request.delete(`/api/guilds/${String(guild.id)}`);

    // Refresh to see updated state
    await page.goto('/');

    // The quest panel should show guidance text or empty state since the guild is gone
    await expect(page.getByText('Selected Guild')).not.toBeVisible();
  });

  test('EMPTY: delete last guild shows empty state', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Only Guild',
      path: GUILD_PATH_A,
    });

    // Delete the only guild
    await request.delete(`/api/guilds/${String(guild.id)}`);

    // Refresh and verify inline creation form appears
    await page.goto('/');

    await expect(page.getByText('NEW GUILD')).toBeVisible();
    await expect(page.getByTestId('GUILD_NAME_INPUT')).toBeVisible();
    await expect(page.getByTestId('GUILD_PATH_INPUT')).toBeVisible();
  });
});
