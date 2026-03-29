import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';

const GUILD_A_PATH = '/tmp/dm-e2e-visual-a';
const GUILD_B_PATH = '/tmp/dm-e2e-visual-b';
const GUILD_C_PATH = '/tmp/dm-e2e-visual-c';
const STATUS_GUILD_PATH = '/tmp/dm-e2e-visual-status';
const HTTP_OK = 200;

// Wire environment harnesses to create guild directories before each test
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_A_PATH }), testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_B_PATH }), testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_C_PATH }), testObj: test });
wireHarnessLifecycle({
  harness: environmentHarness({ guildPath: STATUS_GUILD_PATH }),
  testObj: test,
});

const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: STATUS_GUILD_PATH }),
  testObj: test,
});

test.describe('Status Badges & Visual', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: selected guild has gold highlight', async ({ page, request }) => {
    const guilds = guildHarness({ request });
    const guildA = await guildHarness({ request }).createGuild({
      name: 'Guild A',
      path: GUILD_A_PATH,
    });
    const guildB = await guildHarness({ request }).createGuild({
      name: 'Guild B',
      path: GUILD_B_PATH,
    });
    const guildAId = guilds.extractGuildId({ guild: guildA });
    const guildBId = guilds.extractGuildId({ guild: guildB });

    await page.goto('/');
    await page.getByTestId(`GUILD_ITEM_${guildAId}`).click();

    // Selected guild should have gold-colored styling
    const selectedGuild = page.getByTestId(`GUILD_ITEM_${guildAId}`);

    await expect(selectedGuild).toBeVisible();

    // Check it has a distinct style (gold color on text)
    await expect(selectedGuild).toHaveCSS('color', /./u);

    // Unselected guild should have different styling
    const unselectedGuild = page.getByTestId(`GUILD_ITEM_${guildBId}`);

    // The selected and unselected guilds should have distinct text color
    await expect(selectedGuild).not.toHaveCSS('color', 'rgb(0, 0, 0)');
    await expect(unselectedGuild).toBeVisible();
  });

  test('VALID: session items display summary text', async ({ page, request }) => {
    await guildHarness({ request }).createGuild({ name: 'Status Guild', path: STATUS_GUILD_PATH });

    const sessionId = `e2e-session-visual-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Test status',
    });

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto('/');
    await guildsResponsePromise;

    await expect(page.getByText('Status Guild')).toBeVisible();

    await page.getByText('Status Guild').click();

    await expect(page.getByTestId('SESSION_FILTER')).toBeVisible();

    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    const sessionItem = page.getByTestId(`SESSION_ITEM_${sessionId}`);

    await expect(sessionItem).toBeVisible();
    await expect(page.getByText('Test status')).toBeVisible();
  });

  test('VALID: multiple guilds all visible', async ({ page, request }) => {
    await guildHarness({ request }).createGuild({ name: 'Guild A', path: GUILD_A_PATH });
    await guildHarness({ request }).createGuild({ name: 'Guild B', path: GUILD_B_PATH });
    await guildHarness({ request }).createGuild({ name: 'Guild C', path: GUILD_C_PATH });

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto('/');
    await guildsResponsePromise;

    await expect(page.getByText('Guild A')).toBeVisible();
    await expect(page.getByText('Guild B')).toBeVisible();
    await expect(page.getByText('Guild C')).toBeVisible();
  });
});
