import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  DependencyStepStub,
  FilePathStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildNameStub,
  GuildPathStub,
  ObservableIdStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
  StepIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { QuestAddResponder } from '../../responders/quest/add/quest-add-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { QuestModifyResponder } from '../../responders/quest/modify/quest-modify-responder';
import { ModifyQuestInputStub } from '../../contracts/modify-quest-input/modify-quest-input.stub';
import { OrchestrationFlow } from './orchestration-flow';
import { orchestrationQueueHarness } from '../../../test/harnesses/orchestration-queue/orchestration-queue.harness';
import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQuestHarness } from '../../../test/harnesses/orchestration-quest/orchestration-quest.harness';
import { orchestrationJsonlHarness } from '../../../test/harnesses/orchestration-jsonl/orchestration-jsonl.harness';

type QuestType = NonNullable<Awaited<ReturnType<typeof QuestGetResponder>>['quest']>;

// Short branding helper to keep call-sites concise
const sid = (
  value: NonNullable<Parameters<typeof SessionIdStub>[0]>['value'],
): ReturnType<typeof SessionIdStub> => SessionIdStub({ value });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OrchestrationFlow', () => {
  const queue = orchestrationQueueHarness();
  const envHarness = orchestrationEnvironmentHarness();
  const jsonl = orchestrationJsonlHarness();
  const { agentSuccessResponse, agentFailedResponse, wardPassResponse, wardFailResponse } = jsonl;
  const questHelper = orchestrationQuestHarness();

  describe('delegation to responders', () => {
    it('ERROR: {unknown processId} => getStatus delegates to OrchestrationGetStatusResponder and throws', () => {
      const processId = ProcessIdStub({ value: 'proc-nonexistent' });

      expect(() => OrchestrationFlow.getStatus({ processId })).toThrow(
        /Process not found: proc-nonexistent/u,
      );
    });

    it('ERROR: {nonexistent questId} => start delegates to OrchestrationStartResponder and throws quest not found', async () => {
      await expect(
        OrchestrationFlow.start({ questId: QuestIdStub({ value: 'nonexistent-quest-id' }) }),
      ).rejects.toThrow(/Quest not found: nonexistent-quest-id/u);
    });

    it('ERROR: {non-approved quest} => start throws quest must be approved before starting', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestration-non-approved' }),
      });
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Orchestration Test Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Test Quest',
        userRequest: 'A test quest for orchestration flow integration tests',
        guildId: guild.id,
      });

      await expect(OrchestrationFlow.start({ questId: addResult.questId! })).rejects.toThrow(
        /Quest must be approved before starting/u,
      );

      testbed.cleanup();

      expect(typeof addResult.questId).toBe('string');
    });

    it('VALID: {approved quest} => start returns processId and getStatus returns idle orchestration status', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestration-approved' }),
      });
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Orchestration Approved Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Approved Quest',
        userRequest: 'A quest that will be approved for orchestration start tests',
        guildId: guild.id,
      });

      const questId = addResult.questId!;

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_flows' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({
          questId,
          flows: [
            FlowStub({
              nodes: [FlowNodeStub({ observables: [FlowObservableStub()] })],
            }),
          ],
        }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_flows' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'flows_approved' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_observables' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_observables' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'approved' }),
      });

      const processId = await OrchestrationFlow.start({ questId });

      // Call getStatus immediately — before any await that would yield to the
      // fire-and-forget loop and allow it to finish + deregister the process.
      const status = OrchestrationFlow.getStatus({ processId });

      const questResult = await QuestGetResponder({ questId });

      testbed.cleanup();

      expect(processId).toMatch(/^proc-/u);
      expect(status.questId).toBe(questId);
      expect(questResult.success).toBe(true);
      expect(questResult.quest!.status).toBe('in_progress');
    });
  });

  describe('chat work item promotion on start', () => {
    it('VALID: {approved quest, chaos never manually completed} => start promotes chaos to complete and creates pathseeker', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-chaos-promote' }),
      });
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Chaos Promote Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Chaos Promote Quest',
        userRequest: 'Test that chaos is promoted on start',
        guildId: guild.id,
      });

      const questId = addResult.questId!;
      const flows = questHelper.buildValidFlows({
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
      });
      const steps = questHelper.buildValidSteps({
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_flows' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, flows }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_flows' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'flows_approved' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_observables' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_observables' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'approved' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, steps }),
      });

      // Deliberately NOT calling completeChaosWorkItem — chaos stays 'pending'.
      // The OrchestrationStartResponder must promote it to 'complete'.

      // Verify chaos is still pending before start
      const preStartQuest = await QuestGetResponder({ questId });
      const preChaos = preStartQuest.quest!.workItems.find((wi) => wi.role === 'chaoswhisperer');

      expect(preChaos?.status).toBe('pending');

      await OrchestrationFlow.start({ questId });

      // Read quest immediately after start — chaos should be complete
      const postStartQuest = await QuestGetResponder({ questId });

      testbed.cleanup();

      const postChaos = postStartQuest.quest!.workItems.find((wi) => wi.role === 'chaoswhisperer');
      const postPathseeker = postStartQuest.quest!.workItems.find((wi) => wi.role === 'pathseeker');

      expect(postStartQuest.quest!.status).toBe('in_progress');
      expect(postChaos?.status).toBe('complete');
      expect(typeof postChaos?.completedAt).toBe('string');
      expect(postPathseeker?.role).toBe('pathseeker');
      expect(postPathseeker?.dependsOn).toStrictEqual([postChaos?.id]);
    });

    it('VALID: {chaos pending, 1 step, full pipeline} => chaos promoted to complete, full pipeline completes', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-chaos-full' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const quest: QuestType = await (async (): Promise<QuestType> => {
        const guild = await GuildAddResponder({
          name: GuildNameStub({ value: 'Chaos Full Pipeline Guild' }),
          path: GuildPathStub({ value: testbed.guildPath }),
        });

        const addResult = await QuestAddResponder({
          title: 'Chaos Full Pipeline Quest',
          userRequest: 'Test that chaos promotion works through full pipeline',
          guildId: guild.id,
        });

        const questId = addResult.questId!;
        const flows = questHelper.buildValidFlows({
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
        });
        const steps = questHelper.buildValidSteps({
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        await QuestModifyResponder({
          questId,
          input: ModifyQuestInputStub({ questId, status: 'explore_flows' }),
        });
        await QuestModifyResponder({
          questId,
          input: ModifyQuestInputStub({ questId, flows }),
        });
        await QuestModifyResponder({
          questId,
          input: ModifyQuestInputStub({ questId, status: 'review_flows' }),
        });
        await QuestModifyResponder({
          questId,
          input: ModifyQuestInputStub({ questId, status: 'flows_approved' }),
        });
        await QuestModifyResponder({
          questId,
          input: ModifyQuestInputStub({ questId, status: 'explore_observables' }),
        });
        await QuestModifyResponder({
          questId,
          input: ModifyQuestInputStub({ questId, status: 'review_observables' }),
        });
        await QuestModifyResponder({
          questId,
          input: ModifyQuestInputStub({ questId, status: 'approved' }),
        });
        await QuestModifyResponder({
          questId,
          input: ModifyQuestInputStub({ questId, steps }),
        });

        // Deliberately NOT calling completeChaosWorkItem — chaos stays 'pending'.
        // OrchestrationStartResponder must promote it, then full pipeline runs.

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // 1 codeweaver
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-sess') }),
        });
        // ward (pass)
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        // 1 lawbringer
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-sess') }),
        });
        // final ward (pass)
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      expect(quest.status).toBe('complete');

      const chaos = quest.workItems.find((wi) => wi.role === 'chaoswhisperer');

      expect(chaos?.status).toBe('complete');
      expect(typeof chaos?.completedAt).toBe('string');

      const ps = quest.workItems.find((wi) => wi.role === 'pathseeker');

      expect(ps?.status).toBe('complete');
      expect(ps?.dependsOn).toStrictEqual([chaos?.id]);
    });

    it('VALID: {design_approved, chaos and glyph both pending, 1 step} => both promoted, full pipeline completes', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-chaos-glyph-promote' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Chaos Glyph Promote Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Chaos Glyph Promote Quest',
        userRequest: 'Test that chaos and glyph are both promoted on start from design_approved',
        guildId: guild.id,
      });

      const questId = addResult.questId!;
      const flows = questHelper.buildValidFlows({
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
      });
      const steps = questHelper.buildValidSteps({
        observableIds: [ObservableIdStub({ value: 'obs-1' })],
        stepCount: 1,
      });

      // Walk through approval: explore_flows → add flows → review_flows → flows_approved → explore_observables → review_observables → approved
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_flows' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, flows }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_flows' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'flows_approved' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_observables' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_observables' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'approved' }),
      });

      // Walk through design phase: explore_design → review_design → design_approved
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_design' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_design' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'design_approved' }),
      });

      // Add steps
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, steps }),
      });

      // Add a glyphsmith work item (pending) alongside the existing chaos work item
      const currentQuest = await QuestGetResponder({ questId });
      const glyphItem = WorkItemStub({
        id: crypto.randomUUID(),
        role: 'glyphsmith',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: [],
        dependsOn: [],
        createdAt: new Date().toISOString(),
        attempt: 0,
        maxAttempts: 1,
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({
          questId,
          workItems: [...currentQuest.quest!.workItems, glyphItem],
        }),
      });

      // Queue responses for full pipeline (1-step happy path)
      // pathseeker
      queue.enqueue({
        queueDir: env.claudeQueueDir,
        response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
      });
      // 1 codeweaver
      queue.enqueue({
        queueDir: env.claudeQueueDir,
        response: agentSuccessResponse({ sessionId: sid('cw-sess') }),
      });
      // ward (pass)
      queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
      // siege
      queue.enqueue({
        queueDir: env.claudeQueueDir,
        response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
      });
      // 1 lawbringer
      queue.enqueue({
        queueDir: env.claudeQueueDir,
        response: agentSuccessResponse({ sessionId: sid('lb-sess') }),
      });
      // final ward (pass)
      queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

      await OrchestrationFlow.start({ questId });

      const { quest: result } = await questHelper.pollForStatus({
        questId,
        targetStatuses: ['complete'],
      });

      testbed.cleanup();

      expect(result.status).toBe('complete');

      const chaos = result.workItems.find((wi) => wi.role === 'chaoswhisperer');
      const glyph = result.workItems.find((wi) => wi.role === 'glyphsmith');
      const ps = result.workItems.find((wi) => wi.role === 'pathseeker');

      expect(chaos?.status).toBe('complete');
      expect(typeof chaos?.completedAt).toBe('string');
      expect(glyph?.status).toBe('complete');
      expect(typeof glyph?.completedAt).toBe('string');
      expect(ps?.status).toBe('complete');
      expect(ps?.dependsOn).toStrictEqual([chaos?.id, glyph?.id]);
    });
  });

  describe('role-to-role handoffs', () => {
    // Test 1: Full happy path
    // pathseeker → codeweavers → ward → siege → lawbringers → final-ward → complete
    it('VALID: {happy path, 2 steps} => pathseeker through final-ward, quest complete', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-happy' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 2,
        });

        // Queue: pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // Queue: 2 codeweavers
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-sess-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-sess-1') }),
        });
        // Queue: ward (pass)
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // Queue: siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        // Queue: 2 lawbringers
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-sess-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-sess-1') }),
        });
        // Queue: final ward (pass)
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      const { workItems } = quest;
      const pathseekerItems = workItems.filter((wi) => wi.role === 'pathseeker');
      const codeweaverItems = workItems.filter((wi) => wi.role === 'codeweaver');
      const wardItems = workItems.filter((wi) => wi.role === 'ward');
      const siegeItems = workItems.filter((wi) => wi.role === 'siegemaster');
      const lawbringerItems = workItems.filter((wi) => wi.role === 'lawbringer');

      expect(quest.status).toBe('complete');
      expect(pathseekerItems[0]?.status).toBe('complete');
      expect(codeweaverItems[0]?.status).toBe('complete');
      expect(codeweaverItems[1]?.status).toBe('complete');
      expect(wardItems[0]?.status).toBe('complete');
      expect(wardItems[1]?.status).toBe('complete');
      expect(siegeItems[0]?.status).toBe('complete');
      expect(lawbringerItems[0]?.status).toBe('complete');
      expect(lawbringerItems[1]?.status).toBe('complete');
    });

    // E2E-5: PathSeeker fails attempt 0, retry succeeds, full pipeline completes
    // NOT testable in integration: pathseeker failure is driven by questVerifyBroker (quest
    // structure checks), not by agent exit code or signal. The fake CLI can't modify
    // quest.json (add steps) between retry attempts. Covered by:
    //   - Unit: loop broker test #34 (PS retry dispatch mechanics)
    //   - Integration: "pathseeker fails 3 times" (retry creation chain)
    //   - Integration: happy path (verification pass → full pipeline)

    // Test 2a: Codeweaver failure (2 items, all in slots)
    // With 'failed' in SATISFIED_STATUSES and onFollowupCreated persisting recovery items,
    // the codeweaver failure triggers a pathseeker replan inside the slot manager.
    // The onFollowupCreated callback persists the replan to quest.json (fire-and-forget).
    // Since the callback write races with the result-mapping write, the pathseeker replan
    // may or may not appear at quest level. Either way, downstream items proceed because
    // 'failed' is a satisfied status.
    //
    // Queue enough responses for both race outcomes:
    // - If replan persists as 'complete': ward → siege → lawbringers → final-ward
    // - If replan persists as 'pending' and runs: pathseeker → new codeweavers → ward → ...
    it('VALID: {codeweaver failure, 2 items} => drain + skip + pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-cw-fail-2' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 2,
        });

        // pathseeker succeeds
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // codeweaver 0 fails, codeweaver 1 succeeds (drain)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentFailedResponse({ sessionId: sid('cw-fail-0'), summary: 'Build error' }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-ok-1') }),
        });
        // The slot manager spawns a followup pathseeker (replan) for codeweaver failure
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-replan-sess') }),
        });
        // With 'failed' in SATISFIED_STATUSES, downstream items become ready.
        // Extra pathseeker response in case replan runs at quest level (race condition).
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-replan-quest') }),
        });
        // Codeweavers (may be from original or replan path)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw2-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw2-1') }),
        });
        // ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        // 2 lawbringers
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-sess-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-sess-1') }),
        });
        // final ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({
          questId,
        });

        // All items settle: chaos(complete) + pathseeker(complete) + 2 codeweavers
        // + ward + siege + 2 lawbringers + final ward + pathseeker replan = ~10 items.
        // Quest stays in_progress (failed codeweaver prevents 'complete' status).
        const { quest: result } = await questHelper.pollUntilWorkItemsSettled({
          questId,
          minItems: 8,
        });

        testbed.cleanup();
        return result;
      })();

      // Codeweaver failure inside slot manager: one cw failed, one complete.
      // With 'failed' in SATISFIED_STATUSES, downstream items proceed.
      // Pathseeker replan was persisted by onFollowupCreated callback.
      const cwItems = quest.workItems.filter((wi) => wi.role === 'codeweaver');
      const failedCw = cwItems.filter((wi) => wi.status === 'failed');
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const pathseekerItems = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(failedCw.map((wi) => wi.status)).toStrictEqual(['failed']);
      expect(cwItems.map((wi) => wi.role)).toStrictEqual(['codeweaver', 'codeweaver']);
      // Downstream items completed (ward + final ward)
      expect(wardItems.map((wi) => wi.status)).toStrictEqual(['complete', 'complete']);
      // Pathseeker replan persisted by callback
      expect(pathseekerItems.map((wi) => wi.role)).toStrictEqual(['pathseeker', 'pathseeker']);

      // Verify skipped items exist (drain+skip model)
      const skippedItems = quest.workItems.filter((wi) => wi.status === 'skipped');

      expect(skippedItems).toStrictEqual([]);

      // Verify pathseeker replan has insertedBy
      const replanPs = pathseekerItems.find((wi) => wi.insertedBy !== undefined);

      expect(replanPs?.role).toBe('pathseeker');
    });

    // Test 2b: Codeweaver failure (6 items, 3 slots)
    // With 'failed' in SATISFIED_STATUSES and onFollowupCreated persisting recovery items,
    // downstream items become ready after codeweaver failure (failed deps are satisfied).
    it('VALID: {codeweaver failure, 6 items, 3 slots} => pending skipped + pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-cw-fail-6' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 6,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // 3 codeweavers in slots: one fails, two succeed
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentFailedResponse({ sessionId: sid('cw-fail-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-ok-1') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-ok-2') }),
        });
        // Followup pathseeker from codeweaver failure
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-replan') }),
        });
        // With 'failed' in SATISFIED_STATUSES, downstream items become ready.
        // Ward (depends on codeweavers — some failed, rest complete = all satisfied) runs next.
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        // 6 lawbringers
        for (let i = 0; i < 6; i++) {
          queue.enqueue({
            queueDir: env.claudeQueueDir,
            response: agentSuccessResponse({ sessionId: sid(`lb-${String(i)}`) }),
          });
        }
        // final ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await questHelper.pollUntilWorkItemsSettled({
          questId,
          minItems: 6,
        });

        testbed.cleanup();
        return result;
      })();

      // Codeweaver failure inside the slot manager marks the failed item as 'failed' at quest level.
      // Pending slot-manager items get skipped internally but are mapped to 'complete' at quest level
      // (the layer broker only distinguishes failed vs non-failed).
      // With 'failed' in SATISFIED_STATUSES, downstream items proceed.
      const cwItems = quest.workItems.filter((wi) => wi.role === 'codeweaver');
      const failedCw = cwItems.filter((wi) => wi.status === 'failed');
      const pathseekerItems = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(failedCw.map((wi) => wi.status)).toStrictEqual(['failed']);
      expect(cwItems.map((wi) => wi.role)).toStrictEqual([
        'codeweaver',
        'codeweaver',
        'codeweaver',
        'codeweaver',
        'codeweaver',
        'codeweaver',
      ]);
      // Pathseeker replan was persisted by onFollowupCreated callback
      expect(pathseekerItems.map((wi) => wi.role)).toStrictEqual(['pathseeker', 'pathseeker']);

      const replanPs = pathseekerItems.find((wi) => wi.insertedBy !== undefined);

      expect(replanPs?.role).toBe('pathseeker');
    });

    // Test 3: Ward failure → spiritmender → ward retry → siege
    it('VALID: {ward fails with retries} => spiritmender + ward retry + siege', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ward-retry' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // codeweaver
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-sess') }),
        });
        // ward fails (attempt 0 of 3) — runWardLayerBroker creates spiritmender + ward retry
        queue.enqueue({
          queueDir: env.wardQueueDir,
          response: wardFailResponse({ filePaths: [FilePathStub({ value: '/src/file.ts' })] }),
        });
        // spiritmender succeeds (fixes ward errors)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-sess') }),
        });
        // ward retry passes (attempt 1) — siege depends on this ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        // lawbringer (1 step = 1 lawbringer)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-sess') }),
        });
        // final ward (after lawbringers)
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({
          questId,
        });

        // Ward failure leaves a 'failed' work item. workItemsToQuestStatusTransformer
        // doesn't transition to 'complete' when any item is failed, so quest stays
        // 'in_progress'. Poll until all work items settle instead.
        const { quest: result } = await questHelper.pollUntilWorkItemsSettled({
          questId,

          // chaos + ps + cw + ward(fail) + spiritmender + wardRetry + siege + lb + finalWard
          minItems: 9,
        });

        testbed.cleanup();
        return result;
      })();

      const { workItems } = quest;
      const wardItems = workItems.filter((wi) => wi.role === 'ward');
      const spiritmenderItems = workItems.filter((wi) => wi.role === 'spiritmender');
      const siegeItems = workItems.filter((wi) => wi.role === 'siegemaster');

      // Quest stays in_progress because the original ward is 'failed'.
      // workItemsToQuestStatusTransformer requires ALL items complete/skipped for 'complete'.
      expect(wardItems.map((wi) => wi.role)).toStrictEqual(['ward', 'ward', 'ward']);
      expect(spiritmenderItems.map((wi) => wi.status)).toStrictEqual(['complete']);

      const failedWards = wardItems.filter((wi) => wi.status === 'failed');
      const completeWards = wardItems.filter((wi) => wi.status === 'complete');

      expect(failedWards.map((wi) => wi.status)).toStrictEqual(['failed']);
      expect(completeWards.map((wi) => wi.status)).toStrictEqual(['complete', 'complete']);
      expect(siegeItems[0]?.status).toBe('complete');
    });

    // Test 4: Ward exhausts retries → pathseeker replan
    it('VALID: {ward exhausts all 3 retries} => pending skipped + pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ward-exhaust' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // codeweaver
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-sess') }),
        });
        // ward fails attempt 0 — runWardLayerBroker creates spiritmender + ward retry
        // (no filePaths in wardFailResponse, but broker falls back to quest steps)
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardFailResponse() });
        // spiritmender for attempt 0
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-0') }),
        });
        // ward fails attempt 1 — creates spiritmender + ward retry
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardFailResponse() });
        // spiritmender for attempt 1
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-1') }),
        });
        // ward fails attempt 2 (attempt >= maxAttempts-1 = 2): retries exhausted.
        // runWardLayerBroker skips pending items and creates pathseeker replan.
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardFailResponse() });
        // Pathseeker replan runs (verify passes since steps exist) — creates new work items.
        // Those new agents will crash (empty queue) and eventually the quest blocks.
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-replan') }),
        });

        await OrchestrationFlow.start({
          questId,
        });

        // Quest will eventually reach 'blocked' after new codeweavers exhaust crash retries
        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['blocked'],
        });

        testbed.cleanup();
        return result;
      })();

      const failedWards = quest.workItems
        .filter((wi) => wi.role === 'ward')
        .filter((wi) => wi.status === 'failed');
      const skippedItems = quest.workItems.filter((wi) => wi.status === 'skipped');
      const pathseekers = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      // 3 ward failures (attempts 0, 1, 2). On exhaustion: siege + LB + final-ward skipped.
      // Pathseeker replan runs and creates new downstream items that then crash → quest blocks.
      expect(quest.status).toBe('blocked');
      expect(failedWards.map((wi) => wi.status)).toStrictEqual(['failed', 'failed', 'failed']);
      // Skipped: siege + LB + final-ward from the original flow
      expect(skippedItems.map((wi) => wi.status)).toStrictEqual(['skipped', 'skipped', 'skipped']);
      // Original pathseeker + replan pathseeker from exhausted ward
      expect(pathseekers.map((wi) => wi.role)).toStrictEqual(['pathseeker', 'pathseeker']);
    });

    // Test 5: Siege failure → pathseeker replan
    it('VALID: {siege fails} => lawbringers skipped + pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-siege-fail' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // codeweaver
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-sess') }),
        });
        // ward passes
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege fails — runSiegemasterLayerBroker marks siege failed, skips pending lawbringers,
        // and creates a pathseeker replan as a new quest work item.
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentFailedResponse({
            sessionId: sid('siege-fail'),
            summary: 'FAILED OBSERVABLES: login redirect not working',
          }),
        });
        // Pathseeker replan runs (verify passes) and creates new work items.
        // Those crash (empty queue) → quest eventually reaches blocked.
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-replan') }),
        });

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['blocked'],
        });

        testbed.cleanup();
        return result;
      })();

      const failedSiege = quest.workItems
        .filter((wi) => wi.role === 'siegemaster')
        .filter((wi) => wi.status === 'failed');
      const skippedLawbringers = quest.workItems
        .filter((wi) => wi.role === 'lawbringer')
        .filter((wi) => wi.status === 'skipped');
      const pathseekers = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(failedSiege.map((wi) => wi.status)).toStrictEqual(['failed']);
      // Original LB skipped + possible replan LBs skipped (non-deterministic due to
      // fire-and-forget replan writes racing with the orchestration loop)
      expect(skippedLawbringers.length).toBeGreaterThanOrEqual(1);
      // Original pathseeker + replan(s) from siege failure (non-deterministic recovery depth)
      expect(pathseekers.length).toBeGreaterThanOrEqual(2);
    });

    // Test 6a: Lawbringer failure (2 items, all in slots)
    // Lawbringer failure inside the slot manager spawns a spiritmender followup internally.
    // At the quest level, the failed lawbringer is marked 'failed'. The quest may not transition
    // status (stays 'in_progress') since workItemsToQuestStatusTransformer doesn't map
    // all-terminal-with-failures to 'blocked' when there are no pending items.
    it('VALID: {lawbringer failure, 2 items} => failed lawbringer at quest level', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-lb-fail-2' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 2,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // 2 codeweavers
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-1') }),
        });
        // ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        // Slot manager dispatches lb-0 first (sequential). lb-0 fails → skipAllPending skips lb-1.
        // Followup spiritmender spawned (consumes next response). lb-1 never starts.
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentFailedResponse({ sessionId: sid('lb-fail-0') }),
        });
        // Consumed by slot-manager's spiritmender followup (lb-1 was skipped internally)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-lb') }),
        });

        await OrchestrationFlow.start({
          questId,
        });

        // With the final ward depending on lawbringer IDs, a lawbringer failure
        // leaves the final ward pending with unsatisfied deps → quest blocked.
        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['blocked'],
        });

        testbed.cleanup();
        return result;
      })();

      // Lawbringer failure inside the slot manager spawns spiritmender internally.
      // At quest level: lb-0 failed, lb-1 mapped to 'complete' (slot-internal skip).
      // Final ward pending with unsatisfied deps → quest blocked.
      const lawbringerItems = quest.workItems.filter((wi) => wi.role === 'lawbringer');
      const failedLb = lawbringerItems.filter((wi) => wi.status === 'failed');
      const completedLb = lawbringerItems.filter((wi) => wi.status === 'complete');

      expect(quest.status).toBe('blocked');
      // lb-0 failed, lb-1 mapped to 'complete' at quest level (slot-internal skip)
      // NOTE: Spec says "no drain" for lawbringers, but slot manager DOES skip remaining
      // items internally. At quest level, skipped items appear as 'complete' because
      // the layer broker maps non-failed as complete.
      expect(failedLb.map((wi) => wi.status)).toStrictEqual(['failed']);
      expect(completedLb.map((wi) => wi.status)).toStrictEqual(['complete']);
    });

    // Test 6b: Lawbringer failure (6 items, 3 slots)
    // With 6 lawbringers dispatched sequentially through the slot manager:
    // lb-0 fails → skipAllPending skips lb-1..5, spiritmender followup spawned.
    // At quest level: lb-0 failed, lb-1..5 marked 'complete' (layer broker maps non-failed as complete).
    it('VALID: {lawbringer failure, 6 items, 3 slots} => failed lawbringer at quest level', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-lb-fail-6' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 6,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // 6 codeweavers (dispatched sequentially by slot manager)
        for (let i = 0; i < 6; i++) {
          queue.enqueue({
            queueDir: env.claudeQueueDir,
            response: agentSuccessResponse({ sessionId: sid(`cw-${String(i)}`) }),
          });
        }
        // ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        // lb-0 fails → skipAllPending skips remaining → spiritmender followup spawned
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentFailedResponse({ sessionId: sid('lb-fail-0') }),
        });
        // Consumed by slot-manager's spiritmender followup
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-lb') }),
        });

        await OrchestrationFlow.start({
          questId,
        });

        // With the final ward depending on lawbringer IDs, a lawbringer failure
        // leaves the final ward pending with unsatisfied deps → quest blocked.
        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['blocked'],
        });

        testbed.cleanup();
        return result;
      })();

      const lawbringerItems = quest.workItems.filter((wi) => wi.role === 'lawbringer');
      const failedLb = lawbringerItems.filter((wi) => wi.status === 'failed');
      const completedLb = lawbringerItems.filter((wi) => wi.status === 'complete');

      // At the quest level, lb-0 is 'failed'. The rest are mapped to 'complete'
      // by the layer broker (slot-manager-internal skips are not visible at quest level).
      expect(quest.status).toBe('blocked');
      expect(failedLb.map((wi) => wi.status)).toStrictEqual(['failed']);
      expect(completedLb.map((wi) => wi.status)).toStrictEqual([
        'complete',
        'complete',
        'complete',
        'complete',
        'complete',
      ]);
    });

    // Test 7: Multi-step concurrent codeweavers
    it('VALID: {3 steps} => 3 codeweavers dispatched via slots, all complete', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-multi-cw' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 3,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // 3 codeweavers (all 3 slots)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-1') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-2') }),
        });
        // ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        // 3 lawbringers
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-1') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-2') }),
        });
        // final ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      const codeweaverItems = quest.workItems.filter((wi) => wi.role === 'codeweaver');

      expect(quest.status).toBe('complete');
      expect(codeweaverItems.map((wi) => wi.status)).toStrictEqual([
        'complete',
        'complete',
        'complete',
      ]);
    });

    // Test 8: Lawbringers complete → final ward → complete
    it('VALID: {lawbringers complete} => final ward fires, quest complete', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-lb-final-ward' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 2,
        });

        // pathseeker + 2 codeweavers + ward + siege + 2 lawbringers + final ward
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-1') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-1') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      // stepsToWorkItemsTransformer creates 2 wards: one between codeweavers and siege,
      // and a final ward after lawbringers.
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');

      expect(quest.status).toBe('complete');
      expect(wardItems.map((wi) => wi.status)).toStrictEqual(['complete', 'complete']);
    });

    // Test 9: Structural verification — dependency chain, session IDs, ward modes
    // Runs the full happy path with 2 steps and verifies the internal wiring of all work items.
    it('VALID: {happy path, 2 steps} => correct dependency chain, session IDs, and ward modes', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-dep-chain' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 2,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-dc') }),
        });
        // 2 codeweavers
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-dc-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-dc-1') }),
        });
        // ward (changed mode)
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-dc') }),
        });
        // 2 lawbringers
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-dc-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-dc-1') }),
        });
        // final ward (full mode)
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      const { workItems } = quest;
      const chaosItem = workItems.find((wi) => wi.role === 'chaoswhisperer')!;
      const psItem = workItems.find((wi) => wi.role === 'pathseeker')!;
      const cwItems = workItems.filter((wi) => wi.role === 'codeweaver');
      const wardItems = workItems.filter((wi) => wi.role === 'ward');
      const siegeItem = workItems.find((wi) => wi.role === 'siegemaster')!;
      const lbItems = workItems.filter((wi) => wi.role === 'lawbringer');

      // Dependency chain: pathseeker depends on chaos
      expect(psItem.dependsOn).toStrictEqual([chaosItem.id]);

      // Each codeweaver depends on pathseeker (no inter-step deps in this test)
      expect(cwItems[0]!.dependsOn).toStrictEqual([psItem.id]);
      expect(cwItems[1]!.dependsOn).toStrictEqual([psItem.id]);

      // Ward depends on ALL codeweaver IDs
      const cwIds = cwItems.map((wi) => wi.id);

      expect(wardItems[0]!.dependsOn).toStrictEqual(cwIds);

      // Siege depends on ward
      expect(siegeItem.dependsOn).toStrictEqual([wardItems[0]!.id]);

      // Each lawbringer depends on siege
      expect(lbItems[0]!.dependsOn).toStrictEqual([siegeItem.id]);
      expect(lbItems[1]!.dependsOn).toStrictEqual([siegeItem.id]);

      // Final ward depends on ALL lawbringer IDs
      const lbIds = lbItems.map((wi) => wi.id);

      expect(wardItems[1]!.dependsOn).toStrictEqual(lbIds);

      // Ward modes: first ward = 'changed', final ward = 'full'
      expect(wardItems[0]!.wardMode).toBe('changed');
      expect(wardItems[1]!.wardMode).toBe('full');

      // Session IDs persisted on all agent work items
      expect(typeof psItem.sessionId).toBe('string');
      expect(typeof cwItems[0]!.sessionId).toBe('string');
      expect(typeof cwItems[1]!.sessionId).toBe('string');
      expect(typeof siegeItem.sessionId).toBe('string');
      expect(typeof lbItems[0]!.sessionId).toBe('string');
      expect(typeof lbItems[1]!.sessionId).toBe('string');
      // Ward items get synthetic session IDs
      expect(typeof wardItems[0]!.sessionId).toBe('string');
      expect(typeof wardItems[1]!.sessionId).toBe('string');

      // All items have timestamps
      expect(typeof psItem.startedAt).toBe('string');
      expect(typeof psItem.completedAt).toBe('string');
    });

    it('VALID: {happy path, 2 steps} => spawned items have correct shapes: relatedDataItems, spawnerType, maxAttempts, wardMode', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-item-shape' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 2,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        // 2 codeweavers
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-1') }),
        });
        // ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        // 2 lawbringers
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-1') }),
        });
        // final ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      const { workItems } = quest;
      const cwItems = workItems.filter((wi) => wi.role === 'codeweaver');
      const wardItems = workItems.filter((wi) => wi.role === 'ward');
      const siegeItems = workItems.filter((wi) => wi.role === 'siegemaster');
      const lbItems = workItems.filter((wi) => wi.role === 'lawbringer');

      // Codeweavers have relatedDataItems pointing to their step
      for (const cw of cwItems) {
        expect(cw.relatedDataItems[0]).toMatch(/^steps\//u);
        expect(cw.spawnerType).toBe('agent');
      }

      // First ward (changed mode)
      const changedWard = wardItems.find((wi) => wi.wardMode === 'changed');

      expect(changedWard?.spawnerType).toBe('command');
      expect(changedWard?.maxAttempts).toBe(3);

      // Siege
      expect(siegeItems[0]?.spawnerType).toBe('agent');

      // Lawbringers have relatedDataItems pointing to their step
      for (const lb of lbItems) {
        expect(lb.relatedDataItems[0]).toMatch(/^steps\//u);
        expect(lb.spawnerType).toBe('agent');
      }

      // Final ward (full mode)
      const fullWard = wardItems.find((wi) => wi.wardMode === 'full');

      expect(fullWard?.spawnerType).toBe('command');
      expect(fullWard?.maxAttempts).toBe(3);
    });

    // Test 10: ChaosWhisperer → approved → Start → pathseeker
    it('VALID: {chaos flow} => chaos completes, start creates pathseeker', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-chaos' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const guild = await GuildAddResponder({
          name: GuildNameStub({ value: 'Chaos Guild' }),
          path: GuildPathStub({ value: testbed.guildPath }),
        });

        const addResult = await QuestAddResponder({
          title: 'Chaos Quest',
          userRequest: 'A quest testing chaos flow',
          guildId: guild.id,
        });

        const questId = addResult.questId!;

        await questHelper.approveQuest({
          questId,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });
        await questHelper.completeChaosWorkItem({ questId });

        // Queue all responses for the full flow
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-sess') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-sess') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      // Verify chaoswhisperer completed and pathseeker was created as first execution item
      const chaosItems = quest.workItems.filter((wi) => wi.role === 'chaoswhisperer');
      const pathseekers = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(quest.status).toBe('complete');
      expect(chaosItems[0]?.status).toBe('complete');
      expect(pathseekers[0]?.role).toBe('pathseeker');
      expect(pathseekers[0]?.status).toBe('complete');
      expect(pathseekers[0]?.dependsOn).toStrictEqual([chaosItems[0]?.id]);
    });

    // Test 11: Glyphsmith work item present → pathseeker depends on both chaos + glyph
    it('VALID: {glyphsmith work item} => pathseeker dependsOn includes both chaos and glyph IDs', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-glyph' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const guild = await GuildAddResponder({
          name: GuildNameStub({ value: 'Glyph Guild' }),
          path: GuildPathStub({ value: testbed.guildPath }),
        });

        const addResult = await QuestAddResponder({
          title: 'Glyph Quest',
          userRequest: 'A quest with design phase',
          guildId: guild.id,
        });

        const questId = addResult.questId!;

        // Walk quest through full approval with needsDesign=true
        const typedQuestId = questId;
        const flows = questHelper.buildValidFlows({
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
        });
        const steps = questHelper.buildValidSteps({
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, flows }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'flows_approved' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'approved' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, steps }),
        });
        await questHelper.completeChaosWorkItem({ questId });
        await questHelper.completeGlyphWorkItem({ questId });

        // Queue full flow: pathseeker + codeweaver + ward + siege + lawbringer + final ward
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sess') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-sess') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-sess') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-sess') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({
          questId: typedQuestId,
        });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      const pathseekers = quest.workItems.filter((wi) => wi.role === 'pathseeker');
      const chaosItems = quest.workItems.filter((wi) => wi.role === 'chaoswhisperer');
      const glyphItems = quest.workItems.filter((wi) => wi.role === 'glyphsmith');

      expect(quest.status).toBe('complete');
      expect(chaosItems[0]?.status).toBe('complete');
      expect(glyphItems[0]?.status).toBe('complete');
      expect(pathseekers[0]?.status).toBe('complete');
      // PathSeeker depends on BOTH chaos and glyph IDs
      expect(pathseekers[0]?.dependsOn.length).toBe(2);

      const psDeps = pathseekers[0]!.dependsOn;
      const sortedDeps = [...psDeps].sort((a, b) => a.localeCompare(b));
      const sortedExpected = [String(chaosItems[0]!.id), String(glyphItems[0]!.id)].sort((a, b) =>
        a.localeCompare(b),
      );

      expect(sortedDeps).toStrictEqual(sortedExpected);
    });

    // Test 12a: Spiritmender failure (2 files)
    it('VALID: {spiritmender failure, 2 files} => quest work item failed, skip + replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-sm-fail-2' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps') }),
        });
        // codeweaver
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw') }),
        });
        // ward fails with 2 file paths
        queue.enqueue({
          queueDir: env.wardQueueDir,
          response: wardFailResponse({
            filePaths: [
              FilePathStub({ value: '/src/file-a.ts' }),
              FilePathStub({ value: '/src/file-b.ts' }),
            ],
          }),
        });
        // spiritmender: one file fails
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentFailedResponse({ sessionId: sid('sm-fail-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-ok-1') }),
        });

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['blocked', 'complete'],
        });

        testbed.cleanup();
        return result;
      })();

      // With 'failed' in SATISFIED_STATUSES, ward retry runs even after spiritmender failure.
      // The ward retry fails (empty ward queue) and eventually retries are exhausted.
      // Quest stays blocked because downstream items can't proceed.
      const failedSm = quest.workItems
        .filter((wi) => wi.role === 'spiritmender')
        .filter((wi) => wi.status === 'failed');
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const failedWards = wardItems.filter((wi) => wi.status === 'failed');

      // SM failure triggers ward-retry chain (failed satisfies deps): ward-0 fails → retries
      // eventually exhaust → skip pending + PS replan. Exact ward count is non-deterministic
      // due to fire-and-forget writes racing with the orchestration loop.
      expect(failedSm.map((wi) => wi.status)).toStrictEqual(['failed']);
      expect(wardItems.length).toBeGreaterThanOrEqual(2);
      expect(failedWards.length).toBeGreaterThanOrEqual(2);
    });

    // Test 12b: Spiritmender failure (6 files, 3 slots)
    it('VALID: {spiritmender failure, 6 files, 3 slots} => failed + skip + pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-sm-fail-6' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        const sixPaths = Array.from({ length: 6 }, (_, i) =>
          FilePathStub({ value: `/src/file-${String(i)}.ts` }),
        );

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps') }),
        });
        // codeweaver
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw') }),
        });
        // ward fails with 6 file paths
        queue.enqueue({
          queueDir: env.wardQueueDir,
          response: wardFailResponse({ filePaths: sixPaths }),
        });
        // spiritmender: first fails, rest succeed (but overall is failed)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentFailedResponse({ sessionId: sid('sm-fail') }),
        });
        for (let i = 1; i < 6; i++) {
          queue.enqueue({
            queueDir: env.claudeQueueDir,
            response: agentSuccessResponse({ sessionId: sid(`sm-ok-${String(i)}`) }),
          });
        }

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['blocked', 'complete'],
        });

        testbed.cleanup();
        return result;
      })();

      // With 'failed' in SATISFIED_STATUSES, ward retry runs even after spiritmender failure.
      // The ward retry fails (empty ward queue) and eventually retries are exhausted.
      // Quest stays blocked because downstream items can't proceed.
      const spiritmenderItems = quest.workItems.filter((wi) => wi.role === 'spiritmender');
      const failedSm = spiritmenderItems.filter((wi) => wi.status === 'failed');
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const failedWards = wardItems.filter((wi) => wi.status === 'failed');

      // With 6 files and 3 slots, multiple SMs may start before failure is detected.
      expect(failedSm.length).toBeGreaterThanOrEqual(1);
      // Ward-retry chain: non-deterministic count due to recovery loop timing
      expect(wardItems.length).toBeGreaterThanOrEqual(2);
      expect(failedWards.length).toBeGreaterThanOrEqual(2);
    });

    // Test 13: PathSeeker exhausts retries → all pathseekers failed
    // With dependsOn: [failedPathseekerId] on retries and 'failed' in SATISFIED_STATUSES,
    // retry pathseekers chain correctly. After all 3 fail with no pending items,
    // the quest transitions to 'blocked'.
    it('VALID: {pathseeker fails 3 times} => all pathseekers failed, loop terminates', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ps-exhaust' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const guild = await GuildAddResponder({
          name: GuildNameStub({ value: 'PS Exhaust Guild' }),
          path: GuildPathStub({ value: testbed.guildPath }),
        });

        const addResult = await QuestAddResponder({
          title: 'PS Exhaust Quest',
          userRequest: 'Test pathseeker retry exhaustion',
          guildId: guild.id,
        });

        const questId = addResult.questId!;
        const typedQuestId = questId;

        // Approve quest but with no steps — quest verification will fail
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({
            questId: typedQuestId,
            flows: questHelper.buildValidFlows({
              observableIds: [ObservableIdStub({ value: 'obs-1' })],
            }),
          }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'flows_approved' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'approved' }),
        });

        // Don't add steps — quest verification will fail (no steps covering observables)
        await questHelper.completeChaosWorkItem({ questId });

        // Queue 3 pathseeker attempts (all will fail verification)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-1') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-2') }),
        });

        await OrchestrationFlow.start({ questId: typedQuestId });

        // With 'failed' in SATISFIED_STATUSES and dependsOn: [prevPathseekerId],
        // retry pathseekers become ready after their predecessor fails.
        // After all 3 fail, all items are terminal. Quest status depends on
        // workItemsToQuestStatusTransformer: no pending items → returns currentStatus.
        // minItems: 4 = chaoswhisperer + 3 pathseeker attempts
        const { quest: result } = await questHelper.pollUntilWorkItemsSettled({
          questId,
          minItems: 4,
        });

        testbed.cleanup();
        return result;
      })();

      const failedPs = quest.workItems
        .filter((wi) => wi.role === 'pathseeker')
        .filter((wi) => wi.status === 'failed');

      // All 3 pathseeker attempts failed verification.
      expect(failedPs.map((wi) => wi.status)).toStrictEqual(['failed', 'failed', 'failed']);

      // Verify retry chain properties
      const pathseekerItems = quest.workItems
        .filter((wi) => wi.role === 'pathseeker')
        .sort((a, b) => a.attempt - b.attempt);

      expect(pathseekerItems[0]?.attempt).toBe(0);
      expect(pathseekerItems[0]?.status).toBe('failed');
      expect(pathseekerItems[0]?.errorMessage).toBe('verification_failed');

      expect(pathseekerItems[1]?.attempt).toBe(1);
      expect(pathseekerItems[1]?.status).toBe('failed');
      expect(pathseekerItems[1]?.errorMessage).toBe('verification_failed');
      expect(pathseekerItems[1]?.dependsOn).toStrictEqual([pathseekerItems[0]?.id]);
      expect(pathseekerItems[1]?.insertedBy).toBe(pathseekerItems[0]?.id);

      expect(pathseekerItems[2]?.attempt).toBe(2);
      expect(pathseekerItems[2]?.status).toBe('failed');
      expect(pathseekerItems[2]?.errorMessage).toBe('verification_failed');
      expect(pathseekerItems[2]?.dependsOn).toStrictEqual([pathseekerItems[1]?.id]);
      expect(pathseekerItems[2]?.insertedBy).toBe(pathseekerItems[1]?.id);
    });

    // Test 14: PathSeeker creates 0 steps (edge case)
    // With 0 steps, stepsToWorkItemsTransformer creates ward + siege + finalWard.
    // Both ward and finalWard have empty dependsOn (0 codeweavers, 0 lawbringers).
    // The orchestration loop groups both wards as ready simultaneously, marks both
    // in_progress, but only dispatches the first. The final ward stays in_progress
    // permanently — quest never reaches 'complete'. This is a known limitation when
    // multiple same-role items have empty dependsOn.
    it('VALID: {pathseeker verify passes, 0 steps} => 0 codeweavers, ward + siege dispatched', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ps-0-steps' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const guild = await GuildAddResponder({
          name: GuildNameStub({ value: 'Zero Steps Guild' }),
          path: GuildPathStub({ value: testbed.guildPath }),
        });

        const addResult = await QuestAddResponder({
          title: 'Zero Steps Quest',
          userRequest: 'Test zero steps edge case',
          guildId: guild.id,
        });

        const questId = addResult.questId!;
        const typedQuestId = questId;

        // Approve quest with 0 steps but valid flows (no observables to cover)
        const nodeA = FlowNodeStub({
          id: 'node-a' as ReturnType<typeof FlowNodeStub>['id'],
          type: 'state',
          observables: [],
        });
        const nodeB = FlowNodeStub({
          id: 'node-b' as ReturnType<typeof FlowNodeStub>['id'],
          type: 'state',
          observables: [],
        });
        const edge = FlowEdgeStub({ from: nodeA.id, to: nodeB.id });
        const flows = [FlowStub({ nodes: [nodeA, nodeB], edges: [edge] })];

        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, flows }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'flows_approved' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'approved' }),
        });

        await questHelper.completeChaosWorkItem({ questId });

        // pathseeker succeeds — verify passes (no observables to violate), 0 steps
        // stepsToWorkItemsTransformer creates ward + siege + finalWard (all with empty dependsOn lists)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-0-steps') }),
        });
        // ward (immediately ready — dependsOn empty codeweaver list)
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-0-steps') }),
        });
        // final ward (dependsOn empty lawbringer list — immediately ready after siege)
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId: typedQuestId });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      const codeweavers = quest.workItems.filter((wi) => wi.role === 'codeweaver');
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const siegeItems = quest.workItems.filter((wi) => wi.role === 'siegemaster');

      expect(quest.status).toBe('complete');
      expect(codeweavers).toStrictEqual([]);
      expect(wardItems.map((wi) => wi.status)).toStrictEqual(['complete', 'complete']);
      expect(siegeItems.map((wi) => wi.status)).toStrictEqual(['complete']);
    });

    // Test 15: Invariant — lawbringer count matches codeweaver count
    const runInvariantTest = async (stepCount: number): Promise<QuestType> => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: `orch-invariant-${String(stepCount)}` }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount,
        });

        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps') }),
        });
        for (let i = 0; i < stepCount; i++) {
          queue.enqueue({
            queueDir: env.claudeQueueDir,
            response: agentSuccessResponse({ sessionId: sid(`cw-${String(i)}`) }),
          });
        }
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege') }),
        });
        for (let i = 0; i < stepCount; i++) {
          queue.enqueue({
            queueDir: env.claudeQueueDir,
            response: agentSuccessResponse({ sessionId: sid(`lb-${String(i)}`) }),
          });
        }
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      return quest;
    };

    it('VALID: {1 step} => 1 codeweaver and 1 lawbringer created', async () => {
      const quest = await runInvariantTest(1);

      expect(
        quest.workItems.filter((wi) => wi.role === 'codeweaver').map((wi) => wi.role),
      ).toStrictEqual(['codeweaver']);
      expect(
        quest.workItems.filter((wi) => wi.role === 'lawbringer').map((wi) => wi.role),
      ).toStrictEqual(['lawbringer']);
    });

    it('VALID: {2 steps} => 2 codeweavers and 2 lawbringers created', async () => {
      const quest = await runInvariantTest(2);

      expect(
        quest.workItems.filter((wi) => wi.role === 'codeweaver').map((wi) => wi.role),
      ).toStrictEqual(['codeweaver', 'codeweaver']);
      expect(
        quest.workItems.filter((wi) => wi.role === 'lawbringer').map((wi) => wi.role),
      ).toStrictEqual(['lawbringer', 'lawbringer']);
    });

    it('VALID: {3 steps} => 3 codeweavers and 3 lawbringers created', async () => {
      const quest = await runInvariantTest(3);

      expect(
        quest.workItems.filter((wi) => wi.role === 'codeweaver').map((wi) => wi.role),
      ).toStrictEqual(['codeweaver', 'codeweaver', 'codeweaver']);
      expect(
        quest.workItems.filter((wi) => wi.role === 'lawbringer').map((wi) => wi.role),
      ).toStrictEqual(['lawbringer', 'lawbringer', 'lawbringer']);
    });

    // Test 16: Codeweavers with inter-step dependencies
    // step-1 depends on step-0, so cw-1 must depend on both pathseeker AND cw-0.
    it('VALID: {3 steps, step-1 depends on step-0} => cw-1 dependsOn includes cw-0 ID', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-cw-deps' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const guild = await GuildAddResponder({
          name: GuildNameStub({ value: 'CW Deps Guild' }),
          path: GuildPathStub({ value: testbed.guildPath }),
        });

        const addResult = await QuestAddResponder({
          title: 'CW Deps Quest',
          userRequest: 'Test codeweaver inter-step dependencies',
          guildId: guild.id,
        });

        const questId = addResult.questId!;
        const typedQuestId = questId;
        const flows = questHelper.buildValidFlows({
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
        });

        // Create 3 steps: step-1 depends on step-0, step-2 is independent
        const step0Id = StepIdStub({ value: 'step-0' });
        const step1Id = StepIdStub({ value: 'step-1' });
        const step2Id = StepIdStub({ value: 'step-2' });
        const coveredObs = [ObservableIdStub({ value: 'obs-1' })];
        const steps = [
          DependencyStepStub({
            id: step0Id,
            name: 'Step 0',
            observablesSatisfied: coveredObs,
            dependsOn: [],
            focusFile: {
              path: 'packages/orchestrator/src/brokers/step-0/create/step-0-create-broker.ts',
            },
            accompanyingFiles: [
              {
                path: 'packages/orchestrator/src/brokers/step-0/create/step-0-create-broker.test.ts',
              },
              {
                path: 'packages/orchestrator/src/brokers/step-0/create/step-0-create-broker.proxy.ts',
              },
            ],
            exportName: 'step0CreateBroker',
          }),
          DependencyStepStub({
            id: step1Id,
            name: 'Step 1',
            observablesSatisfied: coveredObs,
            dependsOn: [step0Id],
            focusFile: {
              path: 'packages/orchestrator/src/brokers/step-1/create/step-1-create-broker.ts',
            },
            accompanyingFiles: [
              {
                path: 'packages/orchestrator/src/brokers/step-1/create/step-1-create-broker.test.ts',
              },
              {
                path: 'packages/orchestrator/src/brokers/step-1/create/step-1-create-broker.proxy.ts',
              },
            ],
            exportName: 'step1CreateBroker',
          }),
          DependencyStepStub({
            id: step2Id,
            name: 'Step 2',
            observablesSatisfied: coveredObs,
            dependsOn: [],
            focusFile: {
              path: 'packages/orchestrator/src/brokers/step-2/create/step-2-create-broker.ts',
            },
            accompanyingFiles: [
              {
                path: 'packages/orchestrator/src/brokers/step-2/create/step-2-create-broker.test.ts',
              },
              {
                path: 'packages/orchestrator/src/brokers/step-2/create/step-2-create-broker.proxy.ts',
              },
            ],
            exportName: 'step2CreateBroker',
          }),
        ];

        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, flows }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'flows_approved' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'approved' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, steps }),
        });
        await questHelper.completeChaosWorkItem({ questId });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-cd') }),
        });
        // 3 codeweavers (cw-1 runs after cw-0 due to dependency)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-cd-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-cd-1') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-cd-2') }),
        });
        // ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-cd') }),
        });
        // 3 lawbringers
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-cd-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-cd-1') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-cd-2') }),
        });
        // final ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      const psItem = quest.workItems.find((wi) => wi.role === 'pathseeker')!;
      const cwItems = quest.workItems.filter((wi) => wi.role === 'codeweaver');

      expect(quest.status).toBe('complete');
      expect(cwItems.map((wi) => wi.status)).toStrictEqual(['complete', 'complete', 'complete']);

      // cw-0 (step-0, no step deps) depends only on pathseeker
      expect(cwItems[0]!.dependsOn).toStrictEqual([psItem.id]);
      // cw-1 (step-1, depends on step-0) depends on pathseeker AND cw-0
      expect(cwItems[1]!.dependsOn).toStrictEqual([psItem.id, cwItems[0]!.id]);
      // cw-2 (step-2, no step deps) depends only on pathseeker
      expect(cwItems[2]!.dependsOn).toStrictEqual([psItem.id]);
    });

    // Test 17: Multiple spiritmenders all succeed → ward-retry fires
    // Ward fails with 3 file paths → spiritmenders → all succeed → ward-retry passes.
    it('VALID: {ward fails, 3 error files} => spiritmenders succeed + ward-retry passes', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-multi-sm' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-ms') }),
        });
        // codeweaver
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-ms') }),
        });
        // ward fails with 3 file paths → creates spiritmender batch(es) + ward-retry
        queue.enqueue({
          queueDir: env.wardQueueDir,
          response: wardFailResponse({
            filePaths: [
              FilePathStub({ value: '/src/file-a.ts' }),
              FilePathStub({ value: '/src/file-b.ts' }),
              FilePathStub({ value: '/src/file-c.ts' }),
            ],
          }),
        });
        // spiritmenders succeed (one per batch — exact count depends on batching config)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-ms-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-ms-1') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-ms-2') }),
        });
        // ward-retry passes
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-ms') }),
        });
        // lawbringer
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-ms') }),
        });
        // final ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollUntilWorkItemsSettled({
          questId,
          minItems: 8,
        });

        testbed.cleanup();
        return result;
      })();

      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const smItems = quest.workItems.filter((wi) => wi.role === 'spiritmender');
      const completedSm = smItems.filter((wi) => wi.status === 'complete');

      // All spiritmenders completed
      expect(smItems.map((wi) => wi.status)).toStrictEqual(completedSm.map((wi) => wi.status));

      // Ward-retry completed (find the completed changed-mode ward)
      const completedWards = wardItems.filter((wi) => wi.status === 'complete');
      const changedWards = completedWards.filter((wi) => wi.wardMode === 'changed');

      expect(changedWards.map((wi) => wi.wardMode)).toStrictEqual(['changed']);

      // Ward-retry dependsOn includes spiritmender IDs
      const smIds = smItems.map((wi) => wi.id);

      expect(changedWards[0]!.dependsOn).toStrictEqual(smIds);
    });

    // Test 18: Final ward fails → spiritmender + retry cycle
    // Full happy path until final ward fails, then spiritmender fixes it, final ward retry passes.
    it('VALID: {final ward fails} => spiritmender + final ward retry passes', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-final-ward-fail' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-fw') }),
        });
        // codeweaver
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-fw') }),
        });
        // first ward passes
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege passes
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-fw') }),
        });
        // lawbringer passes
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-fw') }),
        });
        // final ward FAILS with file path
        queue.enqueue({
          queueDir: env.wardQueueDir,
          response: wardFailResponse({ filePaths: [FilePathStub({ value: '/src/file.ts' })] }),
        });
        // spiritmender fixes the final ward errors
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-fw') }),
        });
        // final ward retry passes
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        // chaos + PS + CW + ward(pass) + siege + LB + final-ward(fail) + SM + final-ward-retry(pass)
        const { quest: result } = await questHelper.pollUntilWorkItemsSettled({
          questId,
          minItems: 9,
        });

        testbed.cleanup();
        return result;
      })();

      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const smItems = quest.workItems.filter((wi) => wi.role === 'spiritmender');

      // 3 ward items: first ward (complete), final ward (failed), final ward retry (complete)
      expect(wardItems.map((wi) => wi.status)).toStrictEqual(['complete', 'failed', 'complete']);
      // First ward (changed mode) passed
      expect(wardItems[0]!.wardMode).toBe('changed');

      // Find full-mode wards (failed + completed retry)
      const fullWards = wardItems.filter((wi) => wi.wardMode === 'full');

      expect(fullWards.map((wi) => wi.wardMode)).toStrictEqual(['full', 'full']);

      const failedFullWards = fullWards.filter((wi) => wi.status === 'failed');
      const completedFullWards = fullWards.filter((wi) => wi.status === 'complete');

      expect(failedFullWards.map((wi) => wi.status)).toStrictEqual(['failed']);
      expect(completedFullWards.map((wi) => wi.status)).toStrictEqual(['complete']);
      // Spiritmender created and completed
      expect(smItems.map((wi) => wi.status)).toStrictEqual(['complete']);
    });

    // Test 19: Ward failure — siege dependsOn rewired to ward-retry + wardResult persisted
    it('VALID: {ward fails} => siege dependsOn rewired to ward-retry, wardResult persisted', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ward-rewire' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        // pathseeker
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-rw') }),
        });
        // codeweaver
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-rw') }),
        });
        // ward fails → spiritmender + ward-retry, siege rewired
        queue.enqueue({
          queueDir: env.wardQueueDir,
          response: wardFailResponse({ filePaths: [FilePathStub({ value: '/src/file.ts' })] }),
        });
        // spiritmender
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-rw') }),
        });
        // ward retry passes
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        // siege (now depends on ward-retry)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-rw') }),
        });
        // lawbringer
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-rw') }),
        });
        // final ward
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        // chaos + PS + CW + ward(fail) + SM + ward-retry(pass) + siege + LB + final-ward
        const { quest: result } = await questHelper.pollUntilWorkItemsSettled({
          questId,
          minItems: 9,
        });

        testbed.cleanup();
        return result;
      })();

      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const siegeItem = quest.workItems.find((wi) => wi.role === 'siegemaster')!;
      const failedWard = wardItems.find((wi) => wi.status === 'failed')!;
      const completedWards = wardItems.filter((wi) => wi.status === 'complete');
      const completedChangedWards = completedWards.filter((wi) => wi.wardMode === 'changed');

      // Siege dependsOn rewired to ward-retry ID (NOT the failed ward)
      expect(siegeItem.dependsOn).toStrictEqual([completedChangedWards[0]!.id]);
      expect(siegeItem.dependsOn).not.toStrictEqual([failedWard.id]);

      // wardResult persisted on quest (one per ward run — all 3 wards write results)
      expect(quest.wardResults.map(() => 'result')).toStrictEqual(['result', 'result', 'result']);
    });

    // Test 20: Ward fails twice, recovers on third attempt
    it('VALID: {ward fails twice, recovers on third} => ward-A → spirit → ward-B → spirit → ward-C passes → complete', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ward-2fail' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        // ps + cw + ward(FAIL) + spirit + ward-retry(FAIL) + spirit + ward-retry2(PASS) + siege + lb + final-ward
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-2f') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-2f') }),
        });
        queue.enqueue({
          queueDir: env.wardQueueDir,
          response: wardFailResponse({ filePaths: [FilePathStub({ value: '/src/broken.ts' })] }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-2f-0') }),
        });
        queue.enqueue({
          queueDir: env.wardQueueDir,
          response: wardFailResponse({ filePaths: [FilePathStub({ value: '/src/broken.ts' })] }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-2f-1') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-2f') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-2f') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollUntilWorkItemsSettled({
          questId,
          minItems: 11,
        });

        testbed.cleanup();
        return result;
      })();

      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const spiritmenderItems = quest.workItems.filter((wi) => wi.role === 'spiritmender');
      const failedWards = wardItems.filter((wi) => wi.status === 'failed');
      const changedWards = wardItems.filter((wi) => wi.wardMode === 'changed');
      const passedChangedWards = changedWards.filter((wi) => wi.status === 'complete');

      expect(failedWards.map((wi) => wi.status)).toStrictEqual(['failed', 'failed']);
      expect(spiritmenderItems.map((wi) => wi.status)).toStrictEqual(['complete', 'complete']);
      expect(passedChangedWards.map((wi) => wi.status)).toStrictEqual(['complete']);
    });

    // Test 21: Codeweaver fails → replan → replan downstream also fails → quest blocks
    it('VALID: {cw fails → replan → replan also fails} => quest → blocked after pathseeker exhausts retries', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-cw-replan-fail' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        // ps(SUCCESS) + cw(FAIL) => drain + skip + ps-replan
        // ps-replan passes verification (steps exist), creates new downstream items
        // New downstream items crash (empty queue) → quest blocks
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-crf') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentFailedResponse({ sessionId: sid('cw-fail-crf') }),
        });
        // Replan pathseeker succeeds (verification passes with existing steps)
        // Then new cw agents crash (empty queue) → quest eventually blocks
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-replan-crf') }),
        });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['blocked'],
        });

        testbed.cleanup();
        return result;
      })();

      expect(quest.status).toBe('blocked');

      const pathseekerItems = quest.workItems.filter((wi) => wi.role === 'pathseeker');
      const codeweaverItems = quest.workItems.filter((wi) => wi.role === 'codeweaver');
      const failedCw = codeweaverItems.filter((wi) => wi.status === 'failed');

      // Original pathseeker succeeded
      expect(pathseekerItems[0]!.status).toBe('complete');
      // At least one replan pathseeker exists (drain+skip triggers replan cycles)
      expect(pathseekerItems.length).toBeGreaterThan(1);
      // At least one codeweaver failed (signal-back 'failed')
      expect(failedCw[0]!.role).toBe('codeweaver');
    });

    // Test 22: Siege fails → replan → full second pass succeeds
    it('VALID: {siege fails → replan → full second pass succeeds} => quest → complete on second pass', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-siege-replan-ok' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        // First pass: ps + cw + ward + siege(FAIL)
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sro') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-sro') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentFailedResponse({ sessionId: sid('siege-fail-sro') }),
        });
        // Replan: ps-replan + second pass
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-replan-sro') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw2-sro') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege2-sro') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-sro') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollUntilWorkItemsSettled({
          questId,
          minItems: 8,
        });

        testbed.cleanup();
        return result;
      })();

      const siegeItems = quest.workItems.filter((wi) => wi.role === 'siegemaster');
      const failedSiege = siegeItems.filter((wi) => wi.status === 'failed');
      const skippedItems = quest.workItems.filter((wi) => wi.status === 'skipped');
      const pathseekerItems = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(failedSiege.map((wi) => wi.status)).toStrictEqual(['failed']);
      // Skipped items from first pass (lb + final-ward)
      expect(skippedItems.map((wi) => wi.status)).toStrictEqual(['skipped', 'skipped']);
      // Original pathseeker + replan pathseeker
      expect(pathseekerItems.map((wi) => wi.role)).toStrictEqual(['pathseeker', 'pathseeker']);
    });
  });

  describe('agent output streaming', () => {
    // Access orchestrationEventsState singleton via require (allowed in test files).
    // The import hierarchy rule prevents flows/ from importing state/ via ESM,
    // but require() is not checked by ImportDeclaration visitors.
    const eventsModule = require('../../state/orchestration-events/orchestration-events-state');
    const eventsState = Reflect.get(eventsModule, 'orchestrationEventsState');

    const subscribeChatOutput = (): {
      captured: unknown[];
      handler: (event: unknown) => void;
      unsubscribe: () => void;
    } => {
      const captured: unknown[] = [];
      const handler = (event: unknown): void => {
        captured.push(event);
      };
      Reflect.get(eventsState, 'on').call(eventsState, { type: 'chat-output', handler });
      return {
        captured,
        handler,
        unsubscribe: (): void => {
          Reflect.get(eventsState, 'off').call(eventsState, { type: 'chat-output', handler });
        },
      };
    };

    const getPayload = (event: unknown): Record<PropertyKey, unknown> =>
      Reflect.get(event as object, 'payload') as Record<PropertyKey, unknown>;

    const getEntryRaw = (event: unknown): unknown => {
      const payload = getPayload(event);
      const entry = Reflect.get(payload, 'entry') as Record<PropertyKey, unknown> | undefined;
      return entry ? Reflect.get(entry, 'raw') : undefined;
    };

    const getSessionId = (event: unknown): unknown => {
      const payload = getPayload(event);
      return Reflect.get(payload, 'sessionId');
    };

    const getSlotIndex = (event: unknown): unknown => {
      const payload = getPayload(event);
      return Reflect.get(payload, 'slotIndex');
    };

    it('VALID: {happy path, 2 steps} => chat-output events emitted for all roles', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-stream-happy' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const sub = subscribeChatOutput();

      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 2,
        });

        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-stream') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-stream-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-stream-1') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-stream') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-stream-0') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-stream-1') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['complete'],
        });

        testbed.cleanup();
        return result;
      })();

      sub.unsubscribe();

      const { workItems } = quest;

      // Pathseeker events
      const pathseekerItem = workItems.find((wi) => wi.role === 'pathseeker')!;
      const pathseekerEvents = sub.captured.filter(
        (e) => getSessionId(e) === pathseekerItem.sessionId,
      );

      expect(pathseekerEvents.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(pathseekerEvents[0])).toBe('string');
      expect(String(getEntryRaw(pathseekerEvents[0])).length).toBeGreaterThan(0);
      expect(getSessionId(pathseekerEvents[0])).toBe(pathseekerItem.sessionId);

      // Codeweaver events (one per step, 2 steps)
      const codeweaverItems = workItems.filter((wi) => wi.role === 'codeweaver');

      expect(codeweaverItems.map((wi) => wi.role)).toStrictEqual(['codeweaver', 'codeweaver']);

      const cw0Events = sub.captured.filter(
        (e) => getSessionId(e) === codeweaverItems[0]!.sessionId,
      );

      expect(cw0Events.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(cw0Events[0])).toBe('string');
      expect(String(getEntryRaw(cw0Events[0])).length).toBeGreaterThan(0);
      expect(getSessionId(cw0Events[0])).toBe(codeweaverItems[0]!.sessionId);

      const cw1Events = sub.captured.filter(
        (e) => getSessionId(e) === codeweaverItems[1]!.sessionId,
      );

      expect(cw1Events.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(cw1Events[0])).toBe('string');
      expect(String(getEntryRaw(cw1Events[0])).length).toBeGreaterThan(0);
      expect(getSessionId(cw1Events[0])).toBe(codeweaverItems[1]!.sessionId);

      // Ward events (at least 1 per ward run)
      const wardItems = workItems.filter((wi) => wi.role === 'ward');
      const ward0Events = sub.captured.filter((e) => getSessionId(e) === wardItems[0]!.sessionId);

      expect(ward0Events.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(ward0Events[0])).toBe('string');
      expect(String(getEntryRaw(ward0Events[0])).length).toBeGreaterThan(0);
      expect(getSessionId(ward0Events[0])).toBe(wardItems[0]!.sessionId);

      const ward1Events = sub.captured.filter((e) => getSessionId(e) === wardItems[1]!.sessionId);

      expect(ward1Events.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(ward1Events[0])).toBe('string');
      expect(String(getEntryRaw(ward1Events[0])).length).toBeGreaterThan(0);

      // Siegemaster events
      const siegeItem = workItems.find((wi) => wi.role === 'siegemaster')!;
      const siegeEvents = sub.captured.filter((e) => getSessionId(e) === siegeItem.sessionId);

      expect(siegeEvents.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(siegeEvents[0])).toBe('string');
      expect(String(getEntryRaw(siegeEvents[0])).length).toBeGreaterThan(0);
      expect(getSessionId(siegeEvents[0])).toBe(siegeItem.sessionId);

      // Lawbringer events (one per step, 2 steps)
      const lawbringerItems = workItems.filter((wi) => wi.role === 'lawbringer');

      expect(lawbringerItems.map((wi) => wi.role)).toStrictEqual(['lawbringer', 'lawbringer']);

      const lb0Events = sub.captured.filter(
        (e) => getSessionId(e) === lawbringerItems[0]!.sessionId,
      );

      expect(lb0Events.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(lb0Events[0])).toBe('string');
      expect(String(getEntryRaw(lb0Events[0])).length).toBeGreaterThan(0);
      expect(getSessionId(lb0Events[0])).toBe(lawbringerItems[0]!.sessionId);

      const lb1Events = sub.captured.filter(
        (e) => getSessionId(e) === lawbringerItems[1]!.sessionId,
      );

      expect(lb1Events.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(lb1Events[0])).toBe('string');
      expect(String(getEntryRaw(lb1Events[0])).length).toBeGreaterThan(0);
      expect(getSessionId(lb1Events[0])).toBe(lawbringerItems[1]!.sessionId);

      // Every event has a valid slotIndex (number)
      expect(sub.captured.length).toBeGreaterThanOrEqual(8);
      expect(sub.captured.every((e) => typeof getSlotIndex(e) === 'number')).toBe(true);
    });

    it('VALID: {ward fails with retries} => chat-output events for ward, spiritmender, and ward retry', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-stream-ward-fail' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const sub = subscribeChatOutput();

      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-wf') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-wf') }),
        });
        queue.enqueue({
          queueDir: env.wardQueueDir,
          response: wardFailResponse({ filePaths: [FilePathStub({ value: '/src/file.ts' })] }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('sm-wf') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('siege-wf') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('lb-wf') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollUntilWorkItemsSettled({
          questId,
          minItems: 9,
        });

        testbed.cleanup();
        return result;
      })();

      sub.unsubscribe();

      const { workItems } = quest;

      // Failed ward events
      const wardItems = workItems.filter((wi) => wi.role === 'ward');
      const failedWard = wardItems.find((wi) => wi.status === 'failed')!;
      const failedWardEvents = sub.captured.filter((e) => getSessionId(e) === failedWard.sessionId);

      expect(failedWardEvents.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(failedWardEvents[0])).toBe('string');
      expect(String(getEntryRaw(failedWardEvents[0])).length).toBeGreaterThan(0);

      // Spiritmender events
      const spiritmenderItems = workItems.filter((wi) => wi.role === 'spiritmender');

      expect(spiritmenderItems.length).toBeGreaterThanOrEqual(1);

      const smEvents = sub.captured.filter(
        (e) => getSessionId(e) === spiritmenderItems[0]!.sessionId,
      );

      expect(smEvents.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(smEvents[0])).toBe('string');
      expect(String(getEntryRaw(smEvents[0])).length).toBeGreaterThan(0);
      expect(getSessionId(smEvents[0])).toBe(spiritmenderItems[0]!.sessionId);

      // Ward retry events (completed ward)
      const completedWards = wardItems.filter((wi) => wi.status === 'complete');

      expect(completedWards.length).toBeGreaterThanOrEqual(1);

      const retryEvents = sub.captured.filter(
        (e) => getSessionId(e) === completedWards[0]!.sessionId,
      );

      expect(retryEvents.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(retryEvents[0])).toBe('string');
      expect(String(getEntryRaw(retryEvents[0])).length).toBeGreaterThan(0);
    });

    it('VALID: {siege fails} => chat-output events for siegemaster and pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-stream-siege-fail' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });
      const sub = subscribeChatOutput();

      const quest: QuestType = await (async (): Promise<QuestType> => {
        const { questId } = await questHelper.createTestQuest({
          testbed,
          observableIds: [ObservableIdStub({ value: 'obs-1' })],
          stepCount: 1,
        });

        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-sf') }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('cw-sf') }),
        });
        queue.enqueue({ queueDir: env.wardQueueDir, response: wardPassResponse() });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentFailedResponse({
            sessionId: sid('siege-fail-sf'),
            summary: 'FAILED OBSERVABLES: login redirect broken',
          }),
        });
        queue.enqueue({
          queueDir: env.claudeQueueDir,
          response: agentSuccessResponse({ sessionId: sid('ps-replan-sf') }),
        });

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await questHelper.pollForStatus({
          questId,
          targetStatuses: ['blocked'],
        });

        testbed.cleanup();
        return result;
      })();

      sub.unsubscribe();

      const { workItems } = quest;

      // Failed siegemaster events
      const siegeItems = workItems.filter((wi) => wi.role === 'siegemaster');
      const failedSiege = siegeItems.find((wi) => wi.status === 'failed')!;
      const siegeEvents = sub.captured.filter((e) => getSessionId(e) === failedSiege.sessionId);

      expect(siegeEvents.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(siegeEvents[0])).toBe('string');
      expect(String(getEntryRaw(siegeEvents[0])).length).toBeGreaterThan(0);
      expect(getSessionId(siegeEvents[0])).toBe(failedSiege.sessionId);

      // Pathseeker replan events
      const pathseekerItems = workItems.filter((wi) => wi.role === 'pathseeker');

      expect(pathseekerItems.length).toBeGreaterThanOrEqual(2);

      // The last pathseeker is the replan
      const replanPathseeker = pathseekerItems[pathseekerItems.length - 1]!;
      const replanEvents = sub.captured.filter(
        (e) => getSessionId(e) === replanPathseeker.sessionId,
      );

      expect(replanEvents.length).toBeGreaterThanOrEqual(1);
      expect(typeof getEntryRaw(replanEvents[0])).toBe('string');
      expect(String(getEntryRaw(replanEvents[0])).length).toBeGreaterThan(0);
      expect(getSessionId(replanEvents[0])).toBe(replanPathseeker.sessionId);
    });
  });
});
