import { exec } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const childProcessExecAdapterProxy = (): {
  getExecCalls: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: exec });
  handle.mockImplementation((() => undefined) as never);

  return {
    getExecCalls: (): readonly unknown[] => handle.mock.calls.map((call) => call[0]),
  };
};
