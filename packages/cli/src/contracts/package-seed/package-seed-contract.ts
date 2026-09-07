/**
 * PURPOSE: Describes one packageTypeContract value's seed — the per-type files and config bundled
 * on top of packageScaffoldConfigStatics' shared config, so the three seed statics tables (plain,
 * service, frontend) can be shape-checked with `satisfies` where they are written. Reach for this
 * one instead of scaffoldFileContract for the `files` entries here: a ScaffoldFile names the path a
 * transformer is about to WRITE, while a seed file's path and contents still carry __NAME__ /
 * __CAMEL__ / __PASCAL__ / __TESTID__ placeholders the transformer has not substituted yet.
 *
 * USAGE:
 * const seed = packageSeedContract.parse({
 *   barrel: { fileName: 'statics.ts', exportPaths: ['./src/statics/__NAME__/__NAME__-statics'] },
 *   dependencies: {}, bin: {}, compilerOptions: {}, extraInclude: [], buildRootDir: null,
 *   jestKind: 'node', e2eEligible: false, exportsDot: false,
 *   files: [{ path: 'src/statics/__NAME__/__NAME__-statics.ts', contents: '...' }],
 * });
 * // Returns validated PackageSeed
 */

import { z } from 'zod';

import { pathSegmentContract, fileContentsContract } from '@dungeonmaster/shared/contracts';

import { dependencyMapContract } from '../dependency-map/dependency-map-contract';

export const packageSeedContract = z.object({
  barrel: z
    .object({
      fileName: pathSegmentContract,
      exportPaths: z.array(pathSegmentContract),
    })
    .nullable(),
  dependencies: dependencyMapContract,
  bin: dependencyMapContract,
  compilerOptions: z.record(z.string().brand<'CompilerOptionKey'>(), z.unknown()),
  extraInclude: z.array(pathSegmentContract),
  buildRootDir: pathSegmentContract.nullable(),
  jestKind: z.enum(['node', 'tsx-node', 'tsx-jsdom']),
  e2eEligible: z.boolean(),
  exportsDot: z.boolean(),
  files: z.array(
    z.object({
      path: pathSegmentContract,
      contents: fileContentsContract,
    }),
  ),
});

export type PackageSeed = z.infer<typeof packageSeedContract>;
