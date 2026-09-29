/**
 * PURPOSE: Represents a `reset level: 'instance'` restart in which one or more of the lane's
 * processes never answered their `readyPath` again inside the spec's `bootTimeoutMs`. Reach for this
 * over `LaneBootFailedError` when the lane was ALREADY live and a restart is what failed: the
 * instance still exists, its driver still answers, and its remaining processes are still recorded
 * for `kill` to reap, so the caller's next move is to read the named log and `kill` the instance,
 * not to wait out a boot. Log paths are handed back rather than log content, because the restarted
 * process appends to the same file its predecessor wrote.
 *
 * USAGE:
 * throw new LaneRestartFailedError({
 *   specName: 'dungeonmaster-stack',
 *   instanceId: 'inst_7f3a9c21',
 *   unready: ['api'],
 *   logPaths: ['/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21/api-server.log'],
 * });
 * // Throws error naming the spec, the instance, which processes did not come back, and their logs
 */
export class LaneRestartFailedError extends Error {
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
      `Restarting lane ${specName} for instance ${instanceId} failed: ${unready.join(
        ', ',
      )} did not come back (never answered their ready path). Logs: ${logPaths.join(
        ', ',
      )}. The instance is unusable — kill it and start a new one.`,
    );
    this.name = 'LaneRestartFailedError';
  }
}
