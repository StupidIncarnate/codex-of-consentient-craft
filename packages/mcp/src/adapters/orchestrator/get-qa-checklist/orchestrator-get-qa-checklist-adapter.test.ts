import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { signoffTracksStatics } from '@dungeonmaster/shared/statics';

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
    // The DENOMINATOR list, not the sign-off field list — `groundstomper` is the member that only
    // exists on this side, and it is the one this adapter previously could not carry.
    it.each(signoffTracksStatics.denominators)(
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

  describe('package-sliced', () => {
    // The item's own slice is what makes a per-package flowrider item's remainder its own rather
    // than N copies of the whole quest's. Dropping it here would leave a session reading a number
    // its gate never computes.
    it('VALID: {questId, track, packageNames} => forwards the slice to the orchestrator', async () => {
      const proxy = orchestratorGetQaChecklistAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      await orchestratorGetQaChecklistAdapter({
        questId: 'add-auth',
        track: 'groundstomper',
        packageNames: ['ui-app'],
      });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        track: 'groundstomper',
        packageNames: ['ui-app'],
      });
    });

    it('VALID: {questId, no packageNames} => omits packageNames from the call', async () => {
      const proxy = orchestratorGetQaChecklistAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      await orchestratorGetQaChecklistAdapter({ questId: 'add-auth', track: 'flowrider' });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        track: 'flowrider',
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
