import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-replay-subagent-row-isolation';
const PANEL_TIMEOUT = 10_000;
const REPLAY_TEXT_TIMEOUT = 10_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Two Task-dispatched rows that share one parent /dumpster-launch session must NOT cross-render each other transcripts', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {two codeweaver workItems, same parent sessionId, distinct agentIds} => the FIRST codeweaver row shows ONLY its own subagent text, not the second row transcript', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Subagent Row Isolation Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const chaosSessionId = `e2e-iso-chaos-${Date.now()}`;
    // Both codeweaver sub-agents run under the SAME parent /dumpster-launch session UUID.
    // This is the production shape: every Task-dispatched sub-agent under one launch loop
    // shares the parent's sessionId; only their realAgentIds (JSONL filenames) differ.
    const parentSessionId = `e2e-iso-parent-${Date.now()}`;
    const realAgentIdOne = `e2eagentone${Date.now()}`;
    const realAgentIdTwo = `e2eagenttwo${Date.now()}`;

    const chaosText = 'Chaos summary';
    const subagentTextOne = 'FIRST_CODEWEAVER_SUBAGENT_TEXT_alpha';
    const subagentTextTwo = 'SECOND_CODEWEAVER_SUBAGENT_TEXT_beta';

    sessions.createSessionWithAssistantText({ sessionId: chaosSessionId, text: chaosText });
    // Seed two distinct sub-agent JSONLs under the SAME parent session folder:
    //   <parentSessionId>/subagents/agent-<realAgentIdOne>.jsonl  → subagentTextOne
    //   <parentSessionId>/subagents/agent-<realAgentIdTwo>.jsonl  → subagentTextTwo
    sessions.createSubagentTailOnly({
      sessionId: parentSessionId,
      agentId: realAgentIdOne,
      assistantText: subagentTextOne,
    });
    sessions.createSubagentTailOnly({
      sessionId: parentSessionId,
      agentId: realAgentIdTwo,
      assistantText: subagentTextTwo,
    });

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Subagent Row Isolation Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    const codeweaverOneId = 'e2e00000-0000-4000-8000-000000000031';
    const codeweaverTwoId = 'e2e00000-0000-4000-8000-000000000032';
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'seek_scope',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000030',
          role: 'chaoswhisperer',
          sessionId: chaosSessionId,
          status: 'complete',
        },
        {
          id: codeweaverOneId,
          role: 'codeweaver',
          sessionId: parentSessionId,
          agentId: realAgentIdOne,
          status: 'in_progress',
        },
        {
          id: codeweaverTwoId,
          role: 'codeweaver',
          sessionId: parentSessionId,
          agentId: realAgentIdTwo,
          status: 'in_progress',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');

    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    await expect(
      executionPanel.getByTestId('execution-row-layer-widget').filter({ hasText: 'CODEWEAVER' }),
    ).toHaveCount(2);

    // Each in_progress codeweaver row auto-expands and renders its transcript via a
    // `collapseToTail` ChatEntryListWidget, which shows ONLY the most-recent message anchor.
    // So a row that owns a single sub-agent entry shows exactly that entry's text.
    //
    // REGRESSION: both markers must be visible — text-one in the first codeweaver row,
    // text-two in the second. With the bug, the web buckets every sub-agent under the shared
    // parentSessionId, so sessionEntries.get(wi.sessionId) hands BOTH rows the merged union
    // [text-one, text-two]; collapseToTail then shows only the later-arriving marker in BOTH
    // rows, leaving the other marker hidden behind "Show earlier" in BOTH — so exactly one of
    // these two assertions fails (whichever marker sorted earlier).
    await expect(executionPanel.getByText(subagentTextOne).first()).toBeVisible({
      timeout: REPLAY_TEXT_TIMEOUT,
    });
    await expect(executionPanel.getByText(subagentTextTwo).first()).toBeVisible({
      timeout: REPLAY_TEXT_TIMEOUT,
    });
  });
});
