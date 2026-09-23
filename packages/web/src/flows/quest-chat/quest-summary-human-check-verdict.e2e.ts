import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-summary-human-check';
const PANEL_TIMEOUT = 10_000;
const SUMMARY_REQUEST_TIMEOUT = 15_000;
const VERDICT_REQUEST_TIMEOUT = 15_000;

const WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000b1';
const OPERATION_ID = '00000000-0000-4000-8000-0000000000c2';

// The RAW observable id — what the summary's `humanChecks` entry carries as `observableId` and
// what the browser POSTs as `unitId`, never the derived `<flowId>:observable:<id>` checklist id.
const CRITERION_ID = 'transition-feels-smooth';
const CRITERION_DESCRIPTION = 'the dungeon-raid transition never stutters';
const VERDICT_REASON = 'Watched the raid transition twice; it stutters on the third frame.';

// One flow carrying a single `verifyByHuman` observable — no track ever counts it, so nothing in
// this quest's ledger needs to settle it for the summary to render the section.
const HUMAN_CHECK_FLOWS = [
  {
    id: 'raid-transition-flow',
    name: 'Raid Transition Flow',
    flowType: 'runtime',
    entryPoint: 'start',
    exitPoints: ['done'],
    nodes: [
      {
        id: 'start',
        label: 'Start',
        type: 'state',
        packages: ['auth-service'],
        observables: [
          {
            id: CRITERION_ID,
            type: 'ui-state',
            package: 'auth-service',
            description: CRITERION_DESCRIPTION,
            verifyByHuman: true,
          },
        ],
      },
      {
        id: 'done',
        label: 'Done',
        type: 'terminal',
        packages: ['auth-service'],
        observables: [],
      },
    ],
    edges: [{ id: 'start-to-done', from: 'start', to: 'done', label: 'success' }],
  },
];

wireHarnessLifecycle({ harness: claudeMockHarness({ guildPath: GUILD_PATH }), testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
wireHarnessLifecycle({ harness: sessionHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('A verifyByHuman criterion is judged from the summary panel', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {verifyByHuman observable with no verdict yet} => the summary lists it unjudged, and submitting NOT MET with a reason records it live', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Human Check Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guilds.extractGuildId({ guild }));

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Human Check Quest',
      userRequest: 'Ship the raid transition',
    });
    const questId = String(created.questId);

    await quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'in_progress',
      flows: HUMAN_CHECK_FLOWS,
      operations: [
        {
          id: OPERATION_ID,
          role: 'codeweaver',
          text: 'Build the raid transition',
          status: 'in_progress',
        },
      ],
      workItems: [
        {
          id: WORK_ITEM_ID,
          role: 'codeweaver',
          status: 'pending',
          relatedDataItems: [`operations/${OPERATION_ID}`],
        },
      ],
    });

    // Observed, never intercepted: the browser must really ask the server for the summary.
    const summaryRequestPromise = page.waitForRequest(
      (req) => req.method() === 'GET' && req.url().includes(`/api/quests/${questId}/summary`),
      { timeout: SUMMARY_REQUEST_TIMEOUT },
    );

    await nav.navigateToQuest({ urlSlug: String(guilds.extractUrlSlug({ guild })), questId });

    await summaryRequestPromise;

    const activity = page.getByTestId('QUEST_CHAT_ACTIVITY');
    await expect(activity.getByTestId('QUEST_SUMMARY')).toBeVisible({ timeout: PANEL_TIMEOUT });

    const row = page.getByTestId('HUMAN_CHECK_ROW');
    await expect(row.getByTestId('HUMAN_CHECK_DESCRIPTION')).toHaveText(CRITERION_DESCRIPTION);
    await expect(row.getByTestId('HUMAN_CHECK_VERDICT')).toHaveCount(0);

    await row.getByTestId('HUMAN_CHECK_REASON').fill(VERDICT_REASON);

    const verdictRequestPromise = page.waitForRequest(
      (req) =>
        req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/human-verdict`),
      { timeout: VERDICT_REQUEST_TIMEOUT },
    );

    await row.getByTestId('PIXEL_BTN').filter({ hasText: 'NOT MET' }).click();

    const verdictRequest = await verdictRequestPromise;
    expect(verdictRequest.postDataJSON()).toStrictEqual({
      unitId: CRITERION_ID,
      outcome: 'not-met',
      reason: VERDICT_REASON,
    });

    // Old UI (the reason field and its MET / NOT MET controls) is gone, and the new UI (the
    // recorded verdict) is present — driven live by the `quest-modified` broadcast the verdict
    // write triggers, not by a reload.
    await expect(row.getByTestId('HUMAN_CHECK_REASON')).toHaveCount(0);
    await expect(row.getByTestId('HUMAN_CHECK_VERDICT')).toHaveText(`[not-met] ${VERDICT_REASON}`);
  });
});
