import { bucketStartKeyContract } from './bucket-start-key-contract';
import { BucketStartKeyStub } from './bucket-start-key.stub';

describe('bucketStartKeyContract', () => {
  describe('valid keys', () => {
    it('VALID: {value: "1700000000000"} => parses successfully', () => {
      const key = BucketStartKeyStub({ value: '1700000000000' });

      const result = bucketStartKeyContract.parse(key);

      expect(result).toBe('1700000000000');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => bucketStartKeyContract.parse(123 as never)).toThrow(/expected string/u);
    });
  });
});
