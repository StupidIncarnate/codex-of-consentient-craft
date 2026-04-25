import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-unified-pipeline';
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const CHAT_TIMEOUT = 5_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Unified JSONL Pipeline', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('EDGE: chat entries reload via WS replay after navigating away and back', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Replay Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ text: 'Replayed via WebSocket' }),
    });

    // Track HTTP requests to verify no /chat/history calls
    const httpChatHistoryRequests: URL[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/chat/history')) {
        httpChatHistoryRequests.push(new URL(String(req.url())));
      }
    });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Test replay');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByText('Replayed via WebSocket')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Wait for URL to update with session ID
    await page.waitForURL(/\/session\//u, { timeout: CHAT_TIMEOUT });
    const sessionUrl = page.url();

    // Navigate away
    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Navigate back to the session URL
    await page.goto(sessionUrl);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Response should reappear via WS replay
    await expect(page.getByText('Replayed via WebSocket')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // No HTTP calls to the old /chat/history endpoint
    expect(httpChatHistoryRequests).toHaveLength(0);
  });

  test('EDGE: page refresh replays assistant response via WS history', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Refresh Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ text: 'Persistent after refresh' }),
    });

    // Track requests to confirm replay goes through WS, not HTTP
    const httpChatHistoryRequests: URL[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/chat/history')) {
        httpChatHistoryRequests.push(new URL(String(req.url())));
      }
    });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Trigger streaming');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByText('Persistent after refresh')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Wait for session URL
    await page.waitForURL(/\/session\//u, { timeout: CHAT_TIMEOUT });

    // Hard refresh
    await page.reload();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Assistant response should persist via WS replay (chat-history-complete fires)
    await expect(page.getByText('Persistent after refresh')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Replay went through WS, not the old HTTP endpoint
    expect(httpChatHistoryRequests).toHaveLength(0);
  });

  test('VALID: live streaming entries arrive via unified processor', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Stream Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ text: 'Streamed through processor' }),
    });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Stream test message');
    await page.getByTestId('SEND_BUTTON').click();

    // User message renders in the chat panel (confirms user entries go through processor)
    const chatPanel = page.getByTestId('CHAT_PANEL');

    await expect(chatPanel.getByText('Stream test message')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Assistant response renders (confirms chat-output WS events deliver streamed entries)
    await expect(chatPanel.getByText('Streamed through processor')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
  });

  test('VALID: sub-agent entries appear in replayed session history', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Subagent Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    const sessionId = 'e2e-subagent-session-001';
    const agentId = 'e2e-subagent-agent-001';
    const toolUseId = 'toolu_e2e_subagent_001';

    sessions.createSubagentSessionFiles({
      sessionId,
      agentId,
      toolUseId,
      userMessage: 'Spawn a sub-agent',
      mainAssistantText: 'Main agent follow-up text',
      subagentText: 'Sub-agent output text',
    });

    // Navigate directly to the session to trigger WS replay
    await page.goto(`/${guildId}/session/${sessionId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Main assistant text should appear
    await expect(page.getByText('Main agent follow-up text')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Sub-agent chain header should appear (the chain renders expanded on mount)
    await expect(page.getByTestId('SUBAGENT_CHAIN_HEADER')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Sub-agent text is rendered inside the expanded chain on mount — no click needed
    await expect(page.getByText('Sub-agent output text')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('VALID: sub-agent internal tool_use + tool_result pair inside the chain on replay', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Subagent Internal Tool Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    const sessionId = 'e2e-subagent-internal-001';
    const agentId = 'e2e-subagent-agent-internal';
    const taskToolUseId = 'toolu_e2e_task_internal_001';
    const internalToolUseId = 'toolu_e2e_internal_read_001';

    sessions.createSubagentSessionWithInternalTool({
      sessionId,
      agentId,
      taskToolUseId,
      internalToolUseId,
      userMessage: 'Spawn sub-agent that runs internal tools',
      taskDescription: 'Internal-tool sub-agent',
      subagentToolName: 'Read',
      subagentToolInput: { file_path: '/some/file.ts' },
      subagentToolResult: 'SUBAGENT_READ_RESULT_MARKER_xyz',
    });

    await page.goto(`/${guildId}/session/${sessionId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Sub-agent chain header should appear (the chain renders expanded on mount).
    await expect(page.getByTestId('SUBAGENT_CHAIN_HEADER')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Assertion 1 — chain must claim BOTH the tool_use AND its tool_result (2 entries).
    // Catches bug #1: chat-line-process-transformer dropping agentId on subagent user
    // entries. Before that fix, tool_result leaked out of the chain and entryCount was 1.
    await expect(page.getByText('(2 entries)')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Assertion 2 — while the paired TOOL_ROW is still collapsed (TOOL_ROW_HEADER not
    // yet clicked), the inner result marker has not been rendered into the DOM. The
    // chain itself renders expanded on mount, but its paired tool_use/tool_result row
    // is a TOOL_ROW whose TOOL_ROW_RESULT body only mounts after its header is clicked.
    await expect(page.getByText('SUBAGENT_READ_RESULT_MARKER_xyz')).toHaveCount(0);

    const chainScope = page.getByTestId('SUBAGENT_CHAIN');

    // Assertion 3 — inside the expanded chain, the tool_use and tool_result must be
    // PAIRED into a single TOOL_ROW widget, not rendered as two separate items.
    // Catches bug #2: SubagentChainWidget rendered innerGroups without mergeToolEntries,
    // which left tool_use with no paired toolResult prop and tool_result as a standalone
    // "TOOL RESULT" CHAT_MESSAGE box inside the chain.
    await expect(chainScope.getByTestId('TOOL_ROW')).toHaveCount(1);
    await expect(chainScope.getByText('TOOL RESULT', { exact: true })).toHaveCount(0);

    // Assertion 4 — expanding the paired tool row reveals the result inline (not as a
    // separate CHAT_MESSAGE). The TOOL_ROW_RESULT container only renders when a tool_use
    // received its paired toolResult prop.
    await chainScope.getByTestId('TOOL_ROW_HEADER').click();

    await expect(chainScope.getByTestId('TOOL_ROW_RESULT')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
    await expect(
      chainScope.getByTestId('TOOL_ROW_RESULT').getByText('SUBAGENT_READ_RESULT_MARKER_xyz'),
    ).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('VALID: background-agent task-notification renders as TASK REPORT inside its chain, not a raw YOU box', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Background Agent Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    const sessionId = 'e2e-bg-agent-001';
    const agentId = 'e2e-bg-agent-corr-001';
    const taskToolUseId = 'toolu_e2e_bg_task_001';

    sessions.createBackgroundAgentSession({
      sessionId,
      agentId,
      taskToolUseId,
      userMessage: 'Launch a background agent',
      taskDescription: 'E2E background agent test',
      notificationSummary: 'Agent "E2E background agent test" completed',
      notificationResult: 'BACKGROUND_AGENT_RESULT_MARKER_xyz',
    });

    await page.goto(`/${guildId}/session/${sessionId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await expect(page.getByTestId('SUBAGENT_CHAIN_HEADER')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Assertion 1 — the raw <task-notification> XML must NOT leak to the page as a YOU chat
    // message. The orchestrator's chat-line processor parses the XML and attaches a structured
    // `taskNotification` field so the web can build a task_notification ChatEntry directly.
    // Bug symptom: before the server-side parse, the XML rendered as a YOU box with the raw
    // `<task-notification>...` content visible.
    await expect(page.getByText('<task-notification>', { exact: false })).toHaveCount(0);

    // Assertion 2 — the parsed notification must attach to its sub-agent chain via taskId ===
    // agentId. The chain renders expanded on mount, so a TASK REPORT box appears inside it
    // carrying the agent's result. Scope to SUBAGENT_CHAIN so we're not catching a
    // root-level fallback.
    const chainScope = page.getByTestId('SUBAGENT_CHAIN');

    await expect(chainScope.getByText('TASK REPORT', { exact: true })).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
    await expect(chainScope.getByText('BACKGROUND_AGENT_RESULT_MARKER_xyz')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
  });

  test('VALID: redacted (empty) thinking blocks are stripped by the server and never render', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Redacted Thinking Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    const sessionId = 'e2e-redacted-thinking-001';
    const assistantText = 'REDACTED_THINKING_ASSISTANT_TEXT_MARKER_xyz';

    sessions.createSessionWithRedactedThinking({ sessionId, assistantText });

    await page.goto(`/${guildId}/session/${sessionId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Wait for replay to settle — the assistant text must be present.
    await expect(page.getByText(assistantText)).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Assertion — an extended-thinking block with empty `thinking` text carries only a
    // cryptographic signature. The orchestrator filters these empty items out of the
    // assistant's content array so the renderer never produces an empty "THINKING" label.
    // Bug symptom: bare "THINKING" boxes appeared throughout the chat because the raw
    // redacted thinking items reached the ChatMessageWidget unfiltered.
    await expect(page.getByText('THINKING', { exact: true })).toHaveCount(0);
  });

  test('ERROR: old HTTP chat history endpoint returns 404', async ({ request }) => {
    const response = await request.get('/api/sessions/fake-session-id/chat/history');

    expect(response.status()).toBe(HTTP_NOT_FOUND);
  });
});
