import { moduleRequireFreshAdapter } from './module-require-fresh-adapter';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const moduleRequireFreshAdapterProxy = (): {
  returns: ({ filePath, value }: { filePath: FilePath; value: unknown }) => void;
} => {
  const mock = registerMock({ fn: moduleRequireFreshAdapter });

  return {
    returns: ({ filePath, value }: { filePath: FilePath; value: unknown }): void => {
      mock.calledWith([{ filePath }]).returns(value);
    },
  };
};
