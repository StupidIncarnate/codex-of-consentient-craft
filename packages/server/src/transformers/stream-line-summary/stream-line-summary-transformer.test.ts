import { streamLineSummaryTransformer } from './stream-line-summary-transformer';

describe('streamLineSummaryTransformer', () => {
  describe('basic type extraction', () => {
    it('VALID: {type: "system"} => returns "type=system"', () => {
      const result = streamLineSummaryTransformer({ parsed: { type: 'system' } });

      expect(result).toBe('type=system');
    });

    it('VALID: {type: "user"} => returns "type=user"', () => {
      const result = streamLineSummaryTransformer({ parsed: { type: 'user' } });

      expect(result).toBe('type=user');
    });

    it('VALID: {type: "system", subtype: "init"} => returns type and subtype', () => {
      const result = streamLineSummaryTransformer({ parsed: { type: 'system', subtype: 'init' } });

      expect(result).toBe('type=system, subtype=init');
    });
  });

  describe('assistant message extraction', () => {
    it('VALID: {assistant with text content} => includes preview', () => {
      const result = streamLineSummaryTransformer({
        parsed: {
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Hello world' }],
          },
        },
      });

      expect(result).toBe('type=assistant, preview="Hello world"');
    });

    it('VALID: {assistant with tool_use} => includes tool names', () => {
      const result = streamLineSummaryTransformer({
        parsed: {
          type: 'assistant',
          message: {
            content: [
              { type: 'tool_use', name: 'Read' },
              { type: 'tool_use', name: 'Write' },
            ],
          },
        },
      });

      expect(result).toBe('type=assistant, tools=[Read,Write]');
    });

    it('VALID: {assistant with text and tools} => includes both', () => {
      const result = streamLineSummaryTransformer({
        parsed: {
          type: 'assistant',
          message: {
            content: [
              { type: 'text', text: 'Let me help' },
              { type: 'tool_use', name: 'Bash' },
            ],
          },
        },
      });

      expect(result).toBe('type=assistant, preview="Let me help", tools=[Bash]');
    });

    it('VALID: {long text} => truncates preview', () => {
      const longText = 'a'.repeat(200);

      const result = streamLineSummaryTransformer({
        parsed: {
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: longText }],
          },
        },
      });

      expect(result).toBe(`type=assistant, preview="${'a'.repeat(120)}..."`);
    });

    it('VALID: {text with newlines} => escapes newlines in preview', () => {
      const result = streamLineSummaryTransformer({
        parsed: {
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'line1\nline2\nline3' }],
          },
        },
      });

      expect(result).toBe('type=assistant, preview="line1\\nline2\\nline3"');
    });
  });

  describe('result type extraction', () => {
    it('VALID: {result with cost and duration} => includes metrics', () => {
      const result = streamLineSummaryTransformer({
        parsed: {
          type: 'result',
          cost_usd: 0.0123,
          duration_ms: 5432,
          num_turns: 3,
        },
      });

      expect(result).toBe('type=result, cost=$0.0123, duration=5432ms, turns=3');
    });

    it('VALID: {result with only cost} => includes cost only', () => {
      const result = streamLineSummaryTransformer({
        parsed: {
          type: 'result',
          cost_usd: 0.5,
        },
      });

      expect(result).toBe('type=result, cost=$0.5000');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {non-object input} => returns type=unknown', () => {
      const result = streamLineSummaryTransformer({ parsed: 'not an object' });

      expect(result).toBe('type=unknown');
    });

    it('EDGE: {null input} => returns type=unknown', () => {
      const result = streamLineSummaryTransformer({ parsed: null });

      expect(result).toBe('type=unknown');
    });

    it('EDGE: {no type field} => returns type=unknown', () => {
      const result = streamLineSummaryTransformer({ parsed: { data: 'something' } });

      expect(result).toBe('type=unknown');
    });

    it('EDGE: {assistant with empty content array} => returns type only', () => {
      const result = streamLineSummaryTransformer({
        parsed: {
          type: 'assistant',
          message: { content: [] },
        },
      });

      expect(result).toBe('type=assistant');
    });
  });
});
