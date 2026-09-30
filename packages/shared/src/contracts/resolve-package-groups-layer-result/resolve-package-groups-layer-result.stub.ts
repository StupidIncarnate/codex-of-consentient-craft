/**
 * PURPOSE: Builds a valid ResolvePackageGroupsLayerResult for tests
 *
 * USAGE:
 * ResolvePackageGroupsLayerResultStub();
 * // Returns a valid ResolvePackageGroupsLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resolvePackageGroupsLayerResultContract } from './resolve-package-groups-layer-result-contract';
import type { ResolvePackageGroupsLayerResult } from './resolve-package-groups-layer-result-contract';

export const ResolvePackageGroupsLayerResultStub = ({
  ...props
}: StubArgument<ResolvePackageGroupsLayerResult> = {}): ResolvePackageGroupsLayerResult =>
  resolvePackageGroupsLayerResultContract.parse({
    httpBackendRoots: [],
    frontendRoots: [],
    ...props,
  });
