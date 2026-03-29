/**
 * PURPOSE: Tests that streamLineToJsonLineTransformer correctly stringifies objects into StreamJsonLine branded strings
 *
 * USAGE: npm run ward -- --only unit -- packages/shared/src/transformers/stream-line-to-json-line
 */
import { streamLineToJsonLineTransformer } from './stream-line-to-json-line-transformer';
import type { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';
import { SystemInitStreamLineStub } from '../../contracts/system-init-stream-line/system-init-stream-line.stub';
import { AssistantTextStreamLineStub } from '../../contracts/assistant-stream-line/assistant-stream-line.stub';
import { ResultStreamLineStub } from '../../contracts/result-stream-line/result-stream-line.stub';

type StreamJsonLine = ReturnType<typeof StreamJsonLineStub>;

describe('streamLineToJsonLineTransformer', () => {
  describe('system init lines', () => {
    it('VALID: {streamLine: SystemInitStreamLine} => returns JSON stringified StreamJsonLine', () => {
      const streamLine = SystemInitStreamLineStub();

      const result = streamLineToJsonLineTransformer({ streamLine: streamLine as object });

      const parsed = JSON.parse(result) as Record<PropertyKey, unknown>;

      expect(parsed).toStrictEqual({
        type: 'system',
        subtype: 'init',
        session_id: 'session-abc-123',
      });
    });
  });

  describe('assistant text lines', () => {
    it('VALID: {streamLine: AssistantTextStreamLine} => returns JSON stringified StreamJsonLine', () => {
      const streamLine = AssistantTextStreamLineStub();

      const result: StreamJsonLine = streamLineToJsonLineTransformer({
        streamLine: streamLine as object,
      });

      const parsed = JSON.parse(result) as Record<PropertyKey, unknown>;

      expect(parsed).toStrictEqual({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello, I can help with that.' }],
        },
      });
    });
  });

  describe('result lines', () => {
    it('VALID: {streamLine: ResultStreamLine} => returns JSON stringified StreamJsonLine', () => {
      const streamLine = ResultStreamLineStub();

      const result: StreamJsonLine = streamLineToJsonLineTransformer({
        streamLine: streamLine as object,
      });

      const parsed = JSON.parse(result) as Record<PropertyKey, unknown>;

      expect(parsed).toStrictEqual({
        type: 'result',
        session_id: 'session-123',
        cost_usd: 0.003,
        duration_ms: 1500,
        num_turns: 3,
      });
    });
  });
});
