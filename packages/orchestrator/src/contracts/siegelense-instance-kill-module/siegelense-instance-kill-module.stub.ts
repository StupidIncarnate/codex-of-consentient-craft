import type { StubArgument } from '@dungeonmaster/shared/@types';
import { siegelenseInstanceKillModuleContract } from './siegelense-instance-kill-module-contract';
import type { SiegelenseInstanceKillModule } from './siegelense-instance-kill-module-contract';

export const SiegelenseInstanceKillModuleStub = ({
  ...props
}: StubArgument<SiegelenseInstanceKillModule> = {}): SiegelenseInstanceKillModule =>
  siegelenseInstanceKillModuleContract.parse({
    instanceKillBroker: async () => Promise.resolve({ stopped: true }),
    ...props,
  });
