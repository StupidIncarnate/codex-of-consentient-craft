/**
 * PURPOSE: Layer of ArchitectureHandleResponder — the only place in this responder that resolves
 * the project root, so discover/get-project-map/get-project-inventory share one call site instead
 * of each reaching into callerRepoRootResolveBroker directly.
 *
 * USAGE:
 * const { repoRoot, source, configFound } = await ResolveCallerRepoRootLayerResponder({ meta });
 */

import { callerRepoRootResolveBroker } from '../../../brokers/caller-repo-root/resolve/caller-repo-root-resolve-broker';
import type { CallerRepoRootSource } from '../../../contracts/caller-repo-root-source/caller-repo-root-source-contract';

export const ResolveCallerRepoRootLayerResponder = async ({
  meta,
}: {
  meta: Record<string, unknown> | undefined;
}): Promise<{ repoRoot: string; source: CallerRepoRootSource; configFound: boolean }> =>
  callerRepoRootResolveBroker({ meta });
