import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const fsReadFileSyncAdapterProxy = (): {
  returns: ({ content }: { content: ContentText }) => void;
  throws: ({ error }: { error: Error }) => void;
  implementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const handle = registerMock({ fn: readFileSync });

  handle.mockReturnValue('' as never);

  return {
    returns: ({ content }: { content: ContentText }): void => {
      handle.mockReturnValueOnce(content as never);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockImplementationOnce(() => {
        throw error;
      });
    },
    implementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      handle.mockImplementation(fn as never);
    },
  };
};
