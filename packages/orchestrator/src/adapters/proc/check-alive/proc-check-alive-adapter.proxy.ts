import { kill } from 'node:process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const procCheckAliveAdapterProxy = (): {
  setupAlive: () => void;
  setupDead: () => void;
  setupPermissionDenied: () => void;
  setupUnknownError: (params: { error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: kill });

  // Default: process is alive (kill(0) returns undefined without throwing).
  mock.mockImplementation(() => true);

  return {
    setupAlive: (): void => {
      mock.mockImplementation(() => true);
    },
    setupDead: (): void => {
      mock.mockImplementation(() => {
        const error = new Error('kill ESRCH') as NodeJS.ErrnoException;
        error.code = 'ESRCH';
        throw error;
      });
    },
    setupPermissionDenied: (): void => {
      mock.mockImplementation(() => {
        const error = new Error('kill EPERM') as NodeJS.ErrnoException;
        error.code = 'EPERM';
        throw error;
      });
    },
    setupUnknownError: ({ error }: { error: Error }): void => {
      mock.mockImplementation(() => {
        throw error;
      });
    },
  };
};
