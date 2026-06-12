/**
 * PURPOSE: Integration test verifying AgentPromptFlow resolves agent names to prompt data
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/src/flows/agent-prompt/agent-prompt-flow.integration.test.ts
 */

import { BaseNameStub, installTestbedCreateBroker } from '@dungeonmaster/testing';
import { QuestStub, QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { chaoswhispererGapMinionStatics } from '../../statics/chaoswhisperer-gap-minion/chaoswhisperer-gap-minion-statics';
import { pathseekerAssertionCorrectnessMinionStatics } from '../../statics/pathseeker-assertion-correctness-minion/pathseeker-assertion-correctness-minion-statics';
import { pathseekerDedupMinionStatics } from '../../statics/pathseeker-dedup-minion/pathseeker-dedup-minion-statics';
import { pathseekerSurfaceMinionStatics } from '../../statics/pathseeker-surface-minion/pathseeker-surface-minion-statics';

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

    it('VALID: {agent: pathseeker-surface, questId, workItemId, no sliceName} => returns substituted prompt with Quest ID only', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'agent-prompt-flow-surface' }),
      });
      const env = envHarness.setupHome({ tempDir: testbed.guildPath });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'pathseeker-surface' });
      const quest = QuestStub({ workItems: [workItem] });
      seeder.seed({ tempDir: testbed.guildPath, quest });

      const result = await AgentPromptFlow.get({
        agent: 'pathseeker-surface',
        questId: quest.id,
        workItemId,
      });

      env.restore();
      testbed.cleanup();

      expect(result).toStrictEqual({
        name: 'pathseeker-surface',
        model: 'sonnet',
        prompt: pathseekerSurfaceMinionStatics.prompt.template.replace(
          '$ARGUMENTS',
          `Quest ID: ${String(quest.id)}`,
        ),
      });
    });

    it('VALID: {agent: pathseeker-dedup, questId, workItemId} => returns substituted prompt with Quest ID', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'agent-prompt-flow-dedup' }),
      });
      const env = envHarness.setupHome({ tempDir: testbed.guildPath });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({ id: workItemId, role: 'pathseeker-dedup' });
      const quest = QuestStub({ workItems: [workItem] });
      seeder.seed({ tempDir: testbed.guildPath, quest });

      const result = await AgentPromptFlow.get({
        agent: 'pathseeker-dedup',
        questId: quest.id,
        workItemId,
      });

      env.restore();
      testbed.cleanup();

      expect(result).toStrictEqual({
        name: 'pathseeker-dedup',
        model: 'sonnet',
        prompt: pathseekerDedupMinionStatics.prompt.template.replace(
          '$ARGUMENTS',
          `Quest ID: ${String(quest.id)}`,
        ),
      });
    });

    it('VALID: {agent: pathseeker-assertion-correctness, questId, workItemId} => returns substituted prompt with Quest ID', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'agent-prompt-flow-assertion' }),
      });
      const env = envHarness.setupHome({ tempDir: testbed.guildPath });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker-assertion-correctness',
      });
      const quest = QuestStub({ workItems: [workItem] });
      seeder.seed({ tempDir: testbed.guildPath, quest });

      const result = await AgentPromptFlow.get({
        agent: 'pathseeker-assertion-correctness',
        questId: quest.id,
        workItemId,
      });

      env.restore();
      testbed.cleanup();

      expect(result).toStrictEqual({
        name: 'pathseeker-assertion-correctness',
        model: 'sonnet',
        prompt: pathseekerAssertionCorrectnessMinionStatics.prompt.template.replace(
          '$ARGUMENTS',
          `Quest ID: ${String(quest.id)}`,
        ),
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
  });
});
