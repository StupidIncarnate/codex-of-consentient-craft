import { streamSignalKindContract } from './stream-signal-kind-contract';
import { StreamSignalKindStub } from './stream-signal-kind.stub';

describe('streamSignalKindContract', () => {
  describe('valid kinds', () => {
    it('VALID: complete => parses successfully', () => {
      const kind = StreamSignalKindStub({ value: 'complete' });

      const result = streamSignalKindContract.parse(kind);

      expect(result).toBe('complete');
    });

    it('VALID: failed => parses successfully', () => {
      const kind = StreamSignalKindStub({ value: 'failed' });

      const result = streamSignalKindContract.parse(kind);

      expect(result).toBe('failed');
    });

    it('VALID: failed-replan => parses successfully', () => {
      const kind = StreamSignalKindStub({ value: 'failed-replan' });

      const result = streamSignalKindContract.parse(kind);

      expect(result).toBe('failed-replan');
    });

    it('VALID: {default} => defaults to complete', () => {
      const kind = StreamSignalKindStub();

      expect(kind).toBe('complete');
    });
  });

  describe('invalid kinds', () => {
    it('INVALID: unknown signal kind => throws validation error', () => {
      expect(() => {
        streamSignalKindContract.parse('bogus');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
