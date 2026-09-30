/**
 * PURPOSE: Defines the data `bundleBuildBroker` returns
 *
 * USAGE:
 * bundleBuildResultContract.parse(value);
 * // Returns validated BundleBuildResult
 */
import { z } from '#gateway/npm/zod';

export const bundleBuildResultContract = z
  .object({
    bundleDir: z.string().brand<'BundleBuildResultBundleDir'>().nullable(),
    error: z.string().brand<'BundleBuildResultError'>().nullable(),
  })
  .brand<'BundleBuildResult'>();

export type BundleBuildResult = z.infer<typeof bundleBuildResultContract>;
