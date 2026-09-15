/**
 * PURPOSE: Represents an error when the driver socket for a registry row's recorded `socketPath`
 * refuses the connection or the path is absent — a driver that was SIGKILLed (spec line 1122:
 * "SIGKILL cannot be caught... nothing is cleaned, nothing is reported") leaves exactly this: a row
 * that still claims `alive` with nothing listening behind it. This error is never surfaced bare —
 * `kill` catches it and falls back to the orphan-reap path, reading the heartbeat file's recorded
 * pgids (spec lines 1136–1140) instead of asking a driver that no longer exists. The instance id and
 * socket path are the whole story of WHICH row is orphaned, so both are folded into the message.
 *
 * USAGE:
 * throw new DriverUnreachableError({
 *   instanceId: 'inst_7f3a9c21',
 *   socketPath: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
 *   cause,
 * });
 * // Throws error naming the instance, its recorded socket path, and the underlying connect failure
 *
 * WHEN-TO-USE: From the socket client, when a connect attempt to a registry row's `socketPath`
 * refuses or the path is `null`, so a caller can `instanceof`-check it to distinguish an orphaned
 * driver from every other socket failure.
 * WHEN-NOT-TO-USE: When the socket accepts the connection — the request proceeds and never throws
 * this.
 */
export class DriverUnreachableError extends Error {
  public constructor({
    instanceId,
    socketPath,
    cause,
  }: {
    instanceId: string;
    socketPath: string;
    cause: unknown;
  }) {
    super(
      `Driver for instance ${instanceId} is unreachable at socket ${socketPath}: ${String(cause)}`,
    );
    this.name = 'DriverUnreachableError';
  }
}
