/**
 * PURPOSE: Represents an `until` step whose condition never came true before its ceiling ran out —
 * the `until` counterpart to `WaitForCeilingHitError`, and the other honest way `RunStatus`'s
 * `'timeout'` member is produced (siegelense-tooling.md line 101: "A timeout must name the step...
 * a hang is a finding, not a tool failure"). `runExecuteStepLayerBroker` reads `error instanceof
 * UntilCeilingHitError` — alongside `WaitForCeilingHitError` — to decide that, rather than sniffing
 * rendered text. Unlike `WaitForCeilingHitError`, the underlying rejection is never folded into the
 * message: the spec's own worked example (line 3097) is the exact text a `visible` ceiling must
 * produce, with nothing appended. `bufferNote` is non-null only for the two forms (`console`/
 * `response`) that poll a continuous buffer rather than a Playwright-owned wait: they scan forward
 * from the RUN's own window start, so a match sitting BEFORE that window can only belong to an
 * earlier run, and the note names it that way rather than leaving a bare timeout for a walker to
 * re-run unchanged.
 *
 * USAGE:
 * throw new UntilCeilingHitError({
 *   descriptor: 'visible [data-testid="SUBAGENT_CHAIN"]', timeoutMs: 20000, bufferNote: null,
 * });
 * // Throws error whose message is exactly:
 * // 'visible [data-testid="SUBAGENT_CHAIN"] never resolved in 20000ms'
 *
 * WHEN-TO-USE: From `stepUntilBroker` and its two layer brokers, once a form's own wait exhausts its
 * ceiling with no match.
 * WHEN-NOT-TO-USE: When the condition resolves — the step proceeds and never throws.
 */
export class UntilCeilingHitError extends Error {
  public constructor({
    descriptor,
    timeoutMs,
    bufferNote,
  }: {
    descriptor: string;
    timeoutMs: number;
    bufferNote: string | null;
  }) {
    const base = `${descriptor} never resolved in ${String(timeoutMs)}ms`;
    super(bufferNote === null ? base : `${base} — ${bufferNote}`);
    this.name = 'UntilCeilingHitError';
  }
}
