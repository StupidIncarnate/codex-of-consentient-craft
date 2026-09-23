import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { observableAutomatabilityStatics } from './observable-automatability-statics';

// PROSE COMPARES IGNORE WRAPPING, matching standardsReviewConcernsStatics.test.ts's own rationale:
// `has` collapses every whitespace run on both sides before it matches, so re-flowing a paragraph
// here reds nothing that is still true. Anything measuring the real bytes reads
// `observableAutomatabilityStatics.markdown` directly instead.
const WHITESPACE_RUN = /\s+/gu;
const FLAT_MARKDOWN = observableAutomatabilityStatics.markdown.replace(WHITESPACE_RUN, ' ');

const has = (needle: string): boolean =>
  FLAT_MARKDOWN.includes(needle.replace(WHITESPACE_RUN, ' '));

describe('observableAutomatabilityStatics', () => {
  it('VALID: exported value => is exactly one markdown block and nothing else', () => {
    expect(observableAutomatabilityStatics).toStrictEqual({
      markdown: expect.stringMatching(/^.+$/su),
    });
  });

  // Interpolated into both intake prompts (ChaosWhisperer, BugHunt) and both siege walker prompts —
  // four readers, so a character here is four characters served, each of which has to clear
  // `mcpToolResultStatics.maxVerbatimChars` on its own.
  it('VALID: markdown => stays under the MCP tool-result verbatim-delivery ceiling on its own', () => {
    const bytes = Buffer.byteLength(observableAutomatabilityStatics.markdown, 'utf8');

    expect(bytes).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: markdown => carries the one ### heading, verbatim', () => {
    expect(FLAT_MARKDOWN.startsWith('## `verifyByHuman`')).toBe(true);
  });

  it('VALID: markdown => states when to set the flag: no automated check, test or reading, can settle it, and only after the quest is done', () => {
    expect(
      has(
        'Set `verifyByHuman: true` on an observable when NO automated check — no test, no reading of the source — can settle it at all, because it names a judgment only a person can make, and only once the quest is done.',
      ),
    ).toBe(true);
  });

  it('VALID: markdown => states the flag lives on an observable only, and a terminal/branch/off-map unit takes cant-meet with a toSettle instead', () => {
    expect(
      has(
        "**The flag lives on an OBSERVABLE, and nowhere else.** `flowObservableContract` is the only contract carrying it — a terminal node, a labelled branch edge and an off-map probe family have no such field to set. Where one of those, rather than an observable, is what resists every check and nothing but a person's own judgment could ever settle, the honest mark is `cant-meet` with a `toSettle` naming the person's check — never an invented flag on a unit that carries none.",
      ),
    ).toBe(true);
  });

  it('VALID: markdown => states any role may set it, including one with no way to confirm the criterion itself', () => {
    expect(
      has(
        '**Any role may set it, including one with no way to confirm the criterion itself.** A session that recognizes a criterion nothing available to it can verify sets the flag rather than inventing a proxy measurement to stand in for it.',
      ),
    ).toBe(true);
  });

  it('VALID: markdown => states verifyByHuman is a separate axis from verifyByReading and composes with it, with verifyByHuman winning when both are true', () => {
    expect(
      has(
        '**It is a separate axis from `verifyByReading`, and the two compose.** `verifyByReading` says a criterion is settled by opening a file instead of running a test — a person or a model can still confirm it today, during the quest. `verifyByHuman` says nothing automated can confirm it AT ALL, by either method, and not until the quest is done. When an observable carries both, `verifyByHuman` wins: nothing is asked to settle it during the quest, whatever `verifyByReading` also claims.',
      ),
    ).toBe(true);
  });

  it('VALID: markdown => states the flag is for what no automated check could ever settle, not merely a hard-to-test or not-yet-tested criterion', () => {
    expect(
      has(
        '**Reach for it only when no automated check could ever settle the criterion** — not "this is hard to test" and not "nobody has written the test yet". A criterion a person could read the source and confirm belongs to `verifyByReading`. A criterion a test could assert once written belongs to a test.',
      ),
    ).toBe(true);
  });

  it("VALID: markdown => states setting it removes the observable from every role's list from that point forward", () => {
    expect(
      has(
        "**Setting it removes the observable from every role's list, from that point forward.** No codeweaver, flowrider or siegemaster session is handed that criterion to prove once it is set — it drops out of the in-scope units every one of them works from, whichever session sets it and whenever in the quest it sets it.",
      ),
    ).toBe(true);
  });

  it('VALID: markdown => states the observable is not deleted, and reaches a person as a question once the quest is done', () => {
    expect(
      has(
        'The observable is not deleted and not abandoned: it reaches a person as a question once the quest is done, answerable only by looking at the real thing.',
      ),
    ).toBe(true);
  });
});
