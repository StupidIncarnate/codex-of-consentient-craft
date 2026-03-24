import { test, expect } from './base-spec';
import { wireHarnessLifecycle } from './fixtures/harness-wire';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { cleanGuilds, createGuild, createQuest } from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-execution-streaming';
const PANEL_TIMEOUT = 5_000;
const STREAMING_TEXT_TIMEOUT = 5_000;

const claudeMock = wireHarnessLifecycle({ harness: claudeMockHarness(), testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest Execution Streaming', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds({ request });
  });

  test('execution panel renders streamed LLM text content from pathseeker', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await createGuild({ request, name: 'Streaming Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const sessionId = `e2e-exec-stream-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await createQuest({
      request,
      guildId,
      title: 'E2E Execution Streaming Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const questFilePath = String(Reflect.get(created, 'filePath'));
    const questFolder = String(Reflect.get(created, 'questFolder'));

    quests.writeQuestFile({
      questId: String(questId),
      questFolder,
      questFilePath,
      status: 'in_progress',
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

    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId });

    // Execution panel should appear since quest is in_progress
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // The planning row should be visible
    await expect(page.getByText('Planning steps...')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The actual streamed text content should appear in the execution row — not just "streaming..."
    await expect(page.getByText('Analyzing quest requirements and planning steps')).toBeVisible({
      timeout: STREAMING_TEXT_TIMEOUT,
    });
  });
});
