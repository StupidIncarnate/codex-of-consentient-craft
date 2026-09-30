import { ScanConfigStub } from './scan-config.stub';
import { scanConfigContract } from './scan-config-contract';

describe('scanConfigContract', () => {
  describe('valid input', () => {
    it('VALID: {defaults} => returns the default rule with no paths', () => {
      const result = ScanConfigStub();

      expect(result).toStrictEqual({
        rule: '@dungeonmaster/ban-workspace-export-mocks',
        paths: [],
      });
    });

    it('VALID: {paths} => returns the paths beside the rule', () => {
      const result = ScanConfigStub({ paths: ['packages/ward'] });

      expect(result).toStrictEqual({
        rule: '@dungeonmaster/ban-workspace-export-mocks',
        paths: ['packages/ward'],
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {rule: empty} => throws ZodError', () => {
      expect(() => scanConfigContract.parse({ rule: '', paths: [] })).toThrow(/too small/iu);
    });
  });
});
