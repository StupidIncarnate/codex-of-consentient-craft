import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { sessionSubagentDurationHarness } from '../../../test/harnesses/session-subagent-duration/session-subagent-duration.harness';
import { subagentDurationHarness } from '../../../test/harnesses/subagent-duration/subagent-duration.harness';

const GUILD_PATH = '/tmp/dm-e2e-subagent-duration-session-no-tick';
const PANEL_TIMEOUT = 10_000;
const CHAIN_TIMEOUT = 10_000;

const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: subagentDuration, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('The session transcript route never grows its own elapsed-tick clock, and its sub-agent duration figure carries the same test id the execution panel uses', () => {
  test.describe.configure({ timeout: 30_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {session transcript holds one sub-agent chain with no completion notification} => rendering it registers zero setInterval calls for elapsed ticking, proven live by a probe interval at the same period', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const nav = navigationHarness({ page });
    const probe = sessionSubagentDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Session No Tick Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const SESSION_ID = 'e2e-subagent-duration-session-no-tick-001';
    const AGENT_ID = 'sessionnoticka1';
    const TOOL_USE_ID = 'toolu_session_no_tick_001';
    const CHAIN_DESCRIPTION = 'Session no-tick sub-agent work';

    // No `notification` field at all — the only shape a tick would exist to serve, since a chain
    // that already has an end point has nothing left for a clock to advance.
    subagentDuration.seedChain({
      sessionId: SESSION_ID,
      agentId: AGENT_ID,
      taskToolUseId: TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: '2026-09-10T02:00:00.000Z',
    });

    await probe.installIntervalCounter();

    await nav.navigateToSession({ urlSlug, sessionId: SESSION_ID });

    await expect(page.getByTestId('SUBAGENT_CHAIN')).toBeVisible({ timeout: CHAIN_TIMEOUT });

    // …:observable:check-session-registers-no-interval — `now` reaches SubagentChainWidget from
    // ONE place only (ExecutionPanelWidget, via ExecutionRowLayerWidget / ChatEntryListWidget); the
    // session-view ChatPanelWidget passes none, so an unfinished chain here has no clock to arm in
    // the first place. Read BEFORE the positive control below.
    await expect
      .poll(async () => probe.readIntervalCounts())
      .toStrictEqual({ registered: 0, cleared: 0, live: 0 });

    // Positive control: without it, a counter that was never installed would ALSO read zero, and
    // the assertion above would pass on a dead instrument rather than on an armed one that saw
    // nothing.
    await probe.registerElapsedPeriodInterval();
    await expect
      .poll(async () => probe.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 0, live: 1 });
  });

  test('VALID: {one seeded session, read through the session-view route and then through a complete quest work item bound to the same sessionId} => both surfaces render subagent-chain-duration with count 1 and text 4m, under the identical test id', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Session Same Test Id Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const SESSION_ID = 'e2e-subagent-duration-session-same-id-001';
    const AGENT_ID = 'sessionsameida1';
    const TOOL_USE_ID = 'toolu_session_same_id_001';
    const CHAIN_DESCRIPTION = 'Session same-test-id sub-agent work';
    const TASK_TOOL_USE_AT = '2026-09-10T02:00:00.000Z';
    // +45s: the gap alone would land in band '<1m', DIFFERENT from the reported 270000ms's '4m' —
    // so a precedence inversion reads '<1m' with a different string rather than going blank.
    const NOTIFICATION_AT = '2026-09-10T02:00:45.000Z';
    const REPORTED_DURATION_MS = 270_000;

    subagentDuration.seedChain({
      sessionId: SESSION_ID,
      agentId: AGENT_ID,
      taskToolUseId: TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: TASK_TOOL_USE_AT,
      notification: { at: NOTIFICATION_AT, durationMs: REPORTED_DURATION_MS },
    });

    // (a) The session-view surface: navigate straight to the session route and read the duration
    // element with no quest, no work item, no execution row in the picture at all.
    await nav.navigateToSession({ urlSlug, sessionId: SESSION_ID });

    const sessionDuration = page.getByTestId('subagent-chain-duration');

    await expect(sessionDuration).toHaveCount(1);
    await expect(sessionDuration).toHaveText('4m', { timeout: CHAIN_TIMEOUT });

    // (b) The execution-panel surface: bind the SAME sessionId to a `complete` work item on a real
    // quest. `complete` (not `in_progress`) is deliberate — see subagent-duration-frozen-figure.e2e.ts
    // (:13-29): reconcile-watchers-layer-responder starts a live JSONL watcher for every in_progress
    // work item carrying a sessionId, and the first such watcher start runs questOrphanResetBroker,
    // which resets every OTHER currently-active sessionId-bearing work item back to pending across
    // every guild. This chain's notification already landed, so `complete` renders the identical
    // chain body and duration text once its row is clicked open, with none of that reset risk.
    const RUNNING_OP = '00000000-0000-4000-8000-0000ec000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000ec000001';
    const RUNNING_TEXT = 'codeweaver: subagent duration session same test id row';

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Session Same Test Id Quest',
      userRequest: 'Build the feature',
    });
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'in_progress',
      operations: [{ id: RUNNING_OP, role: 'codeweaver', text: RUNNING_TEXT, status: 'complete' }],
      workItems: [
        {
          id: RUNNING_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: SESSION_ID,
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // No explicit replay trigger: subscribe-quest already replays every work item's own session on
    // navigate. Calling nav.triggerReplayFromBrowser as well would deliver this chain twice.
    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });

    // `complete` rows do not auto-expand — opened by clicking the header, exactly as
    // subagent-duration-frozen-figure.e2e.ts does for its own complete rows.
    await row.getByTestId('execution-row-header').click();

    const rowDuration = row.getByTestId('subagent-chain-duration');

    // …:observable:check-session-duration-same-test-id — the identical locator string
    // `getByTestId('subagent-chain-duration')`, scoped only by which element it is called on,
    // finds exactly one element reading exactly the same text on both surfaces.
    await expect(rowDuration).toHaveCount(1);
    await expect(rowDuration).toHaveText('4m', { timeout: CHAIN_TIMEOUT });
  });
});
