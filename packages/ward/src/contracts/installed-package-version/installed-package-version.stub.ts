import { installedPackageVersionContract } from './installed-package-version-contract';
import type { InstalledPackageVersion } from './installed-package-version-contract';

export const InstalledPackageVersionStub = (
  { value }: { value: string } = { value: '8.3.18' },
): InstalledPackageVersion => installedPackageVersionContract.parse(value);
