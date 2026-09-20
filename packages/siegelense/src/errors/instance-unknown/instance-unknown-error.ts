/**
 * PURPOSE: Represents an error when a broker resolves an instance id against the registry and finds
 * no row at all — `instanceStateResolveBroker`'s own `'unknown'` state (chunk-03 §3.C). Reach for
 * this wherever a caller has no typed-empty answer to fall back on for that state — `compareReadBroker`
 * throws it before touching any file, because two named runs only mean something once a registry row
 * says the instance was ever real. `results`/`status` do NOT throw this: both answer an unrecognised
 * id with a typed `'unknown'` reading instead (`rows: []` / `instances: []`), so this error is for
 * the read paths that have no such shape to fall back on.
 *
 * USAGE:
 * throw new InstanceUnknownError({ instanceId: 'inst_deadbeef' });
 * // Throws error naming the id as unknown, never existed
 *
 * WHEN-TO-USE: Once a broker resolves `instanceStateResolveBroker`'s state as `'unknown'` and has no
 * typed-empty answer of its own to return instead, so a caller can `instanceof`-check it apart from
 * every other read failure.
 * WHEN-NOT-TO-USE: When the caller's own answer contract already carries an `'unknown'` state
 * (`results`, `status`) — those answer normally rather than throwing.
 */
export class InstanceUnknownError extends Error {
  public constructor({ instanceId }: { instanceId: string }) {
    super(
      `No instance by the id "${instanceId}" — unknown, never existed. Check the id dungeonmaster siegelense start returned.`,
    );
    this.name = 'InstanceUnknownError';
  }
}
