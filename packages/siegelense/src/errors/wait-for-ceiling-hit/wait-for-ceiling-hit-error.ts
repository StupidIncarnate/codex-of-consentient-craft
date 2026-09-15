/**
 * PURPOSE: Represents a `waitFor` step whose target never reached the declared state before its
 * ceiling ran out — the one code path that can honestly produce `RunStatus`'s `'timeout'` member
 * (siegelense-tooling.md line 101: "A timeout must name the step... a hang is a finding, not a tool
 * failure"). `runExecuteStepLayerBroker` reads `error instanceof WaitForCeilingHitError` to decide
 * that, rather than sniffing rendered text for the word "timeout" — a signal that survives the
 * underlying driver rewording its own message, and that never fires on an unrelated failure that
 * happens to contain that word. The state, the target and the ceiling are folded into the message
 * rather than stored, matching every other error in this folder — `errors/` has no allowed imports,
 * so there is nowhere else for them to live.
 *
 * USAGE:
 * throw new WaitForCeilingHitError({
 *   target: '[data-testid="MODAL"]', within: null, state: 'visible', timeoutMs: 5000, cause,
 * });
 * // Throws an error naming the state, the target and the ceiling the wait never reached
 *
 * WHEN-TO-USE: From `stepWaitForBroker`, once `session.waitForMatch` rejects — the only way that
 * call fails is by exhausting its own ceiling, so every rejection becomes this.
 * WHEN-NOT-TO-USE: When `session.waitForMatch` resolves — the step proceeds and never throws.
 */
export class WaitForCeilingHitError extends Error {
  public constructor({
    target,
    within,
    state,
    timeoutMs,
    cause,
  }: {
    target: string;
    within: string | null;
    state: string;
    timeoutMs: number;
    cause: unknown;
  }) {
    const scope = within === null ? '' : ` within=${within}`;
    super(`${state} ${target}${scope} never resolved in ${String(timeoutMs)}ms: ${String(cause)}`);
    this.name = 'WaitForCeilingHitError';
  }
}
