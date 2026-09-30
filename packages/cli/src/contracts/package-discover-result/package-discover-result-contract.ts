/**
 * PURPOSE: Defines the data `packageDiscoverBroker` returns
 *
 * USAGE:
 * packageDiscoverResultContract.parse(value);
 * // Returns validated PackageDiscoverResult
 */
import { z } from '#gateway/npm/zod';

export const packageDiscoverResultContract = z.array(
  z
    .object({
      packageName: z.string().brand<'PackageDiscoverResultPackageName'>(),
      installPath: z.string().brand<'PackageDiscoverResultInstallPath'>(),
      finalizeInstallPath: z
        .string()
        .brand<'PackageDiscoverResultFinalizeInstallPath'>()
        .nullable(),
    })
    .brand<'PackageDiscoverResult'>(),
);

export type PackageDiscoverResult = z.infer<typeof packageDiscoverResultContract>;
