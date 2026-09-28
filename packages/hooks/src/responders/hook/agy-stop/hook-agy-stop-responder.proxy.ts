import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const HookAgyStopResponderProxy = (): {
  setupTranscript: (params: { filePath: FilePath; contents: string }) => void;
  setupReadError: (params: { filePath: FilePath }) => void;
} => {
  const readProxy = readFileProxy();

  return {
    setupTranscript: ({ filePath, contents }: { filePath: FilePath; contents: string }): void => {
      readProxy.returns({ path: filePath, contents });
    },
    setupReadError: ({ filePath }: { filePath: FilePath }): void => {
      readProxy.throwsMatchingPath({
        path: filePath,
        error: Object.assign(new Error('read failed'), { code: 'EACCES' }),
      });
    },
  };
};
