import { platformCrossingDisplayTextContract } from './platform-crossing-display-text-contract';
import { PlatformCrossingDisplayTextStub } from './platform-crossing-display-text.stub';

describe('platformCrossingDisplayTextContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "platform-crossing: PASS"} => parses successfully', () => {
      const result = platformCrossingDisplayTextContract.parse(PlatformCrossingDisplayTextStub());

      expect(result).toBe('platform-crossing: PASS');
    });
  });

  describe('empty input', () => {
    it('EMPTY: {value: ""} => parses successfully', () => {
      const result = platformCrossingDisplayTextContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates display text', () => {
      const result = PlatformCrossingDisplayTextStub();

      expect(result).toBe('platform-crossing: PASS');
    });
  });
});
