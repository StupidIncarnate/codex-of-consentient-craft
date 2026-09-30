import type { StubArgument } from '@dungeonmaster/shared/@types';
import { testbedMcpConfigContract } from './testbed-mcp-config-contract';
import type { TestbedMcpConfig } from './testbed-mcp-config-contract';

export const TestbedMcpConfigStub = ({
  ...props
}: StubArgument<TestbedMcpConfig> = {}): TestbedMcpConfig =>
  testbedMcpConfigContract.parse({ ...props });
