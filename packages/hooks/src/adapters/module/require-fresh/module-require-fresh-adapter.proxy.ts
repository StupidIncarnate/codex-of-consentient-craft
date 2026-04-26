import { moduleRequireFreshAdapter } from './module-require-fresh-adapter';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const moduleRequireFreshAdapterProxy = (): {
  returns: ({ value }: { value: unknown }) => void;
} => {
  const mock = registerMock({ fn: moduleRequireFreshAdapter });

  mock.mockReturnValue(undefined);

  return {
    returns: ({ value }: { value: unknown }) => {
      mock.mockReturnValueOnce(value);
    },
  };
};
