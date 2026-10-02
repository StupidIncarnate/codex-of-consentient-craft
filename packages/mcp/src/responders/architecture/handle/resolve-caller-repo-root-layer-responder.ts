/**
 * PURPOSE: Layer of ArchitectureHandleResponder — the only place in this responder that resolves
 * the project root, so discover/get-project-map/get-project-inventory share one call site instead
 * of each reaching into callerRepoRootResolveBroker directly.
 *
 * USAGE:
 * const { repoRoot, source, configFound } = await ResolveCallerRepoRootLayerResponder({ meta });
 */

import { resolveCallerRepoRootLayerResultContract } from '../../../contracts/resolve-caller-repo-root-layer-result/resolve-caller-repo-root-layer-result-contract';
import type { ResolveCallerRepoRootLayerResult } from '../../../contracts/resolve-caller-repo-root-layer-result/resolve-caller-repo-root-layer-result-contract';
import { cwd } from '#gateway/node/process';
import { callerRepoRootResolveBroker } from '../../../brokers/caller-repo-root/resolve/caller-repo-root-resolve-broker';

export const ResolveCallerRepoRootLayerResponder = async ({
  meta,
}: {
  meta: Record<string, unknown> | undefined;
}): Promise<ResolveCallerRepoRootLayerResult> =>
  resolveCallerRepoRootLayerResultContract.parse(
    await callerRepoRootResolveBroker({ meta, serverCwd: cwd() }),
  );
