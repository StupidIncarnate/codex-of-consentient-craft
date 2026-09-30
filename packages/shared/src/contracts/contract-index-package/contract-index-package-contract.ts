/**
 * PURPOSE: A workspace package as the contract index sees it: its npm name and the directory that
 * holds it. Reach for this over a bare path when the scan must attribute a contract file to its
 * package and resolve `@scope/name/subpath` imports back to files.
 *
 * USAGE:
 * contractIndexPackageContract.parse({ name: '@repo/shared', dir: '/repo/packages/shared' });
 * // Returns: ContractIndexPackage validated object
 */

import { z } from '#gateway/npm/zod';

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const contractIndexPackageContract = z.object({
  name: z.string().min(1).brand<'ContractIndexPackageName'>(),
  dir: absoluteFilePathContract,
}).brand<'ContractIndexPackage'>();

export type ContractIndexPackage = z.infer<typeof contractIndexPackageContract>;
