import { signalCliReturnInputContract } from './signal-cli-return-input-contract';
import { SignalCliReturnInputStub } from './signal-cli-return-input.stub';

describe('signalCliReturnInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {screen: "list"} => parses successfully', () => {
      const input = SignalCliReturnInputStub({ screen: 'list' });

      const result = signalCliReturnInputContract.parse(input);

      expect(result).toStrictEqual({ screen: 'list' });
    });

    it('VALID: {screen: "menu"} => parses with menu screen', () => {
      const input = SignalCliReturnInputStub({ screen: 'menu' });

      const result = signalCliReturnInputContract.parse(input);

      expect(result).toStrictEqual({ screen: 'menu' });
    });

    it('VALID: {empty object} => defaults to list screen', () => {
      const result = signalCliReturnInputContract.parse({});

      expect(result).toStrictEqual({ screen: 'list' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_SCREEN: {screen: "invalid"} => throws validation error', () => {
      expect(() => {
        signalCliReturnInputContract.parse({ screen: 'invalid' });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
