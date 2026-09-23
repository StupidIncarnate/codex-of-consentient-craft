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
const SIEGEMASTER_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-0000000000a2';
const OPERATION_ID = '00000000-0000-4000-8000-0000000000c1';
const NOTE_WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const DRIFT_OBSERVABLE_TEXT = 'POST /api/auth/login returns 400 for a non-JSON body';
const OPEN_QUESTION_SUMMARY = 'Should the sandbox dev server port be configurable per guild?';

const CODEWEAVER_TERMINAL_MET_EVIDENCE =
  'packages/auth-service/src/auth-broker.test.ts:12 — asserts the Done state renders after a 200 login response';

const SIEGEMASTER_REENTRY_EVIDENCE =
  'Walked the login flow twice with the same session token; both walks landed on Done with no duplicate side effects.';
const SIEGEMASTER_CONCURRENCY_EVIDENCE =
  'Fired two logins for the same account at once; the second request serialized behind the first with no interleaved state.';
const SIEGEMASTER_INTERRUPTION_EVIDENCE =
  'Killed the dev server mid-login and restarted it; the flow left no partial session behind, but nothing here retries an interrupted network client automatically.';
const SIEGEMASTER_INTERRUPTION_TO_SETTLE =
  'Add a client-side retry so an interrupted login request resumes instead of silently stalling.';
const SIEGEMASTER_STALENESS_EVIDENCE =
  'The login form still accepts a token that expired mid-walk; no session-freshness check runs before Done.';

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
// This quest seeds two work items' `observations[]`:
//   - the CODEWEAVER item marks `summary-flow:terminal:done` — one of the two units codeweaver AND
//     flowrider both measure — `met`. Attribution is per `workItem.role`, so this must move
//     codeweaver's own row (1 met / 1 outstanding) and leave flowrider's alone (still 0 met / 2
//     outstanding) even though the two tracks share that exact unit id.
//   - the SIEGEMASTER item marks four of its ten off-map units: `re-entry` and `concurrency` `met`,
//     `interruption` `cant-meet` (carries `toSettle`), `staleness` `unmet` — distinct non-zero
//     counts on one track (2 met / 1 cant-meet / 1 unmet / 6 outstanding), and the `cant-meet` +
//     `unmet` pair is what populates the DEBT section below.
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

  test('VALID: {in_progress quest with per-track marks, a siegemaster-added observable and an open question} => the summary renders per-track counts attributed to the marking role, the debt rows, the drift row and the open question, with the raccoon still visible', async ({
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
          observations: [
            {
              unitId: 'summary-flow:terminal:done',
              mark: 'met',
              evidence: CODEWEAVER_TERMINAL_MET_EVIDENCE,
              at: '2026-01-03T00:00:00.000Z',
            },
          ],
        },
        // Not linked to any operation item — the quest's ledger seeds only a codeweaver scope, and
        // attribution reads `workItem.role` alone, so a siegemaster row's marks need nothing more
        // than a work item carrying that role.
        {
          id: SIEGEMASTER_WORK_ITEM_ID,
          role: 'siegemaster',
          status: 'complete',
          observations: [
            {
              unitId: 'summary-flow:off-map:re-entry',
              mark: 'met',
              evidence: SIEGEMASTER_REENTRY_EVIDENCE,
              at: '2026-01-03T00:05:00.000Z',
            },
            {
              unitId: 'summary-flow:off-map:concurrency',
              mark: 'met',
              evidence: SIEGEMASTER_CONCURRENCY_EVIDENCE,
              at: '2026-01-03T00:06:00.000Z',
            },
            {
              unitId: 'summary-flow:off-map:interruption',
              mark: 'cant-meet',
              evidence: SIEGEMASTER_INTERRUPTION_EVIDENCE,
              toSettle: SIEGEMASTER_INTERRUPTION_TO_SETTLE,
              at: '2026-01-03T00:07:00.000Z',
            },
            {
              unitId: 'summary-flow:off-map:staleness',
              mark: 'unmet',
              evidence: SIEGEMASTER_STALENESS_EVIDENCE,
              at: '2026-01-03T00:08:00.000Z',
            },
          ],
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

    // Real, graph-derived counts. The codeweaver work item marks `summary-flow:terminal:done`
    // `met`, so codeweaver's row (denominator 2: terminal + labelled branch) reads 1 met / 1
    // outstanding — asserting both the testid AND the exact text on each of the four counts, so a
    // label swap between met/cant-meet/unmet/outstanding is caught on the SAME assertion that
    // catches a wrong count.
    const codeweaverRow = page
      .getByTestId('QUEST_SUMMARY_TRACK_ROW')
      .filter({ hasText: 'CODEWEAVER' });

    await expect(codeweaverRow.getByTestId('QUEST_SUMMARY_TRACK_MET')).toHaveText('1 met');
    await expect(codeweaverRow.getByTestId('QUEST_SUMMARY_TRACK_CANT_MEET')).toHaveText(
      '0 cant-meet',
    );
    await expect(codeweaverRow.getByTestId('QUEST_SUMMARY_TRACK_UNMET')).toHaveText('0 unmet');
    await expect(codeweaverRow.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING')).toHaveText(
      '1 outstanding',
    );

    // Flowrider's denominator on this flow is the SAME two units codeweaver's row just counted —
    // the terminal + the labelled branch (the siegemaster-added observable drops out on
    // provenance) — yet flowrider's row must stay 0 met / 2 outstanding. Marks attribute per
    // `workItem.role`: the codeweaver item's `met` on `summary-flow:terminal:done` must not leak
    // onto flowrider's row for that identical unit id.
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

    // Siegemaster's work item marks 4 of its 10 units (off-map families included): 2 met
    // (re-entry, concurrency), 1 cant-meet (interruption), 1 unmet (staleness) — distinct non-zero
    // counts on every one of the four testids, leaving 6 outstanding.
    const siegemasterRow = page
      .getByTestId('QUEST_SUMMARY_TRACK_ROW')
      .filter({ hasText: 'SIEGEMASTER' });

    await expect(siegemasterRow.getByTestId('QUEST_SUMMARY_TRACK_MET')).toHaveText('2 met');
    await expect(siegemasterRow.getByTestId('QUEST_SUMMARY_TRACK_CANT_MEET')).toHaveText(
      '1 cant-meet',
    );
    await expect(siegemasterRow.getByTestId('QUEST_SUMMARY_TRACK_UNMET')).toHaveText('1 unmet');
    await expect(siegemasterRow.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING')).toHaveText(
      '6 outstanding',
    );

    // Scope drift: the observable a Siegemaster walker wrote in after approval, with its author.
    const observableRow = page
      .getByTestId('QUEST_SUMMARY_OBSERVABLE_ROW')
      .filter({ hasText: DRIFT_OBSERVABLE_TEXT });

    await expect(observableRow.getByTestId('QUEST_SUMMARY_OBSERVABLE_ADDED_BY')).toHaveText(
      'added by siegemaster',
    );

    // The debt list holds one entry per (unit, track) marked `cant-meet` or `unmet` — siegemaster's
    // two non-met marks, and nothing from codeweaver's `met` mark. Two rows, not the empty state.
    await expect(page.getByTestId('QUEST_SUMMARY_DEBT_EMPTY')).toHaveCount(0);
    await expect(page.getByTestId('QUEST_SUMMARY_DEBT_ROW')).toHaveCount(2);

    const cantMeetDebtRow = page
      .getByTestId('QUEST_SUMMARY_DEBT_ROW')
      .filter({ hasText: 'summary-flow:off-map:interruption' });

    await expect(cantMeetDebtRow.getByTestId('QUEST_SUMMARY_DEBT_UNIT')).toHaveText(
      '[cant-meet] [siegemaster] summary-flow:off-map:interruption',
    );
    await expect(cantMeetDebtRow.getByTestId('QUEST_SUMMARY_DEBT_EVIDENCE')).toHaveText(
      SIEGEMASTER_INTERRUPTION_EVIDENCE,
    );
    await expect(cantMeetDebtRow.getByTestId('QUEST_SUMMARY_DEBT_TO_SETTLE')).toHaveText(
      `→ ${SIEGEMASTER_INTERRUPTION_TO_SETTLE}`,
    );
    await expect(cantMeetDebtRow.getByTestId('QUEST_SUMMARY_DEBT_SUCCESSOR')).toHaveCount(0);

    const unmetDebtRow = page
      .getByTestId('QUEST_SUMMARY_DEBT_ROW')
      .filter({ hasText: 'summary-flow:off-map:staleness' });

    await expect(unmetDebtRow.getByTestId('QUEST_SUMMARY_DEBT_UNIT')).toHaveText(
      '[unmet] [siegemaster] summary-flow:off-map:staleness',
    );
    await expect(unmetDebtRow.getByTestId('QUEST_SUMMARY_DEBT_EVIDENCE')).toHaveText(
      SIEGEMASTER_STALENESS_EVIDENCE,
    );
    await expect(unmetDebtRow.getByTestId('QUEST_SUMMARY_DEBT_SUCCESSOR')).toHaveText(
      '→ nothing hands this over; a successor is owed the work',
    );
    await expect(unmetDebtRow.getByTestId('QUEST_SUMMARY_DEBT_TO_SETTLE')).toHaveCount(0);

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
