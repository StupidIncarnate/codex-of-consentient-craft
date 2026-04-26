import type { StubArgument } from '@dungeonmaster/shared/@types';
import { packageJsonContract, type PackageJson } from './package-json-contract';

export const PackageJsonStub = ({ ...props }: StubArgument<PackageJson> = {}): PackageJson =>
  packageJsonContract.parse({
    name: 'example-package',
    workspaces: ['packages/*'],
    ...props,
  });
