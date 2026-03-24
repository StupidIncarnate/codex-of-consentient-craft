import { test, expect } from './base-spec';
import { wireHarnessLifecycle } from './fixtures/harness-wire';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { cleanGuilds, createGuild } from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-detail';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest Detail Navigation', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds({ request });
  });

  test('click session item opens quest chat view', async ({ page, request }) => {
    await createGuild({ request, name: 'Test Guild', path: GUILD_PATH });

    const sessionId = `e2e-session-detail-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build something',
    });

    await page.goto('/');
    await page.getByText('Test Guild').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();
    await page.getByTestId(`SESSION_ITEM_${sessionId}`).click();

    await expect(page.getByTestId('QUEST_CHAT')).toBeVisible();
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible();
    await expect(page.getByTestId('CHAT_INPUT')).toBeVisible();
    await expect(page.getByTestId('SEND_BUTTON')).toBeVisible();
    await expect(page.getByTestId('QUEST_CHAT_ACTIVITY')).toBeVisible();
  });

  test('quest chat view has input and activity panel', async ({ page, request }) => {
    await createGuild({ request, name: 'Tab Guild', path: GUILD_PATH });

    const sessionId = `e2e-session-tab-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Test tabs',
    });

    await page.goto('/');
    await page.getByText('Tab Guild').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();
    await page.getByTestId(`SESSION_ITEM_${sessionId}`).click();

    await expect(page.getByTestId('CHAT_INPUT')).toBeEnabled();
    await expect(page.getByText('Awaiting quest activity...')).toBeVisible();

    await expect(page.getByTestId('QUEST_CHAT_DIVIDER')).toBeVisible();
  });

  test('browser back returns to session list', async ({ page, request }) => {
    await createGuild({ request, name: 'Back Guild', path: GUILD_PATH });

    const sessionId = `e2e-session-back-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Test back',
    });

    await page.goto('/');
    await page.getByText('Back Guild').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();
    await page.getByTestId(`SESSION_ITEM_${sessionId}`).click();

    await expect(page.getByTestId('QUEST_CHAT')).toBeVisible();

    await page.goBack();

    await page.getByText('Back Guild').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    await expect(page.getByText('Test back')).toBeVisible();
    await expect(page.getByTestId('GUILD_SESSION_LIST')).toBeVisible();
  });
});
