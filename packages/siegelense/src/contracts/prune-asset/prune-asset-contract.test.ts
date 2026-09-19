import { pruneAssetContract } from './prune-asset-contract';
import { PruneAssetStub } from './prune-asset.stub';

describe('pruneAssetContract', () => {
  describe('valid assets', () => {
    it('VALID: {a shot} => parses with its path, class, size and last write', () => {
      const asset = PruneAssetStub();

      const result = pruneAssetContract.parse(asset);

      expect(result).toStrictEqual({
        path: '/tmp/instances/inst_9b2c/runs/run_1/step1.png',
        kind: 'shot',
        sizeBytes: 2048,
        modifiedAtMs: 1_700_000_000_000,
      });
    });

    it('EDGE: {sizeBytes: 0} => an empty buffer file is still an asset, and contributes nothing to freedBytes', () => {
      const asset = PruneAssetStub({ sizeBytes: 0 as never });

      const result = pruneAssetContract.parse(asset);

      expect(result.sizeBytes).toBe(0);
    });
  });

  describe('invalid assets', () => {
    it('INVALID: {sizeBytes: -1} => a negative size throws, so freedBytes can never be talked downward', () => {
      expect(() => {
        PruneAssetStub({ sizeBytes: -1 as never });
      }).toThrow(/greater than or equal to 0/u);
    });

    it('INVALID: {path: "runs/run_1/step1.png"} => a relative path throws', () => {
      expect(() => {
        PruneAssetStub({ path: 'runs/run_1/step1.png' as never });
      }).toThrow(/Path must be absolute/u);
    });
  });
});
