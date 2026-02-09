import { toolInputToDisplayTransformer } from './tool-input-to-display-transformer';

describe('toolInputToDisplayTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {} => returns empty string', () => {
      const result = toolInputToDisplayTransformer({ input: {} });

      expect(result).toBe('');
    });
  });

  describe('single parameter', () => {
    it('VALID: {pattern: "*.ts"} => returns pattern="*.ts"', () => {
      const result = toolInputToDisplayTransformer({ input: { pattern: '*.ts' } });

      expect(result).toBe('pattern="*.ts"');
    });

    it('VALID: {file_path: "/path/to/file.ts"} => returns file_path="/path/to/file.ts"', () => {
      const result = toolInputToDisplayTransformer({ input: { file_path: '/path/to/file.ts' } });

      expect(result).toBe('file_path="/path/to/file.ts"');
    });
  });

  describe('value truncation', () => {
    it('VALID: {long value} => truncates with ellipsis at 200 chars', () => {
      const longValue = 'a'.repeat(250);
      const result = toolInputToDisplayTransformer({ input: { path: longValue } });

      // maxValueLength is 200, ellipsis is "...", so 197 chars + "..."
      expect(result).toBe(`path="${'a'.repeat(197)}..."`);
    });

    it('VALID: {value at max length} => does not truncate', () => {
      const exactValue = 'a'.repeat(200);
      const result = toolInputToDisplayTransformer({ input: { path: exactValue } });

      expect(result).toBe(`path="${exactValue}"`);
    });

    it('VALID: {value under max length} => does not truncate', () => {
      const shortValue = 'short';
      const result = toolInputToDisplayTransformer({ input: { path: shortValue } });

      expect(result).toBe('path="short"');
    });
  });

  describe('multiple parameters', () => {
    it('VALID: {two params} => returns both space-separated', () => {
      const result = toolInputToDisplayTransformer({
        input: { pattern: '*.ts', path: 'src/' },
      });

      expect(result).toBe('path="src/" pattern="*.ts"');
    });

    it('VALID: {three params} => returns all three', () => {
      const result = toolInputToDisplayTransformer({
        input: { pattern: '*.ts', path: 'src/', query: 'test' },
      });

      expect(result).toBe('path="src/" pattern="*.ts" query="test"');
    });

    it('VALID: {four params} => returns first three with ellipsis', () => {
      const result = toolInputToDisplayTransformer({
        input: { pattern: '*.ts', path: 'src/', query: 'test', extra: 'value' },
      });

      expect(result).toBe('path="src/" pattern="*.ts" query="test" ...');
    });

    it('VALID: {five params} => returns first three with ellipsis', () => {
      const result = toolInputToDisplayTransformer({
        input: { a: '1', b: '2', c: '3', d: '4', e: '5' },
      });

      expect(result).toBe('a="1" b="2" c="3" ...');
    });
  });

  describe('priority key ordering', () => {
    it('VALID: {file_path with other keys} => file_path comes first', () => {
      const result = toolInputToDisplayTransformer({
        input: { zebra: 'last', file_path: '/test.ts', apple: 'middle' },
      });

      expect(result).toBe('file_path="/test.ts" apple="middle" zebra="last"');
    });

    it('VALID: {multiple priority keys} => ordered by priority', () => {
      const result = toolInputToDisplayTransformer({
        input: { pattern: '*.ts', file_path: '/test.ts', path: 'src/' },
      });

      // Priority order: file_path, path, pattern
      expect(result).toBe('file_path="/test.ts" path="src/" pattern="*.ts"');
    });

    it('VALID: {non-priority keys only} => sorted alphabetically', () => {
      const result = toolInputToDisplayTransformer({
        input: { zebra: 'z', apple: 'a', mango: 'm' },
      });

      expect(result).toBe('apple="a" mango="m" zebra="z"');
    });
  });

  describe('value types', () => {
    it('VALID: {number value} => converts to string', () => {
      const result = toolInputToDisplayTransformer({ input: { count: 42 } });

      expect(result).toBe('count="42"');
    });

    it('VALID: {boolean true} => converts to "true"', () => {
      const result = toolInputToDisplayTransformer({ input: { enabled: true } });

      expect(result).toBe('enabled="true"');
    });

    it('VALID: {boolean false} => converts to "false"', () => {
      const result = toolInputToDisplayTransformer({ input: { enabled: false } });

      expect(result).toBe('enabled="false"');
    });

    it('VALID: {null value} => converts to "null"', () => {
      const result = toolInputToDisplayTransformer({ input: { value: null } });

      expect(result).toBe('value="null"');
    });

    it('VALID: {undefined value} => converts to "undefined"', () => {
      const result = toolInputToDisplayTransformer({ input: { value: undefined } });

      expect(result).toBe('value="undefined"');
    });

    it('VALID: {array value} => shows item count', () => {
      const result = toolInputToDisplayTransformer({ input: { items: [1, 2, 3] } });

      expect(result).toBe('items="[3 items]"');
    });

    it('VALID: {empty array} => shows zero items', () => {
      const result = toolInputToDisplayTransformer({ input: { items: [] } });

      expect(result).toBe('items="[0 items]"');
    });

    it('VALID: {object value} => shows {...}', () => {
      const result = toolInputToDisplayTransformer({ input: { config: { nested: true } } });

      expect(result).toBe('config="{...}"');
    });
  });

  describe('special characters in values', () => {
    it('VALID: {value with quotes} => preserves quotes', () => {
      const result = toolInputToDisplayTransformer({ input: { text: 'say "hello"' } });

      expect(result).toBe('text="say "hello""');
    });

    it('VALID: {value with newlines} => preserves newlines', () => {
      const result = toolInputToDisplayTransformer({ input: { text: 'line1\nline2' } });

      expect(result).toBe('text="line1\nline2"');
    });

    it('VALID: {value with special chars} => preserves special chars', () => {
      const result = toolInputToDisplayTransformer({ input: { pattern: '**/*.{ts,tsx}' } });

      expect(result).toBe('pattern="**/*.{ts,tsx}"');
    });
  });
});
