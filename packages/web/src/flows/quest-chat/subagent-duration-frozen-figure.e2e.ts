import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { elapsedDurationHarness } from '../../../test/harnesses/elapsed-duration/elapsed-duration.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { subagentDurationHarness } from '../../../test/harnesses/subagent-duration/subagent-duration.harness';

const GUILD_PATH = '/tmp/dm-e2e-subagent-duration-frozen-figure';
const PANEL_TIMEOUT = 10_000;
const CHAIN_TIMEOUT = 10_000;

// Every chain in this file has a notification that ALREADY landed, so its duration comes from
// reportedDurationMs or the timestamp gap — never from the panel's live clock. That means the row
// OWNING that chain does not itself need to be `in_progress`: `complete` (expanded by a click, same
// shape row-status-gate.e2e.ts already proves) renders the identical chain body and duration text.
//
// This file uses `complete` + click for every chain except where a case NAMES the live clock as the
// thing under test (the `branch:notification-yes` clock-derived chain below). That is a deliberate
// deviation from a literal "every row is in_progress" reading, for a reason proven against this exact
// server: `reconcile-watchers-layer-responder` starts a live JSONL watcher for EVERY `in_progress`
// work item carrying a sessionId, and `quest-monitor-watcher-start-broker` runs
// `questOrphanResetBroker` on the first such watcher start of the server's whole lifetime — which
// resets every OTHER currently-active (`in_progress`) sessionId-bearing work item across every guild
// back to `pending`, clearing its sessionId. A quest seeding several simultaneous `in_progress`
// sessionId rows is exactly the shape that sweep exists to clean up after a crashed dispatch loop, so
// it is not safe to construct in an E2E fixture. `complete` rows are inert to that mechanism
// (`isActiveWorkItemStatusGuard` only matches `queued`/`in_progress`) while still replaying their
// session and rendering their chain identically once clicked open.
const FIXED_NOW = '2026-09-10T13:00:00.000Z';

const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: subagentDuration, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('A sub-agent chain whose completion notification has landed freezes on the reported duration, or the timestamp gap when none is reported', () => {
  test.describe.configure({ timeout: 30_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {eight complete rows, each carrying a landed notification} => each subagent-chain-duration reads the exact band its own precedence source (reportedDurationMs, or the timestamp gap when absent) crosses', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Frozen Figure Band Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const DU9033_OP = '00000000-0000-4000-8000-0000f1000001';
    const DU270K_OP = '00000000-0000-4000-8000-0000f1000002';
    const DU3600K_OP = '00000000-0000-4000-8000-0000f1000003';
    const DU4380K_OP = '00000000-0000-4000-8000-0000f1000004';
    const WINS_OP = '00000000-0000-4000-8000-0000f1000005';
    const GAP430_OP = '00000000-0000-4000-8000-0000f1000006';
    const GAP30_OP = '00000000-0000-4000-8000-0000f1000007';
    const GAPNEG_OP = '00000000-0000-4000-8000-0000f1000008';

    const DU9033_WI = 'e2e00000-0000-4000-8000-0000f1000001';
    const DU270K_WI = 'e2e00000-0000-4000-8000-0000f1000002';
    const DU3600K_WI = 'e2e00000-0000-4000-8000-0000f1000003';
    const DU4380K_WI = 'e2e00000-0000-4000-8000-0000f1000004';
    const WINS_WI = 'e2e00000-0000-4000-8000-0000f1000005';
    const GAP430_WI = 'e2e00000-0000-4000-8000-0000f1000006';
    const GAP30_WI = 'e2e00000-0000-4000-8000-0000f1000007';
    const GAPNEG_WI = 'e2e00000-0000-4000-8000-0000f1000008';

    const DU9033_TEXT = 'codeweaver: frozen figure durationMs 9033 reads under a minute';
    const DU270K_TEXT = 'codeweaver: frozen figure durationMs 270000 reads four minutes';
    const DU3600K_TEXT = 'codeweaver: frozen figure durationMs 3600000 reads one hour';
    const DU4380K_TEXT = 'codeweaver: frozen figure durationMs 4380000 reads one hour thirteen';
    const WINS_TEXT = 'codeweaver: frozen figure durationMs wins over the ten minute gap';
    const GAP430_TEXT = 'codeweaver: frozen figure gap of four minutes thirty seconds';
    const GAP30_TEXT = 'codeweaver: frozen figure gap of thirty seconds under a minute';
    const GAPNEG_TEXT = 'codeweaver: frozen figure negative gap floors at zero';

    const DU9033_SESSION_ID = 'e2e-ff-du9033';
    const DU270K_SESSION_ID = 'e2e-ff-du270k';
    const DU3600K_SESSION_ID = 'e2e-ff-du3600k';
    const DU4380K_SESSION_ID = 'e2e-ff-du4380k';
    const WINS_SESSION_ID = 'e2e-ff-wins';
    const GAP430_SESSION_ID = 'e2e-ff-gap430';
    const GAP30_SESSION_ID = 'e2e-ff-gap30';
    const GAPNEG_SESSION_ID = 'e2e-ff-gapneg';

    // Each row's Task-to-notification GAP is chosen to land in a DIFFERENT band than the
    // row's own reportedDurationMs, so the two precedence sources are never accidentally equal —
    // load-bearing for the RED FIRST proof: inverting the transformer's precedence ternary makes
    // every one of these five rows read its gap band instead of its reportedDurationMs band.
    subagentDuration.seedChain({
      sessionId: DU9033_SESSION_ID,
      agentId: 'ffdu9033agent',
      taskToolUseId: 'toolu_ff_du9033',
      taskDescription: DU9033_TEXT,
      taskToolUseAt: '2026-09-10T01:00:00.000Z',
      // gap 200000ms (3m20s) => band "3m", never "<1m"
      notification: { at: '2026-09-10T01:03:20.000Z', durationMs: 9033 },
    });
    subagentDuration.seedChain({
      sessionId: DU270K_SESSION_ID,
      agentId: 'ffdu270kagent',
      taskToolUseId: 'toolu_ff_du270k',
      taskDescription: DU270K_TEXT,
      taskToolUseAt: '2026-09-10T02:00:00.000Z',
      // gap 45000ms (45s) => band "<1m", never "4m"
      notification: { at: '2026-09-10T02:00:45.000Z', durationMs: 270_000 },
    });
    subagentDuration.seedChain({
      sessionId: DU3600K_SESSION_ID,
      agentId: 'ffdu3600kagent',
      taskToolUseId: 'toolu_ff_du3600k',
      taskDescription: DU3600K_TEXT,
      taskToolUseAt: '2026-09-10T03:00:00.000Z',
      // gap 150000ms (2m30s) => band "2m", never "1h"
      notification: { at: '2026-09-10T03:02:30.000Z', durationMs: 3_600_000 },
    });
    subagentDuration.seedChain({
      sessionId: DU4380K_SESSION_ID,
      agentId: 'ffdu4380kagent',
      taskToolUseId: 'toolu_ff_du4380k',
      taskDescription: DU4380K_TEXT,
      taskToolUseAt: '2026-09-10T04:00:00.000Z',
      // gap 2000000ms (33m20s) => band "33m", never "1h13m"
      notification: { at: '2026-09-10T04:33:20.000Z', durationMs: 4_380_000 },
    });
    subagentDuration.seedChain({
      sessionId: WINS_SESSION_ID,
      agentId: 'ffwinsagent',
      taskToolUseId: 'toolu_ff_wins',
      taskDescription: WINS_TEXT,
      taskToolUseAt: '2026-09-10T10:00:00.000Z',
      // gap 600000ms (10m) => band "10m", never "4m"
      notification: { at: '2026-09-10T10:10:00.000Z', durationMs: 270_000 },
    });
    // No durationMs on the remaining three — the gap IS the figure, so nothing to invert against.
    subagentDuration.seedChain({
      sessionId: GAP430_SESSION_ID,
      agentId: 'ffgap430agent',
      taskToolUseId: 'toolu_ff_gap430',
      taskDescription: GAP430_TEXT,
      taskToolUseAt: '2026-09-10T06:00:00.000Z',
      notification: { at: '2026-09-10T06:04:30.000Z' },
    });
    subagentDuration.seedChain({
      sessionId: GAP30_SESSION_ID,
      agentId: 'ffgap30agent',
      taskToolUseId: 'toolu_ff_gap30',
      taskDescription: GAP30_TEXT,
      taskToolUseAt: '2026-09-10T07:00:00.000Z',
      notification: { at: '2026-09-10T07:00:30.000Z' },
    });
    subagentDuration.seedChain({
      sessionId: GAPNEG_SESSION_ID,
      agentId: 'ffgapnegagent',
      taskToolUseId: 'toolu_ff_gapneg',
      taskDescription: GAPNEG_TEXT,
      taskToolUseAt: '2026-09-10T08:04:30.000Z',
      // notification landed BEFORE the Task tool use — floors at zero, never negative.
      notification: { at: '2026-09-10T08:00:00.000Z' },
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Frozen Figure Band Quest',
      userRequest: 'Build the feature',
    });
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'in_progress',
      operations: [
        { id: DU9033_OP, role: 'codeweaver', text: DU9033_TEXT, status: 'complete' },
        { id: DU270K_OP, role: 'codeweaver', text: DU270K_TEXT, status: 'complete' },
        { id: DU3600K_OP, role: 'codeweaver', text: DU3600K_TEXT, status: 'complete' },
        { id: DU4380K_OP, role: 'codeweaver', text: DU4380K_TEXT, status: 'complete' },
        { id: WINS_OP, role: 'codeweaver', text: WINS_TEXT, status: 'complete' },
        { id: GAP430_OP, role: 'codeweaver', text: GAP430_TEXT, status: 'complete' },
        { id: GAP30_OP, role: 'codeweaver', text: GAP30_TEXT, status: 'complete' },
        { id: GAPNEG_OP, role: 'codeweaver', text: GAPNEG_TEXT, status: 'complete' },
      ],
      workItems: [
        {
          id: DU9033_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: DU9033_SESSION_ID,
          relatedDataItems: [`operations/${DU9033_OP}`],
        },
        {
          id: DU270K_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: DU270K_SESSION_ID,
          relatedDataItems: [`operations/${DU270K_OP}`],
        },
        {
          id: DU3600K_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: DU3600K_SESSION_ID,
          relatedDataItems: [`operations/${DU3600K_OP}`],
        },
        {
          id: DU4380K_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: DU4380K_SESSION_ID,
          relatedDataItems: [`operations/${DU4380K_OP}`],
        },
        {
          id: WINS_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: WINS_SESSION_ID,
          relatedDataItems: [`operations/${WINS_OP}`],
        },
        {
          id: GAP430_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: GAP430_SESSION_ID,
          relatedDataItems: [`operations/${GAP430_OP}`],
        },
        {
          id: GAP30_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: GAP30_SESSION_ID,
          relatedDataItems: [`operations/${GAP30_OP}`],
        },
        {
          id: GAPNEG_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: GAPNEG_SESSION_ID,
          relatedDataItems: [`operations/${GAPNEG_OP}`],
        },
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // No explicit replay trigger: subscribe-quest already replays every work item's own session
    // automatically on navigate. Calling nav.triggerReplayFromBrowser here as well would deliver
    // each chain twice and duplicate every SUBAGENT_CHAIN below.
    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    const du9033Row = rows.filter({ hasText: DU9033_TEXT });
    const du270kRow = rows.filter({ hasText: DU270K_TEXT });
    const du3600kRow = rows.filter({ hasText: DU3600K_TEXT });
    const du4380kRow = rows.filter({ hasText: DU4380K_TEXT });
    const winsRow = rows.filter({ hasText: WINS_TEXT });
    const gap430Row = rows.filter({ hasText: GAP430_TEXT });
    const gap30Row = rows.filter({ hasText: GAP30_TEXT });
    const gapNegRow = rows.filter({ hasText: GAPNEG_TEXT });

    // Every row here is `complete`, so none auto-expands — each is opened by clicking its own
    // header, exactly as row-status-gate.e2e.ts already does for its own complete/failed rows.
    await du9033Row.getByTestId('execution-row-header').click();
    await du270kRow.getByTestId('execution-row-header').click();
    await du3600kRow.getByTestId('execution-row-header').click();
    await du4380kRow.getByTestId('execution-row-header').click();
    await winsRow.getByTestId('execution-row-header').click();
    await gap430Row.getByTestId('execution-row-header').click();
    await gap30Row.getByTestId('execution-row-header').click();
    await gapNegRow.getByTestId('execution-row-header').click();

    // …:branch:yes-start — a chain WITH a Task tool-use timestamp renders exactly one
    // subagent-chain-duration element; the sibling "no" branch's own count of 0 is GROUP 1's read.
    await expect(du9033Row.getByTestId('subagent-chain-duration')).toHaveCount(1);

    // …:observable:check-duration-ms-9033-reads-under-a-minute
    await expect(du9033Row.getByTestId('subagent-chain-duration')).toHaveText('<1m', {
      timeout: CHAIN_TIMEOUT,
    });
    // …:observable:check-duration-ms-270000-reads-4m
    await expect(du270kRow.getByTestId('subagent-chain-duration')).toHaveText('4m', {
      timeout: CHAIN_TIMEOUT,
    });
    // …:observable:check-duration-ms-3600000-reads-1h
    await expect(du3600kRow.getByTestId('subagent-chain-duration')).toHaveText('1h', {
      timeout: CHAIN_TIMEOUT,
    });
    // …:observable:check-duration-ms-4380000-reads-1h13m
    await expect(du4380kRow.getByTestId('subagent-chain-duration')).toHaveText('1h13m', {
      timeout: CHAIN_TIMEOUT,
    });
    // …:observable:check-duration-ms-wins-over-gap
    await expect(winsRow.getByTestId('subagent-chain-duration')).toHaveText('4m', {
      timeout: CHAIN_TIMEOUT,
    });
    // …:observable:check-gap-4m30s-reads-4m
    await expect(gap430Row.getByTestId('subagent-chain-duration')).toHaveText('4m', {
      timeout: CHAIN_TIMEOUT,
    });
    // …:observable:check-gap-30s-reads-under-a-minute
    await expect(gap30Row.getByTestId('subagent-chain-duration')).toHaveText('<1m', {
      timeout: CHAIN_TIMEOUT,
    });
    // …:observable:check-negative-gap-floors-at-zero
    await expect(gapNegRow.getByTestId('subagent-chain-duration')).toHaveText('<1m', {
      timeout: CHAIN_TIMEOUT,
    });

    // …:terminal:frozen-duration — the figure renders WITH the chain's body intact beside it:
    // the notification entry itself ("TASK REPORT…Sub-agent work complete") renders inside the
    // chain, the description stays readable, and the row is not stuck on a streaming spinner.
    await expect(du270kRow.getByTestId('SUBAGENT_CHAIN_HEADER')).toContainText(DU270K_TEXT);
    await expect(du270kRow.getByTestId('SUBAGENT_CHAIN')).toContainText('Sub-agent work complete');
    await expect(du270kRow.getByTestId('streaming-bar-layer-widget')).not.toBeVisible();
  });

  test('VALID: {one complete row carrying a landed notification, one in_progress row carrying no notification at all} => the notification-bearing chain reads its reported duration while the notification-less chain reads the panel clock instead', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Frozen Figure Notification Branch Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const REPORTED_OP = '00000000-0000-4000-8000-0000f2000001';
    const CLOCK_OP = '00000000-0000-4000-8000-0000f2000002';
    const REPORTED_WI = 'e2e00000-0000-4000-8000-0000f2000001';
    const CLOCK_WI = 'e2e00000-0000-4000-8000-0000f2000002';
    const REPORTED_TEXT = 'codeweaver: frozen figure branch chain with a landed notification';
    const CLOCK_TEXT = 'codeweaver: frozen figure branch chain with no notification at all';
    const REPORTED_SESSION_ID = 'e2e-ff-branch-reported';
    const CLOCK_SESSION_ID = 'e2e-ff-branch-clock';
    // Task sits 600000 ms (10m) before FIXED_NOW, which DIFFERS from the reported-duration chain's
    // 4m so the two strings prove the notification was actually consulted rather than ignored.
    const CLOCK_TASK_TOOL_USE_AT = '2026-09-10T12:50:00.000Z';

    subagentDuration.seedChain({
      sessionId: REPORTED_SESSION_ID,
      agentId: 'ffbranchreported',
      taskToolUseId: 'toolu_ff_branch_reported',
      taskDescription: REPORTED_TEXT,
      taskToolUseAt: '2026-09-10T09:00:00.000Z',
      notification: { at: '2026-09-10T09:09:00.000Z', durationMs: 270_000 },
    });
    // No `notification` field at all — the sibling of "has-notification": nothing has landed,
    // so the only end point is the panel's live clock. This is the ONE row in this file that is
    // `in_progress` — it is the sole thing under test needing a real clock threaded, and it is the
    // ONLY active sessionId-bearing work item in this quest, so no other row's session is at risk
    // from the orphan-reset sweep described at the top of this file.
    subagentDuration.seedChain({
      sessionId: CLOCK_SESSION_ID,
      agentId: 'ffbranchclock',
      taskToolUseId: 'toolu_ff_branch_clock',
      taskDescription: CLOCK_TEXT,
      taskToolUseAt: CLOCK_TASK_TOOL_USE_AT,
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Frozen Figure Notification Branch Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = String(created.filePath);
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath,
      status: 'in_progress',
      operations: [
        { id: REPORTED_OP, role: 'codeweaver', text: REPORTED_TEXT, status: 'complete' },
        { id: CLOCK_OP, role: 'codeweaver', text: CLOCK_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: REPORTED_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: REPORTED_SESSION_ID,
          relatedDataItems: [`operations/${REPORTED_OP}`],
        },
        {
          id: CLOCK_WI,
          role: 'codeweaver',
          status: 'in_progress',
          sessionId: CLOCK_SESSION_ID,
          relatedDataItems: [`operations/${CLOCK_OP}`],
        },
      ],
    });

    // The panel's shared clock only threads to a row when the WORK ITEM itself carries a
    // `startedAt` (`hasRunningWorkItem` in execution-panel-widget.tsx) — a field `writeQuestFile`
    // never writes. Stamping it here is what makes CLOCK_WI's chain actually see `now`.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: CLOCK_WI, startedAt: CLOCK_TASK_TOOL_USE_AT }],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    const reportedRow = rows.filter({ hasText: REPORTED_TEXT });
    const clockRow = rows.filter({ hasText: CLOCK_TEXT });

    // reportedRow is `complete` and needs a click; clockRow is `in_progress` and auto-expands.
    await reportedRow.getByTestId('execution-row-header').click();

    // …:branch:notification-yes — the notification-bearing chain reads its reported duration…
    await expect(reportedRow.getByTestId('subagent-chain-duration')).toHaveText('4m', {
      timeout: CHAIN_TIMEOUT,
    });
    // …while the notification-less sibling reads the live clock instead, and the two DIFFER.
    await expect(clockRow.getByTestId('subagent-chain-duration')).toHaveText('10m', {
      timeout: CHAIN_TIMEOUT,
    });
  });

  test('VALID: {two complete rows sharing the same Task and notification timestamps 600000 ms apart, one notification reporting durationMs and one omitting it} => the duration-ms chain reads 4m while the timestamp-gap chain reads 10m', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Frozen Figure Duration-Ms Branch Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const TAGGED_OP = '00000000-0000-4000-8000-0000f3000001';
    const UNTAGGED_OP = '00000000-0000-4000-8000-0000f3000002';
    const TAGGED_WI = 'e2e00000-0000-4000-8000-0000f3000001';
    const UNTAGGED_WI = 'e2e00000-0000-4000-8000-0000f3000002';
    const TAGGED_TEXT = 'codeweaver: frozen figure branch chain tagged with duration_ms';
    const UNTAGGED_TEXT = 'codeweaver: frozen figure branch chain with no duration_ms tag';
    const TAGGED_SESSION_ID = 'e2e-ff-branch-tagged';
    const UNTAGGED_SESSION_ID = 'e2e-ff-branch-untagged';
    const SHARED_TASK_AT = '2026-09-10T05:00:00.000Z';
    const SHARED_NOTIFICATION_AT = '2026-09-10T05:10:00.000Z'; // +600000ms

    subagentDuration.seedChain({
      sessionId: TAGGED_SESSION_ID,
      agentId: 'ffbranchtagged',
      taskToolUseId: 'toolu_ff_branch_tagged',
      taskDescription: TAGGED_TEXT,
      taskToolUseAt: SHARED_TASK_AT,
      notification: { at: SHARED_NOTIFICATION_AT, durationMs: 270_000 },
    });
    subagentDuration.seedChain({
      sessionId: UNTAGGED_SESSION_ID,
      agentId: 'ffbranchuntagged',
      taskToolUseId: 'toolu_ff_branch_untagged',
      taskDescription: UNTAGGED_TEXT,
      taskToolUseAt: SHARED_TASK_AT,
      notification: { at: SHARED_NOTIFICATION_AT },
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Frozen Figure Duration-Ms Branch Quest',
      userRequest: 'Build the feature',
    });
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'in_progress',
      operations: [
        { id: TAGGED_OP, role: 'codeweaver', text: TAGGED_TEXT, status: 'complete' },
        { id: UNTAGGED_OP, role: 'codeweaver', text: UNTAGGED_TEXT, status: 'complete' },
      ],
      workItems: [
        {
          id: TAGGED_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: TAGGED_SESSION_ID,
          relatedDataItems: [`operations/${TAGGED_OP}`],
        },
        {
          id: UNTAGGED_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: UNTAGGED_SESSION_ID,
          relatedDataItems: [`operations/${UNTAGGED_OP}`],
        },
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    const taggedRow = rows.filter({ hasText: TAGGED_TEXT });
    const untaggedRow = rows.filter({ hasText: UNTAGGED_TEXT });

    await taggedRow.getByTestId('execution-row-header').click();
    await untaggedRow.getByTestId('execution-row-header').click();

    // …:branch:duration-ms-yes — the tagged chain reads its reported duration…
    await expect(taggedRow.getByTestId('subagent-chain-duration')).toHaveText('4m', {
      timeout: CHAIN_TIMEOUT,
    });
    // …:branch:duration-ms-no — read from the other side of the SAME pair of timestamps: the
    // untagged chain falls back to the timestamp gap and reads a DIFFERENT string.
    await expect(untaggedRow.getByTestId('subagent-chain-duration')).toHaveText('10m', {
      timeout: CHAIN_TIMEOUT,
    });
  });
});
