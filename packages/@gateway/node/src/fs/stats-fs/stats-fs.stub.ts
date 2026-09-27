/**
 * PURPOSE: A complete `fs.StatsFs`-shaped value, built by hand, for a proxy staging what
 * `fs/promises`' `statfs` resolves to. `StatsFs` merges an all-public interface with an empty
 * class, so a plain object literal satisfies the type with no cast — reach for this over an
 * `as unknown as StatsFs` on a partial object, which is what left the type import with nothing
 * else using it.
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
}: {
  type?: number;
  bsize?: number;
  blocks?: number;
  bfree?: number;
  bavail?: number;
  files?: number;
  ffree?: number;
} = {}): StatsFs => ({
  type,
  bsize,
  blocks,
  bfree,
  bavail,
  files,
  ffree,
});
