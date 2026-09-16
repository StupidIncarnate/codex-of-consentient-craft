/**
 * PURPOSE: Represents an error when a targeting step (`waitFor`, `click`, `type`) resolves its
 * `target` selector against more than one element. Spec line 1963: "Nothing ever silently picks a
 * match. Ambiguity is an ERROR" — the `.first()` this replaces clicks BROWSE while a session meant
 * CREATE and hands back a clean-looking result. Spec line 1991: "The error carries the
 * disambiguation. It is not 'ambiguous, go and work it out'" — every candidate is rendered into the
 * message, one per line, because an error that stores nothing has no other place for the
 * disambiguation to live. Refs (spec line 1977's `ref 16`, `ref 23`) are chunk 4+, so each
 * candidate carries the `within` selector that would disambiguate it in THIS candidate's place —
 * the nearest testId ancestor — instead of a ref, and a candidate at the document root renders that
 * as `(document root)` rather than a misleading empty string.
 *
 * USAGE:
 * throw new StepAmbiguousError({
 *   target: '[data-testid="PIXEL_BTN"]',
 *   within: null,
 *   candidates: [
 *     { index: 0, within: 'GUILD_LIST', text: '+', rect: '(444,348) 27x25' },
 *     { index: 1, within: 'GUILD_SESSION_LIST', text: '+', rect: '(965,348) 27x25' },
 *   ],
 * });
 * // Throws error listing both candidates, one per line, with the `within` that would pick each one
 *
 * WHEN-TO-USE: From the browser session's targeting steps (`waitFor`, `click`, `type`), once a
 * locator resolves to more than one element, so a caller can `instanceof`-check it to distinguish
 * ambiguity from a zero-match or a timeout.
 * WHEN-NOT-TO-USE: When the locator resolves to exactly one element — the step proceeds and never
 * throws.
 */
export class StepAmbiguousError extends Error {
  public constructor({
    target,
    within,
    candidates,
  }: {
    target: string;
    within: string | null;
    candidates: readonly { index: number; within: string | null; text: string; rect: string }[];
  }) {
    const scope = within === null ? '' : ` within=${within}`;
    const rows = candidates
      .map(
        (candidate) =>
          `  [${candidate.index}] within=${candidate.within ?? '(document root)'} text="${candidate.text}" rect=${candidate.rect}`,
      )
      .join('\n');
    super(
      `AMBIGUOUS: ${candidates.length} elements match target ${target}${scope}.\n${rows}\nPick one by narrowing with \`within\`.`,
    );
    this.name = 'StepAmbiguousError';
  }
}
