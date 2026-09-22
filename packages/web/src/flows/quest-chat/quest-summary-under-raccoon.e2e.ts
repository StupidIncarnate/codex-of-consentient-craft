import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-summary-under-raccoon';
const PANEL_TIMEOUT = 10_000;
const SUMMARY_REQUEST_TIMEOUT = 15_000;

const WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000a1';
const OPERATION_ID = '00000000-0000-4000-8000-0000000000c1';
const NOTE_WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const DRIFT_OBSERVABLE_TEXT = 'POST /api/auth/login returns 400 for a non-JSON body';
const OPEN_QUESTION_SUMMARY = 'Should the sandbox dev server port be configurable per guild?';

// One runtime flow whose unit set is small enough to count by hand:
//   terminals   = nodes with no outgoing edge          -> `done`                  (1)
//   branches    = edges carrying a non-empty label     -> `start-to-done`         (1)
//   observables = embedded in nodes                    -> `crash-on-bleh`         (1)
//   off-map     = emitted for every flow, always       -> 7 probe families        (7)
//
// `questSummaryBuildTransformer` reads each track's `met`/`cantMeet`/`unmet` off
// `workItem.observations[]`; `outstanding` is the track's denominator minus what it marked.
// Codeweaver's and Flowrider's `unitKinds` cover terminal/branch/observable but both
// `observableOrigins` exclude `siegemaster`, so `crash-on-bleh` drops out of each and their
// denominator is terminal + branch = 2. Siegemaster's `unitKinds` covers all four kinds and its
// `observableOrigins` includes `siegemaster`, so its denominator is the full ten.
//
// This quest's one work item carries no `observations`, so every track's `met`, `cantMeet` and
// `unmet` read 0 and `outstanding` equals the denominator above. `questHarness.writeQuestFile`'s
// `workItems[]` parameter has no `observations` field to seed one through, so this spec cannot
// drive a non-zero `met`/`cantMeet`/`unmet` — a label swap between those three would render
// identically (all "0 …") and pass unseen here; only the denominator/outstanding numbers, which
// differ per track, are load-bearing in this spec.
const SUMMARY_FLOWS = [
  {
    id: 'summary-flow',
    name: 'Summary Flow',
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
            id: 'crash-on-bleh',
            type: 'api-call',
            package: 'auth-service',
            description: DRIFT_OBSERVABLE_TEXT,
            addedBy: 'siegemaster',
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

const SUMMARY_PLANNING_NOTES = {
  blightLedger: [],
  questNotes: [
    {
      id: 'open-question-sandbox-port',
      kind: 'open-question',
      role: 'siegemaster',
      workItemId: NOTE_WORK_ITEM_ID,
      flowId: 'summary-flow',
      summary: OPEN_QUESTION_SUMMARY,
      detail: 'The walk stalled on the bound port; nobody answered before the session ended.',
      at: '2026-01-02T00:00:00.000Z',
    },
  ],
  operationPlans: [],
};

wireHarnessLifecycle({ harness: claudeMockHarness({ guildPath: GUILD_PATH }), testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
wireHarnessLifecycle({ harness: sessionHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Quest summary joins the raccoon in the execution activity column', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {in_progress quest with a siegemaster-added observable and an open question} => the summary renders per-track counts, the drift row, the empty debt section and the open question, with the raccoon still visible', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Summary Under Raccoon Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guilds.extractGuildId({ guild }));

    const created = await quests.createQuest({
      guildId,
      title: 'E2E Summary Under Raccoon Quest',
      userRequest: 'Build the feature',
    });
    const questId = String(created.questId);

    await quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'in_progress',
      flows: SUMMARY_FLOWS,
      planningNotes: SUMMARY_PLANNING_NOTES,
      operations: [
        {
          id: OPERATION_ID,
          role: 'codeweaver',
          text: 'Create the auth broker',
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

    // The raccoon is NOT replaced — the summary joins it in the same column.
    await expect(activity.getByTestId('dumpster-raccoon-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // Real, graph-derived counts. No observations exist on this quest's one work item, so every
    // track reads 0 met / 0 cant-meet / 0 unmet and outstanding equals its own denominator.
    const codeweaverRow = page
      .getByTestId('QUEST_SUMMARY_TRACK_ROW')
      .filter({ hasText: 'CODEWEAVER' });

    await expect(codeweaverRow.getByTestId('QUEST_SUMMARY_TRACK_MET')).toHaveText('0 met');
    await expect(codeweaverRow.getByTestId('QUEST_SUMMARY_TRACK_CANT_MEET')).toHaveText(
      '0 cant-meet',
    );
    await expect(codeweaverRow.getByTestId('QUEST_SUMMARY_TRACK_UNMET')).toHaveText('0 unmet');
    await expect(codeweaverRow.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING')).toHaveText(
      '2 outstanding',
    );

    // Flowrider's denominator on this flow is the terminal + the labelled branch — the
    // siegemaster-added observable drops out on provenance.
    const flowriderRow = page
      .getByTestId('QUEST_SUMMARY_TRACK_ROW')
      .filter({ hasText: 'FLOWRIDER' });

    await expect(flowriderRow.getByTestId('QUEST_SUMMARY_TRACK_MET')).toHaveText('0 met');
    await expect(flowriderRow.getByTestId('QUEST_SUMMARY_TRACK_CANT_MEET')).toHaveText(
      '0 cant-meet',
    );
    await expect(flowriderRow.getByTestId('QUEST_SUMMARY_TRACK_UNMET')).toHaveText('0 unmet');
    await expect(flowriderRow.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING')).toHaveText(
      '2 outstanding',
    );

    // Siegemaster keeps all ten units (off-map families included).
    const siegemasterRow = page
      .getByTestId('QUEST_SUMMARY_TRACK_ROW')
      .filter({ hasText: 'SIEGEMASTER' });

    await expect(siegemasterRow.getByTestId('QUEST_SUMMARY_TRACK_MET')).toHaveText('0 met');
    await expect(siegemasterRow.getByTestId('QUEST_SUMMARY_TRACK_CANT_MEET')).toHaveText(
      '0 cant-meet',
    );
    await expect(siegemasterRow.getByTestId('QUEST_SUMMARY_TRACK_UNMET')).toHaveText('0 unmet');
    await expect(siegemasterRow.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING')).toHaveText(
      '10 outstanding',
    );

    // Scope drift: the observable a Siegemaster walker wrote in after approval, with its author.
    const observableRow = page
      .getByTestId('QUEST_SUMMARY_OBSERVABLE_ROW')
      .filter({ hasText: DRIFT_OBSERVABLE_TEXT });

    await expect(observableRow.getByTestId('QUEST_SUMMARY_OBSERVABLE_ADDED_BY')).toHaveText(
      'added by siegemaster',
    );

    // The debt list holds one entry per (unit, track) marked `cant-meet` or `unmet`. Nothing on
    // this quest carries either mark, so the DEBT section renders its own empty state and no
    // `QUEST_SUMMARY_DEBT_ROW` exists to find.
    await expect(page.getByTestId('QUEST_SUMMARY_DEBT_EMPTY')).toHaveText('every unit is proven');
    await expect(page.getByTestId('QUEST_SUMMARY_DEBT_ROW')).toHaveCount(0);

    // The side-channel open question nobody answered.
    const openQuestionGroup = page
      .getByTestId('QUEST_SUMMARY_NOTE_GROUP')
      .filter({ hasText: 'OPEN-QUESTION' });

    await expect(openQuestionGroup.getByTestId('QUEST_SUMMARY_NOTE_GROUP_TITLE')).toHaveText(
      'OPEN-QUESTION (1)',
    );
    await expect(openQuestionGroup.getByTestId('QUEST_SUMMARY_NOTE_SUMMARY')).toHaveText(
      OPEN_QUESTION_SUMMARY,
    );
  });
});
