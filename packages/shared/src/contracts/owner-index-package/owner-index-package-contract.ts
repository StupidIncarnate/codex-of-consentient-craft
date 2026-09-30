/**
 * PURPOSE: A workspace package as the owner index sees it: its name, its directory and the
 * workspace packages it lists as dependencies. Reach for this over ContractIndexPackage when a
 * lookup must know which other packages' owners a file can import.
 *
 * USAGE:
 * ownerIndexPackageContract.parse({ name: '@repo/a', dir: '/repo/packages/a', dependencies: ['@repo/shared'] });
 * // Returns: OwnerIndexPackage validated object
 */

import { z } from '#gateway/npm/zod';


export const ownerIndexPackageContract = z.object({
  name: z.string().min(1).brand<'OwnerIndexPackageName'>(),
  dir: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'OwnerIndexPackageDir'>(),
  dependencies: z.array(z.string().min(1).brand<'OwnerIndexPackageDependencies'>()),
}).brand<'OwnerIndexPackage'>();

export type OwnerIndexPackage = z.infer<typeof ownerIndexPackageContract>;
