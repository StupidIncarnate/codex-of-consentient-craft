import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { readFileBytesProxy } from '#gateway/node/fs__promises/read-file-bytes/read-file-bytes.proxy';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsReadFileBytesAdapterProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; bytes: Uint8Array }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const childProxy = readFileBytesProxy();
  // The gateway's own child proxy (above) dropped its raw, any-Error-accepting `rejects` in favor
  // of named, recorded-failure scenarios (G19) — this adapter's own `throws({error})` still takes
  // a caller-supplied Error, so it stages the SAME underlying `readFile` mock directly rather than
  // through the child proxy. A02/A11 owns narrowing this adapter's own interface to named scenarios.
  const handle = registerMock({ fn: readFile });

  return {
    returns: ({ filePath, bytes }: { filePath: AbsoluteFilePath; bytes: Uint8Array }): void => {
      childProxy.returns({ path: filePath, bytes });
    },
    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      handle.calledWith([filePath]).rejects(error);
    },
  };
};
