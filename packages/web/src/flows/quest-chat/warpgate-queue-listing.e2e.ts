import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-warpgate-queue-listing';
const PANEL_TIMEOUT = 10_000;
const QUEUE_TIMEOUT = 10_000;
const HTTP_OK = 200;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('A merging quest is listed in the cross-guild execution queue', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {one quest paused mid-relay, one quest merging} => the queue bar lists BOTH, not just the paused one', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Queue Listing Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Quest A: enqueued via the real Start API, then paused so it stays enqueued for the
    // duration of the test — the SECOND quest a non-vacuous "is X listed" check needs, per
    // execution-queue-streaming.e2e.ts's own pattern for keeping an entry stable.
    const sessionIdA = `e2e-queue-a-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionIdA, userMessage: 'Build the feature' });
    const createdA = await quests.createQuest({
      guildId,
      title: 'Queue Listing Quest A',
      userRequest: 'Build the feature',
    });
    const questIdA = String(createdA.questId);
    quests.writeQuestFile({
      questId: questIdA,
      questFolder: String(createdA.questFolder),
      questFilePath: String(createdA.filePath),
      title: 'Queue Listing Quest A',
      // Seeded straight to `paused` rather than driven through POST /start + POST /pause.
      // Quest A is PRECONDITION state — the second queue entry that keeps this test's "lists
      // BOTH" assertion non-vacuous — not the mutation under test, which is quest B's real
      // merge below. Driving /start here would also make this spec depend on the worktree
      // lifecycle: Start now probes for a local main/master at the guild path, and the e2e
      // guild path is a plain directory with no git repo, so /start answers
      // 400 {"error":"No local main or master branch found"} and the quest never leaves
      // `approved` — a status that renders no execution panel at all.
      status: 'paused',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000a01',
          role: 'chaoswhisperer',
          sessionId: sessionIdA,
        },
      ],
      operations: [
        {
          id: '00000000-0000-4000-8000-000000000a02',
          role: 'codeweaver',
          text: 'core: build the feature',
          status: 'pending',
        },
      ],
    });

    // Quest B: enqueued via Start, then driven to `blocked` (which the queue's own sync
    // listener removes it for), then merged for real via the Merge route — the same
    // OrchestrationMergeResponder the UI's Teleport with Booty button calls.
    const sessionIdB = `e2e-queue-b-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionIdB, userMessage: 'Build the feature' });
    const createdB = await quests.createQuest({
      guildId,
      title: 'Queue Listing Quest B',
      userRequest: 'Build the feature',
    });
    const questIdB = String(createdB.questId);
    const questFolderB = String(createdB.questFolder);
    const questFilePathB = String(createdB.filePath);
    quests.writeQuestFile({
      questId: questIdB,
      questFolder: questFolderB,
      questFilePath: questFilePathB,
      title: 'Queue Listing Quest B',
      status: 'approved',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000b01',
          role: 'chaoswhisperer',
          sessionId: sessionIdB,
        },
      ],
      operations: [
        {
          id: '00000000-0000-4000-8000-000000000b02',
          role: 'codeweaver',
          text: 'core: build the feature',
          status: 'pending',
        },
      ],
    });
    await request.post(`/api/quests/${questIdB}/start`);

    quests.writeQuestFile({
      questId: questIdB,
      questFolder: questFolderB,
      questFilePath: questFilePathB,
      title: 'Queue Listing Quest B',
      status: 'blocked',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000b01',
          role: 'chaoswhisperer',
          sessionId: sessionIdB,
        },
      ],
    });

    const mergeResponse = await request.post(`/api/quests/${questIdB}/merge`);
    expect(mergeResponse.status()).toBe(HTTP_OK);
    const mergeBody = await mergeResponse.json();
    expect(mergeBody).toStrictEqual({ merging: true });

    const afterMergeResponse = await request.get(`/api/quests/${questIdB}`);
    const afterMergeBody = await afterMergeResponse.json();
    expect(afterMergeBody.quest.status).toBe('merging');

    // Quest C: seeded straight to `blocked` — mergeable (its own Merge button would render) but
    // NOT queueable (isAnyAgentRunning: false, isUserPaused: false on `blocked`), so it must be
    // ABSENT from the queue bar. Without this quest the suite above only proves "the rows I expect
    // render", never that the bar filters by queueable status rather than listing every
    // non-terminal quest — a bug that renders every quest would pass a suite that only checks rows
    // A and B are present.
    const createdC = await quests.createQuest({
      guildId,
      title: 'Queue Listing Quest C',
      userRequest: 'Build the feature',
    });
    const questIdC = String(createdC.questId);
    quests.writeQuestFile({
      questId: questIdC,
      questFolder: String(createdC.questFolder),
      questFilePath: String(createdC.filePath),
      title: 'Queue Listing Quest C',
      status: 'blocked',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000c01',
          role: 'codeweaver',
          status: 'skipped',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: questIdA });
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    const queueBar = page.getByTestId('QUEST_QUEUE_BAR');
    await expect(queueBar).toBeVisible({ timeout: QUEUE_TIMEOUT });
    await page.getByTestId('QUEST_QUEUE_BAR_TOGGLE').click();

    const rowA = page.getByTestId(`QUEST_QUEUE_BAR_ROW_${questIdA.toUpperCase()}`);
    const rowB = page.getByTestId(`QUEST_QUEUE_BAR_ROW_${questIdB.toUpperCase()}`);

    // The paused quest proves the queue is non-empty and the row selector is real (a typo'd
    // testid would fail THIS assertion too, not just the merging one below).
    await expect(rowA).toBeVisible({ timeout: QUEUE_TIMEOUT });

    // FAILS IF the merging quest's row never appears — it is `isAnyAgentRunning: true` and the
    // flow's own observable says a merging quest belongs in this same execution queue.
    await expect(rowB).toBeVisible({ timeout: QUEUE_TIMEOUT });

    const rowC = page.getByTestId(`QUEST_QUEUE_BAR_ROW_${questIdC.toUpperCase()}`);

    // FAILS IF the bar renders every non-terminal quest instead of filtering by queueable status —
    // rows A and B just proved the selector CAN find a real row, so this absence is not a vacuous
    // "the selector never matches anything" false pass; a `blocked` quest earning a row here would
    // mean the bar is not actually keyed on isAnyAgentRunning/isUserPaused at all.
    await expect(rowC).not.toBeVisible();
  });
});
