import { orphanReadingContract } from './orphan-reading-contract';
import { OrphanReadingStub } from './orphan-reading.stub';

describe('orphanReadingContract', () => {
  describe('valid readings', () => {
    it('VALID: {pgid: 33812, cmd: "npm run dev:no-watch", alive: true} => parses spec line 1179 verbatim', () => {
      const orphan = OrphanReadingStub({
        pgid: 33_812,
        cmd: 'npm run dev:no-watch',
        alive: true,
      });

      const result = orphanReadingContract.parse(orphan);

      expect(result).toStrictEqual({
        pgid: 33_812,
        cmd: 'npm run dev:no-watch',
        alive: true,
      });
    });

    it('VALID: {cmd: null, alive: false} => a reaped pgid with no /proc entry left is the common case', () => {
      const orphan = OrphanReadingStub({
        pgid: 33_812,
        cmd: null,
        alive: false,
      });

      const result = orphanReadingContract.parse(orphan);

      expect(result).toStrictEqual({
        pgid: 33_812,
        cmd: null,
        alive: false,
      });
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {missing cmd} => throws Required, because .nullable() is not .optional()', () => {
      expect(() =>
        orphanReadingContract.parse({
          pgid: 33_812,
          alive: true,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {pgid: 0} => throws for a non-positive pgid', () => {
      expect(() =>
        orphanReadingContract.parse({
          pgid: 0,
          cmd: null,
          alive: false,
        }),
      ).toThrow(/too_small/u);
    });
  });
});
