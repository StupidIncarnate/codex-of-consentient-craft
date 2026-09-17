/**
 * PURPOSE: Represents `start`'s one hard refusal — the single exception to `capacity` being advisory
 * (siegelense-tooling.md lines 1588-1590). Starting an instance the machine plainly cannot hold ends
 * with the OS killing something at random, which is worse than a refusal, so `start` refuses and
 * says why. The `why` sentence `capacity` already built IS the explanation, carried through verbatim
 * rather than restated, so the refusal and a `capacity` call answer with the same figures.
 *
 * USAGE:
 * throw new CapacityRefusedError({
 *   specName: 'dungeonmaster-web',
 *   why: 'profile 2600MB peak / 1800MB steady at pool size 1, from 9 runs; …',
 * });
 * // Throws naming the spec and the whole measured reason
 *
 * WHEN-TO-USE: From `instance-start-broker`, after the opportunistic stale reap and BEFORE any
 * reservation is minted, when `capacityReadBroker` answers `suggested: 0` — which is both the
 * out-of-memory case and the pool-already-full case (line 1540), told apart by the `why` sentence's
 * own final clause.
 * WHEN-NOT-TO-USE: For a boot that failed once it started — that is `DriverBootFailedError` or
 * `LaneBootFailedError`, and both mean a reservation already existed.
 */
export class CapacityRefusedError extends Error {
  public constructor({ specName, why }: { specName: string; why: string }) {
    super(
      `Refusing to start ${specName}: this machine cannot hold another instance right now — ${why}. ` +
        `Run 'dungeonmaster siegelense capacity' to see the same reading, or 'dungeonmaster siegelense cleanup' ` +
        `to reap anything stale first.`,
    );
    this.name = 'CapacityRefusedError';
  }
}
