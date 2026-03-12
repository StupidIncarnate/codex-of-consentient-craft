import { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import { ProcessOutputResponderProxy } from './process-output-responder.proxy';

describe('ProcessOutputResponder', () => {
  describe('successful output retrieval', () => {
    it('VALID: {valid processId} => returns 200 with empty slots', () => {
      const proxy = ProcessOutputResponderProxy();
      const processId = ProcessIdStub();

      const result = proxy.callResponder({ params: { processId } });

      expect(result).toStrictEqual({
        status: 200,
        data: { slots: {} },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', () => {
      const proxy = ProcessOutputResponderProxy();

      const result = proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {non-object params} => returns 400 with error', () => {
      const proxy = ProcessOutputResponderProxy();

      const result = proxy.callResponder({ params: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing processId} => returns 400 with error', () => {
      const proxy = ProcessOutputResponderProxy();

      const result = proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'processId is required' },
      });
    });

    it('INVALID_MULTIPLE: {processId is number} => returns 400 with error', () => {
      const proxy = ProcessOutputResponderProxy();

      const result = proxy.callResponder({ params: { processId: 123 } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'processId is required' },
      });
    });
  });
});
