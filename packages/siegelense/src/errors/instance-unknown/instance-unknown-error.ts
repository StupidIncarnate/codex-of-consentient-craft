/**
 * PURPOSE: Represents an error when a broker resolves an instance id against the registry and finds
 * no row at all — `instanceStateResolveBroker`'s own `'unknown'` state (chunk-03 §3.C). Reach for
 * this wherever a caller has no typed-empty answer to fall back on for that state — `compareReadBroker`
 * throws it before touching any file, because two named runs only mean something once a registry row
 * says the instance was ever real. The message says only that siegelense holds no record of the id —
 * never "never existed": a pruned instance's registry row is also gone by design, and this tool
 * cannot tell that apart from a mistyped id that was never real, so it does not claim to.
 *
 * USAGE:
 * throw new InstanceUnknownError({ instanceId: 'inst_deadbeef' });
 * // Throws error saying siegelense has no record of the id
 *
 * WHEN-TO-USE: Once a broker resolves `instanceStateResolveBroker`'s state as `'unknown'` and has no
 * typed-empty answer of its own to return instead, so a caller can `instanceof`-check it apart from
 * every other read failure.
 * WHEN-NOT-TO-USE: When the caller's own answer contract already carries an `'unknown'` state and
 * the caller has NOT already checked the registry itself first (`resultsReadBroker`,
 * `snapshotListBroker`, `statusReadBroker` all still answer that way when called directly).
 */
export class InstanceUnknownError extends Error {
  public constructor({ instanceId }: { instanceId: string }) {
    super(
      `No record of the instance id "${instanceId}". Check the id dungeonmaster siegelense start returned.`,
    );
    this.name = 'InstanceUnknownError';
  }
}
