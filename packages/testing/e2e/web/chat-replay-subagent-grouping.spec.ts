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

  // The in-flight Task case: the parent JSONL has the assistant Task tool_use line
  // but NO completion user.tool_result yet (the user paused mid-Task). Pass-1a in
  // chat-history-replay-broker only learns realAgentId↔toolUseId from completion
  // lines, so for an in-flight Task the subagent JSONL's lines fall through pass 2
  // tagged with realAgentId (from filename) instead of toolUseId. The web chain
  // grouping keys on toolUseId; without pass-1b the entries would orphan into
  // trailing singletons below the chain header.
  //
  // Pass-1b pairs unpaired Task tool_uses with subagent files via prompt-text
  // equality — Claude CLI passes the prompt string verbatim from Task.input.prompt
  // to the subagent's first user-text line, so the strings are byte-identical.
  // This test asserts the user-visible symptom: with no completion tool_result,
  // the chain header still groups the subagent file's content (positive entry
  // count) AND the prompt body renders as the SUB-AGENT PROMPT row inside the chain.
  test('VALID: {parent JSONL has Agent tool_use but NO completion tool_use_result (in-flight); subagent JSONL first line is the prompt verbatim} => chain renders with positive entry count and the prompt body as the first message inside the chain', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'In-Flight Replay Subagent Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-replay-inflight-001';
    const agentId = 'inflightreplaysub';
    const taskToolUseId = 'toolu_replay_inflight_001';
    const TASK_DESCRIPTION = 'In-flight gap minion';
    const TASK_PROMPT_BODY =
      'Verify the chaoswhisperer-gap-minion observable coverage and report any gaps you find while exploring the spec.';
    const SUBAGENT_MARKER = 'INFLIGHT_REPLAY_INNER_MARKER_xyz';
    const USER_MESSAGE = 'Run the gap minion';

    sessions.createInFlightSubagentSessionFiles({
      sessionId,
      agentId,
      toolUseId: taskToolUseId,
      userMessage: USER_MESSAGE,
      taskDescription: TASK_DESCRIPTION,
      taskPrompt: TASK_PROMPT_BODY,
      subagentText: SUBAGENT_MARKER,
    });

    await page.goto(`/${guildId}/session/${sessionId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    const chainHeader = page.getByTestId('SUBAGENT_CHAIN_HEADER');

    // The header description comes from Task.input.description.
    await expect(chainHeader).toContainText(TASK_DESCRIPTION, { timeout: CHAT_TIMEOUT });
    // "2 entries" = the prompt user-text line + the assistant text line. "0 entries"
    // is the regression signature: it means pass-1b never registered the
    // realAgentId↔toolUseId mapping, the subagent lines kept agentId = realAgentId,
    // and the web's collectSubagentChainsTransformer dropped them out of the chain.
    await expect(chainHeader).toContainText('2 entries', { timeout: CHAT_TIMEOUT });

    const chainScope = page.getByTestId('SUBAGENT_CHAIN');

    // Sub-agent chain default tail-window hides earlier entries (only the latest message
    // anchor + subsequent activity is visible). Click "Show N earlier" to reveal the
    // full inner transcript so the prompt + assistant rows can both be asserted.
    await chainScope.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE').click();

    const messages = chainScope.getByTestId('CHAT_MESSAGE');

    // EXACTLY two CHAT_MESSAGE rows render inside the chain — one for the prompt
    // (rendered from the subagent JSONL's first user-text line, which equals
    // Task.input.prompt verbatim) and one for the subagent's first assistant
    // response. Anything other than 2 means pass-1b mis-paired the file or the
    // entries dropped out of the chain group.
    await expect(messages).toHaveCount(2, { timeout: CHAT_TIMEOUT });

    // Row 0: the prompt row. Both the SUB-AGENT PROMPT label AND the full prompt
    // body text must be inside this specific row — the load-bearing assertion. If
    // the prompt rendered outside the chain instead of inside, this would fail
    // because messages.nth(0) would be the assistant text row, not the prompt.
    const promptRow = messages.nth(0);

    await expect(promptRow).toContainText('SUB-AGENT PROMPT', { timeout: CHAT_TIMEOUT });
    await expect(promptRow).toContainText(TASK_PROMPT_BODY, { timeout: CHAT_TIMEOUT });

    // Row 1: the subagent's assistant text. Label is SUB-AGENT (no PROMPT suffix —
    // that's the user-role label; assistant rows under source='subagent' get the
    // SUB-AGENT label without "PROMPT") and the body is the marker text.
    const assistantRow = messages.nth(1);

    await expect(assistantRow).toContainText('SUB-AGENT', { timeout: CHAT_TIMEOUT });
    await expect(assistantRow).toContainText(SUBAGENT_MARKER, { timeout: CHAT_TIMEOUT });
  });

  // Real-world reproduction shape: a session where the user paused mid-run after
  // some sub-agents had already completed but one was still in flight. The user-
  // reported bug had 2 completed Explore minions + 1 in-flight ChaosWhisperer
  // minion. With the original code, only the completed Tasks paired correctly via
  // pass-1a; the in-flight Task's subagent JSONL fell through pass 2 with
  // agentId = realAgentId and rendered as orphan trailing singletons below the
  // last chain header. Pass-1b's prompt-match scan must pair the in-flight Task
  // without disturbing the already-paired ones.
  test('VALID: {three sub-agents, two completed (pass-1a path) + one in-flight without completion tool_result (pass-1b path)} => all three render as separate chains, each with the prompt body in row 0 and the assistant text in row 1', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Mixed Replay Subagent Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-replay-mixed-001';
    const USER_MESSAGE = 'Run the gap analysis pipeline';

    const subAlpha = {
      agentId: 'alphaagent',
      toolUseId: 'toolu_replay_mixed_alpha',
      taskDescription: 'Alpha completed minion',
      taskPrompt:
        'Find quest status enum and deletable statuses in packages/shared/src/contracts/quest-status.',
      subagentText: 'MIXED_REPLAY_ALPHA_MARKER',
      completed: true,
    };
    const subBeta = {
      agentId: 'betaagent',
      toolUseId: 'toolu_replay_mixed_beta',
      taskDescription: 'Beta completed minion',
      taskPrompt:
        'Explore quest list UI and quest deletion infrastructure in packages/web/src/widgets.',
      subagentText: 'MIXED_REPLAY_BETA_MARKER',
      completed: true,
    };
    const subGamma = {
      agentId: 'gammaagent',
      toolUseId: 'toolu_replay_mixed_gamma',
      taskDescription: 'Gamma in-flight minion',
      taskPrompt: 'Verify chaoswhisperer-gap-minion observable coverage and report gaps you find.',
      subagentText: 'MIXED_REPLAY_GAMMA_MARKER',
      completed: false,
    };

    sessions.createMultiSubagentSessionFiles({
      sessionId,
      userMessage: USER_MESSAGE,
      subagents: [subAlpha, subBeta, subGamma],
    });

    await page.goto(`/${guildId}/session/${sessionId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Three chain headers, one per sub-agent. Anything other than 3 means a
    // sub-agent's entries fell out of any chain group.
    const chainHeaders = page.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainHeaders).toHaveCount(3, { timeout: CHAT_TIMEOUT });

    // Each header carries its description + entry count. Order matches the
    // order the parent fired the Task tool_uses.
    await expect(chainHeaders.nth(0)).toContainText(subAlpha.taskDescription, {
      timeout: CHAT_TIMEOUT,
    });
    await expect(chainHeaders.nth(0)).toContainText('2 entries', { timeout: CHAT_TIMEOUT });
    await expect(chainHeaders.nth(1)).toContainText(subBeta.taskDescription, {
      timeout: CHAT_TIMEOUT,
    });
    await expect(chainHeaders.nth(1)).toContainText('2 entries', { timeout: CHAT_TIMEOUT });
    await expect(chainHeaders.nth(2)).toContainText(subGamma.taskDescription, {
      timeout: CHAT_TIMEOUT,
    });
    await expect(chainHeaders.nth(2)).toContainText('2 entries', { timeout: CHAT_TIMEOUT });

    // Each chain owns its own [data-testid="SUBAGENT_CHAIN"] scope. Inside each,
    // CHAT_MESSAGE row 0 is the prompt (rendered from the subagent JSONL's first
    // user-text line, which equals Task.input.prompt verbatim) and row 1 is the
    // assistant text marker. The load-bearing assertion is that the IN-FLIGHT
    // sub-agent (subGamma, no completion in the parent JSONL) renders identically
    // to the completed ones — same row count, same prompt as row 0, same marker
    // as row 1.
    const chains = page.getByTestId('SUBAGENT_CHAIN');

    await expect(chains).toHaveCount(3, { timeout: CHAT_TIMEOUT });

    const expectChainRows = async (chainIndex: number, sub: typeof subAlpha): Promise<void> => {
      const chain = chains.nth(chainIndex);

      // Sub-agent chain default tail-window hides the prompt row when an assistant message
      // anchor follows it. Click "Show N earlier" to reveal the full inner transcript.
      await chain.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE').click();

      const messages = chain.getByTestId('CHAT_MESSAGE');

      await expect(messages).toHaveCount(2, { timeout: CHAT_TIMEOUT });

      const promptRow = messages.nth(0);

      await expect(promptRow).toContainText('SUB-AGENT PROMPT', { timeout: CHAT_TIMEOUT });
      await expect(promptRow).toContainText(sub.taskPrompt, { timeout: CHAT_TIMEOUT });

      const assistantRow = messages.nth(1);

      await expect(assistantRow).toContainText('SUB-AGENT', { timeout: CHAT_TIMEOUT });
      await expect(assistantRow).toContainText(sub.subagentText, { timeout: CHAT_TIMEOUT });
    };

    await expectChainRows(0, subAlpha);
    await expectChainRows(1, subBeta);
    await expectChainRows(2, subGamma);
  });
});
