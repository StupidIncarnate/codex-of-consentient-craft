/**
 * PURPOSE: Represents an error when a targeting step (`waitFor`, `click`, `type`) resolves its
 * `target` selector against more than one element. Spec line 2109: "Nothing ever silently picks a
 * match. Ambiguity is an ERROR" — the `.first()` this replaces clicks BROWSE while a session meant
 * CREATE and hands back a clean-looking result. Spec line 2137: "The error carries the
 * disambiguation. It is not 'ambiguous, go and work it out'" — so every candidate is rendered into
 * the message AND kept on `candidates`, because a session reading the JSON and a person reading the
 * message are two different readers and each needs the whole answer.
 *
 * **Each candidate carries a `ref`, and that is what makes the advice followable.** A `within` alone
 * cannot disambiguate two elements that already SHARE one: the error then repeats itself verbatim
 * and the recovery it names cannot be performed, which is the measured dead end at
 * `scrolls/seigelense/HANDOFF.md` lines 206-214. A ref binds to one element, can never be ambiguous,
 * and is exactly what `click { ref }` takes — so `Pick one by ref` is an instruction that always
 * works, and `narrow with within` stays beside it for the case where the caller wants a handle it
 * can SAVE. A candidate minted before `look` existed carries `ref: null`, and the row then renders
 * its `within` alone.
 *
 * `candidates` is stored as `unknown[]`: this file is a leaf node (`errors/` imports nothing), so it
 * cannot brand rows through `stepCandidateContract`. `runExecuteStepLayerBroker` re-validates them
 * into the run's `StoppedAt`, which is where a session parsing the JSON reads them.
 *
 * USAGE:
 * throw new StepAmbiguousError({
 *   target: '[data-testid="PIXEL_BTN"]',
 *   within: null,
 *   candidates: [
 *     { index: 0, ref: 16, within: 'GUILD_LIST', text: '+', rect: '(444,348) 27x25' },
 *     { index: 1, ref: 23, within: 'GUILD_SESSION_LIST', text: '+', rect: '(965,348) 27x25' },
 *   ],
 * });
 * // Throws listing both candidates, one per line, each with the ref that picks it
 *
 * WHEN-TO-USE: From the browser session's targeting steps (`waitFor`, `click`, `type`), once a
 * locator resolves to more than one element, so a caller can `instanceof`-check it to distinguish
 * ambiguity from a zero-match or a timeout.
 * WHEN-NOT-TO-USE: When the locator resolves to exactly one element — the step proceeds and never
 * throws. And never for a `ref`, which binds to one element and can never be ambiguous.
 */
export class StepAmbiguousError extends Error {
  public readonly target: unknown;

  public readonly within: unknown;

  public readonly candidates: readonly unknown[];

  public constructor({
    target,
    within,
    candidates,
  }: {
    target: string;
    within: string | null;
    candidates: readonly {
      index: number;
      ref: number | null;
      within: string | null;
      text: string;
      rect: string;
    }[];
  }) {
    const scope = within === null ? '' : ` within=${within}`;
    const rows = candidates
      .map((candidate) => {
        const refColumn = candidate.ref === null ? '' : ` ref=${String(candidate.ref)}`;
        return `  [${candidate.index}]${refColumn} within=${candidate.within ?? '(document root)'} text="${candidate.text}" rect=${candidate.rect}`;
      })
      .join('\n');
    super(
      `AMBIGUOUS: ${candidates.length} elements match target ${target}${scope}.\n${rows}\nPick one by ref — { "step": "click", "ref": N } — or narrow with \`within\`. Two candidates sharing a \`within\` can only be told apart by ref; run \`look\` for the current key.`,
    );
    this.target = target;
    this.within = within;
    this.candidates = candidates;
    this.name = 'StepAmbiguousError';
  }
}
