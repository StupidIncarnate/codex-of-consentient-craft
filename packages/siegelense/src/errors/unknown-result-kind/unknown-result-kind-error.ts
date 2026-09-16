/**
 * PURPOSE: Represents an error when a `results` query names a `kind` outside the six
 * `resultsStatics.kinds.all` accepts. Every known kind is named in the message, unlike
 * `RunIdRequiredError`'s refusal to enumerate run ids — the six kinds are a small, STABLE,
 * closed vocabulary a caller is meant to memorize, while run ids are per-instance data that grows
 * without bound. The unrecognized kind and the full known list are the whole story, so both are
 * folded into the message rather than stored.
 *
 * USAGE:
 * throw new UnknownResultKindError({ kind: 'dom', known: ['console', 'network', 'ws', 'server', 'screenshots', 'steps'] });
 * // Throws error naming the unrecognized kind and every kind results actually accepts
 *
 * WHEN-TO-USE: From the broker validating a `results` query's `kind` before dispatching to the
 * matching buffer reader, once the value falls outside `resultsStatics.kinds.all`, so a caller can
 * `instanceof`-check it to distinguish an unknown kind from every other query failure.
 * WHEN-NOT-TO-USE: When `kind` is one of the six, or `null` — both dispatch normally and never
 * throw this.
 */
export class UnknownResultKindError extends Error {
  public constructor({ kind, known }: { kind: string; known: readonly string[] }) {
    super(`Unknown result kind "${kind}". Known kinds: ${known.join(', ')}.`);
    this.name = 'UnknownResultKindError';
  }
}
