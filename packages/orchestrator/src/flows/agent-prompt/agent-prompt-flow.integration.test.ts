/**
 * PURPOSE: Integration test verifying AgentPromptFlow resolves agent names to prompt data
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/src/flows/agent-prompt/agent-prompt-flow.integration.test.ts
 */

import { BaseNameStub, installTestbedCreateBroker } from '@dungeonmaster/testing';
import {
  OperationItemIdStub,
  OperationItemStub,
  QuestStub,
  QuestWorkItemIdStub,
  RelatedDataItemStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { questSeedHarness } from '../../../test/harnesses/quest-seed/quest-seed.harness';

import { AgentPromptFlow } from './agent-prompt-flow';

describe('AgentPromptFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const seeder = questSeedHarness();

  describe('valid agent names', () => {
    it('VALID: {agent: chaoswhisperer-gap-minion, questId, workItemId} => returns substituted prompt with Quest ID + Work Item ID', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'agent-prompt-flow-chaos' }),
      });
      const env = envHarness.setupHome({ tempDir: testbed.guildPath });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver' });
      const quest = QuestStub({ workItems: [workItem] });
      seeder.seed({ tempDir: testbed.guildPath, quest });

      const result = await AgentPromptFlow.get({
        agent: 'chaoswhisperer-gap-minion',
        questId: quest.id,
        workItemId,
      });

      env.restore();
      testbed.cleanup();

      const expectedArgs = `Quest ID: ${String(quest.id)}\nWork Item ID: ${String(workItemId)}`;

      expect(result).toStrictEqual({
        name: 'chaoswhisperer-gap-minion',
        model: 'sonnet',
        prompt: chaoswhispererGapMinionStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
      });
    });

    it('VALID: {agent: codeweaver, questId, workItemId, operation linked} => returns substituted prompt with the operation-relay context resolved from the persisted quest.json', async () => {
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
        relatedDataItems: [RelatedDataItemStub({ value: `operations/${String(operationId)}` })],
      });
      const quest = QuestStub({ operations: [operation], workItems: [workItem] });
      seeder.seed({ tempDir: testbed.guildPath, quest });

      const result = await AgentPromptFlow.get({
        agent: 'codeweaver',
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
        '',
        'Operations ledger (in order):',
        '1. [ ] [codeweaver] core: config load+validate adapter  <-- YOUR OPERATION ITEM',
      ].join('\n');

      expect(result).toStrictEqual({
        name: 'codeweaver',
        model: 'opus',
        prompt: codeweaverPromptStatics.prompt.template.replace('$ARGUMENTS', expectedArgs),
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
      seeder.seed({ tempDir: testbed.guildPath, quest });

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

    it('ERROR: {agent: codeweaver, questId, workItemId, no operations reference} => rejects with no-resolvable-operations-ref error', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'agent-prompt-flow-no-op-ref' }),
      });
      const env = envHarness.setupHome({ tempDir: testbed.guildPath });
      const workItemId = QuestWorkItemIdStub({ value: 'dddddddd-3333-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver', relatedDataItems: [] });
      const quest = QuestStub({ workItems: [workItem] });
      seeder.seed({ tempDir: testbed.guildPath, quest });

      const promise = AgentPromptFlow.get({
        agent: 'codeweaver',
        questId: quest.id,
        workItemId,
      });
      const awaited = await promise.catch((error: unknown) => error);

      env.restore();
      testbed.cleanup();

      expect(awaited).toBeInstanceOf(Error);
    });
  });
});
