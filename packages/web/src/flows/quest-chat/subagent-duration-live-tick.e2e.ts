import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { elapsedDurationHarness } from '../../../test/harnesses/elapsed-duration/elapsed-duration.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { subagentDurationHarness } from '../../../test/harnesses/subagent-duration/subagent-duration.harness';
import { subagentDurationTripleChainHarness } from '../../../test/harnesses/subagent-duration-triple-chain/subagent-duration-triple-chain.harness';
import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

const GUILD_PATH = '/tmp/dm-e2e-subagent-duration-live-tick';
const PANEL_TIMEOUT = 10_000;
const CHAIN_TIMEOUT = 10_000;
const TICK_MS = elapsedDisplayConfigStatics.refresh.tickMs;

// Every case below installs the browser's FULL fake clock (page.clock.install, never
// setFixedTime alone) before page.goto — only a full install lets page.clock.fastForward fire the
// panel's shared setInterval callback. elapsed-duration-tick.e2e.ts is the mirror and says this
// in its own header.
const FIXED_NOW = '2026-01-01T12:00:00.000Z';
// FIXED_NOW minus 270000 ms = 4m30s before the installed clock, which elapsedPartsTransformer
// floors to `4m` — never `4m30s`, never rounds up to `5m`.
const FOUR_MIN_TASK_AT = '2026-01-01T11:55:30.000Z';
// FIXED_NOW minus 60000 ms = exactly 1m before the installed clock.
const ONE_MIN_TASK_AT = '2026-01-01T11:59:00.000Z';

const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: subagentDuration, testObj: test });
const tripleChain = subagentDurationTripleChainHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: tripleChain, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Live sub-agent chain duration ticks with the execution panel clock', () => {
  test.describe.configure({ timeout: 30_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {Task tool use timestamped 270000ms before the panel clock, no notification anywhere in the session} => subagent-chain-duration renders once on first render, reading 4m, before any tick fires', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Live First Render Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const SESSION_ID = 'e2e-subagent-duration-live-first-render-001';
    const AGENT_ID = 'liveticka1firstrender';
    const TOOL_USE_ID = 'toolu_live_tick_first_render';
    const CHAIN_DESCRIPTION = 'Live tick first render sub-agent work';
    const RUNNING_OP = '00000000-0000-4000-8000-0000e8000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000e8000001';
    const RUNNING_TEXT = 'codeweaver: subagent duration live tick first render row';

    subagentDuration.seedChain({
      sessionId: SESSION_ID,
      agentId: AGENT_ID,
      taskToolUseId: TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: FOUR_MIN_TASK_AT,
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Live First Render Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = String(created.filePath);
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
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
      items: [{ id: RUNNING_WI, startedAt: FOUR_MIN_TASK_AT }],
    });

    await page.clock.install({ time: FIXED_NOW });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // No explicit replay trigger: subscribe-quest already replays every work item's own session
    // on navigate. Calling nav.triggerReplayFromBrowser as well would deliver this chain twice.
    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });

    // …:observable:check-live-figure-on-first-render — asserted BEFORE any fastForward call in
    // this test (there is none): the figure is derived from the Task timestamp on the very first
    // render, not seeded at zero and corrected on the first tick.
    // …:observable:check-live-figure-without-notification — this chain never receives a
    // <task-notification> line (seedChain was called with no `notification`), so the count-1,
    // band-string claim and the first-render claim are proved by the same element.
    await expect(row.getByTestId('subagent-chain-duration')).toHaveCount(1);
    await expect(row.getByTestId('subagent-chain-duration')).toHaveText('4m');
  });

  test('VALID: {Task tool use timestamped 60000ms before the panel clock, no notification} => reads 1m immediately, then 2m and 3m across two successive 60000ms ticks, with exactly one live interval throughout', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Live Tick Advance Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const SESSION_ID = 'e2e-subagent-duration-live-tick-advance-001';
    const AGENT_ID = 'liveticka2advance';
    const TOOL_USE_ID = 'toolu_live_tick_advance';
    const CHAIN_DESCRIPTION = 'Live tick advance sub-agent work';
    const RUNNING_OP = '00000000-0000-4000-8000-0000e9000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000e9000001';
    const RUNNING_TEXT = 'codeweaver: subagent duration live tick advance row';

    subagentDuration.seedChain({
      sessionId: SESSION_ID,
      agentId: AGENT_ID,
      taskToolUseId: TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: ONE_MIN_TASK_AT,
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Live Tick Advance Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = String(created.filePath);
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
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
      items: [{ id: RUNNING_WI, startedAt: ONE_MIN_TASK_AT }],
    });

    await page.clock.install({ time: FIXED_NOW });
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });
    const chainDuration = row.getByTestId('subagent-chain-duration');

    // …:branch:now-yes — the in_progress row's notification-less chain renders a count of 1
    // carrying `1m`; the sibling `no` branch's own value (count 0 on a complete row) is read by
    // subagent-duration-row-status-gate.e2e.ts, not re-derived here.
    await expect(chainDuration).toHaveCount(1);
    await expect(chainDuration).toHaveText('1m');
    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 0, live: 1 });

    // …:observable:check-figure-advances-on-tick — no page.goto, no page.reload between the two
    // readings, only the panel's own clock advancing.
    await page.clock.fastForward(TICK_MS);
    await expect(chainDuration).toHaveText('2m');
    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 0, live: 1 });

    // …:branch:notification-arrives-no — THREE readings, not two: one climb (1m→2m) is also what
    // the `yes` branch produces on its way to freezing, so only this third reading (2m→3m, with no
    // notification ever having landed) separates the two branches.
    await page.clock.fastForward(TICK_MS);
    await expect(chainDuration).toHaveText('3m');
    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 0, live: 1 });
  });

  // A row-per-chain arrangement (two simultaneously in_progress WORK ITEMS, each with its own
  // real session) was tried here first and measured to never deliver either session's replay:
  // writing quest.json twice in quick succession (writeQuestFile, then stampWorkItems) raced the
  // outbox watcher's own reconciliation and repeatably left the file torn, even behind the no-op
  // PATCH elapsed-duration-tick.e2e.ts uses for a similar race elsewhere. One row holding TWO
  // sibling chains — proven reliable by the single-interval case below, which already renders
  // three chains this way — sidesteps that path entirely while proving the identical invariant:
  // a chain fed a reported duration stays put across a tick that a sibling, clock-fed chain in the
  // SAME row visibly climbs through.
  test('VALID: {one in_progress row whose session holds two sibling chains: one already notified a 4380000ms duration, one still live at 1m} => the notified figure stays 1h13m across a tick while its live sibling moves from 1m to 2m', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Frozen Beside Live Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const SESSION_ID = 'e2e-subagent-duration-frozen-beside-live-001';
    const FROZEN_AGENT_ID = 'liveticka3frozen';
    const FROZEN_TOOL_USE_ID = 'toolu_live_tick_frozen_beside';
    const FROZEN_DESCRIPTION = 'Frozen beside live: already-notified sub-agent work';
    const FROZEN_TASK_AT = '2026-01-01T10:00:00.000Z';
    const FROZEN_NOTIFICATION_AT = '2026-01-01T10:05:00.000Z';
    const FROZEN_DURATION_MS = 4_380_000; // 4380s = 73min = 1h13m

    const LIVE_AGENT_ID = 'liveticka3live';
    const LIVE_TOOL_USE_ID = 'toolu_live_tick_live_beside';
    const LIVE_DESCRIPTION = 'Live beside frozen: still-running sub-agent work';

    const RUNNING_OP = '00000000-0000-4000-8000-0000ea000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000ea000001';
    const RUNNING_TEXT = 'codeweaver: subagent duration frozen beside live row';

    tripleChain.seedSiblingChains({
      sessionId: SESSION_ID,
      userMessage: 'Kick off frozen-beside-live sub-agent work',
      chains: [
        {
          agentId: FROZEN_AGENT_ID,
          toolUseId: FROZEN_TOOL_USE_ID,
          taskDescription: FROZEN_DESCRIPTION,
          taskToolUseAt: FROZEN_TASK_AT,
          subagentText: 'Frozen beside live body',
          notification: { at: FROZEN_NOTIFICATION_AT, durationMs: FROZEN_DURATION_MS },
        },
        {
          agentId: LIVE_AGENT_ID,
          toolUseId: LIVE_TOOL_USE_ID,
          taskDescription: LIVE_DESCRIPTION,
          taskToolUseAt: ONE_MIN_TASK_AT,
          subagentText: 'Live beside frozen body',
        },
      ],
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Frozen Beside Live Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = String(created.filePath);
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
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
      items: [{ id: RUNNING_WI, startedAt: FROZEN_TASK_AT }],
    });

    await page.clock.install({ time: FIXED_NOW });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });
    const frozenHeader = row
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: FROZEN_DESCRIPTION });
    const liveHeader = row
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: LIVE_DESCRIPTION });
    const frozenDuration = frozenHeader.getByTestId('subagent-chain-duration');
    const liveDuration = liveHeader.getByTestId('subagent-chain-duration');

    // Frozen figure asserted FIRST at each timepoint, so this half of the proof stands on its own
    // regardless of what the live figure does.
    await expect(frozenDuration).toHaveText('1h13m', { timeout: CHAIN_TIMEOUT });
    await expect(liveDuration).toHaveText('1m');

    await page.clock.fastForward(TICK_MS);

    // …:observable:check-frozen-figure-survives-tick — the frozen figure is unchanged by a tick.
    // …:branch:notification-no — B (no notification) MOVING beside A (has a notification) staying
    // put is the value the two branches produce differently; without B moving, a frozen figure and
    // a dead interval would read alike.
    await expect(frozenDuration).toHaveText('1h13m');
    await expect(liveDuration).toHaveText('2m');
  });

  test('VALID: {one in_progress row whose replayed session holds three sibling Task chains with distinct descriptions} => all three render their own distinct figures and the panel registers exactly one setInterval', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Single Interval Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const SESSION_ID = 'e2e-subagent-duration-single-interval-001';
    const RUNNING_OP = '00000000-0000-4000-8000-0000eb000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000eb000001';
    const RUNNING_TEXT = 'codeweaver: subagent duration single interval three chains row';

    const ALPHA_DESCRIPTION = 'Single interval triple chain Alpha work';
    const BETA_DESCRIPTION = 'Single interval triple chain Beta work';
    const GAMMA_DESCRIPTION = 'Single interval triple chain Gamma work';
    // FIXED_NOW minus 180000/120000/60000 ms => 3m/2m/1m, each a distinct exact minute value so
    // the three headers are provably reading their OWN chain rather than one shared figure.
    const THREE_MIN_TASK_AT = '2026-01-01T11:57:00.000Z';
    const TWO_MIN_TASK_AT = '2026-01-01T11:58:00.000Z';

    tripleChain.seedSiblingChains({
      sessionId: SESSION_ID,
      userMessage: 'Kick off single-interval triple sub-agent work',
      chains: [
        {
          agentId: 'singleintervalalpha',
          toolUseId: 'toolu_single_interval_alpha',
          taskDescription: ALPHA_DESCRIPTION,
          taskToolUseAt: THREE_MIN_TASK_AT,
          subagentText: 'Single interval Alpha body',
        },
        {
          agentId: 'singleintervalbeta',
          toolUseId: 'toolu_single_interval_beta',
          taskDescription: BETA_DESCRIPTION,
          taskToolUseAt: TWO_MIN_TASK_AT,
          subagentText: 'Single interval Beta body',
        },
        {
          agentId: 'singleintervalgamma',
          toolUseId: 'toolu_single_interval_gamma',
          taskDescription: GAMMA_DESCRIPTION,
          taskToolUseAt: ONE_MIN_TASK_AT,
          subagentText: 'Single interval Gamma body',
        },
      ],
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Single Interval Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = String(created.filePath);
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
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
      items: [{ id: RUNNING_WI, startedAt: THREE_MIN_TASK_AT }],
    });

    await page.clock.install({ time: FIXED_NOW });
    await elapsed.installIntervalCounter();

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });

    const alphaHeader = row
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: ALPHA_DESCRIPTION });
    const betaHeader = row
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: BETA_DESCRIPTION });
    const gammaHeader = row
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: GAMMA_DESCRIPTION });

    // …:observable:check-single-interval-for-panel — three figures ON SCREEN is the load-bearing
    // half: a count of 1 over a panel rendering zero chains would prove nothing.
    await expect(alphaHeader.getByTestId('subagent-chain-duration')).toBeVisible({
      timeout: CHAIN_TIMEOUT,
    });
    await expect(alphaHeader.getByTestId('subagent-chain-duration')).toHaveText('3m');
    await expect(betaHeader.getByTestId('subagent-chain-duration')).toBeVisible({
      timeout: CHAIN_TIMEOUT,
    });
    await expect(betaHeader.getByTestId('subagent-chain-duration')).toHaveText('2m');
    await expect(gammaHeader.getByTestId('subagent-chain-duration')).toBeVisible({
      timeout: CHAIN_TIMEOUT,
    });
    await expect(gammaHeader.getByTestId('subagent-chain-duration')).toHaveText('1m');

    await expect
      .poll(async () => elapsed.readIntervalCounts())
      .toStrictEqual({ registered: 1, cleared: 0, live: 1 });
  });
});
