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

const GUILD_PATH = '/tmp/dm-e2e-quest-execution-streaming';
const PANEL_TIMEOUT = 5_000;
const STREAMING_TEXT_TIMEOUT = 5_000;

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest Execution Streaming', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: execution panel renders streamed LLM text content from pathseeker', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Streaming Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const sessionId = `e2e-exec-stream-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Execution Streaming Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const questFilePath = created.filePath;
    const { questFolder } = created;

    quests.writeQuestFile({
      questId: String(questId),
      questFolder,
      questFilePath,
      status: 'approved',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
        },
      ],
    });

    // Queue response for pathseeker with delay so the text is visible before CLI exits
    const response = SimpleTextResponseStub({
      text: 'Analyzing quest requirements and planning steps',
    });
    response.delayMs = 500;
    claudeMock.queueResponse({ response });

    // Kick orchestration off before navigation so the quest transitions to seek_scope
    // and the widget's WS execution listener activates immediately on page load.
    // This avoids the race where fast-executing work items broadcast output before
    // the browser's WS is connected.
    await request.post(`/api/quests/${questId}/start`);

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    // Execution panel should appear since quest is in an execution-phase status (seek_scope)
    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // The planning row should be visible inside the execution panel
    await expect(executionPanel.getByText('Planning steps...')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // The actual streamed text content should appear in the execution row — not just "streaming...".
    await expect(
      executionPanel.getByText('Analyzing quest requirements and planning steps'),
    ).toBeVisible({
      timeout: STREAMING_TEXT_TIMEOUT,
    });
  });
});
