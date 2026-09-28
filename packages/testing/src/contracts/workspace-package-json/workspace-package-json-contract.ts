/**
 * PURPOSE: Validates a package.json this repo's own `packages/*` walk reads off disk — either the
 * workspaces ROOT (its `workspaces` field marks it as such) or one sibling workspace package (its
 * `name` + `exports` map, and optionally its own `imports` map). importPathResolverMiddleware uses
 * the `exports` shape to resolve a cross-package subpath import (`@dungeonmaster/bin/testing`) back
 * to the exporting package's `source` file, the same way Node's own `exports` condition would —
 * without that package needing a build first. packageImportsSpecifierResolveMiddleware reads the
 * IMPORTING package's own `imports` map the same way, to resolve a `#`-specifier
 * (`#gateway/npm/glob/glob/glob.proxy`) to its target before that target is itself resolved through
 * `exports`. An `imports` map entry is either a bare target specifier or a conditions object — Node's own
 * `imports` field allows both shapes, same as `exports`.
 *
 * USAGE:
 * workspacePackageJsonContract.safeParse({ name: 'dungeonmaster', workspaces: ['packages/*'] });
 * workspacePackageJsonContract.safeParse({
 *   name: '@dungeonmaster/bin',
 *   exports: { './testing': { source: './testing.ts' } },
 * });
 * workspacePackageJsonContract.safeParse({
 *   name: '@dungeonmaster/mcp',
 *   imports: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
 * });
 * // All return { success: true, data: {...} }
 */

import { z } from 'zod';
import { workspacePackageExportSourcePathContract } from '../workspace-package-export-source-path/workspace-package-export-source-path-contract';
import { importPathContract } from '../import-path/import-path-contract';

// Keys stay unbranded: they are structural export-map path segments ('./testing', './*'), matched
// and indexed by plain-string subpaths rather than exchanged as a domain value.
const workspacePackageExportEntryContract = z
  .object({
    source: workspacePackageExportSourcePathContract.optional(),
  })
  .loose();

// Node's own `exports` map allows a bare string value too (`"./jest-config-base": "./jest-config-base.js"`,
// this repo's own `@dungeonmaster/testing` package.json) — every condition resolves to that one path,
// no conditions object at all. A `z.record` fails its WHOLE parse on one entry that does not match,
// so without this union `workspacePackageJsonReadMiddleware` returns null for a real, valid
// package.json, and `nearestPackageJsonFindMiddleware` climbs straight past it looking for another.
const workspacePackageExportValueContract = z.union([
  workspacePackageExportSourcePathContract,
  workspacePackageExportEntryContract,
]);

// An `imports` map value's target is itself an import specifier ('@dungeonmaster/npm/*'), so it
// reuses `ImportPath` rather than the file-path-shaped `WorkspacePackageExportSourcePath` — unlike
// an `exports` entry's `source`, this string is fed straight back into
// workspacePackageImportResolveMiddleware as another specifier to resolve, not joined onto a
// package directory as a relative file path.
const workspacePackageImportConditionsContract = z
  .object({
    source: importPathContract.optional(),
    import: importPathContract.optional(),
    require: importPathContract.optional(),
    default: importPathContract.optional(),
  })
  .loose();

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
      .record(z.string().brand<'WorkspacePackageExportKey'>(), workspacePackageExportValueContract)
      .optional(),
    imports: z
      .record(
        z.string().brand<'WorkspacePackageImportKey'>(),
        z.union([importPathContract, workspacePackageImportConditionsContract]),
      )
      .optional(),
  })
  .loose();

export type WorkspacePackageJson = z.infer<typeof workspacePackageJsonContract>;
