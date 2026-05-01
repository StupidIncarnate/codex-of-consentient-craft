import type { StubArgument } from '@dungeonmaster/shared/@types';

import { packageJsonContract } from './package-json-contract';
import type { PackageJson } from './package-json-contract';

export const PackageJsonStub = ({ ...props }: StubArgument<PackageJson> = {}): PackageJson =>
  packageJsonContract.parse({ ...props });
