import { bufferEntryContract } from './buffer-entry-contract';
import { BufferEntryStub } from './buffer-entry.stub';

describe('bufferEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {runId: "run_2", step: 4} => parses a run-attributed entry', () => {
      const entry = BufferEntryStub({
        runId: 'run_2',
        step: 4,
        atMs: 1_700_000_000_000,
        text: '{"status":200}',
      });

      const result = bufferEntryContract.parse(entry);

      expect(result).toStrictEqual({
        runId: 'run_2',
        step: 4,
        atMs: 1_700_000_000_000,
        text: '{"status":200}',
      });
    });

    it('VALID: {runId: null, step: null} => parses an entry that arrived between two runs', () => {
      const entry = BufferEntryStub({
        runId: null,
        step: null,
        atMs: 1_700_000_020_000,
        text: '{"status":204}',
      });

      const result = bufferEntryContract.parse(entry);

      expect(result).toStrictEqual({
        runId: null,
        step: null,
        atMs: 1_700_000_020_000,
        text: '{"status":204}',
      });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {missing atMs} => throws Required', () => {
      expect(() =>
        bufferEntryContract.parse({ runId: null, step: null, text: '{"status":204}' }),
      ).toThrow(/Required/u);
    });
  });
});
