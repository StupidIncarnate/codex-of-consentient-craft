import { keyStatics } from '../../statics/key/key-statics';
import { elementFlagContract } from './element-flag-contract';
import { ElementFlagStub } from './element-flag.stub';

describe('elementFlagContract', () => {
  describe('valid members', () => {
    it.each(keyStatics.flags.all)('VALID: {value: %s} => parses to itself', (value) => {
      const flag = ElementFlagStub({ value });

      const result = elementFlagContract.parse(flag);

      expect(result).toBe(value);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "className"} => throws, because a class is a mechanism and never a condition', () => {
      expect(() => elementFlagContract.parse('className')).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "has-listener"} => throws, because nothing infers a dead control from a listener', () => {
      expect(() => elementFlagContract.parse('has-listener')).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: ""} => throws', () => {
      expect(() => elementFlagContract.parse('')).toThrow(/Invalid enum value/u);
    });
  });
});
