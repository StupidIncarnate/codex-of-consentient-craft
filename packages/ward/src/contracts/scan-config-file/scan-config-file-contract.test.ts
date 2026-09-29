import { ScanConfigFileStub } from './scan-config-file.stub';
import { scanConfigFileContract } from './scan-config-file-contract';

describe('scanConfigFileContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns the directory and the config path inside it', () => {
      const result = ScanConfigFileStub();

      expect(result).toStrictEqual({
        directory: '/tmp/ward-scan-abc123',
        path: '/tmp/ward-scan-abc123/eslint.scan.config.cjs',
      });
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {path: empty string} => throws ZodError', () => {
      expect(() => scanConfigFileContract.parse({ directory: '/tmp/x', path: '' })).toThrow(
        /too small/iu,
      );
    });
  });
});
