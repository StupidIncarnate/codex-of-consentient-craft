import { streamSignalKindContract } from './stream-signal-kind-contract';
import { StreamSignalKindStub } from './stream-signal-kind.stub';

describe('streamSignalKindContract', () => {
  describe('valid kinds', () => {
    it('VALID: complete => parses successfully', () => {
      const kind = StreamSignalKindStub({ value: 'complete' });

      const result = streamSignalKindContract.parse(kind);

      expect(result).toBe('complete');
    });

    it('VALID: {default} => defaults to complete', () => {
      const kind = StreamSignalKindStub();

      expect(kind).toBe('complete');
    });
  });

  describe('invalid kinds', () => {
    it('INVALID: failed => throws validation error (there is no failure signal)', () => {
      expect(() => {
        streamSignalKindContract.parse('failed');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: failed-replan => throws validation error (there is no failure signal)', () => {
      expect(() => {
        streamSignalKindContract.parse('failed-replan');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: unknown signal kind => throws validation error', () => {
      expect(() => {
        streamSignalKindContract.parse('bogus');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
