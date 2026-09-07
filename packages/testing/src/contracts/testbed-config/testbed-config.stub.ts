import type { StubArgument } from '@dungeonmaster/shared/@types';
import { testbedConfigContract } from './testbed-config-contract';
import type { TestbedConfig } from './testbed-config-contract';

export const TestbedConfigStub = ({ ...props }: StubArgument<TestbedConfig> = {}): TestbedConfig =>
  testbedConfigContract.parse({
    questFolder: 'dungeonmaster',
    wardCommands: {},
    ...props,
  });
