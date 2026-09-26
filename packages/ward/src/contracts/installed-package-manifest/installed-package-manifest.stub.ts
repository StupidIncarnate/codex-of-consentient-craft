import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  installedPackageManifestContract,
  type InstalledPackageManifest,
} from './installed-package-manifest-contract';

export const InstalledPackageManifestStub = ({
  ...props
}: StubArgument<InstalledPackageManifest> = {}): InstalledPackageManifest =>
  installedPackageManifestContract.parse({
    version: '8.3.18',
    ...props,
  });
