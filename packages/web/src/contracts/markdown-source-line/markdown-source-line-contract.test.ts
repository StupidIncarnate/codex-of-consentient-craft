import { markdownSourceLineContract } from './markdown-source-line-contract';
import { MarkdownSourceLineStub } from './markdown-source-line.stub';

describe('markdownSourceLineContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "Gate 4 complete."} => parses a prose line', () => {
      const result = markdownSourceLineContract.parse('Gate 4 complete.');

      expect(result).toBe('Gate 4 complete.');
    });

    it('VALID: {value: "  const x = 1;"} => parses a fenced line with its indentation', () => {
      const result = markdownSourceLineContract.parse('  const x = 1;');

      expect(result).toBe('  const x = 1;');
    });

    it('EMPTY: {value: ""} => parses an unlabelled fence language', () => {
      const result = markdownSourceLineContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => markdownSourceLineContract.parse(123)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => markdownSourceLineContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => markdownSourceLineContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a line with default value "Gate 4 complete."', () => {
      const result = MarkdownSourceLineStub();

      expect(result).toBe('Gate 4 complete.');
    });

    it('VALID: {value: "typescript"} => creates a line with custom value', () => {
      const result = MarkdownSourceLineStub({ value: 'typescript' });

      expect(result).toBe('typescript');
    });
  });
});
