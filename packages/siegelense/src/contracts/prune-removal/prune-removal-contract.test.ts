import { pruneRemovalContract } from './prune-removal-contract';
import { PruneRemovalStub } from './prune-removal.stub';

describe('pruneRemovalContract', () => {
  describe('valid removals', () => {
    it('VALID: {a whole tree taken} => parses with both units and the tombstone flag set', () => {
      const removal = PruneRemovalStub();

      const result = pruneRemovalContract.parse(removal);

      expect(result).toStrictEqual({
        id: 'inst_9b2c',
        kind: null,
        freedBytes: 4_299_161_600,
        freedMB: 4100,
        tombstoned: true,
      });
    });

    it('VALID: {kind: "video", tombstoned: false} => one class taken leaves the row untombstoned, so results keeps answering off the rest', () => {
      const removal = PruneRemovalStub({ kind: 'video' as never, tombstoned: false });

      const result = pruneRemovalContract.parse(removal);

      expect(result).toStrictEqual({
        id: 'inst_9b2c',
        kind: 'video',
        freedBytes: 4_299_161_600,
        freedMB: 4100,
        tombstoned: false,
      });
    });

    it('EDGE: {freedBytes: 3072, freedMB: 0} => a sub-megabyte reclaim keeps the real byte count, which is why the field exists', () => {
      const removal = PruneRemovalStub({
        freedBytes: 3072 as never,
        freedMB: 0 as never,
      });

      const result = pruneRemovalContract.parse(removal);

      expect(result).toStrictEqual({
        id: 'inst_9b2c',
        kind: null,
        freedBytes: 3072,
        freedMB: 0,
        tombstoned: true,
      });
    });
  });

  describe('invalid removals', () => {
    it('INVALID: {freedMB: 4100.5} => a fractional megabyte throws', () => {
      expect(() => {
        PruneRemovalStub({ freedMB: 4100.5 as never });
      }).toThrow(/integer/u);
    });

    it('INVALID: {tombstoned omitted} => throws, so a removal can never be silent about whether the row was flipped', () => {
      expect(() => {
        pruneRemovalContract.parse({
          id: 'inst_9b2c',
          kind: null,
          freedBytes: 1,
          freedMB: 0,
        });
      }).toThrow(/Required/u);
    });
  });
});
