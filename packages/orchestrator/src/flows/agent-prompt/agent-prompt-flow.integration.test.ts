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
import { disciplineImplementationStatics } from '../../statics/discipline-implementation/discipline-implementation-statics';
import { operatorPromptStatics } from '../../statics/operator-prompt/operator-prompt-statics';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { questSeedHarness } from '../../../test/harnesses/quest-seed/quest-seed.harness';

import { AgentPromptFlow } from './agent-prompt-flow';
import { roleToModelStatics } from '../../statics/role-to-model/role-to-model-statics';

// Codeweaver is served the shared operator template with the implementation pack
// already substituted at `$DISCIPLINE` and that discipline's id at `$MY_DISCIPLINE`. Function-form
// replacement, never the string form: pack markdown is authored prose that can carry
// `$&` / `` $` `` / `$'`.
// `$DISCIPLINE` substitutes once and `$MY_DISCIPLINE` substitutes EVERYWHERE — the template quotes
// the bare discipline id both into the `get-agent-prompt` call its minions must make and into the
// header every minion brief opens with, and `.replace` would resolve only the first of those.
const IMPLEMENTATION_OPERATOR_TEMPLATE = operatorPromptStatics.prompt.template
  .replace('$DISCIPLINE', () => disciplineImplementationStatics.operatorMarkdown)
  .split('$MY_DISCIPLINE')
  .join('implementation');

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
        '',
        'Original user request (the intent behind the flows):',
        'Add authentication to the application',
      ].join('\n');

      expect(result).toStrictEqual({
        name: 'codeweaver',
        // Read from the role map rather than restated: that map is what the CLI `--model` flag
        // resolves through at spawn time, so a literal here could report one model while the
        // dispatched child ran another.
        model: roleToModelStatics.codeweaver,
        prompt: IMPLEMENTATION_OPERATOR_TEMPLATE.replace('$ARGUMENTS', expectedArgs),
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
