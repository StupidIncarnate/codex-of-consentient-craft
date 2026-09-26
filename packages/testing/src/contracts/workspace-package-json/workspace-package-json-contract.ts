/**
 * PURPOSE: Validates a package.json this repo's own `packages/*` walk reads off disk — either the
 * workspaces ROOT (its `workspaces` field marks it as such) or one sibling workspace package (its
 * `name` + `exports` map). importPathResolverMiddleware uses both shapes to resolve a cross-package
 * subpath import (`@dungeonmaster/bin/testing`) back to the exporting package's `source` file, the
 * same way Node's own `exports` condition would — without that package needing a build first.
 *
 * USAGE:
 * workspacePackageJsonContract.safeParse({ name: 'dungeonmaster', workspaces: ['packages/*'] });
 * workspacePackageJsonContract.safeParse({
 *   name: '@dungeonmaster/bin',
 *   exports: { './testing': { source: './src/testing/index.ts' } },
 * });
 * // Both return { success: true, data: {...} }
 */

import { z } from 'zod';
import { workspacePackageExportSourcePathContract } from '../workspace-package-export-source-path/workspace-package-export-source-path-contract';

// Keys stay unbranded: they are structural export-map path segments ('./testing', './*'), matched
// and indexed by plain-string subpaths rather than exchanged as a domain value.
const workspacePackageExportEntryContract = z
  .object({
    source: workspacePackageExportSourcePathContract.optional(),
  })
  .passthrough();

export const workspacePackageJsonContract = z
  .object({
    name: z.string().brand<'WorkspacePackageName'>().optional(),
    workspaces: z
      .union([
        z.array(z.string().brand<'WorkspaceGlob'>()),
        z.record(z.string().brand<'WorkspaceGlob'>(), z.unknown()),
      ])
      .optional(),
    exports: z
      .record(z.string().brand<'WorkspacePackageExportKey'>(), workspacePackageExportEntryContract)
      .optional(),
  })
  .passthrough();

export type WorkspacePackageJson = z.infer<typeof workspacePackageJsonContract>;
