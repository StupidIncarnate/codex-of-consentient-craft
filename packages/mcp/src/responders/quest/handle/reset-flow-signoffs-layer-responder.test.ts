import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { ResetFlowSignoffsLayerResponder } from './reset-flow-signoffs-layer-responder';
import { ResetFlowSignoffsLayerResponderProxy } from './reset-flow-signoffs-layer-responder.proxy';

const JSON_INDENT_SPACES = 2;

describe('ResetFlowSignoffsLayerResponder', () => {
  describe('successful reset', () => {
    it('VALID: {questId, workItemId, flowId, reason} => returns the report VERBATIM, not JSON-stringified', async () => {
      const proxy = ResetFlowSignoffsLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        flowId: 'login-flow',
        result: {
          success: true,
          data: ContentTextStub({
            value:
              'Siegemaster walk reset for flow login-flow.\nCleared 4 siegemasterSignoff value(s).',
          }),
        },
      });

      const result = await ResetFlowSignoffsLayerResponder({
        args: {
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: 'Fixed the redirect guard the walk exposed.',
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: 'Siegemaster walk reset for flow login-flow.\nCleared 4 siegemasterSignoff value(s).',
          },
        ],
      });
    });

    it('VALID: {all four fields} => forwards every one to the orchestrator', async () => {
      const proxy = ResetFlowSignoffsLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        flowId: 'login-flow',
        result: { success: true, data: ContentTextStub({ value: 'ok' }) },
      });

      await ResetFlowSignoffsLayerResponder({
        args: {
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: 'Fixed the redirect guard the walk exposed.',
        },
      });

      expect(
        proxy.getLastCalledInputFor({ questId: 'add-auth', flowId: 'login-flow' }),
      ).toStrictEqual({
        questId: 'add-auth',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        flowId: 'login-flow',
        reason: 'Fixed the redirect guard the walk exposed.',
      });
    });
  });

  describe('refused reset', () => {
    it('ERROR: {orchestrator returns success false} => returns the JSON error shape with isError', async () => {
      const proxy = ResetFlowSignoffsLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        flowId: 'login-flow',
        result: {
          success: false,
          error: ContentTextStub({
            value:
              'reset-flow-signoffs: flow login-flow is outside the scope of work item f47ac10b',
          }) as never,
        },
      });

      const result = await ResetFlowSignoffsLayerResponder({
        args: {
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: 'Fixed the redirect guard the walk exposed.',
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error:
                  'reset-flow-signoffs: flow login-flow is outside the scope of work item f47ac10b',
              },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('adapter failures', () => {
    it('ERROR: {orchestrator throws} => returns the JSON error shape with isError', async () => {
      const proxy = ResetFlowSignoffsLayerResponderProxy();
      proxy.setupThrows({ questId: 'add-auth', flowId: 'login-flow', error: new Error('boom') });

      const result = await ResetFlowSignoffsLayerResponder({
        args: {
          questId: 'add-auth',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          flowId: 'login-flow',
          reason: 'Fixed the redirect guard the walk exposed.',
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, error: 'boom' }, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });
  });

  describe('input validation', () => {
    it('INVALID: {missing workItemId} => throws before any adapter call', async () => {
      ResetFlowSignoffsLayerResponderProxy();

      await expect(
        ResetFlowSignoffsLayerResponder({
          args: { questId: 'add-auth', flowId: 'login-flow', reason: 'fixed it' },
        }),
      ).rejects.toThrow(/Required/u);
    });

    it('INVALID: {unknown key} => throws on the strict contract, there is no per-unit sub-scope', async () => {
      ResetFlowSignoffsLayerResponderProxy();

      await expect(
        ResetFlowSignoffsLayerResponder({
          args: {
            questId: 'add-auth',
            workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            flowId: 'login-flow',
            reason: 'fixed it',
            unitId: 'login-flow:terminal:dashboard',
          },
        }),
      ).rejects.toThrow(/Unrecognized key/u);
    });
  });
});
