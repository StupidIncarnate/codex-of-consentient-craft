import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { elapsedDurationHarness } from '../../../test/harnesses/elapsed-duration/elapsed-duration.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

const GUILD_PATH = '/tmp/dm-e2e-elapsed-duration-tick';
const PANEL_TIMEOUT = 10_000;
const TICK_MS = elapsedDisplayConfigStatics.refresh.tickMs;

// Every scenario below installs the browser's FAKE clock (page.clock.install, not just
// setFixedTime) at this exact instant, then seeds each row's startedAt as T minus the span the
// unit names. A full clock install is what lets fastForward actually fire the shared tick's
// setInterval callback — elapsed-duration-bands.e2e.ts only ever needs setFixedTime, since
// nothing there advances time.
const FIXED_NOW = '2026-01-01T12:00:00.000Z';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Live elapsed duration on in-progress execution rows: the shared 60-second tick', () => {
  test.describe.configure({ timeout: 30_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {one in_progress row started 240s before the installed time} => reads 4m, then reads 5m once the 60s tick fires', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Tick Single Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const RUNNING_OP = '00000000-0000-4000-8000-0000c1000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000c1000001';
    const RUNNING_TEXT = 'codeweaver: tick single row four minutes at mount';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Tick Single Quest',
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
      items: [{ id: RUNNING_WI, startedAt: '2026-01-01T11:56:00.000Z' }], // T-240s => 4m
    });

    await page.clock.install({ time: FIXED_NOW });
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });

    await expect(row.getByTestId('execution-row-duration')).toHaveText('4m');

    await page.clock.fastForward(TICK_MS);

    await expect(row.getByTestId('execution-row-duration')).toHaveText('5m');
  });

  test('VALID: {two in_progress rows sharing one startedAt} => both read 4m before the tick and both read 5m after it', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Tick Paired Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const FIRST_OP = '00000000-0000-4000-8000-0000c2000001';
    const SECOND_OP = '00000000-0000-4000-8000-0000c2000002';
    const FIRST_WI = 'e2e00000-0000-4000-8000-0000c2000001';
    const SECOND_WI = 'e2e00000-0000-4000-8000-0000c2000002';
    const FIRST_TEXT = 'codeweaver: paired tick row alpha sharing one startedAt';
    const SECOND_TEXT = 'codeweaver: paired tick row beta sharing one startedAt';
    const SHARED_STARTED_AT = '2026-01-01T11:56:00.000Z'; // T-240s

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Tick Paired Quest',
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
        { id: FIRST_OP, role: 'codeweaver', text: FIRST_TEXT, status: 'in_progress' },
        { id: SECOND_OP, role: 'codeweaver', text: SECOND_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: FIRST_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${FIRST_OP}`],
        },
        {
          id: SECOND_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${SECOND_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: FIRST_WI, startedAt: SHARED_STARTED_AT },
        { id: SECOND_WI, startedAt: SHARED_STARTED_AT },
      ],
    });

    await page.clock.install({ time: FIXED_NOW });
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const firstRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: FIRST_TEXT });
    const secondRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: SECOND_TEXT });

    await expect(firstRow.getByTestId('execution-row-duration')).toHaveText('4m');
    await expect(secondRow.getByTestId('execution-row-duration')).toHaveText('4m');

    await page.clock.fastForward(TICK_MS);

    await expect(firstRow.getByTestId('execution-row-duration')).toHaveText('5m');
    await expect(secondRow.getByTestId('execution-row-duration')).toHaveText('5m');
  });

  test('VALID: {two in_progress rows, one completing mid-test} => the still-running row keeps advancing to 5m on the next tick', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Tick Partial Stop Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const SURVIVOR_OP = '00000000-0000-4000-8000-0000c3000001';
    const STOPPED_OP = '00000000-0000-4000-8000-0000c3000002';
    const SURVIVOR_WI = 'e2e00000-0000-4000-8000-0000c3000001';
    const STOPPED_WI = 'e2e00000-0000-4000-8000-0000c3000002';
    const SURVIVOR_TEXT = 'codeweaver: partial stop row that keeps running';
    const STOPPED_TEXT = 'codeweaver: partial stop row that completes mid-test';
    const SHARED_STARTED_AT = '2026-01-01T11:56:00.000Z'; // T-240s

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Tick Partial Stop Quest',
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
        { id: SURVIVOR_OP, role: 'codeweaver', text: SURVIVOR_TEXT, status: 'in_progress' },
        { id: STOPPED_OP, role: 'codeweaver', text: STOPPED_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: SURVIVOR_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${SURVIVOR_OP}`],
        },
        {
          id: STOPPED_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${STOPPED_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: SURVIVOR_WI, startedAt: SHARED_STARTED_AT },
        { id: STOPPED_WI, startedAt: SHARED_STARTED_AT },
      ],
    });

    await page.clock.install({ time: FIXED_NOW });
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const survivorRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: SURVIVOR_TEXT });
    const stoppedRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: STOPPED_TEXT });

    await expect(survivorRow.getByTestId('execution-row-duration')).toHaveText('4m');
    await expect(stoppedRow.getByTestId('execution-row-duration')).toHaveText('4m');

    // Precondition drift into the mutation: stamped through the harness rather than clicked,
    // because this row's own completion is not the control under test here — the SURVIVOR row's
    // continued ticking is. The no-op PATCH (same value the quest already has) forces the
    // server's own reliable in-process persist-and-broadcast path to re-read the file
    // stampWorkItems just wrote and push it — stampWorkItems' own outbox line, written by THIS
    // Node process rather than by questPersistBroker, does not reliably wake the outbox watcher
    // for a client that subscribed before the write landed.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: STOPPED_WI, status: 'complete', completedAt: FIXED_NOW }],
    });
    await request.patch(`/api/quests/${questId}`, { data: { status: 'in_progress' } });

    await expect(stoppedRow.getByTestId('execution-row-status-badge')).toHaveText('DONE');

    await page.clock.fastForward(TICK_MS);

    await expect(survivorRow.getByTestId('execution-row-duration')).toHaveText('5m');
  });

  test('VALID: {one completed row and one in_progress row in the same panel} => the completed figure stays 1h13m across a tick while the running figure moves from 4m to 5m', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Tick Frozen Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const RUNNING_OP = '00000000-0000-4000-8000-0000c4000001';
    const FROZEN_OP = '00000000-0000-4000-8000-0000c4000002';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000c4000001';
    const FROZEN_WI = 'e2e00000-0000-4000-8000-0000c4000002';
    const RUNNING_TEXT = 'codeweaver: frozen-figure spec row still running toward now';
    const FROZEN_TEXT =
      'codeweaver: frozen-figure spec row completed one hour thirteen minutes ago';
    const FROZEN_STARTED_AT = '2026-01-01T10:47:00.000Z';
    const FROZEN_COMPLETED_AT = FIXED_NOW; // startedAt + 4380s => 1h13m

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Tick Frozen Quest',
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
        { id: FROZEN_OP, role: 'codeweaver', text: FROZEN_TEXT, status: 'complete' },
      ],
      workItems: [
        {
          id: RUNNING_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
        {
          id: FROZEN_WI,
          role: 'codeweaver',
          status: 'complete',
          relatedDataItems: [`operations/${FROZEN_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: RUNNING_WI, startedAt: '2026-01-01T11:56:00.000Z' }, // T-240s => 4m
        { id: FROZEN_WI, startedAt: FROZEN_STARTED_AT, completedAt: FROZEN_COMPLETED_AT },
      ],
    });

    await page.clock.install({ time: FIXED_NOW });
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const runningRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });
    const frozenRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: FROZEN_TEXT });

    await expect(runningRow.getByTestId('execution-row-duration')).toHaveText('4m');
    await expect(frozenRow.getByTestId('execution-row-duration')).toHaveText('1h13m');

    await page.clock.fastForward(TICK_MS);

    // The moving row is the positive beside the negative here: without it, a frozen figure and a
    // dead interval read the same.
    await expect(runningRow.getByTestId('execution-row-duration')).toHaveText('5m');
    await expect(frozenRow.getByTestId('execution-row-duration')).toHaveText('1h13m');
  });

  test('VALID: {three in_progress rows all showing figures} => the browser registers exactly one repeating interval, not one per row', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Tick Triple Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const FOUR_MIN_OP = '00000000-0000-4000-8000-0000c5000001';
    const ONE_MIN_OP = '00000000-0000-4000-8000-0000c5000002';
    const UNDER_MIN_OP = '00000000-0000-4000-8000-0000c5000003';
    const FOUR_MIN_WI = 'e2e00000-0000-4000-8000-0000c5000001';
    const ONE_MIN_WI = 'e2e00000-0000-4000-8000-0000c5000002';
    const UNDER_MIN_WI = 'e2e00000-0000-4000-8000-0000c5000003';
    const FOUR_MIN_TEXT = 'codeweaver: triple row four minutes elapsed';
    const ONE_MIN_TEXT = 'codeweaver: triple row one minute elapsed';
    const UNDER_MIN_TEXT = 'codeweaver: triple row under one minute elapsed';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Tick Triple Quest',
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
        { id: FOUR_MIN_OP, role: 'codeweaver', text: FOUR_MIN_TEXT, status: 'in_progress' },
        { id: ONE_MIN_OP, role: 'codeweaver', text: ONE_MIN_TEXT, status: 'in_progress' },
        { id: UNDER_MIN_OP, role: 'codeweaver', text: UNDER_MIN_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: FOUR_MIN_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${FOUR_MIN_OP}`],
        },
        {
          id: ONE_MIN_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${ONE_MIN_OP}`],
        },
        {
          id: UNDER_MIN_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${UNDER_MIN_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: FOUR_MIN_WI, startedAt: '2026-01-01T11:56:00.000Z' }, // T-240s => 4m
        { id: ONE_MIN_WI, startedAt: '2026-01-01T11:59:00.000Z' }, // T-60s => 1m
        { id: UNDER_MIN_WI, startedAt: '2026-01-01T11:59:30.000Z' }, // T-30s => <1m
      ],
    });

    await page.clock.install({ time: FIXED_NOW });
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const rows = executionPanel.getByTestId('execution-row-layer-widget');

    await expect(
      rows.filter({ hasText: FOUR_MIN_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('4m');
    await expect(
      rows.filter({ hasText: ONE_MIN_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('1m');
    await expect(
      rows.filter({ hasText: UNDER_MIN_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('<1m');

    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 0, live: 1 });
  });

  test('VALID: {one in_progress row, then navigating away via the app logo} => the panel unmounts and the interval is cleared', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Tick Unmount Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const RUNNING_OP = '00000000-0000-4000-8000-0000c6000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000c6000001';
    const RUNNING_TEXT = 'codeweaver: unmount spec row still running when the logo is clicked';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Tick Unmount Quest',
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
      items: [{ id: RUNNING_WI, startedAt: '2026-01-01T11:56:00.000Z' }], // T-240s => 4m
    });

    await page.clock.install({ time: FIXED_NOW });
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(
      executionPanel
        .getByTestId('execution-row-layer-widget')
        .filter({ hasText: RUNNING_TEXT })
        .getByTestId('execution-row-duration'),
    ).toHaveText('4m');

    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 0, live: 1 });

    // A client-side route change via the app's own logo link — never page.goto, which would do a
    // full document navigation and destroy the very window globals this assertion reads, making
    // "the interval was cleared" indistinguishable from "the whole page was torn down".
    await page.getByTestId('LOGO_LINK').click();

    await expect(executionPanel).not.toBeVisible({ timeout: PANEL_TIMEOUT });

    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 1, live: 0 });
  });

  test('VALID: {one in_progress row that completes mid-test} => the interval stays live while the row runs, clears the instant it stops, and the frozen figure never moves again', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Tick Branch Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const ROW_OP = '00000000-0000-4000-8000-0000c7000001';
    const ROW_WI = 'e2e00000-0000-4000-8000-0000c7000001';
    const ROW_TEXT = 'codeweaver: branch spec row that runs then completes';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Tick Branch Quest',
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
      items: [{ id: ROW_WI, startedAt: '2026-01-01T11:56:00.000Z' }], // T-240s => 4m
    });

    await page.clock.install({ time: FIXED_NOW });
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: ROW_TEXT });

    await expect(row.getByTestId('execution-row-duration')).toHaveText('4m');
    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 0, live: 1 });

    await page.clock.fastForward(TICK_MS);

    // branch: still-running — the tick fired, the row is still in_progress, and the shared
    // interval stays live. This is the sibling branch `timer-cleared` would take instead, if the
    // row had already stopped — which is why the interval count is asserted here too, not just
    // the figure.
    await expect(row.getByTestId('execution-row-duration')).toHaveText('5m');
    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 0, live: 1 });

    // stampWorkItems' outbox line is written by THIS Node process, not the server's own
    // questPersistBroker — that raw cross-process append does not reliably wake the outbox
    // watcher for a client that subscribed before the write landed. The no-op PATCH (same value
    // the quest already has) forces the server's OWN reliable in-process persist-and-broadcast
    // path to re-read the file elapsed.stampWorkItems just wrote and push it, without going
    // around the change under test: the browser still receives the update over the websocket,
    // and every assertion below still measures what that frame produced.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: ROW_WI, status: 'complete', completedAt: '2026-01-01T12:01:00.000Z' }],
    });
    await request.patch(`/api/quests/${questId}`, { data: { status: 'in_progress' } });

    // branch: no-longer-running — the same row, the same panel, now past in_progress. The live
    // interval count is the value the still-running branch above and this one produce
    // differently.
    await expect(row.getByTestId('execution-row-status-badge')).toHaveText('DONE');
    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 1, live: 0 });

    await page.clock.fastForward(TICK_MS);

    // terminal: timer-cleared — nothing is recomputing. The completed figure is unchanged by a
    // tick that fires after the interval cleared, the row is still on screen, and its status
    // badge still reads DONE rather than a stuck spinner.
    await expect(row.getByTestId('execution-row-duration')).toHaveText('5m');
    await expect(row.getByTestId('execution-row-status-badge')).toHaveText('DONE');
    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 1, live: 0 });
  });
});
