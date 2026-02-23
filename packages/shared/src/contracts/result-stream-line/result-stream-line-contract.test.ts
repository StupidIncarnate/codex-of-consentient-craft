import { resultStreamLineContract } from './result-stream-line-contract';
import { ResultStreamLineStub } from './result-stream-line.stub';

describe('resultStreamLineContract', () => {
  describe('valid stream lines', () => {
    it('VALID: {result with all fields} => parses correctly', () => {
      const streamLine = ResultStreamLineStub();

      const result = resultStreamLineContract.parse(streamLine);

      expect(result).toStrictEqual({
        type: 'result',
        session_id: 'session-123',
        cost_usd: 0.003,
        duration_ms: 1500,
        num_turns: 3,
      });
    });

    it('VALID: {result with only required fields} => parses without optional fields', () => {
      const streamLine = ResultStreamLineStub({
        cost_usd: undefined,
        duration_ms: undefined,
        num_turns: undefined,
      });

      const result = resultStreamLineContract.parse(streamLine);

      expect(result.type).toBe('result');
      expect(result.session_id).toBe('session-123');
    });
  });

  describe('invalid stream lines', () => {
    it('INVALID_TYPE: {type: "system"} => throws validation error', () => {
      expect(() => {
        resultStreamLineContract.parse({
          type: 'system',
          session_id: 'session-123',
        });
      }).toThrow(/Invalid literal value/u);
    });

    it('INVALID_MISSING: {missing session_id} => throws validation error', () => {
      expect(() => {
        resultStreamLineContract.parse({
          type: 'result',
        });
      }).toThrow(/Required/u);
    });
  });
});
