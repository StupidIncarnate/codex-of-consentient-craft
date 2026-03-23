import * as crypto from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
  createSessionFile,
  createMultiEntrySessionFile,
  cleanSessionDirectory,
  queueClaudeResponse,
  clearClaudeQueue,
  SimpleTextResponseStub,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-session-id-routing';
const JSON_INDENT = 2;
const HTTP_OK = 200;
const PANEL_TIMEOUT = 10_000;
const STREAMING_TEXT_TIMEOUT = 10_000;
const REPLAY_SETTLE_MS = 2000;

/**
 * Roles visible in the execution panel UI, mapped to their dungeon floor names.
 */
const ROLE_FLOOR_MAP: Record<string, string> = {
  chaoswhisperer: 'SANCTUM',
  pathseeker: 'CARTOGRAPHY',
  codeweaver: 'FORGE',
  ward: 'GAUNTLET',
  siegemaster: 'ARENA',
  lawbringer: 'TRIBUNAL',
};

const VISIBLE_ROLES = Object.keys(ROLE_FLOOR_MAP);

/**
 * Creates a JSONL session file with an assistant text entry that will be replayed.
 * The replay mechanism reads these files and broadcasts them as chat-output WS events.
 */
const createSessionWithAssistantText = ({
  guildPath,
  sessionId,
  text,
}: {
  guildPath: string;
  sessionId: string;
  text: string;
}): void => {
  createMultiEntrySessionFile({
    guildPath,
    sessionId,
    lines: [
      JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'Build the feature' },
      }),
      JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text }],
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      }),
    ],
  });
};

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

/**
 * Sends replay-history WS messages from the browser for each sessionId.
 * This is needed because the frontend's built-in replay fires before the WS
 * connection is fully open. By sending from page.evaluate after the page has
 * settled, we ensure the WS is connected and the replays succeed.
 */
const triggerReplayFromBrowser = async ({
  page,
  guildId,
  sessionIds,
}: {
  page: Parameters<Parameters<typeof test>[2]>[0]['page'];
  guildId: string;
  sessionIds: string[];
}): Promise<void> => {
  await page.evaluate(
    ({ guildId: gId, sessionIds: sIds }) => {
      const wsUrl = `ws://${globalThis.location.host}/ws`;
      const ws = new globalThis.WebSocket(wsUrl);
      ws.onopen = (): void => {
        for (const sid of sIds) {
          ws.send(
            JSON.stringify({
              type: 'replay-history',
              sessionId: sid,
              guildId: gId,
              chatProcessId: `replay-${sid}`,
            }),
          );
        }
        // Close after a brief delay to ensure messages are sent
        globalThis.setTimeout(() => {
          ws.close();
        }, 500);
      };
    },
    { guildId, sessionIds },
  );
};

/**
 * Builds a quest JSON object with the given parameters.
 * The quest is written to the server-resolved filePath from createQuest.
 */
const buildQuestJson = ({
  questId,
  questFolder,
  status,
  workItems,
}: {
  questId: ReturnType<typeof crypto.randomUUID>;
  questFolder: ReturnType<typeof String>;
  status: ReturnType<typeof String>;
  workItems: {
    id: ReturnType<typeof crypto.randomUUID>;
    role: ReturnType<typeof String>;
    sessionId: ReturnType<typeof String>;
    status?: ReturnType<typeof String>;
  }[];
}): Record<PropertyKey, unknown> => ({
  id: questId,
  folder: questFolder,
  title: 'E2E Session Routing Quest',
  status,
  createdAt: new Date().toISOString(),
  workItems: workItems.map((wi) => ({
    id: wi.id,
    role: wi.role,
    status: wi.status ?? 'complete',
    spawnerType: 'agent',
    sessionId: wi.sessionId,
    createdAt: new Date().toISOString(),
    relatedDataItems: [],
    dependsOn: [],
  })),
  userRequest: 'Build the feature',
  designDecisions: [],
  steps: [],
  toolingRequirements: [],
  contracts: [],
  flows: [
    {
      id: 'routing-flow',
      name: 'Session Routing Flow',
      entryPoint: 'start',
      exitPoints: ['end'],
      nodes: [
        { id: 'start', label: 'Start', type: 'state', observables: [] },
        { id: 'end', label: 'End', type: 'terminal', observables: [] },
      ],
      edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
    },
  ],
});

test.describe('Session ID Routing', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionDirectory({ guildPath: GUILD_PATH });
  });

  test.describe('per-role streamed text content appears in correct work item panel', () => {
    for (const role of VISIBLE_ROLES) {
      test(`${role} work item displays replayed text content inside its expanded panel`, async ({
        page,
        request,
      }) => {
        const guild = await createGuild(request, {
          name: `Role ${role} Guild`,
          path: GUILD_PATH,
        });
        const guildId = String(guild.id);
        const mainSessionId = `e2e-role-${role}-${Date.now()}`;
        const roleSessionId =
          role === 'chaoswhisperer' ? mainSessionId : `wi-${role}-${Date.now()}`;

        const roleText = `Unique ${role} output text ${Date.now()}`;

        // Create main session file (chaoswhisperer session)
        createSessionWithAssistantText({
          guildPath: GUILD_PATH,
          sessionId: mainSessionId,
          text: role === 'chaoswhisperer' ? roleText : `Chaoswhisperer analysis for ${role} test`,
        });

        // Create session file for the target role (if not chaoswhisperer)
        if (role !== 'chaoswhisperer') {
          createSessionWithAssistantText({
            guildPath: GUILD_PATH,
            sessionId: roleSessionId,
            text: roleText,
          });
        }

        const workItems = [
          {
            id: crypto.randomUUID(),
            role: 'chaoswhisperer',
            sessionId: mainSessionId,
          },
          ...(role === 'chaoswhisperer'
            ? []
            : [
                {
                  id: crypto.randomUUID(),
                  role,
                  sessionId: roleSessionId,
                },
              ]),
        ];

        // Create quest via API to get the server-resolved file path
        const created = await createQuest(request, {
          guildId,
          title: 'E2E Session Routing Quest',
          userRequest: 'Build the feature',
        });
        const questFilePath = String(Reflect.get(created, 'filePath'));
        const questFolder = String(Reflect.get(created, 'questFolder'));

        const quest = buildQuestJson({
          questId: created.questId as ReturnType<typeof crypto.randomUUID>,
          questFolder,
          status: 'complete',
          workItems,
        });
        writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));

        const urlSlug = String(guild.urlSlug ?? guild.name)
          .toLowerCase()
          .replace(/\s+/gu, '-');
        await navigateToSession({ page, urlSlug, sessionId: mainSessionId });

        // Execution panel should appear (complete status is an execution phase)
        await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
          timeout: PANEL_TIMEOUT,
        });

        // The role badge should appear in an execution row
        const roleBadge = page
          .getByTestId('execution-row-role-badge')
          .filter({ hasText: `[${role.toUpperCase()}]` });

        await expect(roleBadge).toBeVisible({ timeout: PANEL_TIMEOUT });

        // Trigger replay from browser to ensure WS is connected when messages are sent
        const replaySessionIds = workItems.map((wi) => wi.sessionId);
        await triggerReplayFromBrowser({ page, guildId, sessionIds: replaySessionIds });

        // Wait for replay events to propagate through the WS pipeline
        await page.waitForTimeout(REPLAY_SETTLE_MS);

        // Find the execution row for this role and expand it
        const roleRow = page.getByTestId('execution-row-layer-widget').filter({
          has: page
            .getByTestId('execution-row-role-badge')
            .filter({ hasText: `[${role.toUpperCase()}]` }),
        });
        await roleRow.first().getByTestId('execution-row-header').click();

        await expect(roleRow.first().getByTestId('execution-row-expanded')).toBeVisible({
          timeout: PANEL_TIMEOUT,
        });

        // The replayed text content should appear INSIDE this role's expanded panel
        // This is the core assertion: text routed by sessionId appears in the correct panel
        await expect(roleRow.first().getByText(roleText)).toBeVisible({
          timeout: STREAMING_TEXT_TIMEOUT,
        });
      });
    }
  });

  test('pathseeker live streaming routes text content to pathseeker panel via sessionId', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Streaming Route Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const mainSessionId = `e2e-stream-route-${Date.now()}`;

    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId: mainSessionId,
      userMessage: 'Build the feature',
    });

    // Create quest via API to get the server-resolved file path
    const created = await createQuest(request, {
      guildId,
      title: 'E2E Session Routing Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = String(Reflect.get(created, 'filePath'));
    const questFolder = String(Reflect.get(created, 'questFolder'));

    // Create quest with in_progress status and only chaoswhisperer complete.
    // The orchestrator will auto-create and run a pathseeker.
    const quest = buildQuestJson({
      questId: created.questId as ReturnType<typeof crypto.randomUUID>,
      questFolder,
      status: 'in_progress',
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
        },
      ],
    });
    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));

    // Queue a response for the pathseeker agent with unique text
    const pathseekerText = `Pathseeker routing verification ${Date.now()}`;
    const response = SimpleTextResponseStub({ text: pathseekerText });
    response.delayMs = 500;
    queueClaudeResponse(response);

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId: mainSessionId });

    // Execution panel should appear
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // The planning row should appear (pathseeker is running)
    await expect(page.getByText('Planning steps...')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The [PATHSEEKER] role badge should be visible
    await expect(
      page.getByTestId('execution-row-role-badge').filter({ hasText: '[PATHSEEKER]' }),
    ).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The actual streamed text content should appear in the pathseeker panel
    // This verifies live sessionId routing: the chat-output WS event includes sessionId
    // and the widget routes the text to the correct work item panel
    await expect(page.getByText(pathseekerText)).toBeVisible({
      timeout: STREAMING_TEXT_TIMEOUT,
    });
  });

  test('multi-instance same-role: streamed text routes to correct codeweaver panel by sessionId', async ({
    page,
    request,
  }) => {
    const guild = await createGuild(request, {
      name: 'Multi Content Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const mainSessionId = `e2e-multi-content-${Date.now()}`;
    const cwSessionId1 = `e2e-cw1-${Date.now()}`;
    const cwSessionId2 = `e2e-cw2-${Date.now()}`;

    // Create session files with DIFFERENT text for each codeweaver
    const alphaText = `Alpha message for codeweaver-1 ${Date.now()}`;
    const betaText = `Beta message for codeweaver-2 ${Date.now()}`;

    createSessionWithAssistantText({
      guildPath: GUILD_PATH,
      sessionId: mainSessionId,
      text: 'Chaoswhisperer analysis complete',
    });
    createSessionWithAssistantText({
      guildPath: GUILD_PATH,
      sessionId: cwSessionId1,
      text: alphaText,
    });
    createSessionWithAssistantText({
      guildPath: GUILD_PATH,
      sessionId: cwSessionId2,
      text: betaText,
    });

    // Create quest via API to get the server-resolved file path
    const created = await createQuest(request, {
      guildId,
      title: 'E2E Session Routing Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = String(Reflect.get(created, 'filePath'));
    const questFolder = String(Reflect.get(created, 'questFolder'));

    const quest = buildQuestJson({
      questId: created.questId as ReturnType<typeof crypto.randomUUID>,
      questFolder,
      status: 'complete',
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
        },
        {
          id: crypto.randomUUID(),
          role: 'codeweaver',
          sessionId: cwSessionId1,
        },
        {
          id: crypto.randomUUID(),
          role: 'codeweaver',
          sessionId: cwSessionId2,
        },
      ],
    });
    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await navigateToSession({ page, urlSlug, sessionId: mainSessionId });

    // Execution panel should appear
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Two codeweaver rows should exist
    const cwRows = page.getByTestId('execution-row-layer-widget').filter({
      has: page.getByTestId('execution-row-role-badge').filter({ hasText: '[CODEWEAVER]' }),
    });

    await expect(cwRows).toHaveCount(2, { timeout: PANEL_TIMEOUT });

    // Trigger replay from browser to ensure WS is connected when messages are sent
    await triggerReplayFromBrowser({
      page,
      guildId,
      sessionIds: [mainSessionId, cwSessionId1, cwSessionId2],
    });

    // Wait for replay events to propagate
    await page.waitForTimeout(REPLAY_SETTLE_MS);

    // Expand first codeweaver row
    await cwRows.nth(0).getByTestId('execution-row-header').click();

    await expect(cwRows.nth(0).getByTestId('execution-row-expanded')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Expand second codeweaver row
    await cwRows.nth(1).getByTestId('execution-row-header').click();

    await expect(cwRows.nth(1).getByTestId('execution-row-expanded')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // First codeweaver panel should show alpha text
    await expect(cwRows.nth(0).getByText(alphaText)).toBeVisible({
      timeout: STREAMING_TEXT_TIMEOUT,
    });

    // Second codeweaver panel should show beta text
    await expect(cwRows.nth(1).getByText(betaText)).toBeVisible({
      timeout: STREAMING_TEXT_TIMEOUT,
    });

    // Cross-contamination check: alpha text should NOT appear in the second panel
    await expect(cwRows.nth(1).getByText(alphaText)).not.toBeVisible();

    // Cross-contamination check: beta text should NOT appear in the first panel
    await expect(cwRows.nth(0).getByText(betaText)).not.toBeVisible();
  });
});
