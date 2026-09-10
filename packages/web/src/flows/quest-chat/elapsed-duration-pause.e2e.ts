import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { dispatchHarness } from '../../../test/harnesses/dispatch/dispatch.harness';
import { elapsedDurationHarness } from '../../../test/harnesses/elapsed-duration/elapsed-duration.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-elapsed-duration-pause';
const PANEL_TIMEOUT = 10_000;
const RELAY_TIMEOUT = 25_000;
const HTTP_OK = 200;
// Inter-line delay for the resumed agent's queued outcome, so the work item this spec watches
// reads `in_progress` with its fresh startedAt for roughly a second rather than the ~30ms a
// default-speed fake CLI takes to spawn, emit three lines and signal back — mirrors
// resume-execution-row-runs-again.e2e.ts's own RUNNING_WINDOW_LINE_DELAY_MS.
const RUNNING_WINDOW_LINE_DELAY_MS = 400;

// This file deliberately installs NO fake clock (no page.clock.setFixedTime, no
// page.clock.install). A resumed work item gets its fresh startedAt stamped SERVER-side from the
// real system clock, and a browser pinned to a fake clock would compute its elapsed figure
// against a completely different instant. Every startedAt below is seeded relative to REAL now,
// with margins wide enough that a few seconds of page load cannot move the band.
const UNDER_MINUTE_OFFSET_MS = 20_000; // 20s — reads '<1m', safe for 39s of drift
const MINUTES_OFFSET_MS = (4 * 60 + 30) * 1000; // 4m30s — reads '4m'
const HOURS_OFFSET_MS = (60 + 13) * 60 * 1000; // 1h13m — reads '1h13m'

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Live elapsed duration on in-progress execution rows: pause and resume', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).beforeEach();
    await guildHarness({ request }).cleanGuilds();
  });

  test.afterEach(async ({ request }) => {
    await dispatchHarness({ request, guildPath: GUILD_PATH }).afterEach();
  });

  test('VALID: {two in_progress rows at the under-minute and minutes bands} => clicking PAUSE flips both status badges from RUNNING to PENDING and clears both duration figures', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Elapsed Pause Bands Guild', path: GUILD_PATH });
    const guildId = String(guild.id);

    const UNDER_OP = '00000000-0000-4000-8000-0000ea010001';
    const MINUTES_OP = '00000000-0000-4000-8000-0000ea010002';
    const UNDER_WI = 'e2e00000-0000-4000-8000-0000ea010001';
    const MINUTES_WI = 'e2e00000-0000-4000-8000-0000ea010002';
    const UNDER_TEXT = 'codeweaver: pause band row under a minute at pause time';
    const MINUTES_TEXT = 'codeweaver: pause band row four minutes thirty seconds at pause time';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Pause Bands Quest',
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
        { id: MINUTES_OP, role: 'codeweaver', text: MINUTES_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: UNDER_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${UNDER_OP}`],
        },
        {
          id: MINUTES_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${MINUTES_OP}`],
        },
      ],
    });

    const realNowMs = Date.now();
    const underStartedAt = new Date(realNowMs - UNDER_MINUTE_OFFSET_MS).toISOString();
    const minutesStartedAt = new Date(realNowMs - MINUTES_OFFSET_MS).toISOString();

    elapsed.stampWorkItems({
      questFilePath,
      items: [
        { id: UNDER_WI, startedAt: underStartedAt },
        { id: MINUTES_WI, startedAt: minutesStartedAt },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const underRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: UNDER_TEXT });
    const minutesRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: MINUTES_TEXT });

    // BEFORE — both rows RUNNING with their band figure present. check-paused-row-no-elapsed
    // requires a count(1) reading BEFORE the pause too, so a row that never carried a figure
    // cannot pass this test by accident.
    await expect(underRow.getByTestId('execution-row-status-badge')).toHaveText('RUNNING');
    await expect(underRow.getByTestId('execution-row-duration')).toHaveText('<1m');
    await expect(minutesRow.getByTestId('execution-row-status-badge')).toHaveText('RUNNING');
    await expect(minutesRow.getByTestId('execution-row-duration')).toHaveText('4m');

    const pausePromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/pause`),
    );

    await page.getByTestId('EXECUTION_PAUSE_BUTTON').click();

    const pauseReq = await pausePromise;
    expect(pauseReq.url()).toContain(`/api/quests/${questId}/pause`);

    // AFTER — old RUNNING state gone, new PENDING state visible, on BOTH rows from the one click.
    // branch:under-minute-paused and branch:minutes-paused: the figure is ABSENT, not merely
    // carrying a new value — ruling out the sibling "completedAt arrives" branch, where the
    // element would stay PRESENT carrying a new reading instead.
    await expect(underRow.getByTestId('execution-row-status-badge')).toHaveText('PENDING');
    await expect(underRow.getByTestId('execution-row-duration')).toHaveCount(0);
    await expect(minutesRow.getByTestId('execution-row-status-badge')).toHaveText('PENDING');
    await expect(minutesRow.getByTestId('execution-row-duration')).toHaveCount(0);
  });

  test('VALID: {one in_progress row at the hours band, paused then resumed} => the figure disappears on pause and reappears reading <1m once the resumed dispatch re-stamps startedAt', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const dispatch = dispatchHarness({ request, guildPath: GUILD_PATH });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Elapsed Pause Resume Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const HOUR_OP = '00000000-0000-4000-8000-0000ea020001';
    const HOUR_WI = 'e2e00000-0000-4000-8000-0000ea020001';
    const HOUR_TEXT = 'codeweaver: pause resume row one hour thirteen minutes at pause time';

    const created = await quests.createQuest({
      guildId,
      title: 'Elapsed Pause Resume Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = String(created.filePath);

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath,
      status: 'in_progress',
      operations: [{ id: HOUR_OP, role: 'codeweaver', text: HOUR_TEXT, status: 'in_progress' }],
      workItems: [
        {
          id: HOUR_WI,
          role: 'codeweaver',
          status: 'in_progress',
          relatedDataItems: [`operations/${HOUR_OP}`],
        },
      ],
    });

    const hoursStartedAt = new Date(Date.now() - HOURS_OFFSET_MS).toISOString();

    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: HOUR_WI, startedAt: hoursStartedAt }],
    });

    // The agent RESUME is about to spawn needs a queued outcome, or it exits red-on-empty. The
    // per-line delay buys an observable in_progress window for the server-side check below.
    dispatch.queueScript({
      script: [{ role: 'codeweaver', outcome: 'done' }],
      agentLineDelayMs: RUNNING_WINDOW_LINE_DELAY_MS,
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: HOUR_TEXT });

    // BEFORE — branch:hours-paused starts from the hours band deliberately: '1h13m' and the
    // post-resume '<1m' cannot be confused, where a minutes-band start might.
    await expect(row.getByTestId('execution-row-status-badge')).toHaveText('RUNNING');
    await expect(row.getByTestId('execution-row-duration')).toHaveText('1h13m');

    const pausePromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/pause`),
    );

    await page.getByTestId('EXECUTION_PAUSE_BUTTON').click();

    const pauseReq = await pausePromise;
    expect(pauseReq.url()).toContain(`/api/quests/${questId}/pause`);

    // AFTER PAUSE — old RUNNING/1h13m state gone, PENDING with no figure visible.
    await expect(row.getByTestId('execution-row-status-badge')).toHaveText('PENDING');
    await expect(row.getByTestId('execution-row-duration')).toHaveCount(0);

    const resumeResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().includes(`/api/quests/${questId}/resume`),
    );

    await page.getByTestId('EXECUTION_RESUME_BUTTON').click();

    const resumeResponse = await resumeResponsePromise;
    expect(resumeResponse.status()).toBe(HTTP_OK);
    expect(await resumeResponse.json()).toStrictEqual({
      resumed: true,
      restoredStatus: 'in_progress',
      dispatch: { started: true },
    });

    // branch:resumed-restarts — the CONDITION itself, not the arrival: the work item's own
    // startedAt, read back off the server, is STRICTLY LATER than the value seeded before the
    // pause, and its status is 'in_progress'. Caught while the fake CLI's per-line delay still
    // holds the item open, before its queued outcome lands — so this proves the re-dispatch
    // actually flipped status AND stamped a fresh timestamp, not merely that the row eventually
    // finished with some newer value.
    const runningQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) =>
        quest.workItems.some(
          (wi) =>
            wi.id === HOUR_WI &&
            wi.status === 'in_progress' &&
            // `typeof` rather than `!== undefined`: workItemContract takes `.nullish()` here, so a
            // quest.json carrying an explicit null parses and only a string check narrows both.
            typeof wi.startedAt === 'string' &&
            wi.startedAt > hoursStartedAt,
        ),
    });
    const runningHourWorkItems = runningQuest.workItems.filter((wi) => wi.id === HOUR_WI);
    expect(runningHourWorkItems.map((wi) => wi.status)).toStrictEqual(['in_progress']);
    expect(
      runningHourWorkItems.map(
        (wi) => typeof wi.startedAt === 'string' && wi.startedAt > hoursStartedAt,
      ),
    ).toStrictEqual([true]);

    // observable:check-resumed-row-restarts — the figure reappears reading exactly '<1m', never
    // the pre-pause '1h13m': a resume that carried the ORIGINAL startedAt through instead of
    // stamping a fresh one would still read '1h13m' here.
    await expect(row.getByTestId('execution-row-duration')).toHaveText('<1m', {
      timeout: RELAY_TIMEOUT,
    });

    // Let the queued outcome land so the run finishes cleanly rather than leaving a live child
    // process behind at test teardown.
    const finalQuest = await dispatch.waitForQuest({
      questId: String(questId),
      timeoutMs: RELAY_TIMEOUT,
      predicate: ({ quest }) => quest.workItems.every((wi) => wi.status === 'complete'),
    });
    expect(finalQuest.workItems.map((wi) => wi.status)).toStrictEqual(['complete']);
  });
});
