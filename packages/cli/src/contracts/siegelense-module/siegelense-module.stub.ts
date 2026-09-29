import type { StubArgument } from '@dungeonmaster/shared/@types';
import { siegelenseModuleContract } from './siegelense-module-contract';
import type { SiegelenseModule } from './siegelense-module-contract';

export const SiegelenseModuleStub = ({
  ...props
}: StubArgument<SiegelenseModule> = {}): SiegelenseModule =>
  siegelenseModuleContract.parse({
    StartSiegelense: async () => Promise.resolve(undefined),
    ...props,
  });
