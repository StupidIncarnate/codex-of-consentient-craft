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
const SIGNOFF_WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const UNCONFIRMABLE_REASON =
  'the sandbox refuses to bind port 3737, so no browser can reach the app';
const UNCONFIRMABLE_QUESTION = 'Which port should the sandbox dev server use?';
const DRIFT_OBSERVABLE_TEXT = 'POST /api/auth/login returns 400 for a non-JSON body';
const OPEN_QUESTION_SUMMARY = 'Should the sandbox dev server port be configurable per guild?';

// One runtime flow whose unit set is small enough to count by hand:
//   terminals   = nodes with no outgoing edge          -> `done`                  (1)
//   branches    = edges carrying a non-empty label     -> `start-to-done`         (1)
//   observables = embedded in nodes                    -> `crash-on-bleh`         (1)
//   off-map     = emitted for every flow, always       -> 7 probe families        (7)
// Flowrider measures runtime flows but sheds the off-map families AND anything
// `addedBy: 'siegemaster'`, leaving the terminal (confirmed) + the branch (outstanding).
// Siegemaster measures all ten, of which the terminal is unconfirmable and nine are outstanding.
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
        observables: [
          {
            id: 'crash-on-bleh',
            type: 'api-call',
            description: DRIFT_OBSERVABLE_TEXT,
            addedBy: 'siegemaster',
          },
        ],
      },
      {
        id: 'done',
        label: 'Done',
        type: 'terminal',
        observables: [],
        flowriderSignoff: {
          verdict: 'confirmed',
          evidence: 'packages/web/src/flows/login/login.e2e.ts:31 — red without the redirect',
          workItemId: SIGNOFF_WORK_ITEM_ID,
          at: '2026-01-01T00:00:00.000Z',
        },
        siegemasterSignoff: {
          verdict: 'unconfirmable',
          evidence: UNCONFIRMABLE_REASON,
          question: UNCONFIRMABLE_QUESTION,
          workItemId: SIGNOFF_WORK_ITEM_ID,
          at: '2026-01-02T00:00:00.000Z',
        },
      },
    ],
    edges: [{ id: 'start-to-done', from: 'start', to: 'done', label: 'success' }],
  },
];

const SUMMARY_PLANNING_NOTES = {
  blightReports: [],
  qaLedger: [],
  blightLedger: [],
  questNotes: [
    {
      id: 'open-question-sandbox-port',
      kind: 'open-question',
      role: 'siegemaster',
      workItemId: SIGNOFF_WORK_ITEM_ID,
      flowId: 'summary-flow',
      summary: OPEN_QUESTION_SUMMARY,
      detail: 'The walk stalled on the bound port; nobody answered before the session ended.',
      at: '2026-01-02T00:00:00.000Z',
    },
  ],
};

wireHarnessLifecycle({ harness: claudeMockHarness({ guildPath: GUILD_PATH }), testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
wireHarnessLifecycle({ harness: sessionHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Quest summary joins the raccoon in the execution activity column', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {in_progress quest with a signed terminal, a siegemaster-added observable and an open question} => the summary renders per-track counts, the drift row, the unconfirmable reason and its question, with the raccoon still visible', async ({
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

    quests.writeQuestFile({
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

    // Real, graph-derived counts: Flowrider's denominator on this flow is the terminal + the
    // labelled branch, and only the terminal carries a Flowrider verdict.
    const flowriderRow = page
      .getByTestId('QUEST_SUMMARY_TRACK_ROW')
      .filter({ hasText: 'FLOWRIDER' });

    await expect(flowriderRow.getByTestId('QUEST_SUMMARY_TRACK_CONFIRMED')).toHaveText(
      '1 confirmed',
    );
    await expect(flowriderRow.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING')).toHaveText(
      '1 outstanding',
    );

    // Siegemaster keeps all ten units (off-map families included), one of which is unconfirmable.
    const siegemasterRow = page
      .getByTestId('QUEST_SUMMARY_TRACK_ROW')
      .filter({ hasText: 'SIEGEMASTER' });

    await expect(siegemasterRow.getByTestId('QUEST_SUMMARY_TRACK_UNCONFIRMABLE')).toHaveText(
      '1 unconfirmable',
    );
    await expect(siegemasterRow.getByTestId('QUEST_SUMMARY_TRACK_OUTSTANDING')).toHaveText(
      '9 outstanding',
    );

    // Scope drift: the observable a Siegemaster walker wrote in after approval, with its author.
    const observableRow = page
      .getByTestId('QUEST_SUMMARY_OBSERVABLE_ROW')
      .filter({ hasText: DRIFT_OBSERVABLE_TEXT });

    await expect(observableRow.getByTestId('QUEST_SUMMARY_OBSERVABLE_ADDED_BY')).toHaveText(
      'added by siegemaster',
    );

    // The debt the completion gate let through, carrying the reason AND the routable question.
    const unconfirmableRow = page
      .getByTestId('QUEST_SUMMARY_UNCONFIRMABLE_ROW')
      .filter({ hasText: 'summary-flow:terminal:done' });

    await expect(unconfirmableRow.getByTestId('QUEST_SUMMARY_UNCONFIRMABLE_REASON')).toHaveText(
      UNCONFIRMABLE_REASON,
    );
    await expect(unconfirmableRow.getByTestId('QUEST_SUMMARY_UNCONFIRMABLE_QUESTION')).toHaveText(
      `? ${UNCONFIRMABLE_QUESTION}`,
    );

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
