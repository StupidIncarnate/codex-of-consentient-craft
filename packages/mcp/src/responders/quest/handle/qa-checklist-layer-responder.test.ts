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
