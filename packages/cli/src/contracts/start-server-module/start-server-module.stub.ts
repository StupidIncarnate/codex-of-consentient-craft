import type { StubArgument } from '@dungeonmaster/shared/@types';
import { startServerModuleContract } from './start-server-module-contract';
import type { StartServerModule } from './start-server-module-contract';

export const StartServerModuleStub = ({
  ...props
}: StubArgument<StartServerModule> = {}): StartServerModule =>
  startServerModuleContract.parse({
    StartServer: () => undefined,
    ...props,
  });
