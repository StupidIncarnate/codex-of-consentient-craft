import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createSessionFile,
  cleanSessionFiles,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-creation';

test.describe('Session Creation', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionFiles({ guildPath: GUILD_PATH });
  });

  test('session file appears in session list', async ({ page, request }) => {
    await createGuild(request, { name: 'Quest Guild', path: GUILD_PATH });

    const sessionId = `e2e-session-first-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Build a feature',
    });

    await page.goto('/');
    await page.getByText('Quest Guild').click();

    await expect(page.getByTestId(`SESSION_ITEM_${sessionId}`)).toBeVisible();
    await expect(page.getByText('Build a feature')).toBeVisible();
  });

  test('multiple sessions show in session list', async ({ page, request }) => {
    await createGuild(request, { name: 'Multi Session Guild', path: GUILD_PATH });

    const now = Date.now();
    const sessions = [
      { sessionId: `e2e-session-1-${now}`, message: 'First task' },
      { sessionId: `e2e-session-2-${now}`, message: 'Second task' },
      { sessionId: `e2e-session-3-${now}`, message: 'Third task' },
    ];

    for (const s of sessions) {
      createSessionFile({
        guildPath: GUILD_PATH,
        sessionId: s.sessionId,
        userMessage: s.message,
      });
    }

    await page.goto('/');
    await page.getByText('Multi Session Guild').click();

    await expect(page.getByText('First task')).toBeVisible();
    await expect(page.getByText('Second task')).toBeVisible();
    await expect(page.getByText('Third task')).toBeVisible();
  });

  test('session item is clickable', async ({ page, request }) => {
    await createGuild(request, { name: 'Click Guild', path: GUILD_PATH });

    const sessionId = `e2e-session-click-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Check click',
    });

    await page.goto('/');
    await page.getByText('Click Guild').click();

    const sessionItem = page.getByTestId(`SESSION_ITEM_${sessionId}`);
    await expect(sessionItem).toBeVisible();
    await expect(sessionItem).toBeEnabled();
  });
});
