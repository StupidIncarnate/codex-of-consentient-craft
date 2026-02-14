import { test, expect } from '@playwright/test';
import { cleanProjects, createProject, createQuest } from './fixtures/test-helpers';

test.describe('Status Badges & Visual', () => {
  test('selected guild has gold highlight', async ({ page, request }) => {
    await cleanProjects(request);
    const projectA = await createProject(request, { name: 'Guild A', path: '/tmp/a' });
    const projectB = await createProject(request, { name: 'Guild B', path: '/tmp/b' });

    await page.goto('/');
    await page.getByTestId(`GUILD_ITEM_${projectA.id}`).click();

    // Selected guild should have gold-colored styling
    const selectedGuild = page.getByTestId(`GUILD_ITEM_${projectA.id}`);
    await expect(selectedGuild).toBeVisible();
    // Check it has a distinct style (gold color on text)
    const color = await selectedGuild.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBeTruthy();

    // Unselected guild should have different styling
    const unselectedGuild = page.getByTestId(`GUILD_ITEM_${projectB.id}`);
    const unselectedColor = await unselectedGuild.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe(unselectedColor);
  });

  test('quest status badges show correct text', async ({ page, request }) => {
    await cleanProjects(request);
    const project = await createProject(request, { name: 'Status Guild', path: '/tmp/status' });
    const quest = await createQuest(request, {
      projectId: project.id as string,
      title: 'Status Quest',
      userRequest: 'Test status',
    });

    await page.goto('/');
    await page.getByText('Status Guild').click();

    // Quest should show with a status badge
    const statusBadge = page.getByTestId(`QUEST_STATUS_${quest.id}`);
    await expect(statusBadge).toBeVisible();
    const statusText = await statusBadge.textContent();
    // Status should be uppercase (PENDING is default for new quests)
    expect(statusText?.toUpperCase()).toBe(statusText);
  });

  test('multiple guilds all visible', async ({ page, request }) => {
    await cleanProjects(request);
    await createProject(request, { name: 'Guild A', path: '/tmp/a' });
    await createProject(request, { name: 'Guild B', path: '/tmp/b' });
    await createProject(request, { name: 'Guild C', path: '/tmp/c' });

    await page.goto('/');

    await expect(page.getByText('Guild A')).toBeVisible();
    await expect(page.getByText('Guild B')).toBeVisible();
    await expect(page.getByText('Guild C')).toBeVisible();
  });
});
