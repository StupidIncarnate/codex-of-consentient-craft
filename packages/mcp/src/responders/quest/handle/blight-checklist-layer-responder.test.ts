import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { BlightChecklistLayerResponder } from './blight-checklist-layer-responder';
import { BlightChecklistLayerResponderProxy } from './blight-checklist-layer-responder.proxy';

const JSON_INDENT_SPACES = 2;

describe('BlightChecklistLayerResponder', () => {
  describe('successful checklist', () => {
    it('VALID: {questId} => returns the rendered text VERBATIM, not JSON-stringified', async () => {
      const proxy = BlightChecklistLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: {
          success: true,
          data: ContentTextStub({
            value: '# BLIGHT CHECKLIST\nUnits: 3\n[ ] a-file:security:x',
          }),
        },
      });

      const result = await BlightChecklistLayerResponder({ args: { questId: 'add-auth' } });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: '# BLIGHT CHECKLIST\nUnits: 3\n[ ] a-file:security:x' }],
      });
    });

    it('VALID: {questId} => forwards questId to the orchestrator', async () => {
      const proxy = BlightChecklistLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# BLIGHT CHECKLIST' }) },
      });

      await BlightChecklistLayerResponder({ args: { questId: 'add-auth' } });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
      });
    });

    // The refusal message the signal-back gate hands a Blightscout session names this exact call.
    // Rejecting it, or accepting it and dropping the value, leaves the role reading a whole-quest
    // diff while it is graded on one commit.
    it("VALID: {questId, scope: 'commit'} => forwards the scope, so the session reads the diff its gate measures", async () => {
      const proxy = BlightChecklistLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# BLIGHT CHECKLIST' }) },
      });

      await BlightChecklistLayerResponder({ args: { questId: 'add-auth', scope: 'commit' } });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        scope: 'commit',
      });
    });
  });

  describe('unsuccessful checklist', () => {
    it('ERROR: {orchestrator returns success false} => returns the JSON error shape with isError', async () => {
      const proxy = BlightChecklistLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: { success: false, error: ContentTextStub({ value: 'Quest not found' }) as never },
      });

      const result = await BlightChecklistLayerResponder({ args: { questId: 'add-auth' } });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Quest not found' },
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
      const proxy = BlightChecklistLayerResponderProxy();
      proxy.setupThrows({ questId: 'add-auth', error: new Error('boom') });

      const result = await BlightChecklistLayerResponder({ args: { questId: 'add-auth' } });

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
    it('INVALID: {missing questId} => throws before any adapter call', async () => {
      BlightChecklistLayerResponderProxy();

      await expect(BlightChecklistLayerResponder({ args: {} })).rejects.toThrow(/Required/u);
    });

    it('INVALID: {unknown key} => throws on the strict contract, no flowId sub-scope exists', async () => {
      BlightChecklistLayerResponderProxy();

      await expect(
        BlightChecklistLayerResponder({ args: { questId: 'add-auth', flowId: 'login-flow' } }),
      ).rejects.toThrow(/Unrecognized key/u);
    });
  });
});
