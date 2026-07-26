import { join } from 'path';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const pathJoinAdapterProxy = (): {
  returns: ({ paths, result }: { paths: string[]; result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = registerMock({ fn: join });

  return {
    // Semantic method for setting return value, keyed on the exact segments joined
    returns: ({ paths, result }: { paths: string[]; result: FilePath }): void => {
      mock.calledWith([...paths]).returns(result);
    },
  };
};
