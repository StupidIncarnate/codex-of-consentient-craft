import { spawn } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const childProcessSpawnLongLivedAdapterProxy = (): {
  getKillFn: () => jest.Mock;
} => {
  const mockKill = jest.fn();
  const mockChild = {
    killed: false,
    kill: mockKill,
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn(),
  };

  const mock = registerMock({ fn: spawn });
  // The only long-lived process this package spawns is the design scaffold's `npx vite` dev
  // server (see designStartBroker) — the adapter's own test exercises the same command.
  mock.calledWith(['npx']).returns(mockChild as never);

  return {
    getKillFn: (): jest.Mock => mockKill,
  };
};
