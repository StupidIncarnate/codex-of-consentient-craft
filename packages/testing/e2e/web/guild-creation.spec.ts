import * as os from 'os';
import { test, expect } from '@playwright/test';
import { cleanGuilds, createGuild } from './fixtures/test-helpers';

test.describe('Guild Creation Flow', () => {
  test('empty state inline form has correct fields', async ({ page, request }) => {
    await cleanGuilds(request);
    await page.goto('/');

    await expect(page.getByText('NEW GUILD')).toBeVisible();
    await expect(page.getByTestId('GUILD_NAME_INPUT')).toBeVisible();
    await expect(page.getByTestId('GUILD_PATH_INPUT')).toBeVisible();
    await expect(page.getByText('BROWSE')).toBeVisible();
    await expect(page.getByText('CREATE')).toBeVisible();
    // No CANCEL button when no projects exist
    await expect(page.getByText('CANCEL')).not.toBeVisible();
  });

  test('type name and path then CREATE succeeds', async ({ page, request }) => {
    await cleanGuilds(request);
    await page.goto('/');

    await page.getByTestId('GUILD_NAME_INPUT').fill('My Guild');
    await page.getByTestId('GUILD_PATH_INPUT').fill('/tmp/my-guild');
    await page.getByText('CREATE').click();

    // Form should disappear, guild appears in list
    await expect(page.getByText('NEW GUILD')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('My Guild')).toBeVisible();
    // Session list should show empty state
    await expect(page.getByTestId('SESSION_EMPTY_STATE')).toBeVisible();
  });

  test('browse directory defaults to OS user home, not DUNGEONMASTER_HOME', async ({
    page,
    request,
  }) => {
    await cleanGuilds(request);
    await page.goto('/');

    await page.getByText('BROWSE').click();

    // Directory browser modal opens
    await expect(page.getByText('Browse Directory')).toBeVisible();
    await expect(page.getByTestId('CURRENT_PATH_DISPLAY')).toBeVisible();

    // Default path must be the real OS user home directory, not DUNGEONMASTER_HOME.
    // When DUNGEONMASTER_HOME is set (worktree isolation), the directory browser
    // must still show the actual filesystem home so users can pick project paths.
    const pathText = await page.getByTestId('CURRENT_PATH_DISPLAY').textContent();
    const userHome = os.homedir();
    expect(pathText).toBe(userHome);

    // Directory entries MUST be visible — the user home always has subdirectories
    const dirEntries = page.locator('[data-testid^="DIR_ENTRY_"]');
    await expect(dirEntries.first()).toBeVisible({ timeout: 5000 });
    const count = await dirEntries.count();
    expect(count).toBeGreaterThan(0);

    // "No subdirectories found" must NOT be shown
    await expect(page.getByTestId('EMPTY_DIRECTORY')).not.toBeVisible();
  });

  test('browse directory navigate and select populates path input', async ({ page, request }) => {
    await cleanGuilds(request);
    await page.goto('/');

    await page.getByText('BROWSE').click();
    await expect(page.getByText('Browse Directory')).toBeVisible();

    // Wait for entries to load
    const dirEntries = page.locator('[data-testid^="DIR_ENTRY_"]');
    await expect(dirEntries.first()).toBeVisible({ timeout: 5000 });

    // Click into a directory
    const firstEntry = dirEntries.first();
    const entryName = await firstEntry.textContent();
    await firstEntry.click();

    // Path display should update to include the clicked directory
    await expect(page.getByTestId('CURRENT_PATH_DISPLAY')).toContainText(String(entryName));

    // Click Select
    await page.getByTestId('SELECT_DIRECTORY_BUTTON').click();

    // Modal closes, path input populated with selected directory
    await expect(page.getByText('Browse Directory')).not.toBeVisible();
    const pathValue = await page.getByTestId('GUILD_PATH_INPUT').inputValue();
    expect(pathValue.length).toBeGreaterThan(0);
    expect(pathValue).toContain(String(entryName));
  });

  test('main view + button shows inline form with CANCEL', async ({ page, request }) => {
    await cleanGuilds(request);
    await createGuild(request, { name: 'Existing Guild', path: '/tmp/existing' });

    await page.goto('/');
    // Click the guild to select it
    await page.getByText('Existing Guild').click();
    // Click the + button
    await page.getByTestId('GUILD_LIST').locator('button:has-text("+")').click();

    // Form should show with CANCEL
    await expect(page.getByText('NEW GUILD')).toBeVisible();
    await expect(page.getByText('CANCEL')).toBeVisible();

    // Click CANCEL returns to main view
    await page.getByText('CANCEL').click();
    await expect(page.getByText('NEW GUILD')).not.toBeVisible();
    await expect(page.getByText('Existing Guild')).toBeVisible();
  });

  test('main view + then CREATE adds new guild', async ({ page, request }) => {
    await cleanGuilds(request);
    await createGuild(request, { name: 'Existing Guild', path: '/tmp/existing' });

    await page.goto('/');
    await page.getByTestId('GUILD_LIST').locator('button:has-text("+")').click();

    await page.getByTestId('GUILD_NAME_INPUT').fill('New Guild');
    await page.getByTestId('GUILD_PATH_INPUT').fill('/tmp/new');
    await page.getByText('CREATE').click();

    // Both guilds visible
    await expect(page.getByText('Existing Guild')).toBeVisible();
    await expect(page.getByText('New Guild')).toBeVisible();
  });

  test('CREATE with empty fields stays on form', async ({ page, request }) => {
    await cleanGuilds(request);
    await page.goto('/');

    // Click CREATE without filling fields
    await page.getByText('CREATE').click();

    // Form should still be visible (validation prevents submission)
    await expect(page.getByText('NEW GUILD')).toBeVisible();
    await expect(page.getByTestId('GUILD_NAME_INPUT')).toBeVisible();
  });
});
