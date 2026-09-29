/**
 * PURPOSE: Bounds Jest's shared transform cache. Jest's default cache directory is
 * `<realpath(os.tmpdir())>/jest_<uid in base 36>`, shared by every Jest run of this user across every
 * package and worktree, and Jest never evicts from it: it reached 46 GB and filled the disk.
 * `prune.maxAgeMs` is how long an entry may go unwritten before the start-of-run sweep removes it.
 * Seven days keeps a week of active work warm and lets a checkout nobody touched stop costing disk.
 *
 * USAGE:
 * jestCacheStatics.prune.maxAgeMs;
 * // Returns 604800000
 */

export const jestCacheStatics = {
  prune: {
    maxAgeMs: 604_800_000,
  },
} as const;
