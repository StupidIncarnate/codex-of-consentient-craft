import { locatorStateContract } from './locator-state-contract';
import { LocatorStateStub } from './locator-state.stub';

describe('locatorStateContract', () => {
  describe('valid members', () => {
    it.each(locatorStateContract.options)('VALID: {value: %s} => parses to itself', (value) => {
      const locatorState = LocatorStateStub({ value });

      const result = locatorStateContract.parse(locatorState);

      expect(result).toBe(value);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "collapsed"} => an unlisted string throws validation error', () => {
      expect(() => {
        LocatorStateStub({ value: 'collapsed' as never });
      }).toThrow(/Invalid option/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "VISIBLE"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => {
        locatorStateContract.parse('VISIBLE');
      }).toThrow(/Invalid option/u);
    });
  });
});
