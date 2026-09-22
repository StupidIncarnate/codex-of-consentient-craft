/**
 * PURPOSE: Carries the outcome of `stepDispatchBroker`'s failure-path screenshot capture up through
 * the rethrow of a REAL step failure (`step.expect !== 'error'`), so `runExecuteStepLayerBroker` can
 * report `shot: shotPath` on the resulting `StepReading` ONLY when that specific `session.capture`
 * call actually landed. `session.capture`'s own rejection is caught and logged where it happens —
 * deliberately, so a broken capture never masks the step's real error — which means `captured` riding
 * on this wrapper is the ONLY way that outcome reaches the layer above; a filesystem check there would
 * be a guess standing in for a measurement this call already made. `blank`, `blankColour` and
 * `pixelChange` ride the same wrapper for the same reason: `blank` is the one field in this design
 * that is a VERDICT rather than a reading (siegelense-tooling.md's "The honest limit" — `pixelChange:
 * 0%` is a strong signal, never a verdict; `blank` is the one exact exception), so a step that failed
 * BECAUSE the page went white must say so on the single shot a fixer is most likely to open. All
 * three are `null` when `captured` is `false` (no file exists to measure) and also degrade to `null`
 * on their own read failure without disturbing `captured` or `underlyingError` — an evidence read must
 * never replace the step's real error, the same rule the capture itself already follows.
 * `previousReading` and `delta` ride the same wrapper for the same reason, gated on `captured` exactly
 * like `blank`/`pixelChange`: the element half of the pixel/element pair belongs on a real failure's
 * evidence exactly as much as the pixel half does.
 * `blankColour`, `pixelChange`, `previousReading` and `delta` are stored as `unknown`, matching
 * `underlyingError`: this file is a
 * leaf node (`errors/` imports nothing), so it cannot brand them through `hexColourContract` /
 * `pixelChangeContract` / `keyListingContract` / `elementDeltaContract` — whoever reads this wrapper
 * passes them straight into `stepReadingContract`, which re-validates and brands them there.
 * `underlyingError` itself is the original rejection,
 * unchanged, so `runExecuteStepLayerBroker`'s own `instanceof WaitForCeilingHitError` check and its
 * message extraction still see the real failure rather than this wrapper's own class or message.
 *
 * USAGE:
 * throw new StepFailureCaptureError({
 *   underlyingError, captured: true, blank: false, blankColour: null, pixelChange: '4%',
 *   previousReading: null, delta: null,
 * });
 * // runExecuteStepLayerBroker reads `.captured` to gate `shot`, reads `.blank`/`.blankColour`/
 * // `.pixelChange` to carry the same measurement the success path would have made, and unwraps
 * // `.underlyingError` for everything it already extracts from a raw rethrow
 *
 * WHEN-TO-USE: From `stepDispatchBroker`, only when a failure-path capture was actually attempted
 * (`shotPath` non-null and the verb was not itself `'screenshot'`).
 * WHEN-NOT-TO-USE: When no capture was attempted — rethrow the original error unwrapped, since there
 * is nothing this wrapper would add.
 */
export class StepFailureCaptureError extends Error {
  public readonly underlyingError: unknown;
  public readonly captured: boolean;
  public readonly blank: boolean | null;
  public readonly blankColour: unknown;
  public readonly pixelChange: unknown;
  public readonly previousReading: unknown;
  public readonly delta: unknown;

  public constructor({
    underlyingError,
    captured,
    blank,
    blankColour,
    pixelChange,
    previousReading,
    delta,
  }: {
    underlyingError: unknown;
    captured: boolean;
    blank: boolean | null;
    blankColour: string | null;
    pixelChange: string | null;
    previousReading: unknown;
    delta: unknown;
  }) {
    super(String(underlyingError));
    this.underlyingError = underlyingError;
    this.captured = captured;
    this.blank = blank;
    this.blankColour = blankColour;
    this.pixelChange = pixelChange;
    this.previousReading = previousReading;
    this.delta = delta;
    this.name = 'StepFailureCaptureError';
  }
}
