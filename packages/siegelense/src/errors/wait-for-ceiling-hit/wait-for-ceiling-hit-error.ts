/**
 * PURPOSE: Represents a `waitFor` step whose target never reached the declared state before its
 * ceiling ran out — the one code path that can honestly produce `RunStatus`'s `'timeout'` member
 * (siegelense-tooling.md line 101: "A timeout must name the step... a hang is a finding, not a tool
 * failure"). `runExecuteStepLayerBroker` reads `error instanceof WaitForCeilingHitError` to decide
 * that, rather than sniffing rendered text for the word "timeout" — a signal that survives the
 * underlying driver rewording its own message, and that never fires on an unrelated failure that
 * happens to contain that word. The state, the target and the ceiling are folded into the message
 * rather than stored, matching every other error in this folder — `errors/` has no allowed imports,
 * so there is nowhere else for them to live. When the target matched NOTHING at the ceiling,
 * `nearest` carries the page's testIds ranked by likeness (the top few, `more` counting the rest)
 * and the message names them, exactly as a NO MATCH does; it is `null` when the element exists but
 * never reached the state, or when the names could not be read. `key` is the page's rendered KEY at
 * the ceiling, stored rather than folded in for the same reason `StepNoMatchError` gives.
 *
 * USAGE:
 * throw new WaitForCeilingHitError({
 *   target: '[data-testid="MODAL"]', within: null, state: 'visible', timeoutMs: 5000, cause,
 *   nearest: ['MODAL_BODY'], more: 0, key: null,
 * });
 * // Throws an error naming the state, the target, the ceiling and the nearest names on the page
 *
 * WHEN-TO-USE: From `stepWaitForBroker`, once `session.waitForMatch` rejects — the only way that
 * call fails is by exhausting its own ceiling, so every rejection becomes this.
 * WHEN-NOT-TO-USE: When `session.waitForMatch` resolves — the step proceeds and never throws.
 */
export class WaitForCeilingHitError extends Error {
  public readonly key: unknown;

  public constructor({
    target,
    within,
    state,
    timeoutMs,
    cause,
    nearest,
    more,
    key,
  }: {
    target: string;
    within: string | null;
    state: string;
    timeoutMs: number;
    cause: unknown;
    nearest: readonly string[] | null;
    more: number;
    key: string | null;
  }) {
    const scope = within === null ? '' : ` within=${within}`;
    const nearestList =
      nearest === null || nearest.length === 0 ? '(none found on this page)' : nearest.join(', ');
    const moreText = more > 0 ? ` (+${String(more)} more)` : '';
    const nearestText =
      nearest === null
        ? ''
        : ` — 0 elements match ${target} now. Nearest names on this page: ${nearestList}${moreText}.`;
    super(
      `${state} ${target}${scope} never resolved in ${String(timeoutMs)}ms: ${String(cause)}${nearestText}`,
    );
    this.key = key;
    this.name = 'WaitForCeilingHitError';
  }
}
