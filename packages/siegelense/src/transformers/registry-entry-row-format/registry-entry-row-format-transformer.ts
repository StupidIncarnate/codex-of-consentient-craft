/**
 * PURPOSE: One tab-separated line for `dungeonmaster siegelense`'s bare-invocation table — id, state,
 * spec, the claimed port pair, the last heartbeat, and the repo-local evidence path. Pure, so the
 * table a person reads at a terminal is testable without a registry file or a real siegelense root.
 *
 * USAGE:
 * registryEntryRowFormatTransformer({ entry: RegistryEntryStub(), evidence: RepoLocalPathStub() });
 * // Returns 'inst_7f3a9c21\talive\tdungeonmaster-web\t34172/34173\t1700000000000\t/repo/.siegelense/...'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { RegistryEntry } from '../../contracts/registry-entry/registry-entry-contract';
import type { RepoLocalPath } from '../../contracts/repo-local-path/repo-local-path-contract';

export const registryEntryRowFormatTransformer = ({
  entry,
  evidence,
}: {
  entry: RegistryEntry;
  evidence: RepoLocalPath;
}): ContentText => {
  const lastBeat = entry.lastBeatMs === null ? '-' : String(entry.lastBeatMs);

  return contentTextContract.parse(
    [
      entry.id,
      entry.state,
      entry.specName,
      `${String(entry.ports.api)}/${String(entry.ports.web)}`,
      lastBeat,
      evidence.path,
    ].join('\t'),
  );
};
