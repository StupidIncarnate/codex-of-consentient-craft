import { processSignalContract } from './process-signal-contract';
import { ProcessSignalStub } from './process-signal.stub';

describe('processSignalContract', () => {
  describe('valid signals', () => {
    it('VALID: {value: "SIGKILL"} => parses to the same string', () => {
      expect(String(ProcessSignalStub({ value: 'SIGKILL' }))).toBe('SIGKILL');
    });

    it('VALID: {value: "SIGABRT"} => parses to the same string', () => {
      expect(String(ProcessSignalStub({ value: 'SIGABRT' }))).toBe('SIGABRT');
    });

    it('VALID: {no argument} => defaults to SIGKILL', () => {
      expect(String(ProcessSignalStub())).toBe('SIGKILL');
    });

    it('VALID: {value: a signal this repo never reads} => still parses, because the set is the platform one', () => {
      expect(String(ProcessSignalStub({ value: 'SIGWINCH' }))).toBe('SIGWINCH');
    });
  });

  describe('invalid signals', () => {
    it('EMPTY: {value: ""} => throws validation error', () => {
      expect(() => processSignalContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID: {value: 9} => throws validation error', () => {
      expect(() => processSignalContract.parse(9)).toThrow(/Expected string, received number/u);
    });
  });
});
