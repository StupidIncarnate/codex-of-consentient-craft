/**
 * PURPOSE: Represents an error when every candidate port pair collided with a pair another
 * instance already claimed in the registry. The broker asks the OS for
 * `instanceLifecycleStatics.ports.claimAttempts` candidate pairs UP FRONT, in parallel — the OS
 * keeps handing back pairs that are free at the socket level but already spoken for on disk — then
 * checks all of them against ONE registry snapshot and picks the first that collides with nothing.
 * This error is thrown only when none of them do. The attempt count is the whole story, so it is
 * folded into the message rather than stored on the instance.
 *
 * USAGE:
 * throw new PortClaimExhaustedError({ attempts: 5 });
 * // Throws error naming how many candidate pairs were checked before giving up
 *
 * WHEN-TO-USE: From the broker that claims a port pair for a new instance, once every one of the
 * `instanceLifecycleStatics.ports.claimAttempts` pairs it fetched from the OS in parallel has
 * collided with an already-claimed pair in the SAME registry snapshot, so a caller can
 * `instanceof`-check it to distinguish exhaustion from any other reservation failure.
 * WHEN-NOT-TO-USE: When at least one fetched candidate is free — the broker picks that one and
 * never throws.
 */
export class PortClaimExhaustedError extends Error {
  public constructor({ attempts }: { attempts: number }) {
    super(`Every port pair collided with an already-claimed pair across ${attempts} attempts`);
    this.name = 'PortClaimExhaustedError';
  }
}
