import * as crypto from 'crypto';
import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-home-session-list-distinct-rows';
const HTTP_OK = 200;
const NAV_TIMEOUT = 5_000;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Home content list — quest rows vs session rows by filter', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {1 quest file + 3 sessions tied to it} => Quests Only shows 1 quest row, All shows 3 distinct session rows', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const guild = await guilds.createGuild({ name: 'Distinct Rows Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });

    // Three sessions on disk, each with a UNIQUE first user message — that's the
    // session-specific summary the All-mode list must render per row.
    const stamp = Date.now();
    const sessionA = `e2e-distinct-a-${stamp}`;
    const sessionB = `e2e-distinct-b-${stamp}`;
    const sessionC = `e2e-distinct-c-${stamp}`;
    const summaryA = 'Investigate failing ward run on master';
    const summaryB = 'Explain why the orchestrator drops empty thinking blocks';
    const summaryC = 'Refactor session-list-broker to dedupe quest rows';
    const questTitle = 'Same Quest, Different Sessions';

    sessions.createSessionFile({ sessionId: sessionA, userMessage: summaryA });
    sessions.createSessionFile({ sessionId: sessionB, userMessage: summaryB });
    sessions.createSessionFile({ sessionId: sessionC, userMessage: summaryC });

    // ONE quest file whose workItems reference all three sessionIds. The user-stated
    // invariant: "Quests Only" mode is one-to-one with quest files on disk — so
    // having three sessions tied to this quest must NOT cause three rows to render.
    const created = await quests.createQuest({
      guildId: String(guildId),
      title: questTitle,
      userRequest: 'Same quest userRequest used across sessions',
    });
    const questId = String(created.questId);
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      title: questTitle,
      status: 'paused',
      userRequest: 'Same quest userRequest used across sessions',
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: sessionA,
          status: 'complete',
        },
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: sessionB,
          status: 'complete',
        },
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: sessionC,
          status: 'complete',
        },
      ],
    });

    await page.goto('/');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByText('Distinct Rows Guild').click();

    // Default filter is "Quests Only". Wait for either a quest row or a session
    // row to render so the panel has loaded before we count.
    await expect(page.getByTestId(`QUEST_ITEM_${questId}`)).toBeVisible({
      timeout: NAV_TIMEOUT,
    });

    // PRIMARY INVARIANT (was missing from the prior version of this test, which is
    // why a partial fix shipped): "Quests Only" mode is one-to-one with quest
    // files. One quest file on disk => exactly one row, regardless of how many
    // sessions are tied to that quest.
    await expect(page.locator('[data-testid^="QUEST_ITEM_"]')).toHaveCount(1);

    // The single quest row's text is the quest title.
    await expect(page.getByTestId(`QUEST_ITEM_${questId}`).locator('span').first()).toHaveText(
      questTitle,
    );

    // While in Quests Only, no SESSION_ITEM rows should leak through. The two row
    // namespaces are disjoint by mode.
    await expect(page.locator('[data-testid^="SESSION_ITEM_"]')).toHaveCount(0);

    // Switch to "All" mode. Now the panel must render the underlying session
    // JSONLs one-to-one.
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    await expect(page.getByTestId(`SESSION_ITEM_${sessionA}`)).toBeVisible({
      timeout: NAV_TIMEOUT,
    });
    await expect(page.getByTestId(`SESSION_ITEM_${sessionB}`)).toBeVisible();
    await expect(page.getByTestId(`SESSION_ITEM_${sessionC}`)).toBeVisible();

    // The QUEST badge is metadata that tells the user "this session worked on a
    // quest." Allowed to appear on each session row that has questId.
    await expect(page.getByTestId(`SESSION_QUEST_BADGE_${sessionA}`)).toBeVisible();
    await expect(page.getByTestId(`SESSION_QUEST_BADGE_${sessionB}`)).toBeVisible();
    await expect(page.getByTestId(`SESSION_QUEST_BADGE_${sessionC}`)).toBeVisible();

    // Each session row displays its OWN session summary, not a clobbered quest
    // title. The summary span is the first <span> in the row.
    const rowSummary = (sessionId: string) =>
      page.getByTestId(`SESSION_ITEM_${sessionId}`).locator('span').first();

    await expect(rowSummary(sessionA)).toHaveText(summaryA);
    await expect(rowSummary(sessionB)).toHaveText(summaryB);
    await expect(rowSummary(sessionC)).toHaveText(summaryC);

    // While in All, no QUEST_ITEM rows should leak through.
    await expect(page.locator('[data-testid^="QUEST_ITEM_"]')).toHaveCount(0);
  });
});
