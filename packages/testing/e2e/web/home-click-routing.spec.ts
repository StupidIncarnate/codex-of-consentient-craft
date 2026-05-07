import * as crypto from 'crypto';
import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-home-click-routing';
const HTTP_OK = 200;
const NAV_TIMEOUT = 5_000;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Home page session click routing', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {click quest-linked session row} => navigates to /:guildSlug/quest/:questId', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const guild = await guilds.createGuild({ name: 'Routing Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    // A quest-linked session: chaoswhisperer work item references this sessionId,
    // so the server's session list correlation populates `questId`/`questTitle`
    // on the SessionListItem the row is rendered from.
    const sessionId = `e2e-quest-row-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the quest feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Routing Quest',
      userRequest: 'Build the quest feature',
    });
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      title: 'Routing Quest',
      status: 'review_flows',
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await page.goto('/');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByText('Routing Guild').click();

    // Default filter is "Quests Only" which renders quest rows, not session rows.
    // Switch to "All" so the underlying session row (which has the QUEST badge) is
    // visible — this test exercises the session-row click path, not the quest-row
    // click path.
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    // The quest-linked row carries a QUEST badge — assert it before clicking so we
    // know the server actually correlated this session to the quest.
    await expect(page.getByTestId(`SESSION_QUEST_BADGE_${sessionId}`)).toBeVisible({
      timeout: NAV_TIMEOUT,
    });

    await page.getByTestId(`SESSION_ITEM_${sessionId}`).click();

    // The user-visible symptom: the URL must land on /quest/:questId, not /session/:sessionId.
    await page.waitForURL(`**/${urlSlug}/quest/${String(created.questId)}`, {
      timeout: NAV_TIMEOUT,
    });

    expect(page.url()).toMatch(new RegExp(`/${urlSlug}/quest/${String(created.questId)}$`, 'u'));
  });

  test('VALID: {click orphan session row (no quest)} => navigates to /:guildSlug/session/:sessionId', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({ name: 'Orphan Guild', path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    // No quest references this session — it stays an orphan session row, no QUEST badge.
    const sessionId = `e2e-orphan-row-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Just a chat, no quest' });

    await page.goto('/');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByText('Orphan Guild').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    // Orphan rows have no QUEST badge.
    await expect(page.getByTestId(`SESSION_ITEM_${sessionId}`)).toBeVisible({
      timeout: NAV_TIMEOUT,
    });
    await expect(page.getByTestId(`SESSION_QUEST_BADGE_${sessionId}`)).not.toBeVisible();

    await page.getByTestId(`SESSION_ITEM_${sessionId}`).click();

    await page.waitForURL(`**/${urlSlug}/session/${sessionId}`, { timeout: NAV_TIMEOUT });

    expect(page.url()).toMatch(new RegExp(`/${urlSlug}/session/${sessionId}$`, 'u'));
  });
});
