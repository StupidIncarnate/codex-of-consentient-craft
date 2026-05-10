/**
 * PURPOSE: Returns descriptions of contract source-vs-status mismatches against a pre-computed disk-resolution map
 *
 * USAGE:
 * questContractSourceResolutionTransformer({contracts, resolvedSources});
 * // Returns ErrorMessage[] — e.g.
 * // ["Contract 'LoginCredentials' has status 'existing' but source 'packages/shared/.../missing.ts' does not resolve on disk."],
 * // ["Contract 'NewThing' has status 'new' but source 'packages/shared/.../already-here.ts' already resolves on disk."].
 *
 * The transformer is pure — disk resolution is performed by the caller (the broker) and the resolved-source set is
 * passed in. Status values are checked against the resolved set:
 *   - 'existing' or 'modified' => path MUST resolve
 *   - 'new'                    => path MUST NOT resolve
 */
import type { QuestContractEntryStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

export const questContractSourceResolutionTransformer = ({
  contracts,
  resolvedSources,
}: {
  contracts?: QuestContractEntry[];
  resolvedSources: Set<unknown>;
}): ErrorMessage[] => {
  if (!contracts) {
    return [];
  }

  const offenders: ErrorMessage[] = [];
  for (const entry of contracts) {
    const exists = resolvedSources.has(entry.source);
    const { status } = entry;

    if (status === 'new' && exists) {
      offenders.push(
        errorMessageContract.parse(
          `Contract '${String(entry.name)}' has status 'new' but source '${String(entry.source)}' already resolves on disk. Set status to 'existing' or 'modified', change the source path, or drop the entry.`,
        ),
      );
      continue;
    }

    if ((status === 'existing' || status === 'modified') && !exists) {
      offenders.push(
        errorMessageContract.parse(
          `Contract '${String(entry.name)}' has status '${status}' but source '${String(entry.source)}' does not resolve on disk. Set status to 'new', or correct the source path.`,
        ),
      );
    }
  }
  return offenders;
};
