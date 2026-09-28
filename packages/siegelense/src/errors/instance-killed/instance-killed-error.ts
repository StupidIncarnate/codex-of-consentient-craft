/**
 * PURPOSE: Represents an error when `run` is asked to dispatch a batch of steps against an
 * instance whose registry row already reads `killed` — `kill` (or an orphan reap) has already
 * torn down the driver process, so there is nothing left at the recorded socket to send steps to.
 * Thrown by `instanceRunBroker` before the request ever reaches the socket, so a walk that keeps
 * calling `run` against a killed instance pays no round trip — and no bare
 * `DriverUnreachableError: connect ENOENT` — to learn what the registry already knows.
 *
 * USAGE:
 * throw new InstanceKilledError({ instanceId: 'inst_7f3a9c21' });
 * // Throws error naming the instance and pointing at a fresh `dungeonmaster siegelense start`
 *
 * WHEN-TO-USE: From `instanceRunBroker`, once the registry row it already read for the socket path
 * carries `state: 'killed'`, so a caller can `instanceof`-check it apart from every other `run`
 * failure.
 * WHEN-NOT-TO-USE: For any other instance state — read paths (`results`, `status`, `snapshots`,
 * `compare`) never throw this, since a killed instance's evidence is still real and still worth a
 * fixer's look.
 */
export class InstanceKilledError extends Error {
  public constructor({ instanceId }: { instanceId: string }) {
    super(
      `Instance ${instanceId} was killed. There is no driver left to run steps against — start a ` +
        `fresh instance with dungeonmaster siegelense start instead.`,
    );
    this.name = 'InstanceKilledError';
  }
}
