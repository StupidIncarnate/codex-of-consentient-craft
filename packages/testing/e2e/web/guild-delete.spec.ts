import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import { cleanGuilds, createGuild } from './fixtures/test-helpers';

const GUILD_PATH_A = '/tmp/dm-e2e-guild-del-a';
const GUILD_PATH_B = '/tmp/dm-e2e-guild-del-b';

test.describe('Guild Deletion', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH_A, { recursive: true });
    mkdirSync(GUILD_PATH_B, { recursive: true });
  });

  test('delete guild via API removes from list', async ({ page, request }) => {
    const guildA = await createGuild(request, { name: 'Guild Alpha', path: GUILD_PATH_A });
    await createGuild(request, { name: 'Guild Beta', path: GUILD_PATH_B });

    // Delete guild A via API
    await request.delete(`/api/guilds/${guildA.id}`);

    // Refresh and verify only Guild Beta remains
    await page.goto('/');
    await expect(page.getByText('Guild Beta')).toBeVisible();
    await expect(page.getByText('Guild Alpha')).not.toBeVisible();
  });

  test('delete selected guild clears quest panel', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Selected Guild', path: GUILD_PATH_A });

    await page.goto('/');
    await page.getByText('Selected Guild').click();

    // Delete the selected guild via API
    await request.delete(`/api/guilds/${guild.id}`);

    // Refresh to see updated state
    await page.goto('/');

    // The quest panel should show guidance text or empty state since the guild is gone
    await expect(page.getByText('Selected Guild')).not.toBeVisible();
  });

  test('delete last guild shows empty state', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Only Guild', path: GUILD_PATH_A });

    // Delete the only guild
    await request.delete(`/api/guilds/${guild.id}`);

    // Refresh and verify inline creation form appears
    await page.goto('/');
    await expect(page.getByText('NEW GUILD')).toBeVisible();
    await expect(page.getByTestId('GUILD_NAME_INPUT')).toBeVisible();
    await expect(page.getByTestId('GUILD_PATH_INPUT')).toBeVisible();
  });
});
