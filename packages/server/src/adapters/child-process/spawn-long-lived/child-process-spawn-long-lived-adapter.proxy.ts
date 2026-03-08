import { spawn } from 'child_process';

jest.mock('child_process');

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

  jest.mocked(spawn).mockReturnValue(mockChild as never);

  return {
    getKillFn: (): jest.Mock => mockKill,
  };
};
