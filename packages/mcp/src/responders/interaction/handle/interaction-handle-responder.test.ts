import { ToolNameStub } from '../../../contracts/tool-name/tool-name.stub';
import { InteractionHandleResponderProxy } from './interaction-handle-responder.proxy';

describe('InteractionHandleResponder', () => {
  describe('signal-back', () => {
    it('VALID: {signal: complete} => returns JSON result', () => {
      const proxy = InteractionHandleResponderProxy();

      const result = proxy.callResponder({
        tool: ToolNameStub({ value: 'signal-back' }),
        args: {
          signal: 'complete',
          summary: 'Step completed successfully',
        },
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeUndefined();
    });

    it('VALID: {signal: failed} => returns JSON result', () => {
      const proxy = InteractionHandleResponderProxy();

      const result = proxy.callResponder({
        tool: ToolNameStub({ value: 'signal-back' }),
        args: {
          signal: 'failed',
          summary: 'Tests failing in user-fetch-broker',
        },
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeUndefined();
    });
  });

  describe('ask-user-question', () => {
    it('VALID: {questions} => returns instruction text', () => {
      const proxy = InteractionHandleResponderProxy();

      const result = proxy.callResponder({
        tool: ToolNameStub({ value: 'ask-user-question' }),
        args: {
          questions: [
            {
              question: 'Which option?',
              header: 'Choice',
              options: [{ label: 'A', description: 'Option A' }],
              multiSelect: false,
            },
          ],
        },
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeUndefined();
    });
  });

  describe('unknown tool', () => {
    it('ERROR: {tool: unknown-tool} => throws unknown tool error', () => {
      const proxy = InteractionHandleResponderProxy();

      expect(() =>
        proxy.callResponder({
          tool: ToolNameStub({ value: 'unknown-tool' }),
          args: {},
        }),
      ).toThrow(/Unknown interaction tool/u);
    });
  });
});
