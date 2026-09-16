/**
 * PURPOSE: Represents an error when a browser step (`look`, `click`, `hold`, and the rest of
 * `stepStatics.verbs.browser`) is submitted against an instance whose lane spec declares
 * `browser: false`. Spec lines 2154–2156: "Only the browser steps go missing with it, and they go
 * missing LOUDLY. A `look`, a `click` or a `hold` submitted against a browserless instance is an
 * error naming the spec, never an empty key — a reading that quietly returns nothing is the
 * `count: 0` problem arriving at the one place a walk cannot recover from it." The spec name is the
 * whole story — a browserless lane is a deliberate, first-class spec (spec line 1613), not a
 * degraded one — so naming it is what lets a caller tell "wrong spec for this walk" from every
 * other step failure.
 *
 * USAGE:
 * throw new BrowserStepUnsupportedError({ verb: 'click', specName: 'dungeonmaster-headless' });
 * // Throws error naming both the browser verb and the browserless spec it was submitted against
 *
 * WHEN-TO-USE: From the run executor, before dispatching any step in `stepStatics.verbs.browser`,
 * once the target instance's `LaneSession.browser` is `null`, so a caller can `instanceof`-check it
 * to distinguish "this spec has no screen" from every other step failure.
 * WHEN-NOT-TO-USE: When the instance's lane spec declares `browser: true` — every step dispatches
 * normally regardless of verb.
 */
export class BrowserStepUnsupportedError extends Error {
  public constructor({ verb, specName }: { verb: string; specName: string }) {
    super(`Step ${verb} needs a browser, but spec ${specName} declares browser: false`);
    this.name = 'BrowserStepUnsupportedError';
  }
}
