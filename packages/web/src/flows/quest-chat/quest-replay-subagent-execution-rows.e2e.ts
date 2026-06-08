import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-replay-subagent-execution-rows';
const PANEL_TIMEOUT = 5_000;
const REPLAY_TEXT_TIMEOUT = 5_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Per-work-item replay reads `<sessionId>/subagents/agent-<agentId>.jsonl` for Task-dispatched rows', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {pathseeker-surface workItem carries sessionId+agentId} => its execution row shows replayed subagent text, NOT main session content', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Subagent Replay Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const chaosSessionId = `e2e-replay-chaos-sub-${Date.now()}`;
    // Parent /dumpster-launch session that owns the sub-agent's JSONL folder.
    const parentSessionId = `e2e-replay-parent-${Date.now()}`;
    // Claude CLI's realAgentId — the basename of the sub-agent's JSONL file.
    const realAgentId = `e2eagent${Date.now()}`;

    const chaosText = 'Chaos summary';
    const subagentText = 'Pathseeker-surface subagent replayed assistant text';

    sessions.createSessionWithAssistantText({ sessionId: chaosSessionId, text: chaosText });
    // Seed ONLY the sub-agent JSONL at `<parentSessionId>/subagents/agent-<realAgentId>.jsonl`.
    // No top-level `<parentSessionId>.jsonl` is needed for this test — the agentId-scoped
    // replay path reads only the matching subagent file (main session emission is skipped
    // when agentId is supplied) so the assertion that subagentText appears proves the
    // chat-history-replay-broker honored the agentId filter.
    sessions.createSubagentTailOnly({
      sessionId: parentSessionId,
      agentId: realAgentId,
      assistantText: subagentText,
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Subagent Replay Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    const pathseekerWorkItemId = 'e2e00000-0000-4000-8000-000000000022';
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'seek_scope',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000020',
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'complete',
        },
        {
          id: pathseekerWorkItemId,
          role: 'pathseeker-surface',
          sessionId: parentSessionId,
          agentId: realAgentId,
          status: 'in_progress',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Pathseeker-surface row must render the subagent's assistant text — that text only
    // appears in `<parentSessionId>/subagents/agent-<realAgentId>.jsonl`. If the agentId
    // filter isn't honored end-to-end (MCP-stamp → server-init-responder forwards agentId →
    // chat-history-replay-broker scopes), the panel renders empty for this row.
    await expect(executionPanel.getByText(subagentText)).toBeVisible({
      timeout: REPLAY_TEXT_TIMEOUT,
    });
  });
});
