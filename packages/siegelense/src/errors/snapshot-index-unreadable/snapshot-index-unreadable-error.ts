/**
 * PURPOSE: Represents a snapshot index file that is PRESENT but cannot be parsed. Thrown rather than
 * collapsed into an empty list, for the reason `RegistryUnreadableError`'s own header gives for the
 * registry: reading "broken" as "nothing here" is how a caller concludes there is nothing to return
 * to while the restore points are sitting on disk, and then measures against a state nobody intended.
 * An ABSENT index is a different answer entirely and never reaches this error — no captures yet, or a
 * home that `kill` already removed, both of which are honestly empty.
 *
 * USAGE:
 * throw new SnapshotIndexUnreadableError({
 *   indexPath: '/tmp/dm-siege-inst_7f3a9c21/.siegelense-snapshots/index.jsonl',
 *   cause: parseError,
 * });
 * // Throws error naming the index that could not be parsed
 *
 * WHEN-TO-USE: A snapshot index that exists on disk fails to parse as one JSON record per line.
 * WHEN-NOT-TO-USE: A named snapshot is simply not in a perfectly readable index —
 * `SnapshotMissingError` covers that.
 */
export class SnapshotIndexUnreadableError extends Error {
  public constructor({ indexPath, cause }: { indexPath: string; cause: unknown }) {
    super(
      `Snapshot index at ${indexPath} exists but could not be parsed — it is not read as an empty list, because that would report an instance with restore points as having none.`,
      { cause },
    );
    this.name = 'SnapshotIndexUnreadableError';
  }
}
