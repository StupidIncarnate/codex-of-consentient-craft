/**
 * PURPOSE: Defines the data `discoverPackagesLayerBroker` returns
 *
 * USAGE:
 * discoverPackagesLayerResultContract.parse(value);
 * // Returns validated DiscoverPackagesLayerResult
 */
import { z } from '#gateway/npm/zod';

export const discoverPackagesLayerResultContract = z.array(
  z
    .object({
      name: z.string().brand<'DiscoverPackagesLayerResultName'>(),
      relativeDir: z.string().brand<'DiscoverPackagesLayerResultRelativeDir'>(),
    })
    .brand<'DiscoverPackagesLayerResult'>(),
);

export type DiscoverPackagesLayerResult = z.infer<typeof discoverPackagesLayerResultContract>;
