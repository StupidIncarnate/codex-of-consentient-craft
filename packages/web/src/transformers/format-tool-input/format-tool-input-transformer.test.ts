import { formatToolInputTransformer } from './format-tool-input-transformer';
import { formatToolInputTransformerProxy } from './format-tool-input-transformer.proxy';

describe('formatToolInputTransformer', () => {
  describe('Bash tool', () => {
    it('VALID: {toolName: Bash, command field} => returns command as first field', () => {
      formatToolInputTransformerProxy();

      const result = formatToolInputTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"ls -la","timeout":5000}',
      });

      expect(result).toStrictEqual({
        fields: [
          { key: 'command', value: 'ls -la', isLong: false },
          { key: 'timeout', value: '5000', isLong: false },
        ],
      });
    });
  });

  describe('Write tool', () => {
    it('VALID: {toolName: Write, file_path field} => returns file_path as first field', () => {
      formatToolInputTransformerProxy();

      const result = formatToolInputTransformer({
        toolName: 'Write',
        toolInput: '{"content":"hello","file_path":"/src/index.ts"}',
      });

      expect(result).toStrictEqual({
        fields: [
          { key: 'file_path', value: '/src/index.ts', isLong: false },
          { key: 'content', value: 'hello', isLong: false },
        ],
      });
    });
  });

  describe('Grep tool', () => {
    it('VALID: {toolName: Grep, pattern and path fields} => returns pattern first then path', () => {
      formatToolInputTransformerProxy();

      const result = formatToolInputTransformer({
        toolName: 'Grep',
        toolInput: '{"path":"/src","pattern":"import.*from","type":"ts"}',
      });

      expect(result).toStrictEqual({
        fields: [
          { key: 'pattern', value: 'import.*from', isLong: false },
          { key: 'path', value: '/src', isLong: false },
          { key: 'type', value: 'ts', isLong: false },
        ],
      });
    });
  });

  describe('unknown tool', () => {
    it('VALID: {toolName: UnknownTool} => returns all fields in original order', () => {
      formatToolInputTransformerProxy();

      const result = formatToolInputTransformer({
        toolName: 'UnknownTool',
        toolInput: '{"alpha":"a","beta":"b"}',
      });

      expect(result).toStrictEqual({
        fields: [
          { key: 'alpha', value: 'a', isLong: false },
          { key: 'beta', value: 'b', isLong: false },
        ],
      });
    });
  });

  describe('long values', () => {
    it('VALID: {value exceeds 120 chars} => marks field as isLong true', () => {
      formatToolInputTransformerProxy();
      const longValue = 'x'.repeat(121);

      const result = formatToolInputTransformer({
        toolName: 'Bash',
        toolInput: JSON.stringify({ command: longValue }),
      });

      expect(result).toStrictEqual({
        fields: [{ key: 'command', value: longValue, isLong: true }],
      });
    });

    it('VALID: {value exactly 120 chars} => marks field as isLong false', () => {
      formatToolInputTransformerProxy();
      const exactValue = 'x'.repeat(120);

      const result = formatToolInputTransformer({
        toolName: 'Bash',
        toolInput: JSON.stringify({ command: exactValue }),
      });

      expect(result).toStrictEqual({
        fields: [{ key: 'command', value: exactValue, isLong: false }],
      });
    });
  });

  describe('non-string values', () => {
    it('VALID: {numeric value} => stringifies with JSON.stringify', () => {
      formatToolInputTransformerProxy();

      const result = formatToolInputTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"test","timeout":5000}',
      });

      expect(result).toStrictEqual({
        fields: [
          { key: 'command', value: 'test', isLong: false },
          { key: 'timeout', value: '5000', isLong: false },
        ],
      });
    });

    it('VALID: {boolean value} => stringifies with JSON.stringify', () => {
      formatToolInputTransformerProxy();

      const result = formatToolInputTransformer({
        toolName: 'Bash',
        toolInput: '{"command":"test","verbose":true}',
      });

      expect(result).toStrictEqual({
        fields: [
          { key: 'command', value: 'test', isLong: false },
          { key: 'verbose', value: 'true', isLong: false },
        ],
      });
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {empty string toolInput} => returns null', () => {
      formatToolInputTransformerProxy();

      const result = formatToolInputTransformer({
        toolName: 'Bash',
        toolInput: '',
      });

      expect(result).toBeNull();
    });

    it('INVALID_TOOL_INPUT: {invalid JSON} => returns null', () => {
      formatToolInputTransformerProxy();

      const result = formatToolInputTransformer({
        toolName: 'Bash',
        toolInput: 'not json',
      });

      expect(result).toBeNull();
    });

    it('INVALID_TOOL_INPUT: {JSON array} => returns null', () => {
      formatToolInputTransformerProxy();

      const result = formatToolInputTransformer({
        toolName: 'Bash',
        toolInput: '[1,2,3]',
      });

      expect(result).toBeNull();
    });

    it('INVALID_TOOL_INPUT: {JSON primitive} => returns null', () => {
      formatToolInputTransformerProxy();

      const result = formatToolInputTransformer({
        toolName: 'Bash',
        toolInput: '"just a string"',
      });

      expect(result).toBeNull();
    });
  });
});
