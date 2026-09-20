/**
 * PURPOSE: Layer of ArchitectureHandleResponder — the only place in this responder that touches
 * callerCwdScanCursorState, since brokers/ cannot import state/. Reads the current cursor cache,
 * hands it to callerRepoRootResolveBroker alongside `meta`, then persists every cursor advance
 * the broker produced (whether or not it found a match) so the NEXT discover/get-project-map/
 * get-project-inventory call in this same file is a warm, delta-only read instead of a fresh
 * full-directory scan.
 *
 * USAGE:
 * const { repoRoot, source, configFound } = await ResolveCallerRepoRootLayerResponder({ meta });
 */

import { callerRepoRootResolveBroker } from '../../../brokers/caller-repo-root/resolve/caller-repo-root-resolve-broker';
import { callerCwdScanCursorState } from '../../../state/caller-cwd-scan-cursor/caller-cwd-scan-cursor-state';
import type { RepoRootCwd } from '@dungeonmaster/shared/contracts';
import type { CallerRepoRootSource } from '../../../contracts/caller-repo-root-source/caller-repo-root-source-contract';

export const ResolveCallerRepoRootLayerResponder = async ({
  meta,
}: {
  meta: Record<string, unknown> | undefined;
}): Promise<{ repoRoot: RepoRootCwd; source: CallerRepoRootSource; configFound: boolean }> => {
  const cachedEntries = callerCwdScanCursorState.getAll();
  const { repoRoot, source, configFound, cursorUpdates } = await callerRepoRootResolveBroker({
    meta,
    cachedEntries,
  });

  for (const cursor of cursorUpdates) {
    callerCwdScanCursorState.set({ cursor });
  }

  return { repoRoot, source, configFound };
};
