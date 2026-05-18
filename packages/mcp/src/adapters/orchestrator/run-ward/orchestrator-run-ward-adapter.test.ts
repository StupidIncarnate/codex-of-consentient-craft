import { QuestRunWardResultStub } from '@dungeonmaster/orchestrator/testing';
import { QuestIdStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorRunWardAdapter } from './orchestrator-run-ward-adapter';
import { orchestratorRunWardAdapterProxy } from './orchestrator-run-ward-adapter.proxy';

describe('orchestratorRunWardAdapter', () => {
  describe('successful run', () => {
    it('VALID: {questId, workItemId, mode} => returns QuestRunWardResult', async () => {
      const proxy = orchestratorRunWardAdapterProxy();
      const expected = QuestRunWardResultStub();

      proxy.returns({ result: expected });

      const result = await orchestratorRunWardAdapter({
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        mode: 'changed',
      });

      expect(result).toStrictEqual(expected);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorRunWardAdapterProxy();

      proxy.throws({ error: new Error('Ward spawn failed') });

      await expect(
        orchestratorRunWardAdapter({
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
          mode: 'full',
        }),
      ).rejects.toThrow(/Ward spawn failed/u);
    });
  });
});
