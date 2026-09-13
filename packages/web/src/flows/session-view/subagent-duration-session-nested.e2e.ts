import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';

import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { subagentDurationHarness } from '../../../test/harnesses/subagent-duration/subagent-duration.harness';

const GUILD_PATH = '/tmp/dm-e2e-subagent-duration-session-nested';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 10_000;

const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: subagentDuration, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Session transcript sub-agent chain duration: flat chain vs. a chain nested inside another', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {one flat sub-agent chain, notification reports durationMs 270000} => renders exactly one SUBAGENT_CHAIN_HEADER and one subagent-chain-duration reading 4m', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Subagent Duration Session Flat Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const sessionId = 'e2e-subagent-duration-session-flat-001';
    const TASK_DESCRIPTION = 'Session flat chain does the sub-agent work';

    subagentDuration.seedChain({
      sessionId,
      agentId: 'sessionflatagent',
      taskToolUseId: 'toolu_session_flat_001',
      taskDescription: TASK_DESCRIPTION,
      taskToolUseAt: '2026-01-01T11:56:00.000Z',
      notification: { at: '2026-01-01T11:56:45.000Z', durationMs: 270_000 },
    });

    await page.goto(`/${guildId}/session/${sessionId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    const chainHeader = page.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainHeader).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(chainHeader).toContainText(TASK_DESCRIPTION, { timeout: CHAT_TIMEOUT });
    // Exactly one chain in a flat transcript: the "each inner chain" branch that would produce a
    // second, nested header never fires here — that value belongs to the next test.
    await expect(chainHeader).toHaveCount(1);

    const durationLabel = page.getByTestId('subagent-chain-duration');

    await expect(durationLabel).toHaveCount(1);
    await expect(durationLabel).toHaveText('4m');
  });

  test('VALID: {one outer chain with one chain nested inside it, both notified with different band strings} => the nested chain renders INSIDE the outer chain box and each carries its own duration figure', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Subagent Duration Session Nested Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const sessionId = 'e2e-subagent-duration-session-nested-001';
    const OUTER_DESCRIPTION = 'Outer chain holds the nested inner chain';
    const INNER_DESCRIPTION = 'Inner chain nests below the outer header';

    // outerTaskToolUseAt strictly precedes innerTaskToolUseAt — collectSubagentChainsTransformer
    // splices the nested chain in at the position of the Task that launched it, which only exists
    // once the outer chain itself does (see seedNestedChain's own header comment).
    subagentDuration.seedNestedChain({
      sessionId,
      outerAgentId: 'sessionnested1outer',
      outerToolUseId: 'toolu_session_nested_outer',
      outerDescription: OUTER_DESCRIPTION,
      outerTaskToolUseAt: '2026-01-01T11:56:00.000Z',
      outerNotification: { at: '2026-01-01T13:09:00.000Z', durationMs: 4_380_000 }, // 1h13m
      innerAgentId: 'sessionnested2inner',
      innerToolUseId: 'toolu_session_nested_inner',
      innerDescription: INNER_DESCRIPTION,
      innerTaskToolUseAt: '2026-01-01T11:59:00.000Z',
      innerNotification: { at: '2026-01-01T12:03:30.000Z', durationMs: 270_000 }, // 4m
    });

    await page.goto(`/${guildId}/session/${sessionId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    const outerHeaderAnywhere = page
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: OUTER_DESCRIPTION })
      .first();

    await expect(outerHeaderAnywhere).toBeVisible({ timeout: CHAT_TIMEOUT });

    // The outer chain is the first SUBAGENT_CHAIN in document order (it wraps the inner one), so
    // its own box is the scope that proves "each inner chain" spliced the nested chain INSIDE it
    // rather than beside it as a top-level sibling.
    const outerChainScope = page.getByTestId('SUBAGENT_CHAIN').first();

    await expect(outerChainScope.getByTestId('SUBAGENT_CHAIN_HEADER')).toHaveCount(2);
    await expect(outerChainScope).toContainText(INNER_DESCRIPTION);

    const outerHeader = outerChainScope
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: OUTER_DESCRIPTION })
      .first();
    const innerHeader = outerChainScope
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: INNER_DESCRIPTION })
      .first();

    await expect(innerHeader).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Two duration elements on the whole page, one figure per chain — a copy-the-outer-figure bug
    // would put '1h13m' on both, so each is read scoped to its own header.
    await expect(page.getByTestId('subagent-chain-duration')).toHaveCount(2);
    await expect(outerHeader.getByTestId('subagent-chain-duration')).toHaveText('1h13m');
    await expect(innerHeader.getByTestId('subagent-chain-duration')).toHaveText('4m');
  });
});
