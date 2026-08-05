import { AssistantTextStreamLineStub } from '@dungeonmaster/shared/contracts';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-spec-phase-chat-streams';
const PANEL_TIMEOUT = 10_000;
const STREAM_TIMEOUT = 30_000;
const ASSISTANT_TEXT = 'Let me pin the reproduction steps.';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Spec-phase intake conversation streams into the chat panel', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // The reported symptom: `/dumpster-create` and `/dumpster-hunt` open the quest in the browser,
  // the intake conversation runs in the user's terminal, and the chat panel stays empty for the
  // whole thing. The cause was the watcher reactor filtering quests down to
  // approved/design_approved/in_progress, which excludes every spec-phase status — so no tail was
  // ever started for the session the intake work item carries.
  test('VALID: {bug-hunt quest at explore_flows with a live bughunt work item} => assistant lines appended to the session JSONL render in the chat panel', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Spec Phase Chat Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });

    const sessionId = `e2e-spec-phase-chat-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'The rows do not render' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Rows do not render',
      userRequest: 'The rows do not render',
    });
    const { questId, questFolder } = created;

    // A bug-hunt quest mid-intake: still at explore_flows, with its bughunt work item in_progress
    // and carrying the session the user is talking to.
    quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      questType: 'bug-hunt',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000b1',
          role: 'bughunt',
          sessionId,
          status: 'in_progress',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    // The chat panel must be mounted, not suppressed — the intake transcript is the point.
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    const assistantLine = JSON.stringify(
      AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: ASSISTANT_TEXT }],
        },
      }),
    );

    // The watcher tails from `end` and the reactor attaches it on a quest-modified event or its
    // fallback poll, so a single append racing that window would emit nothing. Re-append on each
    // poll instead of sleeping a fixed interval: the first append after the tail attaches streams,
    // and the assertion still fails honestly if the tail never starts at all.
    await expect
      .poll(
        async () => {
          sessions.appendMainSessionLine({ sessionId, line: assistantLine });
          return page.getByText(ASSISTANT_TEXT).first().isVisible();
        },
        { timeout: STREAM_TIMEOUT },
      )
      .toBe(true);
  });
});
