import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-unparseable-sibling';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 20_000;
const LEDGER_TIMEOUT = 15_000;
const HTTP_OK = 200;

const CW1_OP = '00000000-0000-4000-8000-0000000000d1';
const CW2_OP = '00000000-0000-4000-8000-0000000000d2';
const FIRST_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000020';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Dispatch with an unparseable sibling quest file', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {guild holds one quest.json that questContract rejects} => the other quest still appears in the execution queue and its ledger dispatches to completion', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Unparseable Sibling Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // The poison pill: a real quest folder under this guild whose quest.json fails
    // questContract. Every guild-wide scan re-reads it from disk on every pass.
    const legacy = await quests.createQuest({
      guildId,
      title: 'Legacy schema quest',
      userRequest: 'Written by an older schema',
    });
    await quests.writeUnparseableQuestFile({
      questId: String(legacy.questId),
      questFolder: String(legacy.questFolder),
      questFilePath: String(legacy.filePath),
    });

    // The quest under test: in_progress with a two-item ledger, first item already linked to
    // its work item — exactly the state Start Quest leaves behind.
    const { questId } = await dispatch.seedQuest({
      guildId,
      title: 'Dispatchable Quest',
      userRequest: 'Build the feature',
      operations: [
        { id: CW1_OP, role: 'codeweaver', text: 'core: first scope', status: 'in_progress' },
        { id: CW2_OP, role: 'codeweaver', text: 'core: second scope', status: 'pending' },
      ],
      firstWorkItemId: FIRST_WORK_ITEM_ID,
    });

    // The execution queue and the dispatcher share ONE discovery (questActiveQuestsBroker), so
    // the queue endpoint is the direct read of what the dispatcher is about to scan.
    const queueResponse = await request.get('/api/quests/queue');

    expect(queueResponse.status()).toBe(HTTP_OK);

    const queueData = await queueResponse.json();

    expect(
      queueData.entries.map((entry: { questId: string; questTitle: string }) => ({
        questId: entry.questId,
        questTitle: entry.questTitle,
      })),
    ).toStrictEqual([{ questId: String(questId), questTitle: 'Dispatchable Quest' }]);

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // One numbered list: the work item minted for the first operation, then the second operation no
    // work item has claimed yet. Both read PENDING — a row draws WORK-ITEM status, not the
    // operation status the ledger box used to draw, and every e2e test pauses the dispatcher, so a
    // minted work item has not run yet.
    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(
      ['PENDING', 'PENDING'],
      {
        timeout: PANEL_TIMEOUT,
      },
    );

    // The relay advances codeweaver#1 -> codeweaver#2, then drains the codeweaver family, which
    // auto-routes onward through the family graph (questFlowStatics: riftcarver -> codeweaver ->
    // flowrider -> siegemaster -> wardFull -> @complete): each family's own drain mints the next
    // family's scopes the moment it completes, so the FIFO script carries one outcome per family
    // the router mints behind codeweaver.
    await dispatch.playAndDrive({
      questId: String(questId),
      script: [
        { role: 'codeweaver', outcome: 'done' },
        { role: 'codeweaver', outcome: 'done' },
        { role: 'flowrider', outcome: 'done' },
        { role: 'siegemaster', outcome: 'done' },
        { role: 'ward', outcome: 'green' },
      ],
    });

    // Backend truth: quest complete, every operation item complete. The scan re-reads the
    // unparseable sibling on every pass, so this also proves it stays survivable across dispatches
    // rather than only on the first one.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.status === 'complete' &&
        quest.operations.length === 5 &&
        quest.operations.every((op) => op.status === 'complete'),
    });

    expect(
      finalQuest.operations.map((op) => ({ role: String(op.role), status: op.status })),
    ).toStrictEqual([
      { role: 'codeweaver', status: 'complete' },
      { role: 'codeweaver', status: 'complete' },
      { role: 'flowrider', status: 'complete' },
      { role: 'siegemaster', status: 'complete' },
      { role: 'ward', status: 'complete' },
    ]);

    expect(
      finalQuest.workItems.map((wi) => ({ role: String(wi.role), status: wi.status })),
    ).toStrictEqual([
      { role: 'codeweaver', status: 'complete' },
      { role: 'codeweaver', status: 'complete' },
      { role: 'flowrider', status: 'complete' },
      { role: 'siegemaster', status: 'complete' },
      { role: 'siegemaster', status: 'complete' },
      { role: 'siegemaster', status: 'complete' },
      { role: 'ward', status: 'complete' },
    ]);

    // Eight rows, not seven: each codeweaver scope and the flowrider and ward scopes hold exactly
    // one work item each and stay BARE, but siegemaster's single scope holds all three of its work
    // items and grows an operation HEADER plus one nested row per item — 2 (codeweaver) + 1
    // (flowrider) + 4 (siegemaster header + 3 nested) + 1 (ward) = 8.
    await expect(rows.getByTestId('execution-row-status-badge')).toHaveText(
      ['DONE', 'DONE', 'DONE', 'DONE', 'DONE', 'DONE', 'DONE', 'DONE'],
      { timeout: LEDGER_TIMEOUT },
    );
  });
});
