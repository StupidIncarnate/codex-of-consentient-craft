import { test, expect } from '@playwright/test';
import { cleanProjects, createProject, createQuest } from './fixtures/test-helpers';

test.describe('Quest Detail Navigation', () => {
  test('click quest item opens detail view', async ({ page, request }) => {
    await cleanProjects(request);
    const project = await createProject(request, { name: 'Test Guild', path: '/tmp/test' });
    const quest = await createQuest(request, {
      projectId: project.id as string,
      title: 'My Quest',
      userRequest: 'Build something',
    });

    await page.goto('/');
    await page.getByText('Test Guild').click();
    await page.getByTestId(`QUEST_ITEM_${quest.id}`).click();

    // Quest detail view
    await expect(page.getByText('My Quest')).toBeVisible();
    await expect(page.getByText('Back to list')).toBeVisible();
    // Tabs visible
    await expect(page.getByText('Overview')).toBeVisible();
    await expect(page.getByText(/Requirements/)).toBeVisible();
    await expect(page.getByText(/Steps/)).toBeVisible();
    await expect(page.getByText(/Contracts/)).toBeVisible();
  });

  test('quest detail tabs are navigable', async ({ page, request }) => {
    await cleanProjects(request);
    const project = await createProject(request, { name: 'Tab Guild', path: '/tmp/tab' });
    const quest = await createQuest(request, {
      projectId: project.id as string,
      title: 'Tab Quest',
      userRequest: 'Test tabs',
    });

    await page.goto('/');
    await page.getByText('Tab Guild').click();
    await page.getByTestId(`QUEST_ITEM_${quest.id}`).click();

    // Click Requirements tab
    await page.getByText(/Requirements/).click();
    await page.waitForTimeout(300);

    // Click Steps tab
    await page.getByText(/Steps/).click();
    await page.waitForTimeout(300);

    // Click Contracts tab
    await page.getByText(/Contracts/).click();
    await page.waitForTimeout(300);

    // Click Overview tab to go back
    await page.getByText('Overview').click();
  });

  test('back to list returns to quest list', async ({ page, request }) => {
    await cleanProjects(request);
    const project = await createProject(request, { name: 'Back Guild', path: '/tmp/back' });
    const quest = await createQuest(request, {
      projectId: project.id as string,
      title: 'Return Quest',
      userRequest: 'Test back',
    });

    await page.goto('/');
    await page.getByText('Back Guild').click();
    await page.getByTestId(`QUEST_ITEM_${quest.id}`).click();
    await expect(page.getByText('Back to list')).toBeVisible();

    await page.getByText('Back to list').click();

    // Back to quest list
    await expect(page.getByText('Return Quest')).toBeVisible();
    await expect(page.getByTestId('GUILD_QUEST_LIST')).toBeVisible();
  });

  test.skip('quest detail with error shows error alert', async () => {
    // Requires mocking server responses - skipped for now
  });
});
