/**
 * PURPOSE: Represents an error when a `ref` was minted by this instance but no longer reaches the
 * element it bound to. Spec line 2141: "It answers `stale` when that element has detached, which is
 * a real answer and not a silent miss", and line 2211: "Navigation, `reset` and an instance restart
 * all invalidate every ref. A ref used after one of those answers `stale` — never a different
 * element." Reach for this over `RefUnknownError`: this one means the ref WAS yours and the element
 * is gone, while an unknown ref was never minted here at all — which is the cross-instance case, and
 * the one whose recovery is different.
 *
 * The message names WHICH boundary was crossed, because the two need different actions: a detached
 * element usually means the page moved on and a fresh `look` is enough, while a navigation means
 * every ref a session is holding died at once.
 *
 * `ref` and `boundary` are stored as `unknown`, matching `StepFailureCaptureError`: this file is a
 * leaf node (`errors/` imports nothing), so it cannot brand them through `refContract`.
 *
 * USAGE:
 * throw new RefStaleError({ ref: 23, boundary: 'navigation' });
 * // Throws naming the boundary and the recovery
 *
 * WHEN-TO-USE: From the browser session's ref resolver, once a ref inside this instance's minted
 * range fails to reach a connected element, so a caller can `instanceof`-check it to tell a dead
 * handle apart from a zero-match target.
 * WHEN-NOT-TO-USE: For a ref this instance never minted — that is `RefUnknownError`, and telling a
 * session to run `look` again would send it round a loop that cannot end.
 */
export class RefStaleError extends Error {
  public readonly ref: unknown;

  public readonly boundary: unknown;

  public constructor({ ref, boundary }: { ref: number; boundary: string }) {
    super(
      `STALE REF: ref ${String(ref)} no longer reaches an element — boundary crossed: ${boundary}. A ref binds to an ELEMENT and never to a row number, so this is never a different element. Run \`look\` again for the current key.`,
    );
    this.ref = ref;
    this.boundary = boundary;
    this.name = 'RefStaleError';
  }
}
