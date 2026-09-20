import type { StubArgument } from '@dungeonmaster/shared/@types';

import { laneProcessContract } from './lane-process-contract';
import type { LaneProcess } from './lane-process-contract';

export const LaneProcessStub = ({ ...props }: StubArgument<LaneProcess> = {}): LaneProcess =>
  laneProcessContract.parse({
    name: 'api',
    command: 'npm',
    args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
    portRole: 'api',
    readyPath: '/api/guilds',
    logFileName: 'api-server.log',
    env: { DUNGEONMASTER_PORT: '{apiPort}' },
    ...props,
  });
