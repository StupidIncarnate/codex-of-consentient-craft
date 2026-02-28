jest.mock('child_process');

import { exec } from 'child_process';

export const childProcessExecAdapterProxy = (): {
  getExecCalls: () => readonly unknown[];
} => {
  const mock = jest.mocked(exec);
  mock.mockImplementation((() => undefined) as never);

  return {
    getExecCalls: (): readonly unknown[] => mock.mock.calls.map((call) => call[0]),
  };
};
