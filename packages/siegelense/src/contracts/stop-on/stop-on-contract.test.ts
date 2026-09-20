import { stopOnContract } from './stop-on-contract';
import { StopOnStub } from './stop-on.stub';

describe('stopOnContract', () => {
  describe('valid members', () => {
    it.each(stopOnContract.unwrap().options)('VALID: {value: %s} => parses to itself', (value) => {
      const stopOn = StopOnStub({ value });

      const result = stopOnContract.parse(stopOn);

      expect(result).toBe(value);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "always"} => an unlisted string throws validation error', () => {
      expect(() => {
        StopOnStub({ value: 'always' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "ERROR"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => {
        stopOnContract.parse('ERROR');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
