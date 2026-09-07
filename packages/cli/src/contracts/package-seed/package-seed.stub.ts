/**
 * PURPOSE: Create stub PackageSeed instances for testing, defaulting to a minimal
 * `library`-shaped seed
 *
 * USAGE:
 * const seed = PackageSeedStub({ jestKind: 'tsx-jsdom' });
 * // Returns a valid PackageSeed instance
 */

import { packageSeedContract, type PackageSeed } from './package-seed-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const PackageSeedStub = ({ ...props }: StubArgument<PackageSeed> = {}): PackageSeed =>
  packageSeedContract.parse({
    barrel: { fileName: 'statics.ts', exportPaths: ['./src/statics/thing/thing-statics'] },
    dependencies: {},
    bin: {},
    compilerOptions: {},
    extraInclude: [],
    buildRootDir: null,
    jestKind: 'node',
    e2eEligible: false,
    exportsDot: false,
    files: [
      {
        path: 'src/statics/thing/thing-statics.ts',
        contents: 'export const thingStatics = {} as const;\n',
      },
    ],
    ...props,
  });
