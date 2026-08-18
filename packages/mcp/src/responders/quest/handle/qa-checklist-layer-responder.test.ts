import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { QaChecklistLayerResponder } from './qa-checklist-layer-responder';
import { QaChecklistLayerResponderProxy } from './qa-checklist-layer-responder.proxy';

const JSON_INDENT_SPACES = 2;

describe('QaChecklistLayerResponder', () => {
  describe('successful checklist', () => {
    it('VALID: {questId} => returns the rendered text VERBATIM, not JSON-stringified', async () => {
      const proxy = QaChecklistLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: {
          success: true,
          data: ContentTextStub({ value: '# QA CHECKLIST\nUnits: 3\n[ ] a-flow:observable:x' }),
        },
      });

      const result = await QaChecklistLayerResponder({ args: { questId: 'add-auth' } });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: '# QA CHECKLIST\nUnits: 3\n[ ] a-flow:observable:x' }],
      });
    });

    it('VALID: {questId, flowId} => forwards flowId to the orchestrator', async () => {
      const proxy = QaChecklistLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      await QaChecklistLayerResponder({ args: { questId: 'add-auth', flowId: 'login-flow' } });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        flowId: 'login-flow',
      });
    });

    it('VALID: {questId, no flowId} => omits flowId from the call', async () => {
      const proxy = QaChecklistLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      await QaChecklistLayerResponder({ args: { questId: 'add-auth' } });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
      });
    });

    it('VALID: {questId, operationItemId} => forwards the item id to the orchestrator', async () => {
      const proxy = QaChecklistLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      await QaChecklistLayerResponder({ args: { questId: 'add-auth', operationItemId: 'op-1' } });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        operationItemId: 'op-1',
      });
    });

    it('VALID: {questId, no operationItemId} => omits it from the call', async () => {
      const proxy = QaChecklistLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: { success: true, data: ContentTextStub({ value: '# QA CHECKLIST' }) },
      });

      await QaChecklistLayerResponder({ args: { questId: 'add-auth', flowId: 'login-flow' } });

      expect(proxy.getLastCalledInputFor({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
        flowId: 'login-flow',
      });
    });
  });

  describe('the scope arguments this tool no longer takes', () => {
    // `track` and `packageNames` were the caller's job and each was a way to ask a DIFFERENT
    // question from the one the completion gate answers. They are gone, and the strict contract
    // turns a stale call into a loud rejection rather than a silently ignored argument.
    it.each([
      ['track', { track: 'flowrider' }],
      ['packageNames', { packageNames: ['ui-app'] }],
    ])('INVALID: {%s} => throws on the strict contract', async (_name, extra) => {
      QaChecklistLayerResponderProxy();

      await expect(
        QaChecklistLayerResponder({ args: { questId: 'add-auth', ...extra } }),
      ).rejects.toThrow(/Unrecognized key/u);
    });

    // A hard rejection rather than a precedence rule: the item already declares its flows, so a
    // hand-picked one alongside it can only mean the caller thinks it is measuring something else.
    it('INVALID: {operationItemId AND flowId} => throws, the item already declares its flows', async () => {
      QaChecklistLayerResponderProxy();

      await expect(
        QaChecklistLayerResponder({
          args: { questId: 'add-auth', operationItemId: 'op-1', flowId: 'login-flow' },
        }),
      ).rejects.toThrow(/flowId cannot be combined with operationItemId/u);
    });
  });

  describe('unsuccessful checklist', () => {
    it('ERROR: {orchestrator returns success false} => returns the JSON error shape with isError', async () => {
      const proxy = QaChecklistLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: { success: false, error: ContentTextStub({ value: 'Quest not found' }) as never },
      });

      const result = await QaChecklistLayerResponder({ args: { questId: 'add-auth' } });

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
      const proxy = QaChecklistLayerResponderProxy();
      proxy.setupThrows({ questId: 'add-auth', error: new Error('boom') });

      const result = await QaChecklistLayerResponder({ args: { questId: 'add-auth' } });

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
      QaChecklistLayerResponderProxy();

      await expect(QaChecklistLayerResponder({ args: {} })).rejects.toThrow(/Required/u);
    });

    it('INVALID: {unknown key} => throws on the strict contract', async () => {
      QaChecklistLayerResponderProxy();

      await expect(
        QaChecklistLayerResponder({ args: { questId: 'add-auth', stage: 'spec' } }),
      ).rejects.toThrow(/Unrecognized key/u);
    });
  });
});
