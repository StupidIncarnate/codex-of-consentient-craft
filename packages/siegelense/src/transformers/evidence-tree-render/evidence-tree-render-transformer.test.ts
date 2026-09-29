import { InstanceEvidenceListingStub } from '../../contracts/instance-evidence-listing/instance-evidence-listing.stub';
import { evidenceTreeRenderTransformer } from './evidence-tree-render-transformer';

const DIR = '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_e67b';

describe('evidenceTreeRenderTransformer', () => {
  describe('a populated listing', () => {
    it('VALID: {top-level logs, nested run shots, a video} => one line per directory and per file, nested two spaces per level, relative to the evidence dir', () => {
      const result = evidenceTreeRenderTransformer({
        listing: InstanceEvidenceListingStub({
          dir: { path: DIR, linkPresent: true },
          files: [
            { path: `${DIR}/api-server.log`, bytes: 1200 },
            { path: `${DIR}/heartbeat.json`, bytes: 90 },
            { path: `${DIR}/runs/run_1/step1.png`, bytes: 50000 },
            { path: `${DIR}/runs/run_1/step2.png`, bytes: 51000 },
            { path: `${DIR}/runs/run_1.json`, bytes: 5000 },
            { path: `${DIR}/runs/run_1.jsonl`, bytes: 4000 },
            { path: `${DIR}/runs/run_2/step1.png`, bytes: 52000 },
            { path: `${DIR}/video/703547507e7caf9bcbc8328daae3e4d1.webm`, bytes: 860132 },
            { path: `${DIR}/web-server.log`, bytes: 300 },
          ],
        }),
      });

      expect(result).toStrictEqual([
        'api-server.log (1200 bytes)',
        'heartbeat.json (90 bytes)',
        'runs/',
        '  run_1/',
        '    step1.png (50000 bytes)',
        '    step2.png (51000 bytes)',
        '  run_1.json (5000 bytes)',
        '  run_1.jsonl (4000 bytes)',
        '  run_2/',
        '    step1.png (52000 bytes)',
        'video/',
        '  703547507e7caf9bcbc8328daae3e4d1.webm (860132 bytes)',
        'web-server.log (300 bytes)',
      ]);
    });

    it('EDGE: {first file already two directories deep} => both directory lines print before it', () => {
      const result = evidenceTreeRenderTransformer({
        listing: InstanceEvidenceListingStub({
          dir: { path: DIR, linkPresent: true },
          files: [{ path: `${DIR}/runs/run_1/step1.png`, bytes: 7 }],
        }),
      });

      expect(result).toStrictEqual(['runs/', '  run_1/', '    step1.png (7 bytes)']);
    });

    it('EDGE: {a file path outside the evidence dir} => printed whole rather than dropped', () => {
      const result = evidenceTreeRenderTransformer({
        listing: InstanceEvidenceListingStub({
          dir: { path: DIR, linkPresent: true },
          files: [{ path: '/elsewhere/driver.log', bytes: 3 }],
        }),
      });

      expect(result).toStrictEqual(['/', '  elsewhere/', '    driver.log (3 bytes)']);
    });
  });

  describe('an empty listing', () => {
    it('EMPTY: {files: []} => returns []', () => {
      const result = evidenceTreeRenderTransformer({
        listing: InstanceEvidenceListingStub({ dir: { path: DIR, linkPresent: true }, files: [] }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
