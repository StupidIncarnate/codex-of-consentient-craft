import { packageNameContract, type PackageName } from './package-name-contract';

export const PackageNameStub = ({ value }: { value: unknown }): PackageName =>
  packageNameContract.parse(value);
