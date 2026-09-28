import type { StubArgument } from '@dungeonmaster/shared/@types';
import { siegelenseLaneProvisionModuleContract } from './siegelense-lane-provision-module-contract';
import type { SiegelenseLaneProvisionModule } from './siegelense-lane-provision-module-contract';

export const SiegelenseLaneProvisionModuleStub = ({
  ...props
}: StubArgument<SiegelenseLaneProvisionModule> = {}): SiegelenseLaneProvisionModule =>
  siegelenseLaneProvisionModuleContract.parse({
    capacityReadBroker: async () => Promise.resolve({ suggested: 1 }),
    instanceStartBroker: async () => Promise.resolve({}),
    ...props,
  });
