/**
 * PURPOSE: Represents an error when a `ref` was never minted by THIS instance — the cross-instance
 * case. Spec line 2179: "A ref is scoped to ONE INSTANCE, and inside it to one page state. The
 * instance holds the element handles, so the instance is the only thing in the system that can
 * resolve a ref at all." Reach for this over `RefStaleError`: a stale ref was yours and its element
 * is gone, while an unknown ref came from somewhere else, and telling its holder to run `look` again
 * fixes nothing — what they are holding cannot mean anything here.
 *
 * The message names the four boundaries itself rather than pointing at a document, because the
 * failure this prevents is the one that returns a clean-looking result: a stored `ref: 14` does not
 * throw where 14 legitimately exists, so it drives the wrong thing. That is `.first()` again,
 * wearing a number (spec line 2204).
 *
 * `ref` and `highestMinted` are stored as `unknown`, matching `StepFailureCaptureError`: this file
 * is a leaf node (`errors/` imports nothing), so it cannot brand them through `refContract`.
 *
 * USAGE:
 * throw new RefUnknownError({ ref: 99, highestMinted: 41 });
 * // Throws naming the highest ref this instance has minted and the four boundaries
 *
 * WHEN-TO-USE: From the browser session's ref resolver, once a ref exceeds what this instance has
 * ever minted.
 * WHEN-NOT-TO-USE: For a ref inside the minted range whose element is gone — that is
 * `RefStaleError`, and a fresh `look` really does recover it.
 */
export class RefUnknownError extends Error {
  public readonly ref: unknown;

  public readonly highestMinted: unknown;

  public constructor({ ref, highestMinted }: { ref: number; highestMinted: number }) {
    super(
      `UNKNOWN REF: ref ${String(ref)} was never minted by this instance, whose highest minted ref is ${String(highestMinted)}. A ref is scoped to ONE instance and one page state, and cannot cross any of four boundaries: a minion to its parent, a parent to a fixer, a walk to its re-walk, or a happy phase to an adversarial one. Run \`look\` on THIS instance, or target by testId with a \`within\` scope, which means the same element in any instance.`,
    );
    this.ref = ref;
    this.highestMinted = highestMinted;
    this.name = 'RefUnknownError';
  }
}
