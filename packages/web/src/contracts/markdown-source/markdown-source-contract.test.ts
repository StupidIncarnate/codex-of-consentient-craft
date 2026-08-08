import { markdownSourceContract } from './markdown-source-contract';
import { MarkdownSourceStub } from './markdown-source.stub';

describe('markdownSourceContract', () => {
  describe('valid inputs', () => {
    it('VALID: {multi-line document} => parses the document whole', () => {
      const result = markdownSourceContract.parse('## Gate 5\n\nAll claims verified.');

      expect(result).toBe('## Gate 5\n\nAll claims verified.');
    });

    it('VALID: {prose with no markdown} => parses unmarked text', () => {
      const result = markdownSourceContract.parse('Gate 4 complete.');

      expect(result).toBe('Gate 4 complete.');
    });

    it('EMPTY: {value: ""} => parses an empty message', () => {
      const result = markdownSourceContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => markdownSourceContract.parse(123)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => markdownSourceContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => markdownSourceContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a document with a heading and a paragraph', () => {
      const result = MarkdownSourceStub();

      expect(result).toBe('## Gate 5\n\nAll claims verified.');
    });

    it('VALID: {value: "- one"} => creates a document with custom value', () => {
      const result = MarkdownSourceStub({ value: '- one' });

      expect(result).toBe('- one');
    });
  });
});
