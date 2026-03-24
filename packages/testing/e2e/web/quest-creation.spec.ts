import { test, expect } from './base-spec';
import { wireHarnessLifecycle } from './fixtures/harness-wire';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { cleanGuilds, createGuild } from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-creation';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Session Creation', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds({ request });
  });

  test('session file appears in session list', async ({ page, request }) => {
    await createGuild({ request, name: 'Quest Guild', path: GUILD_PATH });

    const sessionId = `e2e-session-first-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build a feature',
    });

    await page.goto('/');
    await page.getByText('Quest Guild').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    await expect(page.getByTestId(`SESSION_ITEM_${sessionId}`)).toBeVisible();
    await expect(page.getByText('Build a feature')).toBeVisible();
  });

  test('multiple sessions show in session list', async ({ page, request }) => {
    await createGuild({ request, name: 'Multi Session Guild', path: GUILD_PATH });

    const now = Date.now();
    const sessionList = [
      { sessionId: `e2e-session-1-${now}`, message: 'First task' },
      { sessionId: `e2e-session-2-${now}`, message: 'Second task' },
      { sessionId: `e2e-session-3-${now}`, message: 'Third task' },
    ];

    for (const s of sessionList) {
      sessions.createSessionFile({
        sessionId: s.sessionId,
        userMessage: s.message,
      });
    }

    await page.goto('/');
    await page.getByText('Multi Session Guild').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    await expect(page.getByText('First task')).toBeVisible();
    await expect(page.getByText('Second task')).toBeVisible();
    await expect(page.getByText('Third task')).toBeVisible();
  });

  test('session item is clickable', async ({ page, request }) => {
    await createGuild({ request, name: 'Click Guild', path: GUILD_PATH });

    const sessionId = `e2e-session-click-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Check click',
    });

    await page.goto('/');
    await page.getByText('Click Guild').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    const sessionItem = page.getByTestId(`SESSION_ITEM_${sessionId}`);

    await expect(sessionItem).toBeVisible();
    await expect(sessionItem).toBeEnabled();
  });
});
