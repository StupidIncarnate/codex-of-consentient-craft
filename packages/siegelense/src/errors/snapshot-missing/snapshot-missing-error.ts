/**
 * PURPOSE: Represents a lookup for a snapshot name the instance's index does not hold. The whole
 * point of the error is that it is thrown rather than substituted for: siegelense-tooling.md line
 * 2478 — "A `reset` naming one that does not exist is an error, never a fall-back to the nearest." A
 * near-miss silently resolved to its neighbour is the tainted-baseline failure with a different cause
 * (line 2619), so the message lists every name that DOES exist and hands the choice back to the
 * caller instead of guessing.
 *
 * USAGE:
 * throw new SnapshotMissingError({ name: 'clen', available: ['clean', 'run_1:start'] });
 * // Throws error naming the snapshot asked for and every one that exists
 *
 * WHEN-TO-USE: Resolving a caller-supplied snapshot name against an instance's index, for `reset` or
 * anything else that must return to a named point.
 * WHEN-NOT-TO-USE: When the index itself could not be read — `SnapshotIndexUnreadableError` covers
 * that, and reporting it as a missing name would tell a caller to fix the wrong thing.
 */
export class SnapshotMissingError extends Error {
  public constructor({ name, available }: { name: string; available: readonly string[] }) {
    super(
      `No snapshot named "${name}" on this instance — it is never resolved to the nearest one. ${
        available.length === 0
          ? 'This instance holds no snapshots at all.'
          : `Snapshots that exist: ${available.join(', ')}.`
      }`,
    );
    this.name = 'SnapshotMissingError';
  }
}
