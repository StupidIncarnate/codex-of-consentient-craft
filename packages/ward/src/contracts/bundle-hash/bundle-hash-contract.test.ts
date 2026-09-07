import { bundleHashContract } from './bundle-hash-contract';
import { BundleHashStub } from './bundle-hash.stub';
import { bundleStatics } from '../../statics/bundle/bundle-statics';

const VALID = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('bundleHashContract', () => {
  describe('valid inputs', () => {
    it('VALID: {64 lowercase hex characters} => parses successfully', () => {
      expect(bundleHashContract.parse(VALID)).toBe(VALID);
    });

    it('VALID: {all digits} => parses successfully', () => {
      const digits = '0'.repeat(bundleStatics.hashLength);

      expect(bundleHashContract.parse(digits)).toBe(digits);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {63 hex characters} => throws a length error', () => {
      expect(() => bundleHashContract.parse(VALID.slice(1))).toThrow(/at least 64|exactly 64|64/u);
    });

    it('INVALID: {uppercase hex} => throws a format error', () => {
      expect(() => bundleHashContract.parse(VALID.toUpperCase())).toThrow(
        /Invalid BundleHash format/u,
      );
    });

    it('INVALID: {64 non-hex characters} => throws a format error', () => {
      expect(() => bundleHashContract.parse('z'.repeat(bundleStatics.hashLength))).toThrow(
        /Invalid BundleHash format/u,
      );
    });

    it('EMPTY: {empty string} => throws a length error', () => {
      expect(() => bundleHashContract.parse('')).toThrow(/64/u);
    });

    it('EMPTY: {undefined} => throws a validation error', () => {
      expect(() => bundleHashContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => returns the empty-input sha-256', () => {
      expect(BundleHashStub()).toBe(VALID);
    });

    it('VALID: {custom value} => returns that value', () => {
      const custom = 'a'.repeat(bundleStatics.hashLength);

      expect(BundleHashStub({ value: custom })).toBe(custom);
    });
  });
});
