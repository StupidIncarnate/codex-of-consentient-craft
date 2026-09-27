import type { StubArgument } from '../../@types/stub-argument.type';

import { packageJsonContract } from './package-json-contract';
import type { PackageJson } from './package-json-contract';

export const PackageJsonStub = ({ ...props }: StubArgument<PackageJson> = {}): PackageJson =>
  packageJsonContract.parse({ ...props });
