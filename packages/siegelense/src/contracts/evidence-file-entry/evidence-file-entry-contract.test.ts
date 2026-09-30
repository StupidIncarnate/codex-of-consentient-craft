import { evidenceFileEntryContract } from './evidence-file-entry-contract';
import { EvidenceFileEntryStub } from './evidence-file-entry.stub';

describe('evidenceFileEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {absolute path, bytes} => parses the entry unchanged', () => {
      const entry = EvidenceFileEntryStub({
        path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1/video/a1.webm',
        bytes: 860132,
      });

      const result = evidenceFileEntryContract.parse(entry);

      expect(result).toStrictEqual({
        path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1/video/a1.webm',
        bytes: 860132,
      });
    });

    it('EDGE: {bytes: 0} => an empty file still parses', () => {
      const result = evidenceFileEntryContract.parse(
        EvidenceFileEntryStub({ path: '/repo/inst_1/heartbeat.json', bytes: 0 }),
      );

      expect(result).toStrictEqual({ path: '/repo/inst_1/heartbeat.json', bytes: 0 });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {path: relative} => throws, because a relative path cannot be pasted into Read', () => {
      expect(() => evidenceFileEntryContract.parse({ path: 'run_1/step1.png', bytes: 10 })).toThrow(
        /absolute/iu,
      );
    });

    it('INVALID: {missing bytes} => throws Required', () => {
      expect(() => evidenceFileEntryContract.parse({ path: '/repo/inst_1/driver.log' })).toThrow(
        /expected number, received undefined/u,
      );
    });
  });
});
