import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-unreadable-quest-report';
const HTTP_OK = 200;
const ROW_TIMEOUT = 10_000;
// Every folder on disk must be represented by exactly one surface: two readable quest rows
// plus one unreadable-quest row.
const QUEST_SURFACE_SELECTOR = '[data-testid^="QUEST_ITEM_"], [data-testid="UNREADABLE_QUEST_ROW"]';
const QUEST_FOLDER_COUNT = 3;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Unreadable quest file is reported on homebase', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {guild holds three quest folders, one quest.json rejects questContract} => the list payload names the skipped file and homebase renders it as its own row that survives a reload', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });

    const guild = await guilds.createGuild({ name: 'Unreadable Report Guild', path: GUILD_PATH });
    const guildId = String(guilds.extractGuildId({ guild }));

    const readableOne = await quests.createQuest({
      guildId,
      title: 'Readable Quest One',
      userRequest: 'Build one',
    });
    const readableTwo = await quests.createQuest({
      guildId,
      title: 'Readable Quest Two',
      userRequest: 'Build two',
    });
    const legacy = await quests.createQuest({
      guildId,
      title: 'Legacy schema quest',
      userRequest: 'Written by an older schema',
    });
    quests.writeUnparseableQuestFile({
      questId: String(legacy.questId),
      questFolder: String(legacy.questFolder),
      questFilePath: String(legacy.filePath),
    });
    const legacyFolder = String(legacy.questFolder);

    const listResponse = await request.get(`/api/quests?guildId=${guildId}`);

    expect(listResponse.status()).toBe(HTTP_OK);

    const listBody = await listResponse.json();

    // A bare array is exactly what makes this bug invisible: a short list and a complete list
    // are the same shape on the wire. The payload has to carry both halves.
    expect(Array.isArray(listBody)).toBe(false);

    expect(listBody.quests.map((quest: { title: string }) => quest.title).sort()).toStrictEqual([
      'Readable Quest One',
      'Readable Quest Two',
    ]);
    expect(listBody.skipped.map((skip: { questFolder: string }) => skip.questFolder)).toStrictEqual(
      [legacyFolder],
    );
    expect(String(listBody.skipped[0].questFilePath)).toBe(String(legacy.filePath));

    // The reason names every field questContract rejected, not just "unreadable".
    const rejectedFields = String(listBody.skipped[0].reason)
      .split('; ')
      .map((issue: string) => issue.split(':')[0]);

    expect(rejectedFields).toStrictEqual(['workItems.0.role', 'workItems.0.relatedDataItems.0']);

    await page.goto('/');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );
    await page.getByText('Unreadable Report Guild').click();

    await expect(page.getByTestId(`QUEST_ITEM_${String(readableOne.questId)}`)).toBeVisible({
      timeout: ROW_TIMEOUT,
    });
    await expect(page.getByTestId(`QUEST_ITEM_${String(readableTwo.questId)}`)).toBeVisible();

    // The persistent surface: its own element, naming the folder and the rejected field.
    const unreadableRow = page.getByTestId('UNREADABLE_QUEST_ROW');

    await expect(unreadableRow).toBeVisible({ timeout: ROW_TIMEOUT });
    await expect(unreadableRow).toContainText(legacyFolder);
    await expect(unreadableRow).toContainText('workItems.0.role');
    await expect(unreadableRow).toContainText('UNREADABLE');
    await expect(page.getByTestId('SESSION_EMPTY_STATE')).not.toBeVisible();

    await expect(page.getByText('1 quest file could not be read')).toBeVisible({
      timeout: ROW_TIMEOUT,
    });

    await expect(page.locator(QUEST_SURFACE_SELECTOR)).toHaveCount(QUEST_FOLDER_COUNT);

    // A toast alone does not satisfy the acceptance bar — the surface has to outlive a reload.
    await page.reload();

    const reloadedRow = page.getByTestId('UNREADABLE_QUEST_ROW');

    await expect(reloadedRow).toBeVisible({ timeout: ROW_TIMEOUT });
    await expect(reloadedRow).toContainText(legacyFolder);
    await expect(reloadedRow).toContainText('workItems.0.role');
    await expect(page.locator(QUEST_SURFACE_SELECTOR)).toHaveCount(QUEST_FOLDER_COUNT);
  });

  test('VALID: {session filter switched to All} => the session surface names the unreadable quest file instead of presenting its sessions as quest-less', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });

    const guild = await guilds.createGuild({ name: 'Unreadable Session Guild', path: GUILD_PATH });
    const guildId = String(guilds.extractGuildId({ guild }));

    const legacy = await quests.createQuest({
      guildId,
      title: 'Legacy schema quest',
      userRequest: 'Written by an older schema',
    });
    quests.writeUnparseableQuestFile({
      questId: String(legacy.questId),
      questFolder: String(legacy.questFolder),
      questFilePath: String(legacy.filePath),
    });
    const legacyFolder = String(legacy.questFolder);

    await page.goto('/');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );
    await page.getByText('Unreadable Session Guild').click();

    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    const unreadableRow = page.getByTestId('UNREADABLE_QUEST_ROW');

    await expect(unreadableRow).toBeVisible({ timeout: ROW_TIMEOUT });
    await expect(unreadableRow).toContainText(legacyFolder);
    await expect(unreadableRow).toContainText('workItems.0.role');
  });
});
