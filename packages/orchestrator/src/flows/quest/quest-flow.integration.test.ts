import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
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
    it('INVALID: {seek_scope, input.steps: [...]} => rejected with forbidden-fields failedCheck', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-bad-steps-in-scope' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Bad Fields Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });
      const addResult = await QuestUserAddResponder({
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
              id: 'backend-attempted-step',
              slice: 'backend',
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

  describe('post-walk hook — pathseeker-walk completion hands off to codeweaver', () => {
    // Regression: completing the LAST pathseeker (pathseeker-walk) momentarily leaves every
    // work item terminal, so the quest derives `complete`. The post-walk hook then appends the
    // pending codeweaver/ward/siege/lawbringer/blightwarden chain — but the quest stays stuck at
    // `complete`, so `loadActiveQuestsLayerBroker` (filters on in_progress) drops it and
    // `get-next-step` returns idle. The codeweaver never launches. This is the exact hole the
    // user hit (quest 014208d8… with pathseekers done, pending codeweavers, get-next-step silent).
    // 35s timeout: on the BROKEN source `get-next-step` long-polls its full ~25s budget before
    // returning idle, so the failing assertion is reached after the wait.
    it('VALID: {pathseeker-walk signals complete} => post-walk codeweaver is dispatched and quest stays in_progress', async () => {
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

      // Mark the pre-existing chaoswhisperer item complete and add a pathseeker-walk that is the
      // only non-terminal item. When it completes, EVERY item is terminal at that instant — this
      // is what trips the premature `complete` derivation.
      const walkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const walkItem = WorkItemStub({
        id: walkItemId,
        role: 'pathseeker-walk',
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

      // pathseeker-walk signals complete → real signal-back handler fires questPostWalkHookBroker,
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
});
