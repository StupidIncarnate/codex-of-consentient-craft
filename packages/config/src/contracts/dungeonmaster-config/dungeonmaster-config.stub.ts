import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  dungeonmasterConfigContract,
  type DungeonmasterConfig,
} from './dungeonmaster-config-contract';

export const DungeonmasterConfigStub = ({
  ...props
}: StubArgument<DungeonmasterConfig> = {}): DungeonmasterConfig =>
  dungeonmasterConfigContract.parse({
    framework: 'react',
    schema: 'zod',
    ...props,
  });
