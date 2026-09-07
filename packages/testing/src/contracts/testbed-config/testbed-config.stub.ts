import type { StubArgument } from '@dungeonmaster/shared/@types';
import { dungeonmasterConfigContract } from './dungeonmaster-config-contract';
import type { DungeonmasterConfig } from './dungeonmaster-config-contract';

export const DungeonmasterConfigStub = ({
  ...props
}: StubArgument<DungeonmasterConfig> = {}): DungeonmasterConfig =>
  dungeonmasterConfigContract.parse({
    questFolder: 'dungeonmaster',
    wardCommands: {},
    ...props,
  });
