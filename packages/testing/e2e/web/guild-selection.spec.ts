import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';

const GUILD_A_PATH = '/tmp/dm-e2e-guild-a';
const GUILD_B_PATH = '/tmp/dm-e2e-guild-b';
const EMPTY_GUILD_PATH = '/tmp/dm-e2e-empty';

const envA = environmentHarness({ guildPath: GUILD_A_PATH });
wireHarnessLifecycle({ harness: envA, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_B_PATH }), testObj: test });
wireHarnessLifecycle({
  harness: environmentHarness({ guildPath: EMPTY_GUILD_PATH }),
  testObj: test,
});

const sessionsA = sessionHarness({ guildPath: GUILD_A_PATH });
const sessionsB = sessionHarness({ guildPath: GUILD_B_PATH });
const sessionsEmpty = sessionHarness({ guildPath: EMPTY_GUILD_PATH });

test.describe('Guild Selection & Session Loading', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessionsA.cleanSessionFiles();
    sessionsB.cleanSessionFiles();
    sessionsEmpty.cleanSessionFiles();
  });

  test('click guild loads its session list', async ({ page, request }) => {
    await guildHarness({ request }).createGuild({ name: 'Guild A', path: GUILD_A_PATH });

    const sessionId = `e2e-session-guild-a-${Date.now()}`;
    sessionsA.createSessionFile({
      sessionId,
      userMessage: 'Quest Alpha session',
    });

    // Assert that test worker HOME is the isolated test home
    expect(String(envA.getHomedir())).toContain('dm-e2e');

    await page.goto('/');
    await page.getByText('Guild A').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    await expect(page.getByTestId('GUILD_SESSION_LIST')).toBeVisible();
    await expect(page.getByTestId(`SESSION_ITEM_${sessionId}`)).toBeVisible();
    await expect(page.getByText('Quest Alpha session')).toBeVisible();
  });

  test('click guild with no quests shows empty state', async ({ page, request }) => {
    await guildHarness({ request }).createGuild({ name: 'Empty Guild', path: EMPTY_GUILD_PATH });

    await page.goto('/');
    await page.getByText('Empty Guild').click();

    await expect(page.getByTestId('SESSION_EMPTY_STATE')).toBeVisible();
    await expect(page.getByText('No sessions yet')).toBeVisible();
  });

  test('switch between guilds refreshes session list', async ({ page, request }) => {
    await guildHarness({ request }).createGuild({ name: 'Guild A', path: GUILD_A_PATH });
    await guildHarness({ request }).createGuild({ name: 'Guild B', path: GUILD_B_PATH });

    const sessionIdA = `e2e-session-a-${Date.now()}`;
    const sessionIdB = `e2e-session-b-${Date.now()}`;

    sessionsA.createSessionFile({
      sessionId: sessionIdA,
      userMessage: 'Alpha session',
    });
    sessionsB.createSessionFile({
      sessionId: sessionIdB,
      userMessage: 'Beta session',
    });

    await page.goto('/');
    await page.getByText('Guild A').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    await expect(page.getByTestId(`SESSION_ITEM_${sessionIdA}`)).toBeVisible();

    await page.getByText('Guild B').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    await expect(page.getByTestId(`SESSION_ITEM_${sessionIdA}`)).not.toBeVisible();
    await expect(page.getByTestId(`SESSION_ITEM_${sessionIdB}`)).toBeVisible();
  });
});
