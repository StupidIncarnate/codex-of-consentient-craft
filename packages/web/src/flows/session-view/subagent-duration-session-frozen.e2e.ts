import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';

import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { subagentDurationHarness } from '../../../test/harnesses/subagent-duration/subagent-duration.harness';

const GUILD_PATH = '/tmp/dm-e2e-subagent-duration-session-frozen';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 10_000;
// Irrelevant to the figure itself — a landed `reportedDurationMs` wins precedence over
// `clockReading` regardless of wall-clock time — but a full `install` (never `setFixedTime`) is
// what lets `page.clock.fastForward` below fire anything at all, and it must run before `goto`.
const FIXED_NOW = '2026-09-10T02:05:00.000Z';
const ONE_HOUR_MS = 3_600_000;

const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: subagentDuration, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('A finished sub-agent chain in a session transcript freezes on its notification duration', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {session transcript holds a Task tool-use chain whose completion notification reports durationMs 270000 across a 45s timestamp gap} => subagent-chain-duration reads 4m on first render, after a one-hour clock fast-forward, and after a collapse/re-expand cycle, with the chain intact', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Subagent Duration Session Frozen Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const SESSION_ID = 'e2e-subagent-duration-session-frozen-001';
    const AGENT_ID = 'sessionfrozenagent001';
    const TASK_TOOL_USE_ID = 'toolu_session_frozen_001';
    const TASK_DESCRIPTION = 'Session frozen sub-agent work';
    // seedChain's writeSubagentStub always writes this exact text into the subagent JSONL body.
    const SUBAGENT_MARKER = 'Sub-agent work body';

    // gap 45s lands in band `<1m`; reportedDurationMs 270000 lands in band `4m` — the two
    // precedence sources land in DIFFERENT bands, so a figure reading `<1m` proves the gap won
    // instead of the report (subagent-chain-widget.test.tsx:1683 pins 270000ms => '4m').
    subagentDuration.seedChain({
      sessionId: SESSION_ID,
      agentId: AGENT_ID,
      taskToolUseId: TASK_TOOL_USE_ID,
      taskDescription: TASK_DESCRIPTION,
      taskToolUseAt: '2026-09-10T02:00:00.000Z',
      notification: { at: '2026-09-10T02:00:45.000Z', durationMs: 270_000 },
    });

    await page.clock.install({ time: FIXED_NOW });

    await page.goto(`/${guildId}/session/${SESSION_ID}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // …:observable:check-session-chain-renders — the Task tool_use line reached
    // collectSubagentChainsTransformer and produced a chain to hang a duration on.
    const chainScope = page.getByTestId('SUBAGENT_CHAIN');
    const chainHeader = page.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainScope).toHaveCount(1);
    await expect(chainHeader).toContainText(TASK_DESCRIPTION, { timeout: CHAT_TIMEOUT });

    // …:observable:check-session-finished-figure, …:branch:session-notification-yes, and reading
    // (1) of …:terminal:session-frozen-duration all read this same first render.
    const duration = page.getByTestId('subagent-chain-duration');

    await expect(duration).toHaveCount(1);
    await expect(duration).toHaveText('4m', { timeout: CHAT_TIMEOUT });

    // Reading (2): a full hour advances on the installed fake clock. The session-view chat panel
    // threads no `now` into SubagentChainWidget (ChatPanelWidget passes none), so there is no
    // `clockReading` candidate to move even if reportedDurationMs did not already win precedence —
    // this is what "frozen" means for this route.
    await page.clock.fastForward(ONE_HOUR_MS);
    await expect(duration).toHaveText('4m');

    // Reading (3): collapse then re-expand forces React to re-render the header at the new clock
    // time. Load-bearing — with no re-render, a live figure and a frozen one read identically.
    await chainHeader.click();
    await chainHeader.click();
    await expect(duration).toHaveText('4m');

    // Side-effect half of the terminal: the re-render did not cost the chain its identity or body.
    await expect(chainScope).toHaveCount(1);
    await expect(chainScope.getByText(SUBAGENT_MARKER).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
  });
});
