import { test, expect } from '@playwright/test';
import { cleanProjects, createProject, createQuest } from './fixtures/test-helpers';

test.describe('Guild Selection & Quest Loading', () => {
  test('click guild loads its quest list', async ({ page, request }) => {
    await cleanProjects(request);
    const project = await createProject(request, { name: 'Guild A', path: '/tmp/guild-a' });
    await createQuest(request, { projectId: project.id as string, title: 'Quest Alpha', userRequest: 'Test quest' });

    await page.goto('/');
    await page.getByText('Guild A').click();

    await expect(page.getByText('QUESTS')).toBeVisible();
    await expect(page.getByText('Quest Alpha')).toBeVisible();
  });

  test('click guild with no quests shows empty state', async ({ page, request }) => {
    await cleanProjects(request);
    await createProject(request, { name: 'Empty Guild', path: '/tmp/empty' });

    await page.goto('/');
    await page.getByText('Empty Guild').click();

    await expect(page.getByTestId('QUEST_EMPTY_STATE')).toBeVisible();
    await expect(page.getByText('No quests yet')).toBeVisible();
  });

  test('switch between guilds refreshes quest list', async ({ page, request }) => {
    await cleanProjects(request);
    const projectA = await createProject(request, { name: 'Guild A', path: '/tmp/guild-a' });
    const projectB = await createProject(request, { name: 'Guild B', path: '/tmp/guild-b' });
    await createQuest(request, { projectId: projectA.id as string, title: 'Quest Alpha', userRequest: 'Test' });
    await createQuest(request, { projectId: projectB.id as string, title: 'Quest Beta', userRequest: 'Test' });

    await page.goto('/');
    await page.getByText('Guild A').click();
    await expect(page.getByText('Quest Alpha')).toBeVisible();

    await page.getByText('Guild B').click();
    await expect(page.getByText('Quest Alpha')).not.toBeVisible();
    await expect(page.getByText('Quest Beta')).toBeVisible();
  });

  test.skip('quest list error shows error state', async () => {
    // Requires mocking server responses - skipped for now
  });
});
