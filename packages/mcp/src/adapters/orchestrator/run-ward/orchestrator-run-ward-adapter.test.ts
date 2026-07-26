import { QuestRunWardResultStub } from '@dungeonmaster/orchestrator/testing';
import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorRunWardAdapter } from './orchestrator-run-ward-adapter';
import { orchestratorRunWardAdapterProxy } from './orchestrator-run-ward-adapter.proxy';

describe('orchestratorRunWardAdapter', () => {
  describe('successful run', () => {
    it('VALID: {questId, workItemId, mode} => returns QuestRunWardResult', async () => {
      const proxy = orchestratorRunWardAdapterProxy();
      const expected = QuestRunWardResultStub();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' });

      proxy.returns({ questId, workItemId, result: expected });

      const result = await orchestratorRunWardAdapter({
        questId,
        workItemId,
        mode: 'changed',
      });

      expect(result).toStrictEqual(expected);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorRunWardAdapterProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' });

      proxy.throws({ questId, workItemId, error: new Error('Ward spawn failed') });

      await expect(
        orchestratorRunWardAdapter({
          questId,
          workItemId,
          mode: 'full',
        }),
      ).rejects.toThrow(/Ward spawn failed/u);
    });
  });
});
