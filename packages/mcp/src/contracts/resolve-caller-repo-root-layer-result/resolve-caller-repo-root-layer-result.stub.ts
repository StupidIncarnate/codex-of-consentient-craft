/**
 * PURPOSE: Builds a valid ResolveCallerRepoRootLayerResult for tests
 *
 * USAGE:
 * ResolveCallerRepoRootLayerResultStub();
 * // Returns a valid ResolveCallerRepoRootLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { CallerRepoRootSourceStub } from '../caller-repo-root-source/caller-repo-root-source.stub';

import { resolveCallerRepoRootLayerResultContract } from './resolve-caller-repo-root-layer-result-contract';
import type { ResolveCallerRepoRootLayerResult } from './resolve-caller-repo-root-layer-result-contract';

export const ResolveCallerRepoRootLayerResultStub = ({
  ...props
}: StubArgument<ResolveCallerRepoRootLayerResult> = {}): ResolveCallerRepoRootLayerResult =>
  resolveCallerRepoRootLayerResultContract.parse({
    repoRoot: 'sample',
    source: CallerRepoRootSourceStub({ value: 'caller-cwd' }),
    configFound: false,
    ...props,
  });
