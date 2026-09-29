import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { readFirstExistingCandidateLayerBroker } from './read-first-existing-candidate-layer-broker';
import { readFirstExistingCandidateLayerBrokerProxy } from './read-first-existing-candidate-layer-broker.proxy';

describe('readFirstExistingCandidateLayerBroker', () => {
  describe('valid inputs', () => {
    it('VALID: {first candidate exists} => returns it without trying the rest', async () => {
      const proxy = readFirstExistingCandidateLayerBrokerProxy();
      const first = FilePathStub({ value: '/repo/x.ts' });
      proxy.setupFile({ filePath: first, content: 'export const x = 1;' });

      const result = await readFirstExistingCandidateLayerBroker({ candidates: [first] });

      expect(result).toStrictEqual({ filePath: '/repo/x.ts', content: 'export const x = 1;' });
    });

    it('VALID: {first candidate absent, second exists} => returns the second', async () => {
      const proxy = readFirstExistingCandidateLayerBrokerProxy();
      const first = FilePathStub({ value: '/repo/x.ts' });
      const second = FilePathStub({ value: '/repo/x.tsx' });
      proxy.setupMissing({ filePath: first });
      proxy.setupFile({ filePath: second, content: 'export const x = 1;' });

      const result = await readFirstExistingCandidateLayerBroker({ candidates: [first, second] });

      expect(result).toStrictEqual({ filePath: '/repo/x.tsx', content: 'export const x = 1;' });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {every candidate is absent} => returns undefined', async () => {
      const proxy = readFirstExistingCandidateLayerBrokerProxy();
      const first = FilePathStub({ value: '/repo/x.ts' });
      proxy.setupMissing({ filePath: first });

      const result = await readFirstExistingCandidateLayerBroker({ candidates: [first] });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {no candidates at all} => returns undefined', async () => {
      readFirstExistingCandidateLayerBrokerProxy();

      const result = await readFirstExistingCandidateLayerBroker({ candidates: [] });

      expect(result).toBe(undefined);
    });
  });

  describe('error cases', () => {
    it('ERROR: {a candidate read fails for a reason other than a missing file} => rejects with the real error', async () => {
      const proxy = readFirstExistingCandidateLayerBrokerProxy();
      const first = FilePathStub({ value: '/repo/x.ts' });
      proxy.setupPermissionDenied({ filePath: first });

      await expect(readFirstExistingCandidateLayerBroker({ candidates: [first] })).rejects.toThrow(
        /EACCES/u,
      );
    });
  });
});
