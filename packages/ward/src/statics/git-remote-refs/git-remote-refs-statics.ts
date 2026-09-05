/**
 * PURPOSE: Names the git refs that stand for "origin's default branch", so the detection broker and
 * anything asserting against it spell them identically.
 *
 * THE BRANCH'S OWN `@{upstream}` IS DELIBERATELY NOT HERE. `--committed` measures from origin's main
 * line; a pushed branch's `@{upstream}` is its own remote copy, so measuring from that collapses the
 * diff to nothing the moment a reviewer pushes.
 *
 * USAGE:
 * gitRemoteRefsStatics.originMain;
 * // 'origin/main'
 */

export const gitRemoteRefsStatics = {
  originMain: 'origin/main',
  originMaster: 'origin/master',
} as const;
