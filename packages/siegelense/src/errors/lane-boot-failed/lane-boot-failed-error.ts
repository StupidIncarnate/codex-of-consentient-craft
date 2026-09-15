/**
 * PURPOSE: Represents an error when one or more of a lane spec's processes never answered their
 * `readyPath` inside `driverStatics.boot.defaultTimeoutMs`. A lane spec (`laneSpecContract`) can
 * carry several processes — `dungeonmaster-web` boots an api and a web server together — and a
 * caller cannot fix a stuck boot without knowing which process stalled and where its output went,
 * so both are folded into the message. Log paths are handed back rather than log content: content
 * would go stale the instant more output is written, the path never does.
 *
 * USAGE:
 * throw new LaneBootFailedError({
 *   specName: 'dungeonmaster-web',
 *   instanceId: 'inst_7f3a9c21',
 *   unready: ['web'],
 *   logPaths: ['/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/web.log'],
 * });
 * // Throws error naming the spec, the instance, which processes never answered, and their logs
 *
 * WHEN-TO-USE: From the boot broker, once `bootTimeoutMs` elapses with at least one process's
 * `readyPath` still unanswered, so a caller can `instanceof`-check it to distinguish a boot timeout
 * from a driver that booted and later went unreachable.
 * WHEN-NOT-TO-USE: When every process answers its `readyPath` before the timeout — boot proceeds
 * and never throws.
 */
export class LaneBootFailedError extends Error {
  public constructor({
    specName,
    instanceId,
    unready,
    logPaths,
  }: {
    specName: string;
    instanceId: string;
    unready: readonly string[];
    logPaths: readonly string[];
  }) {
    super(
      `Lane ${specName} for instance ${instanceId} did not become ready: ${unready.join(
        ', ',
      )} never answered their ready path. Logs: ${logPaths.join(', ')}`,
    );
    this.name = 'LaneBootFailedError';
  }
}
