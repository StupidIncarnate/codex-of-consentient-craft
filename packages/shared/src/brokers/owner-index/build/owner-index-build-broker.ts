/**
 * PURPOSE: Returns the owner index for a repo root, kept for the life of the process: every object
 * contract and standalone brand contract in the workspace packages, plus each package's workspace
 * dependencies, so a rule asks "who owns this name" from one repo-wide index. The first call per
 * root assembles it through ownerIndexAssembleBroker, which reuses the per-package shards on disk
 * and re-parses only contract files changed since they were written — so each of ward's lint
 * processes pays a walk and a shard read, not a parse of every contract. Reach for this over
 * ownerIndexFromSourcesTransformer when you have a directory, not source text already in hand. A
 * long-lived process keeps the index it first built; the index is built for ward and never for the
 * pre-edit hook, whose cost on every edit is unmeasured.
 *
 * USAGE:
 * ownerIndexBuildBroker({ rootDir: '/repo' });
 * // Returns OwnerIndex — owners, standaloneBrands, enums and packages
 */
import type { OwnerIndex } from '../../../contracts/owner-index/owner-index-contract';
import { ownerIndexAssembleBroker } from '../assemble/owner-index-assemble-broker';

const builtIndexes = new Map<string, OwnerIndex>();

export const ownerIndexBuildBroker = ({ rootDir }: { rootDir: string }): OwnerIndex => {
  const cached = builtIndexes.get(rootDir);
  if (cached !== undefined) {
    return cached;
  }

  const ownerIndex = ownerIndexAssembleBroker({ rootDir });
  builtIndexes.set(rootDir, ownerIndex);
  return ownerIndex;
};
