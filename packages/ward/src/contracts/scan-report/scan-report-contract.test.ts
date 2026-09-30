import { ScanReportStub } from './scan-report.stub';
import { ScanPackageResultStub } from '../scan-package-result/scan-package-result.stub';
import { scanReportContract } from './scan-report-contract';

describe('scanReportContract', () => {
  describe('valid input', () => {
    it('VALID: {rule, no packages} => returns the empty report', () => {
      const result = ScanReportStub({ rule: 'no-console' });

      expect(result).toStrictEqual({ rule: 'no-console', packages: [] });
    });

    it('VALID: {one package} => returns the nested package result', () => {
      const result = ScanReportStub({ packages: [ScanPackageResultStub()] });

      expect(result).toStrictEqual({
        rule: '@dungeonmaster/ban-workspace-export-mocks',
        packages: [{ name: '@dungeonmaster/example', violations: 0, batches: [] }],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {missing rule} => throws ZodError', () => {
      expect(() => scanReportContract.parse({ packages: [] })).toThrow(/expected string/iu);
    });
  });
});
