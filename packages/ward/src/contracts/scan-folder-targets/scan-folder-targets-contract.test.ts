import { ScanFolderTargetsStub } from './scan-folder-targets.stub';
import { scanFolderTargetsContract } from './scan-folder-targets-contract';

describe('scanFolderTargetsContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns an in-scope whole-package answer', () => {
      const result = ScanFolderTargetsStub();

      expect(result).toStrictEqual({ inScope: true, targets: [] });
    });

    it('VALID: {out of scope} => returns the flag off', () => {
      const result = ScanFolderTargetsStub({ inScope: false });

      expect(result).toStrictEqual({ inScope: false, targets: [] });
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {target: empty string} => throws ZodError', () => {
      expect(() => scanFolderTargetsContract.parse({ inScope: true, targets: [''] })).toThrow(
        /too small/iu,
      );
    });
  });
});
