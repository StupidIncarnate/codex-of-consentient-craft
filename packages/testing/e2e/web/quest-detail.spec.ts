import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-detail';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest Detail Navigation', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: click session item opens quest chat in read-only view', async ({
    page,
    request,
  }) => {
    await guildHarness({ request }).createGuild({ name: 'Test Guild', path: GUILD_PATH });

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

    await expect(page.getByTestId('CHAT_INPUT')).not.toBeVisible();
    await expect(page.getByTestId('SEND_BUTTON')).not.toBeVisible();
    await expect(page.getByTestId('QUEST_CHAT_ACTIVITY')).not.toBeVisible();
    await expect(page.getByTestId('QUEST_CHAT_DIVIDER')).not.toBeVisible();
  });

  test('EDGE: browser back returns to session list', async ({ page, request }) => {
    await guildHarness({ request }).createGuild({ name: 'Back Guild', path: GUILD_PATH });

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
