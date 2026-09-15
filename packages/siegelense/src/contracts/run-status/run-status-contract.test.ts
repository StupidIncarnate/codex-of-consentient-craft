import { runStatusContract } from './run-status-contract';
import { RunStatusStub } from './run-status.stub';

describe('runStatusContract', () => {
  describe('valid members', () => {
    it.each(runStatusContract.unwrap().options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const runStatus = RunStatusStub({ value });

        const result = runStatusContract.parse(runStatus);

        expect(result).toBe(value);
      },
    );
  });

  describe('invalid members', () => {
    it('INVALID: {value: "running"} => an unlisted string throws validation error', () => {
      expect(() => {
        RunStatusStub({ value: 'running' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "DONE"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => {
        runStatusContract.parse('DONE');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
