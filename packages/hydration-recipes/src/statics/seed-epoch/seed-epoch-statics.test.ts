import { seedEpochStatics } from './seed-epoch-statics';

describe('seedEpochStatics', () => {
  describe('epoch', () => {
    it('VALID: {} => pins the fixed ISO timestamp every route derives from', () => {
      expect(seedEpochStatics.epoch).toStrictEqual({ iso: '2026-04-29T20:00:00.000Z' });
    });
  });
});
