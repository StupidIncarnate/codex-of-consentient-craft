import { AssistantTextStreamLineStub } from '@dungeonmaster/shared/contracts';
import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';

import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { monitorSessionHarness } from '../../test/harnesses/monitor-session/monitor-session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-streaming-subagent-execution-rows';
const PANEL_TIMEOUT = 10_000;
const LIVE_TEXT_TIMEOUT = 10_000;
const REPLAY_TEXT_TIMEOUT = 10_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
const monitorSession = monitorSessionHarness();
wireHarnessLifecycle({ harness: monitorSession, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Per-work-item LIVE streaming reads `<sessionId>/subagents/agent-<agentId>.jsonl` appends', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {monitor-session announced + sub-agent JSONL appended live} => the pathseeker-surface execution row shows the streamed assistant text WITHOUT page refresh', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Streaming Subagent Exec Rows Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const parentSessionId = `e2e-stream-parent-${Date.now()}`;
    const realAgentId = `e2elivestreamagent${Date.now()}`;
    const chaosSessionId = `e2e-stream-chaos-${Date.now()}`;
    const chaosWorkItemId = 'e2e00000-0000-4000-8000-000000000060';
    const pathseekerWorkItemId = 'e2e00000-0000-4000-8000-000000000061';
    const REPLAY_MARKER = 'REPLAY_PATHSEEKER_SURFACE_MARKER_abc';
    const LIVE_MARKER = 'LIVE_PATHSEEKER_SURFACE_MARKER_xyz123';

    sessions.createSessionWithAssistantText({
      sessionId: chaosSessionId,
      text: 'Chaos summary placeholder',
    });

    // Seed the parent /dumpster-launch session JSONL so the watcher's main tail has a
    // file to open. Content is irrelevant — the bug surfaces from sub-agent activity.
    sessions.createSessionFile({
      sessionId: parentSessionId,
      userMessage: 'dumpster-launch parent placeholder',
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Streaming Subagent Exec Rows Quest',
      userRequest: 'Stream sub-agent live',
    });
    const { questId, questFolder, filePath: questFilePath } = created;

    // Pre-seed the sub-agent JSONL BEFORE announcing the monitor session, so the
    // watcher's initial scan (fsReaddirAdapter inside questMonitorJsonlWatcherBroker)
    // picks up the file at startup and starts a tail on it. Without pre-seeding, the
    // only way the watcher learns of a new sub-agent file is via an `agent-detected`
    // signal from the main JSONL tail — which we don't fire here.
    //
    // The file contains only an assistant-text line (NO Task prompt line) — that way
    // the watcher's onSessionIdLearned regex never matches, so it never overwrites the
    // sessionId we pre-stamp below. In production, get-agent-prompt MCP handler stamps
    // wi.sessionId = parentSessionId / wi.agentId = realAgentId.
    sessions.createSubagentTailMultiEntry({
      sessionId: parentSessionId,
      agentId: realAgentId,
      lines: [
        JSON.stringify(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: REPLAY_MARKER }],
              usage: { input_tokens: 10, output_tokens: 5 },
            },
          }),
        ),
      ],
    });

    // Pre-stamp wi.sessionId = parentSessionId + wi.agentId = realAgentId on the
    // pathseeker-surface workItem. This matches what the MCP get-agent-prompt handler
    // would do in production (interaction-handle-responder ~line 96). Per-work-item
    // replay's path encoding (chat-history-replay-broker) is
    // `<encoded-projectPath>/<sessionId>/subagents/agent-<agentId>.jsonl`, so
    // sessionId MUST be the parent session id for replay to find the subagent file.
    //
    // Quest status is `seek_scope` (not `in_progress`) to keep the orchestration loop
    // from kicking in — the loop's orphan-reset would demote pathseeker-surface from
    // in_progress back to pending while it re-dispatches, and execution-row-layer-widget
    // only auto-expands rows whose status is in_progress. Pending rows render their
    // body as `null`, hiding the entries and breaking the text assertion.
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'seek_scope',
      workItems: [
        {
          id: chaosWorkItemId,
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'complete',
        },
        {
          id: pathseekerWorkItemId,
          role: 'pathseeker-surface',
          status: 'in_progress',
          sessionId: parentSessionId,
          agentId: realAgentId,
          dependsOn: [chaosWorkItemId],
        },
      ],
    });

    // Programmatic call equivalent to monitor-session-announce-broker — write the
    // <DUNGEONMASTER_HOME>/active-monitor-session.json file. The server's
    // monitor-session-watch responder fs-watches this file, sees the appearance, and
    // starts quest-monitor-jsonl-watcher-broker against parentSessionId.
    monitorSession.announce({ parentSessionId, projectDir: GUILD_PATH });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Replay path is the control: chat-replay-responder stamps payload.sessionId =
    // wi.sessionId, so the binding buckets entries under realAgentId and the row finds
    // them via sessionEntries.get(wi.sessionId). If REPLAY_MARKER is not visible,
    // setup is wrong (timing / harness), not the live-streaming bug.
    await expect(executionPanel.getByText(REPLAY_MARKER).first()).toBeVisible({
      timeout: REPLAY_TEXT_TIMEOUT,
    });

    // Live append: this is the assistant text frame the execution row must pick up
    // without a refresh. With the bug, start-subagent-tail-layer-broker emits
    // chat-output without payload.sessionId, so use-quest-chat-binding buckets the
    // entry under SYNTHETIC_SESSION_KEY (__no_session__). The execution row does
    // sessionEntries.get(wi.sessionId) and finds [] — row stays empty until the user
    // refreshes (which triggers chat-replay-responder that stamps payload.sessionId).
    sessions.appendSubagentLine({
      sessionId: parentSessionId,
      agentId: realAgentId,
      line: JSON.stringify(
        AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: LIVE_MARKER }],
            usage: { input_tokens: 10, output_tokens: 5 },
          },
        }),
      ),
    });

    // Scope to the execution panel so the activity-panel (which flattens session
    // entries from a different source) doesn't trip strict-mode duplicate matches.
    await expect(executionPanel.getByText(LIVE_MARKER).first()).toBeVisible({
      timeout: LIVE_TEXT_TIMEOUT,
    });
  });
});
