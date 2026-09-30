import { BootLockAcquireResultStub } from './boot-lock-acquire-result.stub';
import { bootLockAcquireResultContract } from './boot-lock-acquire-result-contract';

describe('bootLockAcquireResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = BootLockAcquireResultStub();

      expect(bootLockAcquireResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {lock: wrong type} => throws', () => {
      expect(() =>
        bootLockAcquireResultContract.parse({ ...BootLockAcquireResultStub(), lock: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
