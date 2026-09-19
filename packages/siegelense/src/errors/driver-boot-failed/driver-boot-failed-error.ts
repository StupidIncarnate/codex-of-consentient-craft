/**
 * PURPOSE: Represents a boot failure the DRIVER ITSELF already diagnosed and wrote to its
 * failure marker before exiting — a `FakeAgentCliRequiredError`, a malformed spec, anything the
 * driver process catches and reports on its own — as opposed to `LaneBootFailedError`, which
 * `instanceStartBroker` throws only when the poll ran out its full deadline with NO such report to
 * read. `driverMessage` is the driver's own `.message`, carried through verbatim rather than
 * re-described, so a person reads the SAME cause the driver process actually hit — the missing
 * env vars, not a generic "never answered its ready path". `driverLogPath` stays in the message
 * because the log is still useful evidence, even though it is no longer the only place the cause
 * lives.
 *
 * USAGE:
 * throw new DriverBootFailedError({
 *   specName: 'dungeonmaster-stack',
 *   instanceId: 'inst_7f3a9c21',
 *   driverMessage: 'Lane spec dungeonmaster-stack requires a fake agent CLI...',
 *   driverLogPath: '/repo/.siegelense/unowned/instances/inst_7f3a9c21/driver.log',
 * });
 * // Throws error naming the spec and instance, the driver's own diagnosis, and its log path
 *
 * WHEN-TO-USE: From `instanceStartBroker`, once its boot poll returns a `BootPollOutcome` whose
 * `status` is `'failed'` — a `boot-failure.json` marker was found beside the instance's evidence.
 * WHEN-NOT-TO-USE: When the poll times out with no marker present — that is `LaneBootFailedError`'s
 * case, since nothing there names a specific cause.
 */
export class DriverBootFailedError extends Error {
  public constructor({
    specName,
    instanceId,
    driverMessage,
    driverLogPath,
  }: {
    specName: string;
    instanceId: string;
    driverMessage: string;
    driverLogPath: string;
  }) {
    super(
      `Lane ${specName} for instance ${instanceId} failed to boot: ${driverMessage} Driver log: ${driverLogPath}`,
    );
    this.name = 'DriverBootFailedError';
  }
}
