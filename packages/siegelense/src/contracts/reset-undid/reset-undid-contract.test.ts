import { resetUndidContract } from './reset-undid-contract';
import { ResetUndidStub } from './reset-undid.stub';

describe('resetUndidContract', () => {
  describe('valid shapes', () => {
    it('VALID: {files: 0, added: 0, modified: 0, removed: 0} => parses successfully', () => {
      const stub = ResetUndidStub();

      const result = resetUndidContract.parse(stub);

      expect(result).toStrictEqual({
        files: 0,
        added: 0,
        modified: 0,
        removed: 0,
      });
    });

    it('VALID: {files: 4, added: 2, modified: 1, removed: 1} => parses non-zero values', () => {
      const stub = ResetUndidStub({ files: 4, added: 2, modified: 1, removed: 1 });

      const result = resetUndidContract.parse(stub);

      expect(result).toStrictEqual({
        files: 4,
        added: 2,
        modified: 1,
        removed: 1,
      });
    });
  });

  describe('invalid shapes', () => {
    it('INVALID: {files: -1} => negative count throws validation error', () => {
      expect(() => {
        ResetUndidStub({ files: -1 as never });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID: {added: 1.5} => non-integer throws validation error', () => {
      expect(() => {
        ResetUndidStub({ added: 1.5 as never });
      }).toThrow(/Expected integer, received float/u);
    });
  });
});
