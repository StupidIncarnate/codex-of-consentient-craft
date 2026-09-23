/**
 * PURPOSE: Proves that the api route and write route produce equivalent domain state for the quest
 * ingredient under the same framework runner — the quest counterpart of
 * guild-two-route-comparison.e2e.ts, closing scrolls/seigelense/remaining-build-items.md item 7a
 * ("nothing compares [the quest ingredient] to its api route").
 */
import { questListResultContract } from '@dungeonmaster/shared/contracts';

import { test, expect } from '../../../test/harnesses/e2e-fixtures';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_NAME = 'Quest Dual Route Guild';
const GUILD_PATH = '/tmp/dm-e2e-quest-two-route';
const SHARED_TITLE = 'Dual Route Quest';
const SHARED_USER_REQUEST = 'Compare the api and write routes for one quest';
const HTTP_OK = 200;
const PANEL_TIMEOUT = 10_000;

test.describe('Quest Two-Route Comparison', () => {
  let guilds: ReturnType<typeof guildHarness>;
  let quests: ReturnType<typeof questHarness>;

  test.beforeEach(async ({ baseURL, request }) => {
    guilds = guildHarness({ ...(baseURL === undefined ? {} : { baseURL }), request });
    quests = questHarness({ ...(baseURL === undefined ? {} : { baseURL }), request });
    await guilds.cleanGuilds();
  });

  test('VALID: {same quest fields via api and write routes} => produces equivalent domain state', async ({
    page,
    request,
  }) => {
    const guild = await guilds.createGuild({ name: GUILD_NAME, path: GUILD_PATH });
    const guildId = String(guilds.extractGuildId({ guild }));
    const urlSlug = String(guilds.extractUrlSlug({ guild }));

    const apiQuest = await quests.createQuest({
      guildId,
      title: SHARED_TITLE,
      userRequest: SHARED_USER_REQUEST,
    });
    const writeQuest = await quests.createQuestViaWriteRoute({
      guildId,
      title: SHARED_TITLE,
      userRequest: SHARED_USER_REQUEST,
    });

    const apiQuestId = String(apiQuest.questId);
    const writeQuestId = String(writeQuest.questId);

    // The one legitimate difference: both routes mint their own id independently.
    expect(apiQuestId !== writeQuestId).toBe(true);

    const listResponse = await request.get(`/api/quests?guildId=${guildId}`);
    expect(listResponse.status()).toBe(HTTP_OK);
    const rawListBody: unknown = await listResponse.json();
    const parsedList = questListResultContract.parse(rawListBody);
    const apiListItem = parsedList.quests.find((quest) => quest.id === apiQuestId);
    const writeListItem = parsedList.quests.find((quest) => quest.id === writeQuestId);
    if (apiListItem === undefined || writeListItem === undefined) {
      throw new Error(
        `quest-two-route-comparison: expected both ${apiQuestId} and ${writeQuestId} in ` +
          `GET /api/quests?guildId=${guildId}, got ${JSON.stringify(parsedList.quests.map((q) => q.id))}`,
      );
    }

    // Every supplied field agrees between routes, and both start at the same default status —
    // one combined toStrictEqual per record so an unnoticed extra/dropped field fails loudly.
    const EXPECTED_COMPARABLE_FIELDS = {
      title: SHARED_TITLE,
      userRequest: SHARED_USER_REQUEST,
      status: 'created',
    };
    expect({
      title: apiListItem.title,
      userRequest: apiListItem.userRequest,
      status: apiListItem.status,
    }).toStrictEqual(EXPECTED_COMPARABLE_FIELDS);
    expect({
      title: writeListItem.title,
      userRequest: writeListItem.userRequest,
      status: writeListItem.status,
    }).toStrictEqual(EXPECTED_COMPARABLE_FIELDS);

    await page.goto('/');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );
    await page.getByText(GUILD_NAME).click();

    // Both rows render on the guild's quest list, each with the shared title and status text.
    await expect(page.getByTestId(`QUEST_ITEM_${apiQuestId}`)).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId(`QUEST_ITEM_${writeQuestId}`)).toBeVisible();

    await expect(page.getByTestId(`QUEST_ITEM_${apiQuestId}`).locator('span').first()).toHaveText(
      SHARED_TITLE,
    );
    await expect(page.getByTestId(`QUEST_ITEM_${writeQuestId}`).locator('span').first()).toHaveText(
      SHARED_TITLE,
    );

    await expect(page.getByTestId(`QUEST_STATUS_${apiQuestId}`)).toHaveText('CREATED');
    await expect(page.getByTestId(`QUEST_STATUS_${writeQuestId}`)).toHaveText('CREATED');

    // Opening each quest's own workspace renders the same title and pinned user request too.
    const nav = navigationHarness({ page });

    await nav.navigateToQuest({ urlSlug, questId: apiQuestId });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_TITLE')).toHaveText(SHARED_TITLE);
    await expect(page.getByTestId('USER_REQUEST_TEXT')).toHaveText(SHARED_USER_REQUEST);

    await nav.navigateToQuest({ urlSlug, questId: writeQuestId });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_TITLE')).toHaveText(SHARED_TITLE);
    await expect(page.getByTestId('USER_REQUEST_TEXT')).toHaveText(SHARED_USER_REQUEST);
  });
});
