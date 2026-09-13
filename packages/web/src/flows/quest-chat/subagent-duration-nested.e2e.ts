import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { elapsedDurationHarness } from '../../../test/harnesses/elapsed-duration/elapsed-duration.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { subagentDurationHarness } from '../../../test/harnesses/subagent-duration/subagent-duration.harness';
import { elapsedDisplayConfigStatics } from '../../statics/elapsed-display-config/elapsed-display-config-statics';

const GUILD_PATH = '/tmp/dm-e2e-subagent-duration-nested';
const PANEL_TIMEOUT = 10_000;
const TICK_MS = elapsedDisplayConfigStatics.refresh.tickMs;

// Every case installs the browser's FULL fake clock at this exact instant before page.goto, then
// seeds each chain's Task tool-use timestamp relative to it — mirroring
// elapsed-duration-tick.e2e.ts, whose own header explains why setFixedTime alone would not let
// fastForward fire the panel's shared setInterval callback.
const FIXED_NOW = '2026-01-01T12:00:00.000Z';

const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: subagentDuration, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Nested sub-agent chain duration: an inner chain computes its own figure', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {one outer chain with one chain nested inside it, neither notified} => renders exactly two subagent-chain-duration elements, the inner one inside the outer chain box', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Nested Count Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const RUNNING_OP = '00000000-0000-4000-8000-0000d1000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000d1000001';
    const RUNNING_TEXT = 'codeweaver: nested count row with outer and inner chains';
    const sessionId = 'e2e-subagent-duration-nested-count-001';
    const OUTER_DESCRIPTION = 'Outer chain does the top-level work';
    const INNER_DESCRIPTION = 'Inner chain does the nested work';

    const created = await quests.createQuest({
      guildId,
      title: 'Subagent Duration Nested Count Quest',
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
          sessionId,
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
      ],
    });

    // Agent ids are named so the outer's own subagent file sorts alphabetically BEFORE the
    // inner's: the outer file carries the inner's own Task tool-use line, and that line and the
    // inner's own body stub share the identical seeded timestamp, so whichever file the replay's
    // directory read visits first decides which one is treated as arriving "first" at the tie.
    // Reading the outer file first is what lets the inner's own Task line consume its bucket
    // before the main loop reaches the inner file's body entry — the arrangement every OTHER
    // passing chain fixture in this codebase gets by staggering timestamps instead, which this
    // harness's fixed same-timestamp stub does not allow.
    subagentDuration.seedNestedChain({
      sessionId,
      outerAgentId: 'nestedcount1outer',
      outerToolUseId: 'toolu_nested_count_outer',
      outerDescription: OUTER_DESCRIPTION,
      outerTaskToolUseAt: '2026-01-01T11:56:00.000Z',
      innerAgentId: 'nestedcount2inner',
      innerToolUseId: 'toolu_nested_count_inner',
      innerDescription: INNER_DESCRIPTION,
      innerTaskToolUseAt: '2026-01-01T11:59:30.000Z',
    });

    await page.clock.install({ time: FIXED_NOW });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });

    const outerHeader = row
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: OUTER_DESCRIPTION })
      .first();
    await expect(outerHeader).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The `has:` locator is built from `page`, never from `row` — `row` is an ANCESTOR of each
    // SUBAGENT_CHAIN candidate here, and Playwright's containment check needs the has-locator's
    // own selector to resolve as a DESCENDANT of the candidate. A has-locator carrying `row`'s own
    // ancestor chain can never match (an ancestor is not a descendant of its own child), which is
    // why this exact shape silently resolved to zero elements until traced with a diagnostic count.
    const outerChain = row
      .getByTestId('SUBAGENT_CHAIN')
      .filter({
        has: page.getByTestId('SUBAGENT_CHAIN_HEADER').filter({ hasText: OUTER_DESCRIPTION }),
      })
      .first();
    const innerHeader = outerChain
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: INNER_DESCRIPTION })
      .first();
    await expect(innerHeader).toBeVisible({ timeout: PANEL_TIMEOUT });

    await expect(row.getByTestId('subagent-chain-duration')).toHaveCount(2);
    // The inner one resolves INSIDE the outer chain's own box, not as a second top-level chain.
    await expect(innerHeader.getByTestId('subagent-chain-duration')).toHaveCount(1);
  });

  test('VALID: {inner chain notification arrived, outer chain still running} => inner reads a fixed duration while outer climbs on tick', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const elapsed = elapsedDurationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Nested Independent Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const RUNNING_OP = '00000000-0000-4000-8000-0000d2000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000d2000001';
    const RUNNING_TEXT = 'codeweaver: nested independent row outer live inner frozen';
    const sessionId = 'e2e-subagent-duration-nested-independent-001';
    const OUTER_DESCRIPTION = 'Outer chain still running toward now';
    const INNER_DESCRIPTION = 'Inner chain already reported complete';

    const created = await quests.createQuest({
      guildId,
      title: 'Subagent Duration Nested Independent Quest',
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
          sessionId,
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
      ],
    });

    // A startedAt on the hosting row is what flips hasRunningWorkItem so the panel's shared
    // interval is actually enabled — without it `now` still reads once at mount but never ticks.
    elapsed.stampWorkItems({
      questFilePath,
      items: [{ id: RUNNING_WI, startedAt: '2026-01-01T11:56:00.000Z' }],
    });

    // Agent ids named so the outer's own subagent file sorts alphabetically before the inner's —
    // see the comment on the first test's seedNestedChain call for why the tie forces this.
    subagentDuration.seedNestedChain({
      sessionId,
      outerAgentId: 'nestedindependent1outer',
      outerToolUseId: 'toolu_nested_independent_outer',
      outerDescription: OUTER_DESCRIPTION,
      outerTaskToolUseAt: '2026-01-01T11:59:00.000Z', // FIXED_NOW - 60000ms => 1m live
      innerAgentId: 'nestedindependent2inner',
      innerToolUseId: 'toolu_nested_independent_inner',
      innerDescription: INNER_DESCRIPTION,
      innerTaskToolUseAt: '2026-01-01T11:59:01.000Z',
      innerNotification: { at: '2026-01-01T11:59:02.000Z', durationMs: 4_380_000 }, // 1h13m
    });

    await page.clock.install({ time: FIXED_NOW });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });

    const outerHeader = row
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: OUTER_DESCRIPTION })
      .first();
    await expect(outerHeader).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The `has:` locator is built from `page`, never from `row` — `row` is an ANCESTOR of each
    // SUBAGENT_CHAIN candidate here, and Playwright's containment check needs the has-locator's
    // own selector to resolve as a DESCENDANT of the candidate. A has-locator carrying `row`'s own
    // ancestor chain can never match (an ancestor is not a descendant of its own child), which is
    // why this exact shape silently resolved to zero elements until traced with a diagnostic count.
    const outerChain = row
      .getByTestId('SUBAGENT_CHAIN')
      .filter({
        has: page.getByTestId('SUBAGENT_CHAIN_HEADER').filter({ hasText: OUTER_DESCRIPTION }),
      })
      .first();
    const innerHeader = outerChain
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: INNER_DESCRIPTION })
      .first();
    await expect(innerHeader).toBeVisible({ timeout: PANEL_TIMEOUT });

    await expect(innerHeader.getByTestId('subagent-chain-duration')).toHaveText('1h13m');
    await expect(outerHeader.getByTestId('subagent-chain-duration')).toHaveText('1m');

    await page.clock.fastForward(TICK_MS);

    // The inner figure is the negative beside the outer's positive: without it, a frozen figure
    // and one that simply never ticked would read alike.
    await expect(innerHeader.getByTestId('subagent-chain-duration')).toHaveText('1h13m');
    await expect(outerHeader.getByTestId('subagent-chain-duration')).toHaveText('2m');
  });

  test('VALID: {outer chain has its own Task timestamp, inner chain already notified} => the outer chain header reads its own figure, never the inner chain’s', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Nested Has Start Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const RUNNING_OP = '00000000-0000-4000-8000-0000d3000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000d3000001';
    const RUNNING_TEXT = 'codeweaver: nested has-start row scoped to the outer header only';
    const sessionId = 'e2e-subagent-duration-nested-has-start-001';
    const OUTER_DESCRIPTION = 'Outer chain owns its own timestamp';
    const INNER_DESCRIPTION = 'Inner chain reported its own completion';

    const created = await quests.createQuest({
      guildId,
      title: 'Subagent Duration Nested Has Start Quest',
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
          sessionId,
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
      ],
    });

    // Agent ids named so the outer's own subagent file sorts alphabetically before the inner's —
    // see the comment on the first test's seedNestedChain call for why the tie forces this.
    subagentDuration.seedNestedChain({
      sessionId,
      outerAgentId: 'nestedhasstart1outer',
      outerToolUseId: 'toolu_nested_has_start_outer',
      outerDescription: OUTER_DESCRIPTION,
      outerTaskToolUseAt: '2026-01-01T11:59:00.000Z', // FIXED_NOW - 60000ms => 1m
      innerAgentId: 'nestedhasstart2inner',
      innerToolUseId: 'toolu_nested_has_start_inner',
      innerDescription: INNER_DESCRIPTION,
      innerTaskToolUseAt: '2026-01-01T11:59:01.000Z',
      innerNotification: { at: '2026-01-01T11:59:02.000Z', durationMs: 4_380_000 }, // 1h13m
    });

    await page.clock.install({ time: FIXED_NOW });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });

    // Scoped to the outer chain's OWN header and nothing below it: the inner chain's duration
    // element lives inside the header's sibling body box, so it structurally cannot satisfy this
    // locator.
    const outerHeader = row
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: OUTER_DESCRIPTION })
      .first();
    await expect(outerHeader).toBeVisible({ timeout: PANEL_TIMEOUT });

    await expect(outerHeader.getByTestId('subagent-chain-duration')).toHaveText('1m');
  });

  test('VALID: {inner chain notification arrived} => the inner chain, located inside the outer chain box, carries its own figure', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Subagent Duration Nested Chain-To-Nested Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const RUNNING_OP = '00000000-0000-4000-8000-0000d4000001';
    const RUNNING_WI = 'e2e00000-0000-4000-8000-0000d4000001';
    const RUNNING_TEXT = 'codeweaver: nested chain-to-nested row asserting the inner own figure';
    const sessionId = 'e2e-subagent-duration-nested-chain-to-nested-001';
    const OUTER_DESCRIPTION = 'Outer chain frames the nested one';
    const INNER_DESCRIPTION = 'Inner chain nests with its own reported figure';

    const created = await quests.createQuest({
      guildId,
      title: 'Subagent Duration Nested Chain-To-Nested Quest',
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
          sessionId,
          relatedDataItems: [`operations/${RUNNING_OP}`],
        },
      ],
    });

    // Agent ids named so the outer's own subagent file sorts alphabetically before the inner's —
    // see the comment on the first test's seedNestedChain call for why the tie forces this.
    subagentDuration.seedNestedChain({
      sessionId,
      outerAgentId: 'nestedchaintonested1outer',
      outerToolUseId: 'toolu_nested_chain_to_nested_outer',
      outerDescription: OUTER_DESCRIPTION,
      outerTaskToolUseAt: '2026-01-01T11:59:00.000Z', // FIXED_NOW - 60000ms => 1m
      innerAgentId: 'nestedchaintonested2inner',
      innerToolUseId: 'toolu_nested_chain_to_nested_inner',
      innerDescription: INNER_DESCRIPTION,
      innerTaskToolUseAt: '2026-01-01T11:59:01.000Z',
      innerNotification: { at: '2026-01-01T11:59:02.000Z', durationMs: 4_380_000 }, // 1h13m
    });

    await page.clock.install({ time: FIXED_NOW });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: RUNNING_TEXT });

    const outerHeader = row
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: OUTER_DESCRIPTION })
      .first();
    await expect(outerHeader).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The `has:` locator is built from `page`, never from `row` — `row` is an ANCESTOR of each
    // SUBAGENT_CHAIN candidate here, and Playwright's containment check needs the has-locator's
    // own selector to resolve as a DESCENDANT of the candidate. A has-locator carrying `row`'s own
    // ancestor chain can never match (an ancestor is not a descendant of its own child), which is
    // why this exact shape silently resolved to zero elements until traced with a diagnostic count.
    const outerChain = row
      .getByTestId('SUBAGENT_CHAIN')
      .filter({
        has: page.getByTestId('SUBAGENT_CHAIN_HEADER').filter({ hasText: OUTER_DESCRIPTION }),
      })
      .first();
    const innerHeader = outerChain
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: INNER_DESCRIPTION })
      .first();
    await expect(innerHeader).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Two elements, two strings: the inner one nested inside the outer's own box carries its own
    // figure, where the outer reads its own, different figure.
    await expect(innerHeader.getByTestId('subagent-chain-duration')).toHaveText('1h13m');
    await expect(outerHeader.getByTestId('subagent-chain-duration')).toHaveText('1m');
  });
});
