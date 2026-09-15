/**
 * PURPOSE: Represents an error when every attempt to claim a fresh port pair collided with a
 * pair another instance already claimed in the registry — the OS keeps handing back pairs that
 * are free at the socket level but already spoken for on disk, and the caller gives up rather
 * than looping forever. The attempt count is the whole story, so it is folded into the message
 * rather than stored on the instance.
 *
 * USAGE:
 * throw new PortClaimExhaustedError({ attempts: 5 });
 * // Throws error naming how many claim attempts were made before giving up
 *
 * WHEN-TO-USE: From the broker that claims a port pair for a new instance, once
 * `instanceLifecycleStatics.ports.claimAttempts` re-rolls have each collided with an
 * already-claimed pair in the registry, so a caller can `instanceof`-check it to distinguish
 * exhaustion from any other reservation failure.
 * WHEN-NOT-TO-USE: When a SINGLE attempt collides — that case re-rolls and asks the OS again
 * rather than throwing.
 */
export class PortClaimExhaustedError extends Error {
  public constructor({ attempts }: { attempts: number }) {
    super(`Every port pair collided with an already-claimed pair across ${attempts} attempts`);
    this.name = 'PortClaimExhaustedError';
  }
}
