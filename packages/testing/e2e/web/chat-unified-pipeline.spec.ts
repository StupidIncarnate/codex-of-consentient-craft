import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  queueClaudeResponse,
  clearClaudeQueue,
  cleanSessionDirectory,
  createSubagentSessionFiles,
  SimpleTextResponseStub,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-unified-pipeline';
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const CHAT_TIMEOUT = 15_000;

const extractGuildId = (guild: Record<string, unknown>) => `${guild.id}`;

test.describe('Unified JSONL Pipeline', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    cleanSessionDirectory({ guildPath: GUILD_PATH });
    mkdirSync(GUILD_PATH, { recursive: true });
  });

  test('chat entries reload via WS replay after navigating away and back', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, { name: 'Replay Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    queueClaudeResponse(SimpleTextResponseStub({ text: 'Replayed via WebSocket' }));

    // Track HTTP requests to verify no /chat/history calls
    const httpChatHistoryRequests: URL[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/chat/history')) {
        httpChatHistoryRequests.push(new URL(req.url()));
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

  test('page refresh replays assistant response via WS history', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Refresh Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    queueClaudeResponse(SimpleTextResponseStub({ text: 'Persistent after refresh' }));

    // Track requests to confirm replay goes through WS, not HTTP
    const httpChatHistoryRequests: URL[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/chat/history')) {
        httpChatHistoryRequests.push(new URL(req.url()));
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

  test('live streaming entries arrive via unified processor', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Stream Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    queueClaudeResponse(SimpleTextResponseStub({ text: 'Streamed through processor' }));

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Stream test message');
    await page.getByTestId('SEND_BUTTON').click();

    // User message renders (confirms user entries go through processor)
    await expect(page.getByText('Stream test message')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Assistant response renders (confirms chat-output WS events deliver streamed entries)
    await expect(page.getByText('Streamed through processor')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
  });

  test('sub-agent entries appear in replayed session history', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Subagent Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    const sessionId = 'e2e-subagent-session-001';
    const agentId = 'e2e-subagent-agent-001';
    const toolUseId = 'toolu_e2e_subagent_001';

    createSubagentSessionFiles({
      guildPath: GUILD_PATH,
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

    // Sub-agent chain header should appear (collapsed by default)
    await expect(page.getByTestId('SUBAGENT_CHAIN_HEADER')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Expand the sub-agent chain to see inner content
    await page.getByTestId('SUBAGENT_CHAIN_HEADER').click();

    // Sub-agent text should now be visible
    await expect(page.getByText('Sub-agent output text')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('old HTTP chat history endpoint returns 404', async ({ request }) => {
    const response = await request.get('/api/sessions/fake-session-id/chat/history');
    expect(response.status()).toBe(HTTP_NOT_FOUND);
  });
});
