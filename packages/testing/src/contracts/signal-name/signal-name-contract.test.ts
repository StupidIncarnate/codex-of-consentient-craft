import { signalNameContract } from './signal-name-contract';
import { SignalNameStub } from './signal-name.stub';

describe('signalNameContract', () => {
  describe('valid signal names', () => {
    it('VALID: {value: "SIGTERM"} => parses terminate signal', () => {
      const signal = SignalNameStub({ value: 'SIGTERM' });

      const result = signalNameContract.parse(signal);

      expect(result).toBe('SIGTERM');
    });

    it('VALID: {value: "SIGKILL"} => parses kill signal', () => {
      const signal = SignalNameStub({ value: 'SIGKILL' });

      const result = signalNameContract.parse(signal);

      expect(result).toBe('SIGKILL');
    });

    it('VALID: {value: "SIGHUP"} => parses hangup signal', () => {
      const signal = SignalNameStub({ value: 'SIGHUP' });

      const result = signalNameContract.parse(signal);

      expect(result).toBe('SIGHUP');
    });
  });

  describe('invalid signal names', () => {
    it('INVALID_SIGNAL_NAME: {value: 9} => throws validation error for number', () => {
      expect(() => {
        return signalNameContract.parse(9 as never);
      }).toThrow(/string/iu);
    });
  });
});
