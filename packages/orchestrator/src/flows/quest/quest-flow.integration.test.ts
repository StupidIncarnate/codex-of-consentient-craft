import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  AddQuestInputStub,
  GuildNameStub,
  GuildPathStub,
  ObservableIdStub,
  PlanningScopeClassificationStub,
  PlanningSurfaceReportStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
  QuestWorkItemIdStub,
  WardRunIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { AgentPromptFlow } from '../agent-prompt/agent-prompt-flow';
import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { QuestUserAddResponder } from '../../responders/quest/user-add/quest-user-add-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { QuestModifyResponder } from '../../responders/quest/modify/quest-modify-responder';
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
    it('VALID: {approved → seek_scope → seek_synth → seek_walk → in_progress} => each transition succeeds with correct gate content', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-forward' }),
      });
      // Full setup (with queue harness) because the final seek_walk → in_progress
      // transition triggers QuestModifyResponder's auto-resume orchestration loop.
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Forward Transition Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestUserAddResponder({
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

      const toInProgress = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          planningNotes: { walkFindings: PlanningWalkFindingsStub() },
          status: 'in_progress',
        }),
      });

      const afterRead = await QuestGetResponder({ questId });

      testbed.cleanup();

      expect(toSeekScope).toStrictEqual({ success: true });
      expect(toSeekSynth).toStrictEqual({ success: true });
      expect(toSeekWalk).toStrictEqual({ success: true });
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
      const addResult = await QuestUserAddResponder({
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
      const addResult = await QuestUserAddResponder({
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

    it('VALID: {in_progress → seek_walk} => succeeds (downstream failure routing)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-back-inprog-walk' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Back InProgress→Walk Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
        title: 'Back InProgress→Walk Quest',
        userRequest: 'Tests in_progress back-edge to seek_walk for failure replan',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      // Seed scopeClassification + synthesis directly via harness (bypasses validators),
      // then re-seed to in_progress so the seek_walk gate-content is already satisfied.
      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_walk',
      });
      await questHelper.seedQuestState({
        questId,
        finalStatus: 'in_progress',
        planningNotes: {
          scopeClassification: PlanningScopeClassificationStub(),
          synthesis: PlanningSynthesisStub(),
          surfaceReports: [],
          blightReports: [],
          codeweaverPlans: [],
        },
      });

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
      const addResult = await QuestUserAddResponder({
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
      const addResult = await QuestUserAddResponder({
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
    it('INVALID: {seek_scope, input.title} => rejected with forbidden-fields failedCheck', async () => {
      // seek_scope is the PathSeeker planning workspace: it ACCEPTS planningNotes/steps/contracts,
      // but spec fields like `title` remain forbidden — the allowlist still rejects those.
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-bad-title-in-scope' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Bad Fields Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
        title: 'Bad Fields Quest',
        userRequest:
          'Tests allowlist rejection of a forbidden spec field (title) during seek_scope',
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
          title: 'renamed mid-plan',
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
      const addResult = await QuestUserAddResponder({
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
  });

  describe('completeness gate on seek_scope → in_progress (retryable)', () => {
    it('VALID: {seek_scope → in_progress with a complete plan} => transition succeeds and quest is in_progress', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-complete-plan' }),
      });
      // Full setup (with queue harness) because a successful → in_progress transition
      // triggers QuestModifyResponder's auto-resume orchestration loop.
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Gate Complete Plan Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
        title: 'Gate Complete Plan Quest',
        userRequest: 'Drives the live seek_scope → in_progress gate with a complete plan',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      // A valid plan resting at seek_scope (PathSeeker's workspace): steps resolve their
      // contracts and satisfy every observable, so the completeness gate passes.
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
          planningNotes: { walkFindings: PlanningWalkFindingsStub() },
          status: 'in_progress',
        }),
      });

      const afterRead = await QuestGetResponder({ questId });

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
      expect(afterRead.quest!.status).toBe('in_progress');
    });

    it('INVALID: {seek_scope → in_progress with a step referencing an unknown contract} => rejected with failedChecks; quest STAYS at seek_scope (retryable, not blocked)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-unresolved-ref' }),
      });
      // Rejected transition never reaches in_progress, so no auto-resume — light setup.
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Completeness Gate Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
        title: 'Completeness Gate Quest',
        userRequest: 'Tests the retryable completeness gate on seek_scope → in_progress',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_scope',
      });

      // PathSeeker's terminal commit carries steps + status:in_progress. A step whose
      // inputContract resolves to no quest.contracts entry (mirrors the real RepoPath failure)
      // must bounce the transition — retryably — not strand the quest.
      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          steps: [
            {
              id: 'backend-unresolved-ref-step',
              slice: 'backend',
              name: 'Step With Unresolved Contract Ref',
              assertions: [{ prefix: 'VALID', input: '{x}', expected: 'returns y' }],
              observablesSatisfied: [],
              dependsOn: [],
              focusFile: {
                path: 'packages/orchestrator/src/brokers/broken/create/broken-create-broker.ts',
              },
              accompanyingFiles: [
                {
                  path: 'packages/orchestrator/src/brokers/broken/create/broken-create-broker.test.ts',
                },
                {
                  path: 'packages/orchestrator/src/brokers/broken/create/broken-create-broker.proxy.ts',
                },
              ],
              inputContracts: ['RepoPath'],
              outputContracts: ['Void'],
            },
          ],
          status: 'in_progress',
        }),
      });

      const afterRead = await QuestGetResponder({ questId });

      testbed.cleanup();

      expect(result).toStrictEqual({
        success: false,
        error: 'Save invariants failed',
        failedChecks: [
          {
            name: 'Step Contract References Resolve',
            passed: false,
            details: result.failedChecks?.[0]?.details,
          },
        ],
      });
      // Retryable: the quest did NOT advance to in_progress and was NOT blocked — PathSeeker
      // fixes the flagged data and re-issues the transition.
      expect(afterRead.quest!.status).toBe('seek_scope');
    });
  });

  describe('resume — get-planning-notes', () => {
    it('VALID: {quest at seek_walk with partial planningNotes} => returns scope + synthesis + surfaceReports, walkFindings absent', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-resume-partial' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Resume Partial Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
        title: 'Resume Partial Quest',
        userRequest: 'Tests get-planning-notes returns committed scope+synthesis at seek_walk',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      const scope = PlanningScopeClassificationStub();
      const synthesis = PlanningSynthesisStub();
      const report = PlanningSurfaceReportStub({ sliceName: 'auth-slice' });

      // Seed partial planningNotes directly via harness — the sub-field allowlist correctly
      // rejects writing scopeClassification/synthesis/surfaceReports via modify-quest at
      // seek_walk (only walkFindings is a valid sub-field at that phase), so infrastructure
      // setup bypasses validators.
      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'seek_walk',
      });
      await questHelper.seedQuestState({
        questId,
        finalStatus: 'seek_walk',
        planningNotes: {
          scopeClassification: scope,
          synthesis,
          surfaceReports: [report],
          blightReports: [],
          codeweaverPlans: [],
        },
      });

      const fullResult = await QuestFlow.getPlanningNotes({ questId });
      const scopeResult = await QuestFlow.getPlanningNotes({ questId, section: 'scope' });

      testbed.cleanup();

      expect(fullResult).toStrictEqual({
        success: true,
        data: {
          scopeClassification: scope,
          surfaceReports: [report],
          blightReports: [],
          codeweaverPlans: [],
          synthesis,
        },
      });

      expect(scopeResult).toStrictEqual({
        success: true,
        data: scope,
      });
    });
  });

  describe('failure recovery — full ward sad path (RECOVER)', () => {
    it('VALID: {ward fails with detail blob} => splices spiritmender (carrying ward error text + file paths), then ward-retry passes and rewired siege becomes ready', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-ward-recover' }),
      });
      // Full setup wires the fake ward binary (WARD_CLI_PATH + FAKE_WARD_QUEUE_DIR) and
      // DUNGEONMASTER_HOME so loadActiveQuestsLayerBroker discovers the in_progress quest.
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Ward Recover Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
        title: 'Ward Recover Quest',
        userRequest: 'Drives a ward failure through the spiritmender recovery splice',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      // Seed the quest to in_progress via the disk bypass (no auto-resume loop). Then seed the
      // codeweaver(complete) → ward(pending) → siege(pending) chain via the orchestrator modify
      // path (upsert by id) with NO status field so no orchestration loop spawns.
      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'in_progress',
      });

      const wardItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const siegeItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const codeweaverItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: crypto.randomUUID() }),
        role: 'codeweaver',
        status: 'complete',
        spawnerType: 'agent',
        dependsOn: [],
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
      const wardItem = WorkItemStub({
        id: wardItemId,
        role: 'ward',
        status: 'pending',
        spawnerType: 'command',
        dependsOn: [codeweaverItem.id],
        wardMode: 'full',
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
      });
      const siegeItem = WorkItemStub({
        id: siegeItemId,
        role: 'siegemaster',
        status: 'pending',
        spawnerType: 'agent',
        dependsOn: [wardItemId],
        createdAt: new Date().toISOString(),
      });

      // Mark any pre-existing chaoswhisperer item complete so get-next-step never tries to
      // dispatch it, then add the three chain items (upsert merges by id).
      const seeded = await QuestGetResponder({ questId });
      const existingComplete = seeded.quest!.workItems.map((wi) => ({
        id: wi.id,
        status: 'complete' as const,
        completedAt: new Date().toISOString(),
      }));
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({
          questId,
          workItems: [...existingComplete, codeweaverItem, wardItem, siegeItem],
        }),
      });

      // The ward broker reads detail via `ward detail <runId>` from the spawn cwd; the fake ward
      // writes wardResultJson verbatim to `<cwd>/.ward/run-<runId>.json`. Inject real file paths +
      // error messages so the spiritmender batch is non-empty and its prompt carries them.
      const failingFilePath = '/repo/src/brokers/auth/login/auth-login-broker.ts';
      const failingMessage = 'Property loginUser does not exist on type AuthService';
      const failingRule = 'no-undef-property';
      const failRunId = WardRunIdStub({ value: `1739625600000-a3f${String(Date.now() % 100000)}` });
      queue.enqueue({
        queueDir: env.wardQueueDir,
        response: {
          exitCode: 1,
          runId: failRunId,
          wardResultJson: {
            checks: [
              {
                projectResults: [
                  {
                    errors: [
                      {
                        filePath: failingFilePath,
                        message: failingMessage,
                        line: 42,
                        column: 7,
                        rule: failingRule,
                      },
                    ],
                    testFailures: [],
                  },
                ],
              },
            ],
          },
        },
      });

      // (1) Drive the ward run through the real run-ward MCP surface — it fails (exit 1) and
      // splices recovery items.
      const wardRun = await QuestFlow.runWard({ questId, workItemId: wardItemId, mode: 'full' });

      expect(wardRun.exitCode).toBe(1);

      // Read the spliced ids from quest.json (generated by the broker via crypto.randomUUID).
      const afterSplice = await QuestGetResponder({ questId });
      const spiritmenderItem = afterSplice.quest!.workItems.find(
        (wi) => wi.role === 'spiritmender',
      );
      const wardRetryItem = afterSplice
        .quest!.workItems.filter((wi) => wi.id !== wardItemId)
        .find((wi) => wi.role === 'ward');
      const spiritmenderId = spiritmenderItem!.id;
      const wardRetryId = wardRetryItem!.id;

      // (1a) Next get-next-step yields the SPIRITMENDER (one parallel spawn-agents batch), never
      // the siegemaster. Assert the exact dispatch instruction (taskPrompt is deterministic).
      const afterWard = await QuestFlow.getNextStep();

      expect(afterWard).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'spiritmender',
            workItemId: spiritmenderId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "spiritmender",\n  workItemId: "${String(spiritmenderId)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(spiritmenderId)}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });

      // (1b) The spiritmender's BUILT prompt carries the ward error text + file paths from the
      // sidecar — proving run-ward WROTE the sidecar and agent-prompt-get READ it (round-trip).
      const spiritmenderPrompt = await AgentPromptFlow.get({
        agent: 'spiritmender',
        questId,
        workItemId: spiritmenderId,
      });
      const promptText = String(spiritmenderPrompt.prompt);

      expect(new RegExp(failingFilePath.replace(/[/.]/gu, '\\$&'), 'u').exec(promptText)?.[0]).toBe(
        failingFilePath,
      );
      expect(new RegExp(failingMessage, 'u').exec(promptText)?.[0]).toBe(failingMessage);
      expect(new RegExp(failingRule, 'u').exec(promptText)?.[0]).toBe(failingRule);

      // (1c) Complete the spiritmender ⇒ next step is the ward-RETRY (rewired downstream),
      // carrying the original wardMode and a NEW work item id (not the failed ward).
      await QuestFlow.handleSignalBack({
        questId,
        workItemId: spiritmenderId,
        signal: 'complete',
      });
      const afterSpiritmender = await QuestFlow.getNextStep();

      expect(afterSpiritmender).toStrictEqual({
        type: 'run-ward',
        questId,
        workItemId: wardRetryId,
        mode: 'full',
      });

      // (1d) Make the ward-retry PASS ⇒ siege becomes ready (downstream rewired onto the retry).
      queue.enqueue({
        queueDir: env.wardQueueDir,
        response: {
          exitCode: 0,
          runId: WardRunIdStub({ value: `1739625700000-b4f${String(Date.now() % 100000)}` }),
          wardResultJson: { checks: [] },
        },
      });
      const retryRun = await QuestFlow.runWard({ questId, workItemId: wardRetryId, mode: 'full' });

      expect(retryRun.exitCode).toBe(0);

      const afterRetry = await QuestFlow.getNextStep();
      const finalQuest = await QuestGetResponder({ questId });

      testbed.cleanup();

      // Siege is now the only ready item — its ward dep was rewired onto the passing retry.
      expect(afterRetry).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'siegemaster',
            workItemId: siegeItemId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "siegemaster",\n  workItemId: "${String(siegeItemId)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(siegeItemId)}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });
      // Quest never blocked — recovery keeps it in_progress.
      expect(finalQuest.quest!.status).toBe('in_progress');
    });
  });

  describe('failure recovery — crash ward (no structured errors) RECOVER', () => {
    // Regression: the user's quest 014208d8 — the integration check FAILED at the suite level
    // (a project that crashed / failed to run) with ZERO structured errors and ZERO test
    // failures, the actual reason living only in rawOutput. The spiritmender batcher read only
    // errors[]/testFailures[] → returned [] → the ward-retry was spliced with dependsOn: [] →
    // ward re-ran immediately with nothing repaired (ward-after-ward-after-ward). This test
    // drives that exact shape and proves a spiritmender is now ALWAYS spliced and the ward-retry
    // depends on it (never bare).
    it('VALID: {ward fails with crash-only detail (rawOutput, no structured errors)} => spiritmender spliced, ward-retry dependsOn it (never bare)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-ward-crash-recover' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Ward Crash Recover Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
        title: 'Ward Crash Recover Quest',
        userRequest: 'Drives a suite-level ward crash (no structured errors) through recovery',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'in_progress',
      });

      const wardItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const siegeItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const codeweaverItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: crypto.randomUUID() }),
        role: 'codeweaver',
        status: 'complete',
        spawnerType: 'agent',
        dependsOn: [],
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
      const wardItem = WorkItemStub({
        id: wardItemId,
        role: 'ward',
        status: 'pending',
        spawnerType: 'command',
        dependsOn: [codeweaverItem.id],
        wardMode: 'changed',
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
      });
      const siegeItem = WorkItemStub({
        id: siegeItemId,
        role: 'siegemaster',
        status: 'pending',
        spawnerType: 'agent',
        dependsOn: [wardItemId],
        createdAt: new Date().toISOString(),
      });

      const seeded = await QuestGetResponder({ questId });
      const existingComplete = seeded.quest!.workItems.map((wi) => ({
        id: wi.id,
        status: 'complete' as const,
        completedAt: new Date().toISOString(),
      }));
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({
          questId,
          workItems: [...existingComplete, codeweaverItem, wardItem, siegeItem],
        }),
      });

      // The crash shape: integration check FAILED, one project FAILED with no errors and no test
      // failures — the reason only in rawOutput. This is exactly what jest emits when a suite
      // fails to run/compile (filesCount 0).
      const crashProjectName = '@dungeonmaster/shared';
      const crashStdout = 'FATAL: jest failed to run @dungeonmaster/shared integration suite';
      const failRunId = WardRunIdStub({
        value: `1739625600000-c1f${String(Date.now() % 100000)}`,
      });
      queue.enqueue({
        queueDir: env.wardQueueDir,
        response: {
          exitCode: 1,
          runId: failRunId,
          wardResultJson: {
            checks: [
              {
                checkType: 'integration',
                status: 'fail',
                projectResults: [
                  {
                    projectFolder: {
                      name: crashProjectName,
                      path: '/repo/packages/shared',
                    },
                    status: 'fail',
                    errors: [],
                    testFailures: [],
                    rawOutput: { stdout: crashStdout, stderr: '', exitCode: 1 },
                  },
                ],
              },
            ],
          },
        },
      });

      const wardRun = await QuestFlow.runWard({
        questId,
        workItemId: wardItemId,
        mode: 'changed',
      });

      expect(wardRun.exitCode).toBe(1);

      const afterSplice = await QuestGetResponder({ questId });
      const spiritmenderItem = afterSplice.quest!.workItems.find(
        (wi) => wi.role === 'spiritmender',
      );
      const wardRetryItem = afterSplice
        .quest!.workItems.filter((wi) => wi.id !== wardItemId)
        .find((wi) => wi.role === 'ward');
      const spiritmenderId = spiritmenderItem!.id;
      const wardRetryId = wardRetryItem!.id;

      // The core regression: a spiritmender WAS spliced and the ward-retry depends on it —
      // never an empty dependsOn (which is what produced ward-after-ward).
      expect(wardRetryItem!.dependsOn).toStrictEqual([spiritmenderId]);

      // get-next-step yields the SPIRITMENDER, never a bare ward re-run.
      const afterWard = await QuestFlow.getNextStep();

      expect(afterWard).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'spiritmender',
            workItemId: spiritmenderId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "spiritmender",\n  workItemId: "${String(spiritmenderId)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(spiritmenderId)}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });

      // The spiritmender's BUILT prompt carries the crash summary + rawOutput from the sidecar —
      // proving the catch-all batch gives the fixer real failure text to act on.
      const spiritmenderPrompt = await AgentPromptFlow.get({
        agent: 'spiritmender',
        questId,
        workItemId: spiritmenderId,
      });
      const promptText = String(spiritmenderPrompt.prompt);

      expect(new RegExp(crashStdout, 'u').exec(promptText)?.[0]).toBe(crashStdout);
      expect(/FAILED/u.exec(promptText)?.[0]).toBe('FAILED');

      // Completing the spiritmender yields the ward-RETRY (not the original failed ward).
      await QuestFlow.handleSignalBack({
        questId,
        workItemId: spiritmenderId,
        signal: 'complete',
      });
      const afterSpiritmender = await QuestFlow.getNextStep();

      testbed.cleanup();

      expect(afterSpiritmender).toStrictEqual({
        type: 'run-ward',
        questId,
        workItemId: wardRetryId,
        mode: 'changed',
      });
    });
  });

  describe('siegemaster failure RECOVERs (manual-QA finding → spiritmender → fresh siege)', () => {
    it('VALID: {siegemaster signals failed with budget remaining} => splices spiritmender + ward(changed) + fresh siege, feeds the finding to the spiritmender prompt, quest stays in_progress', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-siege-recover' }),
      });
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Siege Recover Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
        title: 'Siege Recover Quest',
        userRequest: 'Drives a siegemaster failure through the spiritmender + fresh-siege recovery',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'in_progress',
      });

      // Seed: mark every pre-existing item complete, add a siegemaster (the one that fails) and a
      // downstream lawbringer that depends on it — proving the rewire onto the fresh siege.
      const siegeId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const lawId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const siegeItem = WorkItemStub({
        id: siegeId,
        role: 'siegemaster',
        status: 'in_progress',
        spawnerType: 'agent',
        relatedDataItems: ['flows/login-flow'],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
      });
      const lawItem = WorkItemStub({
        id: lawId,
        role: 'lawbringer',
        status: 'pending',
        spawnerType: 'agent',
        dependsOn: [siegeId],
        maxAttempts: 1,
        createdAt: new Date().toISOString(),
      });
      const seeded = await QuestGetResponder({ questId });
      const existingComplete = seeded.quest!.workItems.map((wi) => ({
        id: wi.id,
        status: 'complete' as const,
        completedAt: new Date().toISOString(),
      }));
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({
          questId,
          workItems: [...existingComplete, siegeItem, lawItem],
        }),
      });

      const finding = WorkItemStub({
        summary: 'FLOW: login-flow\nFAILED OBSERVABLES:\n- obs-login: dashboard vs error toast',
      }).summary;

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: siegeId,
        signal: 'failed',
        summary: finding,
      });

      const afterRecover = await QuestGetResponder({ questId });
      const items = afterRecover.quest!.workItems;
      const spliced = items.filter((wi) => wi.insertedBy === siegeId);
      const spiritmenderItem = spliced.find((wi) => wi.role === 'spiritmender');
      const wardItem = spliced.find((wi) => wi.role === 'ward');
      const freshSiege = spliced.find((wi) => wi.role === 'siegemaster');
      const law = items.find((wi) => wi.id === lawId);
      const siege = items.find((wi) => wi.id === siegeId);

      expect({
        questStatus: afterRecover.quest!.status,
        failedSiegeStatus: siege!.status,
        spiritmenderDependsOn: spiritmenderItem!.dependsOn,
        wardMode: wardItem!.wardMode,
        wardDependsOn: wardItem!.dependsOn,
        freshSiegeDependsOn: freshSiege!.dependsOn,
        freshSiegeAttempt: freshSiege!.attempt,
        freshSiegeRelatedDataItems: freshSiege!.relatedDataItems,
        lawRewiredOntoFreshSiege: law!.dependsOn,
      }).toStrictEqual({
        questStatus: 'in_progress',
        failedSiegeStatus: 'failed',
        spiritmenderDependsOn: [siegeId],
        wardMode: 'changed',
        wardDependsOn: [spiritmenderItem!.id],
        freshSiegeDependsOn: [wardItem!.id],
        freshSiegeAttempt: 1,
        freshSiegeRelatedDataItems: ['flows/login-flow'],
        lawRewiredOntoFreshSiege: [freshSiege!.id],
      });

      // The spiritmender's BUILT prompt carries the manual-QA finding + the siegemasterFailure
      // context preamble from the sidecar — proving the finding reaches the fixer.
      const spiritmenderPrompt = await AgentPromptFlow.get({
        agent: 'spiritmender',
        questId,
        workItemId: spiritmenderItem!.id,
      });
      const promptText = String(spiritmenderPrompt.prompt);

      // get-next-step dispatches the spiritmender (ready: its only dep is the failed siege).
      const nextStep = await QuestFlow.getNextStep();

      testbed.cleanup();

      expect(
        /FAILED OBSERVABLES:\n- obs-login: dashboard vs error toast/u.exec(promptText)?.[0],
      ).toBe('FAILED OBSERVABLES:\n- obs-login: dashboard vs error toast');
      expect(/A manual-QA agent \(Siegemaster\)/u.exec(promptText)?.[0]).toBe(
        'A manual-QA agent (Siegemaster)',
      );
      expect(nextStep).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'spiritmender',
            workItemId: spiritmenderItem!.id,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "spiritmender",\n  workItemId: "${String(spiritmenderItem!.id)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(spiritmenderItem!.id)}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });
    });
  });

  describe('post-walk hook — pathseeker completion hands off to codeweaver', () => {
    // Regression: completing the pathseeker planner momentarily leaves every
    // work item terminal, so the quest derives `complete`. The post-walk hook then appends the
    // pending codeweaver/ward/siege/lawbringer/blightwarden chain — but the quest stays stuck at
    // `complete`, so `loadActiveQuestsLayerBroker` (filters on in_progress) drops it and
    // `get-next-step` returns idle. The codeweaver never launches. This is the exact hole the
    // user hit (quest 014208d8… with pathseekers done, pending codeweavers, get-next-step silent).
    // 35s timeout: on the BROKEN source `get-next-step` long-polls its full ~25s budget before
    // returning idle, so the failing assertion is reached after the wait.
    it('VALID: {pathseeker signals complete} => post-walk codeweaver is dispatched and quest stays in_progress', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-postwalk-codeweaver' }),
      });
      // Full setup so loadActiveQuestsLayerBroker discovers the in_progress quest from
      // DUNGEONMASTER_HOME (same as the recover/block tests below).
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Post-Walk Handoff Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
        title: 'Post-Walk Handoff Quest',
        userRequest: 'Drives pathseeker-walk completion through the post-walk codeweaver handoff',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      // Seed valid flows + steps (stepCount: 1 → exactly one codeweaver chunk) so the post-walk
      // completeness scope passes and stepsToWorkItemsTransformer emits the downstream chain.
      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'in_progress',
      });

      // Mark the pre-existing chaoswhisperer item complete and add a pathseeker that is the
      // only non-terminal item. When it completes, EVERY item is terminal at that instant — this
      // is what trips the premature `complete` derivation.
      const walkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const walkItem = WorkItemStub({
        id: walkItemId,
        role: 'pathseeker',
        status: 'in_progress',
        spawnerType: 'agent',
        dependsOn: [],
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
      });
      const seeded = await QuestGetResponder({ questId });
      const existingComplete = seeded.quest!.workItems.map((wi) => ({
        id: wi.id,
        status: 'complete' as const,
        completedAt: new Date().toISOString(),
      }));
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({
          questId,
          workItems: [...existingComplete, walkItem],
        }),
      });

      // pathseeker signals complete → real signal-back handler fires questPostWalkHookBroker,
      // which appends the codeweaver/ward/siege/lawbringer/blightwarden chain.
      await QuestFlow.handleSignalBack({
        questId,
        workItemId: walkItemId,
        signal: 'complete',
      });

      // The post-walk hook DID append the codeweaver (that half works); read its generated id.
      const afterWalk = await QuestGetResponder({ questId });
      const codeweaverItem = afterWalk.quest!.workItems.find((wi) => wi.role === 'codeweaver');
      const codeweaverId = codeweaverItem!.id;

      // The user-visible symptom: get-next-step must dispatch the codeweaver, NOT return idle.
      const nextStep = await QuestFlow.getNextStep();

      testbed.cleanup();

      expect(nextStep).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'codeweaver',
            workItemId: codeweaverId,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver",\n  workItemId: "${String(codeweaverId)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(codeweaverId)}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
          },
        ],
      });
      // Root cause: appending the pending chain must re-open the quest, not leave it `complete`.
      expect(afterWalk.quest!.status).toBe('in_progress');
    }, 35_000);
  });

  describe('failure recovery — block sad path (BLOCK)', () => {
    // 30s timeout: after BLOCK there are no in_progress quests, so get-next-step finds nothing
    // ready and long-polls its full ~25s budget before returning idle (proving BLK-2: a blocked
    // quest is never dispatched). The wait is the assertion.
    it('VALID: {codeweaver signals failed} => quest blocked, pending items skipped, next dispatch yields idle', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-codeweaver-block' }),
      });
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Block Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
        title: 'Block Quest',
        userRequest: 'Drives a codeweaver failed signal through the BLOCK path',
        guildId: guild.id,
      });
      const questId = addResult.questId!;

      await questHelper.approveQuest({
        questId,
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
        finalStatus: 'in_progress',
      });

      const codeweaverItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: crypto.randomUUID() }),
        role: 'codeweaver',
        status: 'in_progress',
        spawnerType: 'agent',
        dependsOn: [],
        createdAt: new Date().toISOString(),
      });
      const wardItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: crypto.randomUUID() }),
        role: 'ward',
        status: 'pending',
        spawnerType: 'command',
        dependsOn: [codeweaverItem.id],
        wardMode: 'full',
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
      });
      const siegeItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: crypto.randomUUID() }),
        role: 'siegemaster',
        status: 'pending',
        spawnerType: 'agent',
        dependsOn: [wardItem.id],
        createdAt: new Date().toISOString(),
      });

      const seeded = await QuestGetResponder({ questId });
      const existingComplete = seeded.quest!.workItems.map((wi) => ({
        id: wi.id,
        status: 'complete' as const,
        completedAt: new Date().toISOString(),
      }));
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({
          questId,
          workItems: [...existingComplete, codeweaverItem, wardItem, siegeItem],
        }),
      });

      // Codeweaver gave up — `failed` routes to BLOCK (codeweaver is a pathseeker-replan-class
      // failure per the routing table) through the real signal-back MCP handler.
      await QuestFlow.handleSignalBack({
        questId,
        workItemId: codeweaverItem.id,
        signal: 'failed',
      });

      // A subsequent dispatch attempt yields NOTHING — a blocked quest is filtered out of the
      // active set, so the scan finds nothing ready and long-polls its full budget before idle.
      const afterBlock = await QuestFlow.getNextStep();

      const blockedQuest = await QuestGetResponder({ questId });

      testbed.cleanup();

      expect(blockedQuest.quest!.status).toBe('blocked');

      const statusByRole = Object.fromEntries(
        blockedQuest
          .quest!.workItems.filter((wi) => ['codeweaver', 'ward', 'siegemaster'].includes(wi.role))
          .map((wi) => [wi.role, wi.status]),
      );

      // Failed item failed; both downstream pending items drained to skipped.
      expect(statusByRole).toStrictEqual({
        codeweaver: 'failed',
        ward: 'skipped',
        siegemaster: 'skipped',
      });
      // Blocked quest is not dispatched.
      expect(afterBlock).toStrictEqual({ type: 'idle' });
    }, 30_000);
  });

  // Flow: Auto-create guild on create-quest. Entry point mcp__dungeonmaster__create-quest,
  // surfaced in-process as QuestFlow.mcpCreate. These drive the WHOLE real seam end-to-end —
  // processCwdAdapter → cwdResolveBroker → guildListBroker → guildCoversRepoRootGuard →
  // guildAddBroker → questUserAddBroker against a real DUNGEONMASTER_HOME + real cwd. The
  // broker/responder/guard unit tests mock every one of those, so this is the only place the
  // glue between create-quest and the guild brokers is proven against the real filesystem.
  describe('auto-create guild on create-quest', () => {
    const { userRequest } = AddQuestInputStub();

    it('VALID: {no covering guild registered} => auto-creates a guild at the repo root, creates its quests dir, persists the quest, and returns { questId, guildSlug }', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-autocreate' }),
      });
      // tempDir doubles as DUNGEONMASTER_HOME AND the repo root the cwd resolves to:
      // the guild gets path === repo root === testbed dir.
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      envHarness.writeRepoRootMarker({ repoRoot });
      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const created = guildsAfter[0]!;
      const questsDirExists = envHarness.questsDirExists({
        tempDir: repoRoot,
        guildId: created.guildId,
      });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: created.guildId,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-guild-appended + check-new-guild-slug-returned: exactly one guild (the complete
      // array is [created]), anchored at the repo root, and the returned slug is its urlSlug.
      expect(guildsAfter).toStrictEqual([
        {
          name: created.name,
          path: created.path,
          guildId: created.guildId,
          urlSlug: created.urlSlug,
        },
      ]);
      expect(created.path).toBe(String(repoRoot));
      expect(result.guildSlug).toBe(created.urlSlug);
      // check-quests-dir-created + check-quest-persisted.
      expect(questsDirExists).toBe(true);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('VALID: {a guild already covers the repo root} => reuses it, appends no new guild, returns the existing guild slug', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-reuse' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      envHarness.writeRepoRootMarker({ repoRoot });

      // Pre-register a guild whose path equals the repo root.
      const existing = await GuildAddResponder({
        name: GuildNameStub({ value: 'Existing Covering Guild' }),
        path: repoRoot,
      });

      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: existing.id,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-no-duplicate-when-covered: the complete guilds array is still just the
      // pre-registered guild — no new entry was appended.
      expect(guildsAfter).toStrictEqual([
        {
          name: existing.name,
          path: existing.path,
          guildId: existing.id,
          urlSlug: existing.urlSlug,
        },
      ]);
      // check-existing-guild-slug-returned: the returned slug is the existing guild's urlSlug,
      // and the quest persisted under the EXISTING guild (reuse, not a fresh guild).
      expect(result.guildSlug).toBe(existing.urlSlug);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('VALID: {cwd is a subfolder of an already-registered guild} => reuses the ancestor guild (matches repo root, not the literal subfolder cwd)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-subfolder' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      // .dungeonmaster.json lives ONLY at the repo root, so cwdResolveBroker walking up from the
      // subfolder resolves to the repo root.
      envHarness.writeRepoRootMarker({ repoRoot });

      const ancestor = await GuildAddResponder({
        name: GuildNameStub({ value: 'Ancestor Guild' }),
        path: repoRoot,
      });

      // Create a nested subfolder under the repo root and run create-quest from there.
      const subfolder = GuildPathStub({ value: `${String(repoRoot)}/packages/some-pkg/src` });
      const cwd = envHarness.makeAndChdir({ dir: subfolder });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: ancestor.id,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // The ancestor guild covers the resolved repo root: the complete guilds array is just the
      // ancestor — no duplicate — and the slug + quest belong to it.
      expect(guildsAfter).toStrictEqual([
        {
          name: ancestor.name,
          path: ancestor.path,
          guildId: ancestor.id,
          urlSlug: ancestor.urlSlug,
        },
      ]);
      expect(result.guildSlug).toBe(ancestor.urlSlug);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('EDGE: {no .dungeonmaster.json anywhere up the tree AND no covering guild} => cwdResolveBroker rejects, broker falls back to literal cwd, auto-creates a guild there, and still returns { questId, guildSlug }', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-fallback' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      // setupHome writes config.json but NO .dungeonmaster.json — and /tmp has none up the tree,
      // so cwdResolveBroker walks to filesystem root and throws ProjectRootNotFoundError, exercising
      // the literal-cwd fallback against the real resolver (not a mocked rejection).
      envHarness.setupHome({ tempDir: repoRoot });
      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const created = guildsAfter[0]!;
      const questsDirExists = envHarness.questsDirExists({
        tempDir: repoRoot,
        guildId: created.guildId,
      });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: created.guildId,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-fallback-autocreate-at-cwd: exactly one guild (complete array is [created]) was
      // auto-created with path === literal cwd.
      expect(guildsAfter).toStrictEqual([
        {
          name: created.name,
          path: created.path,
          guildId: created.guildId,
          urlSlug: created.urlSlug,
        },
      ]);
      expect(created.path).toBe(String(repoRoot));
      expect(result.guildSlug).toBe(created.urlSlug);
      expect(questsDirExists).toBe(true);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);
  });
});
