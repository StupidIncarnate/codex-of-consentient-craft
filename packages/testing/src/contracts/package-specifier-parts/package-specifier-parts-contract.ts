/**
 * PURPOSE: The package name and subpath halves of an import specifier ('@dungeonmaster/bin/testing'
 * splits into '@dungeonmaster/bin' + 'testing') — what packageSpecifierSplitTransformer returns and
 * workspacePackageImportResolveMiddleware matches against a workspace sibling's own package.json.
 *
 * USAGE:
 * packageSpecifierPartsContract.parse({ packageName: '@dungeonmaster/bin', subpath: 'testing' });
 */

import { z } from 'zod';

export const packageSpecifierPartsContract = z.object({
  packageName: z.string().brand<'WorkspacePackageName'>(),
  subpath: z.string().brand<'WorkspacePackageSubpath'>(),
});

export type PackageSpecifierParts = z.infer<typeof packageSpecifierPartsContract>;
