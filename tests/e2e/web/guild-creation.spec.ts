import { test, expect } from '@playwright/test';
import { cleanProjects, createProject } from './fixtures/test-helpers';

test.describe('Guild Creation Flow', () => {
  test('empty state inline form has correct fields', async ({ page, request }) => {
    await cleanProjects(request);
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
    await cleanProjects(request);
    await page.goto('/');

    await page.getByTestId('GUILD_NAME_INPUT').fill('My Guild');
    await page.getByTestId('GUILD_PATH_INPUT').fill('/tmp/my-guild');
    await page.getByText('CREATE').click();

    // Form should disappear, guild appears in list
    await expect(page.getByText('NEW GUILD')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('My Guild')).toBeVisible();
    // Quest list should show empty state
    await expect(page.getByTestId('QUEST_EMPTY_STATE')).toBeVisible();
  });

  test('browse directory flow selects path', async ({ page, request }) => {
    await cleanProjects(request);
    await page.goto('/');

    await page.getByText('BROWSE').click();

    // Directory browser modal opens
    await expect(page.getByText('Browse Directory')).toBeVisible();
    await expect(page.getByTestId('CURRENT_PATH_DISPLAY')).toBeVisible();

    // Path should not be just "/"
    const pathText = await page.getByTestId('CURRENT_PATH_DISPLAY').textContent();
    expect(pathText).toBeTruthy();

    // Click a directory entry if available, then SELECT
    const dirEntries = page.locator('[data-testid^="DIR_ENTRY_"]');
    const count = await dirEntries.count();
    if (count > 0) {
      const firstEntry = dirEntries.first();
      await firstEntry.click();
      // Path should update
      await page.waitForTimeout(500);
    }

    await page.getByText('Select').click();

    // Modal should close, path input should be populated
    await expect(page.getByText('Browse Directory')).not.toBeVisible();
    const pathValue = await page.getByTestId('GUILD_PATH_INPUT').inputValue();
    expect(pathValue.length).toBeGreaterThan(0);
  });

  test('main view + button shows inline form with CANCEL', async ({ page, request }) => {
    await cleanProjects(request);
    await createProject(request, { name: 'Existing Guild', path: '/tmp/existing' });

    await page.goto('/');
    // Click the guild to select it
    await page.getByText('Existing Guild').click();
    // Click the + button
    await page.getByTestId('ADD_PROJECT_BUTTON').click();

    // Form should show with CANCEL
    await expect(page.getByText('NEW GUILD')).toBeVisible();
    await expect(page.getByText('CANCEL')).toBeVisible();

    // Click CANCEL returns to main view
    await page.getByText('CANCEL').click();
    await expect(page.getByText('NEW GUILD')).not.toBeVisible();
    await expect(page.getByText('Existing Guild')).toBeVisible();
  });

  test('main view + then CREATE adds new guild', async ({ page, request }) => {
    await cleanProjects(request);
    await createProject(request, { name: 'Existing Guild', path: '/tmp/existing' });

    await page.goto('/');
    await page.getByTestId('ADD_PROJECT_BUTTON').click();

    await page.getByTestId('GUILD_NAME_INPUT').fill('New Guild');
    await page.getByTestId('GUILD_PATH_INPUT').fill('/tmp/new');
    await page.getByText('CREATE').click();

    // Both guilds visible
    await expect(page.getByText('Existing Guild')).toBeVisible();
    await expect(page.getByText('New Guild')).toBeVisible();
  });

  test('CREATE with empty fields stays on form', async ({ page, request }) => {
    await cleanProjects(request);
    await page.goto('/');

    // Click CREATE without filling fields
    await page.getByText('CREATE').click();

    // Form should still be visible (validation prevents submission)
    await expect(page.getByText('NEW GUILD')).toBeVisible();
    await expect(page.getByTestId('GUILD_NAME_INPUT')).toBeVisible();
  });
});
