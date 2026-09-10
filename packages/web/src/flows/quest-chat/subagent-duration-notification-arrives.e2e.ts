import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { elapsedDurationHarness } from '../../../test/harnesses/elapsed-duration/elapsed-duration.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { subagentDurationHarness } from '../../../test/harnesses/subagent-duration/subagent-duration.harness';
import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

const GUILD_PATH = '/tmp/dm-e2e-subagent-duration-notification-arrives';
const PANEL_TIMEOUT = 10_000;
const TICK_MS = elapsedDisplayConfigStatics.refresh.tickMs;

// Full fake-clock install (never setFixedTime alone), before every page.goto below — only a full
// install lets page.clock.fastForward actually fire the panel's shared setInterval callback.
// elapsed-duration-tick.e2e.ts's header comment says the same thing for the row-level mirror of
// this file.
const FIXED_NOW = '2026-01-01T12:00:00.000Z';
// FIXED_NOW minus 60000 ms = exactly 1m before the installed clock — the live reading both tests
// start from, before either notification lands.
const TASK_TOOL_USE_AT = '2026-01-01T11:59:00.000Z';

const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: subagentDuration, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('A sub-agent chain reading a live figure freezes the instant its completion notification arrives', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {a live chain reading 1m, then a notification reporting durationMs 4380000 arrives mid-test} => the figure becomes 1h13m and stays 1h13m through the next tick', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Notification Arrives Duration Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const SESSION_ID = 'e2e-subagent-duration-notification-arrives-duration-ms-001';
    const AGENT_ID = 'notifarrivesdurationms1';
    const TOOL_USE_ID = 'toolu_notification_arrives_duration_ms';
    const CHAIN_DESCRIPTION = 'Notification arrives duration-ms sub-agent work';
    const RUNNING_OP = '00000000-0000-4000-8000-0000f1000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000f1000001';
    const RUNNING_TEXT = 'codeweaver: subagent duration notification arrives duration-ms row';
    // Any timestamp after the Task tool use — the notification's OWN timestamp is irrelevant once
    // it carries a reportedDurationMs, which is the whole claim this test proves.
    const NOTIFICATION_AT = '2026-01-01T11:59:05.000Z';
    const REPORTED_DURATION_MS = 4_380_000; // 4380s = 73min = 1h13m

    // Seeded with NO notification: appendNotification below is what drives the arrival mid-test.
    subagentDuration.seedChain({
      sessionId: SESSION_ID,
      agentId: AGENT_ID,
      taskToolUseId: TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: TASK_TOOL_USE_AT,
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Notification Arrives Duration Quest',
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
          sessionId: SESSION_ID,
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
      ],
    });

    // A startedAt on the hosting row is what flips hasRunningWorkItem so the panel's shared
    // interval is actually enabled — without it `now` reads once at mount but never ticks, and the
    // row would never pick up the notification's own tick-independent freeze either.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: RUNNING_WI, startedAt: TASK_TOOL_USE_AT }],
    });

    await page.clock.install({ time: FIXED_NOW });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // No explicit replay trigger: subscribe-quest already replays every work item's own session
    // automatically on navigate. Calling nav.triggerReplayFromBrowser as well would deliver this
    // chain twice.
    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });
    const chainDuration = row.getByTestId('subagent-chain-duration');

    // Reading (1): live, clock-derived — no notification exists yet anywhere in the session.
    await expect(chainDuration).toHaveText('1m');

    // The arrival itself: append the notification line to the session on disk, then a no-op PATCH
    // (same status the quest already has) to force the server's own in-process
    // persist-and-broadcast path to re-read the file and push it over the websocket —
    // elapsed-duration-tick.e2e.ts:627-646 documents why a raw cross-process append alone does not
    // reliably wake a watcher a browser already subscribed through.
    subagentDuration.appendNotification({
      sessionId: SESSION_ID,
      agentId: AGENT_ID,
      taskToolUseId: TOOL_USE_ID,
      at: NOTIFICATION_AT,
      durationMs: REPORTED_DURATION_MS,
    });
    await request.patch(`/api/quests/${questId}`, { data: { status: 'in_progress' } });

    // Reading (2): …:branch:notification-arrives-yes — the reported duration wins outright, and
    // this string differs from the still-live "1m" above, so the change is provably the
    // notification landing rather than a coincidental re-render.
    await expect(chainDuration).toHaveText('1h13m');

    await page.clock.fastForward(TICK_MS);

    // Reading (3): frozen — the sibling `no` branch's own value at this same step is a figure that
    // MOVED (subagent-duration-live-tick.e2e.ts's `notification-arrives-no` case), so this frozen
    // third reading is what separates the two branches. Two readings would not do it: one climb to
    // "1h13m" is also what this branch produces on its way to freezing.
    await expect(chainDuration).toHaveText('1h13m');
  });

  test('VALID: {a live chain reading 1m, then a notification omitting durationMs arrives mid-test} => the figure freezes on the timestamp gap, 4m, rather than a reported duration', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Notification Arrives Gap Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const SESSION_ID = 'e2e-subagent-duration-notification-arrives-gap-001';
    const AGENT_ID = 'notifarrivesgap1';
    const TOOL_USE_ID = 'toolu_notification_arrives_gap';
    const CHAIN_DESCRIPTION = 'Notification arrives timestamp-gap sub-agent work';
    const RUNNING_OP = '00000000-0000-4000-8000-0000f2000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000f2000001';
    const RUNNING_TEXT = 'codeweaver: subagent duration notification arrives gap row';
    // TASK_TOOL_USE_AT plus 270000 ms (4m30s) — a gap that floors to `4m`, chosen so the frozen
    // band differs from BOTH this test's own live "1m" reading and from the duration-ms test's
    // "1h13m", proving the string itself names which arm was taken.
    const NOTIFICATION_AT = '2026-01-01T12:03:30.000Z';

    // Seeded with NO notification, exactly as the duration-ms case above: appendNotification below
    // omits durationMs entirely (never an empty tag), which is what routes this test onto the
    // timestamp-gap arm instead.
    subagentDuration.seedChain({
      sessionId: SESSION_ID,
      agentId: AGENT_ID,
      taskToolUseId: TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: TASK_TOOL_USE_AT,
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Notification Arrives Gap Quest',
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
          sessionId: SESSION_ID,
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
      ],
    });

    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: RUNNING_WI, startedAt: TASK_TOOL_USE_AT }],
    });

    await page.clock.install({ time: FIXED_NOW });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });
    const chainDuration = row.getByTestId('subagent-chain-duration');

    // Reading (1): live, clock-derived — identical shape to the duration-ms test's own first
    // reading, since neither chain carries a notification yet.
    await expect(chainDuration).toHaveText('1m');

    // Walk path P5: the arriving notification omits durationMs entirely.
    subagentDuration.appendNotification({
      sessionId: SESSION_ID,
      agentId: AGENT_ID,
      taskToolUseId: TOOL_USE_ID,
      at: NOTIFICATION_AT,
    });
    await request.patch(`/api/quests/${questId}`, { data: { status: 'in_progress' } });

    // Reading (2): the notification landed with no reportedDurationMs, so the figure freezes on
    // the raw timestamp gap between the Task tool use and the notification (270000 ms => `4m`) —
    // not on the still-ticking live clock reading, and not on the duration-ms test's `1h13m`.
    await expect(chainDuration).toHaveText('4m');

    await page.clock.fastForward(TICK_MS);

    // Reading (3): frozen on the gap band — proves the timestamp-gap arm, not just the clock,
    // stopped following the panel's own tick once the notification arrived.
    await expect(chainDuration).toHaveText('4m');
  });
});
