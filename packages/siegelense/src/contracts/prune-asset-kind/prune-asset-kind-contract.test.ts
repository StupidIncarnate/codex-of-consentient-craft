import { pruneAssetKindContract } from './prune-asset-kind-contract';
import { PruneAssetKindStub } from './prune-asset-kind.stub';

describe('pruneAssetKindContract', () => {
  describe('valid members', () => {
    it.each(pruneAssetKindContract.unwrap().options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const kind = PruneAssetKindStub({ value });

        const result = pruneAssetKindContract.parse(kind);

        expect(result).toBe(value);
      },
    );

    it('VALID: {no argument} => defaults to shot', () => {
      expect(PruneAssetKindStub()).toBe('shot');
    });
  });

  describe('the closed set', () => {
    it('VALID: {options} => video first, because it is the one a caller reclaiming space reaches for', () => {
      expect(pruneAssetKindContract.unwrap().options).toStrictEqual([
        'video',
        'shot',
        'transcript',
        'log',
      ]);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "screenshot"} => an unlisted string throws validation error', () => {
      expect(() => {
        PruneAssetKindStub({ value: 'screenshot' as never });
      }).toThrow(/Invalid enum value/u);
    });

    it('EDGE: {value: "VIDEO"} => an uppercase variant throws validation error', () => {
      expect(() => {
        pruneAssetKindContract.parse('VIDEO');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
