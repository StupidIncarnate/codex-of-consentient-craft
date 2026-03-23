import { mkdirSync, writeFileSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
  createSessionFile,
  cleanSessionDirectory,
  queueClaudeResponse,
  clearClaudeQueue,
  SimpleTextResponseStub,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-execution-streaming';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const PANEL_TIMEOUT = 5_000;
const STREAMING_TEXT_TIMEOUT = 5_000;

const navigateToSession = async ({
  page,
  urlSlug,
  sessionId,
}: {
  page: Parameters<Parameters<typeof test>[2]>[0]['page'];
  urlSlug: string;
  sessionId: string;
}): Promise<void> => {
  const guildsResponsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
  );
  await page.goto(`/${urlSlug}/session/${sessionId}`);
  await guildsResponsePromise;
};

test.describe('Quest Execution Streaming', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test('execution panel renders streamed LLM text content from pathseeker', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Streaming Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-exec-stream-${Date.now()}`;
    createSessionFile({ guildPath: GUILD_PATH, sessionId, userMessage: 'Build the feature' });

    const created = await createQuest(request, {
      guildId,
      title: 'E2E Execution Streaming Quest',
      userRequest: 'Build the feature',
    });
    const questId = created.questId;
    const questFilePath = String(Reflect.get(created, 'filePath'));
    const questFolder = String(Reflect.get(created, 'questFolder'));

    const quest = {
      id: questId,
      folder: questFolder,
      title: 'E2E Execution Streaming Quest',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          status: 'complete',
          spawnerType: 'agent',
          sessionId,
          createdAt: new Date().toISOString(),
          relatedDataItems: [],
          dependsOn: [],
        },
      ],
      userRequest: 'Build the feature',
      designDecisions: [],
      steps: [],
      toolingRequirements: [],
      contracts: [],
      flows: [
        {
          id: 'test-flow',
          name: 'Test Flow',
          entryPoint: 'start',
          exitPoints: ['end'],
          nodes: [
            { id: 'start', label: 'Start', type: 'state', observables: [] },
            { id: 'end', label: 'End', type: 'terminal', observables: [] },
          ],
          edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
        },
      ],
    };
    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));

    // Queue response for pathseeker with delay so the text is visible before CLI exits
    const response = SimpleTextResponseStub({
      text: 'Analyzing quest requirements and planning steps',
    });
    response.delayMs = 500;
    queueClaudeResponse(response);

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId });

    // Execution panel should appear since quest is in_progress
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // The planning row should be visible
    await expect(page.getByText('Planning steps...')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The actual streamed text content should appear in the execution row — not just "streaming..."
    await expect(
      page.getByText('Analyzing quest requirements and planning steps'),
    ).toBeVisible({ timeout: STREAMING_TEXT_TIMEOUT });
  });
});
