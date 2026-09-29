import { ScanViolationStub } from './scan-violation.stub';
import { scanViolationContract } from './scan-violation-contract';

describe('scanViolationContract', () => {
  describe('valid input', () => {
    it('VALID: {file, line, message} => returns the same object', () => {
      const result = ScanViolationStub({ file: 'packages/a/src/x.ts', line: 12, message: 'No.' });

      expect(result).toStrictEqual({ file: 'packages/a/src/x.ts', line: 12, message: 'No.' });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {line: -1} => throws ZodError', () => {
      expect(() => scanViolationContract.parse({ file: 'a.ts', line: -1, message: 'm' })).toThrow(
        /too small/iu,
      );
    });

    it('EMPTY: {file: empty string} => throws ZodError', () => {
      expect(() => scanViolationContract.parse({ file: '', line: 1, message: 'm' })).toThrow(
        /too small/iu,
      );
    });
  });
});
