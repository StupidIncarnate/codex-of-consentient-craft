import { minimatch } from 'minimatch';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const minimatchMatchAdapterProxy = (): {
  returns: (args: { filePath: string; pattern: string; result: boolean }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = registerMock({ fn: minimatch });

  return {
    returns: ({
      filePath,
      pattern,
      result,
    }: {
      filePath: string;
      pattern: string;
      result: boolean;
    }): void => {
      mock.calledWith([filePath, pattern]).returns(result);
    },
  };
};
