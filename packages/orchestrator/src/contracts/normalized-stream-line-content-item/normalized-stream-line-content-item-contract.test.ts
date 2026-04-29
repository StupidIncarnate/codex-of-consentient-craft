import { normalizedStreamLineContentItemContract } from './normalized-stream-line-content-item-contract';
import {
  NormalizedStreamLineContentItemStub,
  NormalizedTextContentItemStub,
  NormalizedToolUseContentItemStub,
  NormalizedToolResultStringContentItemStub,
  NormalizedToolResultArrayContentItemStub,
  NormalizedThinkingContentItemStub,
  NormalizedRedactedThinkingContentItemStub,
} from './normalized-stream-line-content-item.stub';

describe('normalizedStreamLineContentItemContract', (): void => {
  describe('default stub backward-compat', (): void => {
    it('VALID: {default text stub} => parses with text fields', (): void => {
      const item = NormalizedStreamLineContentItemStub();

      expect(item).toStrictEqual({
        type: 'text',
        text: 'Hello world',
      });
    });
  });

  describe('text variant', (): void => {
    it('VALID: {type: "text", text: "Hello"} => parses to text variant', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'text',
        text: 'Hello',
      });

      expect(item).toStrictEqual({
        type: 'text',
        text: 'Hello',
      });
    });

    it('VALID: {NormalizedTextContentItemStub default} => type text, text Hello world', (): void => {
      const item = NormalizedTextContentItemStub();

      expect(item).toStrictEqual({
        type: 'text',
        text: 'Hello world',
      });
    });

    it('VALID: {text with source + agentId passthrough} => preserves correlation fields', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'text',
        text: 'hi',
        source: 'subagent',
        agentId: 'toolu_abc',
      });

      expect(item).toStrictEqual({
        type: 'text',
        text: 'hi',
        source: 'subagent',
        agentId: 'toolu_abc',
      });
    });

    it('VALID: {extra unknown fields} => preserved via passthrough', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'text',
        text: 'hello',
        foo: 'bar',
      });

      expect((item as { foo?: unknown }).foo).toBe('bar');
    });

    it('INVALID: {type: "text", text missing} => throws', (): void => {
      expect((): unknown =>
        normalizedStreamLineContentItemContract.parse({ type: 'text' }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {type: "text", text is number} => throws', (): void => {
      expect((): unknown =>
        normalizedStreamLineContentItemContract.parse({ type: 'text', text: 42 }),
      ).toThrow(/Expected string/u);
    });
  });

  describe('thinking variant', (): void => {
    it('VALID: {type: "thinking", thinking: "..."} => parses to thinking variant', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'thinking',
        thinking: 'Let me reason through this.',
      });

      expect(item).toStrictEqual({
        type: 'thinking',
        thinking: 'Let me reason through this.',
      });
    });

    it('VALID: {NormalizedThinkingContentItemStub default} => type thinking, has thinking field', (): void => {
      const item = NormalizedThinkingContentItemStub();

      expect(item).toStrictEqual({
        type: 'thinking',
        thinking: 'Let me reason through this carefully.',
      });
    });

    it('VALID: {thinking with signature} => includes signature', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'thinking',
        thinking: 'Analysis complete.',
        signature: 'sig_abc123',
      });

      expect(item).toStrictEqual({
        type: 'thinking',
        thinking: 'Analysis complete.',
        signature: 'sig_abc123',
      });
    });

    it('VALID: {NormalizedThinkingContentItemStub with signature} => includes signature', (): void => {
      const item = NormalizedThinkingContentItemStub({ signature: 'sig_abc' });

      expect(item).toStrictEqual({
        type: 'thinking',
        thinking: 'Let me reason through this carefully.',
        signature: 'sig_abc',
      });
    });

    it('INVALID: {type: "thinking", thinking missing} => throws', (): void => {
      expect((): unknown =>
        normalizedStreamLineContentItemContract.parse({ type: 'thinking' }),
      ).toThrow(/Required/u);
    });
  });

  describe('redacted_thinking variant', (): void => {
    it('VALID: {type: "redacted_thinking", data: "..."} => parses to redacted_thinking variant', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'redacted_thinking',
        data: '<encrypted-blob>',
      });

      expect(item).toStrictEqual({
        type: 'redacted_thinking',
        data: '<encrypted-blob>',
      });
    });

    it('VALID: {NormalizedRedactedThinkingContentItemStub default} => type redacted_thinking', (): void => {
      const item = NormalizedRedactedThinkingContentItemStub();

      expect(item).toStrictEqual({
        type: 'redacted_thinking',
        data: '<encrypted-redacted-thinking-blob>',
      });
    });

    it('INVALID: {type: "redacted_thinking", data missing} => throws', (): void => {
      expect((): unknown =>
        normalizedStreamLineContentItemContract.parse({ type: 'redacted_thinking' }),
      ).toThrow(/Required/u);
    });
  });

  describe('tool_use variant', (): void => {
    it('VALID: {type: "tool_use", id, name, input} => parses to tool_use variant', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'tool_use',
        id: 'toolu_01X',
        name: 'Task',
        input: { question: 'why?' },
      });

      expect(item).toStrictEqual({
        type: 'tool_use',
        id: 'toolu_01X',
        name: 'Task',
        input: { question: 'why?' },
      });
    });

    it('VALID: {NormalizedToolUseContentItemStub default} => type tool_use, Bash', (): void => {
      const item = NormalizedToolUseContentItemStub();

      expect(item).toStrictEqual({
        type: 'tool_use',
        id: 'toolu_01TestToolUse',
        name: 'Bash',
        input: {},
      });
    });

    it('VALID: {tool_use with agentId passthrough} => preserves agentId', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'tool_use',
        id: 'toolu_abc',
        name: 'Task',
        input: {},
        agentId: 'toolu_abc',
      });

      expect(item).toStrictEqual({
        type: 'tool_use',
        id: 'toolu_abc',
        name: 'Task',
        input: {},
        agentId: 'toolu_abc',
      });
    });

    it('VALID: {tool_use with all fields optional absent} => parses with type only', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'tool_use',
      });

      expect(item).toStrictEqual({
        type: 'tool_use',
      });
    });
  });

  describe('tool_result variant', (): void => {
    it('VALID: {type: "tool_result", toolUseId, string content} => parses to tool_result variant', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'tool_result',
        toolUseId: 'toolu_123',
        content: 'file contents',
      });

      expect(item).toStrictEqual({
        type: 'tool_result',
        toolUseId: 'toolu_123',
        content: 'file contents',
      });
    });

    it('VALID: {NormalizedToolResultStringContentItemStub default} => string content form', (): void => {
      const item = NormalizedToolResultStringContentItemStub();

      expect(item).toStrictEqual({
        type: 'tool_result',
        toolUseId: 'toolu_01TestToolResult',
        content: 'Tool output text',
      });
    });

    it('VALID: {type: "tool_result", content is array} => parses array content as unknown', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'tool_result',
        toolUseId: 'toolu_456',
        content: [{ type: 'text', text: 'block one' }],
      });

      expect(item).toStrictEqual({
        type: 'tool_result',
        toolUseId: 'toolu_456',
        content: [{ type: 'text', text: 'block one' }],
      });
    });

    it('VALID: {NormalizedToolResultArrayContentItemStub default} => array content form', (): void => {
      const item = NormalizedToolResultArrayContentItemStub();

      expect(item).toStrictEqual({
        type: 'tool_result',
        toolUseId: 'toolu_01TestToolResultArray',
        content: [
          { type: 'text', text: 'Line one' },
          { type: 'text', text: 'Line two' },
        ],
      });
    });

    it('VALID: {tool_result with isError: true} => parses with isError', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'tool_result',
        toolUseId: 'toolu_789',
        content: 'error occurred',
        isError: true,
      });

      expect(item).toStrictEqual({
        type: 'tool_result',
        toolUseId: 'toolu_789',
        content: 'error occurred',
        isError: true,
      });
    });

    it('VALID: {tool_result with all optional fields absent} => parses with type only', (): void => {
      const item = normalizedStreamLineContentItemContract.parse({
        type: 'tool_result',
      });

      expect(item).toStrictEqual({
        type: 'tool_result',
      });
    });
  });

  describe('unknown discriminator rejection', (): void => {
    it('INVALID: {type: "unknown_type"} => throws — discriminated union rejects unknown variants', (): void => {
      expect((): unknown =>
        normalizedStreamLineContentItemContract.parse({ type: 'unknown_type' }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {type: "image"} => throws — not a normalized content variant', (): void => {
      expect((): unknown =>
        normalizedStreamLineContentItemContract.parse({ type: 'image', data: 'base64...' }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {no type field} => throws — missing discriminator', (): void => {
      expect((): unknown =>
        normalizedStreamLineContentItemContract.parse({ text: 'hello' }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('ERROR: {non-object} => throws', (): void => {
      expect((): unknown => normalizedStreamLineContentItemContract.parse(42)).toThrow(
        /Expected object/u,
      );
    });
  });
});
