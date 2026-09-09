import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { elapsedDurationHarness } from '../../../test/harnesses/elapsed-duration/elapsed-duration.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { workItemStatusContract } from '@dungeonmaster/shared/contracts';

const GUILD_PATH = '/tmp/dm-e2e-elapsed-duration-absent';
const PANEL_TIMEOUT = 10_000;

// Every scenario below freezes the browser's Date at this exact instant via page.clock, mirroring
// elapsed-duration-bands.e2e.ts — nothing here needs a tick to fire either, except the terminal
// test, which needs the clock frozen for the SAME reason: a stable `now` for the row that does
// carry a startedAt.
const FIXED_NOW = '2026-01-01T12:00:00.000Z';
const STARTED_AT_240S = '2026-01-01T11:56:00.000Z'; // T-240s => 4m once an end point exists
const STATUS_ROW_ID_SUFFIX_WIDTH = 6;

// Derived from the contract rather than hand-typed, so a status added to the union later is
// exercised automatically: `check-no-figure-without-end-point` requires this exact source.
// workItemStatusContract.options is ['pending','queued','in_progress','complete','failed','skipped']
// today; filtering out 'in_progress' leaves the five statuses under test here. Each row's id and
// operation text are derived from its position in that filtered list, never hand-typed per status.
const NON_IN_PROGRESS_STATUS_ROWS = workItemStatusContract.options
  .filter((status) => status !== 'in_progress')
  .map((status, index) => {
    const suffix = `0000e2${String(index + 1).padStart(STATUS_ROW_ID_SUFFIX_WIDTH, '0')}`;
    return {
      status,
      operationId: `00000000-0000-4000-8000-${suffix}`,
      workItemId: `e2e00000-0000-4000-8000-${suffix}`,
      text: `codeweaver: absent-figure row status ${status}`,
    };
  });

const STATUS_MATRIX_CONTROL_SUFFIX = '0000e2000000';
const STATUS_MATRIX_CONTROL_OP = `00000000-0000-4000-8000-${STATUS_MATRIX_CONTROL_SUFFIX}`;
const STATUS_MATRIX_CONTROL_WI = `e2e00000-0000-4000-8000-${STATUS_MATRIX_CONTROL_SUFFIX}`;
const STATUS_MATRIX_CONTROL_TEXT = 'codeweaver: absent-figure row status in_progress control';

// ExecutionPanelWidget's `visibleWorkItems` filter (isSkippedWorkItemStatusGuard-gated) hides a
// 'skipped' work item from the panel entirely unless the quest is both terminal AND carries zero
// operations — never true for this test, which seeds one operation per row so every row's name is
// derived from its own status. So 'skipped' never mounts as a row here; it is asserted separately
// from the four statuses that DO render, rather than folded into the same loop, so the two very
// different reasons for a duration count of 0 (branch taken vs. row never rendered) stay distinct.
const RENDERED_STATUS_ROWS = NON_IN_PROGRESS_STATUS_ROWS.filter((row) => row.status !== 'skipped');
const HIDDEN_STATUS_ROWS = NON_IN_PROGRESS_STATUS_ROWS.filter((row) => row.status === 'skipped');

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Live elapsed duration on in-progress execution rows: absent branches and the no-figure terminal', () => {
  test.describe.configure({ timeout: 30_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {two in_progress rows, one missing startedAt entirely} => the row with no startedAt renders no duration figure while its sibling carrying one reads 4m', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Absent StartedAt Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const PRESENT_OP = '00000000-0000-4000-8000-0000d1000001';
    const ABSENT_OP = '00000000-0000-4000-8000-0000d1000002';
    const PRESENT_WI = 'e2e00000-0000-4000-8000-0000d1000001';
    const ABSENT_WI = 'e2e00000-0000-4000-8000-0000d1000002';
    const PRESENT_TEXT = 'codeweaver: absent-branch row carrying a startedAt';
    const ABSENT_TEXT = 'codeweaver: absent-branch row missing startedAt entirely';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Absent StartedAt Quest',
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
        { id: PRESENT_OP, role: 'codeweaver', text: PRESENT_TEXT, status: 'in_progress' },
        { id: ABSENT_OP, role: 'codeweaver', text: ABSENT_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: PRESENT_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${PRESENT_OP}`],
        },
        {
          id: ABSENT_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${ABSENT_OP}`],
        },
      ],
    });

    // Only PRESENT_WI is stamped — ABSENT_WI is left exactly as writeQuestFile wrote it, with no
    // startedAt key at all. This one test proves both
    // running-elapsed-on-work-item-row:observable:check-no-elapsed-without-started-at and
    // running-elapsed-on-work-item-row:branch:started-at-absent — the two units share one
    // assertion shape (absent count 0 beside present count 1 reading 4m).
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: PRESENT_WI, startedAt: STARTED_AT_240S }],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const presentRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: PRESENT_TEXT });
    const absentRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: ABSENT_TEXT });

    await expect(presentRow.getByTestId('execution-row-duration')).toHaveText('4m');
    await expect(absentRow.getByTestId('execution-row-duration')).toHaveCount(0);
  });

  test('VALID: {one work item per non-in_progress status read from workItemStatusContract, all sharing one startedAt} => none of them render a duration figure while the in_progress control beside them reads 4m', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Absent Status Matrix Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Absent Status Matrix Quest',
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
        {
          id: STATUS_MATRIX_CONTROL_OP,
          role: 'codeweaver',
          text: STATUS_MATRIX_CONTROL_TEXT,
          status: 'in_progress',
        },
        ...NON_IN_PROGRESS_STATUS_ROWS.map((row) => ({
          id: row.operationId,
          role: 'codeweaver',
          text: row.text,
          status: 'complete',
        })),
      ],
      workItems: [
        {
          id: STATUS_MATRIX_CONTROL_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${STATUS_MATRIX_CONTROL_OP}`],
        },
        ...NON_IN_PROGRESS_STATUS_ROWS.map((row) => ({
          id: row.workItemId,
          role: 'codeweaver',
          status: row.status,
          relatedDataItems: [`operations/${row.operationId}`],
        })),
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: STATUS_MATRIX_CONTROL_WI, startedAt: STARTED_AT_240S },
        ...NON_IN_PROGRESS_STATUS_ROWS.map((row) => ({
          id: row.workItemId,
          startedAt: STARTED_AT_240S,
        })),
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const rows = executionPanel.getByTestId('execution-row-layer-widget');

    await expect(
      rows.filter({ hasText: STATUS_MATRIX_CONTROL_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('4m');

    // running-elapsed-on-work-item-row:observable:check-no-figure-without-end-point — every
    // non-in_progress status renders no duration figure, whether or not the row itself mounts.
    // Promise.all rather than a for-of: each row's assertion is independent, so no-await-in-loop
    // (this file's rows never depend on one another's outcome) has a real fix instead of a
    // disable comment.
    await Promise.all(
      NON_IN_PROGRESS_STATUS_ROWS.map(async (row) =>
        expect(
          rows.filter({ hasText: row.text }).getByTestId('execution-row-duration'),
        ).toHaveCount(0),
      ),
    );

    // The positive half of that assertion for the statuses that actually mount a row: pending,
    // queued, complete and failed all render (each carries a real duration-count-0 measurement,
    // not a vacuous one from an absent row).
    await Promise.all(
      RENDERED_STATUS_ROWS.map(async (row) =>
        expect(rows.filter({ hasText: row.text })).toHaveCount(1),
      ),
    );

    // 'skipped' never mounts a row at all under this quest's shape — see the comment on
    // HIDDEN_STATUS_ROWS above. Asserted here as row absence, not branch behaviour.
    await Promise.all(
      HIDDEN_STATUS_ROWS.map(async (row) =>
        expect(rows.filter({ hasText: row.text })).toHaveCount(0),
      ),
    );
  });

  test('VALID: {panel where every row lacks an honest end point: one missing startedAt, one carrying startedAt but not in_progress} => the whole panel renders zero duration figures, the rows still show their status badges, and the shared tick never registers', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Terminal No Figure Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const NO_STARTED_AT_OP = '00000000-0000-4000-8000-0000f3000001';
    const NOT_RUNNING_OP = '00000000-0000-4000-8000-0000f3000002';
    const NO_STARTED_AT_WI = 'e2e00000-0000-4000-8000-0000f3000001';
    const NOT_RUNNING_WI = 'e2e00000-0000-4000-8000-0000f3000002';
    const NO_STARTED_AT_TEXT = 'codeweaver: terminal row with no startedAt at all';
    const NOT_RUNNING_TEXT = 'codeweaver: terminal row with startedAt but not in_progress';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Terminal No Figure Quest',
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
        { id: NO_STARTED_AT_OP, role: 'codeweaver', text: NO_STARTED_AT_TEXT, status: 'pending' },
        { id: NOT_RUNNING_OP, role: 'codeweaver', text: NOT_RUNNING_TEXT, status: 'complete' },
      ],
      workItems: [
        {
          id: NO_STARTED_AT_WI,
          role: 'codeweaver',
          status: 'pending',
          relatedDataItems: [`operations/${NO_STARTED_AT_OP}`],
        },
        {
          id: NOT_RUNNING_WI,
          role: 'codeweaver',
          status: 'failed',
          relatedDataItems: [`operations/${NOT_RUNNING_OP}`],
        },
      ],
    });

    // Only NOT_RUNNING_WI is stamped — NO_STARTED_AT_WI is left exactly as writeQuestFile wrote
    // it, with no startedAt at all. Neither row is in_progress, so hasRunningWorkItem stays false
    // and the shared tick's setInterval must never register.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: NOT_RUNNING_WI, startedAt: STARTED_AT_240S }],
    });

    await page.clock.setFixedTime(FIXED_NOW);
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    await expect(executionPanel.getByTestId('execution-row-duration')).toHaveCount(0);

    const noStartedAtRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: NO_STARTED_AT_TEXT });
    const notRunningRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: NOT_RUNNING_TEXT });

    await expect(noStartedAtRow.getByTestId('execution-row-status-badge')).toHaveText('PENDING');
    await expect(notRunningRow.getByTestId('execution-row-status-badge')).toHaveText('FAILED');

    const counts = await elapsed.readIntervalCounts();
    expect(counts).toStrictEqual({ registered: 0, cleared: 0, live: 0 });
  });

  test('VALID: {three rows sharing one startedAt: failed, in_progress and complete} => the failed row renders no duration figure while its running and completed siblings do', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Not Running Branch Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const FAILED_OP = '00000000-0000-4000-8000-0000f4000001';
    const RUNNING_OP = '00000000-0000-4000-8000-0000f4000002';
    const COMPLETED_OP = '00000000-0000-4000-8000-0000f4000003';
    const FAILED_WI = 'e2e00000-0000-4000-8000-0000f4000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000f4000002';
    const COMPLETED_WI = 'e2e00000-0000-4000-8000-0000f4000003';
    const FAILED_TEXT = 'codeweaver: not-running branch row that failed with no end point';
    const RUNNING_TEXT = 'codeweaver: not-running branch row still in progress';
    const COMPLETED_TEXT =
      'codeweaver: not-running branch row that completed with its own end point';
    const COMPLETED_AT = '2026-01-01T12:06:00.000Z'; // startedAt + 600s => 10m

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Not Running Branch Quest',
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
        { id: FAILED_OP, role: 'codeweaver', text: FAILED_TEXT, status: 'complete' },
        { id: RUNNING_OP, role: 'codeweaver', text: RUNNING_TEXT, status: 'in_progress' },
        { id: COMPLETED_OP, role: 'codeweaver', text: COMPLETED_TEXT, status: 'complete' },
      ],
      workItems: [
        {
          id: FAILED_WI,
          role: 'codeweaver',
          status: 'failed',
          relatedDataItems: [`operations/${FAILED_OP}`],
        },
        {
          id: RUNNING_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
        {
          id: COMPLETED_WI,
          role: 'codeweaver',
          status: 'complete',
          relatedDataItems: [`operations/${COMPLETED_OP}`],
        },
      ],
    });

    // One shared startedAt across all three — the three different OUTCOMES (no figure, 4m, 10m)
    // are what proves which branch each row took, not three different spans.
    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: FAILED_WI, startedAt: STARTED_AT_240S },
        { id: RUNNING_WI, startedAt: STARTED_AT_240S },
        { id: COMPLETED_WI, startedAt: STARTED_AT_240S, completedAt: COMPLETED_AT },
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const rows = executionPanel.getByTestId('execution-row-layer-widget');

    await expect(
      rows.filter({ hasText: FAILED_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveCount(0);
    await expect(
      rows.filter({ hasText: RUNNING_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('4m');
    await expect(
      rows.filter({ hasText: COMPLETED_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('10m');
  });
});
