/**
 * PURPOSE: Carries the outcome of `stepDispatchBroker`'s failure-path screenshot capture up through
 * the rethrow of a REAL step failure (`step.expect !== 'error'`), so `runExecuteStepLayerBroker` can
 * report `shot: shotPath` on the resulting `StepReading` ONLY when that specific `session.capture`
 * call actually landed. `session.capture`'s own rejection is caught and logged where it happens —
 * deliberately, so a broken capture never masks the step's real error — which means `captured` riding
 * on this wrapper is the ONLY way that outcome reaches the layer above; a filesystem check there would
 * be a guess standing in for a measurement this call already made. `underlyingError` is the original
 * rejection, unchanged, so `runExecuteStepLayerBroker`'s own `instanceof WaitForCeilingHitError` check
 * and its message extraction still see the real failure rather than this wrapper's own class or
 * message.
 *
 * USAGE:
 * throw new StepFailureCaptureError({ underlyingError, captured: true });
 * // runExecuteStepLayerBroker reads `.captured` to gate `shot` and unwraps `.underlyingError` for
 * // everything it already extracts from a raw rethrow
 *
 * WHEN-TO-USE: From `stepDispatchBroker`, only when a failure-path capture was actually attempted
 * (`shotPath` non-null and the verb was not itself `'screenshot'`).
 * WHEN-NOT-TO-USE: When no capture was attempted — rethrow the original error unwrapped, since there
 * is nothing this wrapper would add.
 */
export class StepFailureCaptureError extends Error {
  public readonly underlyingError: unknown;
  public readonly captured: boolean;

  public constructor({
    underlyingError,
    captured,
  }: {
    underlyingError: unknown;
    captured: boolean;
  }) {
    super(String(underlyingError));
    this.underlyingError = underlyingError;
    this.captured = captured;
    this.name = 'StepFailureCaptureError';
  }
}
