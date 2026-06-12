import * as crypto from 'crypto';
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-delete-from-root';
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const NAV_TIMEOUT = 5_000;
const DELETE_TIMEOUT = 10_000;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Delete quest from root page — skull → Banish', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {paused quest + its session file on disk} => Banish removes the quest folder from disk, leaves the session file untouched, and drops the row', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const guild = await guilds.createGuild({ name: 'Delete Quest Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });

    // A session JSONL on disk, tied to the quest. It lives under
    // ~/.claude/projects/<guild>/ — outside the dungeonmaster home where the quest
    // folder lives — so the delete must not touch it.
    const stamp = Date.now();
    const sessionId = `e2e-delete-session-${stamp}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the deletable quest' });

    const questTitle = 'Quest To Banish';
    const created = await quests.createQuest({
      guildId: String(guildId),
      title: questTitle,
      userRequest: 'Build the deletable quest',
    });
    const questId = String(created.questId);
    const questFilePath = String(created.filePath);

    // paused => deletable. The skull renders only for deletable statuses.
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath,
      title: questTitle,
      status: 'paused',
      userRequest: 'Build the deletable quest',
      workItems: [
        { id: crypto.randomUUID(), role: 'chaoswhisperer', sessionId, status: 'complete' },
      ],
    });

    // Preconditions hold on disk before any UI action.
    expect(quests.questFolderExists({ questFilePath })).toBe(true);
    expect(sessions.sessionFileExists({ sessionId })).toBe(true);

    await page.goto('/');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByText('Delete Quest Guild').click();

    // Quests Only is the default filter — the deletable quest row renders with its skull.
    await expect(page.getByTestId(`QUEST_ITEM_${questId}`)).toBeVisible({ timeout: NAV_TIMEOUT });
    await expect(page.getByTestId(`QUEST_DELETE_${questId}`)).toBeVisible();

    // Click the skull → the confirm popover opens (no navigation off '/').
    await page.getByTestId(`QUEST_DELETE_${questId}`).click();
    await expect(page.getByTestId(`QUEST_DELETE_POPOVER_${questId}`)).toBeVisible();
    await expect(
      page
        .getByTestId(`QUEST_DELETE_POPOVER_${questId}`)
        .getByText(`Deleting ${questTitle} is permanent. Are you sure?`),
    ).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/');

    // Banish → exactly one DELETE to /api/quests/<questId>?guildId=<guildId>.
    const deletePromise = page.waitForRequest(
      (req) => req.method() === 'DELETE' && req.url().includes(`/api/quests/${questId}`),
    );
    await page
      .getByTestId(`QUEST_DELETE_POPOVER_${questId}`)
      .getByRole('button', { name: 'Banish' })
      .click();
    const deleteReq = await deletePromise;
    expect(new URL(deleteReq.url()).searchParams.get('guildId')).toBe(String(guildId));

    // New UI: the row and the popover are both gone after the successful delete.
    await expect(page.getByTestId(`QUEST_ITEM_${questId}`)).not.toBeVisible({
      timeout: DELETE_TIMEOUT,
    });
    await expect(page.getByTestId(`QUEST_DELETE_POPOVER_${questId}`)).not.toBeVisible();

    // Disk side-effects: the quest folder is gone, the session file remains.
    expect(quests.questFolderExists({ questFilePath })).toBe(false);
    expect(sessions.sessionFileExists({ sessionId })).toBe(true);
  });

  test('VALID: {deletable quest} => Spare closes the popover, sends no DELETE, and keeps the row + quest folder', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const guild = await guilds.createGuild({ name: 'Spare Quest Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });

    const questTitle = 'Quest To Spare';
    const created = await quests.createQuest({
      guildId: String(guildId),
      title: questTitle,
      userRequest: 'Build the spareable quest',
    });
    const questId = String(created.questId);
    const questFilePath = String(created.filePath);

    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath,
      title: questTitle,
      status: 'paused',
      userRequest: 'Build the spareable quest',
      workItems: [],
    });

    await page.goto('/');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );
    await page.getByText('Spare Quest Guild').click();

    await expect(page.getByTestId(`QUEST_ITEM_${questId}`)).toBeVisible({ timeout: NAV_TIMEOUT });

    await page.getByTestId(`QUEST_DELETE_${questId}`).click();
    await expect(page.getByTestId(`QUEST_DELETE_POPOVER_${questId}`)).toBeVisible();

    // No DELETE may fire on the Spare path. Track it across the click + settle window.
    let deleteSeen = false;
    page.on('request', (req) => {
      if (req.method() === 'DELETE' && req.url().includes(`/api/quests/${questId}`)) {
        deleteSeen = true;
      }
    });

    await page
      .getByTestId(`QUEST_DELETE_POPOVER_${questId}`)
      .getByRole('button', { name: 'Spare' })
      .click();

    // Old UI: the popover is dismissed.
    await expect(page.getByTestId(`QUEST_DELETE_POPOVER_${questId}`)).not.toBeVisible();
    // Surviving UI: the row stays.
    await expect(page.getByTestId(`QUEST_ITEM_${questId}`)).toBeVisible();

    expect(deleteSeen).toBe(false);
    expect(quests.questFolderExists({ questFilePath })).toBe(true);
  });

  test('ERROR: {quest goes active after the row rendered} => Banish hits a real 400, a red error toast shows the server message, and the row + quest folder survive', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const guild = await guilds.createGuild({ name: 'Reject Quest Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });

    const questTitle = 'Quest That Goes Active';
    const created = await quests.createQuest({
      guildId: String(guildId),
      title: questTitle,
      userRequest: 'Build the rejected quest',
    });
    const questId = String(created.questId);
    const questFolder = String(created.questFolder);
    const questFilePath = String(created.filePath);

    // The list snapshot the row renders from is `paused` (deletable) — so the skull shows.
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      title: questTitle,
      status: 'paused',
      userRequest: 'Build the rejected quest',
      workItems: [],
    });

    await page.goto('/');
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );
    await page.getByText('Reject Quest Guild').click();

    await expect(page.getByTestId(`QUEST_ITEM_${questId}`)).toBeVisible({ timeout: NAV_TIMEOUT });
    await expect(page.getByTestId(`QUEST_DELETE_${questId}`)).toBeVisible();

    await page.getByTestId(`QUEST_DELETE_${questId}`).click();
    await expect(page.getByTestId(`QUEST_DELETE_POPOVER_${questId}`)).toBeVisible();

    // Precondition mutation (NOT the action under test): flip the quest to in_progress on
    // disk so the server's delete guard sees a non-deletable status. The rendered list keeps
    // its cached `paused` snapshot (the binding only refetches on refresh()), so the skull's
    // popover stays open and Banish is still clickable — exactly the render-then-go-active
    // race the error-toast branch exists for.
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      title: questTitle,
      status: 'in_progress',
      userRequest: 'Build the rejected quest',
      workItems: [],
    });

    // Banish → exactly one real DELETE that the server answers with a 400.
    const deletePromise = page.waitForRequest(
      (req) => req.method() === 'DELETE' && req.url().includes(`/api/quests/${questId}`),
    );
    const deleteResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/quests/${questId}`) && resp.request().method() === 'DELETE',
    );
    await page
      .getByTestId(`QUEST_DELETE_POPOVER_${questId}`)
      .getByRole('button', { name: 'Banish' })
      .click();
    await deletePromise;
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(HTTP_BAD_REQUEST);

    // New UI: the red error toast carries the server's own rejection message.
    await expect(
      page.getByText(
        'Quest must be in a terminal, paused, or pre-execution status to delete. Pause or abandon the quest first.',
      ),
    ).toBeVisible({ timeout: DELETE_TIMEOUT });

    // Feedback is the toast only: the popover closes, the row + quest folder both survive.
    await expect(page.getByTestId(`QUEST_DELETE_POPOVER_${questId}`)).not.toBeVisible();
    await expect(page.getByTestId(`QUEST_ITEM_${questId}`)).toBeVisible();
    expect(quests.questFolderExists({ questFilePath })).toBe(true);
  });
});
