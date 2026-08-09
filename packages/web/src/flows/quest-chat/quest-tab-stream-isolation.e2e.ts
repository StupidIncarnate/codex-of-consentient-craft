import {
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-tab-stream-isolation';
const PANEL_TIMEOUT = 10_000;
const STREAM_TIMEOUT = 20_000;
const SETTLE_TIMEOUT = 8_000;
const TEXT_A = 'Alpha quest is drafting its observables.';
const TEXT_B = 'Beta quest is dispatching a codeweaver.';
const SUBAGENT_TEXT = 'Codeweaver minion reporting from quest Alpha.';
const TASK_PROMPT = 'Build the alpha piece';
const SUBAGENT_AGENT_ID = 'a0a7f82d9619a1801';
const TASK_TOOL_USE_ID = 'toolu_e2e_tab_isolation_task';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Two tabs on one guild each see only their own quest stream', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // Two browser tabs on the same guild are two sockets onto one server, so scoping a stream to the
  // quest it belongs to is the server's job.
  //
  // The frame that matters is one the relay cannot attribute AND that arrives while both tabs are
  // already subscribed. A sub-agent is exactly that shape: its JSONL appears mid-run, and until its
  // agentId is stamped onto a work item the emit carries neither questId nor workItemId. Seeding it
  // BEFORE the tabs subscribe proves nothing — the fan-out loop has no clients to reach, so the bug
  // cannot show.
  test('VALID: {a sub-agent starts on quest A while both tabs are subscribed} => its lines render in tab A only', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });

    const guild = await guilds.createGuild({ name: 'Tab Isolation Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionA = `e2e-tab-iso-a-${Date.now()}`;
    const sessionB = `e2e-tab-iso-b-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionA, userMessage: 'Alpha request' });
    sessions.createSessionFile({ sessionId: sessionB, userMessage: 'Beta request' });

    const createdA = await quests.createQuest({
      guildId: String(guildId),
      title: 'Alpha quest',
      userRequest: 'Alpha request',
    });
    const createdB = await quests.createQuest({
      guildId: String(guildId),
      title: 'Beta quest',
      userRequest: 'Beta request',
    });

    quests.writeQuestFile({
      questId: String(createdA.questId),
      questFolder: String(createdA.questFolder),
      questFilePath: String(createdA.filePath),
      status: 'explore_flows',
      questType: 'bug-hunt',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000aaa1',
          role: 'bughunt',
          sessionId: sessionA,
          status: 'in_progress',
        },
      ],
    });
    quests.writeQuestFile({
      questId: String(createdB.questId),
      questFolder: String(createdB.questFolder),
      questFilePath: String(createdB.filePath),
      status: 'explore_flows',
      questType: 'bug-hunt',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000bbb1',
          role: 'bughunt',
          sessionId: sessionB,
          status: 'in_progress',
        },
      ],
    });

    const tabA = page;
    const tabB = await page.context().newPage();

    await navigationHarness({ page: tabA }).navigateToQuest({
      urlSlug,
      questId: String(createdA.questId),
    });
    await navigationHarness({ page: tabB }).navigateToQuest({
      urlSlug,
      questId: String(createdB.questId),
    });

    await expect(tabA.getByTestId('CHAT_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(tabB.getByTestId('CHAT_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    const lineA = JSON.stringify(
      AssistantTextStreamLineStub({
        message: { role: 'assistant', content: [{ type: 'text', text: TEXT_A }] },
      }),
    );
    const lineB = JSON.stringify(
      AssistantTextStreamLineStub({
        message: { role: 'assistant', content: [{ type: 'text', text: TEXT_B }] },
      }),
    );

    // Both tabs stream their own quest first. That also carries past the window where the relay has
    // not yet learned either work item's quest — the frames that matter come after it.
    await expect
      .poll(
        async () => {
          sessions.appendMainSessionLine({ sessionId: sessionA, line: lineA });
          return tabA.getByText(TEXT_A).first().isVisible();
        },
        { timeout: STREAM_TIMEOUT },
      )
      .toBe(true);

    await expect
      .poll(
        async () => {
          sessions.appendMainSessionLine({ sessionId: sessionB, line: lineB });
          return tabB.getByText(TEXT_B).first().isVisible();
        },
        { timeout: STREAM_TIMEOUT },
      )
      .toBe(true);

    // Quest A dispatches a sub-agent. Claude CLI writes the Task launch into the parent JSONL and
    // the prompt verbatim as line 0 of the sub-agent's own file, which is what pairs the two.
    sessions.appendMainSessionLine({
      sessionId: sessionA,
      line: JSON.stringify(
        AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: TASK_TOOL_USE_ID,
                name: 'Agent',
                input: {
                  description: 'Alpha piece',
                  prompt: TASK_PROMPT,
                  subagent_type: 'general-purpose',
                },
              },
            ],
          },
        }),
      ),
    });

    sessions.createSubagentTailMultiEntry({
      sessionId: sessionA,
      agentId: SUBAGENT_AGENT_ID,
      lines: [
        JSON.stringify(
          UserTextStringStreamLineStub({ message: { role: 'user', content: TASK_PROMPT } }),
        ),
        JSON.stringify(
          AssistantTextStreamLineStub({
            message: { role: 'assistant', content: [{ type: 'text', text: SUBAGENT_TEXT }] },
          }),
        ),
      ],
    });

    await expect(tabA.getByText(SUBAGENT_TEXT).first()).toBeVisible({ timeout: SETTLE_TIMEOUT });
    await expect(tabB.getByText(SUBAGENT_TEXT)).not.toBeVisible({ timeout: SETTLE_TIMEOUT });

    await tabB.close();
  });
});
