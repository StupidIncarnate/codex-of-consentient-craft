import { DesignDecisionStub, ToolingRequirementStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import {
  claudeMockHarness,
  ClarificationResponseStub,
} from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { questSpecReadonlyHarness } from '../../../test/harnesses/quest-spec-readonly/quest-spec-readonly.harness';

// Covers flow #remove-spec-panel-edit-mode's surviving-surface observables: the MODIFY/SUBMIT/CANCEL
// deletion itself is proven by source-tree grep (no test needed — see the flowrider commit handoff),
// but the seven surfaces the deletion was explicitly scoped to LEAVE ALONE are browser claims and
// need real coverage. APPROVE-still-patches, CHAT_INPUT, the new-guild form, the quest delete
// popover, and flow-tab switching are already covered by other flows' suites (operations-approval-
// gate.e2e.ts, quest-begin-transition.e2e.ts, guild-creation.e2e.ts, quest-delete-from-root.e2e.ts,
// flow-diagram-interaction.e2e.ts) — this file only adds what nothing else covers.
const GUILD_PATH = '/tmp/dm-e2e-spec-panel-edit-mode-removed';
const PANEL_TIMEOUT = 10_000;
const CLARIFY_TIMEOUT = 10_000;

// A 140-char unbroken token (no space/hyphen break opportunity) plus markup-shaped rationale text —
// proves the read-only list renders adversarial content verbatim instead of truncating or executing
// it. Reused for both a design decision and a tooling entry so the fixture exercises the same hostile
// shape in both PlanSectionWidget-backed lists.
const HOSTILE_TOKEN = `Zx${'q'.repeat(138)}`;
const HOSTILE_RATIONALE = 'Markup probe: <script>alert("rspem-xss")</script> and a bare --- marker';

// Derived from the canonical statics — never hardcoded — so a newly added quest status is picked up
// automatically instead of silently going untested. Mirrors the pattern in
// pause-resume-status-matrix.e2e.ts: one statics source drives both the iteration list and the
// expected-subset membership.
type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
const ALL_STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];
// QuestSpecPanelWidget (and its ACTION_BAR) only mounts via the non-execution-phase branch of
// QuestChatContentLayerWidget. The 5 execution-phase statuses render QuestSpecPanelWidget readOnly,
// nested one tab-click deep inside ExecutionPanelWidget — a different widget's own navigation surface,
// out of this flow's scope. See MISSING COVERAGE in the audit report for that gap.
const NON_EXECUTION_STATUSES = ALL_STATUSES.filter(
  (status) => !questStatusMetadataStatics.statuses[status].shouldRenderExecutionPanel,
);
const ACTION_BAR_APPROVE_STATUSES = NON_EXECUTION_STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].nextApprovalStatus !== null,
);
const ACTION_BAR_EMPTY_STATUSES = NON_EXECUTION_STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].nextApprovalStatus === null,
);

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Spec panel edit mode removed — surviving surfaces stay intact', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: quest at review_design renders static QUEST_TITLE, ABANDON_BAR, scoped design-decisions and tooling read-mode lists, and ACTION_BAR with only APPROVE', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const specReadonly = questSpecReadonlyHarness();
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Edit Mode Removed Guild', path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const created = await quests.createQuest({
      guildId: String(guild.id),
      title: 'Surviving Surfaces Quest',
      userRequest: 'Prove the deleted edit mode left everything else standing',
    });

    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      title: 'Surviving Surfaces Quest',
      status: 'review_design',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', status: 'complete' },
      ],
    });

    // Fixture requirement: THREE of each — a plain entry, a HOSTILE entry (140-char unbroken token +
    // markup-shaped rationale, proving no truncation/escaping regression), and a DUPLICATE entry
    // sharing entry 1's title/name with a different rationale/package (proving items are matched by
    // index/identity, not by "the only one with that name"). Two benign entries alone can't
    // distinguish "the right one" from "the first one"; this can't pass by luck on a wrongly-scoped
    // selector OR a wrongly-ordered render either.
    specReadonly.seedDesignDecisionsAndTooling({
      questFilePath: String(created.filePath),
      designDecisions: [
        DesignDecisionStub({
          id: 'dd-first-decision',
          title: 'First Design Decision',
          rationale: 'First rationale text',
        }),
        DesignDecisionStub({
          id: 'dd-hostile-decision',
          title: HOSTILE_TOKEN,
          rationale: HOSTILE_RATIONALE,
        }),
        DesignDecisionStub({
          id: 'dd-duplicate-decision',
          title: 'First Design Decision',
          rationale: 'Duplicate rationale text',
        }),
      ],
      toolingRequirements: [
        ToolingRequirementStub({
          id: 'tool-first-entry',
          name: 'First Tool',
          packageName: 'first-package',
          reason: 'First reason',
        }),
        ToolingRequirementStub({
          id: 'tool-hostile-entry',
          name: HOSTILE_TOKEN,
          packageName: 'hostile-package',
          reason: HOSTILE_RATIONALE,
        }),
        ToolingRequirementStub({
          id: 'tool-duplicate-entry',
          name: 'First Tool',
          packageName: 'duplicate-package',
          reason: 'Duplicate reason',
        }),
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const specPanel = page.getByTestId('QUEST_SPEC_PANEL');
    await expect(specPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Title survives as static text — no input, no onTitleChange (the deleted title FormInputWidget).
    await expect(specPanel.getByTestId('QUEST_TITLE_BAR').getByTestId('QUEST_TITLE')).toHaveText(
      'Surviving Surfaces Quest',
    );

    // The abandon confirm bar is explicitly NOT part of the deleted edit mode — still renders.
    const abandonBar = specPanel.getByTestId('QUEST_TITLE_BAR').getByTestId('ABANDON_BAR');
    await expect(abandonBar.getByTestId('PIXEL_BTN')).toHaveText(['ABANDON QUEST']);

    // Design decisions read-mode list, scoped to its OWN layer container — PLAN_SECTION and
    // PIXEL_BTN are single unscoped testids shared with the tooling layer below, so an unscoped
    // selector here would silently read the wrong section's items.
    const designDecisionsLayer = specPanel.getByTestId('DESIGN_DECISIONS_LAYER');
    await expect(designDecisionsLayer.getByTestId('PLAN_SECTION')).toHaveCount(1);
    // Section label + live count, asserted verbatim — SECTION_HEADER_LABEL and SECTION_HEADER_COUNT
    // are adjacent text nodes with no literal space between them in JSX, so the real rendered text is
    // the label and "(N)" glued together with no separator.
    await expect(designDecisionsLayer.getByTestId('SECTION_HEADER')).toHaveText(
      'DESIGN DECISIONS(3)',
    );
    await expect(designDecisionsLayer.getByTestId('DECISION_TITLE')).toHaveText([
      'First Design Decision',
      HOSTILE_TOKEN,
      'First Design Decision',
    ]);
    await expect(designDecisionsLayer.getByTestId('DECISION_RATIONALE')).toHaveText([
      'First rationale text',
      HOSTILE_RATIONALE,
      'Duplicate rationale text',
    ]);

    // Tooling read-mode list, scoped to CONTRACTS_LAYER — the second PLAN_SECTION on this page.
    const contractsLayer = specPanel.getByTestId('CONTRACTS_LAYER');
    await expect(contractsLayer.getByTestId('PLAN_SECTION')).toHaveCount(1);
    await expect(contractsLayer.getByTestId('SECTION_HEADER')).toHaveText('TOOLING(3)');
    await expect(contractsLayer.getByTestId('TOOLING_NAME')).toHaveText([
      'First Tool',
      HOSTILE_TOKEN,
      'First Tool',
    ]);
    await expect(contractsLayer.getByTestId('TOOLING_PACKAGE')).toHaveText([
      'first-package',
      'hostile-package',
      'duplicate-package',
    ]);

    // ACTION_BAR renders exactly one control — APPROVE — and no leftover MODIFY/SUBMIT/CANCEL.
    const actionBar = specPanel.getByTestId('ACTION_BAR');
    await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' })).toHaveCount(1);
    await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'MODIFY' })).toHaveCount(0);
    await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'SUBMIT' })).toHaveCount(0);
    await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'CANCEL' })).toHaveCount(0);
  });

  test('VALID: clicking ABANDON QUEST reveals CONFIRM ABANDON and CANCEL; clicking CANCEL restores the ABANDON QUEST button', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Abandon Confirm Guild', path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const created = await quests.createQuest({
      guildId: String(guild.id),
      title: 'Abandon Confirm Quest',
      userRequest: 'Prove the abandon confirm step survives',
    });

    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'review_design',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', status: 'complete' },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const abandonBar = page
      .getByTestId('QUEST_SPEC_PANEL')
      .getByTestId('QUEST_TITLE_BAR')
      .getByTestId('ABANDON_BAR');
    await expect(abandonBar.getByTestId('PIXEL_BTN')).toHaveText(['ABANDON QUEST'], {
      timeout: PANEL_TIMEOUT,
    });

    await abandonBar.getByTestId('PIXEL_BTN').filter({ hasText: 'ABANDON QUEST' }).click();

    await expect(abandonBar.getByTestId('PIXEL_BTN')).toHaveText(['CONFIRM ABANDON', 'CANCEL']);

    // A CANCEL button now genuinely exists on the page (inside ABANDON_BAR), unlike the CANCEL-count
    // assertions elsewhere in this file that run before any CANCEL exists anywhere. This is the
    // discriminating case: ACTION_BAR must stay scoped to its own subtree and not pick up a CANCEL
    // that lives in a sibling section of the panel.
    const actionBar = page.getByTestId('QUEST_SPEC_PANEL').getByTestId('ACTION_BAR');
    await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'CANCEL' })).toHaveCount(0);

    await abandonBar.getByTestId('PIXEL_BTN').filter({ hasText: 'CANCEL' }).click();

    await expect(abandonBar.getByTestId('PIXEL_BTN')).toHaveText(['ABANDON QUEST']);
  });

  test('EDGE: a quest at review_observables with an unmet approval gate still renders zero MODIFY, SUBMIT or CANCEL buttons in ACTION_BAR', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Gate Unmet Guild', path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const created = await quests.createQuest({
      guildId: String(guild.id),
      title: 'Gate Unmet Quest',
      userRequest: 'Prove no stray edit-mode button appears even with a disabled APPROVE',
    });

    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'review_observables',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', status: 'complete' },
      ],
      operations: [],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const actionBar = page.getByTestId('QUEST_SPEC_PANEL').getByTestId('ACTION_BAR');
    await expect(actionBar).toBeVisible({ timeout: PANEL_TIMEOUT });
    const approveBtn = actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' });
    await expect(approveBtn).toHaveCSS('pointer-events', 'none');

    await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'MODIFY' })).toHaveCount(0);
    await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'SUBMIT' })).toHaveCount(0);
    await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'CANCEL' })).toHaveCount(0);
  });

  test('VALID: clicking CLARIFY_OTHER_BTN reveals CLARIFY_FREEFORM with a working FORM_INPUT', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Clarify Freeform Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-session-clarify-freeform-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'Clarify Freeform Quest',
      userRequest: 'Build the feature',
    });

    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', sessionId },
      ],
    });

    claudeMock.queueResponse({ response: ClarificationResponseStub({ sessionId }) });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: CLARIFY_TIMEOUT });

    await page.getByTestId('CLARIFY_OTHER_BTN').click();

    const freeform = page.getByTestId('CLARIFY_FREEFORM');
    await expect(freeform.getByTestId('FORM_INPUT')).toHaveCount(1);

    await freeform.getByTestId('FORM_INPUT').fill('a freeform clarification answer');
    await expect(freeform.getByTestId('FORM_INPUT')).toHaveValue('a freeform clarification answer');
  });

  test('EMPTY: a quest with no design decisions or tooling still renders PLAN_SECTION with a live "(0)" count, not an absent one', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({ name: 'Zero Item Section Guild', path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const created = await quests.createQuest({
      guildId: String(guild.id),
      title: 'Zero Item Section Quest',
      userRequest: 'Prove SECTION_HEADER_COUNT reads (0) instead of vanishing on an empty list',
    });

    // No specReadonly.seedDesignDecisionsAndTooling call — questHarness.writeQuestFile defaults
    // designDecisions and toolingRequirements to [].
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'review_design',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer', status: 'complete' },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    const specPanel = page.getByTestId('QUEST_SPEC_PANEL');
    await expect(specPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const designDecisionsLayer = specPanel.getByTestId('DESIGN_DECISIONS_LAYER');
    await expect(designDecisionsLayer.getByTestId('PLAN_SECTION')).toHaveCount(1);
    await expect(designDecisionsLayer.getByTestId('SECTION_HEADER_COUNT')).toHaveText('(0)');
    await expect(designDecisionsLayer.getByTestId('DECISION_TITLE')).toHaveCount(0);

    const contractsLayer = specPanel.getByTestId('CONTRACTS_LAYER');
    await expect(contractsLayer.getByTestId('PLAN_SECTION')).toHaveCount(1);
    await expect(contractsLayer.getByTestId('SECTION_HEADER_COUNT')).toHaveText('(0)');
    await expect(contractsLayer.getByTestId('TOOLING_NAME')).toHaveCount(0);
  });

  // Status-matrix coverage for ACTION_BAR's button set. The observable claims "at any quest status",
  // but every test above exercises only review_design/review_observables. Both lists below are
  // derived from questStatusMetadataStatics (never hardcoded), so a newly added status is picked up
  // automatically. Only the 11 NON-execution-phase statuses are reachable here — QuestSpecPanelWidget
  // mounts unconditionally (readOnly undefined) in that branch of QuestChatContentLayerWidget. The 5
  // execution-phase statuses (in_progress, paused, blocked, complete, abandoned) render
  // QuestSpecPanelWidget readOnly, one tab-click deep inside ExecutionPanelWidget — a different
  // widget's own navigation surface, out of this flow's scope (see the audit report for this gap).
  for (const status of ACTION_BAR_APPROVE_STATUSES) {
    test(`VALID: {status: ${status}} => ACTION_BAR renders exactly APPROVE, no MODIFY/SUBMIT/CANCEL`, async ({
      page,
      request,
    }) => {
      const guilds = guildHarness({ request });
      const quests = questHarness({ request });
      const nav = navigationHarness({ page });

      const guild = await guilds.createGuild({
        name: `Status Matrix Approve ${status} Guild`,
        path: GUILD_PATH,
      });
      const urlSlug = guilds.extractUrlSlug({ guild });

      const created = await quests.createQuest({
        guildId: String(guild.id),
        title: `Status Matrix Approve ${status} Quest`,
        userRequest: 'Prove ACTION_BAR holds APPROVE-only at this status',
      });

      quests.writeQuestFile({
        questId: String(created.questId),
        questFolder: String(created.questFolder),
        questFilePath: String(created.filePath),
        status,
        workItems: [
          {
            id: 'e2e00000-0000-4000-8000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
          },
        ],
      });

      await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

      const actionBar = page.getByTestId('QUEST_SPEC_PANEL').getByTestId('ACTION_BAR');
      await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' })).toHaveCount(
        1,
        {
          timeout: PANEL_TIMEOUT,
        },
      );
      await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'MODIFY' })).toHaveCount(0);
      await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'SUBMIT' })).toHaveCount(0);
      await expect(actionBar.getByTestId('PIXEL_BTN').filter({ hasText: 'CANCEL' })).toHaveCount(0);
    });
  }

  for (const status of ACTION_BAR_EMPTY_STATUSES) {
    test(`VALID: {status: ${status}} => ACTION_BAR is visible but renders zero PIXEL_BTN controls`, async ({
      page,
      request,
    }) => {
      const guilds = guildHarness({ request });
      const quests = questHarness({ request });
      const nav = navigationHarness({ page });

      const guild = await guilds.createGuild({
        name: `Status Matrix Empty ${status} Guild`,
        path: GUILD_PATH,
      });
      const urlSlug = guilds.extractUrlSlug({ guild });

      const created = await quests.createQuest({
        guildId: String(guild.id),
        title: `Status Matrix Empty ${status} Quest`,
        userRequest: 'Prove ACTION_BAR holds zero buttons at this status',
      });

      quests.writeQuestFile({
        questId: String(created.questId),
        questFolder: String(created.questFolder),
        questFilePath: String(created.filePath),
        status,
        workItems: [
          {
            id: 'e2e00000-0000-4000-8000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
          },
        ],
      });

      await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

      const actionBar = page.getByTestId('QUEST_SPEC_PANEL').getByTestId('ACTION_BAR');
      await expect(actionBar).toBeVisible({ timeout: PANEL_TIMEOUT });
      await expect(actionBar.getByTestId('PIXEL_BTN')).toHaveCount(0);
    });
  }
});
