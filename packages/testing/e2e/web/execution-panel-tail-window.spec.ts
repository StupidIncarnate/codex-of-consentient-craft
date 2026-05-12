import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  AssistantTextStreamLineStub,
  AssistantToolResultStreamLineStub,
  AssistantToolUseStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-execution-panel-tail-window';
const PANEL_TIMEOUT = 5_000;
const REPLAY_TIMEOUT = 5_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Execution panel tail-window collapse on initial load', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {paused quest with multi-entry codeweaver session: text → tool → tool → text → tool → tool → text} => expanded row shows tail-window — only the last text is visible, earlier entries are hidden behind the toggle', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Tail Window Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const chaosSessionId = `e2e-tail-chaos-${Date.now()}`;
    const codeweaverSessionId = `e2e-tail-codeweaver-${Date.now()}`;

    const FIRST_TEXT = 'TAILWINDOW_FIRST_MESSAGE_marker';
    const MIDDLE_TEXT = 'TAILWINDOW_MIDDLE_MESSAGE_marker';
    const LAST_TEXT = 'TAILWINDOW_LAST_MESSAGE_marker';

    sessions.createSessionWithAssistantText({
      sessionId: chaosSessionId,
      text: 'Chaos summary',
    });

    // Seed the codeweaver session with: text "first" → tool/result → tool/result
    // → text "middle" → tool/result → tool/result → text "last".
    // Tail anchor = "last" text (last message). Only "last" should render by default;
    // FIRST_TEXT and MIDDLE_TEXT must NOT be visible until the toggle is clicked.
    sessions.createMultiEntrySessionFile({
      sessionId: codeweaverSessionId,
      lines: [
        JSON.stringify(
          UserTextStringStreamLineStub({
            message: { role: 'user', content: 'Build the codeweaver step' },
          }),
        ),
        JSON.stringify(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: FIRST_TEXT }],
              usage: { input_tokens: 100, output_tokens: 50 },
            },
          }),
        ),
        JSON.stringify(
          AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'toolu_tail_001',
                  name: 'Read',
                  input: { file_path: '/tmp/a.ts' },
                },
              ],
            },
          }),
        ),
        JSON.stringify(
          AssistantToolResultStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_result', tool_use_id: 'toolu_tail_001', content: 'a' }],
            },
          }),
        ),
        JSON.stringify(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: MIDDLE_TEXT }],
              usage: { input_tokens: 200, output_tokens: 60 },
            },
          }),
        ),
        JSON.stringify(
          AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'toolu_tail_002',
                  name: 'Read',
                  input: { file_path: '/tmp/b.ts' },
                },
              ],
            },
          }),
        ),
        JSON.stringify(
          AssistantToolResultStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_result', tool_use_id: 'toolu_tail_002', content: 'b' }],
            },
          }),
        ),
        JSON.stringify(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: LAST_TEXT }],
              usage: { input_tokens: 300, output_tokens: 80 },
            },
          }),
        ),
      ],
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Tail Window Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder, filePath: questFilePath } = created;

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'paused',
      steps: [{ id: 'step-build-broker', name: 'Tail window step' }],
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000a1',
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'complete',
        },
        {
          id: 'e2e00000-0000-4000-8000-0000000000a2',
          role: 'codeweaver',
          sessionId: codeweaverSessionId,
          status: 'pending',
          relatedDataItems: ['steps/step-build-broker'],
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const codeweaverRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: 'Tail window step' });

    // Click the row header to expand the codeweaver row so its chat replays.
    await codeweaverRow.getByTestId('execution-row-header').click();

    await expect(codeweaverRow.getByTestId('execution-row-expanded')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // The tail anchor is the LAST text message. It must be visible.
    await expect(codeweaverRow.getByText(LAST_TEXT)).toBeVisible({ timeout: REPLAY_TIMEOUT });

    // Earlier text messages must NOT be visible — they're hidden behind the toggle.
    await expect(codeweaverRow.getByText(FIRST_TEXT)).not.toBeVisible();
    await expect(codeweaverRow.getByText(MIDDLE_TEXT)).not.toBeVisible();

    // The "Show N earlier entries" toggle must be visible and indicate hidden entries.
    const toggle = codeweaverRow.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE');

    await expect(toggle).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(toggle).toContainText(/^▸ Show \d+ earlier entries$/u);

    // Click the toggle — earlier entries should become visible.
    await toggle.click();

    await expect(codeweaverRow.getByText(FIRST_TEXT)).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(codeweaverRow.getByText(MIDDLE_TEXT)).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(codeweaverRow.getByText(LAST_TEXT)).toBeVisible();
    await expect(toggle).toContainText(/^▾ Hide \d+ earlier entries$/u);

    // Click again to collapse back.
    await toggle.click();

    await expect(codeweaverRow.getByText(FIRST_TEXT)).not.toBeVisible();
    await expect(codeweaverRow.getByText(MIDDLE_TEXT)).not.toBeVisible();
    await expect(codeweaverRow.getByText(LAST_TEXT)).toBeVisible();
  });
});
