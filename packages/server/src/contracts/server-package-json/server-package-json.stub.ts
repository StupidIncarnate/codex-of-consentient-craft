import type { StubArgument } from '@dungeonmaster/shared/@types';
import { serverPackageJsonContract } from './server-package-json-contract';
import type { ServerPackageJson } from './server-package-json-contract';

export const ServerPackageJsonStub = ({
  ...props
}: StubArgument<ServerPackageJson> = {}): ServerPackageJson =>
  serverPackageJsonContract.parse({
    version: '0.1.0',
    ...props,
  });
