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

  describe('item-scoped', () => {
    // `operationItemId` is the whole scope now — the track, the flows and the package slice are all
    // derived from the item server-side. The three arguments this used to forward were each a way
    // to ask a different question from the one the completion gate answers.
    it('VALID: {questId, operationItemId} => forwards the item id to the orchestrator', async () => {
      const proxy = orchestratorGetQaChecklistAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      await orchestratorGetQaChecklistAdapter({ questId: 'add-auth', operationItemId: 'op-1' });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        operationItemId: 'op-1',
      });
    });

    it('VALID: {questId, no operationItemId} => omits it from the call', async () => {
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

  describe('adapter failures', () => {
    it('ERROR: {orchestrator throws} => rejects with error', async () => {
      const proxy = orchestratorGetQaChecklistAdapterProxy();
      proxy.throws({ questId: 'non-existent', error: new Error('Quest not found') });

      await expect(orchestratorGetQaChecklistAdapter({ questId: 'non-existent' })).rejects.toThrow(
        /Quest not found/u,
      );
    });
  });
});
