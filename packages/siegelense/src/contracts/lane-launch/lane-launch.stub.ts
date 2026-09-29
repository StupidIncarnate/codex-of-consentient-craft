import type { StubArgument } from '@dungeonmaster/shared/@types';

import { laneLaunchContract } from './lane-launch-contract';
import type { LaneLaunch } from './lane-launch-contract';

export const LaneLaunchStub = ({ ...props }: StubArgument<LaneLaunch> = {}): LaneLaunch =>
  laneLaunchContract.parse({
    name: 'api',
    command: 'npm',
    args: ['run', 'dev:no-watch'],
    env: {},
    logPath:
      '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21/api-server.log',
    fd: 10,
    readyUrl: 'http://dungeonmaster.localhost:34172/api/guilds',
    ...props,
  });
