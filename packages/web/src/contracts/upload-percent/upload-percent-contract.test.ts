import { uploadPercentContract } from './upload-percent-contract';
import { UploadPercentStub } from './upload-percent.stub';

describe('uploadPercentContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 42} => parses an in-flight percent', () => {
      const result = uploadPercentContract.parse(42);

      expect(result).toBe(42);
    });

    it('EDGE: {value: 0} => parses the minimum percent', () => {
      const result = uploadPercentContract.parse(0);

      expect(result).toBe(0);
    });

    it('EDGE: {value: 100} => parses the maximum percent', () => {
      const result = uploadPercentContract.parse(100);

      expect(result).toBe(100);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws for negative number', () => {
      expect(() => uploadPercentContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 101} => throws for over max', () => {
      expect(() => uploadPercentContract.parse(101)).toThrow(
        /Number must be less than or equal to 100/u,
      );
    });

    it('INVALID: {value: 50.5} => throws for non-integer', () => {
      expect(() => uploadPercentContract.parse(50.5)).toThrow(/Expected integer/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid upload percent with default value 42', () => {
      const result = UploadPercentStub();

      expect(result).toBe(42);
    });

    it('VALID: {value: 75} => creates upload percent with custom value', () => {
      const result = UploadPercentStub({ value: 75 });

      expect(result).toBe(75);
    });
  });
});
