import { duplicateInstallPackageNameContract } from './duplicate-install-package-name-contract';
import type { DuplicateInstallPackageName } from './duplicate-install-package-name-contract';

export const DuplicateInstallPackageNameStub = (
  { value }: { value: string } = { value: '@mantine/core' },
): DuplicateInstallPackageName => duplicateInstallPackageNameContract.parse(value);
