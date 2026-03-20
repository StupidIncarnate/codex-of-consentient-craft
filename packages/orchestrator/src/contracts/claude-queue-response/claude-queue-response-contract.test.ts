import { claudeQueueResponseContract } from './claude-queue-response-contract';
import { ClaudeQueueResponseStub } from './claude-queue-response.stub';

import { SessionIdStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

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

      expect(result.sessionId).toBe(SessionIdStub());
      expect(result.lines).toHaveLength(1);
    });

    it('VALID: {all fields} => parses response with all optional fields', () => {
      const result = claudeQueueResponseContract.parse({
        sessionId: SessionIdStub(),
        lines: [],
        exitCode: ExitCodeStub(),
        delayMs: TimeoutMsStub(),
      });

      expect(result.exitCode).toBe(ExitCodeStub());
      expect(result.delayMs).toBe(TimeoutMsStub());
    });
  });

  describe('stub', () => {
    it('VALID: stub default => returns default response', () => {
      const response: ClaudeQueueResponse = ClaudeQueueResponseStub();

      expect(response.sessionId).toBe('sess-stub-001');
      expect(response.lines).toStrictEqual([]);
    });
  });

  describe('invalid responses', () => {
    it('INVALID_TYPE: {sessionId: missing} => throws for missing sessionId', () => {
      expect(() => claudeQueueResponseContract.parse({ lines: [] })).toThrow(/invalid_type/u);
    });

    it('INVALID_TYPE: {lines: missing} => throws for missing lines', () => {
      expect(() => claudeQueueResponseContract.parse({ sessionId: 'sess-1' })).toThrow(
        /invalid_type/u,
      );
    });
  });
});
