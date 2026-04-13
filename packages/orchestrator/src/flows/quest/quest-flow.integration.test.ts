import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildNameStub,
  GuildPathStub,
  ObservableIdStub,
} from '@dungeonmaster/shared/contracts';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { QuestAddResponder } from '../../responders/quest/add/quest-add-responder';
import { QuestModifyResponder } from '../../responders/quest/modify/quest-modify-responder';
import { ModifyQuestInputStub } from '../../contracts/modify-quest-input/modify-quest-input.stub';

import { QuestFlow } from './quest-flow';

describe('QuestFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();

  describe('delegation to responders', () => {
    it('VALID: {questId: nonexistent} => get delegates to QuestGetResponder and returns error', async () => {
      const result = await QuestFlow.get({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });

    it('VALID: {questId: nonexistent} => verify delegates to QuestVerifyResponder and returns error', async () => {
      const result = await QuestFlow.verify({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });

    it('VALID: {questId: nonexistent} => validateSpec delegates to QuestValidateSpecResponder and returns error', async () => {
      const result = await QuestFlow.validateSpec({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });

    it('VALID: {real quest with valid spec} => validateSpec returns success true with all checks passed', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-flow-validate-spec' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Validate Spec Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Validate Spec Quest',
        userRequest: 'A quest with valid flows for spec validation',
        guildId: guild.id,
      });

      const questId = addResult.questId!;

      const obs = FlowObservableStub({
        id: ObservableIdStub({ value: 'obs-validate' }),
      });
      const nodeA = FlowNodeStub({
        id: 'node-a' as ReturnType<typeof FlowNodeStub>['id'],
        label: 'Node A',
        type: 'state',
        observables: [],
      });
      const nodeB = FlowNodeStub({
        id: 'node-b' as ReturnType<typeof FlowNodeStub>['id'],
        label: 'Node B',
        type: 'terminal',
        observables: [obs],
      });
      const edge = FlowEdgeStub({ from: nodeA.id, to: nodeB.id });
      const flows = [FlowStub({ nodes: [nodeA, nodeB], edges: [edge] })];

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_flows' }),
      });
      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, flows }),
      });

      const result = await QuestFlow.validateSpec({ questId });

      testbed.cleanup();
      restore();

      const { success, checks } = result;

      expect(success).toBe(true);
      expect(checks.length).toBeGreaterThan(0);
      expect(checks.every((check) => check.passed)).toBe(true);
    });
  });
});
