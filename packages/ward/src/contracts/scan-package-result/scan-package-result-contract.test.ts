import { ScanPackageResultStub } from './scan-package-result.stub';
import { ScanViolationStub } from '../scan-violation/scan-violation.stub';
import { scanPackageResultContract } from './scan-package-result-contract';

describe('scanPackageResultContract', () => {
  describe('valid input', () => {
    it('VALID: {no violations} => returns an empty batch list', () => {
      const result = ScanPackageResultStub();

      expect(result).toStrictEqual({ name: '@dungeonmaster/example', violations: 0, batches: [] });
    });

    it('VALID: {one batch of one violation} => returns the nested batch', () => {
      const violation = ScanViolationStub({ file: 'a.ts', line: 2, message: 'm' });

      const result = ScanPackageResultStub({ violations: 1, batches: [[violation]] });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/example',
        violations: 1,
        batches: [[{ file: 'a.ts', line: 2, message: 'm' }]],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {an empty batch} => throws ZodError', () => {
      expect(() =>
        scanPackageResultContract.parse({ name: 'p', violations: 0, batches: [[]] }),
      ).toThrow(/too small/iu);
    });
  });
});
