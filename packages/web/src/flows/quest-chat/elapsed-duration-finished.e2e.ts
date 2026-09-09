import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { elapsedDurationHarness } from '../../../test/harnesses/elapsed-duration/elapsed-duration.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-elapsed-duration-finished';
const PANEL_TIMEOUT = 10_000;

// Every scenario below freezes the browser's Date at this exact instant via page.clock, mirroring
// elapsed-duration-bands.e2e.ts. With Date frozen, a 60-second tick firing would change NOTHING —
// every recomputation reads the same frozen now — so any figure change a test below observes can
// only have come from the re-render that a completedAt/status write caused, never from a tick.
// That is what makes "on that render rather than at the next tick" a measured claim here, not an
// assumption. Nothing in this file needs page.clock.install or a fastForward.
const FIXED_NOW = '2026-01-01T12:00:00.000Z';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Live elapsed duration on in-progress execution rows: completion freezes the figure', () => {
  test.describe.configure({ timeout: 30_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {four already-completed rows at four spans} => each execution-row-duration reads the exact band its own completedAt-minus-startedAt span crosses', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Finished Band Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const UNDER_MIN_OP = '00000000-0000-4000-8000-0000a1000001';
    const MINUTES_OP = '00000000-0000-4000-8000-0000a1000002';
    const HOURS_MINUTES_OP = '00000000-0000-4000-8000-0000a1000003';
    const WHOLE_HOUR_OP = '00000000-0000-4000-8000-0000a1000004';

    const UNDER_MIN_WI = 'e2e00000-0000-4000-8000-0000a1000001';
    const MINUTES_WI = 'e2e00000-0000-4000-8000-0000a1000002';
    const HOURS_MINUTES_WI = 'e2e00000-0000-4000-8000-0000a1000003';
    const WHOLE_HOUR_WI = 'e2e00000-0000-4000-8000-0000a1000004';

    const UNDER_MIN_TEXT = 'codeweaver: finished band twelve seconds under a minute';
    const MINUTES_TEXT = 'codeweaver: finished band four minutes twelve seconds';
    const HOURS_MINUTES_TEXT = 'codeweaver: finished band one hour thirteen minutes';
    const WHOLE_HOUR_TEXT = 'codeweaver: finished band two hours exactly';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Finished Band Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = String(created.filePath);

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath,
      status: 'in_progress',
      operations: [
        { id: UNDER_MIN_OP, role: 'codeweaver', text: UNDER_MIN_TEXT, status: 'complete' },
        { id: MINUTES_OP, role: 'codeweaver', text: MINUTES_TEXT, status: 'complete' },
        { id: HOURS_MINUTES_OP, role: 'codeweaver', text: HOURS_MINUTES_TEXT, status: 'complete' },
        { id: WHOLE_HOUR_OP, role: 'codeweaver', text: WHOLE_HOUR_TEXT, status: 'complete' },
      ],
      workItems: [
        {
          id: UNDER_MIN_WI,
          role: 'codeweaver',
          status: 'complete',
          relatedDataItems: [`operations/${UNDER_MIN_OP}`],
        },
        {
          id: MINUTES_WI,
          role: 'codeweaver',
          status: 'complete',
          relatedDataItems: [`operations/${MINUTES_OP}`],
        },
        {
          id: HOURS_MINUTES_WI,
          role: 'codeweaver',
          status: 'complete',
          relatedDataItems: [`operations/${HOURS_MINUTES_OP}`],
        },
        {
          id: WHOLE_HOUR_WI,
          role: 'codeweaver',
          status: 'complete',
          relatedDataItems: [`operations/${WHOLE_HOUR_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        // check-finished-under-minute: a 12s span reads '<1m', never '0m' or '12s'.
        {
          id: UNDER_MIN_WI,
          startedAt: '2026-01-01T09:00:00.000Z',
          completedAt: '2026-01-01T09:00:12.000Z',
        },
        // check-finished-minutes: a 4m12s span reads '4m', with the seconds dropped.
        {
          id: MINUTES_WI,
          startedAt: '2026-01-01T09:10:00.000Z',
          completedAt: '2026-01-01T09:14:12.000Z',
        },
        // check-finished-hours-minutes: a 1h13m span reads '1h13m', never '73m'.
        {
          id: HOURS_MINUTES_WI,
          startedAt: '2026-01-01T09:20:00.000Z',
          completedAt: '2026-01-01T10:33:00.000Z',
        },
        // check-finished-whole-hour: an exact 2h span reads '2h', never '2h0m' or '120m'.
        {
          id: WHOLE_HOUR_WI,
          startedAt: '2026-01-01T09:30:00.000Z',
          completedAt: '2026-01-01T11:30:00.000Z',
        },
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const rows = executionPanel.getByTestId('execution-row-layer-widget');

    await expect(
      rows.filter({ hasText: UNDER_MIN_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('<1m');
    await expect(
      rows.filter({ hasText: MINUTES_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('4m');
    await expect(
      rows.filter({ hasText: HOURS_MINUTES_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('1h13m');
    await expect(
      rows.filter({ hasText: WHOLE_HOUR_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('2h');
  });

  test('VALID: {an in_progress row reading 4m receives completedAt at startedAt+600s mid-test} => the figure switches to 10m on that render, with no clock advance anywhere in the test', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Finished Immediate Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const RUNNING_OP = '00000000-0000-4000-8000-0000a2000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000a2000001';
    const RUNNING_TEXT = 'codeweaver: immediate-replace row four minutes at mount';
    const STARTED_AT = '2026-01-01T11:56:00.000Z'; // T-240s => 4m
    const COMPLETED_AT = '2026-01-01T12:06:00.000Z'; // startedAt + 600s => 10m

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Finished Immediate Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = String(created.filePath);

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath,
      status: 'in_progress',
      operations: [
        { id: RUNNING_OP, role: 'codeweaver', text: RUNNING_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: RUNNING_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: RUNNING_WI, startedAt: STARTED_AT }],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });

    await expect(row.getByTestId('execution-row-duration')).toHaveText('4m');

    // stampWorkItems' outbox line is written by THIS Node process, not the server's own
    // questPersistBroker — that raw cross-process append does not reliably wake the outbox
    // watcher for a client that subscribed before the write landed. The no-op PATCH (same value
    // the quest already has) forces the server's OWN reliable in-process persist-and-broadcast
    // path to re-read the file elapsed.stampWorkItems just wrote and push it, without going
    // around the change under test: the browser still receives the update over the websocket,
    // and every assertion below still measures what that frame produced.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: RUNNING_WI, status: 'complete', completedAt: COMPLETED_AT }],
    });
    await request.patch(`/api/quests/${questId}`, { data: { status: 'in_progress' } });

    // The clock is never advanced anywhere in this test (no fastForward, no re-freeze) — so with
    // Date frozen, a 60-second tick firing could not have produced this change even if one fired.
    // The only thing that changed between the two assertions is completedAt landing on the row, so
    // the figure moving from 4m to 10m is evidence of the completedAt re-render happening on THAT
    // render, not at the next tick.
    await expect(row.getByTestId('execution-row-duration')).toHaveText('10m');
  });

  test("VALID: {a completed row started 2 hours ago spanning 4 minutes, alone in the panel} => the figure reads the row's own 4-minute span rather than the 2-hour wall-clock span, the status badge reads DONE, and no interval is left running behind it", async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Finished Terminal Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const COMPLETED_OP = '00000000-0000-4000-8000-0000a3000001';
    const COMPLETED_WI = 'e2e00000-0000-4000-8000-0000a3000001';
    const COMPLETED_TEXT = 'codeweaver: terminal row completed four minutes two hours ago';
    const STARTED_AT = '2026-01-01T10:00:00.000Z'; // T-7200s (2h before FIXED_NOW)
    const COMPLETED_AT = '2026-01-01T10:04:12.000Z'; // startedAt + 252s => 4m

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Finished Terminal Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = String(created.filePath);

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath,
      status: 'in_progress',
      operations: [
        { id: COMPLETED_OP, role: 'codeweaver', text: COMPLETED_TEXT, status: 'complete' },
      ],
      workItems: [
        {
          id: COMPLETED_WI,
          role: 'codeweaver',
          status: 'complete',
          relatedDataItems: [`operations/${COMPLETED_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: COMPLETED_WI, startedAt: STARTED_AT, completedAt: COMPLETED_AT }],
    });

    await page.clock.setFixedTime(FIXED_NOW);
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: COMPLETED_TEXT });

    // Terminal figure: the row's OWN span (4m), never the wall-clock span against frozen now (2h).
    await expect(row.getByTestId('execution-row-duration')).toHaveText('4m');
    await expect(row.getByTestId('execution-row-status-badge')).toHaveText('DONE');

    // Side-effect surface: no in_progress row anywhere in this panel, so nothing should be
    // recomputing behind this frozen figure — the shared tick's setInterval must never register.
    const counts = await elapsed.readIntervalCounts();
    expect(counts).toStrictEqual({ registered: 0, cleared: 0, live: 0 });
  });

  test('VALID: {two rows sharing one startedAt 2 hours ago, one carrying completedAt and one still running} => the completed row reads 4m from its own end point while the running row reads the full 2h against now', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Finished Has Completed At Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const COMPLETED_OP = '00000000-0000-4000-8000-0000a4000001';
    const RUNNING_OP = '00000000-0000-4000-8000-0000a4000002';
    const COMPLETED_WI = 'e2e00000-0000-4000-8000-0000a4000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000a4000002';
    const COMPLETED_TEXT = 'codeweaver: has-completed-at row carrying its own end point';
    const RUNNING_TEXT = 'codeweaver: has-completed-at row still running toward now';
    const SHARED_STARTED_AT = '2026-01-01T10:00:00.000Z'; // T-7200s (2h before FIXED_NOW)
    const COMPLETED_AT = '2026-01-01T10:04:12.000Z'; // startedAt + 252s => 4m

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Finished Has Completed At Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = String(created.filePath);

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath,
      status: 'in_progress',
      operations: [
        { id: COMPLETED_OP, role: 'codeweaver', text: COMPLETED_TEXT, status: 'complete' },
        { id: RUNNING_OP, role: 'codeweaver', text: RUNNING_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: COMPLETED_WI,
          role: 'codeweaver',
          status: 'complete',
          relatedDataItems: [`operations/${COMPLETED_OP}`],
        },
        {
          id: RUNNING_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
      ],
    });

    // One shared startedAt across both rows: the differing labels below — not the destination —
    // are what proves which branch each row took. Both reach compute-elapsed regardless.
    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: COMPLETED_WI, startedAt: SHARED_STARTED_AT, completedAt: COMPLETED_AT },
        { id: RUNNING_WI, startedAt: SHARED_STARTED_AT },
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const completedRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: COMPLETED_TEXT });
    const runningRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });

    await expect(completedRow.getByTestId('execution-row-duration')).toHaveText('4m');
    await expect(runningRow.getByTestId('execution-row-duration')).toHaveText('2h');
  });

  test('VALID: {a running row reading <1m receives completedAt mid-test} => the figure switches to 4m and the duration element stays present rather than disappearing', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Finished Under Minute Branch Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const ROW_OP = '00000000-0000-4000-8000-0000a5000001';
    const ROW_WI = 'e2e00000-0000-4000-8000-0000a5000001';
    const ROW_TEXT = 'codeweaver: under-minute branch row that completes mid-test';
    const STARTED_AT = '2026-01-01T11:59:30.000Z'; // T-30s => <1m
    const COMPLETED_AT = '2026-01-01T12:03:42.000Z'; // startedAt + 252s => 4m

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Finished Under Minute Branch Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = String(created.filePath);

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath,
      status: 'in_progress',
      operations: [{ id: ROW_OP, role: 'codeweaver', text: ROW_TEXT, status: 'in_progress' }],
      workItems: [
        {
          id: ROW_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${ROW_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: ROW_WI, startedAt: STARTED_AT }],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: ROW_TEXT });

    await expect(row.getByTestId('execution-row-duration')).toHaveText('<1m');

    // stampWorkItems' outbox line is written by THIS Node process, not the server's own
    // questPersistBroker — that raw cross-process append does not reliably wake the outbox
    // watcher for a client that subscribed before the write landed. The no-op PATCH (same value
    // the quest already has) forces the server's OWN reliable in-process persist-and-broadcast
    // path to re-read the file elapsed.stampWorkItems just wrote and push it, without going
    // around the change under test: the browser still receives the update over the websocket,
    // and every assertion below still measures what that frame produced.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: ROW_WI, status: 'complete', completedAt: COMPLETED_AT }],
    });
    await request.patch(`/api/quests/${questId}`, { data: { status: 'in_progress' } });

    // Rule out the sibling "quest paused" -> paused-no-figure branch, where the figure would be
    // GONE rather than changed: the element must still be PRESENT, carrying the new value.
    await expect(row.getByTestId('execution-row-duration')).toBeVisible();
    await expect(row.getByTestId('execution-row-duration')).toHaveText('4m');
  });

  test('VALID: {a running row reading 4m receives completedAt mid-test that crosses into the hour band} => the figure switches to 1h13m and the duration element stays present rather than disappearing', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Finished Minutes Branch Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const ROW_OP = '00000000-0000-4000-8000-0000a6000001';
    const ROW_WI = 'e2e00000-0000-4000-8000-0000a6000001';
    const ROW_TEXT = 'codeweaver: minutes branch row that completes mid-test into the hour band';
    const STARTED_AT = '2026-01-01T11:56:00.000Z'; // T-240s => 4m
    const COMPLETED_AT = '2026-01-01T13:09:00.000Z'; // startedAt + 4380s => 1h13m

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Finished Minutes Branch Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = String(created.filePath);

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath,
      status: 'in_progress',
      operations: [{ id: ROW_OP, role: 'codeweaver', text: ROW_TEXT, status: 'in_progress' }],
      workItems: [
        {
          id: ROW_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${ROW_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: ROW_WI, startedAt: STARTED_AT }],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: ROW_TEXT });

    await expect(row.getByTestId('execution-row-duration')).toHaveText('4m');

    // stampWorkItems' outbox line is written by THIS Node process, not the server's own
    // questPersistBroker — that raw cross-process append does not reliably wake the outbox
    // watcher for a client that subscribed before the write landed. The no-op PATCH (same value
    // the quest already has) forces the server's OWN reliable in-process persist-and-broadcast
    // path to re-read the file elapsed.stampWorkItems just wrote and push it, without going
    // around the change under test: the browser still receives the update over the websocket,
    // and every assertion below still measures what that frame produced.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: ROW_WI, status: 'complete', completedAt: COMPLETED_AT }],
    });
    await request.patch(`/api/quests/${questId}`, { data: { status: 'in_progress' } });

    // Rule out the sibling "quest paused" -> paused-no-figure branch, where the figure would be
    // GONE rather than changed: the element must still be PRESENT, carrying the new value.
    await expect(row.getByTestId('execution-row-duration')).toBeVisible();
    await expect(row.getByTestId('execution-row-duration')).toHaveText('1h13m');
  });

  test('VALID: {a running row reading 1h13m receives completedAt mid-test that crosses back into the minute band} => the figure switches to 4m and the duration element stays present rather than disappearing', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Finished Hours Branch Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const ROW_OP = '00000000-0000-4000-8000-0000a7000001';
    const ROW_WI = 'e2e00000-0000-4000-8000-0000a7000001';
    const ROW_TEXT = 'codeweaver: hours branch row that completes mid-test into the minute band';
    const STARTED_AT = '2026-01-01T10:47:00.000Z'; // T-4380s => 1h13m
    const COMPLETED_AT = '2026-01-01T10:51:12.000Z'; // startedAt + 252s => 4m

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Finished Hours Branch Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = String(created.filePath);

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath,
      status: 'in_progress',
      operations: [{ id: ROW_OP, role: 'codeweaver', text: ROW_TEXT, status: 'in_progress' }],
      workItems: [
        {
          id: ROW_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${ROW_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: ROW_WI, startedAt: STARTED_AT }],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: ROW_TEXT });

    await expect(row.getByTestId('execution-row-duration')).toHaveText('1h13m');

    // stampWorkItems' outbox line is written by THIS Node process, not the server's own
    // questPersistBroker — that raw cross-process append does not reliably wake the outbox
    // watcher for a client that subscribed before the write landed. The no-op PATCH (same value
    // the quest already has) forces the server's OWN reliable in-process persist-and-broadcast
    // path to re-read the file elapsed.stampWorkItems just wrote and push it, without going
    // around the change under test: the browser still receives the update over the websocket,
    // and every assertion below still measures what that frame produced.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: ROW_WI, status: 'complete', completedAt: COMPLETED_AT }],
    });
    await request.patch(`/api/quests/${questId}`, { data: { status: 'in_progress' } });

    // Rule out the sibling "quest paused" -> paused-no-figure branch, where the figure would be
    // GONE rather than changed: the element must still be PRESENT, carrying the new value.
    await expect(row.getByTestId('execution-row-duration')).toBeVisible();
    await expect(row.getByTestId('execution-row-duration')).toHaveText('4m');
  });
});
