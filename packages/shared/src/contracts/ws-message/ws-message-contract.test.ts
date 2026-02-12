import { wsMessageContract } from './ws-message-contract';
import { WsMessageStub } from './ws-message.stub';

describe('wsMessageContract', () => {
  describe('valid messages', () => {
    it('VALID: {default} => parses with defaults', () => {
      const message = WsMessageStub();

      expect(wsMessageContract.parse(message)).toStrictEqual({
        type: 'phase-change',
        payload: { processId: 'proc-12345', phase: 'codeweaver' },
        timestamp: '2025-01-01T00:00:00.000Z',
      });
    });

    it('VALID: {type: slot-update} => parses slot-update type', () => {
      const message = WsMessageStub({
        type: 'slot-update',
        payload: { slotId: 0, status: 'running' },
      });

      expect(message.type).toBe('slot-update');
      expect(message.payload).toStrictEqual({ slotId: 0, status: 'running' });
    });

    it('VALID: {type: agent-output} => parses agent-output type', () => {
      const message = WsMessageStub({
        type: 'agent-output',
        payload: { slotId: 1, line: 'Processing step 3...' },
      });

      expect(message.type).toBe('agent-output');
    });

    it('VALID: {type: progress-update} => parses progress-update type', () => {
      const message = WsMessageStub({
        type: 'progress-update',
        payload: { completed: 3, total: 10 },
      });

      expect(message.type).toBe('progress-update');
    });

    it('VALID: {type: process-complete} => parses process-complete type', () => {
      const message = WsMessageStub({
        type: 'process-complete',
        payload: { processId: 'proc-999' },
      });

      expect(message.type).toBe('process-complete');
    });

    it('VALID: {type: process-failed} => parses process-failed type', () => {
      const message = WsMessageStub({
        type: 'process-failed',
        payload: { processId: 'proc-999', error: 'Timeout exceeded' },
      });

      expect(message.type).toBe('process-failed');
    });
  });

  describe('invalid messages', () => {
    it('INVALID_TYPE: {type: "unknown"} => throws validation error', () => {
      expect(() => {
        wsMessageContract.parse({
          type: 'unknown',
          payload: {},
          timestamp: '2025-01-01T00:00:00.000Z',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_TIMESTAMP: {timestamp: "not-a-date"} => throws validation error', () => {
      expect(() => {
        wsMessageContract.parse({
          type: 'phase-change',
          payload: {},
          timestamp: 'not-a-date',
        });
      }).toThrow(/Invalid/u);
    });

    it('INVALID_MISSING_TYPE: {} => throws validation error', () => {
      expect(() => {
        wsMessageContract.parse({
          payload: {},
          timestamp: '2025-01-01T00:00:00.000Z',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MISSING_PAYLOAD: {} => throws validation error', () => {
      expect(() => {
        wsMessageContract.parse({
          type: 'phase-change',
          timestamp: '2025-01-01T00:00:00.000Z',
        });
      }).toThrow(/Required/u);
    });
  });
});
