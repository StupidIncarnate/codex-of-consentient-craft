import { claudeQueueResponseContract } from './claude-queue-response-contract';
import { ClaudeQueueResponseStub } from './claude-queue-response.stub';

import { ExitCodeStub } from '../exit-code/exit-code.stub';
import { SessionIdStub } from '../session-id/session-id.stub';
import { StreamJsonLineStub } from '../stream-json-line/stream-json-line.stub';
import { TimeoutMsStub } from '../timeout-ms/timeout-ms.stub';

type ClaudeQueueResponse = ReturnType<typeof ClaudeQueueResponseStub>;

describe('claudeQueueResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {minimal fields} => parses response with sessionId and lines', () => {
      const result = claudeQueueResponseContract.parse({
        sessionId: SessionIdStub(),
        lines: [StreamJsonLineStub()],
      });

      expect(result).toStrictEqual({
        sessionId: SessionIdStub(),
        lines: [StreamJsonLineStub()],
      });
    });

    it('VALID: {all fields} => parses response with all optional fields', () => {
      const result = claudeQueueResponseContract.parse({
        sessionId: SessionIdStub(),
        lines: [],
        exitCode: ExitCodeStub(),
        delayMs: TimeoutMsStub(),
      });

      expect(result).toStrictEqual({
        sessionId: SessionIdStub(),
        lines: [],
        exitCode: ExitCodeStub(),
        delayMs: TimeoutMsStub(),
      });
    });
  });

  describe('stub', () => {
    it('VALID: stub default => returns default response', () => {
      const response: ClaudeQueueResponse = ClaudeQueueResponseStub();

      expect(response).toStrictEqual({
        sessionId: 'sess-stub-001',
        lines: [],
      });
    });
  });

  describe('invalid responses', () => {
    it('INVALID: {sessionId: missing} => throws for missing sessionId', () => {
      expect(() => claudeQueueResponseContract.parse({ lines: [] })).toThrow(/invalid_type/u);
    });

    it('INVALID: {lines: missing} => throws for missing lines', () => {
      expect(() => claudeQueueResponseContract.parse({ sessionId: 'sess-1' })).toThrow(
        /invalid_type/u,
      );
    });
  });
});
