import { InstallCheckResultStub } from './install-check-result.stub';
import { installCheckResultContract } from './install-check-result-contract';

describe('installCheckResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = InstallCheckResultStub();

      expect(installCheckResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {valid: wrong type} => throws', () => {
      expect(() =>
        installCheckResultContract.parse({ ...InstallCheckResultStub(), valid: 'nope' }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
