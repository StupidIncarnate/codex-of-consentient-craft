import { shortenedPathTextContract } from './shortened-path-text-contract';
import { ShortenedPathTextStub } from './shortened-path-text.stub';

describe('shortenedPathTextContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "web/…/tool-row-widget.tsx"} => parses an elided path', () => {
      const result = shortenedPathTextContract.parse('web/…/tool-row-widget.tsx');

      expect(result).toBe('web/…/tool-row-widget.tsx');
    });

    it('VALID: {value: "pattern: TODO"} => parses text carrying no path at all', () => {
      const result = shortenedPathTextContract.parse('pattern: TODO');

      expect(result).toBe('pattern: TODO');
    });

    it('EMPTY: {value: ""} => parses empty text for a tool with no summarisable input', () => {
      const result = shortenedPathTextContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => shortenedPathTextContract.parse(123)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => shortenedPathTextContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => shortenedPathTextContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates text with default value "web/…/tool-row-widget.tsx"', () => {
      const result = ShortenedPathTextStub();

      expect(result).toBe('web/…/tool-row-widget.tsx');
    });

    it('VALID: {value: "shared/…/chat-entry-contract.ts"} => creates text with custom value', () => {
      const result = ShortenedPathTextStub({ value: 'shared/…/chat-entry-contract.ts' });

      expect(result).toBe('shared/…/chat-entry-contract.ts');
    });
  });
});
