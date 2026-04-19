import * as crypto from 'crypto';
import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-session-id-routing';
const PANEL_TIMEOUT = 10_000;
const STREAMING_TEXT_TIMEOUT = 10_000;
/**
 * Roles visible in the execution panel UI, mapped to their dungeon floor names.
 */
const ROLE_FLOOR_MAP = {
  chaoswhisperer: 'SANCTUM',
  pathseeker: 'CARTOGRAPHY',
  codeweaver: 'FORGE',
  ward: 'GAUNTLET',
  siegemaster: 'ARENA',
  lawbringer: 'TRIBUNAL',
} as const;

const VISIBLE_ROLES = Object.keys(ROLE_FLOOR_MAP);

const claudeMock = wireHarnessLifecycle({ harness: claudeMockHarness(), testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Session ID Routing', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test.describe('per-role streamed text content appears in correct work item panel', () => {
    for (const role of VISIBLE_ROLES) {
      test(`${role} work item displays replayed text content inside its expanded panel`, async ({
        page,
        request,
      }) => {
        const quests = questHarness({ request });
        const nav = navigationHarness({ page });
        const guild = await guildHarness({ request }).createGuild({
          name: `Role ${role} Guild`,
          path: GUILD_PATH,
        });
        const guildId = String(guild.id);
        const mainSessionId = `e2e-role-${role}-${Date.now()}`;
        const roleSessionId =
          role === 'chaoswhisperer' ? mainSessionId : `wi-${role}-${Date.now()}`;

        const roleText = `Unique ${role} output text ${Date.now()}`;

        // Create main session file (chaoswhisperer session)
        sessions.createSessionWithAssistantText({
          sessionId: mainSessionId,
          text: role === 'chaoswhisperer' ? roleText : `Chaoswhisperer analysis for ${role} test`,
        });

        // Create session file for the target role (if not chaoswhisperer)
        if (role !== 'chaoswhisperer') {
          sessions.createSessionWithAssistantText({
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
        const created = await questHarness({ request }).createQuest({
          guildId,
          title: 'E2E Session Routing Quest',
          userRequest: 'Build the feature',
        });
        const questFilePath = created.filePath;
        const { questFolder } = created;

        quests.writeQuestFile({
          questId: String(created.questId),
          questFolder,
          questFilePath,
          status: 'complete',
          workItems,
        });

        const urlSlug = String(guild.urlSlug ?? guild.name)
          .toLowerCase()
          .replace(/\s+/gu, '-');
        await nav.navigateToSession({ urlSlug, sessionId: mainSessionId });

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
        await nav.triggerReplayFromBrowser({ guildId, sessionIds: replaySessionIds });

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

  test('VALID: pathseeker live streaming routes text content to pathseeker panel via sessionId', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Streaming Route Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const mainSessionId = `e2e-stream-route-${Date.now()}`;

    sessions.createSessionFile({
      sessionId: mainSessionId,
      userMessage: 'Build the feature',
    });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Session Routing Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = created.filePath;
    const { questFolder } = created;

    // Create quest with approved status and only chaoswhisperer complete.
    // POST /start will transition to seek_scope and insert a pathseeker item,
    // which the orchestrator will then run.
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder,
      questFilePath,
      status: 'approved',
      workItems: [
        {
          id: crypto.randomUUID(),
          role: 'chaoswhisperer',
          sessionId: mainSessionId,
        },
      ],
    });

    // Queue a response for the pathseeker agent with unique text
    const pathseekerText = `Pathseeker routing verification ${Date.now()}`;
    const response = SimpleTextResponseStub({ text: pathseekerText });
    response.delayMs = 500;
    claudeMock.queueResponse({ response });

    // Kick orchestration off before navigation so the widget lands on an
    // execution-phase quest with the WS listener active from the first render.
    await request.post(`/api/quests/${created.questId}/start`);

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId: mainSessionId });

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

  test('VALID: multi-instance same-role: streamed text routes to correct codeweaver panel by sessionId', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
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

    sessions.createSessionWithAssistantText({
      sessionId: mainSessionId,
      text: 'Chaoswhisperer analysis complete',
    });
    sessions.createSessionWithAssistantText({
      sessionId: cwSessionId1,
      text: alphaText,
    });
    sessions.createSessionWithAssistantText({
      sessionId: cwSessionId2,
      text: betaText,
    });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Session Routing Quest',
      userRequest: 'Build the feature',
    });
    const questFilePath = created.filePath;
    const { questFolder } = created;

    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder,
      questFilePath,
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

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId: mainSessionId });

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
    await nav.triggerReplayFromBrowser({
      guildId,
      sessionIds: [mainSessionId, cwSessionId1, cwSessionId2],
    });

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
