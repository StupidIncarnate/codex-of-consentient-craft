import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQaChecklistAdapter } from './orchestrator-get-qa-checklist-adapter';
import { orchestratorGetQaChecklistAdapterProxy } from './orchestrator-get-qa-checklist-adapter.proxy';

describe('orchestratorGetQaChecklistAdapter', () => {
  describe('whole quest', () => {
    it('VALID: {questId} => returns the wrapped checklist text', async () => {
      const proxy = orchestratorGetQaChecklistAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      const result = await orchestratorGetQaChecklistAdapter({ questId: 'add-auth' });

      expect(result).toStrictEqual({ success: true, data: '# QA CHECKLIST' });
    });

    it('VALID: {questId, no flowId} => omits flowId in the call', async () => {
      const proxy = orchestratorGetQaChecklistAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      await orchestratorGetQaChecklistAdapter({ questId: 'add-auth' });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
      });
    });
  });

  describe('flow-scoped', () => {
    it('VALID: {questId, flowId} => forwards flowId to the orchestrator', async () => {
      const proxy = orchestratorGetQaChecklistAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      await orchestratorGetQaChecklistAdapter({ questId: 'add-auth', flowId: 'login-flow' });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        flowId: 'login-flow',
      });
    });
  });

  describe('track-scoped', () => {
    it.each(['flowrider', 'siegemaster'] as const)(
      'VALID: {questId, track: %s} => forwards track to the orchestrator',
      async (track) => {
        const proxy = orchestratorGetQaChecklistAdapterProxy();
        proxy.returns({
          questId: 'add-auth',
          result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
        });

        await orchestratorGetQaChecklistAdapter({ questId: 'add-auth', track });

        expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
          questId: 'add-auth',
          track,
        });
      },
    );

    it('VALID: {questId, no track} => omits track from the call', async () => {
      const proxy = orchestratorGetQaChecklistAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      await orchestratorGetQaChecklistAdapter({ questId: 'add-auth', flowId: 'login-flow' });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        flowId: 'login-flow',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => rejects with error', async () => {
      const proxy = orchestratorGetQaChecklistAdapterProxy();
      proxy.throws({ questId: 'non-existent', error: new Error('Quest not found') });

      await expect(orchestratorGetQaChecklistAdapter({ questId: 'non-existent' })).rejects.toThrow(
        /Quest not found/u,
      );
    });
  });
});
