import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetBlightChecklistAdapter } from './orchestrator-get-blight-checklist-adapter';
import { orchestratorGetBlightChecklistAdapterProxy } from './orchestrator-get-blight-checklist-adapter.proxy';

describe('orchestratorGetBlightChecklistAdapter', () => {
  describe('whole quest diff', () => {
    it('VALID: {questId} => returns the wrapped checklist text', async () => {
      const proxy = orchestratorGetBlightChecklistAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# BLIGHT CHECKLIST' }) },
      });

      const result = await orchestratorGetBlightChecklistAdapter({ questId: 'add-auth' });

      expect(result).toStrictEqual({ success: true, data: '# BLIGHT CHECKLIST' });
    });

    it('VALID: {questId} => forwards questId to the orchestrator', async () => {
      const proxy = orchestratorGetBlightChecklistAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# BLIGHT CHECKLIST' }) },
      });

      await orchestratorGetBlightChecklistAdapter({ questId: 'add-auth' });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => rejects with error', async () => {
      const proxy = orchestratorGetBlightChecklistAdapterProxy();
      proxy.throws({ questId: 'non-existent', error: new Error('Quest not found') });

      await expect(
        orchestratorGetBlightChecklistAdapter({ questId: 'non-existent' }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
