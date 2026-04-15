import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  GuildNameStub,
  GuildPathStub,
  ObservableIdStub,
  PlanningReviewReportStub,
  PlanningScopeClassificationStub,
  PlanningSurfaceReportStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
} from '@dungeonmaster/shared/contracts';

import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { QuestAddResponder } from '../../responders/quest/add/quest-add-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts';
import { QuestFlow } from './quest-flow';
import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQueueHarness } from '../../../test/harnesses/orchestration-queue/orchestration-queue.harness';
import { orchestrationQuestHarness } from '../../../test/harnesses/orchestration-quest/orchestration-quest.harness';

describe('QuestFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const queue = orchestrationQueueHarness();
  const questHelper = orchestrationQuestHarness();

  describe('delegation to responders', () => {
    it('VALID: {questId: nonexistent} => get delegates to QuestGetResponder and returns error', async () => {
      const result = await QuestFlow.get({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });
  });

  describe('transition matrix — forward path', () => {
    it('VALID: {approved → seek_scope → seek_synth → seek_walk → seek_plan → in_progress} => each transition succeeds with correct gate content', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-forward' }),
      });
      // Full setup (with queue harness) because the final seek_plan → in_progress
      // transition triggers QuestModifyResponder's auto-resume orchestration loop.
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Forward Transition Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Forward Transition Quest',
        userRequest: 'Walks the full seek_* forward path',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'approved',
      });

      const toSeekScope = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'seek_scope' }),
      });

      const toSeekSynth = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          planningNotes: { scopeClassification: PlanningScopeClassificationStub() },
          status: 'seek_synth',
        }),
      });

      const toSeekWalk = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          planningNotes: { synthesis: PlanningSynthesisStub() },
          status: 'seek_walk',
        }),
      });

      const toSeekPlan = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          planningNotes: { walkFindings: PlanningWalkFindingsStub() },
          status: 'seek_plan',
        }),
      });

      const toInProgress = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          planningNotes: { reviewReport: PlanningReviewReportStub({ signal: 'clean' }) },
          status: 'in_progress',
        }),
      });

      const afterRead = await QuestGetResponder({ questId });

      testbed.cleanup();

      expect(toSeekScope).toStrictEqual({ success: true });
      expect(toSeekSynth).toStrictEqual({ success: true });
      expect(toSeekWalk).toStrictEqual({ success: true });
      expect(toSeekPlan).toStrictEqual({ success: true });
      expect(toInProgress).toStrictEqual({ success: true });
      expect(afterRead.quest!.status).toBe('in_progress');
    });
  });

  describe('transition matrix — back-edges', () => {
    it('VALID: {seek_synth → seek_scope} => succeeds (replan from scope)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-back-synth-scope' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Back Synth→Scope Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestAddResponder({
        title: 'Back Synth→Scope Quest',
        userRequest: 'Tests seek_synth back-edge to seek_scope',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_synth',
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'seek_scope' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {seek_walk → seek_scope} => succeeds (full replan)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-back-walk-scope' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Back Walk→Scope Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestAddResponder({
        title: 'Back Walk→Scope Quest',
        userRequest: 'Tests seek_walk back-edge to seek_scope',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_walk',
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'seek_scope' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {seek_plan → seek_walk} => succeeds (re-walk after verify failed)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-back-plan-walk' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Back Plan→Walk Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestAddResponder({
        title: 'Back Plan→Walk Quest',
        userRequest: 'Tests seek_plan back-edge to seek_walk',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_plan',
      });

      // seek_walk gate requires scopeClassification + synthesis — pre-commit both.
      await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          planningNotes: {
            scopeClassification: PlanningScopeClassificationStub(),
            synthesis: PlanningSynthesisStub(),
          },
        }),
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'seek_walk' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {in_progress → seek_walk} => succeeds (downstream failure routing)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-back-inprog-walk' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Back InProgress→Walk Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestAddResponder({
        title: 'Back InProgress→Walk Quest',
        userRequest: 'Tests in_progress back-edge to seek_walk for failure replan',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      // Seed at seek_plan to commit planningNotes (allowed field there), then
      // re-seed to in_progress via harness (bypasses validators) so the seek_walk
      // gate-content (scopeClassification + synthesis) is already satisfied.
      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_plan',
      });
      await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          planningNotes: {
            scopeClassification: PlanningScopeClassificationStub(),
            synthesis: PlanningSynthesisStub(),
          },
        }),
      });
      await questHelper.seedQuestState({ questId, finalStatus: 'in_progress' });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'seek_walk' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {in_progress → seek_scope} => succeeds (full replan)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-back-inprog-scope' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Back InProgress→Scope Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestAddResponder({
        title: 'Back InProgress→Scope Quest',
        userRequest: 'Tests in_progress back-edge to seek_scope for full replan',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'in_progress',
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'seek_scope' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('transition matrix — rejected bad transitions', () => {
    it('INVALID: {approved → seek_walk} => rejected with invalid-transition error', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-bad-approved-walk' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Bad Transition Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestAddResponder({
        title: 'Bad Transition Quest',
        userRequest: 'Tests rejection of transitions not in the transition map',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'approved',
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'seek_walk' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        success: false,
        error: 'Invalid status transition: approved -> seek_walk',
      });
    });
  });

  describe('transition matrix — rejected bad input fields', () => {
    it('INVALID: {seek_scope, input.steps: [...]} => rejected with forbidden-fields failedCheck', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-bad-steps-in-scope' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Bad Fields Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestAddResponder({
        title: 'Bad Fields Quest',
        userRequest: 'Tests allowlist rejection of steps during seek_scope',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_scope',
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          steps: [
            {
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              name: 'Attempted Step',
              assertions: [{ prefix: 'VALID', input: '{x}', expected: 'returns y' }],
              observablesSatisfied: [],
              dependsOn: [],
              focusFile: { path: 'packages/orchestrator/src/brokers/x/y/x-y-broker.ts' },
              accompanyingFiles: [],
              inputContracts: ['Void'],
              outputContracts: ['Void'],
            },
          ],
        }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        success: false,
        error: 'Field(s) not allowed in status seek_scope',
        failedChecks: [
          {
            name: 'Input Allowlist',
            passed: false,
            details: result.failedChecks?.[0]?.details,
          },
        ],
      });
    });

    it('INVALID: {seek_scope → seek_synth, missing scopeClassification} => rejected by gate-content guard', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-bad-gate-synth' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Bad Gate Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestAddResponder({
        title: 'Bad Gate Quest',
        userRequest: 'Tests gate-content rejection when scopeClassification missing',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_scope',
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'seek_synth' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        success: false,
        error: 'Missing required content for transition to seek_synth',
      });
    });

    it('INVALID: {seek_plan → in_progress, reviewReport.signal=critical} => rejected by completeness check', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-bad-complete-critical' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Bad Completeness Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestAddResponder({
        title: 'Bad Completeness Quest',
        userRequest: 'Tests completeness rejection when reviewReport.signal is critical',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_plan',
      });

      // Pre-commit gate-content so the gate-content guard passes, leaving
      // the critical reviewReport as the only failing check at completeness time.
      await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          planningNotes: {
            scopeClassification: PlanningScopeClassificationStub(),
            synthesis: PlanningSynthesisStub(),
            walkFindings: PlanningWalkFindingsStub(),
            reviewReport: PlanningReviewReportStub({
              signal: 'critical',
              criticalItems: ['Missing wiring in foo-broker'],
            }),
          },
        }),
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'in_progress' }),
      });

      testbed.cleanup();

      const planReviewCheck = result.failedChecks?.find((c) => c.name === 'Plan Review Report');

      expect(result).toStrictEqual({
        success: false,
        error: 'Completeness checks failed for transition to in_progress',
        failedChecks: result.failedChecks,
      });
      expect(planReviewCheck).toStrictEqual({
        name: 'Plan Review Report',
        passed: false,
        details: planReviewCheck?.details,
      });
    });
  });

  describe('resume — get-planning-notes', () => {
    it('VALID: {quest at seek_walk with partial planningNotes} => returns scope + synthesis + surfaceReports, walkFindings/reviewReport absent', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-resume-partial' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Resume Partial Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestAddResponder({
        title: 'Resume Partial Quest',
        userRequest: 'Tests get-planning-notes returns committed scope+synthesis at seek_walk',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_walk',
      });

      const scope = PlanningScopeClassificationStub();
      const synthesis = PlanningSynthesisStub();
      const report = PlanningSurfaceReportStub({ sliceName: 'auth-slice' });

      await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          planningNotes: {
            scopeClassification: scope,
            synthesis,
            surfaceReports: [report],
          },
        }),
      });

      const fullResult = await QuestFlow.getPlanningNotes({ questId });
      const scopeResult = await QuestFlow.getPlanningNotes({ questId, section: 'scope' });

      testbed.cleanup();

      expect(fullResult).toStrictEqual({
        success: true,
        data: {
          scopeClassification: scope,
          surfaceReports: [report],
          synthesis,
        },
      });

      expect(scopeResult).toStrictEqual({
        success: true,
        data: scope,
      });
    });
  });
});
