import { OrchestrationStatusStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';
import { ProcessStatusResponderProxy } from './process-status-responder.proxy';

describe('ProcessStatusResponder', () => {
  describe('successful status retrieval', () => {
    it('VALID: {valid processId} => returns 200 with status', () => {
      const proxy = ProcessStatusResponderProxy();
      const processId = ProcessIdStub();
      const status = OrchestrationStatusStub();
      proxy.setupGetStatus({ status });

      const result = proxy.callResponder({ params: { processId } });

      expect(result).toStrictEqual({
        status: 200,
        data: status,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', () => {
      const proxy = ProcessStatusResponderProxy();

      const result = proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {non-object params} => returns 400 with error', () => {
      const proxy = ProcessStatusResponderProxy();

      const result = proxy.callResponder({ params: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing processId} => returns 400 with error', () => {
      const proxy = ProcessStatusResponderProxy();

      const result = proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'processId is required' },
      });
    });

    it('INVALID_MULTIPLE: {processId is number} => returns 400 with error', () => {
      const proxy = ProcessStatusResponderProxy();

      const result = proxy.callResponder({ params: { processId: 123 } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'processId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', () => {
      const proxy = ProcessStatusResponderProxy();
      proxy.setupGetStatusError({ message: 'Process not found' });

      const result = proxy.callResponder({ params: { processId: 'proc-123' } });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Process not found' },
      });
    });
  });
});
