import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsReadJsonlAdapterProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; content: string }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  throwsOnce: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: readFile });

  return {
    returns: ({ filePath, content }: { filePath: AbsoluteFilePath; content: string }): void => {
      mock.calledWith([filePath]).resolves(content);
    },
    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
    // Same address as a sticky `calledWith`/`returns` staged for the same path — the one-shot
    // wins on the first call only, so a retry test can exercise "fails once, then succeeds"
    // instead of the sticky staging masking the first call's result.
    throwsOnce: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.onceFor([filePath]).rejects(error);
    },
  };
};
