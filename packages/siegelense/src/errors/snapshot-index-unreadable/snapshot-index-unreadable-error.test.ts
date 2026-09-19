import { SnapshotIndexUnreadableError } from './snapshot-index-unreadable-error';

describe('SnapshotIndexUnreadableError', () => {
  describe('constructor()', () => {
    it('VALID: {indexPath, cause} => names the index and keeps the underlying cause', () => {
      const cause = new Error('Unexpected token } in JSON at position 4');
      const error = new SnapshotIndexUnreadableError({
        indexPath: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/index.jsonl',
        cause,
      });

      expect({ name: error.name, message: error.message, cause: error.cause }).toStrictEqual({
        name: 'SnapshotIndexUnreadableError',
        message:
          'Snapshot index at /tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/index.jsonl exists but could not be parsed — it is not read as an empty list, because that would report an instance with restore points as having none.',
        cause,
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof SnapshotIndexUnreadableError => returns true', () => {
      const error = new SnapshotIndexUnreadableError({ indexPath: '/tmp/x', cause: null });

      expect(error instanceof SnapshotIndexUnreadableError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new SnapshotIndexUnreadableError({ indexPath: '/tmp/x', cause: null });

      expect(error instanceof Error).toBe(true);
    });
  });
});
