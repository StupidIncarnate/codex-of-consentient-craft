/**
 * PURPOSE: A complete `fs.StatsFs`-shaped value, built by hand, for a proxy staging what
 * `fs/promises`' `statfs` resolves to. Built through an intermediate `Record<string, number>`, cast
 * to `StatsFs` through `unknown` at the return rather than typed as `StatsFs` directly:
 * `fs.StatsFsBase` gained a required `frsize` field in a newer `@types/node` than this repo pins,
 * and a consumer installs that newer one (unit F1's own kind of skew). A `StatsFs`-typed object
 * literal carrying `frsize` is an excess property under THIS repo's older `@types/node`, which has
 * no such field to be excess against; a direct `Record<string, number> as StatsFs` refuses too
 * (TS2352 — neither is a source TypeScript considers "sufficiently overlapping" with a target
 * whose required properties an index signature alone does not prove present), so the `unknown`
 * bridge is what lets one object literal satisfy both `@types/node` shapes.
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
  const stats: Record<string, number> = {
    type,
    bsize,
    blocks,
    bfree,
    bavail,
    files,
    ffree,
    frsize,
  };
  return stats as unknown as StatsFs;
};
