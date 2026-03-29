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
  mock.mockReturnValue(mockChild as never);

  return {
    getKillFn: (): jest.Mock => mockKill,
  };
};
