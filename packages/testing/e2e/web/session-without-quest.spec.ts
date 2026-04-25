import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-session-without-quest';
const HTTP_OK = 200;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Session without Quest (read-only view)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: orphan session URL renders chat history without input or right panel', async ({
    page,
    request,
  }) => {
    await guildHarness({ request }).createGuild({ name: 'Orphan Guild', path: GUILD_PATH });

    const sessionId = `e2e-orphan-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Past chat with no quest',
    });

    await page.goto('/');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByText('Orphan Guild').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();
    await page.getByTestId(`SESSION_ITEM_${sessionId}`).click();

    await expect(page.getByTestId('QUEST_CHAT')).toBeVisible();
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible();

    await expect(page.getByTestId('CHAT_INPUT')).not.toBeVisible();
    await expect(page.getByTestId('SEND_BUTTON')).not.toBeVisible();
    await expect(page.getByTestId('QUEST_CHAT_DIVIDER')).not.toBeVisible();
    await expect(page.getByTestId('QUEST_CHAT_ACTIVITY')).not.toBeVisible();
  });
});
