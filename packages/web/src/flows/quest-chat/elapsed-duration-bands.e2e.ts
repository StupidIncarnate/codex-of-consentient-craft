import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { elapsedDurationHarness } from '../../../test/harnesses/elapsed-duration/elapsed-duration.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-elapsed-duration-bands';
const PANEL_TIMEOUT = 10_000;

// Every scenario below freezes the browser's Date at this exact instant via page.clock, then seeds
// each row's startedAt as T minus the span the unit names — that makes every boundary EXACT instead
// of racing the page load, and lets the whole spec skip page.clock.install: nothing here needs a
// tick to fire.
const FIXED_NOW = '2026-01-01T12:00:00.000Z';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Live elapsed duration on in-progress execution rows: value bands and branches', () => {
  test.describe.configure({ timeout: 30_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {nine in_progress rows at nine startedAt spans} => each execution-row-duration reads the exact band its span crosses, on first render with no clock advance', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Band Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const MOUNT_OP = '00000000-0000-4000-8000-0000b1000001';
    const U30_OP = '00000000-0000-4000-8000-0000b1000002';
    const U59_OP = '00000000-0000-4000-8000-0000b1000003';
    const M60_OP = '00000000-0000-4000-8000-0000b1000004';
    const M4M30_OP = '00000000-0000-4000-8000-0000b1000005';
    const M59M59_OP = '00000000-0000-4000-8000-0000b1000006';
    const M60M_OP = '00000000-0000-4000-8000-0000b1000007';
    const H1H13M_OP = '00000000-0000-4000-8000-0000b1000008';
    const H2H_OP = '00000000-0000-4000-8000-0000b1000009';

    const MOUNT_WI = 'e2e00000-0000-4000-8000-0000b1000001';
    const U30_WI = 'e2e00000-0000-4000-8000-0000b1000002';
    const U59_WI = 'e2e00000-0000-4000-8000-0000b1000003';
    const M60_WI = 'e2e00000-0000-4000-8000-0000b1000004';
    const M4M30_WI = 'e2e00000-0000-4000-8000-0000b1000005';
    const M59M59_WI = 'e2e00000-0000-4000-8000-0000b1000006';
    const M60M_WI = 'e2e00000-0000-4000-8000-0000b1000007';
    const H1H13M_WI = 'e2e00000-0000-4000-8000-0000b1000008';
    const H2H_WI = 'e2e00000-0000-4000-8000-0000b1000009';

    const MOUNT_TEXT = 'codeweaver: elapsed band four minutes at mount';
    const U30_TEXT = 'codeweaver: elapsed band thirty seconds under a minute';
    const U59_TEXT = 'codeweaver: elapsed band fifty nine seconds under a minute';
    const M60_TEXT = 'codeweaver: elapsed band sixty seconds crosses to one minute';
    const M4M30_TEXT = 'codeweaver: elapsed band four minutes thirty seconds';
    const M59M59_TEXT = 'codeweaver: elapsed band fifty nine minutes fifty nine seconds';
    const M60M_TEXT = 'codeweaver: elapsed band sixty minutes crosses to one hour';
    const H1H13M_TEXT = 'codeweaver: elapsed band one hour thirteen minutes';
    const H2H_TEXT = 'codeweaver: elapsed band two hours exactly';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Band Quest',
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
        { id: MOUNT_OP, role: 'codeweaver', text: MOUNT_TEXT, status: 'in_progress' },
        { id: U30_OP, role: 'codeweaver', text: U30_TEXT, status: 'in_progress' },
        { id: U59_OP, role: 'codeweaver', text: U59_TEXT, status: 'in_progress' },
        { id: M60_OP, role: 'codeweaver', text: M60_TEXT, status: 'in_progress' },
        { id: M4M30_OP, role: 'codeweaver', text: M4M30_TEXT, status: 'in_progress' },
        { id: M59M59_OP, role: 'codeweaver', text: M59M59_TEXT, status: 'in_progress' },
        { id: M60M_OP, role: 'codeweaver', text: M60M_TEXT, status: 'in_progress' },
        { id: H1H13M_OP, role: 'codeweaver', text: H1H13M_TEXT, status: 'in_progress' },
        { id: H2H_OP, role: 'codeweaver', text: H2H_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: MOUNT_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${MOUNT_OP}`],
        },
        {
          id: U30_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${U30_OP}`],
        },
        {
          id: U59_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${U59_OP}`],
        },
        {
          id: M60_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${M60_OP}`],
        },
        {
          id: M4M30_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${M4M30_OP}`],
        },
        {
          id: M59M59_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${M59M59_OP}`],
        },
        {
          id: M60M_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${M60M_OP}`],
        },
        {
          id: H1H13M_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${H1H13M_OP}`],
        },
        {
          id: H2H_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${H2H_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: MOUNT_WI, startedAt: '2026-01-01T11:56:00.000Z' }, // T-240s => 4m
        { id: U30_WI, startedAt: '2026-01-01T11:59:30.000Z' }, // T-30s => <1m
        { id: U59_WI, startedAt: '2026-01-01T11:59:01.000Z' }, // T-59s => <1m
        { id: M60_WI, startedAt: '2026-01-01T11:59:00.000Z' }, // T-60s => 1m
        { id: M4M30_WI, startedAt: '2026-01-01T11:55:30.000Z' }, // T-270s => 4m
        { id: M59M59_WI, startedAt: '2026-01-01T11:00:01.000Z' }, // T-3599s => 59m
        { id: M60M_WI, startedAt: '2026-01-01T11:00:00.000Z' }, // T-3600s => 1h
        { id: H1H13M_WI, startedAt: '2026-01-01T10:47:00.000Z' }, // T-4380s => 1h13m
        { id: H2H_WI, startedAt: '2026-01-01T10:00:00.000Z' }, // T-7200s => 2h
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const rows = executionPanel.getByTestId('execution-row-layer-widget');

    // check-first-value-on-mount: 4m on the very first render, no tick required — the clock never
    // advances anywhere in this test.
    await expect(
      rows.filter({ hasText: MOUNT_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('4m');
    // check-under-minute-text
    await expect(
      rows.filter({ hasText: U30_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('<1m');
    // check-fifty-nine-seconds
    await expect(
      rows.filter({ hasText: U59_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('<1m');
    // check-sixty-seconds-crosses
    await expect(
      rows.filter({ hasText: M60_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('1m');
    // check-minutes-text
    await expect(
      rows.filter({ hasText: M4M30_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('4m');
    // check-fifty-nine-minutes
    await expect(
      rows.filter({ hasText: M59M59_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('59m');
    // check-hour-boundary
    await expect(
      rows.filter({ hasText: M60M_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('1h');
    // check-hours-minutes-text
    await expect(
      rows.filter({ hasText: H1H13M_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('1h13m');
    // check-whole-hour-drops-minutes
    await expect(
      rows.filter({ hasText: H2H_TEXT }).getByTestId('execution-row-duration'),
    ).toHaveText('2h');
  });

  test('VALID: {two in_progress rows, one with startedAt one without} => only the row carrying startedAt renders a duration figure', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Present Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const PRESENT_OP = '00000000-0000-4000-8000-0000b2000001';
    const ABSENT_OP = '00000000-0000-4000-8000-0000b2000002';
    const PRESENT_WI = 'e2e00000-0000-4000-8000-0000b2000001';
    const ABSENT_WI = 'e2e00000-0000-4000-8000-0000b2000002';
    const PRESENT_TEXT = 'codeweaver: branch row carrying a startedAt';
    const ABSENT_TEXT = 'codeweaver: branch row with no startedAt at all';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Present Quest',
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
    // startedAt at all, which is the branch this test exists to prove.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: PRESENT_WI, startedAt: '2026-01-01T11:56:00.000Z' }], // T-240s => 4m
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

  test('VALID: {two rows sharing one startedAt, one still running and one completed} => the running row measures against now while the completed row measures against its own completedAt', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Running Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const RUNNING_OP = '00000000-0000-4000-8000-0000b3000001';
    const COMPLETED_OP = '00000000-0000-4000-8000-0000b3000002';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000b3000001';
    const COMPLETED_WI = 'e2e00000-0000-4000-8000-0000b3000002';
    const RUNNING_TEXT = 'codeweaver: branch row still running toward now';
    const COMPLETED_TEXT = 'codeweaver: branch row already completed with its own end point';
    const SHARED_STARTED_AT = '2026-01-01T11:56:00.000Z'; // T-240s
    const COMPLETED_AT = '2026-01-01T12:06:00.000Z'; // startedAt + 600s => 10m

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Running Quest',
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
        { id: COMPLETED_OP, role: 'codeweaver', text: COMPLETED_TEXT, status: 'complete' },
      ],
      workItems: [
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

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: RUNNING_WI, startedAt: SHARED_STARTED_AT },
        { id: COMPLETED_WI, startedAt: SHARED_STARTED_AT, completedAt: COMPLETED_AT },
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const runningRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });
    const completedRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: COMPLETED_TEXT });

    await expect(runningRow.getByTestId('execution-row-duration')).toHaveText('4m');
    await expect(completedRow.getByTestId('execution-row-duration')).toHaveText('10m');
  });

  test('VALID: {two in_progress rows at thirty and sixty seconds elapsed} => the thirty-second row reads <1m and the sixty-second row reads 1m', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Minute Pair Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const UNDER_OP = '00000000-0000-4000-8000-0000b4000001';
    const AT_OP = '00000000-0000-4000-8000-0000b4000002';
    const UNDER_WI = 'e2e00000-0000-4000-8000-0000b4000001';
    const AT_WI = 'e2e00000-0000-4000-8000-0000b4000002';
    const UNDER_TEXT = 'codeweaver: pair row thirty seconds under the minute threshold';
    const AT_TEXT = 'codeweaver: pair row sixty seconds at the minute threshold';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Minute Pair Quest',
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
        { id: UNDER_OP, role: 'codeweaver', text: UNDER_TEXT, status: 'in_progress' },
        { id: AT_OP, role: 'codeweaver', text: AT_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: UNDER_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${UNDER_OP}`],
        },
        {
          id: AT_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${AT_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: UNDER_WI, startedAt: '2026-01-01T11:59:30.000Z' }, // T-30s => <1m
        { id: AT_WI, startedAt: '2026-01-01T11:59:00.000Z' }, // T-60s => 1m
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const underRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: UNDER_TEXT });
    const atRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: AT_TEXT });

    // Proves BOTH sides of the under-sixty-seconds branch in one panel: the 30s row takes the
    // "under 60s" edge (<1m) while the 60s row takes the "60s or more" edge (1m) — neither value
    // would discriminate the branch alone.
    await expect(underRow.getByTestId('execution-row-duration')).toHaveText('<1m');
    await expect(atRow.getByTestId('execution-row-duration')).toHaveText('1m');
  });

  test('VALID: {two in_progress rows at fifty-nine minutes fifty-nine seconds and sixty minutes elapsed} => the under-hour row reads 59m and the hour row reads 1h', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Hour Pair Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const UNDER_OP = '00000000-0000-4000-8000-0000b5000001';
    const AT_OP = '00000000-0000-4000-8000-0000b5000002';
    const UNDER_WI = 'e2e00000-0000-4000-8000-0000b5000001';
    const AT_WI = 'e2e00000-0000-4000-8000-0000b5000002';
    const UNDER_TEXT =
      'codeweaver: pair row fifty nine minutes fifty nine seconds under the hour threshold';
    const AT_TEXT = 'codeweaver: pair row sixty minutes at the hour threshold';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Hour Pair Quest',
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
        { id: UNDER_OP, role: 'codeweaver', text: UNDER_TEXT, status: 'in_progress' },
        { id: AT_OP, role: 'codeweaver', text: AT_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: UNDER_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${UNDER_OP}`],
        },
        {
          id: AT_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${AT_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: UNDER_WI, startedAt: '2026-01-01T11:00:01.000Z' }, // T-3599s => 59m
        { id: AT_WI, startedAt: '2026-01-01T11:00:00.000Z' }, // T-3600s => 1h
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const underRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: UNDER_TEXT });
    const atRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: AT_TEXT });

    // Proves both sides of the under-hour branch in one panel: 3599s takes the "under 1h" edge
    // (59m) while 3600s takes the "1h or more" edge (1h) — neither value alone would discriminate.
    await expect(underRow.getByTestId('execution-row-duration')).toHaveText('59m');
    await expect(atRow.getByTestId('execution-row-duration')).toHaveText('1h');
  });
});
