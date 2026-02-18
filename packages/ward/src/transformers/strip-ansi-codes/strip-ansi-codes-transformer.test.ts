import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';
import { stripAnsiCodesTransformer } from './strip-ansi-codes-transformer';

describe('stripAnsiCodesTransformer', () => {
  describe('ANSI removal', () => {
    it('VALID: {text with color codes} => returns text without ANSI sequences', () => {
      const esc = String.fromCharCode(27);
      const text = ErrorMessageStub({ value: `${esc}[31mError${esc}[0m` });

      const result = stripAnsiCodesTransformer({ text });

      expect(result).toBe(ErrorMessageStub({ value: 'Error' }));
    });

    it('VALID: {text with multiple ANSI sequences} => strips all sequences', () => {
      const esc = String.fromCharCode(27);
      const text = ErrorMessageStub({
        value: `${esc}[96msrc/file.ts${esc}[0m:${esc}[93m33${esc}[0m - ${esc}[91merror${esc}[0m TS2552`,
      });

      const result = stripAnsiCodesTransformer({ text });

      expect(result).toBe(ErrorMessageStub({ value: 'src/file.ts:33 - error TS2552' }));
    });

    it('VALID: {text without ANSI codes} => returns unchanged', () => {
      const text = ErrorMessageStub({ value: 'plain text with no escapes' });

      const result = stripAnsiCodesTransformer({ text });

      expect(result).toBe(ErrorMessageStub({ value: 'plain text with no escapes' }));
    });

    it('VALID: {empty text} => returns empty', () => {
      const text = ErrorMessageStub({ value: '' });

      const result = stripAnsiCodesTransformer({ text });

      expect(result).toBe(ErrorMessageStub({ value: '' }));
    });
  });
});
