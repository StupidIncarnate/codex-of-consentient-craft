import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  AssistantTextStreamLineStub,
  AssistantToolResultStreamLineStub,
  AssistantToolUseStreamLineStub,
  ResultStreamLineStub,
  SystemInitStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-execution-panel-tail-window';
const PANEL_TIMEOUT = 5_000;
const REPLAY_TIMEOUT = 5_000;
const STREAM_TIMEOUT = 10_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
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

  test('VALID: {paused quest with codeweaver session: text → toolA → toolB → toolC (no trailing text)} => only anchor text + last tool C visible; tools A and B file_paths not in expanded row body', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Tail Window Tools Only Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const chaosSessionId = `e2e-tail-tools-chaos-${Date.now()}`;
    const codeweaverSessionId = `e2e-tail-tools-codeweaver-${Date.now()}`;

    const ANCHOR_TEXT = 'TAILWINDOW_TOOLS_ANCHOR_marker';
    const FILE_PATH_A = '/tmp/tail-tools-a.ts';
    const FILE_PATH_B = '/tmp/tail-tools-b.ts';
    const FILE_PATH_C = '/tmp/tail-tools-c.ts';

    sessions.createSessionWithAssistantText({
      sessionId: chaosSessionId,
      text: 'Chaos summary',
    });

    // Seed codeweaver session as: text(ANCHOR) → toolUse/result A → toolUse/result B → toolUse/result C.
    // Anchor = ANCHOR text (only text). Last unit = tool C.
    // Tail window should show only anchor + tool C; tools A and B must be hidden until expanded.
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
              content: [{ type: 'text', text: ANCHOR_TEXT }],
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
                  id: 'toolu_tools_a',
                  name: 'Read',
                  input: { file_path: FILE_PATH_A },
                },
              ],
            },
          }),
        ),
        JSON.stringify(
          AssistantToolResultStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_result', tool_use_id: 'toolu_tools_a', content: 'a' }],
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
                  id: 'toolu_tools_b',
                  name: 'Grep',
                  input: { file_path: FILE_PATH_B },
                },
              ],
            },
          }),
        ),
        JSON.stringify(
          AssistantToolResultStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_result', tool_use_id: 'toolu_tools_b', content: 'b' }],
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
                  id: 'toolu_tools_c',
                  name: 'Bash',
                  input: { file_path: FILE_PATH_C },
                },
              ],
            },
          }),
        ),
        JSON.stringify(
          AssistantToolResultStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_result', tool_use_id: 'toolu_tools_c', content: 'c' }],
            },
          }),
        ),
      ],
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Tail Window Tools Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder, filePath: questFilePath } = created;

    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'paused',
      steps: [{ id: 'step-tools-tail', name: 'Tail tools step' }],
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000b1',
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'complete',
        },
        {
          id: 'e2e00000-0000-4000-8000-0000000000b2',
          role: 'codeweaver',
          sessionId: codeweaverSessionId,
          status: 'pending',
          relatedDataItems: ['steps/step-tools-tail'],
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const codeweaverRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: 'Tail tools step' });

    await codeweaverRow.getByTestId('execution-row-header').click();

    await expect(codeweaverRow.getByTestId('execution-row-expanded')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const expandedBody = codeweaverRow.getByTestId('execution-row-expanded');

    // Anchor text + LAST tool (C) must be visible.
    await expect(expandedBody.getByText(ANCHOR_TEXT)).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(expandedBody.locator('[data-testid="TOOL_ROW"]')).toHaveCount(1);
    await expect(
      expandedBody.locator('[data-testid="TOOL_ROW"]').filter({ hasText: FILE_PATH_C }),
    ).toHaveCount(1);

    // Tools A and B must NOT appear in the visible row body (filter by their file paths returns zero).
    await expect(
      expandedBody.locator('[data-testid="TOOL_ROW"]').filter({ hasText: FILE_PATH_A }),
    ).toHaveCount(0);
    await expect(
      expandedBody.locator('[data-testid="TOOL_ROW"]').filter({ hasText: FILE_PATH_B }),
    ).toHaveCount(0);

    const toggle = codeweaverRow.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE');

    await expect(toggle).toBeVisible({ timeout: REPLAY_TIMEOUT });
    await expect(toggle).toContainText(/^▸ Show \d+ earlier entries$/u);

    // Click toggle — all three tool rows must appear in order.
    await toggle.click();

    await expect(expandedBody.locator('[data-testid="TOOL_ROW"]')).toHaveCount(3);
    await expect(
      expandedBody.locator('[data-testid="TOOL_ROW"]').filter({ hasText: FILE_PATH_A }),
    ).toHaveCount(1);
    await expect(
      expandedBody.locator('[data-testid="TOOL_ROW"]').filter({ hasText: FILE_PATH_B }),
    ).toHaveCount(1);
    await expect(
      expandedBody.locator('[data-testid="TOOL_ROW"]').filter({ hasText: FILE_PATH_C }),
    ).toHaveCount(1);
    await expect(toggle).toContainText(/^▾ Hide \d+ earlier entries$/u);
  });

  test('VALID: {streamed pathseeker session: text("starting") → toolA → toolB → text("checkpoint") → toolC → toolD} => only checkpoint + toolD visible; toolA, B, C absent from row body', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Tail Window Stream Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const chaosSessionId = `e2e-tail-stream-chaos-${Date.now()}`;
    const pathseekerSessionId = `e2e-tail-stream-pathseeker-${Date.now()}`;

    const STARTING_TEXT = 'TAILSTREAM_STARTING_marker';
    const CHECKPOINT_TEXT = 'TAILSTREAM_CHECKPOINT_marker';
    const STREAM_FILE_A = '/tmp/tail-stream-a.ts';
    const STREAM_FILE_B = '/tmp/tail-stream-b.ts';
    const STREAM_FILE_C = '/tmp/tail-stream-c.ts';
    const STREAM_FILE_D = '/tmp/tail-stream-d.ts';

    sessions.createSessionWithAssistantText({
      sessionId: chaosSessionId,
      text: 'Chaos summary',
    });

    // Queue a pathseeker stream that emits, in order: text(STARTING) → toolA/result → toolB/result
    // → text(CHECKPOINT) → toolC/result → toolD/result. Anchor = CHECKPOINT (last text).
    // Last unit = tool D. Tail window collapses everything in between.
    claudeMock.queueResponse({
      response: {
        sessionId: pathseekerSessionId,
        lines: [
          JSON.stringify(SystemInitStreamLineStub({ session_id: pathseekerSessionId })),
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [{ type: 'text', text: STARTING_TEXT }],
              },
            }),
          ),
          JSON.stringify(
            AssistantToolUseStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  {
                    type: 'tool_use',
                    id: 'toolu_stream_a',
                    name: 'Read',
                    input: { file_path: STREAM_FILE_A },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(
            AssistantToolResultStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  { type: 'tool_result', tool_use_id: 'toolu_stream_a', content: 'a-result' },
                ],
              },
            }),
          ),
          JSON.stringify(
            AssistantToolUseStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  {
                    type: 'tool_use',
                    id: 'toolu_stream_b',
                    name: 'Grep',
                    input: { file_path: STREAM_FILE_B },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(
            AssistantToolResultStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  { type: 'tool_result', tool_use_id: 'toolu_stream_b', content: 'b-result' },
                ],
              },
            }),
          ),
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [{ type: 'text', text: CHECKPOINT_TEXT }],
              },
            }),
          ),
          JSON.stringify(
            AssistantToolUseStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  {
                    type: 'tool_use',
                    id: 'toolu_stream_c',
                    name: 'Bash',
                    input: { file_path: STREAM_FILE_C },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(
            AssistantToolResultStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  { type: 'tool_result', tool_use_id: 'toolu_stream_c', content: 'c-result' },
                ],
              },
            }),
          ),
          JSON.stringify(
            AssistantToolUseStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  {
                    type: 'tool_use',
                    id: 'toolu_stream_d',
                    name: 'Write',
                    input: { file_path: STREAM_FILE_D },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(
            AssistantToolResultStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  { type: 'tool_result', tool_use_id: 'toolu_stream_d', content: 'd-result' },
                ],
              },
            }),
          ),
          JSON.stringify(ResultStreamLineStub({ session_id: pathseekerSessionId })),
        ],
      },
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Tail Window Streaming Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder, filePath: questFilePath } = created;

    // Seed quest at `approved` with chaoswhisperer complete — POST /start kicks the
    // orchestration loop, which dispatches pathseeker. The CLI mock pops the queued
    // response and streams the lines to the pathseeker session, which renders inside
    // the execution panel's pathseeker row (collapseToTail=true).
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'approved',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000c1',
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'complete',
        },
      ],
    });

    await request.post(`/api/quests/${questId}/start`);

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const pathseekerRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: 'Planning steps...' });

    await expect(pathseekerRow.getByTestId('execution-row-expanded')).toBeVisible({
      timeout: STREAM_TIMEOUT,
    });

    const expandedBody = pathseekerRow.getByTestId('execution-row-expanded');

    // Wait for streaming to settle: the LAST text (CHECKPOINT) must appear in the row body.
    await expect(expandedBody.getByText(CHECKPOINT_TEXT)).toBeVisible({ timeout: STREAM_TIMEOUT });

    // Tool D must be the ONLY visible tool row.
    await expect(expandedBody.locator('[data-testid="TOOL_ROW"]')).toHaveCount(1);
    await expect(
      expandedBody.locator('[data-testid="TOOL_ROW"]').filter({ hasText: STREAM_FILE_D }),
    ).toHaveCount(1);

    // Earlier text and tools A/B/C must NOT appear in the visible row body.
    await expect(expandedBody.getByText(STARTING_TEXT)).not.toBeVisible();
    await expect(
      expandedBody.locator('[data-testid="TOOL_ROW"]').filter({ hasText: STREAM_FILE_A }),
    ).toHaveCount(0);
    await expect(
      expandedBody.locator('[data-testid="TOOL_ROW"]').filter({ hasText: STREAM_FILE_B }),
    ).toHaveCount(0);
    await expect(
      expandedBody.locator('[data-testid="TOOL_ROW"]').filter({ hasText: STREAM_FILE_C }),
    ).toHaveCount(0);

    const toggle = pathseekerRow.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE');

    await expect(toggle).toBeVisible({ timeout: STREAM_TIMEOUT });
    await expect(toggle).toContainText(/^▸ Show \d+ earlier entries$/u);
  });
});
