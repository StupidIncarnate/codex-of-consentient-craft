import { ProcessIdStub } from '../../../contracts/process-id/process-id.stub';
import { SessionChatStopResponderProxy } from './session-chat-stop-responder.proxy';

describe('SessionChatStopResponder', () => {
  describe('successful stop', () => {
    it('VALID: {active processId} => returns 200 with stopped true', () => {
      const proxy = SessionChatStopResponderProxy();
      const processId = ProcessIdStub({ value: 'proc-active-123' });
      proxy.setupWithProcess();

      const result = proxy.callResponder({ params: { chatProcessId: processId } });

      expect(result).toStrictEqual({
        status: 200,
        data: { stopped: true },
      });
    });
  });

  describe('not found', () => {
    it('EMPTY: {unknown processId} => returns 404 with error', () => {
      const proxy = SessionChatStopResponderProxy();
      proxy.setupEmpty();

      const result = proxy.callResponder({ params: { chatProcessId: 'proc-unknown' } });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'Process not found or already exited' },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', () => {
      const proxy = SessionChatStopResponderProxy();

      const result = proxy.callResponder({ params: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {non-object params} => returns 400 with error', () => {
      const proxy = SessionChatStopResponderProxy();

      const result = proxy.callResponder({ params: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing chatProcessId} => returns 400 with error', () => {
      const proxy = SessionChatStopResponderProxy();

      const result = proxy.callResponder({ params: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'chatProcessId is required' },
      });
    });

    it('INVALID_MULTIPLE: {chatProcessId is number} => returns 400 with error', () => {
      const proxy = SessionChatStopResponderProxy();

      const result = proxy.callResponder({ params: { chatProcessId: 123 } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'chatProcessId is required' },
      });
    });
  });
});
