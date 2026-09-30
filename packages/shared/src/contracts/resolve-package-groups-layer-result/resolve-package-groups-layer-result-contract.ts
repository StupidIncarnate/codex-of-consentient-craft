/**
 * PURPOSE: Defines the data `resolvePackageGroupsLayerBroker` returns
 *
 * USAGE:
 * resolvePackageGroupsLayerResultContract.parse(value);
 * // Returns validated ResolvePackageGroupsLayerResult
 */
import { z } from '#gateway/npm/zod';

export const resolvePackageGroupsLayerResultContract = z
  .object({
    httpBackendRoots: z.array(
      z.string().brand<'ResolvePackageGroupsLayerResultHttpBackendRoots'>(),
    ),
    frontendRoots: z.array(z.string().brand<'ResolvePackageGroupsLayerResultFrontendRoots'>()),
  })
  .brand<'ResolvePackageGroupsLayerResult'>();

export type ResolvePackageGroupsLayerResult = z.infer<
  typeof resolvePackageGroupsLayerResultContract
>;
