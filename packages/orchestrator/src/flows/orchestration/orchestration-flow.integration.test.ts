import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildNameStub,
  GuildPathStub,
  ProcessIdStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { GuildRemoveResponder } from '../../responders/guild/remove/guild-remove-responder';
import { QuestAddResponder } from '../../responders/quest/add/quest-add-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { QuestModifyResponder } from '../../responders/quest/modify/quest-modify-responder';
import { ModifyQuestInputStub } from '../../contracts/modify-quest-input/modify-quest-input.stub';
import { OrchestrationFlow } from './orchestration-flow';

describe('OrchestrationFlow', () => {
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

      await GuildRemoveResponder({ guildId: guild.id });
      testbed.cleanup();

      expect(addResult.questId).toBeDefined();
    });

    it('VALID: {approved quest} => start returns processId and getStatus returns idle orchestration status', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestration-approved' }),
      });

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

      const questResult = await QuestGetResponder({ questId });

      expect(questResult.success).toBe(true);
      expect(questResult.quest!.status).toBe('in_progress');

      const status = OrchestrationFlow.getStatus({ processId });

      await GuildRemoveResponder({ guildId: guild.id });
      testbed.cleanup();

      expect(processId).toMatch(/^proc-/u);
      expect(status.processId).toBe(processId);
      expect(status.questId).toBe(questId);
      expect(status.phase).toBe('idle');
      expect(status.completed).toBe(0);
      expect(status.slots).toStrictEqual([]);
    });
  });
});
