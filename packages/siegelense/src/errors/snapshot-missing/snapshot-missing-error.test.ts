import { SnapshotMissingError } from './snapshot-missing-error';

describe('SnapshotMissingError', () => {
  describe('constructor()', () => {
    it('VALID: {name: "clen", available: ["clean", "run_1:start"]} => names the miss and lists what exists', () => {
      const error = new SnapshotMissingError({
        name: 'clen',
        available: ['clean', 'run_1:start'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'SnapshotMissingError',
        message:
          'No snapshot named "clen" on this instance — it is never resolved to the nearest one. Snapshots that exist: clean, run_1:start.',
      });
    });

    it('EMPTY: {available: []} => says the instance holds none rather than printing an empty list', () => {
      const error = new SnapshotMissingError({ name: 'clean', available: [] });

      expect(error.message).toBe(
        'No snapshot named "clean" on this instance — it is never resolved to the nearest one. This instance holds no snapshots at all.',
      );
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof SnapshotMissingError => returns true', () => {
      const error = new SnapshotMissingError({ name: 'clean', available: [] });

      expect(error instanceof SnapshotMissingError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new SnapshotMissingError({ name: 'clean', available: [] });

      expect(error instanceof Error).toBe(true);
    });
  });
});
