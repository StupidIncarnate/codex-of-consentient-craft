import { unlinkSync } from 'fs';
import { registerMock } from '../../../register-mock';

export const fsUnlinkAdapterProxy = (): {
  throws: ({ error }: { filePath: string; error: Error }) => void;
} => {
  const mock = registerMock({ fn: unlinkSync });

  mock.mockImplementation(() => undefined);

  return {
    throws: ({ error }: { filePath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
