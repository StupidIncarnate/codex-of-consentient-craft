import { stripAnsiCodesTransformer } from './strip-ansi-codes-transformer';

describe('stripAnsiCodesTransformer', () => {
  describe('ANSI removal', () => {
    it('VALID: {text with color codes} => returns text without ANSI sequences', () => {
      const esc = String.fromCharCode(27);
      const text = `${esc}[31mError${esc}[0m`;

      const result = stripAnsiCodesTransformer({ text });

      expect(result).toBe('Error');
    });

    it('VALID: {text with multiple ANSI sequences} => strips all sequences', () => {
      const esc = String.fromCharCode(27);
      const text = `${esc}[96msrc/file.ts${esc}[0m:${esc}[93m33${esc}[0m - ${esc}[91merror${esc}[0m TS2552`;

      const result = stripAnsiCodesTransformer({ text });

      expect(result).toBe('src/file.ts:33 - error TS2552');
    });

    it('VALID: {text without ANSI codes} => returns unchanged', () => {
      const text = 'plain text with no escapes';

      const result = stripAnsiCodesTransformer({ text });

      expect(result).toBe('plain text with no escapes');
    });

    it('VALID: {empty text} => returns empty', () => {
      const text = '';

      const result = stripAnsiCodesTransformer({ text });

      expect(result).toBe('');
    });

    it('VALID: {text with cursor movement sequences} => strips [1A and [2K sequences', () => {
      const esc = String.fromCharCode(27);
      const text = `${esc}[1ALine cleared${esc}[2K`;

      const result = stripAnsiCodesTransformer({ text });

      expect(result).toBe('Line cleared');
    });
  });
});
