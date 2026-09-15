/**
 * PURPOSE: Represents an error when a caller polls `boot.lock` up to the configured wait ceiling
 * and the lock is still held by a live holder — the boot queue admits only one boot at a time
 * across every session on the machine, so a second boot cannot proceed while another instance's
 * boot is still in flight. The holder and the wait are the whole story, so both are folded into
 * the message rather than stored on the instance.
 *
 * USAGE:
 * throw new BootLockHeldError({ heldBy: 'inst_1a2b3c4d', waitedMs: 5000 });
 * // Throws error naming the live holder and how long this caller waited before giving up
 *
 * WHEN-TO-USE: From the broker polling `boot.lock` for release, once the wait ceiling
 * (`instanceLifecycleStatics.bootLock.waitCeilingMs`) is reached and the held lock's
 * `acquiredAtMs` is still within the TTL, so a caller can `instanceof`-check it to distinguish a
 * live holder from every other boot failure.
 * WHEN-NOT-TO-USE: When the existing lock has gone stale (older than the TTL) — that case
 * acquires the lock instead of throwing.
 */
export class BootLockHeldError extends Error {
  public constructor({ heldBy, waitedMs }: { heldBy: string; waitedMs: number }) {
    super(`Boot lock held by ${heldBy}; gave up after waiting ${waitedMs}ms past the wait ceiling`);
    this.name = 'BootLockHeldError';
  }
}
