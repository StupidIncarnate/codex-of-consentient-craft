import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';

import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-replay-subagent';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 10_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Replay sub-agent grouping (file-sourced: main JSONL + subagent JSONL on disk)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  // The ONLY difference between this test and chat-streaming-subagent-grouping.spec.ts is
  // the SOURCE of the sub-agent correlation: this one pre-seeds the JSONL files on disk
  // and navigates directly to the session URL (triggering chat-history-replay-broker),
  // whereas the streaming variant feeds lines through stdout. The rendered chain MUST be
  // identical in both cases — if this test passes but streaming breaks (or vice versa),
  // the "single funnel" invariant has drifted and whichever broker feeds the processor
  // isn't producing the same wire shape as the other. See packages/orchestrator/CLAUDE.md
  // for the two-source convergence contract.
  test('VALID: {main JSONL has Agent tool_use + completion tool_use_result.agentId; subagent JSONL has sub-agent activity} => sub-agent chain groups its sub-agent file entries under the Task chain header on session reload', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Replay Subagent Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-replay-sub-001';
    const agentId = 'replaysubagentb';
    const taskToolUseId = 'toolu_replay_task_001';
    const SUBAGENT_MARKER = 'REPLAY_SUBAGENT_INNER_MARKER_xyz';
    const USER_MESSAGE = 'Describe a package';

    // Pre-seed main session JSONL + subagent JSONL on disk — exactly what Claude CLI
    // would have left behind after a completed session. The main JSONL carries the Task
    // tool_use line and the completion user tool_result (with tool_use_result.agentId
    // linking to the real internal id). The subagent file is keyed by that real id and
    // contains the sub-agent's own stream.
    sessions.createSubagentSessionFiles({
      sessionId,
      agentId,
      toolUseId: taskToolUseId,
      userMessage: USER_MESSAGE,
      mainAssistantText: 'Sub-agent finished. Summary follows.',
      subagentText: SUBAGENT_MARKER,
    });

    // Navigate to the existing session URL — this triggers chat-history-replay-broker,
    // which is the file-source path that must produce the same wire shape as streaming.
    await page.goto(`/${guildId}/session/${sessionId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // The chain header must render with the description from the Task tool_use input
    // and a positive entry count — "(0 entries)" means the translation failed and the
    // sub-agent file's lines are orphaned from the chain (the exact regression this test
    // guards against).
    //
    // PARITY: keep the chain-header assertion shape in sync with
    // chat-streaming-subagent-grouping.spec.ts — description visible, positive entry
    // count, marker scoped to the chain body. If one spec asserts something the other
    // doesn't, the two-source convergence invariant is not symmetrically tested.
    const chainHeader = page.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainHeader).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(chainHeader).toContainText('Sub-agent work', { timeout: CHAT_TIMEOUT });
    // "1 entries" (not "0 entries") is the load-bearing assertion: a positive count
    // proves the sub-agent JSONL line was translated + grouped under the Task chain
    // via the realAgentId → toolUseId reverse map. "0 entries" is the exact regression
    // signature of two-source convergence drift — a Task entry keyed on toolUseId but
    // sub-agent entries keyed on realAgentId, and the two never matching.
    await expect(chainHeader).toContainText('1 entries', { timeout: CHAT_TIMEOUT });

    // The sub-agent chain renders expanded on mount, so the marker text nested inside it
    // must be visible immediately — confirming the sub-agent JSONL was correctly grouped
    // under the Task header rather than appearing as a top-level sibling. The entry count
    // + scoped marker together prove grouping works; we don't additionally assert the
    // marker isn't also a top-level sibling (that would need `.not.toBeVisible`, which is
    // banned by `ban-negated-matchers`), because entryCount === 1 already implies it's
    // consumed by the chain and not rendered elsewhere.
    const chainScope = page.getByTestId('SUBAGENT_CHAIN');

    await expect(chainScope.getByText(SUBAGENT_MARKER).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
  });
});
