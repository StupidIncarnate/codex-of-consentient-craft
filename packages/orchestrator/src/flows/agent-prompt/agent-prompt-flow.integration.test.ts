/**
 * PURPOSE: Integration test verifying AgentPromptFlow resolves agent names to prompt data
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/src/flows/agent-prompt/agent-prompt-flow.integration.test.ts
 *
 * This is a WIRING test, not a second copy of the broker's branch matrix. Two shapes reach the
 * flow — a minion fetching with `{ agent, questId }` and touching no disk at all, and a role
 * fetching with a `workItemId` whose operation context is read back off a REAL quest.json this
 * test seeded. The broker's own suite owns the refusals, the start-ref stamp and the dev-server
 * scoping.
 */

import { BaseNameStub, installTestbedCreateBroker } from '@dungeonmaster/testing';
import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { agentFlowStatics } from '../../statics/agent-flow/agent-flow-statics';
import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPlannerStatics } from '../../statics/codeweaver-planner/codeweaver-planner-statics';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { questSeedHarness } from '../../../test/harnesses/quest-seed/quest-seed.harness';

import { AgentPromptFlow } from './agent-prompt-flow';

describe('AgentPromptFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const seeder = questSeedHarness();

  describe('valid agent names', () => {
    // No testbed and no seeded quest: a minion fetch reads nothing off disk, and this test serving
    // a prompt without a quest existing anywhere is what says so end to end.
    it('VALID: {agent: chaoswhisperer-gap-minion, questId, no workItemId} => returns the gap-minion template with Quest ID substituted', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });

      const result = await AgentPromptFlow.get({
        agent: 'chaoswhisperer-gap-minion',
        questId,
      });

      expect(result).toStrictEqual({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template.replace(
          '$ARGUMENTS',
          () => `Quest ID: ${String(questId)}`,
        ),
      });
    });

    // Was titled "agent: codeweaver" while calling `codeweaver-planner` against a work item whose
    // ROLE it set to `spiritmender` and whose `step` it left unset — that mismatched, step-less
    // fixture actually hit the minion branch (a two-line Quest-ID/Work-Item-ID substitution, never
    // the four-id operation-relay context this test's own name promised). Fixed by matching the
    // work item's role to the agent's family and giving it the `step: 'plan'` a real
    // codeweaver-planner dispatch always carries.
    it("VALID: {agent: codeweaver-planner, questId, workItemId, work item AT THE PLAN STEP} => returns the four-id operation-relay context and the step's own model, resolved from the persisted quest.json", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'agent-prompt-flow-codeweaver' }),
      });
      const env = envHarness.setupHome({ tempDir: testbed.guildPath });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4222-9333-444444444444' });
      const operationId = OperationItemIdStub({ value: 'cccccccc-2222-4222-9333-444444444444' });
      const operation = OperationItemStub({
        id: operationId,
        role: 'codeweaver',
        text: 'core: config load+validate adapter',
        status: 'pending',
      });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'codeweaver',
        step: 'plan',
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({ operations: [operation], workItems: [workItem] });
      await seeder.seed({ tempDir: testbed.guildPath, quest });

      const result = await AgentPromptFlow.get({
        agent: 'codeweaver-planner',
        questId: quest.id,
        workItemId,
      });

      env.restore();
      testbed.cleanup();

      const expectedArgs = [
        `Quest ID: ${String(quest.id)}`,
        `Work Item ID: ${String(workItemId)}`,
        `Operation Item ID: ${String(operationId)}`,
        'Your operation item: [codeweaver] core: config load+validate adapter',
      ].join('\n');

      expect(result).toStrictEqual({
        name: 'codeweaver-planner',
        // The step's own declared model (agentFlowStatics.codeweaver.steps.plan.model) — what
        // `get-agent-prompt` actually reports for a STEPPED dispatch, and what
        // `buildSpawnInstructionLayerBroker` reads for the real one. NOT roleToModelStatics.codeweaver:
        // that map is only the fallback for a work item running no step graph at all, and reporting it
        // for a stepped item is exactly how `codeweaver-worker` used to be reported as `opus` while its
        // step declared (and the session ran on) `sonnet`.
        model: agentFlowStatics.codeweaver.steps.plan.model,
        prompt: codeweaverPlannerStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {agent: invalid name} => throws ZodError for unrecognized agent', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'agent-prompt-flow-invalid' }),
      });
      const env = envHarness.setupHome({ tempDir: testbed.guildPath });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId });
      const quest = QuestStub({ workItems: [workItem] });
      await seeder.seed({ tempDir: testbed.guildPath, quest });

      const promise = AgentPromptFlow.get({
        agent: 'non-existent-agent',
        questId: quest.id,
        workItemId,
      });
      const awaited = await promise.catch((error: unknown) => error);

      env.restore();
      testbed.cleanup();

      expect(awaited).toBeInstanceOf(Error);
    });

    it('ERROR: {agent: spiritmender, questId, workItemId, no operations reference} => rejects naming the work item that carries no operations/<id> ref', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'agent-prompt-flow-no-op-ref' }),
      });
      const env = envHarness.setupHome({ tempDir: testbed.guildPath });
      const workItemId = QuestWorkItemIdStub({ value: 'dddddddd-3333-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'spiritmender', relatedDataItems: [] });
      const quest = QuestStub({ workItems: [workItem] });
      await seeder.seed({ tempDir: testbed.guildPath, quest });

      const promise = AgentPromptFlow.get({
        agent: 'spiritmender',
        questId: quest.id,
        workItemId,
      });
      const awaited = await promise.catch((error: unknown) => error);

      env.restore();
      testbed.cleanup();

      expect(String(awaited)).toBe(
        `Error: workItemToPromptTransformer: spiritmender work item ${String(workItemId)} has no resolvable operations/<id> reference`,
      );
    });
  });
});
