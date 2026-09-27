/**
 * PURPOSE: A complete `fs.StatsFs`-shaped value, built by hand, for a proxy staging what
 * `fs/promises`' `statfs` resolves to. `frsize` goes in through a spread: newer `@types/node` makes it
 * required, and this repo's older one has no such field, so written as a literal property it is an
 * excess property here. A spread of a variable is not excess-checked, so the value satisfies both.
 *
 * USAGE:
 * const stats = StatsFsStub({ bavail: 1000, bsize: 4096 });
 * // Returns a real StatsFs-shaped value with those two fields set, the rest zeroed
 */
import type { StatsFs } from 'fs';

export const StatsFsStub = ({
  type = 0,
  bsize = 0,
  blocks = 0,
  bfree = 0,
  bavail = 0,
  files = 0,
  ffree = 0,
  frsize = 0,
}: {
  type?: number;
  bsize?: number;
  blocks?: number;
  bfree?: number;
  bavail?: number;
  files?: number;
  ffree?: number;
  frsize?: number;
} = {}): StatsFs => {
  const newerTypesFields = { frsize };
  return {
    type,
    bsize,
    blocks,
    bfree,
    bavail,
    files,
    ffree,
    ...newerTypesFields,
  };
};
