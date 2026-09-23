import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-execution-row-rework-readout';
const PANEL_TIMEOUT = 10_000;

const CODEWEAVER_OP = '00000000-0000-4000-8000-0000000000e1';
const OPERATION_TEXT = 'Build login broker';

const U1 = 'harness-flow:observable:scan-finds-every-path';
const U2 = 'harness-flow:terminal:end';

const WI_PLAN = 'e2e00000-0000-4000-8000-000000000041';
const WI_WORK_1 = 'e2e00000-0000-4000-8000-000000000042';
const WI_WORK_2 = 'e2e00000-0000-4000-8000-000000000043';
const WI_REVIEW = 'e2e00000-0000-4000-8000-000000000044';
const WI_WORK_3 = 'e2e00000-0000-4000-8000-000000000045';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// A rework loop seeded straight to disk — no dispatch, no drive. `writeQuestFile` needs
// `assignedUnitIds`/`mintedBy` (this spec's own harness extension) to reproduce the shape a REAL
// `work -> review -> work` loop leaves on a scope: two units, each marked by more than one work
// item, and a `work` step repeated (once complete, once still running) so the panel's own tiering
// numbers them `work pt: N` rather than by the bare step name.
test.describe('Execution row rework readout: unit marks, unmet list, scope churn, step counter', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {seeded rework — plan, work×2 (met+unmet), review, work in-progress} => unit-marks readout, unmet list, scope churn and step counter all read off the real work-item history', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Rework Readout Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const created = await quests.createQuest({
      guildId,
      title: 'Rework Readout Quest',
      userRequest: 'Build the feature',
    });
    const { questId, questFolder } = created;
    const questFilePath = created.filePath;

    await quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(questFilePath),
      status: 'in_progress',
      flows: [
        {
          id: 'harness-flow',
          name: 'Harness Flow',
          flowType: 'runtime',
          entryPoint: 'start',
          exitPoints: ['end'],
          nodes: [
            {
              id: 'start',
              label: 'Start',
              type: 'state',
              packages: ['auth-service'],
              observables: [],
            },
            {
              id: 'end',
              label: 'End',
              type: 'terminal',
              packages: ['auth-service'],
              observables: [
                {
                  id: 'scan-finds-every-path',
                  type: 'api-call',
                  description: 'Scan finds every path',
                  package: 'auth-service',
                },
              ],
            },
          ],
          edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
        },
      ],
      operations: [
        {
          id: CODEWEAVER_OP,
          role: 'codeweaver',
          text: OPERATION_TEXT,
          status: 'in_progress',
        },
      ],
      workItems: [
        {
          id: WI_PLAN,
          role: 'codeweaver',
          step: 'plan',
          status: 'complete',
          relatedDataItems: [`operations/${CODEWEAVER_OP}`],
        },
        {
          id: WI_WORK_1,
          role: 'codeweaver',
          step: 'work',
          status: 'complete',
          relatedDataItems: [`operations/${CODEWEAVER_OP}`],
          assignedUnitIds: [U1, U2],
          observations: [
            { unitId: U1, mark: 'unmet', evidence: 'scan skips dotfiles' },
            { unitId: U2, mark: 'met', evidence: 'harness-flow reaches end on every path' },
          ],
        },
        {
          id: WI_WORK_2,
          role: 'codeweaver',
          step: 'work',
          status: 'complete',
          relatedDataItems: [`operations/${CODEWEAVER_OP}`],
          assignedUnitIds: [U1],
          observations: [{ unitId: U1, mark: 'met', evidence: 'scan now walks dotfiles too' }],
          mintedBy: WI_WORK_1,
        },
        {
          id: WI_REVIEW,
          role: 'codeweaver',
          step: 'review',
          status: 'complete',
          relatedDataItems: [`operations/${CODEWEAVER_OP}`],
          assignedUnitIds: [U1, U2],
          observations: [
            { unitId: U1, mark: 'unmet', evidence: 'scan misses nested dirs' },
            { unitId: U2, mark: 'met', evidence: 'harness-flow still reaches end' },
          ],
        },
        {
          id: WI_WORK_3,
          role: 'codeweaver',
          step: 'work',
          status: 'in_progress',
          relatedDataItems: [`operations/${CODEWEAVER_OP}`],
          assignedUnitIds: [U1],
          mintedBy: WI_REVIEW,
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const rows = executionPanel.getByTestId('execution-row-layer-widget');
    // The scope holds five visible work items, so it grows an operation HEADER plus one nested row
    // per step: `plan`, `work pt: 1`, `work pt: 2`, `review`, `work pt: 3` — `work` is the only step
    // repeated in the scope, and with no `pieceId` its three items are numbered in array order.
    await expect(rows).toHaveCount(6, { timeout: PANEL_TIMEOUT });

    const workPt1Row = rows.filter({
      has: page.getByTestId('execution-row-name').getByText('work pt: 1', { exact: true }),
    });
    const workPt2Row = rows.filter({
      has: page.getByTestId('execution-row-name').getByText('work pt: 2', { exact: true }),
    });
    const workPt3Row = rows.filter({
      has: page.getByTestId('execution-row-name').getByText('work pt: 3', { exact: true }),
    });
    const reviewRow = rows.filter({
      has: page.getByTestId('execution-row-name').getByText('review', { exact: true }),
    });
    const headerRow = rows.filter({
      has: page.getByTestId('execution-row-name').getByText(OPERATION_TEXT, { exact: true }),
    });

    // Unmet list and unit marks: expand `work pt: 1`.
    await workPt1Row.getByTestId('execution-row-header').click();
    await expect(workPt1Row.getByTestId('execution-row-unit-marks-summary')).toHaveText(
      'Units: 2/2 marked',
    );
    await expect(workPt1Row.getByTestId('execution-row-unit-mark')).toHaveText(`[met] ${U2}`);
    await expect(workPt1Row.getByTestId('execution-row-unmet-observation')).toHaveText(
      `[unmet] ${U1}: scan skips dotfiles`,
    );

    // Expand `work pt: 3` — assigned one unit, marked by nothing yet.
    await workPt3Row.getByTestId('execution-row-header').click();
    await expect(workPt3Row.getByTestId('execution-row-unit-marks-summary')).toHaveText(
      'Units: 0/1 marked',
    );
    await expect(workPt3Row.getByTestId('execution-row-unit-mark')).toHaveText(`[unmarked] ${U1}`);
    await expect(workPt3Row.getByTestId('execution-row-unmet-observation')).toHaveCount(0);

    // Badges: `work pt: 2` returns to the `work pt: 1` row that minted it; `work pt: 3` returns to
    // `review`.
    await expect(workPt2Row.getByTestId('execution-row-minted-by-badge')).toHaveText(
      '↩ work pt: 1',
    );
    await expect(workPt3Row.getByTestId('execution-row-minted-by-badge')).toHaveText('↩ review');

    // Scope churn: click the header row to expand it and read the whole-scope sequence neither
    // single work item's own readout can show.
    await headerRow.getByTestId('execution-row-header').click();
    await expect(headerRow.getByTestId('execution-row-scope-churn-entry')).toHaveText([
      `${U1}: unmet (work) → met (work) → unmet (review)`,
      `${U2}: met (work) → met (review)`,
    ]);

    // Step counter: the projection's own step walk (5 actual steps, 4 of them complete, plus the
    // 3 still ahead: review, commit, ward), not the ledger's `N/M OPERATIONS` fallback.
    await expect(executionPanel.getByTestId('execution-status-bar-layer-widget')).toHaveText(
      /^EXECUTION\s*4\/8 STEPS$/u,
    );
    await expect(executionPanel.getByText('AWAITING PLAN')).not.toBeVisible();

    // reviewRow is read (not just declared) so a future edit that drops the `review` tier label is
    // caught here rather than only by the churn/badge assertions above.
    await expect(reviewRow.getByTestId('execution-row-status-badge')).toHaveText('DONE');
  });
});
