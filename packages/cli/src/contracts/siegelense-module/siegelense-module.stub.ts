import type { StubArgument } from '@dungeonmaster/shared/@types';
import { AdapterResultStub } from '@dungeonmaster/shared/contracts';
import { siegelenseModuleContract } from './siegelense-module-contract';
import type { SiegelenseModule } from './siegelense-module-contract';

export const SiegelenseModuleStub = ({
  ...props
}: StubArgument<SiegelenseModule> = {}): SiegelenseModule =>
  siegelenseModuleContract.parse({
    StartSiegelense: async () => Promise.resolve(AdapterResultStub()),
    ...props,
  });
