import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { subagentDurationHarness } from '../../../test/harnesses/subagent-duration/subagent-duration.harness';

const GUILD_PATH = '/tmp/dm-e2e-subagent-duration-row-status-gate';
const PANEL_TIMEOUT = 10_000;
const CHAIN_TIMEOUT = 10_000;

// The panel's shared elapsed tick reads Date.now() on mount, so a single fixed reading (no
// fastForward anywhere in this file) is enough — mirrors elapsed-duration-absent.e2e.ts, which
// proves the same "no live clock reaches a non-running row" shape one layer up, on
// execution-row-duration rather than subagent-chain-duration.
const FIXED_NOW = '2026-01-01T12:00:00.000Z';
// FIXED_NOW minus 270000 ms = 4m30s before the installed clock, which elapsedPartsTransformer
// floors to `4m` — never `4m30s`, never rounds up to `5m`.
const TASK_TOOL_USE_AT = '2026-01-01T11:55:30.000Z';
const CHAIN_DESCRIPTION = 'Sub-agent duration status gate work';

const RUNNING_OP = '00000000-0000-4000-8000-0000d5000001';
const COMPLETE_OP = '00000000-0000-4000-8000-0000d5000002';
const FAILED_OP = '00000000-0000-4000-8000-0000d5000003';
const RUNNING_WI = 'e2e00000-0000-4000-8000-0000d5000001';
const COMPLETE_WI = 'e2e00000-0000-4000-8000-0000d5000002';
const FAILED_WI = 'e2e00000-0000-4000-8000-0000d5000003';
const RUNNING_TEXT = 'codeweaver: subagent duration running row';
const COMPLETE_TEXT = 'codeweaver: subagent duration complete row';
const FAILED_TEXT = 'codeweaver: subagent duration failed row';
const RUNNING_SESSION_ID = 'e2e-subagent-duration-running-001';
const COMPLETE_SESSION_ID = 'e2e-subagent-duration-complete-001';
const FAILED_SESSION_ID = 'e2e-subagent-duration-failed-001';
const RUNNING_AGENT_ID = 'e2esubagentdurationrunning001';
const COMPLETE_AGENT_ID = 'e2esubagentdurationcomplete001';
const FAILED_AGENT_ID = 'e2esubagentdurationfailed001';
const RUNNING_TOOL_USE_ID = 'toolu_subagent_duration_running_001';
const COMPLETE_TOOL_USE_ID = 'toolu_subagent_duration_complete_001';
const FAILED_TOOL_USE_ID = 'toolu_subagent_duration_failed_001';

const NO_START_OP = '00000000-0000-4000-8000-0000d6000001';
const NO_START_WI = 'e2e00000-0000-4000-8000-0000d6000001';
const NO_START_TEXT = 'codeweaver: subagent duration no-start row';
const NO_START_SESSION_ID = 'e2e-subagent-duration-no-start-001';
const NO_START_AGENT_ID = 'e2esubagentdurationnostart001';
const NO_START_BODY_TEXT = 'Standalone sub-agent body with no parent Task line';

const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: subagentDuration, testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Sub-agent chain duration is gated by the owning row status, not by whether the chain has a start', () => {
  test.describe.configure({ timeout: 30_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {three rows share one Task timestamp and carry no notification: in_progress, complete, failed} => the in_progress row renders a live subagent-chain-duration reading 4m while the complete and failed rows render none, chain and status badge intact', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Row Status Gate Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    subagentDuration.seedChain({
      sessionId: RUNNING_SESSION_ID,
      agentId: RUNNING_AGENT_ID,
      taskToolUseId: RUNNING_TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: TASK_TOOL_USE_AT,
    });
    subagentDuration.seedChain({
      sessionId: COMPLETE_SESSION_ID,
      agentId: COMPLETE_AGENT_ID,
      taskToolUseId: COMPLETE_TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: TASK_TOOL_USE_AT,
    });
    subagentDuration.seedChain({
      sessionId: FAILED_SESSION_ID,
      agentId: FAILED_AGENT_ID,
      taskToolUseId: FAILED_TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: TASK_TOOL_USE_AT,
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Row Status Gate Quest',
      userRequest: 'Build the feature',
    });
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'in_progress',
      operations: [
        { id: RUNNING_OP, role: 'codeweaver', text: RUNNING_TEXT, status: 'in_progress' },
        { id: COMPLETE_OP, role: 'codeweaver', text: COMPLETE_TEXT, status: 'complete' },
        // Operation status has no `failed` member — the ROW's failure is the work item's own
        // status; the operation item it links to only ever reaches `complete`.
        { id: FAILED_OP, role: 'codeweaver', text: FAILED_TEXT, status: 'complete' },
      ],
      workItems: [
        {
          id: RUNNING_WI,
          role: 'codeweaver',
          status: 'in_progress',
          sessionId: RUNNING_SESSION_ID,
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
        {
          id: COMPLETE_WI,
          role: 'codeweaver',
          status: 'complete',
          sessionId: COMPLETE_SESSION_ID,
          relatedDataItems: [`operations/${COMPLETE_OP}`],
        },
        {
          id: FAILED_WI,
          role: 'codeweaver',
          status: 'failed',
          sessionId: FAILED_SESSION_ID,
          relatedDataItems: [`operations/${FAILED_OP}`],
        },
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // No explicit replay trigger: subscribe-quest already replays every work item's own session
    // automatically on navigate (quest-replay-subagent-row-isolation.e2e.ts is the precedent —
    // same shape, no manual trigger). Calling nav.triggerReplayFromBrowser here as well delivers
    // the same chain a second time and duplicates the rendered SUBAGENT_CHAIN.
    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    const runningRow = rows.filter({ hasText: RUNNING_TEXT });
    const completeRow = rows.filter({ hasText: COMPLETE_TEXT });
    const failedRow = rows.filter({ hasText: FAILED_TEXT });

    // …:observable:check-chain-renders-in-row — the running row auto-expands once its entries
    // arrive, so the chain is visible with no click. Scoping the locator to the row is what
    // proves the chain rendered INSIDE it rather than somewhere else in the panel.
    await expect(runningRow.getByTestId('SUBAGENT_CHAIN')).toBeVisible({ timeout: CHAIN_TIMEOUT });

    // …:observable:check-running-row-passes-clock, …:branch:running-yes, …:branch:now-no
    // (positive half) — the running row threads the panel's clock, so its chain reads a live
    // figure derived from the Task timestamp.
    await expect(runningRow.getByTestId('subagent-chain-duration')).toHaveText('4m');

    // complete/failed rows must be expanded by CLICKING — neither auto-expands.
    await completeRow.getByTestId('execution-row-header').click();
    await failedRow.getByTestId('execution-row-header').click();

    await expect(completeRow.getByTestId('SUBAGENT_CHAIN')).toBeVisible({ timeout: CHAIN_TIMEOUT });
    await expect(failedRow.getByTestId('SUBAGENT_CHAIN')).toBeVisible({ timeout: CHAIN_TIMEOUT });

    // …:observable:check-complete-row-passes-no-clock, …:branch:running-no (negative half)
    await expect(completeRow.getByTestId('subagent-chain-duration')).toHaveCount(0);
    // …:observable:check-failed-row-passes-no-clock
    await expect(failedRow.getByTestId('subagent-chain-duration')).toHaveCount(0);

    // …:terminal:no-duration — the missing figure took nothing else with it: the chain's own
    // body (description) still reads, the row's status badge still reports DONE, and no
    // streaming spinner is left running on a row that finished.
    await expect(completeRow.getByTestId('SUBAGENT_CHAIN_HEADER')).toContainText(CHAIN_DESCRIPTION);
    await expect(completeRow.getByTestId('execution-row-status-badge')).toHaveText('DONE');
    await expect(completeRow.getByTestId('streaming-bar-layer-widget')).not.toBeVisible();
  });

  test('EDGE: {work item scoped to a sub-agent file with no parent Task tool-use line anywhere in the replayed session} => no SUBAGENT_CHAIN and no subagent-chain-duration render at all, though the sub-agent text itself still does', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration No Start Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    // No main session file at all — only the sub-agent's own JSONL, with no Task tool-use line
    // anywhere in it. Pairing the work item's sessionId with an agentId scopes replay to ONLY
    // `<sessionId>/subagents/agent-<agentId>.jsonl` (chat-history-replay-broker skips the main
    // session file entirely once filterAgentId is set), so this is the nearest REAL condition to
    // "a chain with no Task tool-use entry" the browser can actually reach — see
    // collect-subagent-chains-transformer.ts:137, which always stamps taskToolUse on any chain it
    // builds, so no browser-reachable chain ever carries a null one.
    sessions.createSubagentTailOnly({
      sessionId: NO_START_SESSION_ID,
      agentId: NO_START_AGENT_ID,
      assistantText: NO_START_BODY_TEXT,
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration No Start Quest',
      userRequest: 'Build the feature',
    });
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'in_progress',
      operations: [
        { id: NO_START_OP, role: 'codeweaver', text: NO_START_TEXT, status: 'in_progress' },
      ],
      workItems: [
        {
          id: NO_START_WI,
          role: 'codeweaver',
          status: 'in_progress',
          sessionId: NO_START_SESSION_ID,
          agentId: NO_START_AGENT_ID,
          relatedDataItems: [`operations/${NO_START_OP}`],
        },
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // No explicit replay trigger — see the comment on the first test in this file.
    const noStartRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: NO_START_TEXT });

    // The row's entries did arrive and render (this is a measurement, not an empty row).
    await expect(noStartRow.getByText(NO_START_BODY_TEXT)).toBeVisible({ timeout: CHAIN_TIMEOUT });

    // …:observable:check-no-start-no-element — reported as a measurement per the map's own
    // instruction: no chain renders at all, because collectSubagentChainsTransformer never builds
    // one from a transcript that carries no Task tool-use line.
    await expect(noStartRow.getByTestId('SUBAGENT_CHAIN')).toHaveCount(0);
    await expect(noStartRow.getByTestId('subagent-chain-duration')).toHaveCount(0);
  });
});
