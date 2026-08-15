import { QuestRunRiftcarverResultStub } from '@dungeonmaster/orchestrator/testing';
import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorRunRiftcarverAdapter } from './orchestrator-run-riftcarver-adapter';
import { orchestratorRunRiftcarverAdapterProxy } from './orchestrator-run-riftcarver-adapter.proxy';

describe('orchestratorRunRiftcarverAdapter', () => {
  describe('successful run', () => {
    it('VALID: {questId, workItemId} => returns QuestRunRiftcarverResult', async () => {
      const proxy = orchestratorRunRiftcarverAdapterProxy();
      const expected = QuestRunRiftcarverResultStub();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' });

      proxy.returns({ questId, workItemId, result: expected });

      const result = await orchestratorRunRiftcarverAdapter({ questId, workItemId });

      expect(result).toStrictEqual(expected);
    });

    it('VALID: {blocked carve} => returns the blocked outcome with its failedStep', async () => {
      const proxy = orchestratorRunRiftcarverAdapterProxy();
      const expected = QuestRunRiftcarverResultStub({
        exitCode: 1,
        outcome: 'blocked',
        failedStep: 'create',
      });
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' });

      proxy.returns({ questId, workItemId, result: expected });

      const result = await orchestratorRunRiftcarverAdapter({ questId, workItemId });

      expect(result).toStrictEqual(expected);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorRunRiftcarverAdapterProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' });

      proxy.throws({ questId, workItemId, error: new Error('Riftcarver spawn failed') });

      await expect(orchestratorRunRiftcarverAdapter({ questId, workItemId })).rejects.toThrow(
        /Riftcarver spawn failed/u,
      );
    });
  });
});
