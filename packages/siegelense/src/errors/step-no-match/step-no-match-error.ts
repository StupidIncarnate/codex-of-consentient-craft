/**
 * PURPOSE: Represents an error when a targeting step's `target` selector resolves to zero
 * elements. Spec lines 1985–1988 pair this with ambiguity as the other of the two failure outcomes
 * a targeting step can hit, and spec line 2012: "A zero-match error names the near misses for the
 * same reason [as ambiguity carries candidates], because a misremembered testId is the common
 * case." The near-miss names are the whole recovery path, so they are folded into the message
 * rather than stored — a caller reading only `error.message` still gets the page's actual testIds
 * to try next. `nearest` arrives already ranked by likeness and cut to the top few; `more` counts
 * the names left out, so a dense page reads as five names and a count rather than a wall. `key` is
 * the page's whole rendered KEY at the moment of failure, or `null` when it could not be read. It
 * is stored beside the message rather than folded in: the message is also the one-line
 * `STOPPED AT` a `run` prints, while the key belongs in the step's own reading, where
 * `runExecuteStepLayerBroker` appends it.
 *
 * USAGE:
 * throw new StepNoMatchError({
 *   target: '[data-testid="GUILD_ADD"]',
 *   within: null,
 *   nearest: ['GUILD_LIST', 'GUILD_ITEM_f52cd', 'PIXEL_BTN'],
 *   more: 0,
 *   key: null,
 * });
 * // Throws error naming the near-miss testIds on the page
 *
 * WHEN-TO-USE: From the browser session's targeting steps (`waitFor`, `click`, `type`), once a
 * locator resolves to zero elements, so a caller can `instanceof`-check it to distinguish a
 * zero-match from ambiguity or a timeout.
 * WHEN-NOT-TO-USE: When the locator resolves to at least one element — one match proceeds, more
 * than one throws `StepAmbiguousError` instead.
 */
export class StepNoMatchError extends Error {
  public readonly key: unknown;

  public constructor({
    target,
    within,
    nearest,
    more,
    key,
  }: {
    target: string;
    within: string | null;
    nearest: readonly string[];
    more: number;
    key: string | null;
  }) {
    const scope = within === null ? '' : ` within=${within}`;
    const nearestList = nearest.length > 0 ? nearest.join(', ') : '(none found on this page)';
    const moreText = more > 0 ? ` (+${String(more)} more)` : '';
    super(
      `NO MATCH: 0 elements match target ${target}${scope}. Nearest names on this page: ${nearestList}${moreText}.`,
    );
    this.key = key;
    this.name = 'StepNoMatchError';
  }
}
