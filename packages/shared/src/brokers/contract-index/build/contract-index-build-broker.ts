/**
 * PURPOSE: Returns the contract index for a repo root, kept for the life of the process, so a lint
 * rule asking "does production code parse this contract?" answers from one repo-wide index instead
 * of one read per file. The first call per root assembles it through contractIndexAssembleBroker,
 * which reuses the per-package shards on disk and re-parses only source files changed since they
 * were written; resolving names across files still runs once per process. A long-lived process (an
 * editor's ESLint server) keeps the index it first built. Reach for this over
 * contractIndexFromSourcesTransformer when you have a directory, not source text already in hand.
 *
 * USAGE:
 * contractIndexBuildBroker({ rootDir: '/repo' });
 * // Returns ContractIndexEntry[] — one per `-contract.ts` file
 */
import type { ContractIndexEntry } from '../../../contracts/contract-index-entry/contract-index-entry-contract';
import { contractIndexAssembleBroker } from '../assemble/contract-index-assemble-broker';

const builtIndexes = new Map<string, ContractIndexEntry[]>();

export const contractIndexBuildBroker = ({
  rootDir,
}: {
  rootDir: string;
}): ContractIndexEntry[] => {
  const cached = builtIndexes.get(rootDir);
  if (cached !== undefined) {
    return cached;
  }

  const entries = contractIndexAssembleBroker({ rootDir });
  builtIndexes.set(rootDir, entries);
  return entries;
};
