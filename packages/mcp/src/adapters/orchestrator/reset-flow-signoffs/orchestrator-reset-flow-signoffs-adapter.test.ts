import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { orchestratorResetFlowSignoffsAdapter } from './orchestrator-reset-flow-signoffs-adapter';
import { orchestratorResetFlowSignoffsAdapterProxy } from './orchestrator-reset-flow-signoffs-adapter.proxy';

const REASON = 'Fixed the redirect guard the walk exposed.';

describe('orchestratorResetFlowSignoffsAdapter', () => {
  describe('one flow reset', () => {
    it('VALID: {questId, workItemId, flowId, reason} => returns the wrapped reset report', async () => {
      const proxy = orchestratorResetFlowSignoffsAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        flowId: 'login-flow',
        result: {
          success: true,
          data: ContentTextStub({ value: 'Siegemaster walk reset for flow login-flow.' }),
        },
      });

      const result = await orchestratorResetFlowSignoffsAdapter({
        questId: 'add-auth',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        flowId: 'login-flow',
        reason: REASON,
      });

      expect(result).toStrictEqual({
        success: true,
        data: 'Siegemaster walk reset for flow login-flow.',
      });
    });

    it('VALID: {all four fields} => forwards every one to the orchestrator', async () => {
      const proxy = orchestratorResetFlowSignoffsAdapterProxy();
      proxy.returns({
        questId: 'add-auth',
        flowId: 'login-flow',
        result: { success: true, data: ContentTextStub({ value: 'ok' }) },
      });

      await orchestratorResetFlowSignoffsAdapter({
        questId: 'add-auth',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        flowId: 'login-flow',
        reason: REASON,
      });

      expect(
        proxy.getLastCalledInputFor({ questId: 'add-auth', flowId: 'login-flow' }),
      ).toStrictEqual({
        questId: 'add-auth',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        flowId: 'login-flow',
        reason: REASON,
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => rejects with error', async () => {
      const proxy = orchestratorResetFlowSignoffsAdapterProxy();
      proxy.throws({
        questId: 'add-auth',
        flowId: 'login-flow',
        error: new Error('Quest not found'),
      });

      await expect(
        orchestratorResetFlowSignoffsAdapter({
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: REASON,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
