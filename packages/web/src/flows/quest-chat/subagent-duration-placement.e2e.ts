import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { elapsedDurationHarness } from '../../../test/harnesses/elapsed-duration/elapsed-duration.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { subagentDurationHarness } from '../../../test/harnesses/subagent-duration/subagent-duration.harness';
import { subagentDurationPlacementHarness } from '../../../test/harnesses/subagent-duration-placement/subagent-duration-placement.harness';

const GUILD_PATH = '/tmp/dm-e2e-subagent-duration-placement';
const PANEL_TIMEOUT = 10_000;
const CHAIN_TIMEOUT = 10_000;
const CHAIN_DESCRIPTION = 'Sub-agent duration placement work';

// Mirrors subagent-duration-row-status-gate.e2e.ts: T-270000 ms is what elapsedPartsTransformer
// floors to `4m` — never `4m30s`, never rounded up to `5m`. Neither unit below asserts WHAT the
// figure reads, only WHERE and HOW it paints, but a real value (rather than an edge-case zero) is
// what keeps the fixture identical to every other spec proving this same chain.
const FIXED_NOW = '2026-01-01T12:00:00.000Z';
const TASK_TOOL_USE_AT = '2026-01-01T11:55:30.000Z';

// Each test gets its OWN session/agent/tool-use/work-item ids — sharing one set across two tests
// in the same file let the second test's replay and the first test's leftover watcher state
// collide on the same on-disk session path, which is what a "same fixture, different quest" setup
// actually needs distinct ids for.
const PLACEMENT_WI = 'e2e00000-0000-4000-8000-0000d7000001';
const PLACEMENT_SESSION_ID = 'e2e-subagent-duration-placement-001';
const PLACEMENT_AGENT_ID = 'e2esubagentdurationplacement001';
const PLACEMENT_TOOL_USE_ID = 'toolu_subagent_duration_placement_001';

const STYLE_WI = 'e2e00000-0000-4000-8000-0000d7000002';
const STYLE_SESSION_ID = 'e2e-subagent-duration-style-001';
const STYLE_AGENT_ID = 'e2esubagentdurationstyle001';
const STYLE_TOOL_USE_ID = 'toolu_subagent_duration_style_001';

const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: subagentDuration, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('The subagent-chain duration figure is placed and styled like execution-row-duration', () => {
  test.describe.configure({ timeout: 30_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {a running chain inside an in_progress row} => subagent-chain-duration renders once inside SUBAGENT_CHAIN_HEADER, after the description text, and never inside the chain body', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const placement = subagentDurationPlacementHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Placement Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    subagentDuration.seedChain({
      sessionId: PLACEMENT_SESSION_ID,
      agentId: PLACEMENT_AGENT_ID,
      taskToolUseId: PLACEMENT_TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: TASK_TOOL_USE_AT,
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Placement Quest',
      userRequest: 'Build the feature',
    });
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'in_progress',
      workItems: [
        {
          id: PLACEMENT_WI,
          role: 'codeweaver',
          status: 'in_progress',
          sessionId: PLACEMENT_SESSION_ID,
        },
      ],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const chain = executionPanel.getByTestId('SUBAGENT_CHAIN');
    const chainHeader = executionPanel.getByTestId('SUBAGENT_CHAIN_HEADER');
    await expect(chainHeader).toBeVisible({ timeout: CHAIN_TIMEOUT });

    // (1) inside the header — exactly one copy.
    await expect(chainHeader.getByTestId('subagent-chain-duration')).toHaveCount(1);

    // (3) never among the entries: the WHOLE chain (header plus its expanded body) carries the
    // same single copy the header alone does, so nothing renders in the body between them.
    await expect(chain.getByTestId('subagent-chain-duration')).toHaveCount(1);

    // (2) after the description — real geometry, only trustworthy in a focused, painted tab.
    await page.bringToFront();
    await page.screenshot();
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible');
    expect(await placement.durationSitsAfterDescription()).toBe(true);
  });

  test('VALID: {a running chain sharing its row with execution-row-duration} => subagent-chain-duration renders in monospace at font size 9 in colour text-dim, matching execution-row-duration exactly', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });
    const placement = subagentDurationPlacementHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Styling Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    subagentDuration.seedChain({
      sessionId: STYLE_SESSION_ID,
      agentId: STYLE_AGENT_ID,
      taskToolUseId: STYLE_TOOL_USE_ID,
      taskDescription: CHAIN_DESCRIPTION,
      taskToolUseAt: TASK_TOOL_USE_AT,
    });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Subagent Duration Styling Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = String(created.filePath);
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath,
      status: 'in_progress',
      workItems: [
        {
          id: STYLE_WI,
          role: 'codeweaver',
          status: 'in_progress',
          sessionId: STYLE_SESSION_ID,
        },
      ],
    });

    // execution-row-duration only renders with a startedAt AND an honest end point — here, `now`
    // while the row is in_progress.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: STYLE_WI, startedAt: TASK_TOOL_USE_AT }],
    });

    await page.clock.setFixedTime(FIXED_NOW);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(executionPanel.getByTestId('subagent-chain-duration')).toBeVisible({
      timeout: CHAIN_TIMEOUT,
    });
    await expect(executionPanel.getByTestId('execution-row-duration')).toBeVisible({
      timeout: CHAIN_TIMEOUT,
    });

    await page.bringToFront();
    await page.screenshot();
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible');

    const chainStyle = await placement.readDurationStyle({ testId: 'subagent-chain-duration' });
    expect({
      fontSize: chainStyle.fontSize,
      color: chainStyle.color,
      fontFamilyIsMonospace: chainStyle.fontFamilyIsMonospace,
    }).toStrictEqual({ fontSize: '9px', color: 'rgb(138, 114, 96)', fontFamilyIsMonospace: true });

    // "Matching execution-row-duration" is the other half of the claim: read the SAME three
    // properties off the row's own figure and assert the two triples are equal — a fixed-literal
    // check alone never proves the two could not drift apart from each other.
    const rowStyle = await placement.readDurationStyle({ testId: 'execution-row-duration' });
    expect(rowStyle).toStrictEqual(chainStyle);
  });
});
