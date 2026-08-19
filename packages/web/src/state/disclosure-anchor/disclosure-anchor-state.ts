/**
 * PURPOSE: The one bit of coordination between a disclosure that is settling and the auto-scroll
 * that would otherwise fight it. A `ResizeObserver` sees that the transcript changed height but
 * never WHY, so it treats a reader opening a sub-agent chain exactly like a new message arriving
 * and jumps to the bottom — throwing the reader to the end of the run every time they open
 * anything. The side that knows why says so here, and the auto-scroll stands down for that frame.
 *
 * Held COUNT rather than a flag, so two disclosures settling in the same frame cannot have the
 * first one to finish clear the second one's suppression.
 *
 * USAGE:
 * disclosureAnchorState.hold();
 * // The next resize is a disclosure's own doing; disclosureAnchorState.isHeld() reads true until released
 */

const state = { held: 0 };

export const disclosureAnchorState = {
  hold: (): void => {
    state.held += 1;
  },

  isHeld: (): boolean => state.held > 0,

  release: (): void => {
    state.held = Math.max(0, state.held - 1);
  },

  releaseAll: (): void => {
    state.held = 0;
  },
} as const;
