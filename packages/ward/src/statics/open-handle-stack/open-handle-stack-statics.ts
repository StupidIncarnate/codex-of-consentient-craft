/**
 * PURPOSE: What ward keeps and what it drops from an open handle's stack, and how many distinct
 * leaks one summary prints. Reach for this over spelling the frame markers at a call site — the
 * display transformer and its tests both need the same answers.
 *
 * USAGE:
 * openHandleStackStatics.frames.maxShown;
 * // Returns 3
 */
export const openHandleStackStatics = {
  frames: {
    // Enough of a stack to name what armed the handle and the path that reached it, without turning
    // one leak into a screenful.
    maxShown: 3,
    nodeInternal: 'node:',
    dependency: 'node_modules',
  },
  summary: {
    // A repo-wide run can surface a long tail. Past this, the tail is a count rather than a list.
    maxGroups: 10,
    // How many rendered lines identify one leak: the suite plus the frame that ARMED the handle.
    // Keying on the whole chain instead splits a single defect into one entry per call site — a
    // proxy arming a setImmediate per mock child process produced nineteen of them.
    keyLines: 2,
  },
} as const;
