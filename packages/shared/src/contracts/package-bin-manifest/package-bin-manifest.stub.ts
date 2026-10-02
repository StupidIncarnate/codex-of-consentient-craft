import type { StubArgument } from '../../@types/stub-argument.type';

import { packageBinManifestContract } from './package-bin-manifest-contract';
import type { PackageBinManifest } from './package-bin-manifest-contract';

export const PackageBinManifestStub = ({
  ...props
}: StubArgument<PackageBinManifest> = {}): PackageBinManifest =>
  packageBinManifestContract.parse({
    bin: { 'dungeonmaster-ward': './dist/bin/ward-entry.js' },
    ...props,
  });
